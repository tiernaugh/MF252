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

### Next Immediate Steps
1. Set up Supabase with validated schema
2. Add Clerk authentication with org support
3. Create API routes to replace mock data
4. Deploy updated version to Vercel