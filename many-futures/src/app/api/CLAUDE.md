# API Routes Context

## GPT-5 Integration Patterns

### Responses API Structure (CRITICAL: Parameter names matter!)
```typescript
// ✅ CORRECT - GPT-5 Responses API
const response = await openaiClient.responses.create({
  model: 'gpt-5-mini',
  input: conversationArray,        // ACTUAL conversation messages (array)
  instructions: systemPrompt,      // System prompt/template (string)
  reasoning: { effort: 'minimal' }, // For conversation speed
  text: { verbosity: 'low' },     // Keep responses concise
  previous_response_id: state.previousResponseId  // Context continuity
});

// Access response content:
const responseText = response.output_text;  // NOT choices[0].message.content
const responseId = response.id;             // Store for next turn

// ❌ COMMON MISTAKE - Don't swap input/instructions
const response = await openai.responses.create({
  model: 'gpt-5-mini',
  input: systemPrompt,        // ❌ WRONG - This is instructions
  instructions: messages,     // ❌ WRONG - This is input
});
```

### Hybrid Fallback Pattern
```typescript
try {
  // Primary: GPT-5 Responses API
  const response = await openaiClient.responses.create({
    model: 'gpt-5-mini',
    input: conversationArray,
    instructions: systemPrompt,
    reasoning: { effort: 'minimal' },
    text: { verbosity: 'low' }
  });
  
  return response.output_text;
  
} catch (error) {
  console.log('GPT-5 unavailable, falling back to GPT-4o-mini');
  
  // Fallback: Vercel AI SDK
  const { textStream } = await streamText({
    model: openai('gpt-4o-mini'),
    messages: conversationArray,
    temperature: 0.8,
  });
  
  return textStream;
}
```

## Server-Sent Events (SSE) Streaming

### Response Setup
```typescript
// Set SSE headers
res.setHeader('Content-Type', 'text/event-stream');
res.setHeader('Cache-Control', 'no-cache');
res.setHeader('Connection', 'keep-alive');

// Progressive text streaming (better UX)
for (let i = 0; i < text.length; i += 20) {
  res.write(text.slice(i, i + 20));
  await new Promise(resolve => setTimeout(resolve, 10));
}

// Special signals for structured data
res.write(`BRIEF_GENERATION:${JSON.stringify(briefData)}\n`);
```

### Signal Patterns
```typescript
// Use prefixed signals to separate concerns
'BRIEF_GENERATION:{"title": "...", "brief": "..."}'
'EPISODE_READY:{"id": "123", "status": "PUBLISHED"}'
'ERROR:{"message": "...", "code": "..."}'

// Client parsing:
if (chunk.startsWith('BRIEF_GENERATION:')) {
  const data = chunk.substring('BRIEF_GENERATION:'.length).trim();
  const brief = JSON.parse(data);
  // Handle brief data
}
```

## Message Content Extraction

### Handle Multiple Formats (Vercel AI SDK Compatibility)
```typescript
function extractMessageContent(msg: any): string {
  // Handle string content (simple format)
  if (typeof msg.content === 'string') {
    return msg.content;
  }
  
  // Handle parts array (Vercel AI SDK format)
  if (msg.parts && Array.isArray(msg.parts)) {
    return msg.parts
      .filter(part => part.type === 'text')
      .map(part => part.text || '')
      .join('');
  }
  
  // Handle object with text property
  if (msg.content && typeof msg.content === 'object' && msg.content.text) {
    return msg.content.text;
  }
  
  // Fallback
  return msg.content || '';
}

// Usage in API routes:
const conversationArray = messages.map(msg => ({
  role: msg.role,
  content: extractMessageContent(msg)
}));
```

## Conversation State Management

### Per-Conversation State Tracking
```typescript
// Use Map for multiple concurrent conversations
const conversationStates = new Map<string, {
  turnCount: number;
  phase: 'exploring' | 'converging' | 'generating_brief';
  previousResponseId?: string;
  conversationHistory: Array<{role: string, content: string}>;
}>();

// Initialize or update state
const state = conversationStates.get(conversationId) || {
  turnCount: 0,
  phase: 'exploring',
  conversationHistory: []
};

state.turnCount += 1;
state.conversationHistory.push({ role: 'user', content: userMessage });

conversationStates.set(conversationId, state);
```

### Brief Generation Detection
```typescript
// Check for convergence signals in recent assistant messages
function shouldGenerateBrief(messages: Message[], turnCount: number): boolean {
  const lastAssistantMessages = messages
    .filter(m => m.role === 'assistant')
    .slice(-3); // Check last 3 assistant messages
    
  const hasConvergenceSignal = lastAssistantMessages.some(msg => 
    msg.content.toLowerCase().includes('ready for me to create') ||
    msg.content.toLowerCase().includes('create your project brief')
  );
  
  // Force brief generation after turn 5 for affirmative responses
  const isAffirmative = userMessage.toLowerCase().match(/^(yes|yeah|sure|ok|okay|create|generate)/);
  
  return hasConvergenceSignal || (turnCount >= 5 && isAffirmative);
}
```

## Common Issues & Debug Patterns

### API Response Structure Debugging
```typescript
// Always log raw responses when debugging
console.log('GPT-5 Response:', {
  id: response.id,
  output_text: response.output_text?.substring(0, 100),
  full_response: response
});

// Validate response structure
if (!response.output_text) {
  console.error('Missing output_text in GPT-5 response:', response);
  throw new Error('Invalid GPT-5 response structure');
}
```

### Input Validation Patterns
```typescript
// Always validate input parameter is not empty
if (!conversationArray || conversationArray.length === 0) {
  throw new Error('input parameter cannot be empty');
}

// Validate message structure
const isValidMessage = (msg: any) => 
  msg && 
  typeof msg.role === 'string' && 
  typeof msg.content === 'string' && 
  msg.content.trim().length > 0;

const validMessages = conversationArray.filter(isValidMessage);
if (validMessages.length === 0) {
  throw new Error('No valid messages in conversation');
}
```

## Error Handling Best Practices

### Graceful Fallbacks
```typescript
try {
  // Primary API call
  const response = await primaryAPICall();
  return response;
} catch (error) {
  console.error('Primary API failed:', error);
  
  // Log error details but don't expose to client
  if (error.status === 429) {
    // Rate limited - use different fallback
    return await rateLimitedFallback();
  } else if (error.status >= 500) {
    // Server error - use cached response
    return getCachedResponse();
  } else {
    // Other error - use simple fallback
    return getSimpleFallback();
  }
}
```

### Token Usage Tracking (CRITICAL)
```typescript
// ALWAYS track token usage on every AI call
await logTokenUsage({
  organizationId: currentOrgId,
  model: 'gpt-5-mini',
  operation: 'project-conversation',
  promptTokens: usage.prompt_tokens || 0,
  completionTokens: usage.completion_tokens || 0,
  totalCost: calculateCost(usage)
});

// Check cost limits BEFORE making calls
const dailyUsage = await getDailyUsage(currentOrgId);
if (dailyUsage > MAX_DAILY_COST) {
  throw new Error('Daily cost limit exceeded');
}
```

## Development Workflow

### Local Development
```typescript
// Use environment flags for different behaviors
const USE_GPT5 = process.env.NODE_ENV === 'production' || 
                 process.env.FORCE_GPT5 === 'true';

if (USE_GPT5) {
  // Real GPT-5 API calls
} else {
  // Mock responses for development
  return getMockResponse(turnCount);
}
```

### Testing Patterns
```typescript
// Test with various input formats
const testCases = [
  { messages: [{ role: 'user', content: 'hello' }] },
  { messages: [{ role: 'user', parts: [{ type: 'text', text: 'hello' }] }] },
  { messages: [{ role: 'user', content: { text: 'hello' } }] }
];

testCases.forEach(testCase => {
  const extracted = extractMessageContent(testCase.messages[0]);
  console.assert(extracted === 'hello', 'Content extraction failed');
});
```

## Related Files
- `/src/hooks/useProjectConversation.ts` - Client-side state management
- `/src/app/(dashboard)/projects/new/page.tsx` - UI component usage
- `/src/app/api/project-conversation/route.ts` - Implementation reference