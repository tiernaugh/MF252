# Migration Prevention Checklist

## Purpose
This checklist ensures the T3 implementation creates all necessary database structures upfront, preventing costly migrations as features are added through Phase 3 of the product roadmap.

---

## ✅ Pre-Launch Database Requirements

### Critical Tables to Create (Even If Initially Empty)

#### Phase 1 Tables (Use Immediately)
- [ ] **Organization** - Multi-tenancy foundation
- [ ] **User** - Authentication base
- [ ] **OrganizationMember** - User-org relationships (CRITICAL)
- [ ] **Subscription** - Billing/payments
- [ ] **Project** - Research contexts
- [ ] **Episode** - Weekly content
- [ ] **TokenUsage** - Cost tracking (CRITICAL)
- [ ] **EpisodeFeedback** - User ratings
- [ ] **UpcomingEpisode** - Preview system

#### Phase 2 Tables (Create Now, Use Weeks 3-4)
- [ ] **Block** - Content sections with metadata
- [ ] **ChatSession** - Conversation containers
- [ ] **ChatMessage** - Individual messages
- [ ] **Highlight** - User text selections

#### Phase 2-3 Bridge Tables
- [ ] **PlanningNote** - User guidance for episodes
- [ ] **UserJourney** - Progressive disclosure tracking

#### Phase 3 Tables (Create Structure, Implement Later)
- [ ] **BlockEmbedding** - Vector search (structure only)
- [ ] **HighlightEmbedding** - User highlight vectors

#### Phase 4 Tables (Optional But Recommended)
- [ ] **ShareLink** - Sharing system
- [ ] **AuditLog** - Compliance tracking

---

## 🔑 Critical Fields Per Table

### Block Table (MOST CRITICAL)
- [ ] `id`, `episodeId`, `organizationId`, `projectId`
- [ ] `type` (enum: MARKDOWN, SIGNAL, PATTERN, etc.)
- [ ] `content` (flexible: string or JSON)
- [ ] `position` (ordering)
- [ ] **`groundedReasoningMetadata`** (Two-Loop Architecture)
- [ ] **`researchCitations`** (Auditable sources)
- [ ] `paragraphCount`, `wordCount` (metrics)
- [ ] `highlightCount`, `feedbackCount` (engagement)
- [ ] `createdAt`, `updatedAt`, `version`
- [ ] `deletedAt`, `deletedBy` (soft delete)

### ChatSession Table
- [ ] `id`, `userId`, `organizationId`, `projectId`
- [ ] `episodeId` (nullable)
- [ ] **`highlightIds`** (array: context tracking)
- [ ] **`blockIds`** (array: discussed blocks)
- [ ] `mem0SessionId` (future memory)
- [ ] `startedAt`, `endedAt`
- [ ] `messageCount`, `totalTokens`, `totalCostGBP`

### ChatMessage Table
- [ ] `id`, `sessionId`
- [ ] `role` (USER, ASSISTANT, SYSTEM)
- [ ] `content`
- [ ] **`provider`** (OPENAI, ANTHROPIC, GOOGLE)
- [ ] `model`, `tokenCounts`, `costGBP`
- [ ] **`extractedInsights`** (JSON: memory extraction)
- [ ] `contextSnapshot` (what was in context)

### Highlight Table
- [ ] `id`, `userId`, `organizationId`, `projectId`, `episodeId`
- [ ] **`startBlockId`, `endBlockId`** (block-level selection)
- [ ] `selectedText`, `startOffset`, `endOffset`
- [ ] `note`, `color`, `tags`
- [ ] `chatSessionIds` (which chats used this)
- [ ] `embeddingId` (future vector link)

### PlanningNote Table
- [ ] `id`, `projectId`, `organizationId`, `userId`
- [ ] `note` (240 char max)
- [ ] **`scope`** (NEXT_EPISODE, GENERAL_FEEDBACK, etc.)
- [ ] **`status`** (PENDING, INCORPORATED, ARCHIVED)
- [ ] `processedAt`, `processedByEpisodeId`
- [ ] `consumedAt` (when used by Editorial Loop)

### UserJourney Table
- [ ] `id`, `userId`
- [ ] All boolean milestone fields (hasCompletedOnboarding, etc.)
- [ ] All timestamp fields (firstProjectCreatedAt, etc.)
- [ ] **`unlockedFeatures`** (array)
- [ ] **`spotlightsSeen`** (JSON: tutorial tracking)
- [ ] `engagementScore`, `lastActiveAt`

### TokenUsage Enhancements
- [ ] **`provider`** field (OPENAI, ANTHROPIC, GOOGLE)
- [ ] Remove `dailyTotal` (calculate dynamically)
- [ ] Add 'chat' and 'embedding' to operation enum

### Existing Table Enhancements
- [ ] User: Add `mem0UserId`, `defaultProjectId`
- [ ] Organization: Add `mem0OrgId`, `aiModelPreferences`
- [ ] Project: Add `mem0ProjectId`, `episodeGenerationConfig`
- [ ] Episode: Add `blockIds`, `memorySnapshot`, `themes`

---

## 🔐 Security Requirements

### Every Table Must Have
- [ ] `organizationId` field (except User table)
- [ ] Soft delete fields (`deletedAt`, `deletedBy`)
- [ ] Audit trail fields (`createdAt`, `updatedAt`)
- [ ] Version field for optimistic locking (where applicable)

### Database-Level Security
- [ ] Row-Level Security (RLS) policies for Supabase
- [ ] Organization-scoped access policies
- [ ] Soft delete filtering in RLS
- [ ] Audit log triggers for sensitive operations

### Application-Level Security
- [ ] Organization scoping in ALL queries
- [ ] Cost limit checks BEFORE AI calls
- [ ] Token tracking for EVERY AI operation
- [ ] Rate limiting preparation for chat

---

## 💰 Cost Control Mechanisms

### Required Implementations
- [ ] Daily cost aggregation query (no denormalized field)
- [ ] Episode cost limit check before generation
- [ ] Token counting before API calls
- [ ] Provider-specific cost calculation
- [ ] Organization-level cost dashboard queries

### Cost Control Code Pattern
```typescript
// MUST implement this pattern:
async function checkCostLimit(orgId: string): Promise<boolean> {
  const dailyCost = await db.tokenUsage.aggregate({
    where: {
      organizationId: orgId,
      createdAt: { gte: startOfDay(new Date()) }
    },
    _sum: { totalCostGBP: true }
  });
  
  return (dailyCost._sum.totalCostGBP || 0) < 50; // £50 limit
}

// Call BEFORE any AI operation:
if (!await checkCostLimit(orgId)) {
  throw new Error('Daily cost limit exceeded');
}
```

---

## 🚀 Implementation Order

### Step 1: Database Migration (Day 1)
1. [ ] Create all tables in single migration
2. [ ] Add all fields (nullable for future features)
3. [ ] Create indexes for performance
4. [ ] Apply RLS policies

### Step 2: Type Definitions (Day 1)
1. [ ] Update TypeScript interfaces
2. [ ] Generate Prisma client
3. [ ] Create type exports
4. [ ] Add JSDoc comments

### Step 3: Core Implementation (Week 1)
1. [ ] Organization scoping helpers
2. [ ] Cost control functions
3. [ ] Soft delete utilities
4. [ ] Audit logging setup

### Step 4: Feature Flags (Week 1)
1. [ ] Create feature flag system
2. [ ] Gate Phase 2-4 features
3. [ ] Progressive disclosure logic
4. [ ] A/B testing preparation

---

## 🎯 Success Criteria

### Database Ready When
- [ ] All tables exist in database
- [ ] RLS policies active and tested
- [ ] Cost control queries working
- [ ] Organization scoping enforced
- [ ] Soft deletes functioning
- [ ] Audit trail capturing events

### No Migration Needed Through
- [ ] Phase 2: Chat and highlighting ship without schema changes
- [ ] Phase 3: Memory and embeddings activate existing fields
- [ ] Phase 4: Collaboration uses pre-created tables
- [ ] 6 months: No breaking schema changes required

---

## ⚠️ Common Pitfalls to Avoid

### Don't
- ❌ Skip creating "future" tables
- ❌ Use denormalized aggregates (like dailyTotal)
- ❌ Forget organizationId on new tables
- ❌ Hard delete any data
- ❌ Skip RLS policies
- ❌ Forget soft delete fields

### Do
- ✅ Create all tables upfront
- ✅ Calculate aggregates dynamically
- ✅ Always scope by organization
- ✅ Use soft deletes everywhere
- ✅ Implement RLS from day one
- ✅ Track every token used

---

## 📊 Monitoring & Validation

### Post-Implementation Checks
- [ ] Run test queries for each table
- [ ] Verify RLS blocks cross-org access
- [ ] Test cost limit enforcement
- [ ] Validate soft delete filtering
- [ ] Check audit log capture
- [ ] Measure query performance

### Weekly Reviews
- [ ] No migration scripts needed
- [ ] Feature rollouts use existing schema
- [ ] Cost tracking accurate
- [ ] Security policies holding
- [ ] Performance metrics stable

---

## 📝 Documentation Requirements

### Must Document
- [ ] Schema design decisions
- [ ] Field purposes and constraints
- [ ] Security policies and RLS rules
- [ ] Cost control mechanisms
- [ ] Feature flag mappings
- [ ] Progressive disclosure flow

### Update CLAUDE.md With
- [ ] List of all tables
- [ ] Critical business rules
- [ ] Security requirements
- [ ] Cost control patterns
- [ ] Organization scoping examples

---

## Final Verification

Before marking complete:
- [ ] All Phase 1-3 tables created
- [ ] Two-Loop Architecture fields present
- [ ] Organization scoping enforced
- [ ] Cost controls implemented
- [ ] Security policies active
- [ ] No migrations needed for 6 months

**Sign-off Date:** _______________
**Verified By:** _______________

---

*This checklist ensures Many Futures can evolve from MVP through Phase 3 without database migrations, maintaining system stability while shipping features rapidly.*