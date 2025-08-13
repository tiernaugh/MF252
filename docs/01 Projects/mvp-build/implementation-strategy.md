# Many Futures MVP Implementation Strategy

**Status:** Active Implementation | **Phase:** MVP Build | **Target:** 6 Weeks

---

## Executive Summary

This document defines the complete MVP implementation strategy for Many Futures, transitioning from validated specifications to production code using next-forge as our foundation. We're building an AI-powered strategic intelligence platform with a focus on shipping fast while maintaining architectural integrity.

**Core Principle:** Build vertically, validate continuously, document decisions.

---

## Part 1: Working Principles & Methodology

### Development Philosophy
```yaml
Speed with Integrity:
  - Ship working vertical slices weekly
  - No architectural debt that blocks scaling
  - Document surprises as ADR updates
  
AI-Assisted Development:
  - Use Cursor with specialized rules for rapid iteration
  - Validate AI-generated code against patterns
  - Maintain human oversight on critical paths

Progressive Enhancement:
  - Start with Node.js, migrate to Edge when proven
  - Begin with baseline memory, add Mem0 later
  - Use simple blocks first, add editorial types later
```

### Quality Gates
Every stage must pass before proceeding:
1. **Functional:** Core feature works end-to-end
2. **Scoped:** Privacy boundaries enforced
3. **Observable:** Errors logged, performance tracked
4. **Documented:** ADRs updated if architecture changed

---

## Part 2: Technical Architecture (Simplified for MVP)

### Core Stack
```yaml
Runtime:
  Framework: Next.js 15 (App Router) via next-forge
  Deployment: Vercel (Node runtime initially)
  Database: Supabase (Postgres + pgvector)
  Auth: Clerk (Organizations enabled)
  
AI Infrastructure:
  LLM: To be explored - let's try gpt-5 and gemini
  Streaming: Vercel AI SDK
  Memory: Baseline (pgvector + JSON), Mem0 ready
  Embeddings: OpenAI text-embedding-3-small
  Orchestration: n8n Cloud (MVP)
  
Development:
  Starter: next-forge (already set up)
  ORM: Prisma with raw SQL for vectors
  Validation: Zod schemas
  Testing: Vitest + Playwright
```

### Simplified Schema (MVP Focus)
```prisma
// Core business entities
model Organization {
  id            String   @id @default(cuid())
  name          String
  type          OrgType  @default(PERSONAL) // PERSONAL only for MVP
  ownerId       String
  mem0OrgId     String?  // Future use
  
  projects      Project[]
  members       OrganizationMember[]
}

model Project {
  id              String   @id @default(cuid())
  organizationId  String
  title           String
  description     String
  shortSummary    String?  @db.Text // Agent-generated
  onboardingBrief Json?    @db.JsonB
  editorialStyle  Json?    @db.JsonB
  cadenceType     String   @default("weekly")
  isPaused        Boolean  @default(false)
  mem0ProjectId   String?  // Future use
  
  episodes        Episode[]
}

model Episode {
  id              String   @id @default(cuid())
  projectId       String
  sequence        Int      // 1-based episode number
  title           String
  summary         String   @db.Text
  highlightQuote  String?  @db.Text
  readingMinutes  Int
  status          String   @default("draft") // draft | published
  publishedAt     DateTime?
  
  blocks          Block[]
}

model Block {
  id        String    @id @default(cuid())
  episodeId String
  type      String    // heading | paragraph | quote | list (MVP)
  position  Int
  content   Json      @db.JsonB // Type-specific structure
  metadata  Json?     @db.JsonB // For L3 context (optional MVP)
}

// Two-tier embeddings (simplified)
model BlockEmbedding {
  id             String   @id @default(cuid())
  blockId        String
  episodeId      String   // Denormalized
  projectId      String   // Denormalized  
  organizationId String   // Denormalized
  paragraphIndex Int?     // NULL = full block
  embedding      Unsupported("vector(1536)")
  createdAt      DateTime @default(now())
  
  @@index([projectId, embedding(ops: "vector_cosine_ops")], type: Gin)
}

model HighlightEmbedding {
  id              String   @id @default(cuid())
  chatSessionId   String
  projectId       String   // Denormalized
  highlightedText String   @db.Text
  startBlockId    String
  endBlockId      String
  embedding       Unsupported("vector(1536)")
  createdAt       DateTime @default(now())
  
  @@index([projectId, embedding(ops: "vector_cosine_ops")], type: Gin)
}
```

### L0-L3 Context Packing (MVP Scope)
```typescript
interface ContextPacking {
  L0_system: string;        // System prompt (always)
  L1_user: string;          // User message + highlight (always)
  L2_episode: Block[];      // Current episode context (always)
  L3_project: ProjectBrief; // Project context (always)
  // L4-L6 deferred to post-MVP
}

const TOKEN_BUDGET_MVP = 100_000; // Conservative for MVP
```

---

## Part 3: Implementation Stages

### Stage 0: Foundation & Setup (Week 1)
**Goal:** Core infrastructure working with next-forge

#### Tasks
```bash
# 1. Extend database schema
cd many-futures/packages/database
# Update schema.prisma with our models
# Add pgvector migration

# 2. Set up Supabase
# Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;
# Run migrations
pnpm exec prisma migrate dev --filter=database

# 3. Auth with org provisioning
# Configure Clerk webhooks for auto org creation
# Update middleware for org scoping

# 4. Create seed data
# Demo project with mock episodes
# Use mock-episode.json as template
```

#### Validation
- [ ] Can create user → auto creates personal org
- [ ] Can create project within org
- [ ] Can seed and retrieve episodes
- [ ] pgvector extension working

### Stage 1: Content Rendering (Week 2)
**Goal:** Episode reader with Editorial Hero design

#### Components
```typescript
// app/(authenticated)/projects/[projectId]/page.tsx
// Project overview with episode list

// app/(authenticated)/projects/[projectId]/episodes/[episodeId]/page.tsx
// Episode reader with block rendering

// packages/design-system/components/editorial/
// - episode-hero.tsx
// - block-renderer.tsx
// - highlight-toolbar.tsx
```

#### Validation
- [ ] Render all basic block types (heading, paragraph, quote, list)
- [ ] Editorial Hero typography working
- [ ] Text highlighting captures selections
- [ ] Mobile responsive

### Stage 2: Embeddings & Search (Week 3)
**Goal:** Two-tier embeddings with scoped search

#### Implementation
```typescript
// packages/ai/embeddings/embedding-service.ts
export class EmbeddingService {
  async embedBlock(block: Block, episode: Episode, project: Project) {
    // Paragraph-level for content blocks
    // Full-block for others
    // Store with denormalized scoping
  }
  
  async searchSimilar(query: string, projectId: string) {
    // Raw SQL with vector similarity
    // Enforce project scoping
    // Return ranked results
  }
}
```

#### Validation
- [ ] Blocks get embedded on creation
- [ ] Search returns relevant content
- [ ] Scoping prevents cross-project leaks
- [ ] Highlight embeddings stored

### Stage 3: Chat Integration (Week 4)
**Goal:** Side-panel chat with L0-L3 context

#### Components
```typescript
// app/api/chat/route.ts
// Streaming endpoint with context packing

// components/chat/chat-side-panel.tsx
// Overlay panel, not page replacement

// packages/ai/context/context-packer.ts
// L0-L3 assembly with token management
```

#### Validation
- [ ] Chat opens with highlighted text
- [ ] Streaming starts < 1s
- [ ] Context includes episode/project
- [ ] Multiple turns work

### Stage 4: Memory System (Week 5)
**Goal:** Baseline memory with abstraction for Mem0

#### Implementation
```typescript
// packages/ai/memory/memory-service.ts
interface MemoryService {
  store(content: string, scope: MemoryScope): Promise<void>
  retrieve(query: string, scope: MemoryScope): Promise<Memory[]>
}

// packages/ai/memory/baseline-memory.ts
// pgvector + JSON implementation

// packages/ai/memory/mem0-adapter.ts  
// Ready but not active
```

#### Validation
- [ ] Conversations create memories
- [ ] Memories retrieved in context
- [ ] Scoping enforced
- [ ] Fallback works without Mem0

### Stage 5: Episode Generation (Week 6)
**Goal:** Basic episode creation via n8n

#### n8n Workflow
1. Webhook trigger
2. Load project context
3. Generate episode structure
4. Create blocks with mock data initially
5. Save to database
6. Trigger embedding job

#### Validation
- [ ] Can trigger generation manually
- [ ] Episode appears in UI
- [ ] All fields populated
- [ ] Embeddings created

---

## Part 4: Testing Strategy

### Critical Test Boundaries

```typescript
// tests/security/scoping.test.ts
describe('Data Isolation', () => {
  test('Never returns data across projects')
  test('Enforces org boundaries in search')
  test('Memory scoped to project')
})

// tests/performance/streaming.test.ts  
describe('Performance', () => {
  test('First token < 1s')
  test('Page load < 2s')
  test('Search returns < 500ms')
})

// tests/integration/e2e.test.ts
describe('Core Flows', () => {
  test('Read episode → highlight → chat')
  test('Create project → generate episode')
  test('Search → find relevant blocks')
})
```

### Validation Scripts
```json
{
  "scripts": {
    "validate:stage:0": "vitest run tests/stage-0",
    "validate:stage:1": "vitest run tests/stage-1",
    "validate:stage:2": "vitest run tests/stage-2",
    "validate:stage:3": "vitest run tests/stage-3",
    "validate:stage:4": "vitest run tests/stage-4",
    "validate:stage:5": "vitest run tests/stage-5",
    "validate:all": "pnpm run validate:stage:*"
  }
}
```

---

## Part 5: Development Workflow

### Daily Rhythm
- **Morning:** Review progress, run validation, pick next slice
- **Building:** Test → Implement → Validate → Document
- **Evening:** Commit, test suite, document blockers

### AI Development Guidelines

✅ **Good for AI (Cursor):**
- Component scaffolding from patterns
- Type definitions from schemas
- Test data generation
- API route boilerplate
- Migration scripts

❌ **Human Oversight Required:**
- Security boundaries
- Payment logic
- Auth flows
- Vector search queries
- Memory scoping

### Using Cursor Rules
```bash
# Call specific experts as needed
@typescript-expert     # Type safety help
@database-expert      # Prisma and pgvector
@nextjs-react-expert  # Components and routing
@many-futures-domain-expert  # Business logic
@ai-embeddings-expert # Vectors and memory
```

---

## Part 6: MVP Launch Criteria

### Must Have (Block Launch)
- [x] next-forge setup complete
- [ ] Projects CRUD with org scoping
- [ ] Episode reading with basic blocks
- [ ] Text highlighting with persistence
- [ ] Chat with L0-L3 context
- [ ] Highlight-based memory
- [ ] Manual episode trigger

### Should Have (Polish)
- [ ] Projects Index page
- [ ] Editorial Hero design
- [ ] Mobile responsive
- [ ] Error tracking
- [ ] Basic performance monitoring

### Could Have (Post-MVP)
- [ ] Scheduled generation
- [ ] Complex block types
- [ ] Mem0 integration
- [ ] Email notifications
- [ ] L4-L6 context layers

---

## Part 7: Common Pitfalls & Mitigations

| Pitfall | Symptom | Solution |
|---------|---------|----------|
| Over-engineering | Spending days on abstractions | Ship vertical slices |
| Scope violations | Data leaking across projects | Always filter by projectId |
| Complex blocks too early | Slow progress on rendering | Start with basic types |
| Premature optimization | Fighting Edge constraints | Stay in Node for MVP |
| Memory without boundaries | Cross-project contamination | Explicit scope params |

---

## Part 8: Environment Configuration

```bash
# .env.local (many-futures/apps/app/)
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Auth (Clerk)
CLERK_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."

# AI
ANTHROPIC_API_KEY="sk-ant-..."
OPENAI_API_KEY="sk-..."
# MEM0_API_KEY="" # Not needed for MVP

# Orchestration
N8N_WEBHOOK_URL="https://..."

# Observability (optional)
# SENTRY_DSN="..."
```

### Supabase Setup
```sql
-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- After migration, set up basic RLS
ALTER TABLE "BlockEmbedding" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "HighlightEmbedding" ENABLE ROW LEVEL SECURITY;
```

---

## Part 9: Week-by-Week Deliverables

### Week 1: Foundation
- Database schema extended
- Auth with org provisioning
- Seed data working
- **Deliverable:** Can create and view projects

### Week 2: Content
- Episode reader complete
- Block rendering with Editorial Hero
- Text highlighting working
- **Deliverable:** Can read and highlight episodes

### Week 3: Intelligence
- Embeddings pipeline complete
- Vector search with scoping
- Related content retrieval
- **Deliverable:** Semantic search working

### Week 4: Conversation
- Chat side-panel complete
- Streaming with context
- L0-L3 packing working
- **Deliverable:** Contextual chat from highlights

### Week 5: Memory
- Baseline memory service
- Conversation persistence
- Memory retrieval in chat
- **Deliverable:** Chat remembers context

### Week 6: Generation
- n8n workflow configured
- Episode generation trigger
- Auto-embedding pipeline
- **Deliverable:** Can generate new episodes

---

## Success Metrics

### Technical Success
- All validation scripts passing
- < 5 critical bugs per stage
- Performance targets met
- Security boundaries enforced

### Product Success
- Episode loads < 2s
- Chat responds < 1s
- Highlighting works smoothly
- No data leaks across projects

### Architecture Success
- Clean abstraction for Mem0
- Extensible block system
- Clear upgrade path to Edge
- Cost-effective embeddings

---

## Final Notes

This strategy balances speed with quality, ensuring we ship an MVP that:
1. **Works reliably** with core features
2. **Feels polished** despite being lean
3. **Scales cleanly** without major rewrites
4. **Validates assumptions** with real usage

**Remember:**
- Build vertically, one feature at a time
- Use Cursor rules for consistent patterns
- Document surprises in ADRs
- Ship weekly, improve daily

**Ready to build. Let's create something remarkable.**
