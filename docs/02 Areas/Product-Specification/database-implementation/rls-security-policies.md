# Row Level Security (RLS) Policies

**Created:** 2025-08-15  
**Status:** 🔴 Critical - Must implement before production  
**Context:** Security policies to enforce organization-based data isolation

## 🚨 Critical Implementation Note

These policies MUST be created in the same transaction as table creation to ensure security from day one. Without proper RLS, there's a security vulnerability that could expose data across organizations.

## 🔐 Core Security Principles

1. **Organization Isolation**: Users can only access data from their organization
2. **Service Role Bypass**: Background jobs need unrestricted access
3. **Soft Delete Respect**: Deleted records invisible to application queries
4. **Audit Trail**: All modifications tracked with user attribution

## 📋 Implementation Order

```sql
-- 1. Enable RLS on ALL tables immediately after creation
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE episode_schedule_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE planning_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_usage_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE highlights ENABLE ROW LEVEL SECURITY;

-- 2. Create roles
CREATE ROLE app_user;      -- Regular application access
CREATE ROLE service_worker; -- Background jobs and cron
CREATE ROLE admin_user;     -- Founder/admin access
```

## 🛡️ RLS Policies by Table

### Organizations Table
```sql
-- Users can only see their own organization
CREATE POLICY "Users view own org"
  ON organizations FOR SELECT
  USING (id = auth.jwt() ->> 'org_id');

-- Only org admins can update
CREATE POLICY "Admins update org"
  ON organizations FOR UPDATE
  USING (
    id = auth.jwt() ->> 'org_id' 
    AND auth.jwt() ->> 'org_role' = 'admin'
  );

-- Service role bypass for all operations
CREATE POLICY "Service role bypass"
  ON organizations
  USING (auth.jwt() ->> 'role' = 'service_role');
```

### Projects Table
```sql
-- View projects in your organization
CREATE POLICY "View org projects"
  ON projects FOR SELECT
  USING (
    organization_id = auth.jwt() ->> 'org_id'
    AND deleted_at IS NULL  -- Respect soft delete
  );

-- Create projects in your organization
CREATE POLICY "Create org projects"
  ON projects FOR INSERT
  WITH CHECK (
    organization_id = auth.jwt() ->> 'org_id'
  );

-- Update own organization's projects
CREATE POLICY "Update org projects"
  ON projects FOR UPDATE
  USING (organization_id = auth.jwt() ->> 'org_id')
  WITH CHECK (organization_id = auth.jwt() ->> 'org_id');

-- Soft delete only (no hard delete)
CREATE POLICY "Soft delete projects"
  ON projects FOR UPDATE
  USING (
    organization_id = auth.jwt() ->> 'org_id'
    AND deleted_at IS NULL  -- Can't delete already deleted
  )
  WITH CHECK (
    deleted_at IS NOT NULL  -- Only allow setting deleted_at
  );

-- Service role bypass
CREATE POLICY "Service role bypass"
  ON projects
  USING (auth.jwt() ->> 'role' = 'service_role');
```

### Episodes Table
```sql
-- View episodes from your organization
CREATE POLICY "View org episodes"
  ON episodes FOR SELECT
  USING (
    organization_id = auth.jwt() ->> 'org_id'
    AND deleted_at IS NULL
  );

-- Service creates episodes (not users directly)
CREATE POLICY "Service creates episodes"
  ON episodes FOR INSERT
  WITH CHECK (
    auth.jwt() ->> 'role' = 'service_role'
    OR (
      -- Allow API to create draft episodes
      organization_id = auth.jwt() ->> 'org_id'
      AND status = 'DRAFT'
    )
  );

-- Service updates episodes
CREATE POLICY "Service updates episodes"
  ON episodes FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Service role bypass
CREATE POLICY "Service role bypass"
  ON episodes
  USING (auth.jwt() ->> 'role' = 'service_role');
```

### Episode Schedule Queue Table
```sql
-- Queue is only accessible by service role
CREATE POLICY "Service role only"
  ON episode_schedule_queue
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Admin can view for debugging
CREATE POLICY "Admin view only"
  ON episode_schedule_queue FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin_user');
```

### Planning Notes Table
```sql
-- Users can create planning notes for their org's projects
CREATE POLICY "Create planning notes"
  ON planning_notes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = planning_notes.project_id
      AND projects.organization_id = auth.jwt() ->> 'org_id'
    )
  );

-- View own org's planning notes
CREATE POLICY "View org planning notes"
  ON planning_notes FOR SELECT
  USING (
    organization_id = auth.jwt() ->> 'org_id'
    AND deleted_at IS NULL
  );

-- Users can update their own notes
CREATE POLICY "Update own notes"
  ON planning_notes FOR UPDATE
  USING (
    user_id = auth.jwt() ->> 'sub'
    AND organization_id = auth.jwt() ->> 'org_id'
  );

-- Service role bypass
CREATE POLICY "Service role bypass"
  ON planning_notes
  USING (auth.jwt() ->> 'role' = 'service_role');
```

### Token Usage Tables
```sql
-- Token usage is sensitive - only service and admin
CREATE POLICY "Service and admin only"
  ON token_usage
  USING (
    auth.jwt() ->> 'role' IN ('service_role', 'admin_user')
  );

CREATE POLICY "Service and admin only"
  ON token_usage_daily
  USING (
    auth.jwt() ->> 'role' IN ('service_role', 'admin_user')
  );
```

### User Events Table
```sql
-- Users can only see their own events
CREATE POLICY "View own events"
  ON user_events FOR SELECT
  USING (
    user_id = auth.jwt() ->> 'sub'
    AND organization_id = auth.jwt() ->> 'org_id'
  );

-- Service creates events
CREATE POLICY "Service creates events"
  ON user_events FOR INSERT
  WITH CHECK (
    auth.jwt() ->> 'role' = 'service_role'
    OR user_id = auth.jwt() ->> 'sub'
  );

-- Service role bypass
CREATE POLICY "Service role bypass"
  ON user_events
  USING (auth.jwt() ->> 'role' = 'service_role');
```

### Audit Log Table
```sql
-- Audit log is append-only, admin read-only
CREATE POLICY "Admin read only"
  ON audit_log FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin_user');

CREATE POLICY "Service append only"
  ON audit_log FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- No UPDATE or DELETE allowed
```

### Blocks Table
```sql
-- View blocks for episodes in your org
CREATE POLICY "View org blocks"
  ON blocks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM episodes
      WHERE episodes.id = blocks.episode_id
      AND episodes.organization_id = auth.jwt() ->> 'org_id'
    )
    AND deleted_at IS NULL
  );

-- Service manages blocks
CREATE POLICY "Service manages blocks"
  ON blocks
  USING (auth.jwt() ->> 'role' = 'service_role');
```

## 🔧 Helper Functions

### Get Current User's Organization
```sql
CREATE OR REPLACE FUNCTION current_user_org_id()
RETURNS TEXT AS $$
BEGIN
  RETURN auth.jwt() ->> 'org_id';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Check Organization Membership
```sql
CREATE OR REPLACE FUNCTION is_org_member(org_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.jwt() ->> 'org_id' = org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Check If User Is Admin
```sql
CREATE OR REPLACE FUNCTION is_org_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.jwt() ->> 'org_role' = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## 🧪 Testing RLS Policies

### Test Organization Isolation
```sql
-- As user in org_1, try to access org_2 data
SET LOCAL jwt.claims.org_id TO 'org_1';
SELECT * FROM projects WHERE organization_id = 'org_2';
-- Should return 0 rows

-- As service role, access any org
SET LOCAL jwt.claims.role TO 'service_role';
SELECT * FROM projects WHERE organization_id = 'org_2';
-- Should return rows
```

### Test Soft Delete Visibility
```sql
-- As regular user, deleted records should be invisible
SET LOCAL jwt.claims.org_id TO 'org_1';
UPDATE projects SET deleted_at = NOW() WHERE id = 'proj_1';
SELECT * FROM projects WHERE id = 'proj_1';
-- Should return 0 rows

-- As service role, can see deleted records
SET LOCAL jwt.claims.role TO 'service_role';
SELECT * FROM projects WHERE id = 'proj_1';
-- Should return the deleted record
```

## 🚀 Migration Script

```sql
-- Run this entire script in a single transaction
BEGIN;

-- Create tables (your existing schema)
CREATE TABLE organizations (...);
CREATE TABLE projects (...);
-- ... etc

-- Enable RLS immediately
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
-- ... for all tables

-- Create all policies
-- ... (all policies from above)

-- Verify RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- If all good, commit
COMMIT;

-- If any issues, rollback
-- ROLLBACK;
```

## ⚠️ Common Pitfalls

1. **Forgetting Service Role Bypass**: Background jobs will fail without it
2. **Not Respecting Soft Deletes**: Deleted records become visible
3. **Missing Organization Check**: Data leaks across organizations
4. **Forgetting New Tables**: Every new table needs RLS enabled
5. **Testing in Production**: Always test RLS in staging first

## 📚 Clerk Integration

```typescript
// Ensure Clerk passes correct claims
const supabaseClient = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  {
    global: {
      headers: {
        Authorization: `Bearer ${await getSupabaseToken({
          org_id: organization.id,
          org_role: membership.role,
          sub: user.id
        })}`
      }
    }
  }
);
```

## 🔗 Related Documentation

- [Database Schema](../database-schema.ts)
- [Implementation Plan](./implementation-plan.md)
- [Subscription Delivery Model](./subscription-delivery-model.md)

---

**CRITICAL**: Never disable RLS in production. Always test policies in staging first.