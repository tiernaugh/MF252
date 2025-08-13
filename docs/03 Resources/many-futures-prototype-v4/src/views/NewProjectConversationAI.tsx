import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { useChat } from '@ai-sdk/react';
import { TextStreamChatTransport } from 'ai';
import { AvatarOrb } from '../components/brand/AvatarOrb';

export function NewProjectConversationAI() {
  const [input, setInput] = useState('');
  const [isEditingBrief, setIsEditingBrief] = useState(false);
  const [showBrief, setShowBrief] = useState(false);
  const [projectBrief, setProjectBrief] = useState({ title: '', brief: '' });
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const briefRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const {
    messages,
    sendMessage,
    status
  } = useChat({
    transport: new TextStreamChatTransport({
      api: '/api/project-conversation',
    }),
    onError: (error) => {
      console.error('Chat error:', error);
    }
  });
  
  // Add initial message
  useEffect(() => {
    if (!hasInitialized && messages.length === 0) {
      setHasInitialized(true);
      // Since we can't set initial messages, we'll show it differently
    }
  }, [hasInitialized, messages]);
  
  // Auto-focus input
  useEffect(() => {
    if (!showBrief && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showBrief, messages]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Shift from center to top as conversation grows
  useEffect(() => {
    if (messages.length > 1 && containerRef.current) {
      containerRef.current.style.justifyContent = 'flex-start';
      containerRef.current.style.paddingTop = '6rem';
    }
  }, [messages.length]);
  
  // Check if last message suggests creating a brief
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === 'assistant') {
      const content = (lastMessage as any).content || '';
      if (content.toLowerCase().includes('ready for me to create') &&
          content.toLowerCase().includes('brief')) {
        // Show brief creation option
      }
    }
  }, [messages]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // If brief is shown and Enter pressed without text, confirm
    if (showBrief && !input.trim()) {
      window.location.hash = '#project';
      return;
    }
    
    if (!input.trim()) return;
    
    // Check if user is saying yes to brief creation
    if (/\b(yes|create|ready|brief|start|go ahead)\b/i.test(input)) {
      const lastAssistantMessage = messages.filter(m => m.role === 'assistant').pop();
      const content = (lastAssistantMessage as any)?.content || '';
      if (content.toLowerCase().includes('ready for me to create')) {
        generateBrief();
        setInput('');
        return;
      }
    }
    
    // Send the message - sendMessage expects just the message object
    const messageToSend: any = {
      role: 'user',
      content: input,
      data: {}
    };
    
    sendMessage(messageToSend);
    setInput('');
  };
  
  const generateBrief = () => {
    // Extract topic from conversation
    const conversation = messages.map(m => (m as any).content || '').join(' ');
    
    // Simple extraction - in production, this would be done by AI
    let title = 'Future Research Project';
    let brief = 'I\'ll research emerging patterns and possibilities in this area.';
    
    // Try to extract topic from conversation
    if (conversation.includes('bees')) {
      title = 'The Future of Bees and Pollinator Systems';
      brief = "I'll research the future of bee populations and pollinator ecosystems. I'll track colony collapse patterns, emerging conservation technologies, agricultural adaptation strategies, and policy responses. My focus will be on understanding both the risks to pollinator systems and innovative approaches to ensuring their survival and recovery.";
    } else if (conversation.includes('AI') || conversation.includes('artificial intelligence')) {
      title = 'AI Transformation Patterns';
      brief = "I'll research how artificial intelligence is reshaping industries and society. I'll track breakthrough capabilities, adoption patterns, regulatory responses, and emerging risks. My focus will be on identifying transformative applications and understanding their broader implications for work, creativity, and human agency.";
    }
    
    setProjectBrief({ title, brief });
    setShowBrief(true);
  };
  
  const handleBriefEdit = () => {
    setIsEditingBrief(true);
    setTimeout(() => {
      if (briefRef.current) {
        briefRef.current.focus();
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(briefRef.current);
        range.collapse(false);
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }, 0);
  };
  
  const handleBriefSave = () => {
    const newTitle = briefRef.current?.querySelector('.brief-title')?.textContent || projectBrief.title;
    const newBrief = briefRef.current?.querySelector('.brief-body')?.textContent || projectBrief.brief;
    setProjectBrief({ title: newTitle, brief: newBrief });
    setIsEditingBrief(false);
  };
  
  const handleContinueShaping = () => {
    setShowBrief(false);
    setInput('');
  };
  
  const getPlaceholder = () => {
    if (messages.length === 0) return "What future would you like to explore?";
    if (showBrief) return "Press Enter to confirm, or continue the conversation...";
    if (status === 'streaming') return "";
    return "Type your response...";
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (showShortcuts) {
        setShowShortcuts(false);
      } else if (isEditingBrief) {
        setIsEditingBrief(false);
      } else if (messages.length > 0) {
        if (confirm('Leave project creation? Your conversation will be lost.')) {
          window.location.hash = '#home';
        }
      } else {
        window.location.hash = '#home';
      }
    }
    
    if (e.key === 'Tab' && showBrief && !isEditingBrief) {
      e.preventDefault();
      handleBriefEdit();
    }
    
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setShowShortcuts(!showShortcuts);
    }
  };
  
  // Show initial message if no messages
  const allMessages = messages.length === 0 ? [{
    id: 'opening',
    role: 'assistant',
    content: 'I research possible futures and their implications. What future would you like to explore?'
  }] : messages;
  
  return (
    <div 
      className="min-h-screen bg-white relative"
      onKeyDown={handleKeyDown}
    >
      {/* Subtle close button */}
      <button
        onClick={() => {
          if (messages.length > 0) {
            if (confirm('Leave project creation?')) {
              window.location.hash = '#home';
            }
          } else {
            window.location.hash = '#home';
          }
        }}
        className="absolute top-8 right-8 p-2 text-gray-400 hover:text-gray-600 transition-colors"
        aria-label="Close"
      >
        <X className="w-5 h-5" />
      </button>
      
      {/* Main content */}
      <div 
        ref={containerRef}
        className="min-h-screen flex flex-col justify-center items-center px-8 transition-all duration-700 ease-out"
        style={{ maxWidth: '100%' }}
      >
        <div className="w-full max-w-2xl">
          {/* Messages */}
          <div className="space-y-8">
            {allMessages.map((message: any, index: number) => (
              <div key={message.id} className="animate-fade-in-up">
                {index === 0 && (
                  <div className="text-center mb-8">
                    <div className="inline-block rounded-full overflow-hidden">
                      <AvatarOrb size={60} />
                    </div>
                  </div>
                )}
                
                {message.role === 'assistant' ? (
                  <div 
                    className="font-lora text-xl md:text-2xl text-gray-900 leading-relaxed"
                    style={{ 
                      opacity: index < allMessages.length - 2 ? 0.6 : 1,
                      transition: 'opacity 0.6s ease'
                    }}
                  >
                    {message.content}
                  </div>
                ) : (
                  <div 
                    className="font-sans text-lg md:text-xl text-gray-700 leading-relaxed"
                    style={{ 
                      opacity: index < allMessages.length - 1 ? 0.8 : 1,
                      transition: 'opacity 0.6s ease'
                    }}
                  >
                    {message.content}
                  </div>
                )}
                
                {/* Separator dot */}
                {index < allMessages.length - 1 && (
                  <div className="flex justify-center py-4">
                    <div className="w-1 h-1 bg-gray-300 rounded-full" />
                  </div>
                )}
              </div>
            ))}
            
            {/* Typing indicator */}
            {status === 'streaming' && (
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
            
            <div ref={messagesEndRef} />
            
            {/* Brief */}
            {showBrief && (
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
                
                {/* Action hints and buttons */}
                {!isEditingBrief && (
                  <div className="mt-8 space-y-4">
                    <div className="text-center text-sm text-gray-400 animate-fade-in">
                      <span className="hidden md:inline">Tab to edit</span>
                      <span className="md:hidden">Tap to edit</span>
                      <span className="mx-3">·</span>
                      <span>Enter to confirm</span>
                    </div>
                    
                    <div className="flex gap-3 justify-center">
                      <button
                        onClick={handleContinueShaping}
                        className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                      >
                        Continue Shaping
                      </button>
                      <button
                        onClick={() => window.location.hash = '#project'}
                        className="px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                      >
                        Start Research →
                      </button>
                    </div>
                  </div>
                )}
                
                {isEditingBrief && (
                  <div className="mt-8 text-center text-sm text-gray-400">
                    Click outside to save
                  </div>
                )}
              </div>
            )}
            
            {/* Input field - always visible */}
            <form onSubmit={handleSubmit} className="mt-8">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={getPlaceholder()}
                className="w-full bg-transparent border-b border-gray-200 pb-2 outline-none font-sans text-lg md:text-xl text-gray-700 placeholder-gray-400 focus:border-gray-400 transition-colors"
                disabled={status === 'streaming'}
              />
            </form>
          </div>
          
          {/* Keyboard hints */}
          {allMessages.length === 1 && (
            <div className="text-center mt-12 text-xs text-gray-400 animate-fade-in" style={{ animationDelay: '1.2s' }}>
              <span className="hidden md:inline">Press ⌘K for keyboard shortcuts</span>
            </div>
          )}
        </div>
        
        {/* Keyboard shortcuts overlay */}
        {showShortcuts && (
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in"
            onClick={() => setShowShortcuts(false)}
          >
            <div className="bg-white rounded-lg p-8 max-w-sm shadow-xl">
              <h3 className="font-lora text-lg font-bold mb-4">Keyboard Shortcuts</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Send message</span>
                  <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Enter</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Edit brief</span>
                  <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Tab</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Confirm brief</span>
                  <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Enter</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Exit</span>
                  <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Esc</kbd>
                </div>
              </div>
              <div className="mt-4 text-xs text-gray-400 text-center">
                Press Esc to close
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}