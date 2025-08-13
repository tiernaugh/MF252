import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { usePlanningNotesStore } from '@/store/usePlanningNotesStore';

// Footer variant: suggested inserts + optional free text

interface EpisodeFooterSignalProps {
  directions: string[];
  title?: string;
  prompt?: string;
  onFocusChange?: (focused: boolean) => void;
  projectId?: string;
  episodeId?: string;
}

export function EpisodeFooterSignal({ directions, title = 'Guide the next episode', prompt = 'Add a short note. We’ll use it when planning the next episode.', onFocusChange, projectId, episodeId }: EpisodeFooterSignalProps) {
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState<null | { note: string }>(null);
  const addPlanningNote = usePlanningNotesStore((s) => s.addNote);

  // MVP: no chat handoff

  // Build suggestions from directions
  const suggestions = useMemo(() => directions.map((d) => `Explore ${d.toLowerCase()} in more depth.`), [directions]);
  const [remaining, setRemaining] = useState<string[]>(suggestions);
  const [flash, setFlash] = useState(false);
  const insertSuggestion = useCallback((s: string) => {
    setNote((prev) => (prev.trim() ? `${prev.trim()} ${s}` : s));
    // Remove clicked suggestion for this session
    setRemaining((prev) => prev.filter((x) => x !== s));
    // Subtle focus/attention cue
    setFlash(true);
    window.setTimeout(() => setFlash(false), 250);
  }, []);

  // Listbox focus/selection state
  const [listActive, setListActive] = useState(false);
  const [activeIdx, setActiveIdx] = useState<number>(0);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const handleSubmit = useCallback(() => {
    const trimmed = note.trim();
    if (!trimmed) return;
    const payload = { note: trimmed };
    setSaved(payload);
    setNote('');
    if (projectId) {
      addPlanningNote({
        projectId,
        note: trimmed,
        scope: 'next_episode',
        status: 'pending',
        appliesToEpisodeId: episodeId,
      });
    }
  }, [note, projectId, episodeId, addPlanningNote]);

  // discussInChat intentionally omitted in MVP

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'enter') {
        e.preventDefault();
        handleSubmit();
      }
      if (e.key === 'Escape') setNote('');
      if (['1', '2', '3'].includes(e.key)) {
        const idx = Number(e.key) - 1;
        if (remaining[idx]) insertSuggestion(remaining[idx]);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [remaining, handleSubmit, insertSuggestion]);

  // Handlers for textarea → listbox navigation
  const onTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setListActive(true);
      setActiveIdx(0);
      requestAnimationFrame(() => listRef.current?.querySelector('button')?.focus());
    }
  };

  const onListKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!listActive) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => (remaining.length === 0 ? 0 : (i + 1) % remaining.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (activeIdx === 0) {
        setListActive(false);
        textareaRef.current?.focus();
      } else {
        setActiveIdx((i) => Math.max(0, i - 1));
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const s = remaining[activeIdx];
      if (s) {
        if (e.shiftKey) setNote(s);
        else insertSuggestion(s);
      }
      setListActive(false);
      requestAnimationFrame(() => textareaRef.current?.focus());
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setListActive(false);
      textareaRef.current?.focus();
    }
  };

  return (
    <section
      className="mt-8 p-6 bg-gray-50 rounded-lg border border-gray-200"
      onFocusCapture={() => onFocusChange?.(true)}
      onBlurCapture={(e) => {
        // Only fire when leaving the whole section
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          onFocusChange?.(false);
        }
      }}
    >
      {saved ? (
        <div className="rounded-lg border border-gray-200 bg-white p-4" aria-live="polite">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 h-5 w-5 rounded-full bg-green-100 text-green-700 flex items-center justify-center">
              <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"> 
                <path fillRule="evenodd" d="M16.707 6.293a1 1 0 010 1.414l-6.364 6.364a1 1 0 01-1.414 0L3.293 8.829a1 1 0 111.414-1.414l4.121 4.121 5.657-5.657a1 1 0 011.414 0z" clipRule="evenodd"/>
              </svg>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900">Saved for planning</div>
              <div className="text-xs text-gray-600 mt-0.5">We’ll use your note when planning the next episode.</div>
              {saved.note && (
                <div className="mt-3 text-sm text-gray-900 bg-gray-50 border border-gray-200 rounded-md px-3 py-2">{saved.note}</div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <>
          <h2 className="text-xl font-semibold text-gray-900 mb-1">{title}</h2>
          <p className="text-gray-700 mb-4">{prompt}</p>

          {/* Input */}
          <div className={cn("mt-2 p-3 bg-white rounded border border-gray-300 transition", flash && "ring-1 ring-indigo-300") }>
            <label htmlFor="footer-note" className="text-gray-600 text-sm mb-2 block">A short note (optional)</label>
            <textarea
              id="footer-note"
              className="w-full p-2 border border-gray-300 rounded text-sm"
              rows={3}
              maxLength={240}
              placeholder="What should we explore more (or less) next time?"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onKeyDown={onTextareaKeyDown}
              ref={textareaRef}
            />
          </div>

          {/* Suggested notes */}
          {remaining.length > 0 && (
            <div className="mt-3">
              <div className="text-xs text-gray-600 mb-1">Suggestions</div>
              <div
                aria-label="Suggested notes"
                ref={listRef}
                onKeyDown={onListKeyDown}
                className="space-y-2 focus:outline-none"
              >
                {remaining.map((s, i) => (
                  <button
                    type="button"
                    key={`${i}-${s}`}
                    className={cn(
                      'px-3 py-2 text-left w-full text-sm cursor-pointer select-none rounded-md border border-gray-200 bg-white',
                      listActive && activeIdx === i ? 'ring-1 ring-gray-300' : 'hover:bg-gray-50'
                    )}
                    onMouseEnter={() => {
                      setListActive(true);
                      setActiveIdx(i);
                    }}
                    onMouseLeave={() => setListActive(false)}
                    onClick={() => insertSuggestion(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              className="px-4 py-2 rounded-md bg-gray-900 text-white text-sm hover:bg-gray-800 cursor-pointer"
              onClick={handleSubmit}
            >
              Guide the next episode
            </button>
          </div>
        </>
      )}

      {/* Conversation stays in chat; no inline follow-ups */}
    </section>
  );
}


