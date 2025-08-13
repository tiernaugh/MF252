import { useState, useRef, useEffect } from 'react';
import type { FormEvent } from 'react';
import { X } from 'lucide-react';
import { useChat } from '@ai-sdk/react';
import { TextStreamChatTransport } from 'ai';
import ReactMarkdown from 'react-markdown';
import { AvatarOrb } from '../components/brand/AvatarOrb';

interface ProjectBrief {
  title: string;
  brief: string;
}

export function NewProjectConversationSimple() {
  // Core state
  const [showBrief, setShowBrief] = useState(false);
  const [projectBrief, setProjectBrief] = useState<ProjectBrief | null>(null);
  const [isEditingBrief, setIsEditingBrief] = useState(false);
  const [conversationId] = useState(`conv-${Date.now()}`);
  
  // Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const briefRef = useRef<HTMLDivElement>(null);
  
  // Local input state
  const [localInput, setLocalInput] = useState('');
  
  // Use Vercel AI SDK's useChat hook with TextStreamChatTransport
  const {
    messages,
    sendMessage,
    status,
    error
  } = useChat({
    transport: new TextStreamChatTransport({
      api: '/api/project-conversation',
      body: {
        conversationId
      }
    }),
    onError: (error) => {
      console.error('Chat error:', error);
    },
    onFinish: ({ message }) => {
      console.log('Message finished:', message);
      // Check if this is a brief generation signal
      const msg = message as any;
      let content = '';
      if (msg.content) {
        content = msg.content;
      } else if (msg.parts) {
        content = msg.parts.map((part: any) => part.type === 'text' ? part.text : '').join('');
      }
      
      // Check for brief generation signal from server
      if (content.startsWith('BRIEF_GENERATION:')) {
        console.log('Received brief generation signal');
        try {
          const briefData = JSON.parse(content.replace('BRIEF_GENERATION:', ''));
          console.log('Brief data:', briefData);
          setProjectBrief({
            title: briefData.title,
            brief: briefData.content
          });
          setShowBrief(true);
          // Remove the BRIEF_GENERATION message from messages
          return;
        } catch (e) {
          console.error('Failed to parse brief data:', e);
        }
      }
      // Also check for convergence signal in regular message
      else if (content.toLowerCase().includes('ready for me to create') || 
               content.toLowerCase().includes('create your project brief')) {
        // Don't auto-generate, wait for user response
      }
    }
  });
  
  const isLoading = status === 'streaming';
  
  // Debug logging
  useEffect(() => {
    console.log('Messages updated:', messages);
    console.log('Status:', status);
    if (messages.length > 0) {
      console.log('Last message structure:', messages[messages.length - 1]);
    }
  }, [messages, status]);
  
  // Auto-focus input
  useEffect(() => {
    if (!showBrief && !isLoading) {
      inputRef.current?.focus();
    }
  }, [showBrief, isLoading, messages]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Handle form submission wrapper
  const handleFormSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // If brief is shown and Enter pressed without text, confirm
    if (showBrief && !localInput.trim()) {
      window.location.hash = '#project';
      return;
    }
    
    if (!localInput.trim() || isLoading) return;
    
    // Send the message using the same format as ChatPanelNew
    const messageToSend: any = {
      role: 'user',
      content: localInput,
      data: {}
    };
    
    sendMessage(messageToSend);
    setLocalInput('');
  };
  
  // Note: Brief generation is now handled by the server using GPT-5
  // The server will send a BRIEF_GENERATION signal when ready
  
  // Handle brief editing
  const handleBriefEdit = () => {
    setIsEditingBrief(true);
    setTimeout(() => {
      briefRef.current?.focus();
    }, 0);
  };
  
  const handleBriefSave = () => {
    const briefEl = briefRef.current?.querySelector('.brief-body');
    
    if (briefEl && projectBrief) {
      setProjectBrief({
        ...projectBrief,
        brief: briefEl.textContent || ''
      });
    }
    setIsEditingBrief(false);
  };
  
  // Get input placeholder
  const getPlaceholder = () => {
    if (messages.length === 0) return 'What future would you like to explore?';
    if (isLoading) return 'Futura is thinking...';
    if (showBrief) return 'Press Enter to confirm, or continue the conversation...';
    return 'Type your response...';
  };
  
  // Helper to extract content from message
  const extractContent = (msg: any) => {
    let content = '';
    if (typeof msg.content === 'string') {
      content = msg.content;
    } else if (msg.parts) {
      content = msg.parts.map((part: any) => part.type === 'text' ? part.text : '').join('');
    } else {
      content = msg.content || '';
    }
    
    // Debug: Log content to see if newlines are present
    if (msg.role === 'assistant' && content) {
      console.log('Assistant message raw content:', JSON.stringify(content));
    }
    
    return content;
  };
  
  // Filter out BRIEF_GENERATION messages and combine with greeting
  const allMessages = [
    {
      id: 'greeting',
      role: 'assistant' as const,
      content: 'I research possible futures and their implications. What future would you like to explore?'
    },
    ...messages.filter((msg) => {
      const content = extractContent(msg);
      // Filter out BRIEF_GENERATION signals
      return !content.startsWith('BRIEF_GENERATION:');
    })
  ];
  
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-8 flex justify-between items-center">
        <div className="text-sm text-gray-400">New Project</div>
        <button
          type="button"
          onClick={() => window.location.hash = '#home'}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-8 pt-24 pb-32">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Futura Avatar */}
          <div className="flex justify-center mb-8">
            <div className="rounded-full overflow-hidden">
              <AvatarOrb size={60} />
            </div>
          </div>
          
          {/* Error display */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <p className="font-medium">Connection Error</p>
              <p>Unable to connect to Futura. Please ensure the API server is running.</p>
              <p className="text-xs mt-1">{error.toString()}</p>
            </div>
          )}
          
          {/* Conversation */}
          {allMessages.map((message, index) => (
            <div key={message.id} className="animate-fade-in-up">
              <div className={
                message.role === 'assistant'
                  ? 'font-lora text-xl md:text-2xl text-gray-900 leading-relaxed whitespace-pre-wrap'
                  : 'font-sans text-lg md:text-xl text-gray-700 leading-relaxed whitespace-pre-wrap'
              }>
                {/* Use helper to extract content - whitespace-pre-wrap preserves line breaks */}
                {extractContent(message)}
              </div>
              
              {/* Separator dot */}
              {index < allMessages.length - 1 && (
                <div className="flex justify-center py-4">
                  <div className="w-1 h-1 bg-gray-300 rounded-full" />
                </div>
              )}
            </div>
          ))}
          
          {/* Loading indicator */}
          {isLoading && (
            <div className="animate-fade-in">
              <div className="flex justify-center py-4">
                <div className="w-1 h-1 bg-gray-300 rounded-full" />
              </div>
              <div className="font-lora text-xl md:text-2xl text-gray-400">
                <span className="inline-block animate-pulse">·</span>
                <span className="inline-block animate-pulse" style={{ animationDelay: '0.2s' }}>·</span>
                <span className="inline-block animate-pulse" style={{ animationDelay: '0.4s' }}>·</span>
              </div>
            </div>
          )}
          
          {/* Project Brief */}
          {showBrief && projectBrief && (
            <div className="animate-fade-in-up mt-12">
              <div className="flex justify-center py-4">
                <div className="w-1 h-1 bg-gray-300 rounded-full" />
              </div>
              
              <div className="space-y-6">
                <div className="text-xs uppercase tracking-[0.2em] text-gray-500 font-medium">
                  Project Brief
                </div>
                
                <h2 className="font-lora text-3xl md:text-4xl font-bold text-gray-900">
                  {projectBrief.title}
                </h2>
                
                {isEditingBrief ? (
                  <div
                    ref={briefRef}
                    className="cursor-text"
                    onBlur={() => isEditingBrief && handleBriefSave()}
                    contentEditable={true}
                    suppressContentEditableWarning={true}
                  >
                    <div className="brief-body font-sans text-base md:text-lg text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {projectBrief.brief}
                    </div>
                  </div>
                ) : (
                  <div 
                    className="cursor-pointer hover:bg-gray-50 p-4 -m-4 rounded-lg transition-colors"
                    onClick={() => handleBriefEdit()}
                  >
                    <div className="brief-body prose prose-lg max-w-none">
                      <ReactMarkdown 
                        components={{
                        h2: ({children}) => <h3 className="font-lora text-xl md:text-2xl font-semibold text-gray-900 mt-6 mb-3">{children}</h3>,
                        h3: ({children}) => <h4 className="font-sans text-lg md:text-xl font-medium text-gray-800 mt-4 mb-2">{children}</h4>,
                        p: ({children}) => <p className="font-sans text-base md:text-lg text-gray-700 leading-relaxed mb-4">{children}</p>,
                        ul: ({children}) => <ul className="space-y-2 my-4">{children}</ul>,
                        ol: ({children}) => <ol className="space-y-2 my-4 list-decimal list-inside">{children}</ol>,
                        li: ({children}) => <li className="font-sans text-base md:text-lg text-gray-700 leading-relaxed">{children}</li>,
                        strong: ({children}) => <strong className="font-semibold text-gray-900">{children}</strong>,
                        }}
                      >
                        {projectBrief.brief}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>
              
              {!isEditingBrief && (
                <div className="mt-8 space-y-4">
                  <div className="text-center text-sm text-gray-400">
                    <span className="hidden md:inline">Tab to edit</span>
                    <span className="md:hidden">Tap to edit</span>
                    <span className="mx-3">·</span>
                    <span>Enter to confirm</span>
                  </div>
                  
                  <div className="flex gap-3 justify-center">
                    <button
                      type="button"
                      onClick={() => setShowBrief(false)}
                      className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      Continue Shaping
                    </button>
                    <button
                      type="button"
                      onClick={() => window.location.hash = '#project'}
                      className="px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                    >
                      Start Research →
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      {/* Input */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100">
        <form onSubmit={handleFormSubmit} className="max-w-2xl mx-auto p-8">
          <input
            ref={inputRef}
            type="text"
            value={localInput}
            onChange={(e) => setLocalInput(e.target.value)}
            placeholder={getPlaceholder()}
            disabled={isLoading}
            className="w-full bg-transparent border-b border-gray-200 pb-2 outline-none font-sans text-lg md:text-xl text-gray-700 placeholder-gray-400 focus:border-gray-400 transition-colors disabled:opacity-50"
          />
        </form>
      </div>
    </div>
  );
}