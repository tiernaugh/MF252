# PRD: New Project Conversational UI

**Status:** In Development  
**Owner:** Product  
**Last Updated:** 2025-08-11  

## Overview

Create a conversational interface where Futura guides users through project creation, replacing traditional forms with natural dialogue that builds a research brief.

## User Problem

Users need to articulate what futures they want to explore but may:
- Feel uncertain about how to scope their interest
- Benefit from expert guidance on framing
- Want professional validation of their strategic thinking

## Success Metrics
- Project creation completion rate
- Time to first project (reduce friction)
- Quality of generated briefs (fewer edits needed)
- User confidence in project scope

## Core Requirements

### Experience Philosophy

- **"Hire a researcher, not fill a form"** - Feels like briefing an expert
- Relief from uncertainty + professional confidence
- Guidance through suggestions, not interrogation
- Natural conversation with clear exit points

### Conversation Flow

1. **Opening** - "I research possible futures and their implications. What future would you like to explore?"
2. **Exploration** (min 2 turns) - Futura offers lenses/angles based on response
3. **Convergence** - After 2-3 exchanges, offer to create brief
4. **Brief Generation** - Futura creates editable document
5. **Confirmation** - User edits and confirms, project created

### UI Requirements

- Dedicated page (`/projects/new`), not modal
- Consistent with chat panel visual language
- Text input only (no clickable options)
- Brief appears as distinct editable canvas (not chat message)
- Canvas-style presentation like ChatGPT

### Functional Requirements

- Minimum 2-turn conversation (even for specific requests)
- Maximum 5-6 turns before strong convergence push
- "Continue shaping" option alongside brief creation
- Inline editing of generated brief
- Single brief generation (no alternatives)
- Auto-generated project title
- Graceful handling of out-of-scope requests

## Out of Scope (MVP)

- Draft saving/persistence
- Conversation memory between sessions
- Multiple brief generations
- Suggested response buttons
- Rich text editing
- Undo/redo

## Edge Cases

- Jailbreaking attempts (red team in testing)
- Users who don't know what they want (offer examples)
- NSFW/inappropriate requests (graceful redirect)
- Endless conversation loops (force convergence)
- **"All of it" responses** - Synthesize full scope without clarification loops
- **Very short responses** - Expand context through smart follow-ups
- **Off-topic requests** - Gracefully redirect to futures research
- **Repetitive inputs** - Pattern detection and gentle redirection
- **Hostile/trolling** - Professional response without engagement
- **Testing/probing** - Brief acknowledgment, redirect to purpose

## Voice Requirements

### Core Voice Principles
- **Collaborative Explorer**: "Let's explore...", "That's interesting..."
- **Natural Language**: No consultant jargon or policy-speak
- **Warm & Curious**: Genuine interest, not interrogation
- **Action-Oriented**: When user says "yes", create brief immediately

### Avoid
- Policy jargon (stakeholder mapping, indicators, metrics)
- Multiple choice lists with 5+ formal options
- Asking clarifying questions after user confirms
- Consultant-speak and formal categorizations
- Management language and business terminology

## Example Conversations

### Example 1: Business User
**Futura:** "I research possible futures and their implications. What future would you like to explore?"

**User:** "Something about remote work and cities"

**Futura:** "Remote work and cities—fascinating intersection. Let me ask a couple questions to shape your research. Are you most interested in urban planning changes, economic impacts on city centers, or social dynamics of hybrid communities?"

**User:** "Will cities empty out or transform?"

**Futura:** "The exodus versus transformation question—perfect focus. One more to dial this in: Should I emphasize residential patterns, commercial real estate, or both equally?"

**User:** "Both"

**Futura:** "I'll explore both residential and commercial shifts equally. Ready for me to create your project brief?"

**User:** "Yes"

**[Canvas appears with:]**
```
PROJECT BRIEF

Title: The Future of Urban Work Patterns

I'll research how remote work is reshaping city economics and urban life. 
I'll track office space transformations, policy responses to population 
shifts, and emerging hybrid lifestyle patterns. My focus will be on whether 
cities hollow out or transform into something new, examining both exodus 
patterns and adaptive strategies that major metropolitan areas are developing.
```

### Example 2: Niche Interest
**Futura:** "I research possible futures and their implications. What future would you like to explore?"

**User:** "I'm interested in wolves returning to the Adirondacks"

**Futura:** "Wolf return to the Adirondacks—rich topic. Let me ask a couple questions to shape your research. Are you most interested in ecological impacts, policy pathways, or community dynamics?"

**User:** "All of it really - will it actually happen?"

**Futura:** "I'll research all those angles—ecology, policy, and community. Would you like me to emphasize: 1. Likelihood and timeline, 2. Ecosystem changes, 3. Human impacts, or keep them equally weighted?"

**User:** "Equal weight but definitely want to know if it's realistic"

**Futura:** "Perfect—equal coverage with clear assessment of feasibility. Ready for me to create your project brief?"

**[Canvas appears with:]**
```
PROJECT BRIEF

Title: Will Wolves Return to the Adirondacks?

I'll research the potential for wolf reestablishment in the Adirondack 
region, tracking both natural migration patterns from Canada and policy 
discussions around active reintroduction. I'll examine ecological readiness, 
prey populations, habitat corridors, public sentiment in surrounding 
communities, and regulatory frameworks that could enable or prevent their 
return. I'll also monitor similar rewilding efforts globally for patterns 
that might predict success or failure.
```

### Example 3: Complex Request (New Pattern)
**Futura:** "I research possible futures and their implications. What future would you like to explore?"

**User:** "I am curious about the role of future generations commissioners that I think one existed in Wales and there's a movement to maybe bring one into Ireland"

**Futura:** "Interesting—Wales has had one since 2015 and Ireland is exploring this. Let me ask a couple questions to shape your research. What aspect interests you most: the commissioner's powers and duties, policy impacts, or how it might change Irish governance?"

**User:** "All of those"

**Futura:** "I'll research all those dimensions. Would you like me to emphasize: 1. Comparison with Wales, 2. Irish-specific challenges, 3. Sector impacts (climate, housing, health), or keep balanced coverage?"

**User:** "Focus on climate specifically"

**Futura:** "Perfect—comprehensive look with climate focus. One more to dial this in: Within climate, equal weight on emissions policy, adaptation planning, and just transition, or emphasize one?"

**User:** "Just transition and resilience"

**Futura:** "Got it—full commissioner analysis with special focus on climate justice and resilience. Ready for me to create your project brief?"

## Brief Canvas Design

When Futura generates the brief, it should:
- Appear as a distinct document/artifact
- Have clear visual separation from chat messages
- Feel professional and editable
- Simple structure: Title + Natural language brief
- Show subtle edit affordances on hover
- Save automatically on blur

### Brief Structure
```
PROJECT BRIEF

Title: [Auto-generated title]

[Natural language paragraph describing what Futura will research,
written in first person as if Futura is explaining the project.
This is exactly what gets stored and passed to the agent.]
```

## Implementation Notes

- Reuse existing prompt-kit components from chat panel
- ~~Prototype with fake Futura responses (keyword matching)~~ **Updated to use GPT-5**
- Use ContentEditable for brief editing
- Single page flow without routing during conversation
- ~~Generate dummy project data for MVP testing~~ **Real AI-powered brief generation**

### Prompt Engineering Approach

- **First Principles**: Intent detection over exact phrase matching
- **Phase-Based**: Discovery → Scoping → Convergence (not turn counting)
- **Positive Guidance**: Tell AI what to do, not what not to do
- **Context Aware**: Adapt to user engagement patterns
- **Pattern Detection**: Handle edge cases through behavior analysis

### Technical Implementation (GPT-5)

- **Model:** GPT-5-mini with Responses API
- **Reasoning:** Minimal effort for fast, focused responses
- **Verbosity:** Low setting for concise 2-3 sentence responses
- **State Machine:** Track conversation phases and turn count
- **Brief Generation:** Separate API call after convergence signal
- **Synthesis Rules:** Handle "all of it" without clarification loops

### Critical API Requirements (Production)

#### GPT-5 Responses API Structure
```javascript
// CORRECT API CALL STRUCTURE
const response = await openai.responses.create({
  model: 'gpt-5-mini',
  input: conversationHistoryArray,    // Actual messages (array format)
  instructions: systemPrompt,         // System prompt/template
  reasoning: { effort: 'minimal' },   // For conversation phase
  text: { verbosity: 'low' },        // Keep responses concise
  previous_response_id: state.previousResponseId  // Maintain context
});
```

#### Message Content Extraction
Production must handle multiple message formats from Vercel AI SDK:
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
  
  // Handle object with text property
  if (msg.content && typeof msg.content === 'object' && msg.content.text) {
    return msg.content.text;
  }
  
  return msg.content || '';
}
```

#### Server-Side Requirements
1. **Conversation State Management**
   - Track turn count per conversation
   - Store previous_response_id for context continuity
   - Maintain conversation phase (exploring → converging → generating_brief)

2. **Two-Format History**
   - String format for logs and brief template substitution
   - Array format for GPT-5 API calls

3. **Brief Detection Logic**
   - Search last 3-4 assistant messages for convergence signal
   - Implement turn 5+ fallback for affirmative responses
   - Force brief generation when user confirms with "yes" variants

4. **Error Handling**
   - Fallback to GPT-4o-mini when GPT-5 unavailable
   - Validate input parameter is never empty/undefined
   - Handle API errors gracefully without breaking conversation

#### Client-Side Requirements
1. **Message Filtering**
   - Filter BRIEF_GENERATION signals from display
   - Extract content consistently using helper function
   - Handle both content and parts message structures

2. **Brief Display**
   - Parse BRIEF_GENERATION signal in onFinish callback
   - Display brief in separate canvas component
   - Enable inline editing with ContentEditable
   - Show as markdown-formatted content

3. **Streaming Support**
   - Use Vercel AI SDK's TextStreamChatTransport
   - Handle SSE streaming without data: prefix
   - Process messages as they arrive

## Future Enhancements

- Conversation memory across sessions
- Multiple brief generation options
- Industry-specific tone modulation
- Collaborative brief creation
- Integration with research agent for immediate episode generation