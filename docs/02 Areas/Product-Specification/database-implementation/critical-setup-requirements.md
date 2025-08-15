# Critical Setup Requirements

**Created:** 2025-08-15  
**Status:** 🔴 Must complete before database creation  
**Context:** Final requirements from review that must be addressed

## 🚨 Issue 1: Time Field Clarification

### The Problem
Ambiguous field names led to confusion about when generation starts vs when delivery happens.

### The Solution
We've clarified all timing fields across the schema:

```typescript
// Episode table - User perspective
interface Episode {
  scheduledFor: Date;           // When user expects episode (9am)
  generationStartedAt?: Date;   // When generation actually began (5am)
  publishedAt?: Date;           // When content ready (8:30am)
  deliveredAt?: Date;           // When email sent (9am)
}

// Queue table - System perspective
interface EpisodeScheduleQueue {
  generationStartTime: Date;    // START generation at this time (5am)
  targetDeliveryTime: Date;     // User expects episode at this time (9am)
}
```

### Cron Job Clarity
```typescript
// Process queue based on generationStartTime, not delivery time
const episodesDue = await supabase
  .from('episode_schedule_queue')
  .select('*')
  .lte('generation_start_time', now)  // NOT target_delivery_time
  .eq('status', 'pending')
  .order('priority', { ascending: false });
```

## 🚨 Issue 2: Missing Queue Constraints

### The Problem
Without unique constraints, retries could create duplicate queue entries.

### The Solution
Add these constraints to prevent duplicates:

```sql
-- Prevent duplicate queue entries for same episode
ALTER TABLE episode_schedule_queue
ADD CONSTRAINT unique_episode_queue
UNIQUE (episode_id, status)
WHERE status IN ('pending', 'processing');

-- Prevent duplicate episodes from retry storms
ALTER TABLE episodes
ADD CONSTRAINT unique_episode_schedule
UNIQUE (project_id, idempotency_key);

-- Prevent duplicate daily aggregates
ALTER TABLE token_usage_daily
ADD CONSTRAINT unique_org_date
UNIQUE (organization_id, date);
```

## 🚨 Issue 3: Service Role Configuration

### The Problem
RLS policies block background jobs unless properly configured with service role.

### The Solution

#### 1. Supabase Keys Setup
```typescript
// You get TWO keys from Supabase:
// 1. ANON key - for client-side (respects RLS)
// 2. SERVICE_ROLE key - for server-side (bypasses RLS)

// .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...  // Safe for client
SUPABASE_SERVICE_ROLE_KEY=eyJ...      // NEVER expose to client
```

#### 2. Create Two Clients
```typescript
// lib/supabase-client.ts - For client-side
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// lib/supabase-admin.ts - For server-side/cron
import { createClient } from '@supabase/supabase-js';

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);
```

#### 3. Use Correct Client
```typescript
// In API routes (server-side)
import { supabaseAdmin } from '~/lib/supabase-admin';

export async function POST(request: Request) {
  // Use admin client for operations that need to bypass RLS
  const { data } = await supabaseAdmin
    .from('episodes')
    .insert({ ... });
}

// In React components (client-side)
import { supabase } from '~/lib/supabase-client';

export function useProjects() {
  // Use regular client - RLS will filter by user's org
  const { data } = await supabase
    .from('projects')
    .select('*');
}
```

## 📊 Additional Critical Indexes

### Performance-Critical Indexes
```sql
-- For finding episodes due for generation (cron job)
CREATE INDEX idx_episodes_generation_due
ON episodes(status, scheduled_for)
WHERE status = 'DRAFT' 
  AND scheduled_for > NOW() - INTERVAL '4 hours'
  AND scheduled_for <= NOW() + INTERVAL '4 hours';

-- For queue processing with priority
CREATE INDEX idx_queue_priority
ON episode_schedule_queue(status, priority DESC, generation_start_time)
WHERE status = 'pending';

-- For fast cost limit checks
CREATE INDEX idx_token_daily_org_date
ON token_usage_daily(organization_id, date DESC);

-- For finding pending planning notes
CREATE INDEX idx_planning_notes_pending
ON planning_notes(project_id, status)
WHERE status = 'pending' AND deleted_at IS NULL;
```

## 🔧 Improved Trigger with Error Handling

```sql
CREATE OR REPLACE FUNCTION update_token_usage_daily()
RETURNS TRIGGER AS $$
BEGIN
  -- Wrap in error handling to not break token_usage inserts
  BEGIN
    INSERT INTO token_usage_daily (
      organization_id, 
      date, 
      total_tokens, 
      total_cost_gbp,
      record_count
    ) VALUES (
      NEW.organization_id,
      DATE(NEW.created_at),
      NEW.total_tokens,
      NEW.total_cost_gbp,
      1
    )
    ON CONFLICT (organization_id, date) 
    DO UPDATE SET
      total_tokens = token_usage_daily.total_tokens + EXCLUDED.total_tokens,
      total_cost_gbp = token_usage_daily.total_cost_gbp + EXCLUDED.total_cost_gbp,
      record_count = token_usage_daily.record_count + 1,
      last_updated = NOW();
  EXCEPTION WHEN OTHERS THEN
    -- Log error but don't fail the insert
    RAISE WARNING 'Failed to update daily aggregate: %', SQLERRM;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_token_daily
AFTER INSERT ON token_usage
FOR EACH ROW EXECUTE FUNCTION update_token_usage_daily();
```

## ⏰ Cron Schedule Documentation

```typescript
// cron-schedules.ts
export const CRON_SCHEDULES = {
  // Main queue processor - every 15 minutes
  // Looks for episodes where generation_start_time <= NOW()
  '*/15 * * * *': {
    handler: 'processGenerationQueue',
    description: 'Process episodes due for generation',
    usesServiceRole: true
  },
  
  // Delivery notifications - every 5 minutes
  // Looks for episodes where target_delivery_time <= NOW() AND status = 'PUBLISHED'
  '*/5 * * * *': {
    handler: 'sendDeliveryNotifications',
    description: 'Send email notifications for ready episodes',
    usesServiceRole: true
  },
  
  // Schedule next day's jobs - midnight UTC
  '0 0 * * *': {
    handler: 'scheduleNextDayJobs',
    description: 'Create queue entries for tomorrow\'s episodes',
    usesServiceRole: true
  },
  
  // Daily cleanup - 3am UTC
  '0 3 * * *': {
    handler: 'cleanupOldRecords',
    description: 'Archive old planning notes, clean failed episodes',
    usesServiceRole: true
  },
  
  // Cost limit check - every hour
  '0 * * * *': {
    handler: 'checkCostLimits',
    description: 'Alert if approaching daily cost limits',
    usesServiceRole: true
  }
};
```

## ✅ Pre-Creation Checklist

- [ ] Time fields clarified in schema (generationStartTime vs targetDeliveryTime)
- [ ] Unique constraints documented for queue and episodes
- [ ] Service role configuration documented
- [ ] Two Supabase clients created (regular and admin)
- [ ] Critical indexes documented
- [ ] Trigger with error handling ready
- [ ] Cron schedules documented with clear timing
- [ ] Environment variables configured correctly

## 🚀 Ready for Database Creation

Once these items are addressed:

1. Run migrations in a single transaction
2. Create RLS policies immediately after tables
3. Add all constraints and indexes
4. Create triggers for aggregation
5. Test with both anon and service_role keys

## 🔗 Related Documentation

- [Schema with Rationale](./schema-with-rationale.md)
- [RLS Security Policies](./rls-security-policies.md)
- [Subscription Delivery Model](./subscription-delivery-model.md)
- [Implementation Plan](./implementation-plan.md)

---

**CRITICAL**: Don't create databases until all items in the checklist are complete!