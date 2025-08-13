# Many Futures UI Scaffolding - Handover Document

## Current Status: UI Complete with Mock Data
Date: 2025-08-13
Phase: MVP Development - UI Scaffolding Complete

## Quick Start for New Session

```bash
cd /Users/tiernaugh/Documents/PARA/Areas/Many Futures/MF252/manyfutures/many-futures
pnpm dev  # Runs on http://localhost:3001
```

## What We Built Today

### 1. Complete UI Scaffolding
We built the entire UI with mock data to validate our data model before creating the database. All components are working and styled consistently.

**Key Achievement**: Organizations are included from day 1 to avoid painful migrations when adding teams/billing.

### 2. Working Routes
- `/projects` - Dashboard showing all projects with status, cadence, episodes
- `/projects/new` - Conversational UI with Futura (4-turn mock conversation)
- `/episodes/ep_1` - Episode reader with typography and feedback collection

## Critical Files to Review

### Configuration & Rules
1. **`/many-futures/CLAUDE.md`** - Development rules, patterns, and decisions
   - Data architecture (organizations mandatory)
   - UI/UX design system (shadcn/ui, stone theme)
   - What NOT to build (chat, embeddings, etc.)
   - Security patterns and cost controls

2. **`/many-futures/src/lib/mock-data.ts`** - Complete data model
   - This file IS our database schema specification
   - Shows all entities: User, Organization, Project, Episode, TokenUsage
   - Includes mock data for testing

### UI Components (All Working)
3. **`/many-futures/src/app/(dashboard)/layout.tsx`** - Main dashboard layout
   - Navigation with org context
   - Placeholder for Clerk components

4. **`/many-futures/src/app/(dashboard)/projects/page.tsx`** - Projects dashboard
   - Card grid layout
   - Shows episodes count, cadence, status

5. **`/many-futures/src/app/(dashboard)/projects/new/page.tsx`** - Conversational UI
   - Chat with Futura
   - Mock 4-turn conversation
   - Typewriter effect for brief generation

6. **`/many-futures/src/app/(dashboard)/episodes/[id]/page.tsx`** - Episode reader
   - Beautiful typography
   - 1-5 star feedback
   - Breadcrumb navigation

### Documentation
7. **`/docs/00 Index/development-diary.md`** - Day-by-day progress log
8. **`/docs/01 Projects/t3-handover/`** - Original requirements and architecture
9. **`/docs/03 Resources/many-futures-prototype-v4/`** - UI prototypes we referenced

## Tech Stack Status

### ✅ Completed
- T3 App (Next.js 15, TypeScript, Tailwind CSS v4)
- shadcn/ui components (New York style, Stone theme)
- Mock data structure with full schema
- All UI routes and components
- Deployed to Vercel at root directory `/many-futures`

### 🔄 In Progress
- Nothing currently in progress

### 📋 Next Up
1. **Supabase Setup** - Create database with schema from mock-data.ts
2. **Clerk Authentication** - Add auth with organization support
3. **API Routes** - Replace mock data with real database calls
4. **AI Integration** - Connect GPT-4/5 for conversations, Claude for episodes

## Key Decisions Made

### Data Architecture
- **Organizations from Day 1**: Every user gets a personal org, all data scoped to orgs
- **Token Usage Tracking**: Built into schema for billing
- **Markdown Episodes**: Simple TEXT field, not complex blocks
- **Denormalized for Performance**: organizationId on episodes table

### UI/UX
- **Stone Color Palette**: Consistent throughout (stone-50 to stone-950)
- **Minimal Navigation**: Just Projects and Episodes
- **Conversational Onboarding**: 4 turns to generate project brief
- **Simple Feedback**: 1-5 stars, optional text

### What We're NOT Building (MVP)
- ❌ Chat interface for episodes
- ❌ Vector embeddings
- ❌ Highlight/annotation tools
- ❌ Team collaboration features
- ❌ Multiple content block types

## Environment & Deployment

### Local Development
- Port: 3001 (3000 was occupied)
- Database: Placeholder URL for now
- All environment variables in `.env`

### GitHub & Vercel
- Repository: https://github.com/tiernaugh/MF252
- Vercel Root Directory: Set to `many-futures`
- Auto-deploys on push to main branch

## Common Commands

```bash
# Development
pnpm dev                    # Start dev server
pnpm build                  # Build for production

# Database (after Supabase setup)
pnpm db:push               # Push schema to database
pnpm db:studio             # Open Drizzle studio

# Git
git add -A && git commit -m "message"
git push origin main       # Triggers Vercel deployment
```

## File Structure
```
manyfutures/
├── many-futures/          # T3 app (deployed to Vercel)
│   ├── src/
│   │   ├── app/
│   │   │   └── (dashboard)/    # All authenticated routes
│   │   ├── components/ui/      # shadcn components
│   │   └── lib/mock-data.ts    # DATA MODEL SPEC
│   └── CLAUDE.md               # DEVELOPMENT RULES
└── docs/                       # All documentation
    ├── 00 Index/              # Development diary
    ├── 01 Projects/           # Requirements
    ├── 02 Areas/              # Product specs
    └── 03 Resources/          # Prototypes & handovers
```

## Next Session Checklist

When starting a new session:

1. **Read these files first**:
   - This handover document
   - `/many-futures/CLAUDE.md` for rules
   - `/many-futures/src/lib/mock-data.ts` for data model

2. **Check current state**:
   ```bash
   cd many-futures
   pnpm dev  # Test UI is working
   git status  # Check for uncommitted changes
   ```

3. **Continue with next task**:
   - Set up Supabase database
   - Use schema from mock-data.ts
   - Keep organizations from day 1

## Success Criteria for MVP

We're building toward:
1. **5 paying customers** at £29/month
2. **>50% episode completion rate**
3. **>70% week 2 retention**

Current hypothesis to validate:
**"Will businesses pay for AI-generated strategic intelligence delivered weekly?"**

## Contact & Context

Building for: Solopreneur (tiernaugh)
Product: Many Futures - Agentic foresight assistant
Phase: MVP - Validate core loop before adding complexity

---

*This handover was created after completing UI scaffolding with mock data. The UI is fully functional and validates our data model. Next step is connecting real services.*