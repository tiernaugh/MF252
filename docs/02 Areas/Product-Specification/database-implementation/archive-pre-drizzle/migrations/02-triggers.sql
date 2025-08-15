-- ============================================
-- Triggers and Functions
-- Version: 1.0.0
-- Created: 2025-01-16
-- Description: Automatic aggregation and helper functions
-- ============================================

-- ============================================
-- TOKEN USAGE AGGREGATION
-- ============================================

-- Function to update daily token usage
CREATE OR REPLACE FUNCTION update_token_usage_daily()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert or update the daily aggregate
    INSERT INTO token_usage_daily (
        organization_id,
        date,
        total_tokens,
        total_cost_gbp,
        generation_tokens,
        generation_cost_gbp,
        chat_tokens,
        chat_cost_gbp,
        episode_count,
        last_updated
    ) VALUES (
        NEW.organization_id,
        DATE(NEW.created_at),
        NEW.total_tokens,
        NEW.total_cost,
        CASE WHEN NEW.operation = 'generation' THEN NEW.total_tokens ELSE 0 END,
        CASE WHEN NEW.operation = 'generation' THEN NEW.total_cost ELSE 0 END,
        CASE WHEN NEW.operation = 'chat' THEN NEW.total_tokens ELSE 0 END,
        CASE WHEN NEW.operation = 'chat' THEN NEW.total_cost ELSE 0 END,
        CASE WHEN NEW.episode_id IS NOT NULL THEN 1 ELSE 0 END,
        NOW()
    )
    ON CONFLICT (organization_id, date) DO UPDATE SET
        total_tokens = token_usage_daily.total_tokens + NEW.total_tokens,
        total_cost_gbp = token_usage_daily.total_cost_gbp + NEW.total_cost,
        generation_tokens = token_usage_daily.generation_tokens + 
            CASE WHEN NEW.operation = 'generation' THEN NEW.total_tokens ELSE 0 END,
        generation_cost_gbp = token_usage_daily.generation_cost_gbp + 
            CASE WHEN NEW.operation = 'generation' THEN NEW.total_cost ELSE 0 END,
        chat_tokens = token_usage_daily.chat_tokens + 
            CASE WHEN NEW.operation = 'chat' THEN NEW.total_tokens ELSE 0 END,
        chat_cost_gbp = token_usage_daily.chat_cost_gbp + 
            CASE WHEN NEW.operation = 'chat' THEN NEW.total_cost ELSE 0 END,
        episode_count = token_usage_daily.episode_count + 
            CASE WHEN NEW.episode_id IS NOT NULL THEN 1 ELSE 0 END,
        last_updated = NOW();
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail the original insert
        RAISE WARNING 'Failed to update token_usage_daily: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic aggregation
CREATE TRIGGER trigger_token_usage_daily
AFTER INSERT ON token_usage
FOR EACH ROW
EXECUTE FUNCTION update_token_usage_daily();

-- ============================================
-- UPDATED_AT TIMESTAMP
-- ============================================

-- Function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers to all tables with updated_at
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organization_members_updated_at BEFORE UPDATE ON organization_members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_episodes_updated_at BEFORE UPDATE ON episodes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_episode_schedule_queue_updated_at BEFORE UPDATE ON episode_schedule_queue
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_blocks_updated_at BEFORE UPDATE ON blocks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_planning_notes_updated_at BEFORE UPDATE ON planning_notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_memory_updated_at BEFORE UPDATE ON agent_memory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_sessions_updated_at BEFORE UPDATE ON chat_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_highlights_updated_at BEFORE UPDATE ON highlights
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- EPISODE NUMBER GENERATION
-- ============================================

-- Function to auto-increment episode number per project
CREATE OR REPLACE FUNCTION set_episode_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.episode_number IS NULL THEN
        SELECT COALESCE(MAX(episode_number), 0) + 1
        INTO NEW.episode_number
        FROM episodes
        WHERE project_id = NEW.project_id
        AND deleted_at IS NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for episode numbering
CREATE TRIGGER set_episode_number_trigger
BEFORE INSERT ON episodes
FOR EACH ROW
EXECUTE FUNCTION set_episode_number();

-- ============================================
-- IDEMPOTENCY KEY GENERATION
-- ============================================

-- Function to generate idempotency key if not provided
CREATE OR REPLACE FUNCTION generate_idempotency_key()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.idempotency_key IS NULL THEN
        -- Generate key based on project and scheduled time
        NEW.idempotency_key = NEW.project_id || '_' || 
                              DATE_TRUNC('day', NEW.scheduled_for)::text || '_' ||
                              EXTRACT(HOUR FROM NEW.scheduled_for)::text;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for idempotency key
CREATE TRIGGER generate_idempotency_key_trigger
BEFORE INSERT ON episodes
FOR EACH ROW
EXECUTE FUNCTION generate_idempotency_key();

-- ============================================
-- QUEUE PRIORITY CALCULATION
-- ============================================

-- Function to calculate queue priority
CREATE OR REPLACE FUNCTION calculate_queue_priority(
    subscription_tier VARCHAR,
    attempt_count INTEGER
) RETURNS INTEGER AS $$
BEGIN
    -- Premium gets highest priority
    IF subscription_tier = 'ENTERPRISE' THEN
        RETURN 10;
    ELSIF subscription_tier = 'GROWTH' THEN
        RETURN 9;
    -- Retries get elevated priority
    ELSIF attempt_count > 0 THEN
        RETURN 8;
    -- Trial gets medium priority
    ELSIF subscription_tier = 'TRIAL' THEN
        RETURN 6;
    -- Default priority
    ELSE
        RETURN 5;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to check daily cost limit
CREATE OR REPLACE FUNCTION check_daily_cost_limit(
    p_organization_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    v_daily_cost DECIMAL;
    v_limit DECIMAL;
BEGIN
    -- Get current daily cost
    SELECT total_cost_gbp
    INTO v_daily_cost
    FROM token_usage_daily
    WHERE organization_id = p_organization_id
    AND date = CURRENT_DATE;
    
    -- Get organization limit
    SELECT daily_cost_limit
    INTO v_limit
    FROM organizations
    WHERE id = p_organization_id;
    
    -- Check if under limit
    RETURN COALESCE(v_daily_cost, 0) < COALESCE(v_limit, 50);
END;
$$ LANGUAGE plpgsql;

-- Function to get next scheduled time for project
CREATE OR REPLACE FUNCTION get_next_scheduled_time(
    p_project_id UUID
) RETURNS TIMESTAMPTZ AS $$
DECLARE
    v_cadence JSONB;
    v_timezone TEXT;
    v_mode TEXT;
    v_days INTEGER[];
    v_hour INTEGER;
    v_next_time TIMESTAMPTZ;
BEGIN
    -- Get project cadence config and user timezone
    SELECT p.cadence_config, u.timezone
    INTO v_cadence, v_timezone
    FROM projects p
    JOIN users u ON p.user_id = u.id
    WHERE p.id = p_project_id;
    
    -- Extract cadence details
    v_mode := v_cadence->>'mode';
    v_hour := (v_cadence->>'deliveryHour')::INTEGER;
    
    -- Calculate based on mode
    IF v_mode = 'daily' THEN
        -- Next day at specified hour
        v_next_time := (CURRENT_DATE + INTERVAL '1 day' + v_hour * INTERVAL '1 hour') AT TIME ZONE v_timezone;
    ELSIF v_mode = 'weekly' THEN
        -- Get days array and find next occurrence
        SELECT ARRAY(SELECT jsonb_array_elements_text(v_cadence->'days')::INTEGER)
        INTO v_days;
        -- Logic to find next matching day (simplified)
        v_next_time := (CURRENT_DATE + INTERVAL '7 days' + v_hour * INTERVAL '1 hour') AT TIME ZONE v_timezone;
    ELSE
        -- Custom mode - use days array
        v_next_time := (CURRENT_DATE + INTERVAL '1 day' + v_hour * INTERVAL '1 hour') AT TIME ZONE v_timezone;
    END IF;
    
    RETURN v_next_time;
END;
$$ LANGUAGE plpgsql;