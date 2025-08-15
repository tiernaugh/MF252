# Many Futures - Project Context

## What is Many Futures?

Many Futures is an **agentic foresight assistant** that transforms how businesses think about the future. Instead of expensive consultants or scattered trend reports, we deliver personalized, AI-powered strategic intelligence every week.

### The Problem We Solve
Strategy teams and innovation leads waste countless hours on:
- Reading generic industry reports that miss their specific context
- Manually tracking scattered signals across newsletters and blogs  
- Paying consultants £10k+ for episodic foresight workshops
- Missing weak signals that could reshape their industry

### Our Solution
A personal AI research agent (Futura) that:
1. **Understands your context** through conversational onboarding
2. **Researches continuously** across your strategic landscape
3. **Delivers weekly episodes** of curated insights and scenarios
4. **Learns from feedback** to become increasingly relevant

## The User Journey (Simplified)

```
User creates project → Futura generates episode → User reads → User gives feedback 
```

### Key Experience Moments

**1. Project Creation (3-4 minute conversation)**
- User describes what future they're curious about
- Futura asks clarifying questions about context, role, preferences
- Results in a project brief that guides all future research

**2. Episode Delivery (Weekly)**
- Email notification when ready
- 7-10 minute read of strategic insights
- Beautiful, editorial-quality typography
- Block-based content (insights, signals, scenarios)

**3. Feedback Loop**
- Simple thumbs up/down per block
- Optional text feedback
- Shapes next episode's focus

## The Lean MVP 

### What We're Building (Phase 0-1)
1. **Conversational UI** - GPT-5 powered project creation
2. **Episode Generation** - Claude-powered research synthesis  
3. **Reading Experience** - Beautiful, focused content display
4. **Feedback Collection** - Simple ratings to improve relevance
5. **Payment Gate** - £29/month after first episode (this may change - need to create this amount of value first)

### What We're NOT Building (Yet)
- ❌ Chat interface (no evidence users want it)
- ❌ Vector embeddings (expensive, unproven value)
- ❌ Complex memory layers (over-engineered)
- ❌ 8 block types (start with 3, expand based on usage)
- ❌ Team collaboration (single user first)

### Critical Safety Features
- **Cost Controls**: £2 max per episode, £50/day kill switch
- **Token Tracking**: Every API call logged in TokenUsage table
- **Admin Overrides**: Regenerate, pause, refund capabilities
- **Progressive Enhancement**: Feature flags for everything

## Why This Matters

### For Users
- **Save 5+ hours/week** on research and synthesis
- **Look smarter** in strategy meetings with cutting-edge insights
- **Pay £29/month** instead of £10k for consultant workshops
- **Get personalized intelligence** not generic reports

### For Us  
- **Validate core loop** before adding complexity
- **Learn what users actually want** vs what we assume
- **Ship in 2 weeks** not 5 weeks
- **Target: 5 paying customers** to prove value

## Success Metrics (Keep It Simple)

1. **Do people read episodes?** (>50% completion rate)
2. **Do they come back?** (Week 2 retention >70%)
3. **Will they pay?** (5 customers at £29/month)

Everything else is vanity metrics until we prove these three.

## Technical Philosophy

### Build for Learning, Not Scale
- Feature flags over perfect architecture
- PostgreSQL over vector databases (until proven needed)
- Markdown content over complex block structures
- Simple feedback over sophisticated memory

### The Migration Mindset
We're moving from next-forge to T3 because:
- Simpler architecture = faster iteration
- Fewer abstractions = easier debugging  
- T3 patterns = well-documented, community-supported
- Direct control = no fighting boilerplate assumptions

## Key Insight

> "We were building YouTube before validating people want videos"

The comprehensive 5-week plan assumed users wanted chat, embeddings, and complex memory. But we don't know that. The lean MVP tests the core hypothesis: **Will businesses pay for AI-generated strategic intelligence?**

Once we prove that, we can add everything else.

---

## Master TODO - MVP Build

### Infrastructure Setup
- [ ] Deploy with Vercel
- [ ] Scaffold basic UI with mock data
- [ ] Set up database with Supabase
- [ ] Attach database to UI
- [ ] Add authentication with Clerk
- [ ] Error management with Sentry
- [ ] Analytics with PostHog
- [ ] Rate limiting with Upstash

### Core Features
- [ ] Project creation flow (conversational UI)
- [ ] Episode generation system
- [ ] Reading experience UI
- [ ] Feedback collection system
- [ ] Payment integration (Stripe)

### Safety & Admin
- [ ] Cost control implementation
- [ ] Token usage tracking
- [ ] Admin dashboard
- [ ] Feature flags setup

---

## Tech Stack
- **Framework**: T3 (Next.js, tRPC, TypeScript, Tailwind)
- **Database**: Supabase (PostgreSQL)
- **Auth**: Clerk
- **Payments**: Stripe
- **AI**: OpenAI GPT-5, Claude

- **Monitoring**: Sentry
- **Analytics**: PostHog
- **Rate Limiting**: Upstash
- **Deployment**: Vercel