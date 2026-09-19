# Implementation Plan: AI Sales Agent Platform MVP

Build a production-structured, demo-ready MVP for the **AI Sales Agent Platform** following a modular monolith architecture with 16 domain boundaries, a unified Gemini AI service layer, `LeadSourceAdapter` pattern, realistic seeded demo dataset for an IT services company (Microsoft 365, SharePoint, Power Platform, Custom Apps), and complete support for the PDF's 12-step user journey.

## User Review Required

> [!IMPORTANT]
> **Source Transparency & Demo Mode**: As mandated by the specification, all seeded demo opportunities will be clearly labeled as `[SIMULATED DEMO SOURCE]` in the UI alongside live adapter slots. No live external API keys (e.g. LinkedIn API, Twilio SIP) will be required to run the full interactive 12-step demo flow.

> [!NOTE]
> **Product Suitability Fallback (Step 6)**: The MVP will include an interactive admin approval workflow for products flagged by the AI as requiring manual validation before calling campaigns can launch.

## Proposed Changes

### Project Foundation & Infrastructure Setup

#### [NEW] [`package.json`](file:///f:/CHARUSAT/SEM-5/ai-sales-agent/package.json)
Initialize Next.js App Router project with TypeScript, TailwindCSS, shadcn/ui components, Lucide icons, Recharts, Zod, and `@google/genai` (or `@google/generative-ai`) SDK.

#### [NEW] [`tsconfig.json`](file:///f:/CHARUSAT/SEM-5/ai-sales-agent/tsconfig.json)
Configure path aliases (`@/*` pointing to `./src/*`).

#### [NEW] [`tailwind.config.ts`](file:///f:/CHARUSAT/SEM-5/ai-sales-agent/tailwind.config.ts)
Dark navy professional theme with curated color tokens, glassmorphism utilities, and sleek intent indicator styling.

---

### Core Domain Architecture & Data Layer

#### [NEW] [`src/lib/types/domain.ts`](file:///f:/CHARUSAT/SEM-5/ai-sales-agent/src/lib/types/domain.ts)
TypeScript type definitions for all 24 schema entities (`Lead`, `RequirementPost`, `MarketSignal`, `Call`, `CallTranscript`, `CallSummary`, `Campaign`, `Organization`, `User`, `AuditLog`, etc.).

#### [NEW] [`src/lib/db/schema.ts`](file:///f:/CHARUSAT/SEM-5/ai-sales-agent/src/lib/db/schema.ts)
Drizzle / Prisma / Supabase SQL schema definitions and TypeScript interfaces for the 24 database entities.

#### [NEW] [`src/lib/db/seed-data.ts`](file:///f:/CHARUSAT/SEM-5/ai-sales-agent/src/lib/db/seed-data.ts)
Rich seeded dataset for an IT Services company ("Futurrizon Cloud Solutions") offering:
- Microsoft 365 migrations
- SharePoint Online custom development
- Power Platform automation
- Custom business application engineering

Includes realistic posts across LinkedIn, X, Company Websites, Job Platforms, Directories, and Freelance sites.

---

### Source Adapter Architecture

#### [NEW] [`src/lib/adapters/lead-source-adapter.ts`](file:///f:/CHARUSAT/SEM-5/ai-sales-agent/src/lib/adapters/lead-source-adapter.ts)
Abstract interface and factory registry for `LeadSourceAdapter`.

#### [NEW] [`src/lib/adapters/linkedin-adapter.ts`](file:///f:/CHARUSAT/SEM-5/ai-sales-agent/src/lib/adapters/linkedin-adapter.ts)
#### [NEW] [`src/lib/adapters/x-adapter.ts`](file:///f:/CHARUSAT/SEM-5/ai-sales-agent/src/lib/adapters/x-adapter.ts)
#### [NEW] [`src/lib/adapters/website-adapter.ts`](file:///f:/CHARUSAT/SEM-5/ai-sales-agent/src/lib/adapters/website-adapter.ts)
#### [NEW] [`src/lib/adapters/directory-adapter.ts`](file:///f:/CHARUSAT/SEM-5/ai-sales-agent/src/lib/adapters/directory-adapter.ts)
#### [NEW] [`src/lib/adapters/job-platform-adapter.ts`](file:///f:/CHARUSAT/SEM-5/ai-sales-agent/src/lib/adapters/job-platform-adapter.ts)
#### [NEW] [`src/lib/adapters/freelance-adapter.ts`](file:///f:/CHARUSAT/SEM-5/ai-sales-agent/src/lib/adapters/freelance-adapter.ts)
#### [NEW] [`src/lib/adapters/crm-adapter.ts`](file:///f:/CHARUSAT/SEM-5/ai-sales-agent/src/lib/adapters/crm-adapter.ts)

---

### Unified AI Service Layer (`GeminiService`)

#### [NEW] [`src/lib/ai/gemini-service.ts`](file:///f:/CHARUSAT/SEM-5/ai-sales-agent/src/lib/ai/gemini-service.ts)
Single reusable AI service exposing structured Zod JSON parsing methods for:
- `BusinessAnalyzer` (Step 2 & 3)
- `ICPGenerator` (Step 3 & 7)
- `RequirementExtractor` (Step 8)
- `OpportunityMatcher` (Step 3 & 8)
- `LeadEnricher` (Step 8)
- `LeadQualifier` & `BuyingSignalGraph` (Step 8)
- `MarketIntelligenceAnalyzer` (Market Signals)
- `CallConversationEngine` (Step 11 Outbound/Inbound voice dialogue)
- `CallSummarizer` (Step 11 Transcript & Sentiment)
- `NextBestActionEngine` (Step 11 & 12 Handoff & Recommendations)

---

### UI Shell & Navigation (Client & Admin Consoles)

#### [NEW] [`src/components/layout/sidebar.tsx`](file:///f:/CHARUSAT/SEM-5/ai-sales-agent/src/components/layout/sidebar.tsx)
Main Navigation (Dashboard, Opportunities, Leads, Market Intelligence, Campaigns, Voice Agent, Analytics, Integrations, Billing, Settings) & Admin Navigation (Admin Overview, Users, Subscriptions, Voice Usage, Lead Quality, Campaigns, Audit Logs, Fraud Detection, System Health).

#### [NEW] [`src/components/layout/header.tsx`](file:///f:/CHARUSAT/SEM-5/ai-sales-agent/src/components/layout/header.tsx)
Header with organization switcher, trial banner, notifications bell, and user profile avatar.

---

### Feature Pages & Visual Components

#### [NEW] [`src/app/(dashboard)/dashboard/page.tsx`](file:///f:/CHARUSAT/SEM-5/ai-sales-agent/src/app/(dashboard)/dashboard/page.tsx)
Unified Executive Dashboard featuring:
- Key metric cards (Discovered Opportunities, Qualified Leads, Voice Minutes Used, Conversion Rate)
- **AI Opportunity Radar** widget
- Live Feed of recent public requirement discoveries with source transparency badges
- Campaign performance charts (Recharts)

#### [NEW] [`src/app/(dashboard)/opportunities/page.tsx`](file:///f:/CHARUSAT/SEM-5/ai-sales-agent/src/app/(dashboard)/opportunities/page.tsx)
Interactive Opportunity Discovery Console with search, multi-attribute filtering, intent score badges, source URLs, and modal detail views.

#### [NEW] [`src/app/(dashboard)/leads/page.tsx`](file:///f:/CHARUSAT/SEM-5/ai-sales-agent/src/app/(dashboard)/leads/page.tsx)
Lead Management table with CSV/Excel import/export, data validation indicators, de-duplication tags, and enrichment action triggers.

#### [NEW] [`src/app/(dashboard)/intelligence/page.tsx`](file:///f:/CHARUSAT/SEM-5/ai-sales-agent/src/app/(dashboard)/intelligence/page.tsx)
Market Intelligence hub featuring the **AI Buying Signal Graph** explaining WHY an opportunity is high-intent through observable signals (`requirement_posted`, `relevant_hiring`, `technology_stack`, `company_activity`, `decision_maker_identified`).

#### [NEW] [`src/app/(dashboard)/campaigns/page.tsx`](file:///f:/CHARUSAT/SEM-5/ai-sales-agent/src/app/(dashboard)/campaigns/page.tsx)
Timezone-aware voice campaign builder and scheduler (Steps 10 & 12).

#### [NEW] [`src/app/(dashboard)/voice/page.tsx`](file:///f:/CHARUSAT/SEM-5/ai-sales-agent/src/app/(dashboard)/voice/page.tsx)
Interactive AI Voice Console demonstrating real-time interactive multilingual calling, live speech simulation, transcript generation, AI summaries, and Next-Best Action handoffs (Step 11).

#### [NEW] [`src/app/(dashboard)/analytics/page.tsx`](file:///f:/CHARUSAT/SEM-5/ai-sales-agent/src/app/(dashboard)/analytics/page.tsx)
Sales Analytics & conversion funnel metrics powered by Recharts.

#### [NEW] [`src/app/(dashboard)/settings/page.tsx`](file:///f:/CHARUSAT/SEM-5/ai-sales-agent/src/app/(dashboard)/settings/page.tsx)
Steps 1, 2, 5, 6 Onboarding setup (Company website, business documents ingestion, BYO vs Built-in telephony selection, and AI selling suitability status).

#### [NEW] [`src/app/(admin)/admin/overview/page.tsx`](file:///f:/CHARUSAT/SEM-5/ai-sales-agent/src/app/(admin)/admin/overview/page.tsx)
Administrative dashboard managing user provisioning, voice usage tracking, lead quality monitoring, audit logs, and fraud detection alerts.

---

## Verification Plan

### Automated Tests & Code Validation
- Next.js build verification (`npm run build`)
- TypeScript type-checking (`npx tsc --noEmit`)
- API Route JSON payload contract validation

### Manual Verification
- Walkthrough of the entire 12-step customer journey in the web UI.
- Testing AI Opportunity Radar and AI Buying Signal Graph.
- Testing real-time AI Voice simulator with live text-to-speech dialogue and transcript generation.
- Verifying source transparency tags (`[SIMULATED DEMO SOURCE]` vs live link).
