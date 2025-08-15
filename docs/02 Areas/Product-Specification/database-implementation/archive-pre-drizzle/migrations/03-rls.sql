-- ============================================
-- Row Level Security Policies
-- Version: 1.0.0
-- Created: 2025-01-16
-- Description: Organization-based data isolation
-- ============================================

-- Note: For MVP, we'll create simple policies that can be enhanced later
-- Service role key will bypass all RLS for backend operations

-- ============================================
-- HELPER FUNCTION FOR AUTH
-- ============================================

-- Get current user's organizations
CREATE OR REPLACE FUNCTION auth.user_organizations()
RETURNS SETOF UUID AS $$
BEGIN
    RETURN QUERY
    SELECT organization_id
    FROM organization_members
    WHERE user_id = auth.uid()
    AND deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ORGANIZATIONS
-- ============================================

-- Users can view organizations they belong to
CREATE POLICY "Users can view their organizations"
ON organizations FOR SELECT
USING (
    id IN (SELECT auth.user_organizations())
);

-- Users can update organizations they own
CREATE POLICY "Owners can update their organizations"
ON organizations FOR UPDATE
USING (
    owner_id = auth.uid()
);

-- ============================================
-- USERS
-- ============================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
ON users FOR SELECT
USING (
    id = auth.uid()
);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
USING (
    id = auth.uid()
);

-- ============================================
-- PROJECTS
-- ============================================

-- Users can view projects in their organizations
CREATE POLICY "Users can view organization projects"
ON projects FOR SELECT
USING (
    organization_id IN (SELECT auth.user_organizations())
);

-- Users can create projects in their organizations
CREATE POLICY "Users can create projects"
ON projects FOR INSERT
WITH CHECK (
    organization_id IN (SELECT auth.user_organizations())
);

-- Users can update projects they created
CREATE POLICY "Users can update own projects"
ON projects FOR UPDATE
USING (
    user_id = auth.uid()
);

-- ============================================
-- EPISODES
-- ============================================

-- Users can view episodes in their organizations
CREATE POLICY "Users can view organization episodes"
ON episodes FOR SELECT
USING (
    organization_id IN (SELECT auth.user_organizations())
);

-- Users can create episodes in their organizations
CREATE POLICY "Users can create episodes"
ON episodes FOR INSERT
WITH CHECK (
    organization_id IN (SELECT auth.user_organizations())
);

-- ============================================
-- EPISODE SCHEDULE QUEUE
-- ============================================

-- Users can view queue items in their organizations
CREATE POLICY "Users can view organization queue"
ON episode_schedule_queue FOR SELECT
USING (
    organization_id IN (SELECT auth.user_organizations())
);

-- Service role only for modifications (handled by cron jobs)
-- No INSERT/UPDATE/DELETE policies for regular users

-- ============================================
-- BLOCKS
-- ============================================

-- Users can view blocks in their organizations
CREATE POLICY "Users can view organization blocks"
ON blocks FOR SELECT
USING (
    organization_id IN (SELECT auth.user_organizations())
);

-- ============================================
-- TOKEN USAGE
-- ============================================

-- Users can view token usage in their organizations
CREATE POLICY "Users can view organization token usage"
ON token_usage FOR SELECT
USING (
    organization_id IN (SELECT auth.user_organizations())
);

-- ============================================
-- TOKEN USAGE DAILY
-- ============================================

-- Users can view daily token usage in their organizations
CREATE POLICY "Users can view organization daily usage"
ON token_usage_daily FOR SELECT
USING (
    organization_id IN (SELECT auth.user_organizations())
);

-- ============================================
-- PLANNING NOTES
-- ============================================

-- Users can view planning notes in their organizations
CREATE POLICY "Users can view organization planning notes"
ON planning_notes FOR SELECT
USING (
    organization_id IN (SELECT auth.user_organizations())
);

-- Users can create planning notes
CREATE POLICY "Users can create planning notes"
ON planning_notes FOR INSERT
WITH CHECK (
    organization_id IN (SELECT auth.user_organizations())
    AND user_id = auth.uid()
);

-- Users can update their own planning notes
CREATE POLICY "Users can update own planning notes"
ON planning_notes FOR UPDATE
USING (
    user_id = auth.uid()
);

-- ============================================
-- USER EVENTS
-- ============================================

-- Users can view their own events
CREATE POLICY "Users can view own events"
ON user_events FOR SELECT
USING (
    user_id = auth.uid()
);

-- Users can create their own events
CREATE POLICY "Users can create own events"
ON user_events FOR INSERT
WITH CHECK (
    user_id = auth.uid()
);

-- ============================================
-- AUDIT LOG
-- ============================================

-- Admin users can view audit logs for their organizations
CREATE POLICY "Admins can view organization audit logs"
ON audit_log FOR SELECT
USING (
    organization_id IN (SELECT auth.user_organizations())
    AND EXISTS (
        SELECT 1 FROM organization_members
        WHERE organization_id = audit_log.organization_id
        AND user_id = auth.uid()
        AND role IN ('OWNER', 'ADMIN')
    )
);

-- ============================================
-- FUTURE TABLES (Basic policies)
-- ============================================

-- Agent Memory
CREATE POLICY "Users can view organization memories"
ON agent_memory FOR SELECT
USING (
    organization_id IN (SELECT auth.user_organizations())
);

-- Chat Sessions
CREATE POLICY "Users can view own chat sessions"
ON chat_sessions FOR SELECT
USING (
    user_id = auth.uid()
);

CREATE POLICY "Users can create chat sessions"
ON chat_sessions FOR INSERT
WITH CHECK (
    user_id = auth.uid()
    AND organization_id IN (SELECT auth.user_organizations())
);

-- Chat Messages
CREATE POLICY "Users can view messages in their sessions"
ON chat_messages FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM chat_sessions
        WHERE chat_sessions.id = chat_messages.session_id
        AND chat_sessions.user_id = auth.uid()
    )
);

CREATE POLICY "Users can create messages in their sessions"
ON chat_messages FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM chat_sessions
        WHERE chat_sessions.id = chat_messages.session_id
        AND chat_sessions.user_id = auth.uid()
    )
);

-- Highlights
CREATE POLICY "Users can view own highlights"
ON highlights FOR SELECT
USING (
    user_id = auth.uid()
);

CREATE POLICY "Users can create own highlights"
ON highlights FOR INSERT
WITH CHECK (
    user_id = auth.uid()
    AND organization_id IN (SELECT auth.user_organizations())
);

CREATE POLICY "Users can update own highlights"
ON highlights FOR UPDATE
USING (
    user_id = auth.uid()
);

CREATE POLICY "Users can delete own highlights"
ON highlights FOR DELETE
USING (
    user_id = auth.uid()
);