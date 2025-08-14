# ADR-013: Simplification Principles - The 20% Solution

**Status:** Accepted  
**Date:** 2025-08-14  
**Decision:** Remove complexity theater, ship the minimum viable conversation

## The Core Insight

We've been using complexity as a security blanket. Every edge case we handle, every state we track, every condition we add - it makes us feel in control. But we're actually making the system more brittle and harder to maintain.

## The Dysfunction We're Solving

### 1. Solution Looking for a Problem
- Detecting "all of it" with complex logic when GPT-5 already understands it
- Creating elaborate phase tracking for natural conversation flow
- Engineering vanity features (typewriter) that add complexity for minimal value

### 2. Organizational Theater
Our state machine was theater:
```
exploring → converging → generating_brief → brief_generated
```
This gave us the illusion of control over something inherently fluid. GPT-5 was trained on millions of conversations - it knows how to have one.

### 3. The Perfectionism Trap
```
Hard-coded rules → Edge cases break them → 
Principle-based approach → Too vague → 
Add specifics back → More edge cases → 
Abstract again → Circle continues
```

## The Uncomfortable Truths

1. **Users don't care about:**
   - Whether we detected their intent correctly
   - What phase the conversation is in
   - How many turns have passed

2. **Users care about:**
   - Can I explain what I want?
   - Does Futura understand me?
   - Can I get started on my project?

3. **Every hour perfecting edge cases is an hour not spent:**
   - Getting users
   - Learning what they actually need
   - Building differentiating features

## The 20% Solution

### Keep Only What's Essential
1. **Simple conversation** - Messages in, messages out
2. **Simple trigger** - User wants brief? Generate it.
3. **Simple display** - Show the brief, let them edit
4. **Simple completion** - Create project, done.

### Remove Everything Else
- ❌ All phase tracking
- ❌ All engagement analysis
- ❌ All turn counting
- ❌ Typewriter effect (or make it truly simple)
- ❌ Adaptive prompting
- ❌ Complex intent detection

### The New Architecture

```typescript
// Before: 600+ lines of state management
interface ConversationState {
  phase: 'exploring' | 'converging' | 'generating_brief' | 'brief_generated';
  turnCount: number;
  conversationId: string;
  previousResponseId?: string;
  messages: Array<{ role: string; content: string }>;
  briefGenerated: boolean;
}

// After: Just what we need
interface SimpleState {
  messages: Message[];
  generatingBrief: boolean;
}
```

## Implementation Principles

### 1. Trust the Model
GPT-5 doesn't need our scaffolding. It can:
- Have natural conversations
- Know when to offer a brief
- Understand user intent
- Handle edge cases

### 2. Ship to Learn
With 100 real users, we'll learn:
- What they actually say (not what we imagine)
- Where they actually get stuck (not where we worry)
- What they actually want (not what we think)

### 3. Complexity !== Quality
Simple code that ships beats perfect code that doesn't.

## The Meta-Learning

**We're not helping GPT-5 - we're constraining it.**

Every rule we add, every phase we force, every pattern we detect - we're putting guardrails on something that works better without them.

## Specific Simplifications

### 1. Brief Detection
```typescript
// Before: 40+ lines analyzing conversation
// After: 5 lines
function shouldGenerateBrief(messages) {
  const lastMsg = messages[messages.length - 1].content.toLowerCase();
  const hasContext = messages.length >= 4;
  const wantsBrief = /yes|ready|create|brief|go ahead/i.test(lastMsg);
  return hasContext && wantsBrief;
}
```

### 2. System Prompt
```typescript
// Before: 150+ lines of adaptive prompting
// After: 20 lines of clear guidance
const PROMPT = `You help people articulate what futures fascinate them.
Be warmly curious. Ask one clear question at a time.
When they say "everything," celebrate the scope and synthesize.
After 2-3 exchanges, offer to create their research brief.
Trust your judgment about timing.`;
```

### 3. State Management
```typescript
// Before: Complex state machine with 6 phases
// After: Simple flag
let generatingBrief = false;
```

## The Irony

This simpler system will probably work better. By removing our "helpful" constraints, we let GPT-5 do what it was trained to do: have natural conversations.

## Decision

Ship the 20% solution. Learn from reality, not from our imagination of what might go wrong.

## Future Considerations

Once we have real usage data:
1. Add back only what users actually need
2. Fine-tune based on real conversations
3. Build features users ask for, not ones we imagine

## Related Documents

- ADR-012: New Project Creation Architecture
- The advisor's feedback (2025-08-14)
- Original implementation analysis

---

*"Perfection is achieved not when there is nothing more to add, but when there is nothing left to take away." - Antoine de Saint-Exupéry*