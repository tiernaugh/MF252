"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { FuturaAvatar } from "~/components/brand/FuturaAvatar";
import { BriefCanvas } from "~/components/project/BriefCanvas";
import { useProjectConversation } from "~/hooks/useProjectConversation";
import { mockProjects } from "~/lib/mock-data";

export default function NewProjectPage() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [showKeyboardHints, setShowKeyboardHints] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const {
    messages,
    phase,
    isLoading,
    error,
    projectBrief,
    turnCount,
    sendMessage,
    reset,
    saveBrief
  } = useProjectConversation();
  
  // Initialize conversation
  useEffect(() => {
    reset();
  }, [reset]);
  
  // Auto-focus input
  useEffect(() => {
    if (phase !== 'brief_generated' && !isLoading && inputRef.current) {
      inputRef.current.focus();
    }
  }, [phase, isLoading, messages]);
  
  // Shift from center to top as conversation grows
  useEffect(() => {
    if (messages.length > 1 && containerRef.current) {
      containerRef.current.style.justifyContent = 'flex-start';
      containerRef.current.style.paddingTop = '6rem';
    }
  }, [messages.length]);
  
  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, phase]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // If brief is generated and Enter pressed without text, confirm
    if (phase === 'brief_generated' && !input.trim()) {
      handleCreateProject();
      return;
    }
    
    if (!input.trim() || isLoading) return;
    
    // Store input value and clear immediately for better UX
    const message = input.trim();
    setInput("");
    
    await sendMessage(message);
  };
  
  const handleCreateProject = () => {
    if (!projectBrief) return;
    
    // In production, save to database
    // For now, just navigate to projects
    console.log("Creating project:", projectBrief);
    
    // Generate a new project ID
    const newProjectId = `proj_${Date.now()}`;
    
    // In production, this would be saved to database
    // For demo, we'll just navigate
    router.push(`/projects/${mockProjects[0]?.id || newProjectId}`);
  };
  
  const handleContinueShaping = async () => {
    setInput(""); // Clear any existing input
    await sendMessage("I'd like to shape this further");
  };
  
  const handleClose = () => {
    if (messages.length > 1) {
      if (confirm('Leave project creation? Your conversation will be lost.')) {
        router.push('/projects');
      }
    } else {
      router.push('/projects');
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Global keyboard shortcuts
    if (e.key === 'Escape') {
      if (showKeyboardHints) {
        setShowKeyboardHints(false);
      } else {
        handleClose();
      }
    }
    
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setShowKeyboardHints(!showKeyboardHints);
    }
    
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && turnCount >= 1) {
      e.preventDefault();
      // Force brief generation
      sendMessage("Yes, create my brief");
    }
  };
  
  const getPlaceholder = () => {
    if (messages.length === 1) return "What future would you like to explore?";
    if (phase === 'brief_generated') {
      return "Press Enter to confirm, or continue the conversation...";
    }
    if (isLoading) return "";
    return "Type your response...";
  };
  
  return (
    <div 
      className="min-h-screen bg-white relative"
      onKeyDown={handleKeyDown}
    >
      {/* Subtle close button */}
      <button
        onClick={handleClose}
        className="absolute top-8 right-8 p-2 text-stone-400 hover:text-stone-600 transition-colors z-10"
        aria-label="Close"
      >
        <X className="w-5 h-5" />
      </button>
      
      {/* Main content */}
      <div 
        ref={containerRef}
        className="min-h-screen flex flex-col justify-center items-center px-8 pb-20 transition-all duration-700 ease-out"
        style={{ maxWidth: '100%' }}
      >
        <div className="w-full max-w-2xl">
          {/* Opening state with orb */}
          {messages.length === 1 && (
            <div className="text-center animate-fade-in mb-8">
              <div className="inline-block rounded-full overflow-hidden">
                <FuturaAvatar size={60} />
              </div>
            </div>
          )}
          
          {/* Messages */}
          <div className="space-y-8">
            {messages.map((message, index) => (
              <div key={message.id} className="animate-fade-in-up">
                {/* Show avatar above first message if not opening */}
                {index === 1 && (
                  <div className="text-center mb-8">
                    <div className="inline-block rounded-full overflow-hidden">
                      <FuturaAvatar size={60} />
                    </div>
                  </div>
                )}
                
                {message.role === 'assistant' ? (
                  <div 
                    className="font-serif text-xl md:text-2xl text-stone-900 leading-relaxed whitespace-pre-wrap"
                    style={{ 
                      opacity: index < messages.length - 2 ? 0.6 : 1,
                      transition: 'opacity 0.6s ease'
                    }}
                  >
                    {message.content}
                  </div>
                ) : (
                  <div 
                    className="font-sans text-lg md:text-xl text-stone-700 leading-relaxed whitespace-pre-wrap"
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
                    <div className="w-1 h-1 bg-stone-300 rounded-full" />
                  </div>
                )}
              </div>
            ))}
            
            {/* Typing indicator */}
            {isLoading && (
              <div className="animate-fade-in">
                <div className="flex justify-center py-4">
                  <div className="w-1 h-1 bg-stone-300 rounded-full" />
                </div>
                <div className="font-serif text-xl md:text-2xl text-stone-400">
                  <span className="inline-block animate-pulse">·</span>
                  <span className="inline-block animate-pulse" style={{ animationDelay: '0.2s' }}>·</span>
                  <span className="inline-block animate-pulse" style={{ animationDelay: '0.4s' }}>·</span>
                </div>
              </div>
            )}
            
            {/* Error display */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}
            
            {/* Brief Canvas */}
            {projectBrief && phase === 'brief_generated' && (
              <>
                {console.log('Rendering BriefCanvas with:', { 
                  title: projectBrief.title, 
                  brief: projectBrief.brief,
                  fullObject: projectBrief 
                })}
                <BriefCanvas
                  title={projectBrief.title}
                  brief={projectBrief.brief || (projectBrief as any).content || 'Brief content not found'}
                  onSave={saveBrief}
                  showTypewriter={true}
                />
                
                {/* Action buttons */}
                <div className="mt-8 flex gap-3 justify-center">
                  <button
                    onClick={handleContinueShaping}
                    className="px-4 py-2 text-sm text-stone-600 hover:text-stone-900 transition-colors"
                  >
                    Continue Shaping
                  </button>
                  <button
                    onClick={handleCreateProject}
                    className="px-4 py-2 text-sm bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors"
                  >
                    Start Research →
                  </button>
                </div>
              </>
            )}
            
            {/* Input field - always visible */}
            <form onSubmit={handleSubmit} className="mt-8">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={getPlaceholder()}
                className="w-full bg-transparent border-b border-stone-200 pb-2 outline-none font-sans text-lg md:text-xl text-stone-700 placeholder-stone-400 focus:border-stone-400 transition-colors"
                disabled={isLoading}
              />
            </form>
            
            {/* Invisible div for scroll targeting */}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Keyboard hints */}
          {messages.length === 1 && (
            <div className="text-center mt-12 text-xs text-stone-400 animate-fade-in" style={{ animationDelay: '1.2s' }}>
              <span className="hidden md:inline">Press ⌘K for keyboard shortcuts</span>
            </div>
          )}
        </div>
        
        {/* Keyboard shortcuts overlay */}
        {showKeyboardHints && (
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in"
            onClick={() => setShowKeyboardHints(false)}
          >
            <div className="bg-white rounded-lg p-8 max-w-sm shadow-xl">
              <h3 className="font-serif text-lg font-bold mb-4">Keyboard Shortcuts</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-stone-600">Send message</span>
                  <kbd className="px-2 py-1 bg-stone-100 rounded text-xs">Enter</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-600">Skip to brief</span>
                  <kbd className="px-2 py-1 bg-stone-100 rounded text-xs">⌘ Enter</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-600">Confirm brief</span>
                  <kbd className="px-2 py-1 bg-stone-100 rounded text-xs">Enter</kbd>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-600">Exit</span>
                  <kbd className="px-2 py-1 bg-stone-100 rounded text-xs">Esc</kbd>
                </div>
              </div>
              <div className="mt-4 text-xs text-stone-400 text-center">
                Press Esc to close
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Add CSS animations */}
      <style jsx>{`
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