# Database Schema Expert Feedback Response

**Date:** 2025-08-15  
**Author:** Many Futures Product Team  
**Purpose:** Response to expert advisory panel feedback on database schema

## Executive Summary

Thank you for the comprehensive review of our database schema. Your feedback has identified critical production issues we would have missed, particularly around episode scheduling resilience and performance optimization. This document outlines our response to your recommendations, what we'll implement immediately, and what we're deferring to later phases.

## 🚨 Critical Additions We'll Implement Immediately

### 1. Episode Schedule Queue Table (CRITICAL)

**Your Concern:** Current `nextScheduledAt` approach will fail in production when services go down or rate limits hit.

**Our Response:** ✅ **Fully Accept** - This is a critical oversight. We'll implement the queue table immediately.

```typescript
export interface EpisodeScheduleQueue {
  id: string;                      // queue_[cuid]
  projectId: string;
  organizationId: string;
  
  // Scheduling
  scheduled_for: Date;             // When it should run
  picked_up_at?: Date | null;      // When worker grabbed it
  completed_at?: Date | null;      // When it finished
  
  // Failure handling
  attempt_count: number;           // For retry logic
  last_error?: string | null;      // What went wrong
  last_attempt_at?: Date | null;   // When last tried
  
  // Status tracking
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  
  // Result tracking
  episodeId?: string | null;       // If successful, which episode
  
  createdAt: Date;
}
```

**Implementation Notes:**
- Keep `nextScheduledAt` on Project as a user-facing cache
- Queue table becomes source of truth for scheduling
- Enables clean retry logic and failure recovery
- Provides observability into generation pipeline

### 2. Token Usage Daily Aggregation Table (CRITICAL)

**Your Concern:** Querying all token records for daily limits will kill performance at scale.

**Our Response:** ✅ **Fully Accept** - Essential for production performance.

```typescript
export interface TokenUsageDaily {
  organizationId: string;
  date: Date;                      // Date only, no time
  
  // Aggregated metrics
  total_tokens: number;
  total_cost_gbp: number;
  episode_count: number;
  
  // Breakdown by operation
  operation_breakdown?: {
    episode_generation: { tokens: number; cost: number; };
    project_onboarding: { tokens: number; cost: number; };
    chat: { tokens: number; cost: number; };
  } | null;
  
  last_updated: Date;              // When trigger last ran
  
  // Primary key: (organizationId, date)
}
```

**Implementation Notes:**
- PostgreSQL trigger updates on every `token_usage` insert
- Query this table for limit checks, not raw records
- Dramatically improves cost control performance

## ✅ What We're Keeping From Original Feedback

### Priority 1: Event-Driven Architecture

**Original Advice:** Replace boolean UserJourney flags with flexible events.

**Our Implementation:**
```typescript
export interface UserEvent {
  id: string;
  userId: string;
  organizationId: string;
  eventType: string;  // 'onboarding_complete', 'first_episode_opened'
  eventData?: any;    // Flexible context
  createdAt: Date;
}
```

**Rationale:** Infinitely flexible, no schema migrations for new metrics.

### Priority 2: Simple Audit Log

**Original Advice:** Add audit logging for compliance and debugging.

**Our Implementation:**
```typescript
export interface AuditLog {
  id: string;
  userId: string;
  organizationId: string;
  action: string;  // 'episode.generate', 'project.delete'
  resourceId?: string;
  oldValue?: string;  // Simple string, not JSON
  newValue?: string;
  createdAt: Date;
}
```

### Priority 3: Block Table (Simplified)

**Original Advice:** Don't use JSON blobs for queryable data.

**Our Implementation:**
```typescript
export interface Block {
  id: string;
  episodeId: string;
  organizationId: string;
  
  type: 'MARKDOWN';  // Start simple, one block per episode
  content: string;   // Full episode markdown initially
  position: number;
  
  // Structured, queryable fields (not JSON)
  reasoning?: string;  // Plain text reasoning
  confidence?: number; // 0-1 confidence score
  
  createdAt: Date;
  updatedAt: Date;
}
```

**Rationale:** Avoids JSON blob anti-pattern while keeping MVP simple.

## 🔄 What We're Modifying From Original Feedback

### 1. Scheduling Architecture

**Original Advice:** Complex scheduling with time preferences and timezone handling.

**Our Current Implementation:** Already have flexible `cadenceConfig` with days array:
```typescript
cadenceConfig: {
  mode: 'weekly' | 'daily' | 'weekdays' | 'custom';
  days: number[];  // [0-6] where 0=Sunday
}
```

**What We're Adding:** The EpisodeScheduleQueue table for resilience.

### 2. Memory System

**Original Advice:** Separate AgentMemory table from day one.

**Our Decision:** Keep memories in Project.memories for MVP, prepare migration path:
```typescript
// Day 1: JSON array in projects.memories
memories?: ProjectMemory[];

// Day 30+: When >50 memories, migrate to AgentMemory table
// Migration script ready but not executed
```

**Rationale:** Simpler for MVP, clear migration path when needed.

## ❌ What We're Pushing Back On

### 1. Team Features (TeamWorkspace, TeamDiscussion)

**Original Advice:** Build team-first collaboration from start.

**Our Position:** Defer to Phase 4. Focus on single-user value first.

**Rationale:** 
- No evidence users want team features yet
- Adds complexity without validated need
- Organization structure already supports future teams

### 2. Embedding Tables (BlockEmbedding, HighlightEmbedding)

**Original Advice:** Create embedding tables now for vector search.

**Our Position:** Defer until Phase 3 when implementing pgvector.

**Rationale:**
- No vector search in MVP
- n8n handles embeddings externally
- Can add tables when needed without migration pain

### 3. Complex User Journey Tracking

**Original Advice:** Detailed UserJourney table with 20+ boolean flags.

**Our Position:** Use event-driven approach instead.

**Rationale:**
- Events more flexible than boolean flags
- Derive metrics from events
- No schema changes for new metrics

## 📊 Additional Enhancements We'll Adopt

### 1. RLS Pattern for Supabase

```sql
-- Set in connection pool per request
SET LOCAL app.current_org_id = 'org_xxxxx';

-- Simple, fast RLS policies
CREATE POLICY "org_isolation" ON episodes
FOR ALL USING (
  organization_id = current_setting('app.current_org_id')::uuid
);
```

### 2. Failed Generation Tracking

Add to Episode table:
```typescript
generation_attempts?: number;      // Track retries
generation_errors?: string[];      // History of failures
```

### 3. Progressive Feature Flags

Already planned, but emphasizing the pattern:
```typescript
interface Organization {
  enabledFeatures?: string[];      // ['chat', 'highlights']
  experimentalFeatures?: string[]; // Beta features
}
```

## 🎯 Final Implementation Priority

### Must Have Before Launch (Week 1)
1. ✅ **EpisodeScheduleQueue** table (CRITICAL - prevents production failures)
2. ✅ **TokenUsageDaily** table with triggers (CRITICAL - performance)
3. ✅ **UserEvent** table (replaces UserJourney)
4. ✅ **AuditLog** table (compliance/debugging)
5. ✅ **Block** table (simple markdown version)
6. ✅ **PlanningNote** table (CRITICAL - feedback loop for Two-Loop Architecture)
7. ✅ **AgentMemory** table (create structure now, migrate later)

### Create Structure, Implement Later (Week 1)
1. **ChatSession/ChatMessage** tables (empty, prevents migration)
2. **Highlight** table (empty, for Phase 2)

### Definitely Defer (Post-MVP)
1. ❌ TeamWorkspace/TeamDiscussion (Phase 4)
2. ❌ Embedding tables (Phase 3)
3. ❌ Complex memory tables (until >50 memories)
4. ❌ Sophisticated UserJourney (use events)

## 💡 Key Insights We're Taking Forward

1. **Queue-Based Scheduling**: Essential for production resilience
2. **Aggregation Tables**: Critical for performance at scale
3. **Event-Driven Tracking**: More flexible than boolean flags
4. **Simple Blocks**: Start with markdown, avoid JSON blobs
5. **Progressive Enhancement**: Create tables early, use features later

## 📝 Response to Advisory Concerns (Round 2)

### Accepting Critical Feedback

#### 1. PlanningNote Table - Now Priority 1
**You're absolutely right.** The feedback loop is core to our value proposition. We'll implement PlanningNote immediately for MVP:

```typescript
// MVP Implementation - Simple but essential
interface PlanningNote {
  id: string;
  projectId: string;
  organizationId: string;
  userId: string;
  note: string;  // "More on regulation please"
  status: 'pending' | 'incorporated' | 'archived';
  createdAt: Date;
  processedAt?: Date;
}
```

This captures user intent from day one and feeds the Two-Loop Architecture.

#### 2. AgentMemory Table - Created Now, Used Later
**Accepted.** We'll create the table structure immediately:

```sql
CREATE TABLE agent_memory (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  organization_id TEXT NOT NULL,
  content TEXT NOT NULL,
  memory_type TEXT DEFAULT 'preference',
  importance FLOAT DEFAULT 0.5,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NULL
);

-- Migration will be simple INSERT SELECT when ready
```

#### 3. Queue Processing Implementation
**Critical detail added.** We'll use cron-based processing with proper locking:

```typescript
// Vercel cron job every 5 minutes
export async function processQueue() {
  const pending = await db.$queryRaw`
    SELECT * FROM episode_schedule_queue 
    WHERE status = 'pending' 
    AND scheduled_for <= NOW()
    AND attempt_count < 3
    ORDER BY scheduled_for 
    LIMIT 5
    FOR UPDATE SKIP LOCKED  -- Prevents double-processing
  `;
  
  for (const item of pending) {
    await processEpisodeGeneration(item);
  }
}
```

### Implementation Details Based on Your Answers

#### Exponential Backoff (Application Logic)
```typescript
const calculateNextAttempt = (attemptCount: number): Date => {
  const delayMs = Math.min(
    1000 * Math.pow(2, attemptCount),  // 1s, 2s, 4s, 8s...
    300000  // Cap at 5 minutes
  );
  return new Date(Date.now() + delayMs);
};
```

#### Token Aggregation Enhancement
```typescript
interface TokenUsageDaily {
  // ... existing fields
  hourly_peak?: number;  // Highest single hour (added later if needed)
  peak_hour?: number;    // Which hour (0-23)
}
```

#### Timezone-Aware Scheduling
```typescript
import { DateTime } from 'luxon';

function scheduleEpisode(project: Project, user: User) {
  // Convert user's local 9am to UTC
  const userLocal = DateTime.now()
    .setZone(user.timezone)
    .set({ hour: 9, minute: 0, second: 0 });
  
  const utc = userLocal.toUTC();
  
  await db.episodeScheduleQueue.create({
    data: {
      projectId: project.id,
      organizationId: project.organizationId,
      scheduled_for: utc.toJSDate(),  // Store in UTC
      status: 'pending',
      attempt_count: 0,
      metadata: {
        user_timezone: user.timezone,
        user_local_time: userLocal.toISO()  // For debugging
      }
    }
  });
}
```

#### Cost Control Circuit Breaker
```typescript
async function enforceHardLimit(orgId: string): Promise<void> {
  const usage = await db.tokenUsageDaily.findFirst({
    where: { 
      organizationId: orgId, 
      date: new Date().toISOString().split('T')[0]
    }
  });
  
  if (usage?.total_cost_gbp >= 50) {
    // Block all pending episodes
    await db.episodeScheduleQueue.updateMany({
      where: { organizationId: orgId, status: 'pending' },
      data: { 
        status: 'blocked', 
        last_error: 'Daily limit exceeded' 
      }
    });
    
    // Notify user
    await sendLimitExceededEmail(orgId);
  }
}
```

#### Supabase RLS Pattern
```typescript
// API route setup
import { createServerClient } from '@supabase/ssr';

export async function createSupabaseClient(orgId: string) {
  return createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        // cookie handling
      },
      db: {
        schema: 'public'
      },
      global: {
        headers: {
          'x-org-id': orgId  // Pass org via header
        }
      }
    }
  );
}

// In Supabase:
// CREATE FUNCTION current_org_id() RETURNS TEXT AS $$
//   SELECT current_setting('request.headers')::json->>'x-org-id';
// $$ LANGUAGE SQL;
```

### Migration Triggers

**Memory Migration:** Trigger when ANY condition is met:
- 50+ memories in any single project
- JSON parse queries >100ms
- Need to search/filter memories
- 3 months after launch (forced migration)

**Block Splitting:** Stay with single markdown until:
- 10+ paying customers validate product
- Users request section highlighting
- Phase 2 chat implementation begins

## Remaining Questions for Advisory Panel

1. **Queue Concurrency**: With `FOR UPDATE SKIP LOCKED`, should we run multiple workers or keep it single-threaded for MVP?

2. **PlanningNote Processing**: Should AI acknowledge planning notes immediately (mark as 'seen') or only when incorporated into episodes?

3. **Cost Overrun Handling**: When daily limit is hit, should we:
   - Auto-pause all projects until tomorrow?
   - Just skip today's episodes?
   - Allow user to increase limit (with payment method on file)?

4. **Memory Table Indexes**: What indexes should we create on the AgentMemory table for future vector similarity searches?

## 🤝 Final Alignment Summary

Based on both rounds of feedback, here's our complete aligned approach:

### Tables We're Creating (All 9 Critical Tables)
1. ✅ **EpisodeScheduleQueue** - Production resilience
2. ✅ **TokenUsageDaily** - Performance optimization  
3. ✅ **PlanningNote** - User feedback loop (now Priority 1!)
4. ✅ **AgentMemory** - Future-proof structure
5. ✅ **UserEvent** - Flexible tracking
6. ✅ **AuditLog** - Compliance/debugging
7. ✅ **Block** - Content structure
8. ✅ **ChatSession/ChatMessage** - Phase 2 ready
9. ✅ **Highlight** - User interaction ready

### Implementation Details We're Following
- Queue processing with `FOR UPDATE SKIP LOCKED`
- Exponential backoff in application logic
- Timezone-aware scheduling with UTC storage
- Hard cost limits with circuit breaker
- Supabase RLS with header-based org isolation
- PostgreSQL triggers for aggregation

### What We're NOT Doing (Yet)
- ❌ Team collaboration tables (unvalidated)
- ❌ Embedding/vector tables (Phase 3)
- ❌ Complex UserJourney (using events)
- ❌ Sophisticated memory governance (too early)

## Conclusion

With your second round of feedback, we now have 100% clarity on the critical path. The addition of PlanningNote as Priority 1 and creating AgentMemory structure immediately are the final pieces that complete our production-ready schema.

Your specific implementation details (queue locking, timezone handling, circuit breakers) transform our good ideas into production-grade solutions. We're particularly grateful for catching the PlanningNote criticality - you're absolutely right that user feedback is core to our value proposition from day one.

We're now ready to build with complete confidence that we won't need schema migrations through Phase 3.

---

**Immediate Next Steps:**
1. Create all 9 tables in single migration
2. Implement PostgreSQL triggers for TokenUsageDaily
3. Set up cron-based queue processing with proper locking
4. Implement PlanningNote UI for user feedback
5. Write migration script for AgentMemory (ready but not executed)
6. Deploy to Supabase with RLS policies