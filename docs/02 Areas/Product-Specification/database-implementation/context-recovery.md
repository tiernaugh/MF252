# Context Recovery Guide

**Purpose:** Everything needed to resume database implementation if context is lost  
**Last Updated:** 2025-08-15

## 🎯 Where We Are

We're implementing the final database schema after two rounds of expert feedback. The schema needs to support our MVP while preventing future migrations through Phase 3.

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

### What We've Done
1. ✅ Updated `/src/lib/database-schema.ts` with all 9 critical tables
2. ✅ Updated `/src/lib/mock-data.ts` with types and mock data
3. ✅ Fixed all TypeScript errors
4. ✅ Verified build succeeds
5. ✅ Tested all front-end pages
6. ✅ Updated documentation

## 🚧 Next Tasks

### Edge Case Testing
Testing database edge cases and validation rules (see edge-cases-to-test.md)

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

### Immediate (Today)
- [ ] Update database-schema.ts with all 9 tables
- [ ] Update mock-data.ts to match
- [ ] Test all front-end pages
- [ ] Run typecheck and build

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

## 💡 Key Insights to Remember

1. **PlanningNote is Priority 1** - User feedback loop is core to value prop
2. **Queue table is critical** - Without it, production will break
3. **Create all tables now** - Empty tables are free, migrations are expensive
4. **Events over booleans** - Flexible tracking without schema changes
5. **Simple blocks for MVP** - One markdown block per episode initially

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