-- ==========================================================
-- AI Sales Agent Platform — PostgreSQL Initial Schema Migration
-- 24 Tables, Indexes, Constraints, and Multi-Tenancy Architecture
-- ==========================================================

-- Enable pgvector and UUID extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
-- Enable vector extension if supported by environment
DO $$
BEGIN
    CREATE EXTENSION IF NOT EXISTS "vector";
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'pgvector extension not installed or supported in this PostgreSQL instance; continuing without it.';
END $$;

-- ==========================================
-- 1. Tenancy, Organizations & Users
-- ==========================================

CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    plan_tier VARCHAR(50) NOT NULL DEFAULT 'STARTER', -- STARTER, GROWTH, ENTERPRISE
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255),
    avatar_url TEXT,
    is_super_admin BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS roles (
    id VARCHAR(50) PRIMARY KEY,
    description TEXT NOT NULL,
    permissions JSONB NOT NULL DEFAULT '[]'::jsonb
);

-- Seed default roles
INSERT INTO roles (id, description, permissions)
VALUES 
    ('ADMIN', 'Full organization and platform administration', '["org:manage", "users:manage", "campaigns:manage", "leads:manage", "leads:export", "billing:manage", "audit:view", "security:manage"]'::jsonb),
    ('MANAGER', 'Campaign, lead and analytics management', '["campaigns:manage", "leads:manage", "leads:export", "analytics:view", "imports:manage"]'::jsonb),
    ('USER', 'Standard sales agent - assigned leads and campaigns', '["campaigns:view", "leads:view", "leads:update", "calls:make"]'::jsonb)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'USER' REFERENCES roles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(organization_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_memberships_org_user ON memberships(organization_id, user_id);

-- ==========================================
-- 2. Business Profile & Catalog
-- ==========================================

CREATE TABLE IF NOT EXISTS business_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    website_url TEXT NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    industry VARCHAR(100),
    company_size VARCHAR(50),
    overview TEXT,
    target_icp JSONB DEFAULT '{}'::jsonb,
    ai_summary TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_business_profiles_org ON business_profiles(organization_id);

CREATE TABLE IF NOT EXISTS products_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    value_proposition TEXT,
    faq_data JSONB DEFAULT '[]'::jsonb,
    ai_suitability_status VARCHAR(50) NOT NULL DEFAULT 'PENDING_REVIEW', -- APPROVED, PENDING_REVIEW, REJECTED
    suitability_score NUMERIC(3,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_services_org ON products_services(organization_id);

CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    parsed_text TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_org ON documents(organization_id);

-- ==========================================
-- 3. Lead Sources, Leads & Scoring
-- ==========================================

CREATE TABLE IF NOT EXISTS lead_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    platform_id VARCHAR(50) NOT NULL, -- linkedin, x, company_website, public_directory, job_platform, freelance_platform, crm
    name VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_simulated BOOLEAN NOT NULL DEFAULT TRUE,
    config JSONB DEFAULT '{}'::jsonb,
    last_synced_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_lead_sources_org ON lead_sources(organization_id, platform_id);

CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    source_platform VARCHAR(50) NOT NULL,
    original_post_url TEXT NOT NULL,
    discovery_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    company_name VARCHAR(255) NOT NULL,
    company_website TEXT,
    industry VARCHAR(100),
    company_size VARCHAR(50),
    location VARCHAR(255),
    requirement TEXT NOT NULL,
    intent_score INTEGER NOT NULL DEFAULT 50, -- 0 - 100
    qualification_status VARCHAR(50) NOT NULL DEFAULT 'REVIEW_PENDING', -- UNQUALIFIED, REVIEW_PENDING, QUALIFIED, DISQUALIFIED, HANDOFF_REQUIRED
    lead_status VARCHAR(50) NOT NULL DEFAULT 'DISCOVERED', -- DISCOVERED, ENRICHED, CONTACTED, ENGAGED, QUALIFIED, CONVERTED, ARCHIVED
    ai_reasoning TEXT,
    is_simulated BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_org ON leads(organization_id);
CREATE INDEX IF NOT EXISTS idx_leads_intent_score ON leads(organization_id, intent_score DESC);
CREATE INDEX IF NOT EXISTS idx_leads_qualification ON leads(organization_id, qualification_status);
CREATE INDEX IF NOT EXISTS idx_leads_source ON leads(organization_id, source_platform);

CREATE TABLE IF NOT EXISTS lead_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    business_email VARCHAR(255),
    phone VARCHAR(50),
    job_title VARCHAR(255),
    linkedin_profile TEXT,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_contacts_lead ON lead_contacts(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_contacts_email ON lead_contacts(business_email);
CREATE INDEX IF NOT EXISTS idx_lead_contacts_phone ON lead_contacts(phone);

CREATE TABLE IF NOT EXISTS lead_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL UNIQUE REFERENCES leads(id) ON DELETE CASCADE,
    bant_budget_score INTEGER NOT NULL DEFAULT 0,
    bant_authority_score INTEGER NOT NULL DEFAULT 0,
    bant_need_score INTEGER NOT NULL DEFAULT 0,
    bant_timeline_score INTEGER NOT NULL DEFAULT 0,
    overall_intent_score INTEGER NOT NULL DEFAULT 0,
    scoring_breakdown JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_lead_scores_lead ON lead_scores(lead_id);

CREATE TABLE IF NOT EXISTS market_signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    signal_type VARCHAR(50) NOT NULL, -- requirement_posted, relevant_hiring, technology_stack, company_activity, decision_maker_identified
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    source_url TEXT,
    confidence NUMERIC(3,2) NOT NULL DEFAULT 0.90,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_market_signals_lead ON market_signals(lead_id);

-- ==========================================
-- 4. Campaigns & Calling Infrastructure
-- ==========================================

CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'LEADS_AND_CALLING', -- CALLING_ONLY, LEADS_AND_CALLING
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT', -- DRAFT, SCHEDULED, ACTIVE, PAUSED, COMPLETED, CANCELLED
    target_timezone VARCHAR(100) DEFAULT 'UTC',
    schedule_cron VARCHAR(100),
    config JSONB NOT NULL DEFAULT '{"language": "en", "timezone": "UTC", "calling_window_start": "09:00", "calling_window_end": "17:00", "retry_count": 3, "voicemail_enabled": true, "callback_enabled": true, "frequency": "immediate"}'::jsonb,
    voice_script_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaigns_org ON campaigns(organization_id, status);

CREATE TABLE IF NOT EXISTS campaign_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'QUEUED', -- QUEUED, IN_PROGRESS, CONNECTED, VOICEMAIL, COMPLETED, FAILED, RETRY_SCHEDULED
    scheduled_at TIMESTAMPTZ,
    called_at TIMESTAMPTZ,
    UNIQUE(campaign_id, lead_id)
);

CREATE INDEX IF NOT EXISTS idx_campaign_leads_campaign ON campaign_leads(campaign_id, status);

CREATE TABLE IF NOT EXISTS calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
    provider VARCHAR(50) NOT NULL DEFAULT 'simulated',
    direction VARCHAR(20) NOT NULL DEFAULT 'OUTBOUND', -- OUTBOUND, INBOUND
    status VARCHAR(50) NOT NULL DEFAULT 'completed', -- queued, dialing, ringing, connected, voicemail, retry_scheduled, callback_scheduled, completed, interested, not_interested, failed
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    duration_seconds INTEGER NOT NULL DEFAULT 0,
    language VARCHAR(20) NOT NULL DEFAULT 'en',
    outcome TEXT,
    intent TEXT,
    prospect_response_status VARCHAR(50), -- INTERESTED, NOT_INTERESTED, CALLBACK_REQUESTED, HANDOFF
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_calls_org ON calls(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_calls_lead ON calls(lead_id);
CREATE INDEX IF NOT EXISTS idx_calls_campaign ON calls(campaign_id);

CREATE TABLE IF NOT EXISTS call_transcripts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    call_id UUID NOT NULL UNIQUE REFERENCES calls(id) ON DELETE CASCADE,
    transcript_text TEXT NOT NULL,
    speaker_segments JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_call_transcripts_call ON call_transcripts(call_id);

CREATE TABLE IF NOT EXISTS call_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    call_id UUID NOT NULL UNIQUE REFERENCES calls(id) ON DELETE CASCADE,
    summary_text TEXT NOT NULL,
    key_takeaways JSONB NOT NULL DEFAULT '[]'::jsonb,
    objections_raised JSONB NOT NULL DEFAULT '[]'::jsonb,
    sentiment VARCHAR(20) NOT NULL DEFAULT 'NEUTRAL', -- POSITIVE, NEUTRAL, NEGATIVE
    next_best_action TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_call_summaries_call ON call_summaries(call_id);

-- ==========================================
-- 5. Notifications, Subscriptions & Metering
-- ==========================================

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'system_alert', -- lead_discovered, high_intent_lead, campaign_started, campaign_completed, interested_prospect, callback, system_alert
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_org_user ON notifications(organization_id, user_id, is_read);

CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID UNIQUE NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    plan_tier VARCHAR(50) NOT NULL DEFAULT 'STARTER', -- STARTER, GROWTH, ENTERPRISE
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, PAST_DUE, CANCELLED, TRIAL
    allocated_voice_minutes INTEGER NOT NULL DEFAULT 500,
    used_voice_minutes INTEGER NOT NULL DEFAULT 0,
    current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    current_period_end TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days')
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_org ON subscriptions(organization_id);

CREATE TABLE IF NOT EXISTS usage_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    metric VARCHAR(50) NOT NULL, -- voice_minutes, leads_discovered, api_calls, contacts_enriched
    quantity INTEGER NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_usage_records_org ON usage_records(organization_id, metric, recorded_at);

CREATE TABLE IF NOT EXISTS crm_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL, -- hubspot, salesforce, zoho, pipedrive
    is_connected BOOLEAN NOT NULL DEFAULT FALSE,
    access_token TEXT,
    refresh_token TEXT,
    last_synced_at TIMESTAMPTZ,
    UNIQUE(organization_id, provider)
);

-- ==========================================
-- 6. Audit Logs, Fraud Events & Health Metrics
-- ==========================================

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255),
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    ip_address VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_org ON audit_logs(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

CREATE TABLE IF NOT EXISTS fraud_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    severity VARCHAR(20) NOT NULL DEFAULT 'MEDIUM', -- LOW, MEDIUM, HIGH, CRITICAL
    event_type VARCHAR(100) NOT NULL, -- abnormal_calling_rate, spam_content_flag, suspicious_login, rapid_bulk_export
    description TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'OPEN', -- OPEN, INVESTIGATING, RESOLVED, DISMISSED
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fraud_events_org ON fraud_events(organization_id, status);

CREATE TABLE IF NOT EXISTS system_health_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    component VARCHAR(100) NOT NULL, -- scraper_cluster, gemini_api, telephony_gateway, database
    status VARCHAR(50) NOT NULL DEFAULT 'HEALTHY', -- HEALTHY, DEGRADED, DOWN
    latency_ms INTEGER NOT NULL DEFAULT 0,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_health_metrics_comp ON system_health_metrics(component, recorded_at DESC);
