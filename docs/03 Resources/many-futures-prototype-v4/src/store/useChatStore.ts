import { create } from 'zustand';

export interface ChatAttachment {
  id: string;
  text: string;
  preview: string; // Short preview (15-30 chars)
  timestamp: number;
  // Store the original selection range for highlighting
  range?: {
    startOffset: number;
    endOffset: number;
    containerPath?: string; // CSS selector to find the container
  };
}

interface ChatState {
  // Panel visibility
  isPanelOpen: boolean;
  isFloatingButtonVisible: boolean;
  
  // Text attachments from episode highlights
  attachments: ChatAttachment[];
  

  
  // Actions
  openPanel: () => void;
  closePanel: () => void;
  togglePanel: () => void;
  showFloatingButton: () => void;
  hideFloatingButton: () => void;
  addAttachment: (text: string) => void;
  removeAttachment: (id: string) => void;
  clearAttachments: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  // Initial state
  isPanelOpen: false,
  isFloatingButtonVisible: true,
  attachments: [],
  
  // Panel actions
  openPanel: () => set({ isPanelOpen: true, isFloatingButtonVisible: false }),
  closePanel: () => set({ isPanelOpen: false, isFloatingButtonVisible: true }),
  togglePanel: () => set((state) => ({ 
    isPanelOpen: !state.isPanelOpen,
    isFloatingButtonVisible: state.isPanelOpen // Show button when closing panel
  })),
  showFloatingButton: () => set({ isFloatingButtonVisible: true }),
  hideFloatingButton: () => set({ isFloatingButtonVisible: false }),
  
  // Attachment actions
  addAttachment: (text: string) => {
    const id = `attachment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const preview = text.length > 30 ? text.substring(0, 27) + '...' : text;
    
    set((state) => ({
      attachments: [
        ...state.attachments,
        {
          id,
          text,
          preview,
          timestamp: Date.now(),
        },
      ],
    }));
  },
  
  removeAttachment: (id: string) =>
    set((state) => ({
      attachments: state.attachments.filter((attachment) => attachment.id !== id),
    })),
  
  clearAttachments: () => set({ attachments: [] }),
}));

// Helper selectors for common use cases
export const useChatPanel = () => {
  const { isPanelOpen, openPanel, closePanel, togglePanel } = useChatStore();
  return { isPanelOpen, openPanel, closePanel, togglePanel };
};

export const useChatAttachments = () => {
  const { attachments, addAttachment, removeAttachment, clearAttachments } = useChatStore();
  return { attachments, addAttachment, removeAttachment, clearAttachments };
};