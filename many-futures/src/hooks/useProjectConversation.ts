"use client";

import { useState, useCallback, useRef } from 'react';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ProjectBrief {
  title: string;
  brief: string;
}

export type ConversationPhase = 'opening' | 'exploring' | 'converging' | 'brief_generated';

interface UseProjectConversationReturn {
  // State
  messages: Message[];
  phase: ConversationPhase;
  isLoading: boolean;
  error: string | null;
  projectBrief: ProjectBrief | null;
  turnCount: number;
  
  // Actions
  sendMessage: (content: string) => Promise<void>;
  reset: () => void;
  saveBrief: (title: string, brief: string) => void;
}

const OPENING_MESSAGE: Message = {
  id: 'opening',
  role: 'assistant',
  content: "I research possible futures and their implications. What future would you like to explore?",
  timestamp: new Date()
};

export function useProjectConversation(): UseProjectConversationReturn {
  const [messages, setMessages] = useState<Message[]>([OPENING_MESSAGE]);
  const [phase, setPhase] = useState<ConversationPhase>('opening');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projectBrief, setProjectBrief] = useState<ProjectBrief | null>(null);
  const [turnCount, setTurnCount] = useState(0);
  
  const conversationId = useRef(`conv-${Date.now()}`);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;
    
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Add user message
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);
    setTurnCount(prev => prev + 1);
    
    try {
      // Create new abort controller for this request
      abortControllerRef.current = new AbortController();
      
      // Prepare messages for API (exclude opening message)
      const apiMessages = [...messages.slice(1), userMessage].map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      
      // Set timeout (30 seconds)
      const timeoutId = setTimeout(() => {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
      }, 30000);
      
      const response = await fetch('/api/project-conversation-simple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          conversationId: conversationId.current
        }),
        signal: abortControllerRef.current.signal
      });
      
      // Clear timeout on successful response
      clearTimeout(timeoutId);
      
      // Handle different error statuses
      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Too many requests. Please wait a moment and try again.');
        } else if (response.status === 400) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Invalid request');
        } else if (response.status >= 500) {
          throw new Error('Our servers are experiencing issues. Please try again in a moment.');
        } else {
          throw new Error('Failed to connect to Futura. Please check your connection and try again.');
        }
      }
      
      // Handle SSE streaming
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      if (!reader) {
        throw new Error('No response body');
      }
      
      let assistantMessage = '';
      let currentMessageId = `msg-${Date.now() + 1}`;
      let messageStarted = false;
      
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        
        // Check for BRIEF_GENERATION signal
        if (chunk.startsWith('BRIEF_GENERATION:')) {
          const briefData = chunk.substring('BRIEF_GENERATION:'.length).trim();
          console.log('Received brief data:', briefData);
          try {
            const brief = JSON.parse(briefData);
            console.log('Parsed brief:', brief);
            setProjectBrief(brief);
            setPhase('brief_generated');
            
            // If we have a projectId, redirect to the created project
            if (brief.projectId) {
              console.log('Project created with ID:', brief.projectId);
              // Redirect after a short delay to show the brief
              setTimeout(() => {
                window.location.href = `/projects/${brief.projectId}`;
              }, 3000);
            }
          } catch (e) {
            console.error('Failed to parse brief:', e);
            console.error('Raw brief data:', briefData);
          }
          break;
        }
        
        // Regular text streaming
        assistantMessage += chunk;
        
        // Update or create assistant message
        if (!messageStarted) {
          messageStarted = true;
          setMessages(prev => [...prev, {
            id: currentMessageId,
            role: 'assistant',
            content: assistantMessage,
            timestamp: new Date()
          }]);
        } else {
          // Update existing message
          setMessages(prev => prev.map(msg => 
            msg.id === currentMessageId 
              ? { ...msg, content: assistantMessage.trim() }
              : msg
          ));
        }
        
        // Update phase based on content
        if (assistantMessage.toLowerCase().includes('ready for me to create') || 
            assistantMessage.toLowerCase().includes('create your project brief')) {
          setPhase('converging');
        } else if (turnCount >= 2) {
          setPhase('converging');
        } else {
          setPhase('exploring');
        }
      }
      
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // Check if it was a timeout
        if (abortControllerRef.current?.signal.reason === 'timeout') {
          setError('Request timed out. Please try again.');
        } else {
          console.log('Request was aborted by user');
          return;
        }
      } else if (err.message) {
        // Use the specific error message we set
        setError(err.message);
      } else {
        // Generic error
        console.error('Conversation error:', err);
        setError('Something went wrong. Please try again.');
      }
      
      // Only add fallback message for non-critical errors
      if (err.name !== 'AbortError' && !err.message?.includes('limit reached')) {
        const fallbackMessage: Message = {
          id: `msg-${Date.now() + 1}`,
          role: 'assistant',
          content: getFallbackResponse(turnCount),
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, fallbackMessage]);
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [messages, isLoading, turnCount]);
  
  const reset = useCallback(() => {
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    setMessages([OPENING_MESSAGE]);
    setPhase('opening');
    setIsLoading(false);
    setError(null);
    setProjectBrief(null);
    setTurnCount(0);
    conversationId.current = `conv-${Date.now()}`;
  }, []);
  
  const saveBrief = useCallback((title: string, brief: string) => {
    setProjectBrief({ title, brief });
  }, []);
  
  return {
    messages,
    phase,
    isLoading,
    error,
    projectBrief,
    turnCount,
    sendMessage,
    reset,
    saveBrief
  };
}

// Fallback responses when API fails
function getFallbackResponse(turnCount: number): string {
  const responses = [
    "That's fascinating! Can you tell me more about your role and what specific aspects interest you most?",
    "I understand. Are you more interested in technological shifts, market dynamics, or social changes?",
    "I have enough context to start researching. Ready for me to create your project brief, or would you like to shape this further?",
    "Perfect! I'll create a comprehensive research brief based on our conversation."
  ];
  
  return responses[Math.min(turnCount, responses.length - 1)] ?? responses[responses.length - 1]!;
}