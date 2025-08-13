# Many Futures MVP Quick Start Guide

**Ready to build? Here's how to start immediately.**

---

## 🚀 Day 1: Get Building

### 1. Verify Setup (5 minutes)
```bash
cd many-futures
pnpm install
pnpm dev --filter=app  # Should open at localhost:3000
```

### 2. Set Up Database (30 minutes)

#### Update Prisma Schema
```bash
# Open packages/database/prisma/schema.prisma
# Add our models (copy from implementation-strategy.md)
```

#### Configure Supabase
1. Create project at [supabase.com](https://supabase.com)
2. Get connection strings from Settings > Database
3. Enable pgvector:
```sql
-- Run in Supabase SQL editor
CREATE EXTENSION IF NOT EXISTS vector;
```

#### Update Environment
```bash
# In apps/app/.env.local
DATABASE_URL="postgresql://[YOUR_SUPABASE_URL]"
DIRECT_URL="postgresql://[YOUR_SUPABASE_DIRECT_URL]"
```

#### Run Migration
```bash
cd packages/database
pnpm exec prisma generate
pnpm exec prisma db push
```

### 3. Quick Auth Setup (15 minutes)
```bash
# In apps/app/.env.local
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
```

Configure Clerk:
1. Enable Organizations in Clerk Dashboard
2. Set up webhook for user.created event
3. Point to: `https://[your-domain]/api/webhooks/auth`

### 4. Create First Components (1 hour)

#### Projects Page
```bash
# Create: apps/app/app/(authenticated)/projects/page.tsx
```

```typescript
export default async function ProjectsPage() {
  // Start simple - just render "Projects" heading
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-serif font-bold">Projects</h1>
    </div>
  );
}
```

#### Test It Works
```bash
pnpm dev --filter=app
# Navigate to /projects (should redirect to sign-in first)
```

---

## 📋 Week 1 Checklist

### Monday: Foundation
- [ ] Database schema complete
- [ ] Supabase connected
- [ ] Can run migrations

### Tuesday: Auth
- [ ] Clerk configured
- [ ] Auto org creation working
- [ ] Can sign in/up

### Wednesday: Data
- [ ] Seed script created
- [ ] Demo project exists
- [ ] Can query database

### Thursday: Routing
- [ ] Projects route working
- [ ] Episode routes planned
- [ ] Auth middleware active

### Friday: Validation
- [ ] Run all stage-0 tests
- [ ] Document any issues
- [ ] Plan Week 2

---

## 🛠️ Helpful Commands

```bash
# Development
pnpm dev --filter=app           # Run main app
pnpm dev                         # Run everything

# Database
pnpm exec prisma studio --filter=database  # View data
pnpm exec prisma generate --filter=database # Update types
pnpm exec prisma db push --filter=database  # Push schema

# Testing
pnpm test --filter=app          # Run app tests
pnpm validate:stage:0            # Validate foundation

# Type Checking
pnpm typecheck                   # Check all types
```

---

## 🎯 First Milestone (End of Day 1)

You should have:
1. ✅ Database connected with schema
2. ✅ Auth working with org creation  
3. ✅ Basic projects page rendering
4. ✅ Development environment stable

---

## 🤖 Using Cursor Effectively

```typescript
// When stuck, call the experts:
// @database-expert help me write a Prisma query for projects
// @nextjs-react-expert how do I create a server component for this?
// @typescript-expert what's the right type for this?

// Example prompt:
"@database-expert I need to query all projects for the current user's 
organization with their episode counts. How should I structure this?"
```

---

## 🚨 Common Issues & Fixes

### Issue: Prisma client not generating
```bash
cd packages/database
rm -rf generated/
pnpm exec prisma generate
```

### Issue: pgvector not working
```sql
-- Check it's installed
SELECT * FROM pg_extension WHERE extname = 'vector';

-- If not, as superuser:
CREATE EXTENSION vector;
```

### Issue: Clerk not creating orgs
```typescript
// Check webhook is receiving events
// Add logging to app/api/webhooks/auth/route.ts
console.log('Webhook received:', event.type);
```

---

## 📚 Resources

- **Implementation Strategy:** `docs/01 Projects/mvp-build/implementation-strategy.md`
- **Task Breakdown:** `docs/01 Projects/mvp-build/task-breakdown.md`
- **Mock Data:** `many-futures-prototype-v4/src/data/mock-episode.json`
- **Cursor Rules:** `.cursor/rules/`

---

## 💬 Getting Help

When stuck:
1. Check the ADRs in `docs/02 Areas/Product-Specification/05-architecture-decisions/`
2. Review the prototype in `many-futures-prototype-v4/src/`
3. Use Cursor with our specialized rules
4. Document surprises for ADR updates

---

**Ready? Let's build! 🚀**

Start with Step 1 above and work through systematically. By end of Day 1, you'll have a working foundation.
