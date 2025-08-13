# MVP Feature Decisions: Many Futures

## 🎯 The Sharp Edge of MVP

### Core Value Prop Test
"Can we create strategic intelligence so valuable that busy professionals will pay £29/month for it?"

### What We're NOT Testing in MVP
- Whether chat adds value (assume yes, build later)
- Whether teams want to collaborate (assume yes, build later)  
- Whether people want multiple projects (they will after loving one)

---

## Feature Decisions by Category

### 🟢 MUST SHIP (True Must-Haves)

#### 1. Onboarding → First Episode Flow
**What**: 2-3 turn conversation → brief generation → episode delivery  
**Status**: ✅ Conversational UI Complete (GPT-5 integration with first principles prompting)
**Why**: Core promise is "hire an agent" - must feel like hiring someone
**MVP Bar**: 
- Conversation captures enough context for personalization
- Natural, warm voice (collaborative explorer, not consultant)
- Episode arrives within 24 hours
- Episode feels strategically valuable

#### 2. Episode Reading Experience  
**What**: Beautiful, mobile-friendly episode with distinct blocks
**Why**: This IS the product for first 30 days of user's life
**MVP Bar**:
- Typography that feels premium
- Block types visible & distinct
- Works perfectly on phone

#### 3. Block-Level Feedback
**What**: Simple, immediate 👍👎 rating buttons on every content block.
**Why**: The most direct, scalable way to teach Futura what content is valuable. It's the core of our personalization loop.
**MVP Bar**:
- **UI**: Always-visible 👍👎 buttons on each block for frictionless interaction.
- **Functionality**: One-tap rating with a visible state change.
- **Data Flow**: Ratings are captured and stored in the `block_ratings` table, linking `episode_id`, `block_id`, `user_id`, and the rating.
- **Impact**: While the full logic will be defined in the editorial framework, the data must be available to influence the next episode's generation.

#### 4. Episode-Level Feedback & Direction
**What**: A dedicated feedback module at the end of each episode.
**Why**: Provides explicit user agency over the agent's focus and captures high-level satisfaction.
**MVP Bar**:
- **UI**: A clear, multi-part module that appears at the end of the episode.
    ```
    ┌─ Episode Feedback ──────────────────────────────┐
    │ How was this episode for you?                   │
    │                                                 │
    │ ○ Highly valuable - influenced my thinking      │
    │ ○ Useful insights - worth the read             │
    │ ○ Interesting but not immediately actionable   │
    │ ○ Didn't resonate with my current priorities   │
    │                                                 │
    │ [Additional feedback - optional text area]      │
    │                                                 │
    │ ┌─ Next Episode Preview ─────────────────────┐  │
    │ │ 🔮 Episode 2: Client Relationship Evolution│  │
    │ │                                            │  │
    │ │ I want to explore how AI is changing what  │  │
    │ │ clients actually hire consultancies for.  │  │
    │ │ Should I focus on:                         │  │
    │ │                                            │  │
    │ │ ○ Procurement language changes             │  │
    │ │ ○ New types of project briefs              │  │
    │ │ ○ Value proposition shifts                 │  │
    │ │ ○ Let you choose the direction, Futura     │  │
    │ └────────────────────────────────────────────┘  │
    │                                                 │
    │ [Submit feedback & Episode 2 direction]         │
    └─────────────────────────────────────────────────┘
    ```
- **Functionality**: Captures the overall rating, optional text feedback, and the chosen direction for the next episode.
- **Data Flow**: Captures overall rating and next-episode direction to the `planning_notes` table with a `scope` of `next_episode`. This ensures the feedback influences the subsequent episode without polluting long-term memory. Optional text feedback is also stored.
- **Impact**: The "next direction" choice must demonstrably influence the topic of the subsequent episode.

---

### 🟡 SHOULD SHIP (High-Impact Performance)

#### 5. Basic Memory System
**What**: Episode-to-episode context retention
**Why**: "My agent" requires memory to feel personal
**MVP Bar**:
- References previous episodes naturally
- Remembers user preferences implicitly
- No user-facing memory UI needed

#### 6. Research Progress Page
**What**: "Futura is researching..." with status updates
**Why**: Delighter that makes waiting purposeful
**MVP Bar**:
- Simple progress indicators
- Rotating status messages
- Builds anticipation

#### 7. Email Notifications
**What**: "Your episode is ready" + preview
**Why**: Re-engagement mechanism
**MVP Bar**:
- Beautiful email template
- First paragraph preview
- One-click to episode

---

### 🔴 DON'T SHIP (Complexity Traps)

#### ❌ Sidebar Chat
**Why Not**: 
- Requires complex context management
- Unclear if Must-Have vs Nice-to-Have
- Can test value with fake door first

#### ❌ Multiple Projects  
**Why Not**:
- Free tier = 1 project is cleaner
- Reduces onboarding decision fatigue
- Natural upgrade driver

#### ❌ Custom Cadence
**Why Not**:
- Daily is simple to understand
- Reduces n8n workflow complexity
- Can A/B test later

#### ❌ Advanced Memory Controls & Feedback Analytics
**Why Not**:
- Users don't expect it yet
- Adds cognitive overhead to the user experience.
- The MVP should focus on implicit learning from basic feedback, not providing users with dashboards of their own preferences.

---

## The Sharpest Possible MVP Scope

### Week 1: Foundation
```typescript
// What we build
- [ ] Clerk auth setup
- [ ] Supabase schema (users, projects, episodes, block_ratings, episode_feedback)
- [ ] Basic Next.js app structure
- [ ] Email template system
```

### Week 2: Onboarding → Episode
```typescript
// The critical path
- [ ] Onboarding conversation UI
- [ ] Project brief → database
- [ ] n8n research workflow (simplified)
- [ ] Episode generation pipeline
- [ ] Episode rendering components
```

### Week 3: Engagement Loop
```typescript
// What makes it stick
- [ ] Block rating system UI & data capture
- [ ] Episode feedback module UI & data capture
- [ ] Basic memory integration (n8n workflow uses feedback data)
- [ ] Email notifications
- [ ] Progress page
```

### Week 4: Polish & Launch
```typescript
// What makes it special
- [ ] Typography & visual polish
- [ ] Mobile optimization
- [ ] Error states & edge cases
- [ ] Stripe integration
- [ ] Production deployment
```

---

## Success Metrics for True MVP

### Must Hit (Or We Failed)
- **Episode Completion Rate**: >80% read to end
- **Block Interaction Rate**: >30% rate at least one block
- **Episode 2 Request Rate**: >60% want another episode

### Should Hit (Indicates Product-Market Fit)
- **Paid Conversion**: >25% after Episode 1
- **Quality Rating**: >4/5 average episode rating
- **"Gets Me" Feedback**: >20% mention personalization

### Nice to Hit (Future Validation)
- **Organic Sharing**: >10% share episodes
- **Feature Requests**: >50% ask for chat specifically
- **Retention**: >70% still active after 30 days

---

## Controversial Calls

### 1. No Chat in MVP
**Risk**: Main differentiator in pitch
**Mitigation**: Fake door test - "Chat coming soon" button to measure demand
**Why It's Right**: Episode quality > feature quantity for MVP

### 2. No Free Episode 2
**Risk**: Users can't fully test ongoing value
**Mitigation**: Episode 1 must be SO good they'll pay
**Why It's Right**: Strong paywall = clear upgrade moment

### 3. Daily Only Cadence (MVP)
**Risk**: Some users overwhelmed
**Mitigation**: Can pause project anytime
**Why It's Right**: Simplicity > flexibility in MVP

---

## Spikes (ADR‑light, 15–30 min each)

1) Streaming feel check (prototype only)
- Purpose: Validate perceived latency and chunking before committing.
- Artefact: Mock streaming route + thin client; measure TTFT locally.

2) First‑episode archetypes
- Purpose: Expectation‑setting for content‑rich vs content‑thin starts.
- Artefact: Three 1‑pagers (historical, scenario, signals‑lite) using persona Sarah.

3) Packing policy dry‑run
- Purpose: Quantify L0–L4 budgets, simple L5 trigger; no external deps.
- Artefact: Script assembling context, prints token counts and timings.

### 4. No Sidebar at All
**Risk**: Blocks feel static
**Mitigation**: Ratings provide interaction
**Why It's Right**: Mobile-first means sidebar is awkward anyway

---

## Pre-Launch Validation Tests

### 1. Episode Quality Test
- Generate 5 sample episodes for different personas
- Show to target users
- Must achieve: "I would pay for this" from >50%

### 2. Onboarding Flow Test  
- Prototype conversation flow
- Test with 10 users
- Must achieve: Successful brief from >80%

### 3. Rating Interaction Test
- Prototype block ratings
- Test engagement
- Must achieve: >30% interact without prompting
