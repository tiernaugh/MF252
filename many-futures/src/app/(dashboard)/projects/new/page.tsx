"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Card } from "~/components/ui/card";
import { ArrowLeft, Send, Sparkles } from "lucide-react";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

// Mock Futura responses based on conversation progress
const getFuturaResponse = (turnCount: number, userMessage: string): string => {
  const responses = [
    "That's fascinating! Can you tell me more about your role and what specific aspects of this future interest you most?",
    "I understand. Now, what's the context for your curiosity? Are you exploring this for your organization, personal growth, or something else?",
    "Great context. What are the key areas you'd like me to focus on? For example, are you more interested in technological shifts, market dynamics, cultural changes, or regulatory developments?",
    "Perfect! I have everything I need to start researching for you. Let me create your project brief..."
  ];
  
  return responses[Math.min(turnCount, responses.length - 1)] || responses[responses.length - 1];
};

const generateBrief = (messages: Message[]): string => {
  return `# Project Brief

Based on our conversation, I'll research and deliver weekly intelligence on your chosen future.

## Your Context
You're exploring how emerging trends and signals will reshape your industry and strategic position.

## Research Focus Areas
- Technological disruptions and opportunities
- Changing market dynamics and competitive landscape
- Cultural and behavioral shifts
- Regulatory and compliance evolution

## Delivery Preferences
- **Tone**: Provocative and thought-provoking
- **Speculation Level**: High - exploring edge cases and possibilities
- **Cadence**: Weekly episodes, delivered every Tuesday

I'll start researching immediately and your first episode will be ready in 24 hours.`;
};

export default function NewProjectPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [briefGenerated, setBriefGenerated] = useState(false);
  const [briefText, setBriefText] = useState("");
  const [briefProgress, setBriefProgress] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initial greeting
  useEffect(() => {
    setTimeout(() => {
      setMessages([{
        id: "1",
        role: "assistant",
        content: "Hi! I'm Futura, your futures research agent. What future are you curious about? It could be an industry trend, a technology shift, or any change you want to understand better."
      }]);
    }, 500);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input after bot responds
  useEffect(() => {
    if (!isTyping && !briefGenerated) {
      inputRef.current?.focus();
    }
  }, [isTyping, briefGenerated]);

  // Typewriter effect for brief
  useEffect(() => {
    if (briefGenerated && briefText) {
      const fullText = briefText;
      let currentIndex = 0;
      setBriefProgress(0);
      
      const typeInterval = setInterval(() => {
        if (currentIndex <= fullText.length) {
          setBriefProgress((currentIndex / fullText.length) * 100);
          currentIndex += 3; // Type 3 characters at a time
        } else {
          clearInterval(typeInterval);
        }
      }, 20);
      
      return () => clearInterval(typeInterval);
    }
  }, [briefGenerated, briefText]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim()) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);
    
    // Simulate AI thinking
    setTimeout(() => {
      const turnCount = messages.filter(m => m.role === "user").length;
      
      if (turnCount >= 3) {
        // Generate brief after 4 turns
        const brief = generateBrief([...messages, userMessage]);
        setBriefText(brief);
        setBriefGenerated(true);
        setIsTyping(false);
      } else {
        // Continue conversation
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: getFuturaResponse(turnCount, userMessage.content)
        };
        setMessages(prev => [...prev, aiResponse]);
        setIsTyping(false);
      }
    }, 1500);
  };

  const handleCreateProject = () => {
    // In production, save to database
    console.log("Creating project with brief:", briefText);
    router.push("/projects");
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link href="/projects">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to projects
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-stone-900">Create New Project</h1>
        <p className="text-stone-600 mt-1">
          Tell Futura what future you want to explore
        </p>
      </div>

      {/* Conversation UI */}
      <Card className="h-[600px] flex flex-col">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-start space-x-2 max-w-[80%] ${
                message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
              }`}>
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 bg-stone-900 rounded-full flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                )}
                <div className={`rounded-lg px-4 py-2 ${
                  message.role === 'user'
                    ? 'bg-stone-900 text-white'
                    : 'bg-stone-100 text-stone-900'
                }`}>
                  {message.content}
                </div>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="flex items-start space-x-2">
                <div className="w-8 h-8 bg-stone-900 rounded-full flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white animate-pulse" />
                </div>
                <div className="bg-stone-100 rounded-lg px-4 py-2">
                  <span className="text-stone-600">Futura is thinking...</span>
                </div>
              </div>
            </div>
          )}
          
          {briefGenerated && (
            <div className="mt-6 p-6 bg-gradient-to-br from-stone-50 to-stone-100 rounded-lg border border-stone-200">
              <div className="flex items-center mb-4">
                <Sparkles className="w-5 h-5 text-stone-700 mr-2" />
                <h3 className="font-semibold text-stone-900">Your Project Brief</h3>
              </div>
              <div className="prose prose-stone prose-sm max-w-none">
                <div style={{ 
                  maxHeight: '300px', 
                  overflow: 'hidden',
                  position: 'relative'
                }}>
                  <div style={{
                    opacity: briefProgress / 100,
                    transition: 'opacity 0.1s'
                  }}>
                    {briefText.split('\n').map((line, i) => {
                      if (line.startsWith('#')) {
                        const text = line.replace(/^#+\s/, '');
                        return <h4 key={i} className="font-semibold mt-3 mb-1">{text}</h4>;
                      }
                      if (line.startsWith('-')) {
                        return <li key={i} className="ml-4">{line.substring(1).trim()}</li>;
                      }
                      if (line.trim()) {
                        return <p key={i} className="mb-2">{line}</p>;
                      }
                      return null;
                    })}
                  </div>
                  {briefProgress < 100 && (
                    <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-stone-100 to-transparent" />
                  )}
                </div>
              </div>
              {briefProgress >= 100 && (
                <div className="mt-6 flex gap-3">
                  <Button 
                    onClick={handleCreateProject}
                    className="bg-stone-900 hover:bg-stone-800"
                  >
                    Create Project
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setBriefGenerated(false);
                      setBriefText("");
                    }}
                  >
                    Continue Shaping
                  </Button>
                </div>
              )}
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        {!briefGenerated && (
          <form onSubmit={handleSubmit} className="border-t p-4">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                disabled={isTyping}
                className="flex-1"
              />
              <Button 
                type="submit" 
                disabled={isTyping || !input.trim()}
                className="bg-stone-900 hover:bg-stone-800"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}