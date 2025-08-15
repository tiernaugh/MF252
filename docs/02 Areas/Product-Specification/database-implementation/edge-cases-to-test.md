# Database Edge Cases to Test

**Purpose:** Document edge cases and validation rules for database implementation  
**Created:** 2025-08-15

## 🚨 Critical Edge Cases

### 1. EpisodeScheduleQueue
- **Race Condition**: Multiple workers picking same job
  - ✅ Solution: `FOR UPDATE SKIP LOCKED`
- **Retry Logic**: Failed episodes hitting max attempts
  - Rule: Max 3 attempts, then status='failed'
- **Time Zone**: User changes timezone mid-schedule
  - Store UTC, calculate display time dynamically
- **Blocked State**: Daily limit exceeded
  - All pending episodes → status='blocked'

### 2. TokenUsageDaily
- **Aggregation Timing**: Insert happens at midnight boundary
  - Use PostgreSQL trigger with proper date handling
- **Multiple Operations**: Same org, same day, different operations
  - Operation breakdown must handle concurrent updates
- **Cost Overflow**: Organization exceeds £50 daily limit
  - Circuit breaker blocks all generation

### 3. PlanningNote
- **Character Limit**: Note exceeds 240 chars
  - Frontend validation + database constraint
- **Orphaned Notes**: Episode deleted but note remains
  - Soft delete episodes, keep notes for context
- **Priority Conflict**: Multiple HIGH priority notes
  - Process by createdAt timestamp
- **Archive Logic**: When to auto-archive
  - After N episodes OR expiry date

### 4. UserEvent
- **Event Order**: Events arrive out of sequence
  - Use createdAt for ordering, not sequenceNumber
- **Session Tracking**: Session spans multiple days
  - sessionId groups events regardless of date
- **Missing Events**: Gap in expected sequence
  - System should handle gracefully

### 5. Block
- **Content Size**: Massive markdown content
  - Consider TEXT vs VARCHAR limits
- **Version Conflicts**: Multiple edits to same block
  - Use version field for optimistic locking
- **Orphaned Blocks**: Episode deleted but blocks remain
  - Cascade soft delete to blocks

### 6. Scheduling Edge Cases
- **No Days Selected**: User deselects all days
  - Frontend prevents (min 1 day required)
- **Past Scheduling**: scheduledFor is in the past
  - Skip and calculate next valid date
- **Pause/Resume**: Project paused with pending queue items
  - Cancel pending items when paused
- **Multiple Projects**: Scheduling conflicts
  - Each project independent queue

## 🔍 Validation Rules

### Required Fields
```typescript
// Every table MUST have
organizationId: string (except User)
createdAt: Date
updatedAt: Date

// Soft delete pattern
deletedAt?: Date | null
deletedBy?: string | null
```

### ID Patterns
```typescript
// Consistent prefixing
EpisodeScheduleQueue: 'queue_[cuid]'
PlanningNote: 'note_[cuid]'
UserEvent: 'event_[cuid]'
AuditLog: 'audit_[cuid]'
Block: 'blk_[cuid]'
```

### Status Transitions
```typescript
// Episode Schedule Queue
pending → processing → completed
pending → processing → failed
pending → cancelled (user action)
pending → blocked (cost limit)

// Planning Note
pending → acknowledged → incorporated
pending → acknowledged → deferred
pending → archived (auto or manual)
```

## 🧪 Test Scenarios

### Concurrent Access
1. Two workers try to process same queue item
2. Multiple users updating same project settings
3. Simultaneous episode generation for same project

### Data Integrity
1. Organization deleted - what happens to data?
2. User removed from org - access control
3. Project deleted - cascade to episodes, blocks, notes

### Performance
1. Query daily usage for org with 1000+ token records
2. Fetch all blocks for episode with 50+ blocks
3. Calculate next scheduled date with complex cadence

### Limits
1. Hit daily cost limit mid-generation
2. Exceed project limit for subscription tier
3. Rate limit on planning note creation

## 📝 Database Constraints

### Add These Constraints
```sql
-- Character limits
ALTER TABLE planning_note ADD CONSTRAINT note_length CHECK (LENGTH(note) <= 240);

-- Enum constraints
ALTER TABLE episode_schedule_queue ADD CONSTRAINT valid_status 
  CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'blocked'));

-- Unique constraints
ALTER TABLE token_usage_daily ADD CONSTRAINT unique_org_date 
  UNIQUE (organization_id, date);

-- Foreign key constraints with soft delete consideration
-- Use partial indexes for soft-deleted records
```

### Indexes Needed
```sql
-- Queue processing
CREATE INDEX idx_queue_pending ON episode_schedule_queue(status, scheduled_for) 
  WHERE status = 'pending' AND deleted_at IS NULL;

-- Token usage aggregation
CREATE INDEX idx_token_org_date ON token_usage(organization_id, created_at)
  WHERE deleted_at IS NULL;

-- Event tracking
CREATE INDEX idx_events_user_type ON user_event(user_id, event_type)
  WHERE deleted_at IS NULL;

-- Planning notes
CREATE INDEX idx_notes_project_status ON planning_note(project_id, status)
  WHERE status = 'pending' AND deleted_at IS NULL;
```

## 🔐 Security Considerations

### Row Level Security
- Every query must filter by organizationId
- Soft deleted records excluded by default
- User must belong to organization

### Audit Requirements
- Track who deleted records (deletedBy)
- Log sensitive operations in AuditLog
- Never hard delete user data

### Cost Protection
- Check TokenUsageDaily before ANY AI operation
- Enforce hard stop at daily limit
- Alert on approaching limits

## Next Steps for Testing

1. **Create test data** with edge cases
2. **Write validation functions** for constraints
3. **Test concurrent access** patterns
4. **Verify cascade behaviors**
5. **Performance test** with large datasets

Remember: It's better to catch these edge cases in mock data than in production!