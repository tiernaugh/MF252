# Supabase Setup Guide - MF-252

**Project:** MF-252  
**URL:** https://gpxdwwtfwxxbgnzehvvc.supabase.co  
**Created:** 2025-01-16  
**Status:** 🟡 Setting up schema

## 📋 Setup Progress

- [x] Supabase project created (MF-252)
- [x] API keys obtained
- [ ] Environment variables configured
- [ ] Database schema created
- [ ] RLS policies applied
- [ ] Seed data inserted
- [ ] Frontend connected
- [ ] TypeScript types generated

## 🔑 Environment Configuration

### Step 1: Update `.env.local`
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://gpxdwwtfwxxbgnzehvvc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdweGR3d3Rmd3h4YmduemVodnZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxOTA1MjIsImV4cCI6MjA3MDc2NjUyMn0.2wkXz_30986It6VosyFNhEgLWcagwQwRM44OrpiGqwM

# Service role for backend/cron jobs
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdweGR3d3Rmd3h4YmduemVodnZjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTE5MDUyMiwiZXhwIjoyMDcwNzY2NTIyfQ.Ytw9Sj8o0eQc1VOuHK3YzmyPuz3wyQ42MtMEpkFAdTI

# Database URLs (for future Prisma/Drizzle if needed)
DATABASE_URL="postgresql://postgres.gpxdwwtfwxxbgnzehvvc:9CB3ZRO0XUn3TtGe@aws-1-eu-west-1.pooler.supabase.com:6543/postgres"
DIRECT_URL="postgresql://postgres:9CB3ZRO0XUn3TtGe@db.gpxdwwtfwxxbgnzehvvc.supabase.co:5432/postgres"
```

## 📐 Naming Conventions

### Tables
- **Format:** `snake_case` plural
- **Examples:** `organizations`, `episode_schedule_queue`, `planning_notes`

### Columns
- **Format:** `snake_case`
- **Standard fields:**
  - `id` - UUID primary key
  - `organization_id` - Foreign key to organizations
  - `created_at` - Timestamp with timezone
  - `updated_at` - Timestamp with timezone
  - `deleted_at` - Soft delete timestamp
  - `deleted_by` - User who deleted

### Constraints
- **Foreign keys:** `{table}_{column}_fkey`
- **Unique:** `{table}_{columns}_unique`
- **Check:** `{table}_{column}_check`

### Indexes
- **Format:** `idx_{table}_{purpose}`
- **Examples:** 
  - `idx_episodes_scheduled_for`
  - `idx_queue_pending`
  - `idx_token_daily_lookup`

### ID Prefixes (Application Layer)
- Organizations: `org_`
- Users: `user_`
- Projects: `proj_`
- Episodes: `ep_`
- Queue items: `queue_`
- Planning notes: `note_`
- Events: `evt_`

## 🗂️ Schema Implementation Order

### Phase 1: Core Tables
1. `organizations` - Foundation for all data
2. `users` - User profiles with timezone
3. `organization_members` - User-org relationships
4. `projects` - Projects with flexible scheduling

### Phase 2: Content & Generation
5. `episodes` - Episode content and metadata
6. `episode_schedule_queue` - Queue-based scheduling
7. `blocks` - Content structure (markdown for MVP)

### Phase 3: Operational Tables
8. `token_usage` - Track every API call
9. `token_usage_daily` - Aggregated costs
10. `planning_notes` - User feedback loop
11. `user_events` - Flexible event tracking
12. `audit_log` - Compliance tracking

### Phase 4: Future Features (Create Now)
13. `agent_memory` - Memory system
14. `chat_sessions` - Chat feature
15. `chat_messages` - Chat history
16. `highlights` - Text selections

## 🔐 Security Implementation

### Row Level Security (RLS)
- Enable on ALL tables
- Organization-based isolation
- Service role bypasses for cron jobs

### Two-Client Pattern
```typescript
// Frontend client (respects RLS)
const supabase = createClient(URL, ANON_KEY);

// Backend client (bypasses RLS)
const supabaseAdmin = createClient(URL, SERVICE_ROLE_KEY);
```

## ⚡ Performance Optimizations

### Critical Indexes
1. **Queue processing**: `idx_queue_pending`
2. **Cost checks**: `idx_token_daily_lookup`
3. **Episode scheduling**: `idx_episodes_generation_due`

### Aggregation Triggers
- `update_token_usage_daily()` - Automatic cost aggregation

### Row Locking
- Use `FOR UPDATE SKIP LOCKED` for queue processing

## 📝 Migration Files

### Files to Run (in order):
1. `01-schema.sql` - All tables with constraints
2. `02-rls.sql` - Security policies
3. `03-triggers.sql` - Aggregation triggers
4. `04-seed.sql` - Initial test data

### Rollback Script
- `00-rollback.sql` - Clean slate if needed

## ✅ Verification Checklist

### After Schema Creation
- [ ] All 16 tables created
- [ ] Foreign key relationships valid
- [ ] Unique constraints in place
- [ ] Indexes created

### After RLS Setup
- [ ] RLS enabled on all tables
- [ ] Policies test correctly
- [ ] Service role can bypass

### After Seed Data
- [ ] Can query by organization
- [ ] Queue locking works
- [ ] Token aggregation triggers

### After Frontend Connection
- [ ] TypeScript types match
- [ ] Data displays correctly
- [ ] No CORS errors
- [ ] Organization scoping works

## 🚀 Next Steps

1. Run migration scripts in SQL editor
2. Generate TypeScript types
3. Create Supabase client
4. Update one page to test
5. Roll out to all pages

## 📞 Troubleshooting

### Common Issues
- **RLS blocking queries**: Check organization_id is included
- **Types don't match**: Regenerate with `npx supabase gen types`
- **CORS errors**: Check Supabase URL is correct
- **Queue locking fails**: Ensure `FOR UPDATE SKIP LOCKED` syntax

### Test Queries
```sql
-- Test organization scoping
SELECT * FROM projects WHERE organization_id = 'org_test123';

-- Test queue locking
BEGIN;
SELECT * FROM episode_schedule_queue 
WHERE status = 'pending' 
FOR UPDATE SKIP LOCKED;
ROLLBACK;

-- Test token aggregation
INSERT INTO token_usage (...) VALUES (...);
SELECT * FROM token_usage_daily WHERE date = CURRENT_DATE;
```