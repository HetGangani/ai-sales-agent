# AI Sales Agent Platform — Backend, Database & Platform Engineering Guide

> **Author / Ownership:** Agent 2 — Backend, Database & Platform Engineer  
> **Status:** Completed & Verified  
> **Architecture:** Modular Monolith (Next.js App Router REST APIs + PostgreSQL / Multi-Tenant Repository)  
> **Base Endpoint:** `/api/v1`

---

## 1. Executive Summary & Architecture

The backend layer is engineered as a high-performance, strictly isolated **Modular Monolith** designed to serve web, AI, voice, and future mobile clients via unified REST contracts.

```
src/
├── app/api/v1/                 # Modular Next.js Route Handlers
│   ├── auth/                   # Register, Login, Logout, Me
│   ├── business/               # Profile, Catalog, Document Ingestion
│   ├── leads/                  # CRUD, Search, 4-Way Deduplication Import/Export
│   ├── opportunities/          # Public Requirements Feed & Continuous Discovery
│   ├── intelligence/           # Market Signals & Opportunity Radar
│   ├── campaigns/              # Lifecycle State Machine & Lead Queue
│   ├── voice/                  # Call Records, Transcripts & Simulation
│   ├── analytics/              # Sales Performance & Conversion Funnel
│   ├── usage/                  # Voice Minutes & Lead Discovered Metering
│   ├── billing/                # Subscription Tiers & Quota Management
│   ├── notifications/          # Alerts, High-Intent Triggers & Read State
│   └── admin/                  # Dashboard Stats, Audit Trail & Fraud Alerts
├── lib/
│   ├── auth/                   # JWT, Bcrypt Password Hashing, RBAC Matrix, Session Guard
│   ├── db/                     # DDL Migrations, PG Pool, Multi-Tenant Repository, Seed Data
│   ├── schemas/                # Strict Zod Validation Schemas
│   ├── security/               # Sliding-Window Rate Limiter, Audit Logger, Fraud Detector
│   ├── services/               # 10 Domain Business Services
│   └── utils/                  # Standard JSON Response Wrapper (`apiSuccess`, `apiError`)
```

---

## 2. Database Schema (24 Core Entities)

All tables use **UUID** primary keys (`DEFAULT gen_random_uuid()`), timestamps (`created_at`, `updated_at`), foreign key integrity with `ON DELETE CASCADE` / `ON DELETE SET NULL`, and B-Tree indexes on `organization_id` and search fields.

| # | Table Name | Purpose & Primary Keys | Multi-Tenant Key |
| :--- | :--- | :--- | :--- |
| 1 | `organizations` | Tenant account (`id`, `name`, `slug`, `plan_tier`) | N/A (Root) |
| 2 | `users` | User credentials (`id`, `email`, `password_hash`, `name`) | N/A (Global) |
| 3 | `roles` | RBAC role definitions (`id`: `ADMIN`, `MANAGER`, `USER`) | Platform-wide |
| 4 | `memberships` | User-to-Organization mapping & assigned role | `organization_id` |
| 5 | `business_profiles` | Client company overview, ICP criteria, AI summary | `organization_id` |
| 6 | `products_services` | Product catalog, AI suitability score & FAQ pairs | `organization_id` |
| 7 | `documents` | Uploaded PDF/Docs, parsed text & RAG embeddings | `organization_id` |
| 8 | `lead_sources` | Ingestion channel configs (LinkedIn, Web, Job, etc.) | `organization_id` |
| 9 | `leads` | Discovered commercial opportunities (11 attributes) | `organization_id` |
| 10 | `lead_contacts` | Verified decision makers, emails, phones, LinkedIn | Via `lead_id` |
| 11 | `lead_scores` | BANT scoring breakdown (Budget, Authority, Need, Timeline) | Via `lead_id` |
| 12 | `market_signals` | Observable signals (`requirement_posted`, `hiring`, etc.) | Via `lead_id` |
| 13 | `campaigns` | Calling campaigns & timezone calling windows | `organization_id` |
| 14 | `campaign_leads` | Lead queue states (`QUEUED`, `CONNECTED`, etc.) | Via `campaign_id` |
| 15 | `calls` | Telephony sessions, status, duration, outcomes | `organization_id` |
| 16 | `call_transcripts` | Speaker segments (Agent vs Prospect) & raw text | Via `call_id` |
| 17 | `call_summaries` | Executive takeaways, objections, sentiment, next-action | Via `call_id` |
| 18 | `notifications` | In-app alerts (`high_intent_lead`, `interested_prospect`) | `organization_id` |
| 19 | `subscriptions` | Active tier (`STARTER`, `GROWTH`, `ENTERPRISE`), voice minutes | `organization_id` |
| 20 | `usage_records` | Granular consumption metrics (`voice_minutes`, `api_calls`) | `organization_id` |
| 21 | `crm_connections` | HubSpot / Salesforce OAuth sync credentials | `organization_id` |
| 22 | `audit_logs` | Immutable security audit trail | `organization_id` |
| 23 | `fraud_events` | Anomaly detection alerts (failed logins, rapid exports) | `organization_id` |
| 24 | `system_health_metrics` | Component latency and uptime monitoring | Platform-wide |

---

## 3. Multi-Tenancy & Role-Based Access Control (RBAC)

### Tenant Isolation Rule:
Every business resource contains `organization_id`. The unified middleware guard `authenticateRequest(req, options)` verifies the user's active membership against the target organization and prevents cross-tenant access.

### Role Hierarchy & Permissions Matrix:

| Permission | ADMIN | MANAGER | USER |
| :--- | :---: | :---: | :---: |
| **Organization & Billing Management** (`org:manage`, `billing:manage`) | ✅ | ❌ | ❌ |
| **User & Seat Provisioning** (`users:manage`) | ✅ | ❌ | ❌ |
| **Security, Audit Logs & Fraud** (`audit:view`, `security:manage`) | ✅ | ❌ | ❌ |
| **Business Profile & Product Catalog** (`business:manage`) | ✅ | ✅ | ❌ |
| **Campaigns Lifecycle & Scheduling** (`campaigns:manage`) | ✅ | ✅ | ❌ |
| **Lead Imports & Exports** (`leads:import`, `leads:export`) | ✅ | ✅ | ❌ |
| **View Leads & Assign Actions** (`leads:view`, `leads:update`) | ✅ | ✅ | ✅ |
| **Execute Voice Outreach & Simulation** (`calls:make`, `calls:view`) | ✅ | ✅ | ✅ |
| **Sales Analytics** (`analytics:view`) | ✅ | ✅ | ✅ |

---

## 4. REST API Endpoint Specifications

All endpoints return standardized JSON payloads:

**Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "error": null,
  "timestamp": "2026-09-19T18:00:00.000Z"
}
```

**Error Response:**
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email syntax",
    "details": [{ "field": "email", "message": "Invalid email address" }]
  },
  "timestamp": "2026-09-19T18:00:00.000Z"
}
```

### Complete Endpoint Registry:

#### 1. Authentication
*   `POST /api/v1/auth/register` — Registers organization & admin account, issues JWT & session cookie.
*   `POST /api/v1/auth/login` — Authenticates user credentials, tracks failed attempts for anomaly alerts.
*   `POST /api/v1/auth/logout` — Clears session cookie.
*   `GET /api/v1/auth/me` — Returns session user profile, organization, and permissions.

#### 2. Business Profile & Catalog
*   `GET /api/v1/business/profile` — Retrieves company profile and target ICP criteria.
*   `POST /api/v1/business/profile` — Updates company profile, website, and ICP parameters.
*   `GET /api/v1/business/products` — Lists products and services with AI suitability status.
*   `POST /api/v1/business/products` — Adds new product/service offering with FAQ pairs.
*   `PUT /api/v1/business/products/:id` — Updates product offering details.
*   `DELETE /api/v1/business/products/:id` — Deletes product offering.
*   `GET /api/v1/business/documents` — Lists ingested enterprise PDFs/documents.
*   `POST /api/v1/business/documents` — Uploads and ingests document parsed text.
*   `DELETE /api/v1/business/documents/:id` — Removes ingested document.

#### 3. Lead Management & Opportunity Discovery
*   `GET /api/v1/leads` — Lists leads with pagination (`page`, `limit`), search query (`search`), and filters (`industry`, `companySize`, `sourcePlatform`, `qualificationStatus`, `leadStatus`, `minIntentScore`).
*   `POST /api/v1/leads` — Creates a new lead with mandatory 11 prospect fields.
*   `GET /api/v1/leads/:id` — Retrieves single lead with joined contacts, BANT scores, and market signals.
*   `PUT /api/v1/leads/:id` — Updates lead details.
*   `DELETE /api/v1/leads/:id` — Deletes/archives lead.
*   `PATCH /api/v1/leads/bulk-update` — Bulk updates lead statuses and qualification stages.
*   `POST /api/v1/leads/bulk-assign-campaign` — Bulk assigns selected leads to a voice campaign.
*   `GET /api/v1/opportunities` — Live opportunity discovery feed.
*   `POST /api/v1/opportunities/discover` — Triggers continuous discovery cycle across active source adapters.
*   `GET /api/v1/intelligence/signals/:leadId` — Retrieves observable market signals for a lead.
*   `GET /api/v1/intelligence/radar` — AI Opportunity Radar high-intent leads feed.

#### 4. Import & Export Pipeline (4-Way Deduplication)
*   `POST /api/v1/leads/import/preview` — Ingests CSV/XLSX file, normalizes fields, executes 4-way deduplication check, and returns validation/error preview.
*   `POST /api/v1/leads/import/confirm` — Commits validated leads, increments usage records, and logs audit event.
*   `GET /api/v1/leads/export?format=csv|xlsx` — Streams filtered leads to CSV or Excel with proper headers.

#### 5. Campaigns & Lifecycle State Machine
*   `GET /api/v1/campaigns` — Lists organization campaigns with aggregate statistics.
*   `POST /api/v1/campaigns` — Creates Calling Only or Leads + Calling campaign.
*   `GET /api/v1/campaigns/:id` — Retrieves campaign configuration and lead queue.
*   `PUT /api/v1/campaigns/:id` — Updates campaign schedule/parameters.
*   `PATCH /api/v1/campaigns/:id/status` — State machine transition (`DRAFT` → `SCHEDULED` / `ACTIVE` ↔ `PAUSED` → `COMPLETED` / `CANCELLED`).
*   `GET /api/v1/campaigns/:id/stats` — Aggregate metrics (calls placed, connect rate, conversion rate, duration).

#### 6. Voice & Telephony Outreach
*   `GET /api/v1/voice/calls` — Lists call history logs.
*   `POST /api/v1/voice/calls` — Initiates / records call session.
*   `GET /api/v1/voice/calls/:id` — Retrieves call transcript, speaker segments, AI summary, and next-best actions.
*   `PATCH /api/v1/voice/calls/:id` — Updates call status and attaches transcript/summary.
*   `POST /api/v1/voice/simulate-call` — Telephony outreach simulation endpoint generating transcripts, AI summaries, and meter voice minutes.

#### 7. Analytics, Subscriptions & Metering
*   `GET /api/v1/analytics/overview` — Executive conversion funnel, intent distribution, and source breakdown.
*   `GET /api/v1/usage/summary` — Voice minutes used vs allocated, leads discovered, and API calls.
*   `GET /api/v1/billing/subscription` — Current subscription tier (`STARTER`, `GROWTH`, `ENTERPRISE`) and billing cycle.
*   `POST /api/v1/billing/plan` — Upgrades/downgrades subscription tier.

#### 8. Notifications
*   `GET /api/v1/notifications` — Lists in-app notifications with unread badge count.
*   `PATCH /api/v1/notifications/:id/read` — Marks single notification as read.
*   `POST /api/v1/notifications/read-all` — Marks all notifications as read.

#### 9. Administration & Security
*   `GET /api/v1/admin/dashboard` — Platform-wide metrics (total orgs, users, calls, minutes, open fraud alerts).
*   `GET /api/v1/admin/audit-logs` — Security audit trail queryable by organization and time range.
*   `GET /api/v1/admin/fraud-alerts` — Anomaly detection events feed.
*   `PATCH /api/v1/admin/fraud-alerts/:id/resolve` — Resolves fraud alert status (`OPEN`, `INVESTIGATING`, `RESOLVED`, `DISMISSED`).
*   `GET /api/v1/admin/health` — Component latency and database connection telemetry.

---

## 5. Seed Dataset (Acme Technologies)

The demo dataset pre-populates a realistic enterprise IT Services company (**Acme Technologies**) specializing in:
1. **Microsoft 365 Cloud Migration & Modern Workplace**
2. **SharePoint Online Intranet & Document Governance**
3. **Power Platform Workflow & Business Process Automation**
4. **Custom Enterprise Web & Cloud Application Engineering**

### Pre-Seeded Records:
*   **30+ Discovered Opportunities** across 5 public channels (LinkedIn RFPs, Corporate Websites, Job Platforms, Public Directories, CRM).
*   **100% Data Field Completeness**: Decision maker name, corporate email, direct telephone, LinkedIn URL, company website, job title, industry, headcount, exact original post URL, discovery date, intent score (0-100), and BANT scoring breakdown.
*   **Transparency Tagging**: All seeded records include `is_simulated: true` and data origin tag `[SIMULATED DEMO SOURCE]`.

---

## 6. Execution & Verification Commands

```bash
# 1. Run database seed (initializes in-memory repo & executes PostgreSQL DDL if DATABASE_URL set)
npm run db:seed

# 2. Run backend test suite (validates auth, RBAC, leads, deduplication, campaigns, calls, security)
npm test

# 3. Run type checking
npx tsc --noEmit

# 4. Run linter
npm run lint

# 5. Run build
npm run build
```
