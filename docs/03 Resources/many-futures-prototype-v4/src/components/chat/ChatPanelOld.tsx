import { useChatStore } from '../../store/useChatStore';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Send, Sparkles } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export function ChatPanel() {
  const { 
    isPanelOpen, 
    closePanel, 
    attachments, 
    removeAttachment
  } = useChatStore();

  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Focus input when panel opens
  useEffect(() => {
    if (isPanelOpen) {
      // Small delay to ensure the panel animation has started
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isPanelOpen]);

  // ESC key handling to close panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isPanelOpen) {
        closePanel();
      }
    };

    if (isPanelOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isPanelOpen, closePanel]);

  const handleSendMessage = () => {
    if (inputValue.trim()) {
      // This is the old implementation - use ChatPanelNew for real chat
      console.log('Sending message:', inputValue);
      setInputValue('');
    }
  };

  if (!isPanelOpen) return null;

  return (
    <Dialog.Root open={isPanelOpen} onOpenChange={() => {}} modal={false}>
      <Dialog.Portal>
        <Dialog.Content
          className="fixed inset-y-0 right-0 z-50 w-[480px] bg-white border-l border-gray-200 flex flex-col h-full data-[state=open]:animate-slide-in-from-right data-[state=closed]:animate-slide-out-to-right"
          aria-describedby={undefined}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">Chat with Futura</h2>
                <p className="text-sm text-gray-500">Many Futures AI Assistant</p>
              </div>
            </div>
            <Dialog.Close asChild>
              <button 
                className="p-2 hover:bg-gray-100 rounded-lg transition-all hover:scale-105"
                aria-label="Close chat"
              >
                <X className="w-5 h-5 text-gray-500 hover:text-gray-700" />
              </button>
            </Dialog.Close>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto space-y-4 px-6 py-4">
            <div className="flex items-center justify-center h-full text-center">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-1">Legacy Chat Panel</h3>
                  <p className="text-sm text-gray-500">
                    This is the old implementation. Use ChatPanelNew for real chat functionality.
                  </p>
                </div>
              </div>
            </div>
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 p-4">
            {/* Attachments shown above input */}
            {attachments.length > 0 && (
              <div className="mb-3 space-y-2">
                {attachments.map((attachment) => (
                  <div 
                    key={attachment.id} 
                    className="group flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-2"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-indigo-700">Selected Text</p>
                      <p className="text-sm text-indigo-600 truncate">{attachment.preview}</p>
                    </div>
                    <button 
                      onClick={() => removeAttachment(attachment.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-indigo-100 rounded"
                    >
                      <X className="w-3 h-3 text-indigo-500" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask Futura about this episode..."
                className="flex-1 resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() && attachments.length === 0}
                className="p-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}