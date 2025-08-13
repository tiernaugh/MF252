export interface ChatAttachment {
  id: string;
  text: string;
  preview: string;
  timestamp: number;
}

export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: number;
  attachments?: ChatAttachment[]; // Associated context from episode
}

export interface HighlightRange {
  startOffset: number;
  endOffset: number;
  text: string;
  element?: Element;
}