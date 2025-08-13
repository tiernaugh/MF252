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