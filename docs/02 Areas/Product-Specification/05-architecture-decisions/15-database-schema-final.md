# Architecture Decision: Final Database Schema (Master Reference)

**Status:** Accepted  
**Date:** 2025-01-11  
**Owners:** Engineering  
**Supersedes:** 
- [05-database-schema.md](./05-database-schema.md) (partial)
- MVP technical choices schema (informal)
- Implementation strategy schema (partial)

**Related Docs:**
- [User State Management](./14-user-state-management.md)
- [New Project Creation Architecture](./12-new-project-creation-architecture.md)

---

## Context

Multiple schema designs have emerged across our documentation with inconsistencies in:
- ID strategies (UUID vs CUID)
- Organization models (complex vs simple)
- Block storage (normalized vs JSONB)
- Missing core tables (Highlights, Chat, UserJourney)

This ADR serves as the **single source of truth** for our database schema.

## Decision

### Core Technical Choices

1. **ID Strategy**: CUIDs everywhere
   - Simpler than UUIDs
   - URL-safe, sortable, no configuration needed
   - Compatible with Prisma defaults
   - Note: Consider prefixed IDs (e.g., `proj_cuid`, `ep_cuid`) for better debugging per ADR-01

2. **Organization Model**: Clerk-managed with personal orgs
   - Every user automatically gets a personal organization
   - Clerk handles the complexity
   - Future-ready for team features
   - Mem0-ready with dedicated scope fields (deferred but designed)

3. **Block Storage**: Separate normalized table
   - Better for highlights (need block references)
   - Enables block-level search
   - Cleaner analytics and updates
   - Includes `grounded_reasoning_metadata` and `research_citations` as JSONB

4. **Embeddings**: Deferred to Phase 2
   - Tables commented out but designed
   - pgvector ready but not required for MVP
   - Reduces initial complexity
   - Three-tier strategy planned: Block + Highlight + KeyTakeaway embeddings

## Complete Schema

### Phase 1: MVP Tables (Required Now)

```prisma
// ============================================
// CORE USER & ORGANIZATION MODELS
// ============================================

model User {
  id               String   @id @default(cuid())
  email            String   @unique
  name             String?
  clerkId          String   @unique @map("clerk_id")
  createdAt        DateTime @default(now()) @map("created_at")
  updatedAt        DateTime @updatedAt @map("updated_at")
  
  // Relations
  organizationMembers OrganizationMember[]
  ownedOrganizations  Organization[] @relation("OrganizationOwner")
  planningNotes       PlanningNote[]
  notifications       Notification[]
  highlights          Highlight[]
  chatSessions        ChatSession[]
  userJourney         UserJourney?
  onboardingState     OnboardingState?
  
  @@map("users")
}

model Organization {
  id            String           @id @default(cuid())
  name          String
  clerkOrgId    String?          @unique @map("clerk_org_id")
  type          OrganizationType @default(PERSONAL)
  ownerId       String           @map("owner_id")
  createdAt     DateTime         @default(now()) @map("created_at")
  updatedAt     DateTime         @updatedAt @map("updated_at")
  
  // Relations
  owner         User             @relation("OrganizationOwner", fields: [ownerId], references: [id])
  members       OrganizationMember[]
  projects      Project[]
  
  @@index([ownerId])
  @@map("organizations")
}

model OrganizationMember {
  userId         String       @map("user_id")
  organizationId String       @map("organization_id")
  role           MemberRole   @default(OWNER)
  createdAt      DateTime     @default(now()) @map("created_at")
  
  // Relations
  user           User         @relation(fields: [userId], references: [id])
  organization   Organization @relation(fields: [organizationId], references: [id])
  
  @@id([userId, organizationId])
  @@index([organizationId])
  @@map("organization_members")
}

// ============================================
// PROJECT & EPISODE MODELS
// ============================================

model Project {
  id                  String        @id @default(cuid())
  organizationId      String        @map("organization_id")
  title               String
  description         String?       @db.Text
  shortSummary        String?       @map("short_summary") @db.Text
  
  // Cadence & Scheduling
  cadenceType         CadenceType   @default(WEEKLY) @map("cadence_type")
  nextScheduledAt     DateTime?     @map("next_scheduled_at")
  
  // Onboarding from Futura conversation
  onboardingBrief     Json?         @map("onboarding_brief")
  
  // Status
  isPaused            Boolean       @default(false) @map("is_paused")
  
  createdAt           DateTime      @default(now()) @map("created_at")
  updatedAt           DateTime      @updatedAt @map("updated_at")
  
  // Relations
  organization        Organization  @relation(fields: [organizationId], references: [id])
  episodes            Episode[]
  planningNotes       PlanningNote[]
  highlights          Highlight[]
  chatSessions        ChatSession[]
  
  @@index([organizationId])
  @@index([organizationId, isPaused])
  @@map("projects")
}

model Episode {
  id                   String          @id @default(cuid())
  projectId            String          @map("project_id")
  title                String
  summary              String?         @db.Text
  highlightQuote       String?         @map("highlight_quote") @db.Text // Pull quote for hero display
  position             Int             // UI/editor ordering
  sequence             Int             // Stable human-facing episode number (1-based)
  readingMinutes       Int?            @map("reading_minutes") // Computed from word count
  
  // Status & Timing
  status               EpisodeStatus   @default(DRAFT)
  scheduledAt          DateTime?       @map("scheduled_at")
  publishedAt          DateTime?       @map("published_at")
  
  createdAt            DateTime        @default(now()) @map("created_at")
  updatedAt            DateTime        @updatedAt @map("updated_at")
  
  // Relations
  project              Project         @relation(fields: [projectId], references: [id])
  blocks               Block[]
  highlights           Highlight[]
  chatSessions         ChatSession[]
  
  @@index([projectId])
  @@index([projectId, status])
  @@index([projectId, publishedAt])
  @@map("episodes")
}

model Block {
  id                        String    @id @default(cuid())
  episodeId                 String    @map("episode_id")
  type                      BlockType
  content                   Json      // Type-specific content (see content shapes below)
  groundedReasoningMetadata Json?     @map("grounded_reasoning_metadata") // Hidden "why" for AI context
  researchCitations         Json?     @map("research_citations") // Sources array
  position                  Int       // Ordering within episode (10, 20, 30...)
  createdAt                 DateTime  @default(now()) @map("created_at")
  updatedAt                 DateTime  @updatedAt @map("updated_at")
  
  // Relations
  episode                   Episode   @relation(fields: [episodeId], references: [id])
  highlightStarts           Highlight[] @relation("StartBlock")
  highlightEnds             Highlight[] @relation("EndBlock")
  
  @@index([episodeId])
  @@map("blocks")
}

// ============================================
// USER INTERACTION MODELS (NEW)
// ============================================

model Highlight {
  id              String   @id @default(cuid())
  userId          String   @map("user_id")
  projectId       String   @map("project_id") // Denormalized
  episodeId       String   @map("episode_id")
  
  // Selection details
  startBlockId    String   @map("start_block_id")
  endBlockId      String   @map("end_block_id")
  selectedText    String   @db.Text @map("selected_text")
  startOffset     Int      @map("start_offset")
  endOffset       Int      @map("end_offset")
  
  // Optional annotation
  note            String?  @db.Text
  color           String   @default("yellow")
  
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")
  
  // Relations
  user            User     @relation(fields: [userId], references: [id])
  project         Project  @relation(fields: [projectId], references: [id])
  episode         Episode  @relation(fields: [episodeId], references: [id])
  startBlock      Block    @relation("StartBlock", fields: [startBlockId], references: [id])
  endBlock        Block    @relation("EndBlock", fields: [endBlockId], references: [id])
  chatSessions    ChatSessionHighlight[]
  
  @@index([userId])
  @@index([projectId])
  @@index([episodeId])
  @@map("highlights")
}

model ChatSession {
  id              String    @id @default(cuid())
  userId          String    @map("user_id")
  projectId       String    @map("project_id")
  episodeId       String?   @map("episode_id")
  
  startedAt       DateTime  @default(now()) @map("started_at")
  endedAt         DateTime? @map("ended_at")
  
  // Relations
  user            User      @relation(fields: [userId], references: [id])
  project         Project   @relation(fields: [projectId], references: [id])
  episode         Episode?  @relation(fields: [episodeId], references: [id])
  messages        ChatMessage[]
  highlights      ChatSessionHighlight[]
  
  @@index([userId])
  @@index([projectId])
  @@map("chat_sessions")
}

model ChatSessionHighlight {
  sessionId       String       @map("session_id")
  highlightId     String       @map("highlight_id")
  addedAt         DateTime     @default(now()) @map("added_at")
  
  // Relations
  session         ChatSession  @relation(fields: [sessionId], references: [id])
  highlight       Highlight    @relation(fields: [highlightId], references: [id])
  
  @@id([sessionId, highlightId])
  @@map("chat_session_highlights")
}

model ChatMessage {
  id              String       @id @default(cuid())
  sessionId       String       @map("session_id")
  role            MessageRole
  content         String       @db.Text
  
  // Metadata
  tokenCount      Int?         @map("token_count")
  model           String?      // Which AI model
  
  createdAt       DateTime     @default(now()) @map("created_at")
  
  // Relations
  session         ChatSession  @relation(fields: [sessionId], references: [id])
  
  @@index([sessionId])
  @@map("chat_messages")
}

// ============================================
// USER STATE TRACKING (NEW)
// ============================================

model UserJourney {
  id                      String    @id @default(cuid())
  userId                  String    @unique @map("user_id")
  
  // Milestones
  hasCompletedOnboarding  Boolean   @default(false) @map("has_completed_onboarding")
  hasCreatedFirstProject  Boolean   @default(false) @map("has_created_first_project")
  hasReceivedFirstEpisode Boolean   @default(false) @map("has_received_first_episode")
  hasHighlightedText      Boolean   @default(false) @map("has_highlighted_text")
  hasUsedChat            Boolean   @default(false) @map("has_used_chat")
  hasAddedPlanningNotes  Boolean   @default(false) @map("has_added_planning_notes")
  
  // Timestamps
  onboardingCompletedAt  DateTime? @map("onboarding_completed_at")
  firstProjectCreatedAt  DateTime? @map("first_project_created_at")
  firstEpisodeReceivedAt DateTime? @map("first_episode_received_at")
  firstHighlightAt       DateTime? @map("first_highlight_at")
  firstChatAt           DateTime? @map("first_chat_at")
  
  // Activity
  lastActiveAt          DateTime   @default(now()) @map("last_active_at")
  totalActiveDays       Int        @default(0) @map("total_active_days")
  spotlightsSeen        Json       @default("{}") @map("spotlights_seen")
  
  createdAt             DateTime   @default(now()) @map("created_at")
  updatedAt             DateTime   @updatedAt @map("updated_at")
  
  // Relations
  user                  User       @relation(fields: [userId], references: [id])
  
  @@index([userId])
  @@index([lastActiveAt])
  @@map("user_journeys")
}

model OnboardingState {
  id            String   @id @default(cuid())
  userId        String   @unique @map("user_id")
  currentStage  String   @map("current_stage")
  stageData     Json     @map("stage_data")
  startedAt     DateTime @default(now()) @map("started_at")
  expiresAt     DateTime @map("expires_at")
  
  // Relations
  user          User     @relation(fields: [userId], references: [id])
  
  @@index([userId])
  @@index([expiresAt])
  @@map("onboarding_states")
}

// ============================================
// FEEDBACK & PLANNING
// ============================================

model PlanningNote {
  id                  String          @id @default(cuid())
  projectId           String          @map("project_id")
  userId              String          @map("user_id")
  note                String          @db.Text // Max 240 chars in UI
  scope               PlanningScope   @default(NEXT_EPISODE)
  status              PlanningStatus  @default(PENDING)
  appliesToEpisodeId  String?         @map("applies_to_episode_id") // Which episode triggered this
  createdAt           DateTime        @default(now()) @map("created_at")
  
  // Note: Per Two-Loop Architecture, planning notes:
  // - Are captured via episode footer, not chat
  // - Feed into Editorial Loop for next episode
  // - Auto-archived after consumption to prevent memory pollution
  // - NOT injected into chat context (L1-L4)
  
  // Relations
  project             Project         @relation(fields: [projectId], references: [id])
  user                User            @relation(fields: [userId], references: [id])
  
  @@index([projectId])
  @@index([projectId, status])
  @@index([userId])
  @@map("planning_notes")
}

model Notification {
  id        String    @id @default(cuid())
  userId    String    @map("user_id")
  type      String
  payload   Json
  readAt    DateTime? @map("read_at")
  createdAt DateTime  @default(now()) @map("created_at")
  
  // Relations
  user      User      @relation(fields: [userId], references: [id])
  
  @@index([userId])
  @@index([userId, readAt])
  @@map("notifications")
}

// ============================================
// ENUMS
// ============================================

enum OrganizationType {
  PERSONAL
  TEAM
  @@map("organization_type")
}

enum MemberRole {
  OWNER
  MEMBER
  @@map("member_role")
}

enum CadenceType {
  DAILY
  WEEKLY
  @@map("cadence_type")
}

enum EpisodeStatus {
  DRAFT
  SCHEDULED
  PUBLISHED
  @@map("episode_status")
}

enum BlockType {
  COLD_OPEN
  EXECUTIVE_SUMMARY
  SECTION_HEADER
  TEXT
  SIGNAL
  PATTERN
  POSSIBILITY
  QUESTION
  TENSION
  @@map("block_type")
}

enum MessageRole {
  USER
  ASSISTANT
  SYSTEM
  @@map("message_role")
}

enum PlanningScope {
  NEXT_EPISODE
  GENERAL_FEEDBACK
  @@map("planning_scope")
}

enum PlanningStatus {
  PENDING
  CONSUMED
  ARCHIVED
  @@map("planning_status")
}
```

### Phase 2: Embedding Tables (Deferred)

```prisma
// Uncomment when implementing vector search

// model BlockEmbedding {
//   id              String   @id @default(cuid())
//   blockId         String   @map("block_id")
//   episodeId       String   @map("episode_id")
//   projectId       String   @map("project_id")
//   organizationId  String   @map("organization_id")
//   paragraphIndex  Int?     @map("paragraph_index")
//   embedding       Unsupported("vector(1536)")
//   embeddingType   String   @map("embedding_type")
//   createdAt       DateTime @default(now()) @map("created_at")
//   
//   @@index([projectId])
//   @@index([episodeId])
//   @@map("block_embeddings")
// }

// model HighlightEmbedding {
//   id              String    @id @default(cuid())
//   highlightId     String    @map("highlight_id")
//   projectId       String    @map("project_id")
//   embedding       Unsupported("vector(1536)")
//   createdAt       DateTime  @default(now()) @map("created_at")
//   
//   @@index([projectId])
//   @@map("highlight_embeddings")
// }
```

## Block Content Shapes

Based on the canonical block schema, each block type has specific content structures:

### Content Shapes (stored in `content` field)
- `COLD_OPEN`: `{ paragraphs: string[] }`
- `EXECUTIVE_SUMMARY`: `{ title: string, points: string[] }`
- `SECTION_HEADER`: `{ title: string }`
- `TEXT`: `{ paragraphs: string[] }`
- `SIGNAL`: `{ paragraphs: string[] }`
- `PATTERN | POSSIBILITY | TENSION`: `{ paragraphs: string[], keyTakeaway?: string }`
- `QUESTION`: `{ title?: string, questions: string[] }`

### Metadata Fields (Two-Loop Architecture)

Based on the Two-Loop Memory Architecture:

#### `groundedReasoningMetadata` (Editorial Loop Output)
- The "why" behind the content - internal AI reasoning
- Created during Stage 1 (Analytical Foundation) of Editorial Loop
- Used for L2 context packing in Conversational Loop
- NOT shown to users as citations
- Contains assumptions, connections, hypotheses

#### `researchCitations` (Research Validation Output)
- Auditable evidence from Stage 2 of Editorial Loop
- May be shown to users as inline citations [1]
- Array structure:
  ```json
  [{
    "index": 1,
    "source_title": "string",
    "url": "string",
    "excerpt": "string",
    "publication_date": "string",
    "credibility": "high|medium|low"
  }]
  ```

### The Two-Loop Flow
1. **Editorial Loop** (Async) → Creates Episodes with rich metadata
2. **Conversational Loop** (Real-time) → Uses metadata for grounded responses
3. **Memory Update** → Conversation insights feed back to next Editorial Loop

## Key Design Decisions

### 1. Denormalization for Performance

- `projectId` in Highlights and ChatSessions for fast project-scoped queries
- Avoids complex joins for common operations
- Trade-off: Slight data duplication for significant performance gain

### 2. Highlight-Chat Relationship

- Many-to-many through `ChatSessionHighlight` join table
- Allows multiple highlights per chat session
- Preserves context of what was discussed

### 3. User Journey Tracking

- Separate table for journey milestones
- Boolean flags for quick feature gating
- Timestamps for analytics and re-engagement

### 4. Conversation State

- `OnboardingState` is temporary (expires after 7 days)
- Project creation conversation stored in `onboardingBrief` JSON
- No permanent conversation history table needed

### 5. Two-Loop Memory Architecture

The schema supports the Two-Loop Memory Architecture:

**Editorial Loop (Async):**
- Inputs: Mem0 memories, PlanningNotes, project context
- Processing: Creates Episodes with Blocks containing:
  - `content`: User-visible text
  - `groundedReasoningMetadata`: Internal AI reasoning
  - `researchCitations`: Auditable sources
- Output: Published Episodes with rich metadata

**Conversational Loop (Real-time):**
- Triggered by: User highlights text → opens chat
- Context assembly: Pulls Block metadata + history + project context
- Memory update: Key insights → ChatMessages → Mem0 (future)
- Virtuous cycle: Insights feed back to next Editorial Loop

**Planning Notes Bridge:**
- Captured at episode end (not in chat)
- Feed forward to next episode generation
- Auto-archived after use (prevent pollution)
- Scope: `NEXT_EPISODE` or `GENERAL_FEEDBACK`

## Migration from Current State

### From Prototype
1. No existing production data
2. Start fresh with this schema
3. Seed demo data for testing

### From Documentation Inconsistencies
1. Update all docs to reference this ADR
2. Remove conflicting schema definitions
3. Update implementation guides

## Implementation Checklist

- [ ] Create Prisma schema file with all models
- [ ] Set up Supabase database
- [ ] Run initial migrations
- [ ] Create seed data script
- [ ] Update all documentation references
- [ ] Test all relations and queries
- [ ] Verify Clerk integration points

## Future Enhancements (Post-MVP)

1. **Vector Search** - Enable BlockEmbedding and HighlightEmbedding
   - Three-tier retrieval strategy
   - Paragraph-level granularity for key blocks
   - Highlight embeddings with 1.5x weighting

2. **Team Features** - Utilize OrganizationMember roles
   - Editor and Viewer roles
   - Cross-organization membership
   - Sharing and collaboration

3. **Mem0 Integration** - Add memory scope fields
   - `mem0_user_id` on User table
   - `mem0_org_id` on Organization table  
   - `mem0_project_id` on Project table
   - Enables precise memory scoping

4. **Advanced Metadata**
   - Generation metrics (cost, duration, models used)
   - Prompt template versioning
   - Memory linkage tracking

5. **ID Enhancement** - Consider prefixed IDs
   - `proj_[cuid]` for projects
   - `ep_[cuid]` for episodes
   - Better debugging and support

6. **API Access** - Add API key management

## Consequences

### Positive
- Single source of truth for schema
- Supports complete user journey
- Performance optimized with denormalization
- Future-ready without over-engineering

### Negative  
- More tables than simplified MVP
- Some data duplication
- More complex than JSONB approach

### Mitigation
- Clear documentation
- Comprehensive seed data
- Automated testing
- Phased implementation

---

This ADR represents the final, authoritative database schema for Many Futures MVP and beyond.