/**
 * AI Sales Agent Platform — Domain Entities & Type Definitions
 * 24 Core Database Entities & API Contract Types
 */

// ==========================================
// 1. Core Platform & Tenancy Entities
// ==========================================

export type PlanTier = 'STARTER' | 'GROWTH' | 'ENTERPRISE';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan_tier: PlanTier;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  password_hash?: string | null;
  avatar_url?: string | null;
  is_super_admin: boolean;
  created_at: string;
}

export type MembershipRole = 'ADMIN' | 'MANAGER' | 'USER';

export interface Membership {
  id: string;
  organization_id: string;
  user_id: string;
  role: MembershipRole;
  created_at: string;
}

export interface Role {
  id: MembershipRole;
  description: string;
  permissions: string[];
}

// ==========================================
// 2. Business Profile & Product Catalog Entities
// ==========================================

export interface BusinessProfile {
  id: string;
  organization_id: string;
  website_url: string;
  company_name: string;
  industry?: string | null;
  company_size?: string | null;
  overview?: string | null;
  target_icp?: Record<string, unknown> | null;
  ai_summary?: string | null;
  created_at: string;
}

export type AiSuitabilityStatus = 'APPROVED' | 'PENDING_REVIEW' | 'REJECTED';

export interface ProductService {
  id: string;
  organization_id: string;
  name: string;
  category: string;
  description: string;
  value_proposition?: string | null;
  faq_data: Array<{ question: string; answer: string }>;
  ai_suitability_status: AiSuitabilityStatus;
  suitability_score?: number | null;
  created_at: string;
}

export interface DocumentEntity {
  id: string;
  organization_id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  parsed_text?: string | null;
  embedding?: number[] | null;
  created_at: string;
}

// ==========================================
// 3. Lead Discovery, Scoring & Market Signals
// ==========================================

export type LeadSourcePlatform =
  | 'linkedin'
  | 'x'
  | 'company_website'
  | 'public_directory'
  | 'job_platform'
  | 'freelance_platform'
  | 'crm';

export interface LeadSource {
  id: string;
  organization_id: string;
  platform_id: LeadSourcePlatform;
  name: string;
  is_active: boolean;
  is_simulated: boolean;
  config: Record<string, unknown>;
  last_synced_at?: string | null;
}

export type QualificationStatus =
  | 'UNQUALIFIED'
  | 'REVIEW_PENDING'
  | 'QUALIFIED'
  | 'DISQUALIFIED'
  | 'HANDOFF_REQUIRED';

export type LeadStatus =
  | 'DISCOVERED'
  | 'ENRICHED'
  | 'CONTACTED'
  | 'ENGAGED'
  | 'QUALIFIED'
  | 'CONVERTED'
  | 'ARCHIVED';

export interface Lead {
  id: string;
  organization_id: string;
  source_platform: LeadSourcePlatform;
  original_post_url: string;
  discovery_date: string;
  company_name: string;
  company_website?: string | null;
  industry?: string | null;
  company_size?: string | null;
  location?: string | null;
  requirement: string;
  intent_score: number; // 0 - 100
  qualification_status: QualificationStatus;
  lead_status: LeadStatus;
  ai_reasoning?: string | null;
  is_simulated: boolean;
  created_at: string;
  updated_at?: string;

  // Joined relations (optional)
  contacts?: LeadContact[];
  score?: LeadScore;
  signals?: MarketSignal[];
}

export interface LeadContact {
  id: string;
  lead_id: string;
  name: string;
  business_email?: string | null;
  phone?: string | null;
  job_title?: string | null;
  linkedin_profile?: string | null;
  is_verified: boolean;
  created_at: string;
}

export interface LeadScore {
  id: string;
  lead_id: string;
  bant_budget_score: number;
  bant_authority_score: number;
  bant_need_score: number;
  bant_timeline_score: number;
  overall_intent_score: number;
  scoring_breakdown: {
    budget_rationale?: string;
    authority_rationale?: string;
    need_rationale?: string;
    timeline_rationale?: string;
    factors?: string[];
  };
}

export type MarketSignalType =
  | 'requirement_posted'
  | 'relevant_hiring'
  | 'technology_stack'
  | 'company_activity'
  | 'decision_maker_identified';

export interface MarketSignal {
  id: string;
  lead_id: string;
  signal_type: MarketSignalType;
  title: string;
  description: string;
  source_url?: string | null;
  confidence: number; // 0.0 - 1.0
  created_at: string;
}

// ==========================================
// 4. Campaigns & Calling Entities
// ==========================================

export type CampaignStatus =
  | 'DRAFT'
  | 'SCHEDULED'
  | 'ACTIVE'
  | 'PAUSED'
  | 'COMPLETED'
  | 'CANCELLED';

export type CampaignType = 'CALLING_ONLY' | 'LEADS_AND_CALLING';

export interface CampaignConfig {
  language: string;
  timezone: string;
  calling_window_start: string; // "09:00"
  calling_window_end: string;   // "17:00"
  retry_count: number;
  voicemail_enabled: boolean;
  callback_enabled: boolean;
  frequency: string; // e.g. "immediate", "daily_batch"
}

export interface Campaign {
  id: string;
  organization_id: string;
  name: string;
  type: CampaignType;
  status: CampaignStatus;
  target_timezone: string;
  schedule_cron?: string | null;
  config: CampaignConfig;
  voice_script_id?: string | null;
  created_at: string;
  updated_at?: string;

  // Aggregate stats
  total_leads?: number;
  completed_calls?: number;
  interested_leads?: number;
}

export type CampaignLeadStatus =
  | 'QUEUED'
  | 'IN_PROGRESS'
  | 'CONNECTED'
  | 'VOICEMAIL'
  | 'COMPLETED'
  | 'FAILED'
  | 'RETRY_SCHEDULED';

export interface CampaignLead {
  id: string;
  campaign_id: string;
  lead_id: string;
  status: CampaignLeadStatus;
  scheduled_at?: string | null;
  called_at?: string | null;
}

export type CallDirection = 'OUTBOUND' | 'INBOUND';

export type CallStatus =
  | 'queued'
  | 'dialing'
  | 'ringing'
  | 'connected'
  | 'voicemail'
  | 'retry_scheduled'
  | 'callback_scheduled'
  | 'completed'
  | 'interested'
  | 'not_interested'
  | 'failed';

export type ProspectResponseStatus =
  | 'INTERESTED'
  | 'NOT_INTERESTED'
  | 'CALLBACK_REQUESTED'
  | 'HANDOFF';

export interface Call {
  id: string;
  organization_id: string;
  lead_id: string;
  campaign_id?: string | null;
  provider: string;
  direction: CallDirection;
  status: CallStatus;
  started_at?: string | null;
  ended_at?: string | null;
  duration_seconds: number;
  language: string;
  outcome?: string | null;
  intent?: string | null;
  prospect_response_status?: ProspectResponseStatus | null;
  created_at: string;

  // Joined relations
  transcript?: CallTranscript;
  summary?: CallSummary;
  lead?: Lead;
}

export interface SpeakerSegment {
  speaker: 'Agent' | 'Prospect';
  timestamp: string;
  text: string;
}

export interface CallTranscript {
  id: string;
  call_id: string;
  transcript_text: string;
  speaker_segments: SpeakerSegment[];
  created_at: string;
}

export type Sentiment = 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';

export interface CallSummary {
  id: string;
  call_id: string;
  summary_text: string;
  key_takeaways: string[];
  objections_raised: string[];
  sentiment: Sentiment;
  next_best_action: string;
  created_at: string;
}

// ==========================================
// 5. Notifications, Billing, Usage & CRM
// ==========================================

export type NotificationType =
  | 'lead_discovered'
  | 'high_intent_lead'
  | 'campaign_started'
  | 'campaign_completed'
  | 'interested_prospect'
  | 'callback'
  | 'system_alert';

export interface Notification {
  id: string;
  organization_id: string;
  user_id?: string | null;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export type SubscriptionStatus = 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | 'TRIAL';

export interface Subscription {
  id: string;
  organization_id: string;
  plan_tier: PlanTier;
  status: SubscriptionStatus;
  allocated_voice_minutes: number;
  used_voice_minutes: number;
  current_period_start: string;
  current_period_end: string;
}

export type UsageMetric = 'voice_minutes' | 'leads_discovered' | 'api_calls' | 'contacts_enriched';

export interface UsageRecord {
  id: string;
  organization_id: string;
  metric: UsageMetric;
  quantity: number;
  recorded_at: string;
}

export type CrmProvider = 'hubspot' | 'salesforce' | 'zoho' | 'pipedrive';

export interface CrmConnection {
  id: string;
  organization_id: string;
  provider: CrmProvider;
  is_connected: boolean;
  access_token?: string | null;
  refresh_token?: string | null;
  last_synced_at?: string | null;
}

// ==========================================
// 6. Security, Audit Logs & Fraud Events
// ==========================================

export interface AuditLog {
  id: string;
  organization_id?: string | null;
  user_id?: string | null;
  action: string;
  resource_type: string;
  resource_id?: string | null;
  details: Record<string, unknown>;
  ip_address?: string | null;
  created_at: string;
}

export type FraudSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type FraudStatus = 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'DISMISSED';

export interface FraudEvent {
  id: string;
  organization_id?: string | null;
  severity: FraudSeverity;
  event_type: string;
  description: string;
  status: FraudStatus;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface SystemHealthMetric {
  id: string;
  component: string;
  status: 'HEALTHY' | 'DEGRADED' | 'DOWN';
  latency_ms: number;
  recorded_at: string;
}

// ==========================================
// 7. API Contract & Wrapper Types
// ==========================================

export interface ApiResponse<T = unknown> {
  success: true;
  data: T;
  error: null;
  timestamp: string;
}

export interface ApiErrorDetail {
  field?: string;
  message: string;
  code?: string;
}

export interface ApiErrorResponse {
  success: false;
  data: null;
  error: {
    code: string;
    message: string;
    details?: ApiErrorDetail[];
  };
  timestamp: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
