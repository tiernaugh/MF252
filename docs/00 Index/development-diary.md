# Many Futures Development Diary

## Day 1 - Initial Setup & Deployment

### Project Initialization
- Created new T3 app with: `pnpm create t3-app@latest`
- Configuration choices:
  - TypeScript
  - Tailwind CSS
  - No tRPC (keeping it simple for MVP)
  - No authentication provider (will add Clerk later)
  - Drizzle ORM
  - Next.js App Router
  - PostgreSQL
  - Biome for linting/formatting

### Git Repository Structure Issue
- **Problem**: Accidentally initialized git in parent directory (`/manyfutures/`) instead of project root
- **Result**: All files were committed with `many-futures/` prefix
- **Impact**: Vercel couldn't detect Next.js app at repository root

### Vercel Deployment
- **Initial Issue**: 404 error after deployment
- **Root Cause**: Build completed in 27ms with "no files prepared" - Vercel treating repo as static site
- **Solution**: Configured Vercel Root Directory to `many-futures` in project settings
- **Status**: Successfully deployed ✅

### Environment Variables
- T3 Env validation requires `DATABASE_URL` at build time
- Temporary solution: Added placeholder PostgreSQL URL for initial deployment
- Next step: Set up Supabase and update with real connection string

### Local Development
- Dev server runs on port 3001 (3000 was occupied)
- Default T3 landing page working locally and on Vercel

### Key Learnings
1. Always check git repository structure before first commit
2. Vercel's Root Directory setting is crucial for monorepo/subdirectory projects
3. T3 Env validation is strict - need valid environment variables even for initial deployment

### Next Steps (from TODO list)
- [ ] Scaffold basic UI with mock data
- [ ] Set up database with Supabase
- [ ] Attach database to UI
- [ ] Add authentication with Clerk
- [ ] Error management with Sentry
- [ ] Analytics with PostHog
- [ ] Rate limiting with Upstash

### URLs
- GitHub: https://github.com/tiernaugh/MF252
- Vercel Deployment: [Check Vercel dashboard for URL]

---

## Day 2 - UI Scaffolding with Mock Data

### Strategy Decision
- Building UI with mock data first to validate data model before database setup
- Including organizations from day 1 to avoid painful migrations later
- Leveraging Clerk for org management (when we add auth)

### shadcn/ui Setup
- Initialized with New York style, Stone color theme, CSS variables
- Installed components: button, card, input, badge, separator
- Using stone palette to match existing prototypes

### Data Architecture Decisions
- **Organizations from day 1**: Even though MVP is single-user, having org structure prevents migrations
- **Personal orgs by default**: Every user gets a personal workspace on signup
- **Clerk handles org UI**: We don't build custom org switchers
- **Token usage tracking**: Critical for billing, tracked per org from start

### Mock Data Structure
Creating comprehensive mock data that represents our final schema:
- Users with Clerk IDs
- Organizations (personal workspaces)
- Projects scoped to organizations
- Episodes with markdown content
- Token usage for cost tracking

### UI Components Built ✅
1. **Dashboard layout** - Clean navigation with org context, user menu placeholder
2. **Projects index** - Card grid showing projects with status, cadence, next episode
3. **Episode reader** - Beautiful typography, breadcrumbs, feedback collection
4. **New project conversation** - Chat UI with Futura, mock responses, brief generation with typewriter effect
5. All using comprehensive mock data with organizations

### Key Implementation Details
- Used shadcn/ui components (Button, Card, Input, Badge, Separator)
- Stone color palette throughout for consistency
- Tailwind Typography plugin for episode prose
- Mock data includes full org structure, projects, episodes, and token usage
- Conversational UI simulates 4-turn onboarding with brief generation
- Episode reader has 1-5 star rating system
- Projects show published/draft episode counts

### What We Validated
- Data model works well with organizations from day 1
- UI flows are intuitive and complete
- Episode reading experience is clean and focused
- Conversational onboarding feels natural
- Ready to connect to real database and APIs

### Testing Complete
- Dev server running on http://localhost:3001
- All routes working:
  - `/projects` - Projects dashboard with mock data
  - `/projects/new` - Conversational UI with Futura
  - `/episodes/[id]` - Episode reader with feedback
- UI responsive and styled consistently with stone theme

### Deployment Status
- Successfully committed all changes to GitHub
- All UI components working locally
- Ready for Vercel deployment with updated UI

### What's Working
- ✅ `/projects` - Projects dashboard with 3 mock projects
- ✅ `/projects/new` - Conversational UI with typewriter effect
- ✅ `/episodes/ep_1` - Episode reader with feedback system
- ✅ All shadcn/ui components installed and configured
- ✅ Mock data structure validated through UI

### Next Immediate Steps
1. Deploy updated UI to Vercel
2. Set up Supabase with validated schema
3. Add Clerk authentication with org support
4. Create API routes to replace mock data
5. Connect real AI services (GPT-4/5 for conversations)

---

## Day 3 - Enhanced Episodes & Project Details

### Episode Data Architecture
- **Enhanced Episode type** with sources tracking, research prompts, and highlight quotes
- **Markdown format with inline sources** - Using hyperlinks like `[Source Name](url)` for clickability
- **Separated episode content** into mock-episodes.ts for better organization
- **Rich content structure** while keeping simple markdown storage

### Mock Data Improvements
- Fixed logic: Active projects MUST have nextScheduledAt (paused proj_3 to fix)
- Added comprehensive episodes with real-world content patterns
- Included sources array for future analytics and credibility scoring
- Added research prompts to guide next episode generation

### Project Detail Page Built
Created `/projects/[id]/page.tsx` with:
- Project header with pause/resume controls
- Episode list showing published and draft episodes
- Status sidebar with project metrics
- Project brief display (from onboarding conversation)
- Source citations count on episode cards
- Reading time estimates

### Design Decisions
- **Sources as hyperlinks**: Better UX than footnotes, immediate context
- **Markdown over blocks**: Simpler storage, easier editing, portable
- **Research prompts**: Maintain narrative continuity between episodes
- **Highlight quotes**: Engagement and shareability

### Data Model Validated
The mock data structure successfully represents:
- Organizations from day 1 (avoiding migration pain)
- Projects with full lifecycle (active, paused, draft)
- Episodes with sources and metadata
- Token usage for billing

### UI/UX Refinements
- Projects page now sorts paused projects below active ones
- Off-gray backgrounds (stone-50) for premium feel
- Project avatars with initials
- Consistent hover states with shadow and lift
- Search and filter functionality working

### What's Working Well
- Mock data structure maps cleanly to UI needs
- Markdown format preserves richness while staying simple
- Source tracking enables future features (credibility, analytics)
- Project detail page provides clear overview

### Technical Debt to Address
- Episode reader needs source display enhancement
- No real-time episode generation status
- Feedback collection not connected
- Settings pages are placeholders

### Deployment Status
- All changes committed and pushed to GitHub
- Vercel auto-deploying from main branch
- UI fully functional with mock data

---

## Day 4 - Project Detail Page Redesign

### Editorial Design Pattern
- **Problem**: Initial project detail page felt like admin UI, not editorial product
- **Solution**: Merged best of prototype design with functional requirements
- **Inspiration**: Monocle/Wired editorial layouts

### Key Design Changes
- **Hero Episode Pattern**: 
  - Large serif typography (4-5xl titles)
  - Prominent pull quotes with border accent
  - Clear metadata hierarchy (Episode # • Reading time • NEW badge)
  - Editorial-style CTA button with hover effects

- **Activity Indicators**:
  - NEW badge for episodes < 7 days old
  - Calculated from publishedAt date
  - Future: UNREAD tracking via localStorage

- **Next Episode Preview**:
  - "COMING THURSDAY" dynamic day display
  - Research questions being explored
  - Influence window countdown timer
  - Subtle, doesn't compete with hero

- **Visual Refinements**:
  - Stone-50 background for premium feel
  - Gradient dividers between sections
  - Card hover with shadow + lift animation
  - Search with icon-based input

### Documentation Created
- **Project Detail PRD**: Comprehensive requirements and user stories
- **ADR-019**: Architecture decision for hybrid SSR/client approach
- **Data Model Updates**: UpcomingEpisode type with preview questions

### Technical Implementation
- Mock data enhanced with upcoming episodes
- Activity tracking fields added (isNew, isRead)
- Search with real-time filtering
- Responsive design with mobile considerations

### What's Working Well
- Editorial layout creates clear reading priority
- Hero pattern makes latest episode unmissable
- Preview questions create anticipation
- Search is discoverable but not intrusive
- Activity indicators add urgency without clutter

### Next Immediate Steps
1. Set up Supabase with validated schema
2. Add Clerk authentication with organizations
3. Connect real data sources
4. Implement localStorage for activity tracking
5. Add settings menu functionality