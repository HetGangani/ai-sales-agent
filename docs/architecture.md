# AI Sales Agent Platform — System Architecture Specification

## 1. Architectural Philosophy & Strategy

The **AI Sales Agent Platform** is designed as a high-performance **Modular Monolith** with clean domain boundaries, strict API contracts, and an extensible adapter architecture.

### Architectural Decision Matrix

| Constraint | Decision | Rationale |
| :--- | :--- | :--- |
| Deployment Complexity | Modular Monolith (Next.js App Router) | Eliminates microservice operational overhead while enforcing boundary isolation via TypeScript domain modules. |
| Data Layer | PostgreSQL + Supabase (pgvector enabled) | Single relational database with RLS policies, combined with vector search for AI semantic matching and embeddings. |
| AI Service Layer | Unified Gemini AI Gateway | Centralized abstraction layer for all LLM calls, structured JSON generation, prompts, and rate limiting. |
| Source Ingestion | Plug-and-Play `LeadSourceAdapter` | Decoupled ingest framework allowing live and simulated source adapters for LinkedIn, X, Web, Directories, Jobs, Freelance, and CRM. |
| Voice Architecture | Hybrid Real-Time WebRTC / SIP Pipeline | Low-latency audio streaming orchestrating Speech-to-Text (STT), Gemini LLM dialogue, and Text-to-Speech (TTS). |

---

## 2. 16 Core Domain Boundaries

The application is strictly partitioned into 16 domain modules located in `@/lib/domains/` or `@/server/domains/`:

```
src/
├── app/                      # Next.js App Router (UI Pages & API Endpoints)
│   ├── (auth)/               # Auth routes
│   ├── (dashboard)/          # Client dashboard routes
│   │   ├── opportunities/    # Step 3, 4, 8: Radar & Opportunity Discovery
│   │   ├── leads/            # Step 9: Lead Management & Enrichment
│   │   ├── intelligence/     # Market Signals & Buying Signal Graph
│   │   ├── campaigns/        # Step 10: Campaign Builder & Scheduler
│   │   ├── voice/            # Step 5, 11: AI Voice Agent & Call Console
│   │   ├── analytics/        # Step 12: Sales Analytics & Performance
│   │   ├── integrations/     # CRM Connectors
│   │   ├── billing/          # Usage & Subscriptions
│   │   └── settings/         # Onboarding & Business Profile
│   ├── (admin)/              # Administrative Console
│   │   ├── overview/         # Admin Dashboard
│   │   ├── users/            # User & Org Management
│   │   ├── subscriptions/    # Plan Overrides
│   │   ├── voice-usage/      # Telephony Minutes & Metrics
│   │   ├── lead-quality/     # Scraping & Validation Health
│   │   ├── campaigns/        # Platform-wide Campaigns
│   │   ├── audit-logs/       # Immutable Security Trails
│   │   ├── fraud-detection/  # Anomaly & Abuse Alerts
│   │   └── health/           # System Health & API Latency
│   └── api/                  # Modular Monolith API Routes
└── lib/
    ├── domains/              # 16 Domain Service Modules
    │   ├── 01-auth/          # Auth & Session verification
    │   ├── 02-organizations/ # Tenancy, Teams & Seats
    │   ├── 03-business-intel/# Company Profile & ICP Context
    │   ├── 04-documents/     # RAG Ingestion (PDF/Docs)
    │   ├── 05-lead-discovery/# Scraping, Feed Ingestion, Filters
    │   ├── 06-lead-enrichment/# Firmographics, Contacts, Tech Stack
    │   ├── 07-qualification/ # BANT & Custom AI Scoring
    │   ├── 08-market-intel/  # Hiring, Funding & Competitor Signals
    │   ├── 09-campaigns/     # Timezone Scheduling & Target Lists
    │   ├── 10-voice/         # Telephony, WebRTC, Transcripts & Audio
    │   ├── 11-analytics/     # Aggregations & Conversion Funnels
    │   ├── 12-crm/           # HubSpot/Salesforce Connectors
    │   ├── 13-billing/       # Metering, Minutes Pool, Stripe
    │   ├── 14-notifications/ # Push, Email & In-App Alerts
    │   ├── 15-administration/# Admin Overrides & Moderation Queue
    │   └── 16-audit-security/# Fraud Detection & Immutable Logs
    ├── ai/                   # Reusable AI Service & Gemini Client
    └── adapters/             # LeadSourceAdapter Implementations
```

---

## 3. Source Adapter Architecture (`LeadSourceAdapter`)

The platform relies on a unified adapter interface to ingest commercial intent posts from multiple public channels.

```typescript
export interface RequirementPost {
  sourcePlatform: 'linkedin' | 'x' | 'company_website' | 'public_directory' | 'job_platform' | 'freelance_platform' | 'crm';
  originalPostUrl: string;
  discoveryDate: string; // ISO 8601
  companyName: string;
  companyWebsite: string;
  contactName: string;
  businessEmail: string;
  phone?: string;
  linkedinProfile?: string;
  jobTitle: string;
  industry: string;
  companySize: string;
  requirement: string;
  intentScore: number; // 0 - 100
  qualificationStatus: 'UNQUALIFIED' | 'REVIEW_PENDING' | 'QUALIFIED' | 'DISQUALIFIED';
  aiReasoning: string;
  isSimulated: boolean; // Transparency rule
  observableSignals: Array<{
    signalType: 'requirement_posted' | 'relevant_hiring' | 'technology_stack' | 'company_activity' | 'decision_maker_identified';
    title: string;
    description: string;
    sourceUrl?: string;
    confidence: number;
  }>;
}

export interface LeadSourceAdapter {
  platformId: string;
  platformName: string;
  fetchRequirements(query: { keywords: string[]; location?: string; industry?: string }): Promise<RequirementPost[]>;
  testConnection(): Promise<{ success: boolean; latencyMs: number }>;
}
```

### Adapter Strategy:
1. **LinkedIn Adapter:** Ingests posted RFPs, vendor requests, and hiring announcements.
2. **X Adapter:** Monitors real-time public tweets with high-intent buying phrases.
3. **Company Websites Adapter:** Ingests target company `/careers`, `/rfp`, and press pages.
4. **Public Directories Adapter:** Monitors Clutch, G2, Crunchbase, and vendor directories.
5. **Job Platforms Adapter:** Monitors active job openings (e.g. searching for "SharePoint Engineer" indicates upcoming migration project).
6. **Freelance Platforms Adapter:** Monitors Upwork/Freelancer project postings.
7. **CRM Adapter:** Imports raw leads directly from HubSpot/Salesforce.

*Transparency Rule:* The UI clearly tags each opportunity with `[LIVE INTEGRATION]` or `[SIMULATED DEMO SOURCE]` so users know data origins.

---

## 4. Single Reusable AI Service Layer (`GeminiService`)

All LLM operations are routed through a single, resilient service layer located in `@/lib/ai/gemini-service.ts`.

```
                        ┌─────────────────────────────────┐
                        │      Application Domains        │
                        └────────────────┬────────────────┘
                                         │
                                         ▼
                        ┌─────────────────────────────────┐
                        │     Unified Gemini AI Service   │
                        │    (@/lib/ai/gemini-service)    │
                        └────────────────┬────────────────┘
                                         │ Structured Zod Schema & JSON Mode
                                         ▼
            ┌────────────────────────────┼────────────────────────────┐
            ▼                            ▼                            ▼
┌──────────────────────┐   ┌──────────────────────────┐   ┌──────────────────────┐
│   BusinessAnalyzer   │   │   RequirementExtractor   │   │  LeadQualifier &     │
│   & ICPGenerator     │   │   & OpportunityMatcher   │   │  BuyingSignalGraph   │
└──────────────────────┘   └──────────────────────────┘   └──────────────────────┘
            │                            │                            │
            ▼                            ▼                            ▼
┌──────────────────────┐   ┌──────────────────────────┐   ┌──────────────────────┐
│MarketIntelAnalyzer   │   │ ConversationEngine & STT │   │  CallSummarizer &    │
│  & TechStackDetect   │   │ (Multilingual Voice SDK) │   │ NextBestActionEngine │
└──────────────────────┘   └──────────────────────────┘   └──────────────────────┘
```

### Core AI Modules:
1. **BusinessAnalyzer:** Analyzes client website/documents to understand value propositions, core offerings, and target market.
2. **ICPGenerator:** Synthesizes Ideal Customer Profiles (ICPs) from business analysis.
3. **RequirementExtractor:** Parses raw un-structured post text into structured intent requirements.
4. **OpportunityMatcher:** Computes semantic similarity between client products and discovered posts.
5. **LeadEnricher:** Infers missing firmographic data and executive profiles.
6. **LeadQualifier:** Evaluates BANT criteria and computes intent score (0-100).
7. **MarketIntelligenceAnalyzer:** Correlates hiring, funding, tech stack, and competitor activity.
8. **CallConversationEngine:** Conducts real-time natural sales dialogue for inbound/outbound calls.
9. **CallSummarizer:** Generates executive bulleted summaries, sentiment analysis, and key objection logs.
10. **NextBestActionEngine:** Recommends immediate follow-up actions (e.g., "Schedule Warm Transfer", "Send SharePoint Migration Deck").

---

## 5. Architectural Safeguards & Compliance

1. **Multilingual Architecture:** Frontend utilizes `next-intl` or dynamic dictionary translation; Voice Agent utilizes Gemini multilingual speech capabilities.
2. **Data Transparency:** `originalPostUrl` and `sourcePlatform` are mandatory on every opportunity record.
3. **Human Handoff Boundary:** Voice agents automatically transition lead status to `HANDOFF_REQUIRED` upon positive prospect engagement, halting automated AI calling.
4. **Product Suitability Fallback:** Automated risk scoring assigns `PENDING_ADMIN_REVIEW` to unverified products, enforcing manual admin clearance in Step 6.
