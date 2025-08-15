-- ============================================
-- Rollback Script - DANGER!
-- Version: 1.0.0
-- Created: 2025-01-16
-- Description: Completely removes all Many Futures tables
-- ============================================

-- WARNING: This will DELETE ALL DATA!
-- Only run this if you need to start fresh

-- Drop all tables in reverse dependency order
DROP TABLE IF EXISTS highlights CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS chat_sessions CASCADE;
DROP TABLE IF EXISTS agent_memory CASCADE;
DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS user_events CASCADE;
DROP TABLE IF EXISTS planning_notes CASCADE;
DROP TABLE IF EXISTS token_usage_daily CASCADE;
DROP TABLE IF EXISTS token_usage CASCADE;
DROP TABLE IF EXISTS blocks CASCADE;
DROP TABLE IF EXISTS episode_schedule_queue CASCADE;
DROP TABLE IF EXISTS episodes CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS organization_members CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;

-- Drop all functions
DROP FUNCTION IF EXISTS update_token_usage_daily() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS set_episode_number() CASCADE;
DROP FUNCTION IF EXISTS generate_idempotency_key() CASCADE;
DROP FUNCTION IF EXISTS calculate_queue_priority(VARCHAR, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS check_daily_cost_limit(UUID) CASCADE;
DROP FUNCTION IF EXISTS get_next_scheduled_time(UUID) CASCADE;
DROP FUNCTION IF EXISTS auth.user_organizations() CASCADE;

-- Confirmation message
SELECT 'All Many Futures tables and functions have been dropped!' as message;