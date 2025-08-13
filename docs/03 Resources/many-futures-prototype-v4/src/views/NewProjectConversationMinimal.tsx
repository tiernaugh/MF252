import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { useNewProjectStore } from '../store/useNewProjectStore';
import { 
  getFuturaResponse, 
  generateProjectBrief, 
  isOutOfScope, 
  getOutOfScopeResponse 
} from '../lib/futuraResponses';
import { AvatarOrb } from '../components/brand/AvatarOrb';

export function NewProjectConversationMinimal() {
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [briefText, setBriefText] = useState('');
  const [briefProgress, setBriefProgress] = useState(0);
  const [isEditingBrief, setIsEditingBrief] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const briefRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);
  
  const {
    conversationState,
    messages,
    projectBrief,
    turnCount,
    addMessage,
    setConversationState,
    generateBrief,
    updateBrief,
    reset,
  } = useNewProjectStore();
  
  // Initialize - use ref to prevent double execution
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      reset();
      setTimeout(() => {
        addMessage('futura', getFuturaResponse('', { turnCount: 0, previousMessages: [] }));
      }, 800);
    }
  }, []);
  
  // Auto-focus input
  useEffect(() => {
    if (conversationState !== 'brief_generated' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [conversationState, messages]);
  
  // Typewriter effect for brief
  useEffect(() => {
    if (projectBrief && conversationState === 'brief_generated') {
      const fullText = projectBrief.brief;
      let currentIndex = 0;
      
      const typeInterval = setInterval(() => {
        if (currentIndex <= fullText.length) {
          setBriefText(fullText.slice(0, currentIndex));
          setBriefProgress((currentIndex / fullText.length) * 100);
          currentIndex += 2; // Type 2 characters at a time for speed
        } else {
          clearInterval(typeInterval);
        }
      }, 30);
      
      return () => clearInterval(typeInterval);
    }
  }, [projectBrief, conversationState]);
  
  // Shift from center to top as conversation grows
  useEffect(() => {
    if (messages.length > 1 && containerRef.current) {
      containerRef.current.style.justifyContent = 'flex-start';
      containerRef.current.style.paddingTop = '6rem';
    }
  }, [messages.length]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // If brief is generated and complete, Enter confirms
    if (conversationState === 'brief_generated' && briefProgress >= 100 && !input.trim()) {
      window.location.hash = '#project';
      return;
    }
    
    if (!input.trim()) return;
    
    const userMessage = input.trim();
    setInput('');
    
    // If continuing to shape after brief
    if (conversationState === 'brief_generated') {
      setConversationState('exploring');
    }
    
    // Add user message
    addMessage('user', userMessage);
    
    // Check for out of scope
    if (isOutOfScope(userMessage)) {
      setIsTyping(true);
      setTimeout(() => {
        addMessage('futura', getOutOfScopeResponse());
        setIsTyping(false);
      }, 1000);
      return;
    }
    
    // Check if user wants to create brief
    const wantsBrief = /\b(yes|create|ready|brief|start|go)\b/i.test(userMessage) && turnCount >= 2;
    
    if (wantsBrief && conversationState !== 'brief_generated') {
      // Generate brief
      setIsTyping(true);
      setTimeout(() => {
        const brief = generateProjectBrief({
          turnCount,
          previousMessages: messages.map(m => ({ role: m.role, content: m.content })),
        });
        generateBrief(brief.title, brief.brief);
        setIsTyping(false);
      }, 1000);
    } else {
      // Continue conversation
      setIsTyping(true);
      
      // Update conversation state based on turn count
      if (turnCount === 1) {
        setConversationState('exploring');
      } else if (turnCount >= 2) {
        setConversationState('converging');
      }
      
      setTimeout(() => {
        const response = getFuturaResponse(userMessage, {
          turnCount,
          previousMessages: messages.map(m => ({ role: m.role, content: m.content })),
        });
        addMessage('futura', response);
        setIsTyping(false);
      }, 800 + Math.random() * 400);
    }
  };
  
  const handleBriefEdit = () => {
    setIsEditingBrief(true);
    setTimeout(() => {
      if (briefRef.current) {
        briefRef.current.focus();
        // Place cursor at end
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
    const newTitle = briefRef.current?.querySelector('.brief-title')?.textContent || projectBrief?.title || '';
    const newBrief = briefRef.current?.querySelector('.brief-body')?.textContent || briefText;
    updateBrief({ title: newTitle, brief: newBrief });
    setIsEditingBrief(false);
  };
  
  const handleContinueShaping = () => {
    setConversationState('exploring');
    addMessage('futura', "What else should I consider in this research? Tell me about your specific context, constraints, or related areas you'd like me to explore.");
  };
  
  const getPlaceholder = () => {
    if (messages.length === 0) return "What future would you like to explore?";
    if (conversationState === 'brief_generated' && briefProgress >= 100) {
      return "Press Enter to confirm, or continue the conversation...";
    }
    if (isTyping) return "";
    return "Type your response...";
  };
  
  const [showShortcuts, setShowShortcuts] = useState(false);
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Global keyboard shortcuts
    if (e.key === 'Escape') {
      if (showShortcuts) {
        setShowShortcuts(false);
      } else if (isEditingBrief) {
        setIsEditingBrief(false);
      } else if (messages.length > 1) {
        if (confirm('Leave project creation? Your conversation will be lost.')) {
          window.location.hash = '#home';
        }
      } else {
        window.location.hash = '#home';
      }
    }
    
    if (e.key === 'Tab' && projectBrief && !isEditingBrief) {
      e.preventDefault();
      handleBriefEdit();
    }
    
    if (e.key === 'Enter' && projectBrief && briefProgress >= 100 && !isEditingBrief) {
      e.preventDefault();
      window.location.hash = '#project';
    }
    
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setShowShortcuts(!showShortcuts);
    }
    
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && turnCount >= 1) {
      e.preventDefault();
      // Skip to brief generation
      const brief = generateProjectBrief({
        turnCount,
        previousMessages: messages.map(m => ({ role: m.role, content: m.content })),
      });
      generateBrief(brief.title, brief.brief);
    }
  };
  
  return (
    <div 
      className="min-h-screen bg-white relative"
      onKeyDown={handleKeyDown}
    >
      {/* Subtle close button */}
      <button
        onClick={() => {
          if (messages.length > 1) {
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
          {/* Opening state with orb */}
          {messages.length === 0 && (
            <div className="text-center animate-fade-in">
              <div className="mb-8 inline-block rounded-full overflow-hidden">
                <AvatarOrb size={60} />
              </div>
            </div>
          )}
          
          {/* Messages */}
          <div className="space-y-8">
            {messages.map((message, index) => (
              <div key={message.id} className="animate-fade-in-up">
                {index === 0 && (
                  <div className="text-center mb-8">
                    <div className="inline-block rounded-full overflow-hidden">
                      <AvatarOrb size={60} />
                    </div>
                  </div>
                )}
                
                {message.role === 'futura' ? (
                  <div 
                    className="font-lora text-xl md:text-2xl text-gray-900 leading-relaxed"
                    style={{ 
                      opacity: index < messages.length - 2 ? 0.6 : 1,
                      transition: 'opacity 0.6s ease'
                    }}
                  >
                    {message.content}
                  </div>
                ) : (
                  <div 
                    className="font-sans text-lg md:text-xl text-gray-700 leading-relaxed"
                    style={{ 
                      opacity: index < messages.length - 1 ? 0.8 : 1,
                      transition: 'opacity 0.6s ease'
                    }}
                  >
                    {message.content}
                  </div>
                )}
                
                {/* Separator dot */}
                {index < messages.length - 1 && (
                  <div className="flex justify-center py-4">
                    <div className="w-1 h-1 bg-gray-300 rounded-full" />
                  </div>
                )}
              </div>
            ))}
            
            {/* Typing indicator */}
            {isTyping && (
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
            
            {/* Brief */}
            {projectBrief && conversationState === 'brief_generated' && (
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
                  
                  <h2 
                    className="brief-title font-lora text-3xl md:text-4xl font-bold text-gray-900"
                    contentEditable={false}
                  >
                    {projectBrief.title}
                  </h2>
                  
                  <div 
                    className="brief-body font-sans text-base md:text-lg text-gray-700 leading-relaxed"
                  >
                    {isEditingBrief ? projectBrief.brief : briefText}
                    {!isEditingBrief && briefProgress < 100 && (
                      <span className="inline-block w-[2px] h-5 bg-gray-400 animate-pulse ml-1" />
                    )}
                  </div>
                </div>
                
                {/* Action hints and buttons */}
                {!isEditingBrief && briefProgress >= 100 && (
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
                disabled={isTyping}
              />
            </form>
          </div>
          
          {/* Keyboard hints */}
          {messages.length === 0 && (
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
                  <span className="text-gray-600">Skip to brief</span>
                  <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">⌘ Enter</kbd>
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
      
      {/* Add CSS animations */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes fade-in-up {
          from { 
            opacity: 0;
            transform: translateY(10px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  );
}