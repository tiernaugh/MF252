import { create } from 'zustand';

export type ConversationState = 
  | 'opening'
  | 'exploring' 
  | 'converging'
  | 'brief_generated'
  | 'editing';

export interface Message {
  id: string;
  role: 'futura' | 'user';
  content: string;
  timestamp: Date;
}

export interface ProjectBrief {
  title: string;
  brief: string;
}

interface NewProjectStore {
  // State
  conversationState: ConversationState;
  messages: Message[];
  projectBrief: ProjectBrief | null;
  turnCount: number;
  
  // Actions
  addMessage: (role: 'futura' | 'user', content: string) => void;
  setConversationState: (state: ConversationState) => void;
  generateBrief: (title: string, brief: string) => void;
  updateBrief: (brief: ProjectBrief) => void;
  reset: () => void;
}

export const useNewProjectStore = create<NewProjectStore>((set) => ({
  // Initial state
  conversationState: 'opening',
  messages: [],
  projectBrief: null,
  turnCount: 0,
  
  // Actions
  addMessage: (role, content) => {
    const message: Message = {
      id: `msg-${Date.now()}`,
      role,
      content,
      timestamp: new Date(),
    };
    
    set((state) => ({
      messages: [...state.messages, message],
      turnCount: role === 'user' ? state.turnCount + 1 : state.turnCount,
    }));
  },
  
  setConversationState: (conversationState) => set({ conversationState }),
  
  generateBrief: (title, brief) => {
    set({
      projectBrief: { title, brief },
      conversationState: 'brief_generated',
    });
  },
  
  updateBrief: (projectBrief) => set({ projectBrief }),
  
  reset: () => set({
    conversationState: 'opening',
    messages: [],
    projectBrief: null,
    turnCount: 0,
  }),
}));