# ADR-014: Simplified Project Creation - The 20% Implementation

**Status:** Proposed  
**Date:** 2025-08-14  
**Decision:** Remove all unnecessary complexity from project creation flow

## Context

Following advisor feedback and analysis, we've identified that our project creation system suffers from:
- Over-engineering (complexity theater)
- Solving problems we don't have yet
- Constraining GPT-5 rather than leveraging it
- Perfectionism preventing shipping

## Decision

Implement the "20% solution" - keep only what's essential for project creation.

## Technical Specification

### 1. Simplified State Management

**Before:** Complex state machine with phases
```typescript
interface ConversationState {
  phase: 'exploring' | 'converging' | 'generating_brief' | 'brief_generated';
  turnCount: number;
  conversationId: string;
  previousResponseId?: string;
  messages: Array<{ role: string; content: string }>;
  briefGenerated: boolean;
}
```

**After:** Minimal state
```typescript
interface SimpleState {
  conversationId: string;
  isGeneratingBrief: boolean;
  previousResponseId?: string; // Only for GPT-5 context
}
```

### 2. Simplified Brief Detection

**Before:** 40+ lines analyzing conversation
```typescript
function shouldGenerateBrief(userMessage: string, analysis: ConversationAnalysis, messages: any[]): boolean {
  // Complex detection of whether Futura asked the right question
  // Checking for specific phrasings
  // Multiple confirmation patterns
  // ... 40+ lines
}
```

**After:** Simple and clear
```typescript
function shouldGenerateBrief(messages: Message[]): boolean {
  if (messages.length < 4) return false; // Need context
  
  const lastUserMessage = messages[messages.length - 1].content.toLowerCase();
  
  // Direct request
  if (lastUserMessage.includes('create') && lastUserMessage.includes('brief')) {
    return true;
  }
  
  // Confirmation after Futura asks
  const recentAssistantAsked = messages.slice(-3).some(m => 
    m.role === 'assistant' && 
    m.content.toLowerCase().includes('ready') && 
    m.content.toLowerCase().includes('brief')
  );
  
  if (recentAssistantAsked && /^(yes|yeah|sure|ok|ready|go|please)/.test(lastUserMessage)) {
    return true;
  }
  
  return false;
}
```

### 3. Static System Prompt

**Before:** 150+ lines of adaptive prompting with phases
```typescript
function generateAdaptivePrompt(analysis: ConversationAnalysis): string {
  // Complex phase detection
  // Engagement level analysis
  // Contextual guidance
  // ... massive prompt generation
}
```

**After:** Single clear prompt
```typescript
const FUTURA_PROMPT = `You are Futura, a futures research agent helping someone create a research project.

Your personality:
- Warmly curious collaborative explorer
- Ask one clear question at a time
- Use natural language, avoid jargon

Your approach:
1. Understand what future fascinates them
2. Explore the angles they care about
3. After 2-3 exchanges, offer to create their brief

Key behaviors:
- When they say "all of it" or "everything", celebrate the scope and synthesize
- When they confirm they're ready, create the brief
- Trust your judgment about conversation flow

Remember: You're helping them articulate their curiosity, not categorizing their interests.`;
```

### 4. Brief Generation Prompt (Unchanged but Clarified)

```typescript
const BRIEF_GENERATION_PROMPT = `Create a research brief based on the conversation.

Format as plain text (no markdown):

[Clear simple title]


WHAT I'LL RESEARCH

I'll research [main topic]. [Why it matters]. [What I'll explore].


KEY QUESTIONS

1. [First exploratory question]
2. [Second exploratory question]
3. [Third exploratory question]


HOW I'LL EXPLORE THIS

[One paragraph about approach - looking across domains, tracking signals, exploring possibilities]

Keep under 200 words. Write as Futura in first person. Be curious and exploratory.`;
```

### 5. Simplified API Route Structure

```typescript
export async function POST(request: NextRequest) {
  const { messages, conversationId = 'default' } = await request.json();
  
  // Simple state lookup
  let state = conversationStates.get(conversationId) || {
    conversationId,
    isGeneratingBrief: false
  };
  
  // Check if should generate brief
  const wantsBrief = shouldGenerateBrief(messages);
  
  // Create SSE stream
  const stream = new ReadableStream({
    async start(controller) {
      if (wantsBrief && !state.isGeneratingBrief) {
        state.isGeneratingBrief = true;
        
        // Generate brief with GPT-5 or fallback
        const brief = await generateBrief(messages);
        controller.enqueue(encoder.encode(`BRIEF_GENERATION:${JSON.stringify(brief)}\n`));
        
        state.isGeneratingBrief = false;
      } else {
        // Regular conversation
        const response = await generateResponse(messages, FUTURA_PROMPT);
        
        // Stream the response
        for await (const chunk of response) {
          controller.enqueue(encoder.encode(chunk));
        }
      }
      
      controller.close();
    }
  });
  
  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

### 6. Simplified UI State

**Before:** Complex typewriter state management
```typescript
const [isTypewriterComplete, setIsTypewriterComplete] = useState(false);
const [isBriefLocked, setIsBriefLocked] = useState(false);
const [hasShownTypewriter, setHasShownTypewriter] = useState(false);
// Plus complex useEffect chains
```

**After:** Simple display logic
```typescript
const [showBrief, setShowBrief] = useState(false);
const [briefContent, setBriefContent] = useState(null);
// Brief appears immediately when ready
```

### 7. Remove Completely

- ❌ `analyzeConversation()` function (210+ lines)
- ❌ `generateAdaptivePrompt()` function (100+ lines)
- ❌ Phase tracking
- ❌ Turn counting
- ❌ Engagement level detection
- ❌ Typewriter effect (optional - keep if truly simple)
- ❌ Complex conversation patterns

## Implementation Plan

1. **Backup current implementation** (already complex version works)
2. **Create new simplified route** at `/api/project-conversation-simple/route.ts`
3. **Test side by side** to ensure no regression
4. **Replace complex version** once validated
5. **Clean up unused code**

## Benefits

1. **Code reduction**: ~60% less code to maintain
2. **Faster responses**: Less processing overhead
3. **Easier debugging**: Clear, linear flow
4. **Better conversations**: GPT-5 unconstrained
5. **Faster iteration**: Simple to modify based on real usage

## Risks

1. **Edge cases**: Some unhandled scenarios
   - *Mitigation*: Ship and learn what actually matters
   
2. **Less control**: Can't force specific flows
   - *Mitigation*: Trust GPT-5's training
   
3. **No analytics**: Less detailed tracking
   - *Mitigation*: Add only what we need later

## Success Criteria

1. Users can create projects successfully
2. Conversations feel natural
3. Brief generation works reliably
4. Code is maintainable
5. System is easy to modify based on feedback

## Quotes from Analysis

> "We're not helping GPT-5 - we're constraining it."

> "This is organizational theater. We're creating complex scaffolding to make ourselves feel in control of something that's inherently conversational and fluid."

> "Every hour spent perfecting edge cases is an hour not spent getting users."

> "Ship it, learn from reality, not from our imagination of what might go wrong."

## Decision

Implement the 20% solution immediately. The current complex system works but is over-engineered. The simplified version will:
- Be easier to maintain
- Respond faster
- Allow GPT-5 to work naturally
- Let us learn from real usage

## Related Documents

- [ADR-013: Simplification Principles](./13-simplification-principles.md)
- [ADR-012: Original Project Creation Architecture](./12-new-project-creation-architecture.md)
- [Advisor Feedback (2025-08-14)](../../../01%20Projects/mvp-build/advisor-feedback.md)