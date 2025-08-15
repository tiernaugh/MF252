# Database Schema with Rationale

**Created:** 2025-08-15  
**Status:** 🟢 Complete with architectural decisions  
**Context:** Consolidated schema documentation with implementation rationale

## 📍 Schema Locations

- **TypeScript Interfaces**: `/many-futures/src/lib/database-schema.ts`
- **Mock Data Implementation**: `/many-futures/src/lib/mock-data.ts`
- **This Document**: Complete schema with architectural rationale

## 🏗️ Core Design Principles

1. **Organization-First**: Every table has `organizationId` (except User)
2. **Soft Deletes Only**: `deletedAt` and `deletedBy` on all tables
3. **Idempotency Built-In**: Prevent duplicates at database level
4. **Priority Queue**: Support SLA differentiation
5. **Audit Everything**: Track all changes for compliance

## 📊 Complete Schema with Rationale

### 1. Organizations
```typescript
interface Organization {
  id: string;                    // org_[nanoid]
  name: string;                  // "Jane's Workspace" or "Acme Corp"
  type: 'PERSONAL' | 'TEAM';     // Personal created on signup
  ownerId: string;               // User who owns the org
  clerkOrgId: string | null;     // Clerk's org ID for teams
  
  // Billing & Limits
  subscriptionTier: 'TRIAL' | 'STARTER' | 'GROWTH' | 'ENTERPRISE';
  dailyCostLimit: number;        // Default: £50
  episodeCostLimit: number;      // Default: £3
  
  // Soft delete
  deletedAt?: Date | null;
  deletedBy?: string | null;
  
  createdAt: Date;
  updatedAt: Date;
}
```
**Rationale**: 
- Personal org auto-created on signup (no team complexity for MVP)
- Cost limits prevent runaway expenses
- Clerk integration ready for team features

### 2. Users
```typescript
interface User {
  id: string;                    // user_[nanoid]
  clerkId: string;               // Clerk's user ID
  email: string;
  name: string;
  timezone: string;              // IANA timezone for scheduling
  
  // Preferences
  defaultOrganizationId?: string;
  notificationPreferences?: {
    episodeReady: boolean;       // Email when episode ready
    generationFailed: boolean;   // Email on failures (admin only)
  };
  
  createdAt: Date;
  updatedAt: Date;
}
```
**Rationale**: 
- Timezone critical for subscription delivery timing
- Minimal data stored (Clerk handles auth)
- Notification preferences for future email control

### 3. Projects
```typescript
interface Project {
  id: string;                    // proj_[nanoid]
  organizationId: string;        // Scoping for RLS
  userId: string;                // Who created it
  
  // Core content
  title: string;                 // "Future of UK Fintech"
  onboardingBrief: any;          // Conversation that created project
  
  // Scheduling (subscription model)
  cadenceConfig: {
    mode: 'daily' | 'weekly' | 'custom';
    days: number[];              // [0-6] where 0=Sunday
    deliveryHour: number;        // 0-23 in user's timezone
  };
  
  // Memory system (backend ready, no UI in MVP)
  memories?: {
    id: string;
    content: string;
    source: 'onboarding' | 'feedback' | 'interaction';
    importance: number;          // 0-1 for ranking
    createdAt: Date;
  }[];
  
  // Status
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED';
  isPaused: boolean;            // Quick pause without status change
  pausedAt?: Date | null;
  nextScheduledAt?: Date | null; // Next episode delivery time (UTC)
  lastEpisodeAt?: Date | null;
  
  // Soft delete
  deletedAt?: Date | null;
  deletedBy?: string | null;
  
  createdAt: Date;
  updatedAt: Date;
}
```
**Rationale**: 
- Flexible scheduling supports any delivery pattern
- Memories structure ready for future AI context
- Pause tracking ensures fresh content on resume
- nextScheduledAt enables efficient queue queries

### 4. Episodes
```typescript
interface Episode {
  id: string;                    // ep_[nanoid]
  projectId: string;
  organizationId: string;        // Denormalized for RLS performance
  
  // CRITICAL: Prevents duplicate episodes from retry storms
  idempotencyKey: string;        // Format: `${projectId}-${scheduledFor}`
  
  // Sequencing
  sequence: number;              // Episode 1, 2, 3...
  
  // Content
  title: string;
  summary: string;               // 1-2 sentences
  content?: string;              // Full markdown content
  sources?: Array<{
    title: string;
    url: string;
    credibilityScore?: number;
  }>;
  
  // Status & Generation
  status: 'DRAFT' | 'GENERATING' | 'PUBLISHED' | 'FAILED';
  
  // CRITICAL: Clear timing fields (resolved ambiguity)
  scheduledFor: Date;            // When user expects episode (9am) - delivery time
  generationStartedAt?: Date;    // When generation actually began (5am) - 4 hours before
  publishedAt?: Date | null;     // When content ready (8:30am)
  deliveredAt?: Date | null;     // When email notification sent (9am)
  
  // Generation tracking
  generationAttempts: number;    // Max 3 before failure
  generationErrors?: Array<{
    timestamp: Date;
    error: string;
    attempt: number;
  }>;
  generationTimeSeconds?: number;
  
  // Metrics
  readingMinutes: number;
  wordCount?: number;
  
  // Soft delete
  deletedAt?: Date | null;
  deletedBy?: string | null;
  
  createdAt: Date;
  updatedAt: Date;
}
```
**Rationale**: 
- Idempotency key prevents duplicates (database constraint)
- 4-hour generation window tracked separately from delivery
- Generation errors preserved for debugging
- deliveredAt tracks actual notification sending

### 5. EpisodeScheduleQueue
```typescript
interface EpisodeScheduleQueue {
  id: string;                    // queue_[nanoid]
  episodeId: string | null;      // Can be null initially
  projectId: string;
  organizationId: string;
  
  // CRITICAL: Priority queue for SLA management
  priority: number;              // 10=Premium, 8=Retry, 5=Standard, 1=Bulk
  
  // CRITICAL: Clear timing separation (resolved ambiguity)
  generationStartTime: Date;     // When to START generation (5am for 9am delivery)
  targetDeliveryTime: Date;      // When user expects episode (9am)
  
  // Status
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'blocked';
  
  // Processing
  processingStartedAt?: Date | null;
  completedAt?: Date | null;
  failedAt?: Date | null;
  
  // Retry tracking
  attemptCount: number;
  lastAttemptAt?: Date | null;
  nextRetryAt?: Date | null;     // Calculated: +30min, +1hr, +1hr
  
  // Error tracking
  errorMessage?: string | null;
  errorDetails?: any | null;
  
  // Results
  result?: any | null;           // Success details
  
  createdAt: Date;
  updatedAt: Date;
}
```
**Rationale**: 
- Priority ensures premium users get better service
- Separate scheduledFor (generation) from deliveryTime (user expectation)
- FOR UPDATE SKIP LOCKED prevents double-processing
- Retry timing follows escalating pattern

### 6. PlanningNotes
```typescript
interface PlanningNote {
  id: string;                    // note_[nanoid]
  projectId: string;
  organizationId: string;
  userId: string;                // Who gave feedback
  episodeId?: string | null;     // If about specific episode
  
  // Feedback (PERSISTS even if generation fails)
  note: string;                  // Max 240 chars
  
  // Categorization
  scope: 'NEXT_EPISODE' | 'GENERAL_FEEDBACK' | 'TOPIC_REQUEST' | 'DEPTH_ADJUSTMENT';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  
  // Processing
  status: 'pending' | 'acknowledged' | 'incorporated' | 'deferred' | 'archived';
  acknowledgedAt?: Date | null;
  incorporatedInEpisodeId?: string | null;
  
  // Auto-archive
  expiresAt?: Date | null;       // Auto-archive after date
  archiveAfterEpisodes?: number; // Or after N episodes
  
  // Soft delete
  deletedAt?: Date | null;
  deletedBy?: string | null;
  
  createdAt: Date;
  updatedAt: Date;
}
```
**Rationale**: 
- User effort never wasted (persists through failures)
- 240 char limit keeps feedback focused
- Auto-archive prevents stale feedback accumulation
- Critical to product value proposition

### 7. TokenUsage
```typescript
interface TokenUsage {
  id: string;                    // usage_[nanoid]
  organizationId: string;
  episodeId?: string | null;
  userId?: string | null;
  
  // Operation details
  operationType: 'episode_generation' | 'chat' | 'research' | 'quality_check';
  model: string;                 // 'gpt-4', 'claude-3', etc.
  
  // Token counts
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  
  // Cost (stored in multiple currencies for flexibility)
  totalCostUsd: number;
  totalCostGbp: number;
  
  // Metadata
  metadata?: any;                // Additional context
  
  createdAt: Date;
}
```
**Rationale**: 
- Track every AI call for cost control
- Multiple currency support for international expansion
- Links to episode for cost attribution

### 8. TokenUsageDaily
```typescript
interface TokenUsageDaily {
  // Composite primary key
  organizationId: string;
  date: Date;                    // Date only, no time
  
  // Aggregated data (updated by trigger)
  totalTokens: number;
  totalCostUsd: number;
  totalCostGbp: number;
  
  // Breakdown by operation
  operationBreakdown: {
    episode_generation: { tokens: number; cost: number; };
    chat: { tokens: number; cost: number; };
    research: { tokens: number; cost: number; };
    quality_check: { tokens: number; cost: number; };
  };
  
  // Tracking
  recordCount: number;           // How many token_usage records
  lastUpdated: Date;
}
```
**Rationale**: 
- Aggregation prevents slow queries on large token_usage table
- PostgreSQL trigger maintains automatically
- Enables instant cost limit checks
- Daily granularity matches billing cycles

### 9. UserEvents
```typescript
interface UserEvent {
  id: string;                    // event_[nanoid]
  userId: string;
  organizationId: string;
  sessionId?: string | null;     // Group related events
  
  // Flexible event system (no schema changes for new events)
  eventType: string;              // 'onboarding_started', 'episode_opened', etc.
  eventData?: any | null;         // Context-specific data
  
  // Context
  userAgent?: string | null;
  ipAddress?: string | null;
  
  createdAt: Date;
}
```
**Rationale**: 
- Flexible string eventType avoids migrations
- Replaces boolean flags (hasCompletedOnboarding, etc.)
- Enables product analytics without schema changes

### 10. AuditLog
```typescript
interface AuditLog {
  id: string;                    // audit_[nanoid]
  organizationId: string;
  userId?: string | null;        // Null for system actions
  
  // What happened
  action: string;                // 'project.created', 'episode.failed', etc.
  resourceType: string;          // 'project', 'episode', 'user'
  resourceId: string;            // ID of affected resource
  
  // Details
  oldValues?: any | null;        // Previous state
  newValues?: any | null;        // New state
  metadata?: any | null;         // Additional context
  
  // Severity for filtering
  severity: 'info' | 'warning' | 'error' | 'critical';
  
  createdAt: Date;
}
```
**Rationale**: 
- Compliance and debugging requirements
- Append-only (no updates or deletes)
- Critical for investigating issues

### 11. Blocks
```typescript
interface Block {
  id: string;                    // blk_[nanoid]
  episodeId: string;
  organizationId: string;
  
  // Content structure (MVP: single markdown block)
  type: 'MARKDOWN';              // Future: 'SIGNAL', 'SCENARIO', 'QUESTION'
  content: string;               // The actual content
  
  // Display
  position: number;              // Order within episode (10, 20, 30...)
  
  // Metadata
  wordCount?: number;
  
  // Version tracking
  version: number;               // For optimistic locking
  
  // Soft delete
  deletedAt?: Date | null;
  deletedBy?: string | null;
  
  createdAt: Date;
  updatedAt: Date;
}
```
**Rationale**: 
- Structure ready for multiple block types
- MVP uses single markdown block (simpler)
- Position gaps (10, 20) allow insertions
- Version field prevents concurrent edit conflicts

### 12. AgentMemory (Future)
```typescript
interface AgentMemory {
  id: string;                    // mem_[nanoid]
  projectId: string;
  organizationId: string;
  
  // Memory content
  content: string;               // What to remember
  memoryType: 'PREFERENCE' | 'CONTEXT' | 'FEEDBACK' | 'PATTERN';
  
  // Importance and expiry
  importance: number;            // 0-1 for ranking
  confidence: number;            // 0-1 for reliability
  expiresAt?: Date | null;       // When to forget
  
  // Source tracking
  sourceType: 'user_feedback' | 'inferred' | 'explicit';
  sourceEpisodeId?: string | null;
  
  // Usage tracking
  lastUsedAt?: Date | null;
  useCount: number;
  
  // Soft delete
  deletedAt?: Date | null;
  deletedBy?: string | null;
  
  createdAt: Date;
  updatedAt: Date;
}
```
**Rationale**: 
- Table created now to avoid migration later
- Not used in MVP but structure defined
- Importance/confidence for intelligent retrieval
- Expiry prevents stale memory accumulation

## 🔐 Security Requirements

Every table must have:
1. **RLS policies** created in same transaction
2. **Organization scoping** (except User table)
3. **Soft delete fields** for audit trail
4. **Service role bypass** for background jobs

### Service Role Configuration
```typescript
// Two separate Supabase clients needed:
// 1. Regular client (respects RLS) - for frontend
const supabase = createClient(URL, ANON_KEY);

// 2. Admin client (bypasses RLS) - for cron/backend
const supabaseAdmin = createClient(URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});
```

## 🎯 Key Constraints

```sql
-- Prevent duplicate episodes
ALTER TABLE episodes 
ADD CONSTRAINT unique_episode_schedule 
UNIQUE (project_id, idempotency_key);

-- Prevent duplicate queue entries (CRITICAL: missing before)
ALTER TABLE episode_schedule_queue
ADD CONSTRAINT unique_episode_queue
UNIQUE (episode_id, status)
WHERE status IN ('pending', 'processing');

-- Prevent duplicate daily aggregates
ALTER TABLE token_usage_daily
ADD CONSTRAINT unique_org_date 
UNIQUE (organization_id, date);

-- Enforce note length
ALTER TABLE planning_notes
ADD CONSTRAINT note_length 
CHECK (LENGTH(note) <= 240);

-- Enforce priority range
ALTER TABLE episode_schedule_queue
ADD CONSTRAINT priority_range 
CHECK (priority >= 1 AND priority <= 10);
```

## 📈 Performance Indexes

```sql
-- Queue processing (critical for subscription delivery)
CREATE INDEX idx_queue_processing 
ON episode_schedule_queue(scheduled_for, status, priority DESC)
WHERE status = 'pending';

-- Token usage aggregation
CREATE INDEX idx_token_usage_daily 
ON token_usage(organization_id, created_at);

-- Episode delivery
CREATE INDEX idx_episode_delivery
ON episodes(scheduled_for, status)
WHERE status = 'DRAFT';

-- Planning notes
CREATE INDEX idx_planning_notes_pending
ON planning_notes(project_id, status)
WHERE status = 'pending';
```

## 🔄 PostgreSQL Triggers

```sql
-- Maintain TokenUsageDaily automatically
CREATE OR REPLACE FUNCTION update_token_usage_daily()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO token_usage_daily (
    organization_id, 
    date, 
    total_tokens, 
    total_cost_gbp
  ) VALUES (
    NEW.organization_id,
    DATE(NEW.created_at),
    NEW.total_tokens,
    NEW.total_cost_gbp
  )
  ON CONFLICT (organization_id, date) 
  DO UPDATE SET
    total_tokens = token_usage_daily.total_tokens + NEW.total_tokens,
    total_cost_gbp = token_usage_daily.total_cost_gbp + NEW.total_cost_gbp,
    record_count = token_usage_daily.record_count + 1,
    last_updated = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_token_daily
AFTER INSERT ON token_usage
FOR EACH ROW EXECUTE FUNCTION update_token_usage_daily();
```

## 🔗 Related Documentation

- [RLS Security Policies](./rls-security-policies.md)
- [Architectural Decisions](./architectural-decisions.md)
- [Implementation Plan](./implementation-plan.md)
- [TypeScript Schema](/many-futures/src/lib/database-schema.ts)

---

**Note**: This schema is designed for MVP with future expansion in mind. Empty tables are cheap, migrations are expensive.