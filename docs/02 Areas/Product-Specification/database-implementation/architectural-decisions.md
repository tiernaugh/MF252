# Architectural Decisions

**Created:** 2025-08-15  
**Status:** 🟢 Decisions Made  
**Context:** Key technical decisions and their rationale

## 🎯 Core Architecture Decisions

### 1. Subscription Model vs On-Demand

**Decision**: Episodes are delivered on a subscription schedule, not generated on-demand.

**Rationale**:
- Sets clear user expectations (like a newsletter)
- Reduces system pressure (predictable load)
- Allows pre-generation and quality checks
- Matches user mental model of intelligence briefings

### 2. 4-Hour Generation Window

**Decision**: Start episode generation 4 hours before scheduled delivery time.

**Rationale**:
- Provides buffer for system failures or high load
- Allows manual intervention if needed
- Enables 3 retry attempts with spacing
- Content remains fresh (same-day generation)
- Still leaves 90-minute safety margin after final retry

**Timeline Example (9am delivery)**:
- 5:00am - Start generation
- 5:30am - First retry if failed
- 6:30am - Second retry
- 7:30am - Final retry
- 8:30am - Final checks
- 9:00am - Delivery

### 3. Scheduled Jobs vs Polling

**Decision**: Use precise scheduled jobs instead of checking every 5 minutes.

**Rationale**:
- More efficient resource usage
- Reduces database queries
- Predictable compute costs
- Can scale workers for known peak times
- 5-min cron kept as safety fallback only

**Implementation**:
```typescript
// Daily at midnight, schedule next day's jobs
scheduleGenerationJobs() {
  // Create precise jobs for each episode
  // Based on known delivery times
}
```

### 4. Row Level Security (RLS) First

**Decision**: Implement RLS policies in the same transaction as table creation.

**Rationale**:
- Security from day one (no vulnerability window)
- Enforces organization isolation at database level
- Prevents accidental data leaks in application code
- Service role bypass enables background jobs
- Audit trail for compliance

### 5. Idempotency Keys

**Decision**: Add idempotency keys to prevent duplicate episodes.

**Rationale**:
- Prevents retry storms from creating duplicates
- Ensures exactly-once delivery semantics
- Simple constraint at database level
- No complex deduplication logic needed

**Implementation**:
```sql
ALTER TABLE episodes 
ADD CONSTRAINT unique_episode_schedule 
UNIQUE (project_id, idempotency_key);
-- Key format: {projectId}-{scheduledFor}
```

### 6. Queue Priority System

**Decision**: Implement priority levels in episode generation queue.

**Rationale**:
- Premium users get faster service
- Failed retries get priority to meet deadlines
- Ensures SLA compliance for paid tiers
- Simple integer priority (1-10)

**Priority Levels**:
- 10: Premium subscribers
- 8: Retry attempts
- 5: Standard/Trial users
- 1: Bulk/batch operations

### 7. Soft Deletes Only

**Decision**: Never hard delete data, use soft delete pattern.

**Rationale**:
- Audit trail requirements
- Recovery from mistakes
- Historical analysis
- Compliance with data regulations
- RLS policies hide deleted records automatically

### 8. Planning Notes Persistence

**Decision**: User feedback persists even if episode generation fails.

**Rationale**:
- User effort shouldn't be wasted
- Feedback improves next successful episode
- Core to product value proposition
- Simple status tracking (pending → acknowledged → incorporated)

### 9. Cost Budget Per Episode

**Decision**: Budget £2-3 per episode including retries.

**Rationale**:
- Conservative estimate prevents surprises
- Covers GPT-4 for research
- Covers Claude for writing
- Includes retry costs
- Allows for model improvements

**Breakdown**:
- Research: £0.50 (GPT-4)
- Writing: £1.00 (Claude)
- QA: £0.50 (GPT-3.5)
- Buffer: £1.00 (retries/improvements)

### 10. Paused Projects Get Fresh Content

**Decision**: When unpaused, generate new episode rather than resume old.

**Rationale**:
- Avoids stale content
- Respects current web information
- User expects current intelligence
- Simpler than tracking pause duration

### 11. Failed Episodes Don't Break Subscriptions

**Decision**: If generation fails after all retries, skip and continue schedule.

**Rationale**:
- Maintains subscription predictability
- One failure shouldn't cascade
- User trust in regular delivery
- Failed episodes logged for review

### 12. Organization-First Data Model

**Decision**: Every table has organizationId from day one.

**Rationale**:
- Avoids painful migration later
- Enables team features eventually
- Clean billing separation
- RLS policies require it
- Clerk provides org context

## 📊 Technical Trade-offs

### What We're Optimizing For
1. **Reliability** over speed
2. **Predictability** over flexibility  
3. **Security** over convenience
4. **Simplicity** over features
5. **Cost control** over unlimited usage

### What We're Accepting
1. **4-hour lead time** - Less real-time but more reliable
2. **Failed episodes skip** - Some weeks might miss
3. **Higher costs** - £2-3 per episode for quality
4. **Scheduled jobs complexity** - More setup but efficient
5. **RLS overhead** - Slight performance hit for security

## 🔮 Future Considerations

These decisions support future features:
- **Team collaboration** - Org structure ready
- **Variable delivery times** - Scheduling flexible
- **Premium tiers** - Priority queue ready
- **Content versioning** - Soft deletes enable history
- **Advanced memory** - AgentMemory table created

## 📝 Decision Log

| Date | Decision | Rationale | Impact |
|------|----------|-----------|--------|
| 2025-08-15 | 4-hour generation window | Reliability buffer | Changes all timelines |
| 2025-08-15 | RLS from day one | Security first | All tables need policies |
| 2025-08-15 | Scheduled jobs | Efficiency | Requires job scheduler |
| 2025-08-15 | £2-3 per episode | Quality over cost | Affects pricing model |
| 2025-08-15 | Idempotency keys | Prevent duplicates | Schema change |

## 🔗 Related Documentation

- [Implementation Plan](./implementation-plan.md)
- [Subscription Delivery Model](./subscription-delivery-model.md)
- [RLS Security Policies](./rls-security-policies.md)
- [Database Schema](../../database-schema.ts)

---

**Note**: These decisions are made for MVP. We'll revisit as we learn from real usage.