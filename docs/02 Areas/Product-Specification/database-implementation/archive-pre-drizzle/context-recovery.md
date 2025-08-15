# Context Recovery Guide

**Purpose:** Everything needed to resume database implementation if context is lost  
**Last Updated:** 2025-08-15 (End of major schema work)

## 🎯 Where We Are

✅ **SCHEMA COMPLETE** - All critical issues resolved, ready for Supabase implementation.

We've completed:
1. Database schema with all 12 tables defined
2. Resolved timing ambiguity (generation vs delivery times)
3. Added all unique constraints and indexes
4. Documented service role configuration
5. Created comprehensive RLS policies
6. Updated to 4-hour generation window
7. Added idempotency keys and priority queue

## 🔑 Critical Context

### Product Context
- **Many Futures**: AI-powered strategic intelligence platform
- **Core Loop**: Weekly episodes generated based on project context
- **Two-Loop Architecture**: Editorial (async) + Conversational (real-time)
- **MVP Focus**: Single user, one project limit, flexible scheduling

### Technical Context
- **Stack**: T3 (Next.js, tRPC, TypeScript, Tailwind)
- **Database**: Supabase (PostgreSQL)
- **Current State**: Front-end built with mock data
- **Next Step**: Align schema → Update mock data → Connect Supabase

### Recent Work Completed
1. ✅ Built project settings page with flexible scheduling
2. ✅ Updated to cadenceConfig (days array) from simple cadenceType
3. ✅ Added timezone support to User type
4. ✅ Reviewed expert feedback on database schema
5. ✅ Created comprehensive response document

## 📊 Schema Decisions

### Must Have Tables (9 Critical)

1. **EpisodeScheduleQueue** - Prevents production failures
2. **TokenUsageDaily** - Performance optimization
3. **PlanningNote** - User feedback loop (Priority 1!)
4. **AgentMemory** - Future-proof memory system
5. **UserEvent** - Flexible event tracking
6. **AuditLog** - Compliance and debugging
7. **Block** - Content structure (start simple)
8. **ChatSession/ChatMessage** - Phase 2 ready
9. **Highlight** - User interaction tracking

### Key Implementation Details

```typescript
// Queue processing pattern
SELECT * FROM episode_schedule_queue 
WHERE status = 'pending' 
FOR UPDATE SKIP LOCKED  // Prevents double-processing

// Aggregation pattern
CREATE TRIGGER update_token_daily
AFTER INSERT ON token_usage
FOR EACH ROW EXECUTE FUNCTION update_daily_aggregates();

// Event tracking pattern
interface UserEvent {
  eventType: string;  // 'onboarding_complete', 'episode_opened'
  eventData?: any;    // Flexible context
}
```

## ✅ Completed Work (2025-08-15)

### Schema & Documentation Complete
1. ✅ Updated `/src/lib/database-schema.ts` with timing clarifications
2. ✅ Created comprehensive schema documentation with rationale
3. ✅ Resolved all timing ambiguities (generationStartTime vs targetDeliveryTime)
4. ✅ Added unique constraints to prevent duplicates
5. ✅ Documented service role configuration for cron jobs
6. ✅ Created RLS policies for all tables
7. ✅ Added performance-critical indexes
8. ✅ Created trigger with error handling
9. ✅ Documented cron schedules
10. ✅ Updated mock data to match schema

## 🚧 Next Tasks

### Supabase Implementation
1. Create Supabase project
2. Run migrations in single transaction
3. Create RLS policies immediately after tables
4. Add all constraints and indexes
5. Set up two clients (anon + service_role)
6. Test with both keys
7. Implement cron jobs

### Files to Modify

1. **`/src/lib/database-schema.ts`**
   - Add new table interfaces
   - Update existing tables (Episode)
   - Add comprehensive comments

2. **`/src/lib/mock-data.ts`**
   - Add new type exports
   - Create mock data for new tables
   - Update existing mock data

3. **Front-end pages to test:**
   - `/projects` - List view
   - `/projects/[id]` - Detail view
   - `/projects/[id]/settings` - Settings (uses cadenceConfig)
   - `/episodes/[id]` - Episode reader

### Testing Commands
```bash
pnpm typecheck     # Must pass
pnpm build         # Must succeed
pnpm dev           # Test all pages
```

## ⚠️ Critical Requirements

### Every Table Must Have
- `id: string` (prefixed: ep_, proj_, etc.)
- `organizationId: string` (except User table)
- `createdAt: Date`
- `updatedAt: Date`
- Soft delete fields (deletedAt, deletedBy)

### Production Concerns
- **Scheduling**: Queue table prevents cascade failures
- **Performance**: Aggregation tables prevent slow queries
- **Feedback**: PlanningNote captures user intent immediately
- **Memory**: AgentMemory structure ready (even if unused)

## 📝 Implementation Checklist

### Ready for Implementation
- [x] Database schema complete with all tables
- [x] Timing fields clarified
- [x] Constraints documented
- [x] Service role configuration documented
- [x] RLS policies ready
- [x] Indexes defined
- [x] Triggers with error handling

### Tomorrow
- [ ] Create schema-final.ts for Supabase
- [ ] Write migration plan
- [ ] Update CLAUDE.md
- [ ] Create ADRs

### This Week
- [ ] Set up Supabase project
- [ ] Create tables with migrations
- [ ] Implement RLS policies
- [ ] Connect front-end to real data

## 🔗 Key Documents

### Expert Feedback
- `/docs/01 Projects/t3-handover/t3-database-updates/schema-priorities.md`
- `/docs/01 Projects/t3-handover/t3-database-updates/schema-revisions.md`
- `/docs/01 Projects/t3-handover/t3-database-updates/t3-database-schema-future-proof.md`

### Our Documentation
- `/docs/02 Areas/Product-Specification/PRDs-ADRs/database-schema/schema-feedback-response.md`
- `/docs/02 Areas/Product-Specification/PRDs-ADRs/project-settings/ADR-001-scheduling-architecture.md`

### Implementation
- `/src/lib/database-schema.ts` - Working schema
- `/src/lib/mock-data.ts` - Mock data
- `/many-futures/CLAUDE.md` - Patterns and rules

## 💡 Critical Implementation Notes

### Timing Fields (RESOLVED)
```typescript
// Episode table
scheduledFor: Date;           // User expects episode (9am)
generationStartedAt?: Date;   // Generation began (5am)

// Queue table  
generationStartTime: Date;    // START generation (5am)
targetDeliveryTime: Date;     // User expects (9am)
```

### Service Role Setup (CRITICAL)
```typescript
// Two clients needed:
const supabase = createClient(URL, ANON_KEY);           // Frontend
const supabaseAdmin = createClient(URL, SERVICE_KEY);   // Backend/Cron
```

### Key Decisions
1. **4-hour generation window** - Reliability over speed
2. **Idempotency keys** - Prevent duplicate episodes
3. **Priority queue** - Premium=10, Retry=8, Standard=5
4. **Planning notes persist** - Even if generation fails
5. **Soft deletes only** - Audit trail requirement

## 🚨 Common Pitfalls

1. **Don't forget organizationId** on every table
2. **Don't use JSON for queryable data** (except eventData)
3. **Don't skip soft delete fields**
4. **Don't forget `FOR UPDATE SKIP LOCKED`** in queue queries
5. **Don't query raw token_usage** for limits (use daily aggregate)

## 📞 Who to Ask

- **Database architecture**: Reference expert feedback docs
- **Product decisions**: Check PRDs and ADRs
- **Implementation details**: See schema-feedback-response.md
- **Front-end impact**: Test the listed pages

## 🎯 Success Criteria

1. All 9 tables defined with proper TypeScript types
2. Mock data matches schema exactly
3. No TypeScript errors (`pnpm typecheck`)
4. All front-end pages work
5. Clear migration path to Supabase

---

**If you're picking this up fresh:**
1. Read this document completely
2. Review the expert feedback in schema-feedback-response.md
3. Check the README.md for current status
4. Continue from the checklist in README.md

**Remember:** We're building for production resilience from day one!