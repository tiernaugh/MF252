# Many Futures Production Roadmap

**Status:** Active Development  
**Phase:** Phase 0 - Foundation Setup  
**Started:** August 11, 2025  
**Last Updated:** 2025-08-11  
**Purpose:** Single source of truth for production build planning and context preservation

---

## 🎯 Mission Statement

Build an AI-powered strategic intelligence platform that delivers personalized research episodes to decision-makers. Core value prop: Users get weekly briefings on topics they care about, with contextual chat capabilities using highlighted text.

**Target:** Launch MVP with 5 paying customers at £29/month by end of 4-week sprint.

---



### ✅ Completed Work

#### Specifications & Architecture
- **60+ ADRs** documenting all technical decisions
- **Master Database Schema** (ADR #15) - Single source of truth with CUIDs
- **User State Management** (ADR #14) - Progressive disclosure strategy
- **Security Implementation Guide** - Comprehensive hardening with RLS
- **Two-Loop Memory Architecture** - Editorial (async) + Conversational (real-time)

#### Prototype Implementation
- **Conversational UI** - Fully working with GPT-5 Responses API
- **First Principles Prompting** - Phase-based, not turn-based
- **Edge Case Handling** - Repetitive, hostile, confused inputs
- **Voice Refinement** - Warm collaborative explorer (no jargon)
- **Canvas-Style Brief Editor** - Edit after conversation

#### Database & Security
- **Migration to Supabase** - Complete (replaced Neon)
- **Security Tables Added** - AuditLog, TokenUsage, EngagementEvent, DerivedInsight
- **RLS Policies Created** - Organization-scoped access control
- **Soft Deletes Implemented** - GDPR compliance with 30-day retention
- **Counter Caches Added** - Performance optimization
- **Metadata Versioning** - Schema evolution support

### 🚧 Work in Progress

- Database migration deployment to Supabase
- Connecting conversational UI to database persistence
- Episode generation pipeline setup

### 📋 Pending Tasks

- Production Supabase project creation
- Authentication flow with Clerk
- Episode reader component migration
- Payment integration with Stripe

---

## 🏗️ Production Build Phases

> **Note:** Phases are estimated at ~1 week each, but actual velocity will determine progression. No fixed dates.

### Phase 0: Foundation Setup (Current Phase - Started Aug 11)
**Goal:** Database operational, auth working, conversational UI persisting

#### Immediate Tasks
- [ ] Create Supabase project and configure environment
- [ ] Run Prisma migration with security-hardened schema
- [ ] Apply RLS policies from security-setup.sql
- [ ] Test complete security implementation
- [ ] Port conversational UI from prototype to production
- [ ] Connect project creation to database persistence
- [ ] Enable pgvector extension in Supabase

#### Validation Gate
- ✅ Database migration deployed to Supabase
- ✅ RLS policies active and tested
- ✅ Conversational UI persists projects
- ✅ pgvector extension enabled
- ✅ Development environment fully operational

### Phase 1: Content Pipeline + Embeddings Infrastructure
**Goal:** Episodes generate with embeddings for future memory features

#### Core Tasks
- [ ] Episode generation with Claude 3.5 Sonnet
- [ ] Block component library (8 types)
- [ ] Editorial Hero design system implementation
- [ ] Mobile-responsive episode reader

#### Embedding Infrastructure (Critical Addition)
- [ ] Generate embeddings on episode creation
- [ ] Store in BlockEmbedding table (paragraph-level)
- [ ] Implement vector similarity search
- [ ] Add cost controls (MAX_EMBEDDINGS_PER_EPISODE = 50)
- [ ] Token counting and budgeting

#### Validation Gate
- ✅ Episode generates with all 8 block types
- ✅ Embeddings created automatically
- ✅ Vector search returns relevant blocks
- ✅ Cost tracking < $0.50 per episode
- ✅ Page loads under 2 seconds

### Phase 2: Engagement + Basic Chat
**Goal:** Users can highlight text and chat with context

#### Features
- [ ] Text highlighting with selection toolbar
- [ ] Highlight persistence to database
- [ ] Basic contextual chat (highlight → chat)
- [ ] Streaming responses with Vercel AI SDK
- [ ] Rate limiting (100 requests/hour per user)

#### Chat Implementation
- [ ] Simple context: highlighted text + block metadata
- [ ] No cross-episode memory yet
- [ ] Streaming endpoint with proper error handling
- [ ] Context includes grounded reasoning metadata

#### Validation Gate
- ✅ Highlight → Chat flow works end-to-end
- ✅ Context includes block metadata (grounded reasoning)
- ✅ Rate limiting prevents abuse
- ✅ Streaming <1s to first token
- ✅ 80% of users complete first episode

### Phase 3: Memory + Advanced Chat
**Goal:** Cross-episode memory and intelligent context

#### Features
- [ ] Cross-episode memory with pgvector
- [ ] Full context packing (L0-L6 layers)
- [ ] Mem0 integration or custom memory
- [ ] Planning notes influence episodes
- [ ] Episode rating and feedback loops

#### Memory Implementation
- [ ] Vector similarity across episodes
- [ ] Project-scoped memory retrieval
- [ ] Context packing algorithm
- [ ] Memory persistence and recall

#### Validation Gate
- ✅ Cross-episode memory works
- ✅ Planning notes influence generation
- ✅ Memory scoped by project/org
- ✅ No data leaks across boundaries
- ✅ 30% of users provide feedback

### Phase 4: Monetization + Launch
**Goal:** Platform ready for paying customers

#### Implementation
- [ ] Stripe integration via next-forge
- [ ] Paywall after Episode 1
- [ ] Subscription management UI
- [ ] Receipt email automation
- [ ] Usage-based cost tracking

#### Hardening
- [ ] Security audit with penetration testing
- [ ] Performance optimization (indexes, caching)
- [ ] Error monitoring (Sentry)
- [ ] Analytics (PostHog)
- [ ] Legal compliance (Terms, Privacy)

#### Validation Gate
- ✅ Payment flow end-to-end
- ✅ Security audit passed
- ✅ Performance <2s page loads
- ✅ 5 paying customers acquired
- ✅ 50% convert after Episode 1

---

## 🔧 Technical Stack (Finalized)

### Core Infrastructure
- **Framework:** Next.js 15 via next-forge
- **Database:** Supabase (PostgreSQL + pgvector ready)
- **Auth:** Clerk with organizations
- **Hosting:** Vercel (Node runtime)

### AI & Memory
- **Conversation:** GPT-5-mini with Claude fallback
- **Episodes:** Claude 3.5 Sonnet
- **Embeddings:** OpenAI (deferred to Phase 2)
- **Memory:** pgvector + JSON (Mem0 ready but deferred)

### Supporting Services
- **Payments:** Stripe via next-forge
- **Email:** React Email + Resend
- **Monitoring:** Sentry + PostHog
- **Orchestration:** Direct API calls (n8n deferred)

---

## 📊 Key Architecture Decisions

### Database Schema (Consolidated)
```prisma
// Core entities use CUIDs
model Project {
  id               String @id @default(cuid())
  organizationId   String
  title            String
  onboardingBrief  Json   // GPT-5 generated brief
  // Soft delete support
  deletedAt        DateTime?
}

model Episode {
  id        String @id @default(cuid())
  projectId String
  content   Json   // JSONB for flexibility
  // Counter caches for performance
  highlightCount     Int @default(0)
  chatMessageCount   Int @default(0)
}

// Separate blocks for future vector search
model Block {
  id        String @id @default(cuid())
  episodeId String
  type      BlockType
  content   Json
  // Metadata versioning for evolution
  metadataVersion Int @default(1)
}
```

### Security Architecture
- **Database Level:** RLS policies on all tables
- **Application Level:** Organization scoping in all queries
- **Audit Trail:** Automatic logging via triggers
- **Soft Deletes:** 30-day retention for GDPR
- **Encryption:** Field-level for sensitive data

### Progressive Disclosure
- **Milestone 1:** First project created → unlock episode generation
- **Milestone 2:** First episode read → unlock highlighting
- **Milestone 3:** First highlight → unlock chat (future)
- **Milestone 4:** First week complete → unlock patterns view

---

## 🛡️ Technical Safeguards

### Cost Control Constants
```typescript
// Phase 1: Embedding cost controls
const MAX_EMBEDDINGS_PER_EPISODE = 50;
const MAX_TOKENS_PER_EPISODE = 10000;
const EMBEDDING_MODEL = 'text-embedding-3-small'; // $0.00002/1K tokens
const EMBEDDING_BATCH_SIZE = 10; // Process in batches

// Phase 2: Chat rate limiting
const CHAT_RATE_LIMIT = {
  requests: 100,
  window: '1h',
  per: 'user'
};
const MAX_CHAT_CONTEXT_TOKENS = 4000;

// Phase 3: Memory scoping enforcement
function enforceProjectScope(query: any, projectId: string, organizationId: string) {
  return {
    ...query,
    where: {
      ...query.where,
      projectId,
      organizationId, // ALWAYS included per security guide
      deletedAt: null // Respect soft deletes
    }
  };
}

// Token counting helper
async function countTokens(text: string): Promise<number> {
  // Use tiktoken or similar for accurate counting
  return Math.ceil(text.length / 4); // Rough estimate fallback
}
```

---

## 🚨 Risk Management

### Critical Risks & Mitigations

| Risk | Impact | Mitigation | Status | Phase |
|------|--------|------------|--------|-------|
| GPT-5 availability | High | Claude fallback implemented | ✅ Resolved | Phase 0 |
| Security vulnerabilities | Critical | Comprehensive RLS + audit | ✅ Addressed | Phase 0 |
| Embedding costs explode | High | MAX_EMBEDDINGS_PER_EPISODE limit | 📋 Planned | Phase 1 |
| Chat context too large | High | Token counting before API calls | 📋 Planned | Phase 2 |
| Memory leaks across projects | Critical | Strict scoping in all queries | 📋 Planned | Phase 3 |
| Rate limit abuse | High | User-based rate limiting | 📋 Planned | Phase 2 |
| Episode quality | High | Manual review first 10 | 📋 Planned | Phase 1 |
| Cost overrun | High | Token tracking implemented | ✅ In Schema | Phase 0 |
| Performance issues | Medium | Counter caches + indexes | ✅ Designed | Phase 0 |

### Open Questions Requiring Decisions

1. **Episode Cadence:** Daily or weekly only for MVP?
2. **Block Ratings:** Include in MVP or defer?
3. **Email Notifications:** Core or optional?
4. **Memory Persistence:** How much context between episodes?

---

## 📁 Key Documentation

### Architecture References
- `/docs/02 Areas/Product-Specification/05-architecture-decisions/15-database-schema-final.md` - Master schema
- `/docs/02 Areas/Product-Specification/05-architecture-decisions/17-security-implementation-guide.md` - Security setup
- `/docs/02 Areas/Product-Specification/05-architecture-decisions/14-user-state-management.md` - Progressive disclosure

### Implementation Guides
- `/many-futures-prototype-v4/server.js` - Working GPT-5 conversation
- `/many-futures/packages/database/prisma/schema.prisma` - Production schema
- `/many-futures/packages/database/supabase/security-setup.sql` - RLS policies

### Planning Documents (Now Consolidated Here)
- ~~`mvp-review-and-plan.md`~~ - Superseded by this document
- ~~`handover-mvp-build.md`~~ - Superseded by this document
- ~~`mvp-action-plan.md`~~ - Superseded by this document

---

## 💡 Session Context & Learnings

### Critical Implementation Details

#### GPT-5 API Parameters
```javascript
// CORRECT - Working implementation
{
  model: "gpt-5-mini",
  input: conversationHistory,     // Actual conversation
  instructions: systemPrompt,      // Meta-guidance only
  reasoning: { effort: "low" },
  text: { verbosity: "medium" }
}
```

#### Message Content Extraction
```javascript
// Handle Vercel AI SDK message format
function extractMessageContent(msg) {
  if (typeof msg.content === 'string') return msg.content;
  if (msg.parts && Array.isArray(msg.parts)) {
    return msg.parts
      .filter(part => part.type === 'text')
      .map(part => part.text || '')
      .join('');
  }
  return msg.content || '';
}
```

#### RLS Policy Pattern
```sql
-- Every table follows this pattern
CREATE POLICY "Users can view org data" ON table_name
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM get_user_organizations(auth.uid()::text)
    )
    AND deleted_at IS NULL
  );
```

### Development Workflow

1. **Always check this document first** - Single source of truth
2. **Run prototype for reference:** `cd many-futures-prototype-v4 && npm run dev`
3. **Test in development:** Use local Supabase or development project
4. **Document decisions:** Update ADRs if architecture changes
5. **Security first:** Every query must be org-scoped

### Environment Setup Required
```bash
# Required in many-futures/apps/app/.env.local
DATABASE_URL="postgresql://...?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://..."
CLERK_SECRET_KEY="..."
ANTHROPIC_API_KEY="..."
OPENAI_API_KEY="..."
SUPABASE_ANON_KEY="..."
SUPABASE_URL="..."
```

---

## 🎯 Immediate Next Actions

### Today (Jan 11)
1. ✅ Create this consolidated roadmap
2. [ ] Review and confirm technical decisions
3. [ ] Set up Supabase project
4. [ ] Configure environment variables

### This Weekend (Jan 11-12)
1. [ ] Run database migration
2. [ ] Test RLS policies
3. [ ] Port conversational UI to production
4. [ ] Verify project persistence

### Next Week (Jan 13-17)
1. [ ] Complete Phase 0 tasks
2. [ ] Begin Episode generation setup
3. [ ] Start block component library
4. [ ] Test end-to-end flow

---

## 📈 Success Metrics

### MVP Launch Criteria
- ✅ Conversational onboarding works
- ⏳ Episodes generate within 30 minutes
- ⏳ Beautiful mobile reading experience
- ⏳ Payment flow completes
- ⏳ System stable (>99% uptime)

### Business Validation
- Target: 5 paying customers at £29/month
- Conversion: 50% after Episode 1
- Retention: 70% after 30 days
- Engagement: 30% provide feedback

---

## 🔄 Living Document Notes

This document consolidates all planning and will be continuously updated as the single source of truth for:
- Current development status
- Technical decisions and rationale
- Implementation progress
- Session context between AI assistants
- Lessons learned and gotchas

**Last Major Update:** Security hardening complete, migrated to Supabase, consolidated planning documents

**Next Review:** After Phase 0 completion (Jan 17)

---

*End of Production Roadmap - All other planning documents are now superseded by this single source of truth.*