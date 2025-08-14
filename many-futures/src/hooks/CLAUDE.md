# Hook Patterns & Data Handling Context

## Conversational State Management

### SSE Stream Processing
```typescript
// Essential pattern for handling Server-Sent Events
const sendMessage = useCallback(async (content: string) => {
  const response = await fetch('/api/project-conversation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages: apiMessages, conversationId }),
    signal: abortControllerRef.current.signal
  });
  
  // Handle SSE streaming
  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  
  let assistantMessage = '';
  let messageStarted = false;
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    const chunk = decoder.decode(value, { stream: true });
    
    // Parse special signals
    if (chunk.startsWith('BRIEF_GENERATION:')) {
      const briefData = chunk.substring('BRIEF_GENERATION:'.length).trim();
      const brief = JSON.parse(briefData);
      setProjectBrief(brief);
      setPhase('brief_generated');
      break;
    }
    
    // Regular text streaming
    assistantMessage += chunk;
    updateMessage(assistantMessage);
  }
}, [messages, conversationId]);
```

### Abort Controller Pattern
```typescript
// Critical for preventing race conditions
const abortControllerRef = useRef<AbortController | null>(null);

const sendMessage = useCallback(async (content: string) => {
  // Cancel any ongoing request
  if (abortControllerRef.current) {
    abortControllerRef.current.abort();
  }
  
  // Create new controller for this request
  abortControllerRef.current = new AbortController();
  
  try {
    const response = await fetch('/api/endpoint', {
      signal: abortControllerRef.current.signal
    });
    // ... handle response
  } catch (err: any) {
    if (err.name === 'AbortError') {
      console.log('Request was aborted');
      return; // Don't treat as error
    }
    // Handle real errors
  } finally {
    abortControllerRef.current = null;
  }
}, []);

// Cleanup on unmount
useEffect(() => {
  return () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };
}, []);
```

## Data Structure Consistency

### Message Format Handling
```typescript
// Handle multiple message formats from different APIs
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// API messages (exclude opening message for context)
const apiMessages = [...messages.slice(1), userMessage].map(msg => ({
  role: msg.role,
  content: msg.content
}));
```

### Brief Generation Detection
```typescript
// Parse structured data from SSE stream
if (chunk.startsWith('BRIEF_GENERATION:')) {
  const briefData = chunk.substring('BRIEF_GENERATION:'.length).trim();
  console.log('Received brief data:', briefData); // Essential debug logging
  
  try {
    const brief = JSON.parse(briefData);
    console.log('Parsed brief:', brief); // Verify structure
    setProjectBrief(brief);
    setPhase('brief_generated');
  } catch (e) {
    console.error('Failed to parse brief:', e);
    console.error('Raw brief data:', briefData); // Debug malformed JSON
  }
}
```

### Phase Management
```typescript
// Track conversation phases for UI state
export type ConversationPhase = 'opening' | 'exploring' | 'converging' | 'brief_generated';

// Phase detection logic
if (assistantMessage.toLowerCase().includes('ready for me to create') || 
    assistantMessage.toLowerCase().includes('create your project brief')) {
  setPhase('converging');
} else if (turnCount >= 2) {
  setPhase('converging');
} else {
  setPhase('exploring');
}
```

## Error Handling & Fallbacks

### Graceful Degradation
```typescript
try {
  // Primary API call
  await handleAPICall();
} catch (err: any) {
  if (err.name === 'AbortError') {
    return; // User action, not an error
  }
  
  console.error('API error:', err);
  setError('Failed to connect to Futura. Please try again.');
  
  // Fallback response
  const fallbackMessage: Message = {
    id: `msg-${Date.now()}`,
    role: 'assistant',
    content: getFallbackResponse(turnCount),
    timestamp: new Date()
  };
  
  setMessages(prev => [...prev, fallbackMessage]);
}
```

### Turn-Based Fallbacks
```typescript
function getFallbackResponse(turnCount: number): string {
  const responses = [
    "That's fascinating! Can you tell me more about your role and what specific aspects interest you most?",
    "I understand. Are you more interested in technological shifts, market dynamics, or social changes?",
    "I have enough context to start researching. Ready for me to create your project brief, or would you like to shape this further?",
    "Perfect! I'll create a comprehensive research brief based on our conversation."
  ];
  
  return responses[Math.min(turnCount, responses.length - 1)] ?? responses[responses.length - 1]!;
}
```

## State Reset & Cleanup

### Complete State Reset
```typescript
const reset = useCallback(() => {
  // Cancel any ongoing request
  if (abortControllerRef.current) {
    abortControllerRef.current.abort();
  }
  
  // Reset all state atomically
  setMessages([OPENING_MESSAGE]);
  setPhase('opening');
  setIsLoading(false);
  setError(null);
  setProjectBrief(null);
  setTurnCount(0);
  conversationId.current = `conv-${Date.now()}`;
}, []);
```

### Brief Persistence
```typescript
const saveBrief = useCallback((title: string, brief: string) => {
  setProjectBrief({ title, brief });
  
  // In production, persist to database
  // await updateProjectBrief(projectId, { title, brief });
}, []);
```

## Common Pitfalls & Solutions

### Race Condition Prevention
```typescript
// ❌ BAD - Multiple concurrent requests
const [isLoading, setIsLoading] = useState(false);

const sendMessage = async (content: string) => {
  if (isLoading) return; // Not enough - race conditions possible
  setIsLoading(true);
  // API call
  setIsLoading(false);
};

// ✅ GOOD - Abort controller prevents races
const abortControllerRef = useRef<AbortController | null>(null);

const sendMessage = useCallback(async (content: string) => {
  if (abortControllerRef.current) {
    abortControllerRef.current.abort(); // Cancel previous
  }
  // ... rest of implementation
}, []);
```

### Memory Leak Prevention
```typescript
// ❌ BAD - No cleanup
useEffect(() => {
  const interval = setInterval(() => {}, 1000);
}, []);

// ✅ GOOD - Always cleanup
useEffect(() => {
  const interval = setInterval(() => {}, 1000);
  return () => clearInterval(interval);
}, []);

// ✅ GOOD - Cleanup refs
useEffect(() => {
  return () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };
}, []);
```

### Message State Updates
```typescript
// Handle progressive message updates during streaming
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
```

## Debug Patterns

### Essential Logging
```typescript
// Always log when debugging SSE streams
console.log('Received chunk:', chunk);
console.log('Current assistant message:', assistantMessage);
console.log('Phase transition:', { from: previousPhase, to: newPhase });

// Log parsed data structures
console.log('Parsed brief:', brief);
console.log('Full brief object:', briefObject);
```

### State Debugging
```typescript
// Debug state changes
useEffect(() => {
  console.log('Messages updated:', messages.length);
  console.log('Latest message:', messages[messages.length - 1]);
}, [messages]);

useEffect(() => {
  console.log('Phase changed:', phase);
}, [phase]);
```

## Performance Optimization

### Dependency Arrays
```typescript
// ❌ BAD - Missing dependencies
const sendMessage = useCallback(async (content: string) => {
  // Uses messages, conversationId
}, []); // Missing dependencies!

// ✅ GOOD - Complete dependencies
const sendMessage = useCallback(async (content: string) => {
  // Uses messages, conversationId
}, [messages, conversationId]);
```

### Stable References
```typescript
// Use refs for values that don't need to trigger re-renders
const conversationId = useRef(`conv-${Date.now()}`);
const abortControllerRef = useRef<AbortController | null>(null);

// Not reactive state
const [conversationId, setConversationId] = useState(); // ❌ Causes re-renders
```

## Hook Interface Best Practices

### Return Type Structure
```typescript
interface UseProjectConversationReturn {
  // State (read-only)
  messages: Message[];
  phase: ConversationPhase;
  isLoading: boolean;
  error: string | null;
  projectBrief: ProjectBrief | null;
  turnCount: number;
  
  // Actions (functions)
  sendMessage: (content: string) => Promise<void>;
  reset: () => void;
  saveBrief: (title: string, brief: string) => void;
}
```

### Error Boundaries
```typescript
// Return error state, don't throw
return {
  messages,
  error: error || null,
  isLoading,
  // ... other state
};

// Not:
if (error) {
  throw error; // ❌ Makes error boundaries complex
}
```

## Related Files
- `/src/app/api/project-conversation/route.ts` - Server-side SSE implementation
- `/src/app/(dashboard)/projects/new/page.tsx` - Hook usage patterns
- `/src/components/project/BriefCanvas.tsx` - Brief state consumer