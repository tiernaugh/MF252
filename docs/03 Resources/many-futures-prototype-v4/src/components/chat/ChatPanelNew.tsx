import { useEffect, useRef, useState } from 'react';
import { useChat } from '@ai-sdk/react';
// UIMessage type not imported to avoid strict coupling with SDK message generics in prototype
import { TextStreamChatTransport } from 'ai';
import { X, ArrowUp } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { 
  ChatContainerRoot, 
  ChatContainerContent 
} from '@/components/prompt-kit/chat-container';
import { DotsLoader } from '@/components/prompt-kit/loader';
import { 
  PromptInput, 
  PromptInputTextarea, 
  PromptInputActions 
} from '@/components/prompt-kit/prompt-input';
import { Message } from '@/components/prompt-kit/message';
import { Button } from '@/components/ui/button';
import { useChatStore } from '@/store/useChatStore';
import { cn } from '@/lib/utils';
import { MessageComponent } from './MessageComponent';

export const ChatPanelNew = () => {
  const { 
    isPanelOpen, 
    closePanel, 
    attachments, 
    removeAttachment,
    clearAttachments
  } = useChatStore();
  
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [input, setInput] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    sendMessage,
    status,
    error
  } = useChat({
    transport: new TextStreamChatTransport({
      api: '/api/chat',
    }),
    onError: (error) => {
      console.error('Chat error:', error);
    }
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // When panel opens, shift the main page scrollbar and also reserve the same width in header/nav containers
  useEffect(() => {
    const width = isPanelOpen ? 480 : 0;
    document.body.style.marginRight = width ? `${width}px` : '';
    const header = document.querySelector('nav');
    if (header) {
      (header as HTMLElement).style.right = width ? `${width}px` : '';
    }
    return () => {
      document.body.style.marginRight = '';
      if (header) (header as HTMLElement).style.right = '';
    };
  }, [isPanelOpen]);

  useEffect(() => {
    if (isPanelOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isPanelOpen]);

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

  const handleSubmitWithAttachments = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() && attachments.length === 0) return;

    // Correctly format the message with attachments in the `data` field
    const messageToSend: any = {
      role: 'user',
      content: input,
      data: {
        attachments: attachments.map(att => ({
          id: att.id,
          text: att.text,
          preview: att.preview,
        })),
      },
    };
    
    sendMessage(messageToSend);
    
    // Clear the input and attachments immediately for instant feedback
    setInput('');
    clearAttachments();
  };

  if (!isPanelOpen) return null;

  return (
    <Dialog.Root open={isPanelOpen} onOpenChange={() => {}} modal={false}>
      <Dialog.Portal>
        <Dialog.Content
          className={cn(
            "fixed inset-y-0 right-0 z-50 w-[480px] bg-white border-l border-gray-200",
            "flex flex-col h-full",
            "data-[state=open]:animate-slide-in-from-right",
            "data-[state=closed]:animate-slide-out-to-right"
          )}
          aria-describedby={undefined}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <span className="text-white font-medium text-sm">F</span>
              </div>
              <div>
                <Dialog.Title asChild>
                  <h2 className="font-semibold text-gray-900">Chat with Futura</h2>
                </Dialog.Title>
                <p className="text-sm text-gray-500">Many Futures AI Assistant</p>
              </div>
            </div>
            <Dialog.Close asChild>
              <button
                onClick={closePanel}
                className="p-2 hover:bg-gray-100 rounded-lg transition-all hover:scale-105"
                aria-label="Close chat"
              >
                <X className="w-5 h-5 text-gray-500 hover:text-gray-700" />
              </button>
            </Dialog.Close>
          </div>

          {/* Chat Content */}
          <div className="flex-1 overflow-y-auto">
            <ChatContainerRoot>
              <ChatContainerContent className="space-y-4">
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    <p className="font-medium">Connection Error</p>
                    <p>Unable to connect to the chat service. Please ensure the API is running.</p>
                    <p className="text-xs mt-1 font-mono">{error.message}</p>
                  </div>
                )}
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-center">
                    <div className="space-y-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto">
                        <span className="text-white font-medium">F</span>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 mb-1">Start a conversation</h3>
                        <p className="text-sm text-gray-500">
                          Ask questions about the episode or highlight text to discuss with Futura.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  messages.map((message) => (
                    <MessageComponent key={message.id} message={message} />
                  ))
                )}
                
                {status === 'streaming' && (
                  <Message className="items-start">
                    <div className="bg-gray-100 text-gray-900 rounded-lg px-3 py-2">
                      <DotsLoader />
                    </div>
                  </Message>
                )}
                <div ref={messagesEndRef} />
              </ChatContainerContent>
            </ChatContainerRoot>
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
            
            <form onSubmit={handleSubmitWithAttachments}>
              <PromptInput>
                <PromptInputTextarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask Futura about this episode..."
                  className="resize-none"
                />
                <PromptInputActions>
                  <Button 
                    type="submit" 
                    size="icon"
                    disabled={!input.trim() && attachments.length === 0}
                    className="h-8 w-8"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </Button>
                </PromptInputActions>
              </PromptInput>
            </form>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};