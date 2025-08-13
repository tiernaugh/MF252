import { useState, useRef, useEffect } from 'react';
import type { FormEvent } from 'react';
import { X } from 'lucide-react';
import { useChat } from '@ai-sdk/react';
import { TextStreamChatTransport } from 'ai';
import { AvatarOrb } from '../components/brand/AvatarOrb';

interface ProjectBrief {
  title: string;
  brief: string;
}

export function NewProjectConversationSDK() {
  // Core state
  const [showBrief, setShowBrief] = useState(false);
  const [projectBrief, setProjectBrief] = useState<ProjectBrief | null>(null);
  const [isEditingBrief, setIsEditingBrief] = useState(false);
  const [localInput, setLocalInput] = useState('');
  
  // Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const briefRef = useRef<HTMLDivElement>(null);
  
  // Use Vercel AI SDK's useChat hook
  const {
    messages,
    sendMessage,
    status,
    error
  } = useChat({
    transport: new TextStreamChatTransport({
      api: '/api/project-conversation',
    }),
    onError: (error) => {
      console.error('Chat error:', error);
    },
    onFinish: ({ message }) => {
      console.log('Message finished:', message);
      // Check if Futura is ready to create a brief
      const content = (message as any).content || '';
      if (content.toLowerCase().includes('ready for me to create') || 
          content.toLowerCase().includes('create your project brief')) {
        setTimeout(() => {
          generateBrief();
        }, 1000);
      }
    }
  });
  
  // Debug logging
  useEffect(() => {
    console.log('Messages updated:', messages);
    console.log('Status:', status);
  }, [messages, status]);
  
  const isLoading = status === 'streaming';
  
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
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    // If brief is shown and Enter pressed without text, confirm
    if (showBrief && !localInput.trim()) {
      window.location.hash = '#project';
      return;
    }
    
    if (!localInput.trim() || isLoading) return;
    
    // Send message using the SDK
    sendMessage({
      role: 'user',
      content: localInput
    } as any);
    
    setLocalInput('');
  };
  
  // Generate project brief from conversation
  const generateBrief = () => {
    const conversation = messages
      .map(m => (m as any).content || '')
      .join(' ')
      .toLowerCase();
    
    let title = 'Future Research Project';
    let brief = 'I\'ll research emerging patterns and possibilities in this area.';
    
    // Extract topic from conversation (simplified - in production, AI would generate this)
    if (conversation.includes('ai') && conversation.includes('consulting')) {
      title = 'The Future of AI in Consulting';
      brief = 'I\'ll research how artificial intelligence is transforming consulting practices. I\'ll track AI tool adoption, changing client expectations, and new service models. My focus will be on understanding how consultants are adapting their value propositions and what new opportunities are emerging.';
    } else if (conversation.includes('climate') || conversation.includes('environment')) {
      title = 'Climate Adaptation Strategies';
      brief = 'I\'ll research emerging climate adaptation approaches across sectors. I\'ll track technological innovations, policy responses, and community initiatives. My focus will be on identifying effective patterns and understanding systemic transformation opportunities.';
    } else if (conversation.includes('education') || conversation.includes('learning')) {
      title = 'The Future of Education Systems';
      brief = 'I\'ll research how education is evolving in response to technological and social changes. I\'ll track new pedagogical approaches, institutional adaptations, and skill development patterns. My focus will be on understanding what prepares learners for an uncertain future.';
    } else if (conversation.includes('bee') || conversation.includes('pollinator')) {
      title = 'The Future of Bees and Pollinator Systems';
      brief = 'I\'ll research the future of bee populations and pollinator ecosystems. I\'ll track colony collapse patterns, emerging conservation technologies, agricultural adaptation strategies, and policy responses. My focus will be on understanding both the risks to pollinator systems and innovative approaches to ensuring their survival and recovery.';
    }
    
    setProjectBrief({ title, brief });
    setShowBrief(true);
  };
  
  // Handle brief editing
  const handleBriefEdit = () => {
    setIsEditingBrief(true);
    setTimeout(() => {
      briefRef.current?.focus();
    }, 0);
  };
  
  const handleBriefSave = () => {
    const titleEl = briefRef.current?.querySelector('.brief-title');
    const briefEl = briefRef.current?.querySelector('.brief-body');
    
    if (titleEl && briefEl) {
      setProjectBrief({
        title: titleEl.textContent || '',
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
  
  // Combine SDK messages with greeting
  const allMessages = [
    {
      id: 'greeting',
      role: 'assistant' as const,
      content: 'I research possible futures and their implications. What future would you like to explore?'
    },
    ...messages
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
            </div>
          )}
          
          {/* Conversation */}
          {allMessages.map((message, index) => (
            <div key={message.id} className="animate-fade-in-up">
              <div className={
                message.role === 'assistant'
                  ? 'font-lora text-xl md:text-2xl text-gray-900 leading-relaxed'
                  : 'font-sans text-lg md:text-xl text-gray-700 leading-relaxed'
              }>
                {(message as any).content}
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
              
              <div
                ref={briefRef}
                className={`space-y-6 ${isEditingBrief ? 'cursor-text' : 'cursor-pointer'}`}
                onClick={() => !isEditingBrief && handleBriefEdit()}
                onBlur={() => isEditingBrief && handleBriefSave()}
                contentEditable={isEditingBrief}
                suppressContentEditableWarning={true}
              >
                <div className="text-xs uppercase tracking-[0.2em] text-gray-500 font-medium">
                  Project Brief
                </div>
                
                <h2 className="brief-title font-lora text-3xl md:text-4xl font-bold text-gray-900">
                  {projectBrief.title}
                </h2>
                
                <div className="brief-body font-sans text-base md:text-lg text-gray-700 leading-relaxed">
                  {projectBrief.brief}
                </div>
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
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto p-8">
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