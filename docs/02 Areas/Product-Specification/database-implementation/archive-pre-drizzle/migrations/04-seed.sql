-- ============================================
-- Seed Data for Testing
-- Version: 1.0.0
-- Created: 2025-01-16
-- Description: Initial test data for development
-- ============================================

-- Note: Replace these IDs and values with your actual test data

-- Create a test user (you'll need to match this with your Clerk user)
INSERT INTO users (id, clerk_id, email, name, timezone) VALUES
('11111111-1111-1111-1111-111111111111', 'user_test_clerk_id', 'test@manyfutures.ai', 'Test User', 'Europe/London');

-- Create a personal organization
INSERT INTO organizations (id, name, type, owner_id, subscription_tier, daily_cost_limit, episode_cost_limit) VALUES
('22222222-2222-2222-2222-222222222222', 'Test User''s Workspace', 'PERSONAL', '11111111-1111-1111-1111-111111111111', 'TRIAL', 50.00, 3.00);

-- Add user to organization
INSERT INTO organization_members (organization_id, user_id, role) VALUES
('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'OWNER');

-- Create a test project
INSERT INTO projects (
    id, 
    organization_id, 
    user_id, 
    title, 
    onboarding_brief,
    cadence_config,
    status,
    next_scheduled_at
) VALUES (
    '33333333-3333-3333-3333-333333333333',
    '22222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    'Future of AI Security',
    '{"conversation": [
        {"role": "user", "content": "I want to understand how AI will impact cybersecurity"},
        {"role": "assistant", "content": "Great topic! What''s your role and what specific aspects interest you most?"},
        {"role": "user", "content": "I''m a CISO at a fintech company. Interested in both threats and defenses."},
        {"role": "assistant", "content": "Perfect. I''ll focus on AI-powered threats, defensive AI systems, and regulatory implications for financial services."}
    ]}'::jsonb,
    '{"mode": "weekly", "days": [1, 4], "deliveryHour": 9}'::jsonb,
    'ACTIVE',
    NOW() + INTERVAL '3 days'
);

-- Create some mock episodes (since n8n isn't ready yet)
INSERT INTO episodes (
    id,
    project_id,
    organization_id,
    title,
    content,
    sources,
    status,
    scheduled_for,
    published_at,
    delivered_at,
    episode_number,
    reading_minutes
) VALUES 
(
    '44444444-4444-4444-4444-444444444444',
    '33333333-3333-3333-3333-333333333333',
    '22222222-2222-2222-2222-222222222222',
    'The Rise of Adversarial AI',
    '# The Rise of Adversarial AI

## Executive Summary

The cybersecurity landscape is experiencing a fundamental shift as adversarial AI becomes increasingly sophisticated. Recent developments suggest that 2025 will be a pivotal year for AI-powered cyber threats.

## Key Developments

### 1. Automated Vulnerability Discovery

Machine learning models are now capable of discovering zero-day vulnerabilities at unprecedented rates. According to recent research from MIT CSAIL, automated systems have identified 47% more vulnerabilities in common software packages compared to traditional methods.

### 2. Defensive AI Evolution

In response to growing threats, defensive AI systems are evolving rapidly:
- **Behavioral analytics** detecting anomalies with 94% accuracy
- **Predictive threat modeling** anticipating attacks 72 hours in advance
- **Automated response systems** reducing incident response time by 80%

## Implications for Financial Services

Financial institutions face unique challenges:
1. Regulatory compliance with AI decision-making
2. Protecting customer data from AI-powered attacks
3. Balancing automation with human oversight

## Strategic Recommendations

- Invest in AI-powered security operations centers
- Develop adversarial testing protocols
- Create cross-functional AI security teams
- Establish partnerships with AI security vendors

## Looking Ahead

The next 6-12 months will likely see increased investment in defensive AI capabilities, with particular focus on explainable AI for security applications.',
    '[
        {"title": "MIT CSAIL Adversarial AI Report", "url": "https://example.com/mit-report", "credibilityScore": 0.95},
        {"title": "Gartner Security & Risk Summit Insights", "url": "https://example.com/gartner", "credibilityScore": 0.9},
        {"title": "Financial Services AI Security Guidelines", "url": "https://example.com/fsa", "credibilityScore": 0.88}
    ]'::jsonb,
    'PUBLISHED',
    NOW() - INTERVAL '7 days',
    NOW() - INTERVAL '7 days' + INTERVAL '2 hours',
    NOW() - INTERVAL '7 days' + INTERVAL '2 hours',
    1,
    8
),
(
    '55555555-5555-5555-5555-555555555555',
    '33333333-3333-3333-3333-333333333333',
    '22222222-2222-2222-2222-222222222222',
    'Quantum Computing and Encryption',
    '# Quantum Computing''s Impact on Encryption

## The Quantum Threat Timeline

Recent breakthroughs at IBM and Google suggest quantum computers capable of breaking current encryption standards may arrive sooner than expected. The "Y2Q" moment—when quantum computers can break RSA-2048—has been revised from 2035 to potentially 2029.

## Current State of Post-Quantum Cryptography

NIST has standardized four quantum-resistant algorithms:
- CRYSTALS-Kyber (key encapsulation)
- CRYSTALS-Dilithium (digital signatures)
- FALCON (digital signatures)
- SPHINCS+ (hash-based signatures)

## Migration Challenges for Financial Services

Financial institutions face significant hurdles:
1. **Legacy system compatibility** - 60% of banking systems still use deprecated encryption
2. **Performance overhead** - Post-quantum algorithms increase computational requirements by 3-5x
3. **Regulatory uncertainty** - No clear mandates on migration timelines

## Strategic Actions

Immediate steps for CISOs:
- Conduct cryptographic inventory
- Pilot post-quantum algorithms in non-critical systems
- Develop crypto-agility frameworks
- Engage with standards bodies',
    '[
        {"title": "NIST Post-Quantum Cryptography Standards", "url": "https://example.com/nist-pqc", "credibilityScore": 0.98},
        {"title": "IBM Quantum Network Report", "url": "https://example.com/ibm-quantum", "credibilityScore": 0.92}
    ]'::jsonb,
    'PUBLISHED',
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '3 days' + INTERVAL '2 hours',
    NOW() - INTERVAL '3 days' + INTERVAL '2 hours',
    2,
    6
);

-- Create a draft episode (scheduled for future)
INSERT INTO episodes (
    id,
    project_id,
    organization_id,
    title,
    status,
    scheduled_for,
    episode_number,
    idempotency_key
) VALUES (
    '66666666-6666-6666-6666-666666666666',
    '33333333-3333-3333-3333-333333333333',
    '22222222-2222-2222-2222-222222222222',
    'Zero Trust Architecture Evolution',
    'DRAFT',
    NOW() + INTERVAL '4 days',
    3,
    '33333333-3333-3333-3333-333333333333_' || DATE_TRUNC('day', NOW() + INTERVAL '4 days')::text
);

-- Add to schedule queue
INSERT INTO episode_schedule_queue (
    episode_id,
    organization_id,
    generation_start_time,
    target_delivery_time,
    status,
    priority
) VALUES (
    '66666666-6666-6666-6666-666666666666',
    '22222222-2222-2222-2222-222222222222',
    NOW() + INTERVAL '4 days' - INTERVAL '4 hours',  -- Generate 4 hours before
    NOW() + INTERVAL '4 days',                        -- Deliver at scheduled time
    'pending',
    5
);

-- Add some planning notes
INSERT INTO planning_notes (
    project_id,
    organization_id,
    user_id,
    episode_id,
    note,
    note_type,
    status,
    priority,
    scope
) VALUES 
(
    '33333333-3333-3333-3333-333333333333',
    '22222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    '44444444-4444-4444-4444-444444444444',
    'Can you include more specific examples of AI attacks on financial institutions?',
    'CONTENT_REQUEST',
    'pending',
    7,
    'NEXT_EPISODE'
),
(
    '33333333-3333-3333-3333-333333333333',
    '22222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    '55555555-5555-5555-5555-555555555555',
    'The quantum timeline section was particularly valuable - more like this please',
    'POSITIVE_FEEDBACK',
    'incorporated',
    5,
    'FUTURE'
);

-- Add some user events
INSERT INTO user_events (
    user_id,
    organization_id,
    event_type,
    event_data
) VALUES 
(
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    'project_created',
    '{"projectId": "33333333-3333-3333-3333-333333333333", "title": "Future of AI Security"}'::jsonb
),
(
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    'episode_opened',
    '{"episodeId": "44444444-4444-4444-4444-444444444444", "duration": 0}'::jsonb
),
(
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    'episode_completed',
    '{"episodeId": "44444444-4444-4444-4444-444444444444", "duration": 485, "scrollDepth": 100}'::jsonb
);

-- Add token usage (simulate some API calls)
INSERT INTO token_usage (
    organization_id,
    episode_id,
    model,
    operation,
    prompt_tokens,
    completion_tokens,
    total_cost,
    user_id
) VALUES 
(
    '22222222-2222-2222-2222-222222222222',
    '44444444-4444-4444-4444-444444444444',
    'gpt-4-turbo',
    'generation',
    2500,
    1800,
    0.086,
    '11111111-1111-1111-1111-111111111111'
),
(
    '22222222-2222-2222-2222-222222222222',
    '55555555-5555-5555-5555-555555555555',
    'gpt-4-turbo',
    'generation',
    2200,
    1600,
    0.076,
    '11111111-1111-1111-1111-111111111111'
);

-- Note: The trigger will automatically create entries in token_usage_daily

-- Add a sample block for the first episode
INSERT INTO blocks (
    episode_id,
    organization_id,
    type,
    content,
    position,
    title
) VALUES (
    '44444444-4444-4444-4444-444444444444',
    '22222222-2222-2222-2222-222222222222',
    'MARKDOWN',
    '# The Rise of Adversarial AI

## Executive Summary

The cybersecurity landscape is experiencing a fundamental shift as adversarial AI becomes increasingly sophisticated. Recent developments suggest that 2025 will be a pivotal year for AI-powered cyber threats.',
    10,
    'Introduction'
);

-- Display summary
SELECT 'Seed data created successfully!' as message;
SELECT 'Test user email: test@manyfutures.ai' as info;
SELECT 'Test organization: Test User''s Workspace' as info;
SELECT 'Test project: Future of AI Security' as info;
SELECT COUNT(*) as episode_count FROM episodes;
SELECT COUNT(*) as event_count FROM user_events;