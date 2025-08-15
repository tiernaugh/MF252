# Many Futures - Project Context

## What is Many Futures?

Many Futures is an **agentic foresight assistant** that transforms how businesses think about the future. Instead of expensive consultants or scattered trend reports, we deliver personalized, AI-powered strategic intelligence every week.

### The Problem We Solve
Strategy teams and innovation leads waste countless hours on:
- Reading generic industry reports that miss their specific context
- Manually tracking scattered signals across newsletters and blogs  
- Paying consultants £10k+ for episodic foresight workshops
- Missing weak signals that could reshape their industry

### Our Solution
A personal AI research agent (Futura) that:
1. **Understands your context** through conversational onboarding
2. **Researches continuously** across your strategic landscape
3. **Delivers weekly episodes** of curated insights and scenarios
4. **Learns from feedback** to become increasingly relevant

## The User Journey (Simplified)

```
User creates project → Futura generates episode → User reads → User gives feedback 
```

### Key Experience Moments

**1. Project Creation (3-4 minute conversation)**
- User describes what future they're curious about
- Futura asks clarifying questions about context, role, preferences
- Results in a project brief that guides all future research

**2. Episode Delivery (Weekly)**
- Email notification when ready
- 7-10 minute read of strategic insights
- Beautiful, editorial-quality typography
- Block-based content (insights, signals, scenarios)

**3. Feedback Loop**
- Simple thumbs up/down per block
- Optional text feedback
- Shapes next episode's focus

## The Lean MVP 

### What We're Building (Phase 0-1)
1. **Conversational UI** - GPT-5 powered project creation
2. **Episode Generation** - Claude-powered research synthesis  
3. **Reading Experience** - Beautiful, focused content display
4. **Flexible Scheduling** - Any day combination (daily, weekly, custom)
5. **Project Settings** - User control over delivery schedule
6. **Payment Gate** - Single project limit for MVP (pricing TBD based on usage)

### What We're NOT Building (Yet)
- ❌ Chat interface (no evidence users want it)
- ❌ Vector embeddings (expensive, unproven value)
- ❌ Memory UI (backend only for MVP)
- ❌ Multiple projects (single project limit for pricing control)
- ❌ Team collaboration (single user first)
- ❌ Frequency restrictions (let users choose any schedule)

### Critical Safety Features
- **Cost Controls**: £2 max per episode, £50/day kill switch
- **Token Tracking**: Every API call logged in TokenUsage table
- **Admin Overrides**: Regenerate, pause, refund capabilities
- **Progressive Enhancement**: Feature flags for everything

## Why This Matters

### For Users
- **Save 5+ hours/week** on research and synthesis
- **Look smarter** in strategy meetings with cutting-edge insights
- **Pay £29/month** instead of £10k for consultant workshops
- **Get personalized intelligence** not generic reports

### For Us  
- **Validate core loop** before adding complexity
- **Learn what users actually want** vs what we assume
- **Ship in 2 weeks** not 5 weeks
- **Target: 5 paying customers** to prove value

## Success Metrics (Keep It Simple)

1. **Do people read episodes?** (>50% completion rate)
2. **Do they come back?** (Week 2 retention >70%)
3. **Will they pay?** (5 customers at £29/month)

Everything else is vanity metrics until we prove these three.

## Technical Philosophy

### Build for Learning, Not Scale
- Feature flags over perfect architecture
- PostgreSQL over vector databases (until proven needed)
- Markdown content over complex block structures
- Simple feedback over sophisticated memory

### The Migration Mindset
We're moving from next-forge to T3 because:
- Simpler architecture = faster iteration
- Fewer abstractions = easier debugging  
- T3 patterns = well-documented, community-supported
- Direct control = no fighting boilerplate assumptions

## Key Insight

> "We were building YouTube before validating people want videos"

The comprehensive 5-week plan assumed users wanted chat, embeddings, and complex memory. But we don't know that. The lean MVP tests the core hypothesis: **Will businesses pay for AI-generated strategic intelligence?**

Once we prove that, we can add everything else.

---

## Master TODO - MVP Build

### Infrastructure Setup
- [x] Deploy with Vercel (configured with root directory)
- [x] Scaffold basic UI with mock data
  - [x] Setup shadcn/ui with stone theme
  - [x] Create mock data structure with orgs
  - [x] Build dashboard layout
  - [x] Build projects page
  - [x] Build episode reader
  - [x] Build new project conversation
  - [x] Implement unified design system
- [ ] Set up database with Supabase
- [ ] Attach database to UI
- [ ] Add authentication with Clerk
- [ ] Error management with Sentry
- [ ] Analytics with PostHog
- [ ] Rate limiting with Upstash

### Core Features
- [x] Project creation flow (conversational UI)
- [x] Project settings page (flexible scheduling)
- [ ] Episode generation system
- [x] Reading experience UI
- [ ] Feedback collection system
- [ ] Payment integration (Stripe)

### Safety & Admin
- [ ] Cost control implementation
- [ ] Token usage tracking
- [ ] Admin dashboard
- [ ] Feature flags setup

---

## Tech Stack
- **Framework**: T3 (Next.js, tRPC, TypeScript, Tailwind)
- **Database**: Supabase (PostgreSQL)
- **Auth**: Clerk
- **Payments**: Stripe
- **AI Orchestration**: n8n Cloud (handles Research, Writer, QA agents)
- **AI Models**: OpenAI GPT-5 (conversations), Claude (episodes via n8n)
- **Monitoring**: Sentry
- **Analytics**: PostHog
- **Rate Limiting**: Upstash
- **Deployment**: Vercel

---

## 🚨 Critical Database Tables (Production Required)

### Must Have for Production
1. **EpisodeScheduleQueue** - Queue-based scheduling (prevents cascade failures)
2. **TokenUsageDaily** - Aggregated costs (performance critical)
3. **PlanningNote** - User feedback loop (Priority 1!)
4. **UserEvent** - Flexible event tracking (no schema migrations)
5. **AuditLog** - Compliance and debugging

### Phase 2 Ready (Create Now)
6. **Block** - Content structure (start with markdown)
7. **AgentMemory** - Future memory system
8. **ChatSession/ChatMessage** - Conversation tracking
9. **Highlight** - User text selections

---

## Development Rules & Patterns

### Data Architecture Rules

#### Organizations Are Mandatory
- **ALWAYS** include organizations from day 1
- Every user gets a personal organization on signup
- All data (projects, episodes, token usage) is scoped to organizations
- Clerk handles org switching UI and context
- This prevents painful migrations when adding teams/billing later

#### Core Data Model
```typescript
// Every table includes organizationId
projects.organizationId // Required
episodes.organizationId // Denormalized for performance
tokenUsage.organizationId // For billing

// Project scheduling (flexible)
project.cadenceConfig = {
  mode: 'weekly' | 'daily' | 'custom',
  days: [0,1,2,3,4,5,6], // Any combination, 0=Sunday
}

// User timezone for scheduling
user.timezone = "Europe/London" // IANA timezone

// Data access pattern
const data = await db.query.findMany({
  where: eq(table.organizationId, currentOrgId)
});
```

### UI/UX Design System (Unified Editorial Design)

#### Core Design Philosophy
- **"Intelligence Publication Platform"** - The Economist meets Substack
- **Editorial elements on functional pages** without sacrificing usability
- **Serif typography for all major headings** (Lora font family)
- **Context-aware navigation** (full for lists, minimal for reading)

#### Typography System
```typescript
// Font Stack
- Serif: Lora, Charter, Georgia (major headings, episode content)
- Sans: Inter, system-ui (UI text, metadata)

// Hierarchy
- H1: font-serif text-4xl md:text-5xl (hero titles)
- H2: font-serif text-2xl md:text-3xl (cards, sections)
- H3: font-sans text-xl (subsections)
- Body: font-sans (UI), font-serif (reading)
```

#### Component Library
- **Framework**: shadcn/ui (New York style)
- **Primary Background**: White (not stone-50)
- **Borders**: stone-200 throughout
- **Hover States**: shadow-xl, -translate-y-1, 300ms transitions
- **Icons**: Lucide React

#### Navigation Patterns
```typescript
// Context-aware navigation modes
1. Full Navigation: Projects list, Dashboard
2. Minimal Navigation: Episodes, Project detail (auto-hides on scroll)
3. Navigation handled by dashboard layout based on pathname
```

#### Page Structure
```
app/
├── (dashboard)/       # Authenticated routes
│   ├── layout.tsx    # Context-aware nav
│   ├── projects/     
│   │   ├── page.tsx  # Projects list (serif titles)
│   │   └── new/      # Conversational UI
│   └── episodes/
│       └── [id]/     # Episode reader
```

### Feature Implementation Patterns

#### Conversational UI
- **4-turn conversation** to generate project brief
- Store full conversation in `onboardingBrief` JSON field
- Typewriter effect for brief generation
- Mock responses in dev, real GPT-4/5 in production

#### Episode Storage
- **Markdown in TEXT field** (not complex blocks)
- Pre-calculate `readingMinutes`
- Track status: DRAFT, GENERATING, PUBLISHED, FAILED
- Simple 1-5 star feedback

#### Token Usage Tracking (Critical)
```typescript
// MUST track every AI call
{
  organizationId: string,
  model: string,
  promptTokens: number,
  completionTokens: number,
  totalCost: number, // In dollars
}
```

### What NOT to Build (MVP Scope)
- ❌ Chat interface for episodes
- ❌ Vector embeddings (n8n handles via pgvector)
- ❌ Highlight/annotation tools
- ❌ Share features
- ❌ Team collaboration
- ❌ Multiple content block types
- ❌ AI orchestration in app (handled by n8n)

### n8n Integration Architecture
```typescript
// Episode Generation Flow:
1. App creates DRAFT episode with nextScheduledAt
2. Cron/trigger calls n8n webhook with episode ID
3. n8n workflow:
   - Research Agent: Gathers facts/citations
   - Writer Agent: Creates blocks + citations
   - QA/Guardrails: Validates output
4. n8n calls back to app API with:
   - Episode content (markdown)
   - Sources array
   - Token usage for billing
5. App updates episode status to PUBLISHED/FAILED
```

### API Security Patterns
```typescript
// Every API route must:
1. Check organization context
2. Validate user belongs to org
3. Filter all queries by orgId
4. Track token usage
5. Enforce cost limits
```

### Critical Production Patterns

#### Queue Processing (MUST USE)
```typescript
// Prevent double-processing with row locking
const pending = await db.$queryRaw`
  SELECT * FROM episode_schedule_queue 
  WHERE status = 'pending' 
  AND scheduled_for <= NOW()
  FOR UPDATE SKIP LOCKED  -- CRITICAL: Prevents race conditions
`;
```

#### Cost Control (MUST USE)
```typescript
// Check aggregated table, NOT raw records
const usage = await db.tokenUsageDaily.findFirst({
  where: { organizationId, date: today }
});
if (usage?.total_cost_gbp >= 50) {
  // Circuit breaker - block all generation
}
```

#### Event Tracking (MUST USE)
```typescript
// Use flexible events, NOT boolean flags
await db.userEvent.create({
  data: {
    eventType: 'episode_opened',  // String, not enum
    eventData: { episodeId, duration }  // Flexible JSON
  }
});
// Derive metrics: SELECT COUNT(*) WHERE eventType = 'episode_opened'
```

#### Planning Notes (Priority 1)
```typescript
// User feedback is CORE to value prop
await db.planningNote.create({
  data: {
    note: userFeedback,  // Max 240 chars
    status: 'pending',   // Process in next episode
    scope: 'NEXT_EPISODE'
  }
});
```

### Cost Controls & Pricing Model
- **MVP Pricing**: Single project limit (any frequency)
- **Future Pricing**: Project-based tiers (1, 3, unlimited)
- **Per Episode**: £2 maximum cost control
- **Daily Limit**: £50 per organization
- **Tracking**: Every token logged with cost
- **Learning Mode**: Understand true cost-per-episode at different frequencies

### Development Workflow

#### Testing Approach
1. Build with mock data first
2. Validate data model through UI
3. Connect real services incrementally
4. Test with limited API calls

#### TypeScript Best Practices

##### Type Safety Rules
```typescript
// ALWAYS use nullish coalescing for fallbacks
const value = array[index] ?? defaultValue;  // ✅
const value = array[index] || defaultValue;   // ❌ Can cause type errors

// ALWAYS specify return types for functions
const getItem = (index: number): string => {  // ✅
const getItem = (index: number) => {          // ❌ Implicit any/undefined

// ALWAYS handle undefined cases in JSX
<div>{items[0] ?? 'No items'}</div>  // ✅
<div>{items[0]}</div>                // ❌ Could render undefined

// Prefer interfaces over types for objects
interface ProjectData {  // ✅
  id: string;
  title: string;
}
type ProjectData = {     // ❌ Use interface instead
  id: string;
  title: string;
}

// Avoid enums, use const maps instead
const Status = {         // ✅
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
} as const;
enum Status {            // ❌ Avoid enums
  DRAFT,
  PUBLISHED,
}
```

##### Code Style and Structure
```typescript
// Use descriptive variable names with auxiliary verbs
const isLoading = true;      // ✅
const hasError = false;      // ✅
const loading = true;        // ❌ Less descriptive

// Use functional and declarative patterns
const filteredProjects = projects.filter(p => p.active);  // ✅
let filtered = [];                                        // ❌
for (let p of projects) {
  if (p.active) filtered.push(p);
}

// Structure component files consistently
export default function ProjectCard() { }  // 1. Main component
const ProjectHeader = () => { }            // 2. Subcomponents
const formatDate = () => { }               // 3. Helper functions
const DEFAULT_STATUS = 'draft';            // 4. Static content
interface ProjectCardProps { }             // 5. Types
```

##### Next.js 15 Performance Patterns
```typescript
// Minimize 'use client' - favor Server Components
// ❌ BAD - Entire page is client component
"use client";
export default function ProjectsPage() {
  const [filter, setFilter] = useState('');
  // ...
}

// ✅ GOOD - Server component with client islands
// page.tsx (server component)
export default function ProjectsPage() {
  const projects = await getProjects();
  return <ProjectList projects={projects} />;
}
// ProjectList.tsx (client component for interactivity only)
"use client";
export function ProjectList({ projects }) {
  const [filter, setFilter] = useState('');
  // ...
}

// Use Suspense for async components
<Suspense fallback={<ProjectsSkeleton />}>
  <ProjectsList />
</Suspense>
```

##### Naming Conventions
```typescript
// Use lowercase-with-dashes for directories
src/components/auth-wizard/   // ✅
src/components/AuthWizard/    // ❌

// Favor named exports for components
export function ProjectCard() { }   // ✅
export default ProjectCard;         // ❌ (except for pages)

// Use "function" keyword for pure functions
function calculateReadingTime(content: string): number { }  // ✅
const calculateReadingTime = (content: string) => { }      // ❌ For pure functions
```

#### Pre-Commit Checklist
```bash
# Run these before EVERY commit
pnpm typecheck     # Check TypeScript types
pnpm build         # Ensure production build works
pnpm check:write   # Format with Biome
```

#### Key Files Reference
- `/src/lib/mock-data.ts` - Data model documentation
- `/src/app/(dashboard)/layout.tsx` - Main authenticated layout
- `/src/env.js` - Environment validation
- `/src/lib/CLAUDE.md` - TypeScript patterns for lib functions
- `/src/components/CLAUDE.md` - TypeScript patterns for components
- This file - Development rules and patterns

### Deployment Checklist
- [ ] **Run `pnpm typecheck` - no errors**
- [ ] **Run `pnpm build` - builds successfully**
- [ ] Environment variables in Vercel
- [ ] Database URL configured
- [ ] Clerk keys set
- [ ] OpenAI API key added
- [ ] Cost limits configured
- [ ] Root directory set to `many-futures`

---

Last Updated: 2025-08-15
MVP Version: 0.1
Key Changes: Flexible scheduling, project-based pricing, no memory UI