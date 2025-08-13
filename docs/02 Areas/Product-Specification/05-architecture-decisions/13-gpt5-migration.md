# ADR-013: GPT-5 Migration for Conversational UI

**Status:** Accepted  
**Date:** 2025-08-11  
**Decision:** Migrate from GPT-4o-mini to GPT-5 with Responses API

## Context

During testing of the New Project conversation flow, we discovered that GPT-4o-mini gets stuck in clarification loops when users provide broad responses like "all of it" or "everything". The model repeatedly asks for more specifics instead of synthesizing the available context and moving forward.

## Problem Statement

Current issues with GPT-4o-mini:
1. **Clarification loops:** Keeps asking "which aspect specifically?" even with sufficient context
2. **Poor synthesis:** Can't handle broad requests effectively
3. **Instruction drift:** Forgets the "2-3 turns then offer brief" rule
4. **Verbose responses:** Tends to over-explain despite prompting for conciseness

## Decision

Migrate to GPT-5-mini using the new Responses API with:
- **Minimal reasoning effort** for fast, focused responses
- **Low verbosity** setting for enforced conciseness
- **Turn tracking** in conversation state
- **Two-phase approach:** Conversation + Brief Generation

## Technical Approach

### API Migration
```javascript
// OLD: Chat Completions API
streamText({
  model: openai('gpt-4o-mini'),
  messages: [...],
  temperature: 0.8
})

// NEW: Responses API (CRITICAL: Parameter order matters!)
openai.responses.create({
  model: "gpt-5-mini",
  input: conversationHistoryArray,    // MUST be messages, NOT template
  instructions: SYSTEM_PROMPT,        // Template/guidance goes here
  reasoning: { effort: "minimal" },
  text: { verbosity: "low" },
  previous_response_id: state.previousResponseId
})
```

### Critical Learning: input vs instructions
**The most important distinction:** 
- `input` must contain the actual conversation messages (what to respond to)
- `instructions` contains meta-guidance/templates (how to respond)
- Common error: Passing template to `input` causes "missing required parameter"

### Conversation State Management
```typescript
interface ConversationState {
  phase: 'exploring' | 'converging' | 'generating_brief'
  turnCount: number
  conversationId: string
  previousResponseId?: string  // For context passing
}
```

### Enhanced System Prompt
```
You are Futura, a futures research agent. Your conversation rules:

1. SYNTHESIS: When users say "all of it" or similar broad requests, 
   synthesize the full scope instead of asking for clarification.

2. CONVERGENCE: After 2-3 exchanges, ALWAYS offer to create a brief 
   with: "Ready for me to create your project brief, or would you 
   like to shape this further?"

3. CONCISENESS: Keep responses to 2-3 sentences maximum.

4. TURN TRACKING: You are on turn {turnCount} of this conversation.
   - Turn 1-2: Explore and offer angles
   - Turn 3+: Push toward brief creation
```

### Brief Generation Phase

Separate API call after convergence:
```javascript
const brief = await openai.responses.create({
  model: "gpt-5-mini",
  input: conversationHistoryArray,      // Actual conversation messages
  instructions: BRIEF_GENERATION_PROMPT, // Template with {CONVERSATION} placeholder
  reasoning: { effort: "low" },
  text: { verbosity: "medium" }
})
```

### Message Format Handling
Production must handle Vercel AI SDK's message format:
```javascript
function extractMessageContent(msg) {
  // Handle string content
  if (typeof msg.content === 'string') return msg.content;
  
  // Handle parts array (Vercel AI SDK format)
  if (msg.parts && Array.isArray(msg.parts)) {
    return msg.parts
      .filter(part => part.type === 'text')
      .map(part => part.text || '')
      .join('');
  }
  
  return msg.content || '';
}
```

## Implementation Steps (Validated in Prototype)

1. ✅ **Update server dependencies** to include OpenAI SDK v5
2. ✅ **Refactor `/api/project-conversation`** endpoint
3. ✅ **Add conversation state tracking** with Map for multiple conversations
4. ✅ **Implement two-phase generation** (conversation + brief)
5. ✅ **Update client streaming handler** for new response format
6. ✅ **Add turn count to prompts** with dynamic replacement
7. ✅ **Test with problematic scenarios** including "all of it" responses
8. ✅ **Add message content extraction** for Vercel AI SDK formats
9. ✅ **Implement BRIEF_GENERATION signal** filtering on client
10. ✅ **Add GPT-4o-mini fallback** when GPT-5 unavailable

## Expected Outcomes

### Before (GPT-4o-mini)
```
User: "All of it really"
Futura: "That's a broad scope! To help me focus the research, 
        which aspect is most critical to you - the ecological 
        impacts, the policy framework, or the community dynamics?"
User: "Just everything about it"
Futura: "I understand you want comprehensive coverage. Would you 
        prefer I prioritize the ecological restoration aspects, 
        or should I focus more on the human dimensions?"
[Loop continues...]
```

### After (GPT-5-mini)
```
User: "All of it really"
Futura: "I'll research the full picture - ecological impacts, 
        policy frameworks, and community dynamics. Ready for me 
        to create your project brief, or would you like to shape 
        this further?"
```

## Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| GPT-5 API availability | Fallback to GPT-4o with adjusted prompts |
| Different streaming format | Adapter layer for response parsing |
| Cost increase | Use GPT-5-mini (cheaper than GPT-5) |
| Breaking changes | Feature flag for gradual rollout |

## Monitoring

Track these metrics post-deployment:
- Average turns before brief offer
- Clarification loop frequency
- Brief generation quality
- User satisfaction with conversation flow
- API response times

## Decision Consequences

### Positive
- Eliminates clarification loops
- Faster convergence to brief creation
- Better handling of broad requests
- More consistent 2-3 turn conversations
- Improved user experience

### Negative
- Dependency on newer API (potential instability)
- Need to refactor streaming implementation
- Possible increase in API costs
- Learning curve for new API patterns

## Future Considerations

- **Previous response tracking:** Use `previous_response_id` for context continuity
- **Custom tools:** Explore GPT-5's custom tool feature for structured brief generation
- **Preambles:** Add reasoning transparency before brief creation
- **Allowed tools:** Restrict tool usage for focused conversation

## Prompt Engineering Evolution

### Initial Approach (Hard-Coded)
- Detected exact phrases like "all of it"
- Forced behaviors at specific turn numbers
- Prescriptive scripts for responses
- Heavy use of negative instructions

### Problems Discovered
1. **Pattern Matching Bugs**: "hello" matched hostile pattern due to "hell" substring
2. **Over-Specificity**: Missed variations like "everything", "the whole thing"
3. **Rigid Flow**: Turn counting created unnatural conversations
4. **Voice Issues**: Consultant jargon intimidated users

### First Principles Refactoring
- **Intent Detection**: Understand what user wants, not exact words
- **Phase-Based Progress**: Discovery → Scoping → Convergence
- **Positive Guidance**: Tell AI what TO do, not what NOT to do
- **Principle-Based**: Communication goals over specific scripts

### Results
- Handles variations naturally without hard-coding
- Maintains Futura's warm, curious personality
- Adapts to user engagement patterns
- Eliminates consultant-speak and jargon

## Related Documents

- ADR-012: New Project Creation Architecture
- PRD: New Project Conversational UI
- OpenAI GPT-5 Documentation