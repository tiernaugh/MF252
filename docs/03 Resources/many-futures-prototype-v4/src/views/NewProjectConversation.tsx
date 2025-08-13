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
import { BriefCanvas } from '../components/project/BriefCanvas';
import { 
  PromptInput, 
  PromptInputTextarea, 
  PromptInputActions 
} from '../components/prompt-kit/prompt-input';
import { Button } from '../components/ui/button';
import { ArrowUp } from 'lucide-react';

export function NewProjectConversation() {
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
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
  
  // Initialize with opening message
  useEffect(() => {
    reset();
    // Only add message if we don't already have one
    if (messages.length === 0) {
      setTimeout(() => {
        addMessage('futura', getFuturaResponse('', { turnCount: 0, previousMessages: [] }));
      }, 500);
    }
  }, []); // Remove dependencies to prevent re-runs
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Focus input when not showing brief
  useEffect(() => {
    if (conversationState !== 'brief_generated' && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [conversationState]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    const userMessage = input.trim();
    setInput('');
    
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
      }, 1500);
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
      }, 1000 + Math.random() * 1000);
    }
  };
  
  const handleContinueShaping = () => {
    setConversationState('exploring');
    // Could add a message from Futura asking what else to consider
    addMessage('futura', "What else should I consider in this research? You could tell me about your specific context, any constraints, or related areas to explore.");
  };
  
  const handleConfirmBrief = () => {
    // In real app, would create project and navigate
    // For prototype, just navigate back to project view
    window.location.hash = '#project';
  };
  
  const handleClose = () => {
    if (confirm('Are you sure you want to leave? Your conversation will be lost.')) {
      window.location.hash = '#home';
    }
  };
  
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-lg font-medium text-gray-900">New Project</h1>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      </header>
      
      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-8">
          {/* Messages */}
          <div className="space-y-6 mb-8">
            {messages.map((message) => (
              <div key={message.id} className="flex gap-4">
                {message.role === 'futura' ? (
                  <>
                    <div className="flex-shrink-0">
                      <div className="relative">
                        <div className="absolute inset-0 animate-pulse-slow opacity-30">
                          <AvatarOrb size={40} />
                        </div>
                        <AvatarOrb size={40} />
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 mb-1">Futura</p>
                      <div className="text-gray-700 leading-relaxed">
                        {message.content}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600">You</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 mb-1">You</p>
                      <div className="text-gray-700 leading-relaxed">
                        {message.content}
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
            
            {/* Typing indicator */}
            {isTyping && (
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <AvatarOrb size={40} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 mb-1">Futura</p>
                  <div className="text-gray-500">
                    <span className="inline-flex gap-1">
                      <span className="animate-bounce" style={{ animationDelay: '0ms' }}>•</span>
                      <span className="animate-bounce" style={{ animationDelay: '150ms' }}>•</span>
                      <span className="animate-bounce" style={{ animationDelay: '300ms' }}>•</span>
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
          
          {/* Brief Canvas */}
          {projectBrief && conversationState === 'brief_generated' && (
            <div className="mb-8">
              <BriefCanvas
                title={projectBrief.title}
                brief={projectBrief.brief}
                onUpdate={(title, brief) => updateBrief({ title, brief })}
                onContinue={handleContinueShaping}
                onConfirm={handleConfirmBrief}
              />
            </div>
          )}
        </div>
      </main>
      
      {/* Input area */}
      {conversationState !== 'brief_generated' && (
        <div className="border-t border-gray-200 px-6 py-4">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSubmit}>
              <PromptInput>
                <PromptInputTextarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your response..."
                  className="resize-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                />
                <PromptInputActions>
                  <Button 
                    type="submit" 
                    size="icon"
                    disabled={!input.trim() || isTyping}
                    className="h-8 w-8"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </Button>
                </PromptInputActions>
              </PromptInput>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}