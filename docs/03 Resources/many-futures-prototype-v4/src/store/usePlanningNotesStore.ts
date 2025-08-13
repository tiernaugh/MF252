import { create } from 'zustand'
/**
 * Planning Notes Store (Prototype)
 *
 * Purpose:
 * - Capture short-lived user guidance to steer the next episode only.
 * - Notes are scoped by project and automatically persisted to localStorage in the prototype.
 *
 * Production Intention:
 * - Move persistence to the backend with proper auth/org scoping.
 * - Auto-consume notes when the next episode assembles and archive them to avoid long-term memory pollution.
 */

export type PlanningNoteScope = 'next_episode' | 'general_feedback'
export type PlanningNoteStatus = 'pending' | 'consumed' | 'archived'

export interface PlanningNote {
  id: string
  projectId: string
  note: string
  scope: PlanningNoteScope
  status: PlanningNoteStatus
  createdAt: number
  appliesToEpisodeId?: string
  expiresAt?: number
}

interface PlanningNotesState {
  notes: PlanningNote[]
  addNote: (input: Omit<PlanningNote, 'id' | 'createdAt'> & { id?: string; createdAt?: number }) => PlanningNote
  archiveNote: (id: string) => void
  consumeNotesForProject: (projectId: string) => void
  clearAllForProject: (projectId: string) => void
  listPendingByProject: (projectId: string) => PlanningNote[]
}

const STORAGE_KEY = 'mf_planning_notes_v1'

function loadFromStorage(): PlanningNote[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed as PlanningNote[]
    return []
  } catch {
    return []
  }
}

function saveToStorage(notes: PlanningNote[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes))
  } catch {
    // ignore
  }
}

export const usePlanningNotesStore = create<PlanningNotesState>((set, get) => {
  // Hydrate from localStorage only in the browser; SSR-safe
  const initial = typeof window !== 'undefined' ? loadFromStorage() : []

  return {
    notes: initial,

    addNote: (input) => {
      // Generate stable id/createdAt if callers omit them (useful in tests)
      const note: PlanningNote = {
        id: input.id ?? `pn_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        createdAt: input.createdAt ?? Date.now(),
        ...input,
      }
      set((state) => {
        const next = [...state.notes, note]
        saveToStorage(next)
        return { notes: next }
      })
      return note
    },

    archiveNote: (id) => {
      set((state) => {
        const next = state.notes.map((n) => (n.id === id ? { ...n, status: 'archived' as PlanningNoteStatus } : n))
        saveToStorage(next)
        return { notes: next }
      })
    },

    // When the next episode assembles, mark current pending notes as consumed
    consumeNotesForProject: (projectId) => {
      set((state) => {
        const next = state.notes.map((n) =>
          n.projectId === projectId && n.status === 'pending' ? { ...n, status: 'consumed' as PlanningNoteStatus } : n,
        )
        saveToStorage(next)
        return { notes: next }
      })
    },

    clearAllForProject: (projectId) => {
      set((state) => {
        const next = state.notes.filter((n) => n.projectId !== projectId)
        saveToStorage(next)
        return { notes: next }
      })
    },

    // Selector utility for convenience; prefer deriving in components to avoid selector churn in React 18
    listPendingByProject: (projectId) => {
      const now = Date.now()
      return get()
        .notes.filter((n) => n.projectId === projectId && n.status === 'pending' && (!n.expiresAt || n.expiresAt > now))
        .sort((a, b) => b.createdAt - a.createdAt)
    },
  }
})


