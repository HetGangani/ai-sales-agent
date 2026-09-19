# API Contracts & Endpoint Specification

## 1. API Architecture & Standards

- **Protocol:** RESTful JSON over HTTPS (TLS 1.3)
- **Base Endpoint:** `/api/v1`
- **Response Wrapper:**
```json
{
  "success": true,
  "data": { ... },
  "error": null,
  "timestamp": "2026-09-19T18:14:00Z"
}
```
- **Error Response Wrapper:**
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email syntax",
    "details": [ ... ]
  },
  "timestamp": "2026-09-19T18:14:00Z"
}
```

---

## 2. Core API Endpoint Definitions

### Domain 01 & 02: Auth & Onboarding (`Step 1 & Step 2`)
*   `POST /api/v1/auth/register` — Client registration & free trial provisioning
*   `POST /api/v1/business/profile` — Ingest company website, overview, and product catalog
*   `POST /api/v1/business/documents` — Upload business deck/PDF for AI ingestion

### Domain 03 & 07: Business Intelligence & Opportunity Matching (`Step 3, 6, & 7`)
*   `POST /api/v1/ai/analyze-business` — Trigger AI business understanding & ICP generation
*   `POST /api/v1/products/validate` — Step 6: Validate AI selling suitability & trigger admin fallback if inconclusive
*   `POST /api/v1/discovery/search-params` — Save target industry, keywords, and global search criteria

### Domain 05 & 06: Lead Discovery & Enrichment (`Step 8 & Step 9`)
*   `GET /api/v1/opportunities` — Fetch discovered public requirements (filtered by source, score, status)
*   `POST /api/v1/opportunities/discover` — Run continuous discovery cycle across adapters
*   `POST /api/v1/leads/enrich` — Trigger waterfall enrichment for company/contact details
*   `POST /api/v1/leads/import` — CSV/Excel list upload
*   `GET /api/v1/leads/export` — Export leads to CSV/XLSX

### Domain 08: Market Intelligence & Buying Signal Graph
*   `GET /api/v1/intelligence/signals/:leadId` — Fetch observable signals (`requirement_posted`, `relevant_hiring`, `technology_stack`, `company_activity`, `decision_maker_identified`) with confidence scores
*   `GET /api/v1/intelligence/radar` — Fetch AI Opportunity Radar feed

### Domain 09 & 10: Campaigns & AI Voice Agent (`Step 5, 10, & 11`)
*   `POST /api/v1/campaigns` — Create location/timezone-aware voice campaign
*   `POST /api/v1/voice/simulate-call` — Conduct real-time AI voice call (Outbound/Inbound demo simulation)
*   `GET /api/v1/voice/calls/:callId` — Retrieve speech transcript, AI summary, sentiment, and next-best actions

### Domain 11, 15, & 16: Analytics, Administration & Governance (`Step 12 & Admin`)
*   `GET /api/v1/analytics/overview` — Conversion funnel, ROI, calls placed, minute usage
*   `GET /api/v1/admin/dashboard` — Platform-wide user metrics, voice usage, scrapers status
*   `GET /api/v1/admin/audit-logs` — Security audit trail
*   `GET /api/v1/admin/fraud-alerts` — Anomaly detection events
