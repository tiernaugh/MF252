# Database Implementation Hub

**Last Updated:** 2025-08-15  
**Status:** 🟡 Schema Complete, Implementation Planned  
**Context:** Moving from prototype to production with Clerk auth & n8n integration

## 🎯 Current Objective

Transform the working prototype into a production application with:
1. **Supabase database** with all 9 critical tables
2. **Clerk authentication** with organization context
3. **n8n integration** for async episode generation (2-5 min)
4. **Production patterns** (queue processing, cost controls, event tracking)

## 📊 Implementation Status

### Core Tables (9 Critical + Phase 2)

| Table | Schema | Mock Data | Front-End | Status |
|-------|--------|-----------|-----------|---------|
| EpisodeScheduleQueue | ✅ | ✅ | N/A | Complete |
| TokenUsageDaily | ✅ | N/A | N/A | Schema Only |
| PlanningNote | ✅ | ✅ | Ready | Complete |
| AgentMemory | ✅ | N/A | N/A | Schema Only |
| UserEvent | ✅ | ✅ | Ready | Complete |
| AuditLog | ✅ | ✅ | N/A | Complete |
| Block | ✅ | ✅ | Ready | Complete |
| ChatSession | ✅ | N/A | N/A | Schema Only |
| ChatMessage | ✅ | N/A | N/A | Schema Only |
| Highlight | ✅ | N/A | N/A | Schema Only |

### Existing Tables (Updates)

| Table | Changes | Status |
|-------|---------|--------|
| Episode | Add generation_attempts, generation_errors | ✅ Complete |
| Project | Verify cadenceConfig, memories structure | ✅ Complete |
| User | Add timezone field | ✅ Complete |
| Organization | Verify structure | ✅ Complete |

## 📁 File Locations

### Schema Files
- **Main Schema:** `/src/lib/database-schema.ts`
- **Mock Data:** `/src/lib/mock-data.ts`
- **Final Schema:** `./schema-final.ts` (for Supabase)

### Documentation
- **Expert Feedback:** `/docs/01 Projects/t3-handover/t3-database-updates/`
- **Our Response:** `/docs/02 Areas/Product-Specification/PRDs-ADRs/database-schema/schema-feedback-response.md`
- **Project Settings:** `/docs/02 Areas/Product-Specification/PRDs-ADRs/project-settings/`

### Front-End Pages to Test
- `/src/app/(dashboard)/projects/page.tsx`
- `/src/app/(dashboard)/projects/[id]/page.tsx`
- `/src/app/(dashboard)/projects/[id]/settings/page.tsx`
- `/src/app/(dashboard)/episodes/[id]/page.tsx`

## 🔄 Implementation Timeline

### ✅ Completed (Schema & Mock Data)
1. Database schema defined with 9 critical tables
2. Mock data updated and tested
3. Front-end verified with mock data
4. Expert feedback incorporated

### 📋 Day 1: Database & API (Planned)
1. ⏳ Create Supabase project & tables
2. ⏳ Generate TypeScript types
3. ⏳ Build database client wrapper
4. ⏳ Implement project/episode CRUD APIs
5. ⏳ Create n8n webhook endpoints

### 📋 Day 2: Auth & Integration (Planned)
1. ⏳ Set up Clerk authentication
2. ⏳ Add organization context
3. ⏳ Connect UI to real database
4. ⏳ Implement async generation UI
5. ⏳ Test end-to-end flow

### 📋 Day 3: Production Patterns (Planned)
1. ⏳ Queue processing with row locking
2. ⏳ Cost control implementation
3. ⏳ Event tracking system
4. ⏳ Error recovery mechanisms
5. ⏳ Deploy to staging

## 🚨 Critical Decisions Made

### Based on Expert Feedback

1. **Queue-Based Scheduling**: EpisodeScheduleQueue table for resilience
2. **Performance Optimization**: TokenUsageDaily with PostgreSQL triggers
3. **Feedback Loop Priority**: PlanningNote table for MVP (not deferred)
4. **Future-Proofing**: Create all tables now, even if empty
5. **Event Tracking**: UserEvent table instead of boolean flags

### Our Additions

1. **Flexible Scheduling**: cadenceConfig with days array
2. **Project-Based Pricing**: Limit projects, not frequency
3. **Simple Blocks**: Start with one markdown block per episode
4. **Memories in Project**: Keep simple for MVP, prepare migration

## 📝 Quick Reference

### Key Patterns

```typescript
// Every table needs organizationId
interface AnyTable {
  id: string;
  organizationId: string;
  // ...
}

// Soft delete pattern
interface SoftDeletable {
  deletedAt?: Date | null;
  deletedBy?: string | null;
}

// Event tracking pattern
interface UserEvent {
  eventType: string;  // Flexible
  eventData?: any;    // Context
}
```

### Queue Processing

```sql
-- Critical for concurrency
SELECT * FROM episode_schedule_queue 
WHERE status = 'pending' 
FOR UPDATE SKIP LOCKED
```

### Cost Control

```typescript
// Check TokenUsageDaily, not raw records
const usage = await db.tokenUsageDaily.findFirst({
  where: { organizationId, date: today }
});
if (usage?.total_cost_gbp >= 50) {
  // Circuit breaker
}
```

## 🎯 Next Immediate Steps

1. **Create Supabase project** and run migrations
2. **Install Clerk** and configure authentication
3. **Create database client** (`/src/lib/db.ts`)
4. **Update project creation** to save to database
5. **Implement n8n webhooks** for episode generation

## 🚀 New Documentation

### Implementation Guides
- **[Implementation Plan](./implementation-plan.md)** - Complete roadmap from prototype to production
- **[n8n Integration Patterns](./n8n-integration-patterns.md)** - Async episode generation UX patterns

## 📞 Contact Points

- **Product Lead:** Review schema decisions
- **Expert Advisors:** Final review before Supabase
- **T3 Team:** Implementation support

## 🔗 Related Documents

### New Implementation Docs
- **[Implementation Plan](./implementation-plan.md)** - Day-by-day roadmap
- **[n8n Integration Patterns](./n8n-integration-patterns.md)** - Async generation UX
- **[Edge Cases to Test](./edge-cases-to-test.md)** - Critical scenarios

### Previous Work
- [Schema Feedback Response](../PRDs-ADRs/database-schema/schema-feedback-response.md)
- [Project Settings PRD](../PRDs-ADRs/project-settings/PRD-project-settings.md)
- [Scheduling Architecture ADR](../PRDs-ADRs/project-settings/ADR-001-scheduling-architecture.md)
- [Context Recovery Guide](./context-recovery.md)

---

**Remember:** This is our source of truth for the production implementation. Keep it updated as we progress!