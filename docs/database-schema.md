# Database Schema Specification

## 1. Overview & ERD Relationships

The database is built on **PostgreSQL** with **pgvector** support for semantic embeddings.

```
+-------------------+         +-------------------+         +-----------------------+
|   organizations   | 1─────* |       users       | 1─────* |     audit_logs        |
+-------------------+         +-------------------+         +-----------------------+
          │                             │                               │
          │ 1                           │ 1                             │ 1
          ▼ *                           ▼ *                             ▼ *
+-------------------+         +-------------------+         +-----------------------+
| business_profiles |         |    memberships    |         |     fraud_events      |
+-------------------+         +-------------------+         +-----------------------+
          │
          │ 1
          ▼ *
+-------------------+         +-------------------+         +-----------------------+
| products_services | 1─────* |   lead_sources    | 1─────* |        leads          |
+-------------------+         +-------------------+         +-----------------------+
                                                                        │
                                                                        │ 1
                                                                        ▼ *
+-------------------+         +-------------------+         +-----------------------+
|  market_signals   | *─────1 |    campaigns      | 1─────* |     lead_contacts     |
+-------------------+         +-------------------+         +-----------------------+
                                        │                               │
                                        │ 1                             │ 1
                                        ▼ *                             ▼ *
                              +-------------------+         +-----------------------+
                              |  campaign_leads   | *─────1 |        calls          |
                              +-------------------+         +-----------------------+
                                                                        │
                                                                        │ 1
                                                                        ▼ *
                                                            +-----------------------+
                                                            |    call_transcripts   |
                                                            |    call_summaries     |
                                                            +-----------------------+
```

---

## 2. Table Specifications (24 Required Entities)

### 1. `organizations`
```sql
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    plan_tier VARCHAR(50) NOT NULL DEFAULT 'STARTER', -- STARTER, GROWTH, ENTERPRISE
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 2. `users`
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255),
    avatar_url TEXT,
    is_super_admin BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 3. `memberships`
```sql
CREATE TABLE memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'MEMBER', -- ADMIN, CAMPAIGN_MANAGER, MEMBER, AUDITOR
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(organization_id, user_id)
);
```

### 4. `roles`
```sql
CREATE TABLE roles (
    id VARCHAR(50) PRIMARY KEY,
    description TEXT NOT NULL,
    permissions JSONB NOT NULL DEFAULT '[]'
);
```

### 5. `business_profiles`
```sql
CREATE TABLE business_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    website_url TEXT NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    industry VARCHAR(100),
    company_size VARCHAR(50),
    overview TEXT,
    target_icp JSONB, -- Ideal customer profile criteria
    ai_summary TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 6. `products_services`
```sql
CREATE TABLE products_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL, -- e.g. Microsoft 365, SharePoint, Custom App
    description TEXT NOT NULL,
    value_proposition TEXT,
    faq_data JSONB DEFAULT '[]', -- Question & Answer pairs for AI Agent
    ai_suitability_status VARCHAR(50) NOT NULL DEFAULT 'PENDING_REVIEW', -- APPROVED, PENDING_REVIEW, REJECTED
    suitability_score NUMERIC(3,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 7. `documents`
```sql
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    parsed_text TEXT,
    embedding VECTOR(1536), -- Vector representation for RAG matching
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 8. `lead_sources`
```sql
CREATE TABLE lead_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    platform_id VARCHAR(50) NOT NULL, -- linkedin, x, company_website, public_directory, job_platform, freelance_platform, crm
    name VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_simulated BOOLEAN NOT NULL DEFAULT TRUE,
    config JSONB DEFAULT '{}',
    last_synced_at TIMESTAMPTZ
);
```

### 9. `leads`
```sql
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    source_platform VARCHAR(50) NOT NULL,
    original_post_url TEXT NOT NULL,
    discovery_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    company_name VARCHAR(255) NOT NULL,
    company_website TEXT,
    industry VARCHAR(100),
    company_size VARCHAR(50),
    requirement TEXT NOT NULL,
    intent_score INTEGER NOT NULL DEFAULT 50, -- 0 - 100
    qualification_status VARCHAR(50) NOT NULL DEFAULT 'REVIEW_PENDING', -- UNQUALIFIED, REVIEW_PENDING, QUALIFIED, DISQUALIFIED, HANDOFF_REQUIRED
    ai_reasoning TEXT,
    is_simulated BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 10. `lead_contacts`
```sql
CREATE TABLE lead_contacts (
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
```

### 11. `lead_scores`
```sql
CREATE TABLE lead_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    bant_budget_score INTEGER NOT NULL DEFAULT 0,
    bant_authority_score INTEGER NOT NULL DEFAULT 0,
    bant_need_score INTEGER NOT NULL DEFAULT 0,
    bant_timeline_score INTEGER NOT NULL DEFAULT 0,
    overall_intent_score INTEGER NOT NULL DEFAULT 0,
    scoring_breakdown JSONB NOT NULL DEFAULT '{}'
);
```

### 12. `market_signals`
```sql
CREATE TABLE market_signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    signal_type VARCHAR(50) NOT NULL, -- requirement_posted, relevant_hiring, technology_stack, company_activity, decision_maker_identified
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    source_url TEXT,
    confidence NUMERIC(3,2) NOT NULL DEFAULT 0.90,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 13. `campaigns`
```sql
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT', -- DRAFT, SCHEDULED, ACTIVE, PAUSED, COMPLETED
    target_timezone VARCHAR(100) DEFAULT 'UTC',
    schedule_cron VARCHAR(100),
    voice_script_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 14. `campaign_leads`
```sql
CREATE TABLE campaign_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'QUEUED', -- QUEUED, IN_PROGRESS, CONNECTED, VOICEMAIL, COMPLETED, FAILED
    scheduled_at TIMESTAMPTZ,
    called_at TIMESTAMPTZ
);
```

### 15. `calls`
```sql
CREATE TABLE calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
    direction VARCHAR(20) NOT NULL DEFAULT 'OUTBOUND', -- OUTBOUND, INBOUND
    status VARCHAR(50) NOT NULL DEFAULT 'COMPLETED', -- IN_PROGRESS, COMPLETED, BUSY, NO_ANSWER, VOICEMAIL_DROPPED
    duration_seconds INTEGER NOT NULL DEFAULT 0,
    language VARCHAR(20) NOT NULL DEFAULT 'en',
    prospect_response_status VARCHAR(50), -- INTERESTED, NOT_INTERESTED, CALLBACK_REQUESTED, HANDOFF
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 16. `call_transcripts`
```sql
CREATE TABLE call_transcripts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    call_id UUID NOT NULL REFERENCES calls(id) ON DELETE CASCADE,
    transcript_text TEXT NOT NULL,
    speaker_segments JSONB NOT NULL DEFAULT '[]', -- Timestamps, speaker labels (Agent vs Prospect)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 17. `call_summaries`
```sql
CREATE TABLE call_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    call_id UUID NOT NULL REFERENCES calls(id) ON DELETE CASCADE,
    summary_text TEXT NOT NULL,
    key_takeaways JSONB NOT NULL DEFAULT '[]',
    objections_raised JSONB NOT NULL DEFAULT '[]',
    sentiment VARCHAR(20) NOT NULL DEFAULT 'NEUTRAL', -- POSITIVE, NEUTRAL, NEGATIVE
    next_best_action TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 18. `notifications`
```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'INFO', -- INFO, SUCCESS, WARNING, ALERT
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 19. `subscriptions`
```sql
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID UNIQUE NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    plan_tier VARCHAR(50) NOT NULL DEFAULT 'STARTER',
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    allocated_voice_minutes INTEGER NOT NULL DEFAULT 500,
    used_voice_minutes INTEGER NOT NULL DEFAULT 0,
    current_period_end TIMESTAMPTZ NOT NULL
);
```

### 20. `usage_records`
```sql
CREATE TABLE usage_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    metric VARCHAR(50) NOT NULL, -- voice_minutes, leads_discovered, api_calls
    quantity INTEGER NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 21. `audit_logs`
```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255),
    details JSONB NOT NULL DEFAULT '{}',
    ip_address VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 22. `fraud_events`
```sql
CREATE TABLE fraud_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    severity VARCHAR(20) NOT NULL DEFAULT 'MEDIUM', -- LOW, MEDIUM, HIGH, CRITICAL
    event_type VARCHAR(100) NOT NULL, -- abnormal_calling_rate, spam_content_flag, suspicious_login
    description TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'OPEN',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 23. `crm_connections`
```sql
CREATE TABLE crm_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL, -- hubspot, salesforce, zoho, pipedrive
    is_connected BOOLEAN NOT NULL DEFAULT FALSE,
    access_token TEXT,
    refresh_token TEXT,
    last_synced_at TIMESTAMPTZ
);
```

### 24. `system_health_metrics`
```sql
CREATE TABLE system_health_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    component VARCHAR(100) NOT NULL, -- scraper_cluster, gemini_api, telephony_gateway, database
    status VARCHAR(50) NOT NULL DEFAULT 'HEALTHY',
    latency_ms INTEGER NOT NULL DEFAULT 0,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```
