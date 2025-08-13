# CLAUDE.md Strategy for Many Futures

**Purpose:** Strategic placement of CLAUDE.md files to provide context for AI assistants working on different parts of the codebase.

## Recommended CLAUDE.md Locations

### 1. `/many-futures/src/server/CLAUDE.md`
**Purpose:** API and database context
```markdown
# Server-Side Context

## Database Patterns
- All queries MUST filter by organizationId
- Use transactions for multi-table operations
- Track token usage on EVERY AI call

## API Security
- Validate organization membership
- Check rate limits before AI calls
- Enforce cost controls ($2/episode, $50/day)

## Episode Generation
- Status flow: DRAFT → GENERATING → PUBLISHED/FAILED
- Always update status on failure
- Store generation metrics for debugging
```

### 2. `/many-futures/src/app/api/CLAUDE.md`
**Purpose:** API route patterns
```markdown
# API Routes Context

## Authentication Pattern
Every route must:
1. Check auth with Clerk
2. Validate org membership
3. Filter by organizationId

## n8n Integration
- Episode generation triggered via webhook
- Status updates from n8n workflow
- Track costs in TokenUsage table

## Error Handling
- Return user-friendly messages
- Log full errors to Sentry
- Preserve episode drafts on failure
```

### 3. `/many-futures/src/app/api/episodes/CLAUDE.md`
**Purpose:** Episode API endpoints
```markdown
# Episode API Context

## n8n Webhook Integration
- Receive episode generation requests
- Update episode status (DRAFT → GENERATING → PUBLISHED/FAILED)
- Store blocks and citations from n8n

## Status Management
- DRAFT: Created, awaiting generation
- GENERATING: n8n workflow running
- PUBLISHED: Successfully generated and stored
- FAILED: Generation failed, preserve draft

## Cost Tracking
- Receive token usage from n8n
- Store in TokenUsage table
- Enforce limits ($2/episode, $50/day)
```

### 4. `/many-futures/src/components/episode/CLAUDE.md`
**Purpose:** Episode UI components
```markdown
# Episode Components Context

## Markdown Rendering
- Support inline source links
- Highlight quotes with blockquotes
- Section headers with icons

## Source Display
- Inline hyperlinks in content
- Source list at end (optional)
- Credibility indicators (future)

## Feedback Collection
- 1-5 star ratings per block
- Optional text feedback
- Track which sources clicked
```

### 5. `/many-futures/src/app/(dashboard)/projects/CLAUDE.md`
**Purpose:** Project management UI
```markdown
# Projects UI Context

## Data Access
- Always scope to current organization
- Prefetch episodes with projects
- Cache project list client-side

## Status Logic
- Active projects MUST have nextScheduledAt
- Paused projects can't generate episodes
- Draft episodes don't count toward limits

## UI Patterns
- Off-gray backgrounds (stone-50)
- Card hover with shadow + lift
- Status dots not badges
```

### 6. `/many-futures/docs/CLAUDE.md`
**Purpose:** Documentation overview
```markdown
# Documentation Context

## Document Types
- Development diary: Day-by-day progress
- Design language: UI/UX decisions
- Architecture: Technical decisions
- Handover docs: Session continuity

## Key Principles
- MVP first, complexity later
- Organizations from day 1
- Markdown over complex structures
- Navigation over implementation

## Current Phase
- UI complete with mock data
- Next: Supabase + Clerk setup
- Target: 5 paying customers
```

## Implementation Strategy

### Phase 1: Core CLAUDE.md Files
1. Root `/many-futures/CLAUDE.md` (already exists)
2. Server context for database patterns
3. Episode API webhook patterns

### Phase 2: Feature-Specific Context
1. n8n webhook integration
2. Project management rules
3. Billing and limits

### Phase 3: Maintenance Context
1. Common bugs and fixes
2. Performance patterns
3. Migration strategies

## Best Practices for CLAUDE.md Files

### DO:
- Keep context focused on the directory's purpose
- Include code examples for complex patterns
- Update when patterns change
- Reference related CLAUDE.md files

### DON'T:
- Duplicate information from root CLAUDE.md
- Include temporary workarounds
- Add user-specific preferences
- Include secrets or credentials

## Maintenance

Review CLAUDE.md files:
- After major features ship
- When patterns change
- Before onboarding new developers
- During architecture reviews

## Benefits

1. **Faster AI assistance** - Context readily available
2. **Consistent patterns** - Same rules applied everywhere
3. **Reduced errors** - Critical constraints documented
4. **Better handoffs** - New sessions have context

## Example Usage

When an AI assistant is asked to work on episode generation:
1. Reads root CLAUDE.md for project context
2. Reads `/src/lib/ai/CLAUDE.md` for AI patterns
3. Reads `/src/server/CLAUDE.md` for database patterns
4. Has full context to make correct decisions

This distributed context approach ensures AI assistants have the right information at the right level of the codebase.