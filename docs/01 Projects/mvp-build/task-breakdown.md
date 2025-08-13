# Many Futures MVP Task Breakdown
**Created:** 2025-08-11  
**Status:** Active - Week 1  
**Methodology:** High-level strategy (Task Master approach) + Implementation details (Claude Code)

## High-Level Strategy ("What" and "Why")

### MVP Mission
Build a futures intelligence platform that delivers such valuable strategic insights that busy professionals pay £29/month after one episode.

### Strategic Pillars
1. **Content Excellence** - Episodes must feel authored by expert analysts
2. **Engagement Loop** - Feedback mechanisms that improve future episodes  
3. **Technical Foundation** - Scalable architecture that can evolve
4. **User Delight** - Conversational onboarding that builds confidence

## 4-Week MVP Sprint Overview

### ✅ Week 0: Pre-Development (Complete)
**Goal:** Specification and prototype validation
- ✅ Comprehensive ADRs and PRDs
- ✅ Working prototype with core UX patterns
- ✅ Conversational UI with GPT-5 integration
- ✅ Database schema design with expert validation

### 🚧 Week 1: Foundation (Current - Jan 27-31)
**Goal:** Auth works, database ready, core models implemented

### Week 2: Content Pipeline (Feb 3-7)
**Goal:** Episodes generate and look beautiful

### Week 3: Engagement (Feb 10-14)
**Goal:** Users can rate blocks and guide their agent

### Week 4: Launch Prep (Feb 17-21)
**Goal:** Ready for first paid users

---

## Week 1 Detailed Breakdown (Current Focus)

### Day 1-2: Database & Environment Setup
**Why:** Foundation for all data persistence and retrieval

#### Task 1.1: Extend Prisma Schema
**What:** Add Many Futures models to `many-futures/packages/database`
**Why:** Enable data persistence for projects, episodes, and feedback
**How:** 
```typescript
// Key models to add:
model Project {
  id              String   @id @default(cuid())
  organizationId  String
  title           String
  onboardingBrief Json     // Stores conversation output
  status          String   @default("active")
  createdAt       DateTime @default(now())
  episodes        Episode[]
}

model Episode {
  id          String   @id @default(cuid())
  projectId   String
  title       String
  content     Json     // Block array
  status      String   // scheduled, published, archived
  publishedAt DateTime?
  blocks      Block[]
}

model Block {
  id         String   @id @default(cuid())
  episodeId  String
  type       String   // signal, context, etc
  content    Json
  position   Int
  embeddings BlockEmbedding[]
  ratings    BlockRating[]
}
```

#### Task 1.2: Configure Supabase
**What:** Set up pgvector extension and connections
**Why:** Enable semantic search and memory capabilities
**How:**
- Enable pgvector in Supabase dashboard
- Configure connection pooling
- Set up environment variables
- Test vector operations with raw SQL

#### Task 1.3: Environment Configuration
**What:** Set up all required API keys and connections
**Why:** Enable auth, AI, and database functionality
**How:**
```bash
# .env.local setup
DATABASE_URL="postgresql://..."      # Supabase pooled connection
DIRECT_URL="postgresql://..."        # Direct connection for migrations
CLERK_SECRET_KEY="sk_..."            # From Clerk dashboard
ANTHROPIC_API_KEY="sk-..."           # For Claude
OPENAI_API_KEY="sk-..."              # For GPT-5 and embeddings
```

### Day 3-4: Authentication & Core Models

#### Task 1.4: Clerk Integration
**What:** Configure authentication with organizations
**Why:** Enable user management and multi-tenancy
**How:**
- Set up Clerk provider in layout
- Configure organization creation on signup
- Add middleware for protected routes
- Test magic link and OAuth flows

#### Task 1.5: Core API Endpoints
**What:** Create server actions for CRUD operations
**Why:** Enable frontend to interact with database
**How:**
```typescript
// Server actions to create:
- createProject(brief: string)
- getProjects(organizationId: string)
- getProject(id: string)
- createEpisode(projectId: string, content: Json)
```

### Day 5: Integration & Testing

#### Task 1.6: Port Conversational UI
**What:** Move conversation logic from prototype to production
**Why:** Enable project creation flow
**How:**
- Copy logic from `prototype/server.js`
- Implement as Next.js server actions
- Connect to database for brief storage
- Test end-to-end flow

#### Task 1.7: Deployment Pipeline
**What:** Set up Vercel preview deployments
**Why:** Enable continuous integration and testing
**How:**
- Configure Vercel project
- Set up environment variables
- Enable preview deployments
- Test database migrations

---

## Week 2 Tasks Preview

### Content Generation Pipeline
- n8n workflow setup
- Perplexity research integration
- Claude episode generation
- Cost tracking implementation

### Episode Display
- Block component library
- Typography system
- Mobile responsive design
- Reading progress tracking

---

## Implementation Principles

### 1. Database First
Every feature starts with the data model. If we can't store it properly, we can't build it.

### 2. User Journey Focus
Each task should contribute to a complete user journey, not isolated features.

### 3. Test in Production-Like Environment
Use Vercel previews early and often. Catch deployment issues before they matter.

### 4. Document Decisions
Update ADRs when implementation reveals new insights or constraints.

### 5. MVP Discipline
If it's not essential for the first paid user, it goes in the backlog.

---

## Success Metrics

### Week 1 Success Criteria
- [ ] User can sign up and create organization
- [ ] User can complete conversational onboarding
- [ ] Project brief is stored in database
- [ ] Basic project list page displays
- [ ] Preview deployment accessible

### Overall MVP Success Criteria
- [ ] Episode generation < 30 minutes
- [ ] Page load < 2 seconds
- [ ] 80% complete first episode
- [ ] 50% convert to paid after Episode 1

---

## Risk Mitigation

### Technical Risks
- **pgvector complexity** → Start with basic search, enhance later
- **GPT-5 costs** → Implement usage tracking from day 1
- **Streaming issues** → Use Vercel AI SDK defaults first

### Product Risks
- **Episode quality** → Manual review for first 10 users
- **Onboarding dropout** → Track conversation abandonment
- **Payment friction** → Stripe checkout, not custom flow

---

## Daily Standup Format

Each day during implementation:
1. **Yesterday:** What was completed?
2. **Today:** What's the focus?
3. **Blockers:** What needs resolution?
4. **Learning:** What insight emerged?

---

## Notes for Implementation Sessions

- Use Claude Code's planner for detailed implementation steps
- Reference prototype code in `many-futures-prototype-v4/`
- Check ADRs before making architectural decisions
- Update this document as tasks complete

---

*This breakdown follows the Task Master philosophy: high-level strategy and reasoning here, detailed implementation in Claude Code's planner.*