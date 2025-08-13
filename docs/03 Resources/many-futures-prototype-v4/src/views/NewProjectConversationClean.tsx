import { useState, useRef, useEffect } from 'react';
import type { FormEvent } from 'react';
import { X } from 'lucide-react';
import { AvatarOrb } from '../components/brand/AvatarOrb';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface ProjectBrief {
  title: string;
  brief: string;
}

export function NewProjectConversationClean() {
  // Core state
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showBrief, setShowBrief] = useState(false);
  const [projectBrief, setProjectBrief] = useState<ProjectBrief | null>(null);
  const [isEditingBrief, setIsEditingBrief] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  
  // Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const briefRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Initialize with Futura's greeting
  useEffect(() => {
    if (!hasInitialized) {
      setHasInitialized(true);
      const greeting: Message = {
        id: 'greeting',
        role: 'assistant',
        content: 'I research possible futures and their implications. What future would you like to explore?'
      };
      setMessages([greeting]);
    }
  }, [hasInitialized]);
  
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
  
  // Send message to API
  const sendMessage = async (userMessage: string) => {
    // Add user message immediately
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userMessage
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    
    // Prepare messages for API (exclude greeting)
    const apiMessages = [...messages.filter(m => m.id !== 'greeting'), userMsg].map(m => ({
      role: m.role,
      content: m.content
    }));
    
    try {
      // Cancel any existing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      abortControllerRef.current = new AbortController();
      
      const response = await fetch('/api/project-conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: apiMessages }),
        signal: abortControllerRef.current.signal
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Handle SSE stream
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';
      const assistantId = `assistant-${Date.now()}`;
      
      if (!reader) {
        throw new Error('No response body');
      }
      
      // Add empty assistant message that we'll update
      setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '' }]);
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            
            try {
              // For simple text streaming, just append the data
              assistantMessage += data;
              
              // Update the assistant message in place
              setMessages(prev => prev.map(m => 
                m.id === assistantId 
                  ? { ...m, content: assistantMessage }
                  : m
              ));
            } catch (e) {
              // If it's not JSON, treat as plain text
              assistantMessage += data;
              setMessages(prev => prev.map(m => 
                m.id === assistantId 
                  ? { ...m, content: assistantMessage }
                  : m
              ));
            }
          }
        }
      }
      
      // Check if we should show brief
      if (assistantMessage.toLowerCase().includes('ready for me to create') || 
          assistantMessage.toLowerCase().includes('create your project brief')) {
        // Auto-generate brief after a short delay
        setTimeout(() => {
          generateBrief([...messages, userMsg, { id: assistantId, role: 'assistant', content: assistantMessage }]);
        }, 1000);
      }
      
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Request aborted');
      } else {
        console.error('Error sending message:', error);
        // Add error message
        setMessages(prev => [...prev, {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: 'I encountered an error. Please try again or refresh the page.'
        }]);
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };
  
  // Handle form submission
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || isLoading) return;
    
    // Check if user is confirming brief creation
    if (showBrief && !input.trim()) {
      window.location.hash = '#project';
      return;
    }
    
    sendMessage(input.trim());
  };
  
  // Generate project brief from conversation
  const generateBrief = (conversationMessages: Message[]) => {
    const conversation = conversationMessages
      .map(m => m.content)
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
    if (messages.length === 1) return 'What future would you like to explore?';
    if (isLoading) return 'Futura is thinking...';
    if (showBrief) return 'Press Enter to confirm, or continue the conversation...';
    return 'Type your response...';
  };
  
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
          {messages.length > 0 && (
            <div className="flex justify-center mb-8">
              <div className="rounded-full overflow-hidden">
                <AvatarOrb size={60} />
              </div>
            </div>
          )}
          
          {/* Conversation */}
          {messages.map((message, index) => (
            <div key={message.id} className="animate-fade-in-up">
              <div className={
                message.role === 'assistant'
                  ? 'font-lora text-xl md:text-2xl text-gray-900 leading-relaxed'
                  : 'font-sans text-lg md:text-xl text-gray-700 leading-relaxed'
              }>
                {message.content}
              </div>
              
              {/* Separator dot */}
              {index < messages.length - 1 && (
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
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={getPlaceholder()}
            disabled={isLoading}
            className="w-full bg-transparent border-b border-gray-200 pb-2 outline-none font-sans text-lg md:text-xl text-gray-700 placeholder-gray-400 focus:border-gray-400 transition-colors disabled:opacity-50"
          />
        </form>
      </div>
    </div>
  );
}