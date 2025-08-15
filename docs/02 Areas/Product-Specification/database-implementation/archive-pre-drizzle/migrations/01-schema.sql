-- ============================================
-- Many Futures Database Schema
-- Version: 1.0.0
-- Created: 2025-01-16
-- Description: Complete production schema with all 16 tables
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CORE TABLES
-- ============================================

-- Organizations (foundation for all data)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('PERSONAL', 'TEAM')),
    owner_id UUID NOT NULL,
    clerk_org_id VARCHAR(255),
    
    -- Billing & Limits
    subscription_tier VARCHAR(20) DEFAULT 'TRIAL' CHECK (subscription_tier IN ('TRIAL', 'STARTER', 'GROWTH', 'ENTERPRISE')),
    daily_cost_limit DECIMAL(10,2) DEFAULT 50.00,
    episode_cost_limit DECIMAL(10,2) DEFAULT 3.00,
    
    -- Soft delete
    deleted_at TIMESTAMPTZ,
    deleted_by UUID,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clerk_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    timezone VARCHAR(100) DEFAULT 'Europe/London',
    
    -- Preferences
    default_organization_id UUID,
    notification_preferences JSONB DEFAULT '{"episodeReady": true, "generationFailed": false}'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organization Members (many-to-many)
CREATE TABLE organization_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL DEFAULT 'MEMBER' CHECK (role IN ('OWNER', 'ADMIN', 'MEMBER')),
    
    -- Soft delete
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES users(id),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Prevent duplicate memberships
    UNIQUE(organization_id, user_id)
);

-- Projects
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    
    -- Core content
    title VARCHAR(255) NOT NULL,
    onboarding_brief JSONB NOT NULL,
    
    -- Scheduling (subscription model)
    cadence_config JSONB NOT NULL DEFAULT '{"mode": "weekly", "days": [1], "deliveryHour": 9}'::jsonb,
    
    -- Memory system (backend ready)
    memories JSONB DEFAULT '[]'::jsonb,
    
    -- Status
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED')),
    is_paused BOOLEAN DEFAULT false,
    next_scheduled_at TIMESTAMPTZ,
    
    -- Soft delete
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES users(id),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CONTENT TABLES
-- ============================================

-- Episodes
CREATE TABLE episodes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Content
    title VARCHAR(500),
    content TEXT,
    sources JSONB DEFAULT '[]'::jsonb,
    
    -- Status
    status VARCHAR(20) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'GENERATING', 'PUBLISHED', 'FAILED')),
    
    -- Timing (clarified fields)
    scheduled_for TIMESTAMPTZ NOT NULL,           -- When user expects episode (9am)
    generation_started_at TIMESTAMPTZ,            -- When generation actually began (5am)
    published_at TIMESTAMPTZ,                     -- When content was ready
    delivered_at TIMESTAMPTZ,                     -- When email was sent
    
    -- Generation tracking
    generation_attempts INTEGER DEFAULT 0,
    generation_errors JSONB DEFAULT '[]'::jsonb,
    idempotency_key VARCHAR(255),                 -- Prevent duplicate episodes
    
    -- Metadata
    episode_number INTEGER,
    reading_minutes INTEGER,
    
    -- Soft delete
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES users(id),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Prevent duplicate episodes for same schedule
    UNIQUE(project_id, idempotency_key)
);

-- Episode Schedule Queue (critical for production)
CREATE TABLE episode_schedule_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    episode_id UUID NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Timing (clarified)
    generation_start_time TIMESTAMPTZ NOT NULL,   -- START generation at this time (5am)
    target_delivery_time TIMESTAMPTZ NOT NULL,    -- User expects episode at this time (9am)
    
    -- Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    priority INTEGER DEFAULT 5,                   -- 10=Premium, 8=Retry, 5=Standard
    
    -- Processing
    locked_at TIMESTAMPTZ,
    locked_by VARCHAR(255),
    attempt_count INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    
    -- Results
    completed_at TIMESTAMPTZ,
    error_message TEXT,
    result JSONB,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Prevent duplicate queue entries
    UNIQUE(episode_id, status)
);

-- Blocks (content structure)
CREATE TABLE blocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    episode_id UUID NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Content
    type VARCHAR(20) DEFAULT 'MARKDOWN' CHECK (type IN ('MARKDOWN', 'INSIGHT', 'SIGNAL', 'SCENARIO')),
    content TEXT NOT NULL,
    position INTEGER NOT NULL,
    
    -- Metadata (not JSON for querying)
    title VARCHAR(500),
    source_urls TEXT[],
    confidence_score DECIMAL(3,2),
    
    -- Soft delete
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES users(id),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- OPERATIONAL TABLES
-- ============================================

-- Token Usage (track every API call)
CREATE TABLE token_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    episode_id UUID REFERENCES episodes(id) ON DELETE SET NULL,
    
    -- Usage details
    model VARCHAR(100) NOT NULL,
    operation VARCHAR(100),
    prompt_tokens INTEGER NOT NULL,
    completion_tokens INTEGER NOT NULL,
    total_tokens INTEGER GENERATED ALWAYS AS (prompt_tokens + completion_tokens) STORED,
    total_cost DECIMAL(10,4) NOT NULL,
    
    -- Context
    user_id UUID REFERENCES users(id),
    metadata JSONB,
    
    -- Timestamp
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Token Usage Daily (aggregated for performance)
CREATE TABLE token_usage_daily (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    
    -- Aggregates
    total_tokens INTEGER DEFAULT 0,
    total_cost_gbp DECIMAL(10,2) DEFAULT 0,
    
    -- Breakdown by operation
    generation_tokens INTEGER DEFAULT 0,
    generation_cost_gbp DECIMAL(10,2) DEFAULT 0,
    chat_tokens INTEGER DEFAULT 0,
    chat_cost_gbp DECIMAL(10,2) DEFAULT 0,
    
    -- Metadata
    episode_count INTEGER DEFAULT 0,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    
    -- Prevent duplicates
    UNIQUE(organization_id, date)
);

-- Planning Notes (user feedback loop)
CREATE TABLE planning_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    episode_id UUID REFERENCES episodes(id) ON DELETE SET NULL,
    
    -- Content
    note TEXT NOT NULL,
    note_type VARCHAR(50) DEFAULT 'GENERAL',
    
    -- Processing
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'incorporated', 'dismissed')),
    priority INTEGER DEFAULT 5,
    scope VARCHAR(20) DEFAULT 'NEXT_EPISODE' CHECK (scope IN ('NEXT_EPISODE', 'FUTURE', 'GENERAL')),
    
    -- Results
    processed_at TIMESTAMPTZ,
    processed_by VARCHAR(100),
    impact_summary TEXT,
    
    -- Soft delete
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES users(id),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Events (flexible tracking)
CREATE TABLE user_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Event details
    event_type VARCHAR(100) NOT NULL,  -- 'episode_opened', 'feedback_submitted', etc.
    event_data JSONB,                  -- Flexible data storage
    
    -- Context
    session_id VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    
    -- Timestamp
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Log (compliance and debugging)
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    
    -- Audit details
    action VARCHAR(100) NOT NULL,      -- 'CREATE', 'UPDATE', 'DELETE', etc.
    resource_type VARCHAR(100) NOT NULL,
    resource_id UUID,
    
    -- Changes
    old_values TEXT,
    new_values TEXT,
    
    -- Context
    ip_address INET,
    user_agent TEXT,
    
    -- Timestamp
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- FUTURE FEATURES (Create now for stability)
-- ============================================

-- Agent Memory
CREATE TABLE agent_memory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Memory content
    content TEXT NOT NULL,
    memory_type VARCHAR(50) DEFAULT 'GENERAL',
    importance DECIMAL(3,2) DEFAULT 0.5,
    
    -- Metadata
    source VARCHAR(100),
    source_id UUID,
    expires_at TIMESTAMPTZ,
    
    -- Soft delete
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES users(id),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat Sessions
CREATE TABLE chat_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    episode_id UUID REFERENCES episodes(id) ON DELETE SET NULL,
    
    -- Session details
    title VARCHAR(255),
    context_episodes UUID[],
    context_blocks UUID[],
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Metrics
    message_count INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    total_cost DECIMAL(10,4) DEFAULT 0,
    
    -- Soft delete
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES users(id),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat Messages
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Message content
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    
    -- Metadata
    tokens_used INTEGER,
    cost DECIMAL(10,4),
    model VARCHAR(100),
    
    -- Extracted data
    extracted_insights JSONB,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Highlights (text selections)
CREATE TABLE highlights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    episode_id UUID NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
    block_id UUID REFERENCES blocks(id) ON DELETE CASCADE,
    
    -- Selection details
    selected_text TEXT NOT NULL,
    start_offset INTEGER,
    end_offset INTEGER,
    
    -- User annotation
    note TEXT,
    color VARCHAR(20) DEFAULT 'yellow',
    
    -- Chat reference
    chat_session_id UUID REFERENCES chat_sessions(id) ON DELETE SET NULL,
    
    -- Soft delete
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES users(id),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Critical for queue processing
CREATE INDEX idx_queue_processing 
ON episode_schedule_queue(generation_start_time, status, priority DESC)
WHERE status = 'pending';

-- Critical for cost limit checks
CREATE INDEX idx_token_daily_lookup
ON token_usage_daily(organization_id, date DESC);

-- Critical for episode generation
CREATE INDEX idx_episodes_generation_due
ON episodes(scheduled_for, status)
WHERE status = 'DRAFT';

-- Organization scoping (most queries)
CREATE INDEX idx_projects_org ON projects(organization_id);
CREATE INDEX idx_episodes_org ON episodes(organization_id);
CREATE INDEX idx_planning_notes_org ON planning_notes(organization_id);
CREATE INDEX idx_token_usage_org ON token_usage(organization_id);

-- User queries
CREATE INDEX idx_org_members_user ON organization_members(user_id);
CREATE INDEX idx_user_events_user ON user_events(user_id, event_type);

-- Episode queries
CREATE INDEX idx_episodes_project ON episodes(project_id);
CREATE INDEX idx_blocks_episode ON blocks(episode_id);

-- Audit queries
CREATE INDEX idx_audit_resource ON audit_log(resource_type, resource_id);

-- ============================================
-- CONSTRAINTS (Additional)
-- ============================================

-- Ensure queue entries are unique per status
ALTER TABLE episode_schedule_queue
ADD CONSTRAINT unique_queue_entry_pending
UNIQUE (episode_id, status);

-- Ensure daily aggregates are unique
ALTER TABLE token_usage_daily
ADD CONSTRAINT unique_org_date
UNIQUE (organization_id, date);

-- ============================================
-- ROW LEVEL SECURITY (Enable on all tables)
-- ============================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE episode_schedule_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_usage_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE planning_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE highlights ENABLE ROW LEVEL SECURITY;

-- Note: RLS policies will be created in 02-rls.sql