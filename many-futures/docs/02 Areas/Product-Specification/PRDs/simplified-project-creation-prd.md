# Product Requirements Document: Simplified Project Creation

**Version:** 2.0 (Simplified)  
**Date:** 2025-08-14  
**Status:** Ready for Implementation

## Executive Summary

Remove all unnecessary complexity from the project creation flow. Trust GPT-5 to have natural conversations. Ship the minimum viable experience and learn from real usage.

## Problem Statement

Current implementation has:
- 600+ lines of state management
- Complex phase tracking that constrains natural conversation
- Over-engineered edge case handling
- Perfectionist features that delay shipping

We need to ship and learn, not perfect imaginary edge cases.

## Solution Overview

The "20% Solution" - keep only what's essential:
1. Simple conversation between user and Futura
2. Simple brief generation when ready
3. Simple editing and confirmation
4. Ship it

## User Journey

```
User clicks "New Project"
    ↓
Futura: "What future are you curious about?"
    ↓
User describes interest
    ↓
2-3 exchanges of natural conversation
    ↓
Futura: "Ready for me to create your project brief?"
    ↓
User: "Yes"
    ↓
Brief appears (editable)
    ↓
User confirms → Project created
```

## Functional Requirements

### Must Have (Ship Today)
1. **Conversation Interface**
   - Display messages between user and Futura
   - Single input field at bottom
   - Auto-scroll to latest message

2. **Brief Generation**
   - Detect when user is ready (simple keyword match)
   - Generate brief using GPT-5/GPT-4
   - Display in editable canvas

3. **Project Creation**
   - Save brief when user confirms
   - Navigate to project page

### Won't Have (Learn First)
- ❌ Phase tracking
- ❌ Turn counting
- ❌ Engagement analysis
- ❌ Complex intent detection
- ❌ Typewriter effects (unless trivial)
- ❌ Conversation persistence
- ❌ Multiple brief alternatives

## Technical Requirements

### API Design

**Endpoint:** `POST /api/project-conversation`

**Request:**
```json
{
  "messages": [
    {"role": "user", "content": "..."},
    {"role": "assistant", "content": "..."}
  ],
  "conversationId": "optional-id"
}
```

**Response:** Server-Sent Events stream
```
data: Regular conversation text...
data: More text...
BRIEF_GENERATION:{"title":"...","brief":"..."}
```

### State Management

**Client State:**
```typescript
{
  messages: Message[];
  isLoading: boolean;
  projectBrief: Brief | null;
  input: string;
}
```

**Server State:**
```typescript
{
  conversationId: string;
  isGeneratingBrief: boolean;
}
```

That's it. No phases, no turn counts, no analysis.

### System Prompts

**Conversation Prompt:**
```
You are Futura, a futures research agent helping someone create a research project.

Be warmly curious. Ask one clear question at a time.
After 2-3 exchanges, offer to create their brief.
When they say "all of it", celebrate the scope and synthesize.

You're helping them articulate their curiosity, not categorizing interests.
```

**Brief Generation Prompt:**
```
Create a research brief based on the conversation.
Format: Title, What I'll Research, Key Questions, How I'll Explore This
Keep under 200 words. Write as Futura in first person.
```

## UI/UX Requirements

### Visual Design
- Clean, minimal interface
- Focus on conversation
- No distracting animations
- Brief appears inline when ready

### Interaction Design
- Enter to send message
- Click brief to edit
- Confirm button to create project
- Escape to exit

### Mobile Considerations
- Responsive layout
- Touch-friendly inputs
- Readable typography

## Success Metrics

### Ship Metrics (Day 1)
1. **It works** - Users can create projects
2. **It's simple** - <300 lines of code
3. **It's fast** - <2s response time

### Learn Metrics (Week 1)
1. **Completion rate** - % who create project
2. **Drop-off points** - Where users abandon
3. **Common phrases** - What users actually say
4. **Brief edits** - What users change

## Implementation Checklist

### Phase 1: Simplify (2 hours)
- [ ] Remove `analyzeConversation()` function
- [ ] Remove `generateAdaptivePrompt()` function  
- [ ] Simplify `shouldGenerateBrief()` to 10 lines
- [ ] Remove all phase tracking
- [ ] Remove turn counting

### Phase 2: Clean (1 hour)
- [ ] Remove unused state variables
- [ ] Remove complex useEffect chains
- [ ] Simplify error handling
- [ ] Remove or simplify typewriter

### Phase 3: Test (1 hour)
- [ ] Test happy path
- [ ] Test brief generation
- [ ] Test editing
- [ ] Test on mobile

### Phase 4: Ship (30 mins)
- [ ] Deploy to staging
- [ ] Quick smoke test
- [ ] Deploy to production
- [ ] Add basic analytics

## Out of Scope

Everything not explicitly listed above, including:
- Conversation templates
- Multiple brief versions
- Conversation history
- Advanced error recovery
- Perfect edge case handling

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Users get stuck | Medium | Ship and observe, add help only where needed |
| Brief quality varies | Low | GPT-5 is good enough, perfect later |
| Edge cases unhandled | Low | Learn which ones matter from real usage |

## Key Insight

> "We need real data, not hypothetical edge cases. With 100 real users, we'd learn what they actually say, where they actually get stuck, and what they actually want."

## Approval

This PRD represents the minimum viable project creation experience. By shipping this simplified version, we can:
1. Get to market faster
2. Learn from real users
3. Iterate based on data, not assumptions

**Ship it.**

---

*Related: [ADR-014: Simplified Project Creation](../05-architecture-decisions/14-simplified-project-creation.md)*