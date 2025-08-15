# Database Implementation Checklist

**Purpose:** Step-by-step checklist for implementing the database schema  
**Started:** 2025-08-15  
**Target Completion:** End of week

## Phase 1: Schema Definition ✅ COMPLETE

### Update database-schema.ts

#### New Tables Added ✅
- [x] EpisodeScheduleQueue interface
  - [x] Include all scheduling fields
  - [x] Add retry/failure fields
  - [x] Add status enum
  - [x] Add result tracking
  
- [x] TokenUsageDaily interface
  - [x] Date-based primary key
  - [x] Aggregation fields
  - [x] Operation breakdown
  - [x] Last updated timestamp

- [x] PlanningNote interface
  - [x] User feedback fields
  - [x] Status tracking
  - [x] Processing metadata
  - [x] Priority levels

- [x] AgentMemory interface
  - [x] Basic structure (content, importance)
  - [x] Memory type enum
  - [x] Expiration handling
  - [x] Project association

- [x] UserEvent interface
  - [x] Flexible event type (string)
  - [x] JSON event data
  - [x] Timestamp
  - [x] User/org association

- [x] AuditLog interface
  - [x] Action tracking
  - [x] Resource identification
  - [x] Old/new values (simple strings)
  - [x] User attribution

- [x] Block interface
  - [x] Start with MARKDOWN type
  - [x] Content field
  - [x] Position ordering
  - [x] Metadata fields (not JSON)

- [x] ChatSession interface
  - [x] Context tracking arrays
  - [x] Token/cost counters
  - [x] Session metadata
  - [x] Active status

- [x] ChatMessage interface
  - [x] Role enum
  - [x] Content
  - [x] Token tracking
  - [x] Extracted insights

- [x] Highlight interface
  - [x] Selection details
  - [x] Block associations
  - [x] User annotations
  - [x] Chat references

#### Update Existing Tables ✅
- [x] Episode
  - [x] Add generation_attempts field
  - [x] Add generation_errors array
  - [x] Verify all fields match latest schema

- [x] Project
  - [x] Verify cadenceConfig structure
  - [x] Verify memories array
  - [x] Check all relationships

## Phase 2: Mock Data Update ✅ COMPLETE

### Update mock-data.ts

#### Export New Types ✅
- [x] Export EpisodeScheduleQueue type
- [x] Export TokenUsageDaily type (schema only)
- [x] Export PlanningNote type
- [x] Export AgentMemory type (schema only)
- [x] Export UserEvent type
- [x] Export AuditLog type
- [x] Export Block type
- [x] Export ChatSession type (schema only)
- [x] Export ChatMessage type (schema only)
- [x] Export Highlight type (schema only)

#### Create Mock Data ✅
- [x] mockScheduleQueue array
  - [x] Pending episodes
  - [x] Completed episodes
  - Note: Processing and Failed states not needed for MVP

- [x] mockUserEvents array
  - [x] Onboarding events
  - [x] Episode interaction events
  - [x] Settings change events

- [x] mockPlanningNotes array
  - [x] User feedback examples
  - [x] Different statuses
  - [x] Various priorities

- [x] mockBlocks array
  - [x] One per episode (markdown)
  - [x] Proper associations
  - [x] Position ordering

- [ ] mockTokenUsageDaily (deferred - aggregation table)

## Phase 3: Type Safety Verification ✅ COMPLETE

### TypeScript Checks ✅
- [x] Run `pnpm typecheck`
- [x] Fix any type errors
- [x] Ensure no `any` types (except eventData)
- [x] Verify all relationships valid

### Build Verification ✅
- [x] Run `pnpm build`
- [x] Fix any build errors
- [x] Check bundle size

## Phase 4: Front-End Testing ✅ COMPLETE

### Test Each Page ✅
- [x] `/projects`
  - [x] Lists load
  - [x] Cards display
  - [x] Links work

- [x] `/projects/[id]`
  - [x] Project details show
  - [x] Episodes list
  - [x] Upcoming episodes display

- [x] `/projects/[id]/settings`
  - [x] Settings load
  - [x] Cadence config works
  - [x] Save functionality

- [x] `/episodes/[id]`
  - [x] Episode content displays
  - [x] Sources show
  - [x] Navigation works

### Visual Verification ✅
- [x] No console errors
- [x] No TypeScript warnings
- [x] Data displays correctly
- [x] Dates format properly

## Phase 5: Documentation Update ⏳

### Update Core Documentation
- [ ] Update `/many-futures/CLAUDE.md`
  - [ ] Add new table descriptions
  - [ ] Update patterns section
  - [ ] Add queue processing pattern
  - [ ] Add event tracking pattern

### Create ADRs
- [ ] ADR-003-event-tracking.md
  - [ ] Why events over booleans
  - [ ] Implementation pattern
  - [ ] Migration strategy

- [ ] ADR-004-queue-based-scheduling.md
  - [ ] Problem with direct scheduling
  - [ ] Queue solution
  - [ ] Retry strategy

- [ ] ADR-005-planning-notes.md
  - [ ] Feedback loop importance
  - [ ] Two-Loop Architecture
  - [ ] Processing pipeline

## Phase 6: Migration Preparation ⏳

### Create schema-final.ts
- [ ] Complete TypeScript schema
- [ ] Ready for Prisma/Drizzle
- [ ] Include all indexes
- [ ] Add RLS policy comments

### Create migration-plan.md
- [ ] Step-by-step Supabase setup
- [ ] Table creation order
- [ ] RLS policy implementation
- [ ] Trigger creation
- [ ] Initial data seeding

## Phase 7: Final Verification ⏳

### Quality Checks
- [ ] All tables have organizationId
- [ ] All tables have soft delete fields
- [ ] All tables have timestamps
- [ ] All IDs use proper prefixes

### Performance Checks
- [ ] Aggregation tables identified
- [ ] Indexes documented
- [ ] Queue locking pattern verified
- [ ] RLS patterns optimized

### Security Checks
- [ ] Organization scoping enforced
- [ ] Audit fields present
- [ ] Token tracking complete
- [ ] Cost limits implementable

## Sign-off Checklist

Before marking complete:
- [ ] Schema matches expert recommendations
- [ ] Mock data works with front-end
- [ ] No TypeScript errors
- [ ] Documentation complete
- [ ] Migration path clear
- [ ] Team review completed

---

**Notes:**
- Check off items as completed
- Add notes for any deviations
- Document any blockers
- Update README.md status as you progress