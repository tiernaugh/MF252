# 🚀 IMPLEMENTATION STEPS - Ready to Execute!

**Status:** All migration files created, ready to run in Supabase  
**Time Required:** ~30 minutes

## Step 1: Update Environment Variables (2 mins)

Add these to your `/many-futures/.env.local` file:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://gpxdwwtfwxxbgnzehvvc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdweGR3d3Rmd3h4YmduemVodnZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxOTA1MjIsImV4cCI6MjA3MDc2NjUyMn0.2wkXz_30986It6VosyFNhEgLWcagwQwRM44OrpiGqwM

# For backend operations (keep secure!)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdweGR3d3Rmd3h4YmduemVodnZjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTE5MDUyMiwiZXhwIjoyMDcwNzY2NTIyfQ.Ytw9Sj8o0eQc1VOuHK3YzmyPuz3wyQ42MtMEpkFAdTI
```

## Step 2: Install Supabase Client (1 min)

```bash
cd many-futures
pnpm add @supabase/supabase-js
```

## Step 3: Run Migrations in Supabase (10 mins)

Go to your Supabase Dashboard > SQL Editor:
https://supabase.com/dashboard/project/gpxdwwtfwxxbgnzehvvc/sql

Run these scripts IN ORDER:

1. **First, run `01-schema.sql`**
   - Creates all 16 tables
   - Sets up constraints and indexes
   - Enables RLS on all tables
   - Should complete without errors

2. **Then, run `02-triggers.sql`**
   - Creates aggregation functions
   - Sets up automatic timestamps
   - Adds helper functions
   - Should complete without errors

3. **Then, run `03-rls.sql`**
   - Creates security policies
   - Sets up organization isolation
   - Note: Will show warnings if auth.uid() not available (okay for now)

4. **Finally, run `04-seed.sql`**
   - Adds test data
   - Creates sample episodes
   - Should show success messages

## Step 4: Verify Everything Works (5 mins)

In SQL Editor, run these test queries:

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
-- Should show 16 tables

-- Check seed data
SELECT * FROM organizations;
SELECT * FROM projects;
SELECT * FROM episodes;

-- Test the queue locking (critical!)
BEGIN;
SELECT * FROM episode_schedule_queue 
WHERE status = 'pending' 
FOR UPDATE SKIP LOCKED;
-- Should return 1 row
ROLLBACK;

-- Check token aggregation
SELECT * FROM token_usage_daily;
-- Should have 2 rows from seed data
```

## Step 5: Generate TypeScript Types (5 mins)

```bash
cd many-futures

# Install Supabase CLI if needed
npm install -g supabase

# Generate types
npx supabase gen types typescript \
  --project-id gpxdwwtfwxxbgnzehvvc \
  --schema public > src/lib/database.types.ts
```

## Step 6: Create Supabase Client (5 mins)

Create `/many-futures/src/lib/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

// Client for frontend (respects RLS)
export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Admin client for API routes (bypasses RLS)
// Only use in server-side code!
export const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)
```

## Step 7: Test Frontend Connection (2 mins)

Quick test in any component:

```typescript
import { supabase } from '@/lib/supabase'

// In your component
const { data, error } = await supabase
  .from('projects')
  .select('*')

console.log('Projects:', data)
```

## ✅ Success Checklist

- [ ] Environment variables added to .env.local
- [ ] Supabase client installed
- [ ] All 4 migration scripts run successfully
- [ ] Test queries return expected data
- [ ] TypeScript types generated
- [ ] Supabase client created
- [ ] Frontend can query data

## 🚨 If Something Goes Wrong

1. **To start fresh:**
   - Run `00-rollback.sql` in SQL Editor
   - Start again from Step 3

2. **Common issues:**
   - "Permission denied" - Check your API keys are correct
   - "Relation does not exist" - Run migrations in order
   - "Types don't match" - Regenerate types after schema changes

## 📝 Next Steps After This Works

1. Update projects page to use real data
2. Remove mock data dependencies
3. Implement project creation with database
4. Add Clerk authentication
5. Set up cron jobs for queue processing

---

**Ready?** Start with Step 1 and work through systematically. The whole process should take about 30 minutes. Let me know when you hit Step 3 and I'll help you verify everything is working!