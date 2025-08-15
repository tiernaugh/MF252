# Database Implementation Context

## What is CLAUDE.md?

CLAUDE.md files provide context-specific instructions and patterns that get automatically injected into AI conversations. This file focuses specifically on database implementation work.

## How to Use This File

1. **Automatic Context**: This file is automatically included when working in this folder
2. **Reference Patterns**: Use the patterns below for consistent implementation
3. **Avoid Repetition**: Don't re-explain these concepts in conversations
4. **Stay Focused**: This file contains ONLY database-specific patterns

## Current Database Status

- **Schema**: ✅ All 9 critical tables defined in `/src/lib/database-schema.ts`
- **Mock Data**: ⏳ Needs updating in `/src/lib/mock-data.ts`
- **Supabase**: ⏳ Not yet connected
- **Front-End**: ⏳ Needs testing with new schema

## Critical Tables Reference

### Production Critical (Must Have)
1. **EpisodeScheduleQueue** - Scheduling resilience
2. **TokenUsageDaily** - Performance optimization
3. **PlanningNote** - User feedback loop
4. **UserEvent** - Flexible tracking
5. **AuditLog** - Compliance

### Phase 2 Ready (Create Now)
6. **Block** - Content structure
7. **AgentMemory** - Memory system
8. **ChatSession/ChatMessage** - Chat
9. **Highlight** - Text selection

## Implementation Patterns

### When Creating Mock Data

```typescript
// Use proper ID prefixes
const mockScheduleQueue: EpisodeScheduleQueue[] = [
  {
    id: 'queue_abc123',  // NOT 'abc123'
    status: 'pending',
    attemptCount: 0,
    // ...
  }
];

// Include realistic states
const mockUserEvents: UserEvent[] = [
  { eventType: 'onboarding_started', ... },
  { eventType: 'onboarding_complete', ... },
  { eventType: 'first_episode_opened', ... },
  { eventType: 'first_feedback_provided', ... }
];

// Single Block per Episode (MVP)
const mockBlocks: Block[] = [
  {
    id: 'blk_123',
    episodeId: 'ep_abc',
    type: 'MARKDOWN',  // Only type for MVP
    content: fullEpisodeContent,  // Entire episode
    position: 10,
    // ...
  }
];
```

### When Testing Front-End

```typescript
// Check these specific patterns work:
1. Projects list shows cadenceConfig.days
2. Settings page saves/cancels properly
3. Episodes display with Block structure
4. No TypeScript errors with new types
```

### When Migrating to Supabase

```sql
-- Create tables in this order (dependencies)
1. Organizations, Users
2. OrganizationMember, Subscription
3. Projects
4. Episodes, EpisodeScheduleQueue
5. Blocks, PlanningNote
6. UserEvent, AuditLog, TokenUsage, TokenUsageDaily
7. ChatSession, ChatMessage, Highlight

-- Critical indexes
CREATE INDEX idx_queue_pending ON episode_schedule_queue(status, scheduled_for) 
WHERE status = 'pending';

CREATE INDEX idx_token_daily ON token_usage_daily(organization_id, date);

CREATE INDEX idx_user_events ON user_event(user_id, event_type);
```

### PostgreSQL Triggers

```sql
-- TokenUsageDaily aggregation trigger
CREATE OR REPLACE FUNCTION update_token_usage_daily()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO token_usage_daily (
    organization_id, date, total_tokens, total_cost_gbp
  ) VALUES (
    NEW.organization_id, 
    DATE(NEW.created_at),
    NEW.total_tokens,
    NEW.total_cost
  )
  ON CONFLICT (organization_id, date) DO UPDATE SET
    total_tokens = token_usage_daily.total_tokens + NEW.total_tokens,
    total_cost_gbp = token_usage_daily.total_cost_gbp + NEW.total_cost,
    last_updated = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_token_usage_daily
AFTER INSERT ON token_usage
FOR EACH ROW EXECUTE FUNCTION update_token_usage_daily();
```

## Common Mistakes to Avoid

1. **DON'T** query raw token_usage for daily limits
2. **DON'T** process queue without `FOR UPDATE SKIP LOCKED`
3. **DON'T** use boolean flags instead of events
4. **DON'T** defer PlanningNote - it's Priority 1
5. **DON'T** use JSON for queryable data (except eventData)
6. **DON'T** forget organizationId on every table
7. **DON'T** skip soft delete fields

## Testing Checklist

Before marking any database work complete:
- [ ] Run `pnpm typecheck` - no errors
- [ ] Run `pnpm build` - builds successfully
- [ ] Test all dashboard pages load
- [ ] Check console for TypeScript errors
- [ ] Verify mock data displays correctly
- [ ] Confirm no breaking changes

## Key Files

- **Schema**: `/src/lib/database-schema.ts`
- **Mock Data**: `/src/lib/mock-data.ts`
- **Main Context**: `/many-futures/CLAUDE.md`
- **Implementation Hub**: `./README.md`
- **Progress**: `./progress-summary.md`

## Migration Path

1. **Current**: Mock data with complete schema
2. **Next**: Update mock-data.ts to match schema
3. **Then**: Connect Supabase with migrations
4. **Finally**: Switch from mock to real data

Remember: Empty tables are free, migrations are expensive!