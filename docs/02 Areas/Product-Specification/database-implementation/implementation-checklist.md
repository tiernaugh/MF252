# Database Implementation Checklist

**Purpose:** Step-by-step checklist for implementing the database schema  
**Started:** 2025-08-15  
**Target Completion:** End of week

## Phase 1: Schema Definition ⏳

### Update database-schema.ts

#### New Tables to Add
- [ ] EpisodeScheduleQueue interface
  - [ ] Include all scheduling fields
  - [ ] Add retry/failure fields
  - [ ] Add status enum
  - [ ] Add result tracking
  
- [ ] TokenUsageDaily interface
  - [ ] Date-based primary key
  - [ ] Aggregation fields
  - [ ] Operation breakdown
  - [ ] Last updated timestamp

- [ ] PlanningNote interface
  - [ ] User feedback fields
  - [ ] Status tracking
  - [ ] Processing metadata
  - [ ] Priority levels

- [ ] AgentMemory interface
  - [ ] Basic structure (content, importance)
  - [ ] Memory type enum
  - [ ] Expiration handling
  - [ ] Project association

- [ ] UserEvent interface
  - [ ] Flexible event type (string)
  - [ ] JSON event data
  - [ ] Timestamp
  - [ ] User/org association

- [ ] AuditLog interface
  - [ ] Action tracking
  - [ ] Resource identification
  - [ ] Old/new values (simple strings)
  - [ ] User attribution

- [ ] Block interface
  - [ ] Start with MARKDOWN type
  - [ ] Content field
  - [ ] Position ordering
  - [ ] Metadata fields (not JSON)

- [ ] ChatSession interface
  - [ ] Context tracking arrays
  - [ ] Token/cost counters
  - [ ] Session metadata
  - [ ] Active status

- [ ] ChatMessage interface
  - [ ] Role enum
  - [ ] Content
  - [ ] Token tracking
  - [ ] Extracted insights

- [ ] Highlight interface
  - [ ] Selection details
  - [ ] Block associations
  - [ ] User annotations
  - [ ] Chat references

#### Update Existing Tables
- [ ] Episode
  - [ ] Add generation_attempts field
  - [ ] Add generation_errors array
  - [ ] Verify all fields match latest schema

- [ ] Project
  - [ ] Verify cadenceConfig structure
  - [ ] Verify memories array
  - [ ] Check all relationships

## Phase 2: Mock Data Update ⏳

### Update mock-data.ts

#### Export New Types
- [ ] Export EpisodeScheduleQueue type
- [ ] Export TokenUsageDaily type
- [ ] Export PlanningNote type
- [ ] Export AgentMemory type
- [ ] Export UserEvent type
- [ ] Export AuditLog type
- [ ] Export Block type
- [ ] Export ChatSession type
- [ ] Export ChatMessage type
- [ ] Export Highlight type

#### Create Mock Data
- [ ] mockScheduleQueue array
  - [ ] Pending episodes
  - [ ] Processing episodes
  - [ ] Completed episodes
  - [ ] Failed episodes

- [ ] mockUserEvents array
  - [ ] Onboarding events
  - [ ] Episode interaction events
  - [ ] Settings change events

- [ ] mockPlanningNotes array
  - [ ] User feedback examples
  - [ ] Different statuses
  - [ ] Various priorities

- [ ] mockBlocks array
  - [ ] One per episode (markdown)
  - [ ] Proper associations
  - [ ] Position ordering

- [ ] mockTokenUsageDaily
  - [ ] Today's usage
  - [ ] Yesterday's usage
  - [ ] Cost breakdowns

## Phase 3: Type Safety Verification ⏳

### TypeScript Checks
- [ ] Run `pnpm typecheck`
- [ ] Fix any type errors
- [ ] Ensure no `any` types (except eventData)
- [ ] Verify all relationships valid

### Build Verification
- [ ] Run `pnpm build`
- [ ] Fix any build errors
- [ ] Check bundle size

## Phase 4: Front-End Testing ⏳

### Test Each Page
- [ ] `/projects`
  - [ ] Lists load
  - [ ] Cards display
  - [ ] Links work

- [ ] `/projects/[id]`
  - [ ] Project details show
  - [ ] Episodes list
  - [ ] Upcoming episodes display

- [ ] `/projects/[id]/settings`
  - [ ] Settings load
  - [ ] Cadence config works
  - [ ] Save functionality

- [ ] `/episodes/[id]`
  - [ ] Episode content displays
  - [ ] Sources show
  - [ ] Navigation works

### Visual Verification
- [ ] No console errors
- [ ] No TypeScript warnings
- [ ] Data displays correctly
- [ ] Dates format properly

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