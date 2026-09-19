import {
  Organization,
  User,
  Membership,
  BusinessProfile,
  ProductService,
  DocumentEntity,
  LeadSource,
  Lead,
  LeadContact,
  LeadScore,
  MarketSignal,
  Campaign,
  CampaignLead,
  Call,
  CallTranscript,
  CallSummary,
  Notification,
  Subscription,
  UsageRecord,
  CrmConnection,
  AuditLog,
  FraudEvent,
  SystemHealthMetric,
} from '@/lib/types/domain';

import {
  seedOrganization,
  seedUsers,
  seedMemberships,
  seedBusinessProfile,
  seedProductsServices,
  seedLeadSources,
  seedLeads,
  seedContacts,
  seedScores,
  seedSignals,
  seedCampaigns,
  seedCampaignLeads,
  seedCalls,
  seedCallTranscripts,
  seedCallSummaries,
  seedSubscription,
  seedUsageRecords,
  seedNotifications,
  seedAuditLogs,
  seedFraudEvents,
} from './seed-data';

/**
 * In-Memory Multi-Tenant Store & Repository Layer
 */
class DatabaseRepository {
  public organizations: Map<string, Organization> = new Map();
  public users: Map<string, User> = new Map();
  public memberships: Map<string, Membership> = new Map();
  public businessProfiles: Map<string, BusinessProfile> = new Map();
  public productsServices: Map<string, ProductService> = new Map();
  public documents: Map<string, DocumentEntity> = new Map();
  public leadSources: Map<string, LeadSource> = new Map();
  public leads: Map<string, Lead> = new Map();
  public leadContacts: Map<string, LeadContact> = new Map();
  public leadScores: Map<string, LeadScore> = new Map();
  public marketSignals: Map<string, MarketSignal> = new Map();
  public campaigns: Map<string, Campaign> = new Map();
  public campaignLeads: Map<string, CampaignLead> = new Map();
  public calls: Map<string, Call> = new Map();
  public callTranscripts: Map<string, CallTranscript> = new Map();
  public callSummaries: Map<string, CallSummary> = new Map();
  public notifications: Map<string, Notification> = new Map();
  public subscriptions: Map<string, Subscription> = new Map();
  public usageRecords: Map<string, UsageRecord> = new Map();
  public crmConnections: Map<string, CrmConnection> = new Map();
  public auditLogsMap: Map<string, AuditLog> = new Map();
  public fraudEventsMap: Map<string, FraudEvent> = new Map();
  public systemHealthMetricsMap: Map<string, SystemHealthMetric> = new Map();

  private isInitialized = false;

  constructor() {
    this.init();
  }

  public init() {
    if (this.isInitialized) return;

    // Seed Organization
    this.organizations.set(seedOrganization.id, { ...seedOrganization });

    // Seed Users
    seedUsers.forEach((u) => this.users.set(u.id, { ...u }));

    // Seed Memberships
    seedMemberships.forEach((m) => this.memberships.set(m.id, { ...m }));

    // Seed Business Profile
    this.businessProfiles.set(seedBusinessProfile.id, { ...seedBusinessProfile });

    // Seed Products & Services
    seedProductsServices.forEach((p) => this.productsServices.set(p.id, { ...p }));

    // Seed Lead Sources
    seedLeadSources.forEach((ls) => this.leadSources.set(ls.id, { ...ls }));

    // Seed Leads
    seedLeads.forEach((l) => this.leads.set(l.id, { ...l }));

    // Seed Contacts
    seedContacts.forEach((c) => this.leadContacts.set(c.id, { ...c }));

    // Seed Scores
    seedScores.forEach((s) => this.leadScores.set(s.id, { ...s }));

    // Seed Signals
    seedSignals.forEach((sig) => this.marketSignals.set(sig.id, { ...sig }));

    // Seed Campaigns
    seedCampaigns.forEach((camp) => this.campaigns.set(camp.id, { ...camp }));

    // Seed Campaign Leads
    seedCampaignLeads.forEach((cl) => this.campaignLeads.set(cl.id, { ...cl }));

    // Seed Calls
    seedCalls.forEach((call) => this.calls.set(call.id, { ...call }));

    // Seed Call Transcripts
    seedCallTranscripts.forEach((t) => this.callTranscripts.set(t.id, { ...t }));

    // Seed Call Summaries
    seedCallSummaries.forEach((s) => this.callSummaries.set(s.id, { ...s }));

    // Seed Subscriptions
    this.subscriptions.set(seedSubscription.id, { ...seedSubscription });

    // Seed Usage Records
    seedUsageRecords.forEach((ur) => this.usageRecords.set(ur.id, { ...ur }));

    // Seed Notifications
    seedNotifications.forEach((n) => this.notifications.set(n.id, { ...n }));

    // Seed Audit Logs
    seedAuditLogs.forEach((al) => this.auditLogsMap.set(al.id, { ...al }));

    // Seed Fraud Events
    seedFraudEvents.forEach((fe) => this.fraudEventsMap.set(fe.id, { ...fe }));

    // Seed Initial System Health
    const initialHealth: SystemHealthMetric[] = [
      { id: crypto.randomUUID(), component: 'scraper_cluster', status: 'HEALTHY', latency_ms: 45, recorded_at: new Date().toISOString() },
      { id: crypto.randomUUID(), component: 'gemini_api', status: 'HEALTHY', latency_ms: 120, recorded_at: new Date().toISOString() },
      { id: crypto.randomUUID(), component: 'telephony_gateway', status: 'HEALTHY', latency_ms: 35, recorded_at: new Date().toISOString() },
      { id: crypto.randomUUID(), component: 'database', status: 'HEALTHY', latency_ms: 12, recorded_at: new Date().toISOString() },
    ];
    initialHealth.forEach((h) => this.systemHealthMetricsMap.set(h.id, h));

    this.isInitialized = true;
  }

  // ==========================================
  // Domain Data Repositories
  // ==========================================

  public orgRepo = {
    findById: async (id: string): Promise<Organization | null> => {
      return this.organizations.get(id) || null;
    },
    findBySlug: async (slug: string): Promise<Organization | null> => {
      for (const org of this.organizations.values()) {
        if (org.slug === slug) return org;
      }
      return null;
    },
    create: async (org: Organization): Promise<Organization> => {
      this.organizations.set(org.id, org);
      return org;
    },
    update: async (id: string, update: Partial<Organization>): Promise<Organization | null> => {
      const existing = this.organizations.get(id);
      if (!existing) return null;
      const updated = { ...existing, ...update, updated_at: new Date().toISOString() };
      this.organizations.set(id, updated);
      return updated;
    },
  };

  public userRepo = {
    findById: async (id: string): Promise<User | null> => {
      return this.users.get(id) || null;
    },
    findByEmail: async (email: string): Promise<User | null> => {
      const normalized = email.toLowerCase().trim();
      for (const user of this.users.values()) {
        if (user.email.toLowerCase() === normalized) return user;
      }
      return null;
    },
    create: async (user: User): Promise<User> => {
      this.users.set(user.id, user);
      return user;
    },
    update: async (id: string, update: Partial<User>): Promise<User | null> => {
      const existing = this.users.get(id);
      if (!existing) return null;
      const updated = { ...existing, ...update };
      this.users.set(id, updated);
      return updated;
    },
    list: async (): Promise<User[]> => {
      return Array.from(this.users.values());
    },
  };

  public membershipRepo = {
    findByOrgAndUser: async (orgId: string, userId: string): Promise<Membership | null> => {
      for (const m of this.memberships.values()) {
        if (m.organization_id === orgId && m.user_id === userId) return m;
      }
      return null;
    },
    findByUser: async (userId: string): Promise<Membership[]> => {
      return Array.from(this.memberships.values()).filter((m) => m.user_id === userId);
    },
    findByOrg: async (orgId: string): Promise<Membership[]> => {
      return Array.from(this.memberships.values()).filter((m) => m.organization_id === orgId);
    },
    create: async (membership: Membership): Promise<Membership> => {
      this.memberships.set(membership.id, membership);
      return membership;
    },
    updateRole: async (id: string, role: Membership['role']): Promise<Membership | null> => {
      const existing = this.memberships.get(id);
      if (!existing) return null;
      existing.role = role;
      return existing;
    },
  };

  public businessProfileRepo = {
    findByOrg: async (orgId: string): Promise<BusinessProfile | null> => {
      for (const p of this.businessProfiles.values()) {
        if (p.organization_id === orgId) return p;
      }
      return null;
    },
    createOrUpdate: async (profile: BusinessProfile): Promise<BusinessProfile> => {
      const existing = await this.businessProfileRepo.findByOrg(profile.organization_id);
      if (existing) {
        const updated = { ...existing, ...profile };
        this.businessProfiles.set(existing.id, updated);
        return updated;
      }
      this.businessProfiles.set(profile.id, profile);
      return profile;
    },
  };

  public productServiceRepo = {
    findByOrg: async (orgId: string): Promise<ProductService[]> => {
      return Array.from(this.productsServices.values()).filter((p) => p.organization_id === orgId);
    },
    findById: async (id: string): Promise<ProductService | null> => {
      return this.productsServices.get(id) || null;
    },
    create: async (product: ProductService): Promise<ProductService> => {
      this.productsServices.set(product.id, product);
      return product;
    },
    update: async (id: string, update: Partial<ProductService>): Promise<ProductService | null> => {
      const existing = this.productsServices.get(id);
      if (!existing) return null;
      const updated = { ...existing, ...update };
      this.productsServices.set(id, updated);
      return updated;
    },
    delete: async (id: string): Promise<boolean> => {
      return this.productsServices.delete(id);
    },
  };

  public documentRepo = {
    findByOrg: async (orgId: string): Promise<DocumentEntity[]> => {
      return Array.from(this.documents.values()).filter((d) => d.organization_id === orgId);
    },
    findById: async (id: string): Promise<DocumentEntity | null> => {
      return this.documents.get(id) || null;
    },
    create: async (doc: DocumentEntity): Promise<DocumentEntity> => {
      this.documents.set(doc.id, doc);
      return doc;
    },
    delete: async (id: string): Promise<boolean> => {
      return this.documents.delete(id);
    },
  };

  public leadSourceRepo = {
    findByOrg: async (orgId: string): Promise<LeadSource[]> => {
      return Array.from(this.leadSources.values()).filter((ls) => ls.organization_id === orgId);
    },
    create: async (source: LeadSource): Promise<LeadSource> => {
      this.leadSources.set(source.id, source);
      return source;
    },
    update: async (id: string, update: Partial<LeadSource>): Promise<LeadSource | null> => {
      const existing = this.leadSources.get(id);
      if (!existing) return null;
      const updated = { ...existing, ...update };
      this.leadSources.set(id, updated);
      return updated;
    },
  };

  public leadRepo = {
    findById: async (id: string, orgId: string): Promise<Lead | null> => {
      const lead = this.leads.get(id);
      if (!lead || lead.organization_id !== orgId) return null;

      // Join contacts, scores, signals
      const contacts = Array.from(this.leadContacts.values()).filter((c) => c.lead_id === id);
      const score = Array.from(this.leadScores.values()).find((s) => s.lead_id === id);
      const signals = Array.from(this.marketSignals.values()).filter((s) => s.lead_id === id);

      return {
        ...lead,
        contacts,
        score,
        signals,
      };
    },
    query: async (
      orgId: string,
      filter: {
        search?: string;
        industry?: string;
        companySize?: string;
        location?: string;
        sourcePlatform?: string;
        qualificationStatus?: string;
        leadStatus?: string;
        minIntentScore?: number;
        maxIntentScore?: number;
        isSimulated?: boolean;
        page?: number;
        limit?: number;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
      }
    ): Promise<{ items: Lead[]; total: number }> => {
      let allLeads = Array.from(this.leads.values()).filter((l) => l.organization_id === orgId);

      // Full-text search
      if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        allLeads = allLeads.filter((l) => {
          const inCompany = l.company_name.toLowerCase().includes(searchLower);
          const inReq = l.requirement.toLowerCase().includes(searchLower);
          const inInd = (l.industry || '').toLowerCase().includes(searchLower);
          const inLoc = (l.location || '').toLowerCase().includes(searchLower);
          return inCompany || inReq || inInd || inLoc;
        });
      }

      // Attribute filters
      if (filter.industry) {
        allLeads = allLeads.filter((l) => (l.industry || '').toLowerCase() === filter.industry!.toLowerCase());
      }
      if (filter.companySize) {
        allLeads = allLeads.filter((l) => (l.company_size || '') === filter.companySize);
      }
      if (filter.location) {
        allLeads = allLeads.filter((l) => (l.location || '').toLowerCase().includes(filter.location!.toLowerCase()));
      }
      if (filter.sourcePlatform) {
        allLeads = allLeads.filter((l) => l.source_platform === filter.sourcePlatform);
      }
      if (filter.qualificationStatus) {
        allLeads = allLeads.filter((l) => l.qualification_status === filter.qualificationStatus);
      }
      if (filter.leadStatus) {
        allLeads = allLeads.filter((l) => l.lead_status === filter.leadStatus);
      }
      if (filter.minIntentScore !== undefined) {
        allLeads = allLeads.filter((l) => l.intent_score >= filter.minIntentScore!);
      }
      if (filter.maxIntentScore !== undefined) {
        allLeads = allLeads.filter((l) => l.intent_score <= filter.maxIntentScore!);
      }
      if (filter.isSimulated !== undefined) {
        allLeads = allLeads.filter((l) => l.is_simulated === filter.isSimulated);
      }

      // Sorting
      const sortBy = (filter.sortBy || 'created_at') as keyof Lead;
      const order = filter.sortOrder === 'asc' ? 1 : -1;
      allLeads.sort((a, b) => {
        const valA = a[sortBy] ?? '';
        const valB = b[sortBy] ?? '';
        if (valA < valB) return -1 * order;
        if (valA > valB) return 1 * order;
        return 0;
      });

      const total = allLeads.length;
      const page = filter.page || 1;
      const limit = filter.limit || 20;
      const startIndex = (page - 1) * limit;
      const paginatedLeads = allLeads.slice(startIndex, startIndex + limit);

      // Attach contacts, score, and signals
      const items = paginatedLeads.map((lead) => {
        const contacts = Array.from(this.leadContacts.values()).filter((c) => c.lead_id === lead.id);
        const score = Array.from(this.leadScores.values()).find((s) => s.lead_id === lead.id);
        const signals = Array.from(this.marketSignals.values()).filter((s) => s.lead_id === lead.id);
        return {
          ...lead,
          contacts,
          score,
          signals,
        };
      });

      return { items, total };
    },
    create: async (lead: Lead): Promise<Lead> => {
      this.leads.set(lead.id, lead);
      return lead;
    },
    update: async (id: string, orgId: string, update: Partial<Lead>): Promise<Lead | null> => {
      const existing = this.leads.get(id);
      if (!existing || existing.organization_id !== orgId) return null;
      const updated = { ...existing, ...update, updated_at: new Date().toISOString() };
      this.leads.set(id, updated);
      return updated;
    },
    delete: async (id: string, orgId: string): Promise<boolean> => {
      const existing = this.leads.get(id);
      if (!existing || existing.organization_id !== orgId) return false;
      this.leads.delete(id);
      return true;
    },
  };

  public contactRepo = {
    create: async (contact: LeadContact): Promise<LeadContact> => {
      this.leadContacts.set(contact.id, contact);
      return contact;
    },
    findByLead: async (leadId: string): Promise<LeadContact[]> => {
      return Array.from(this.leadContacts.values()).filter((c) => c.lead_id === leadId);
    },
    listAllForOrg: async (orgId: string): Promise<LeadContact[]> => {
      const orgLeadIds = new Set(
        Array.from(this.leads.values())
          .filter((l) => l.organization_id === orgId)
          .map((l) => l.id)
      );
      return Array.from(this.leadContacts.values()).filter((c) => orgLeadIds.has(c.lead_id));
    },
  };

  public scoreRepo = {
    createOrUpdate: async (score: LeadScore): Promise<LeadScore> => {
      this.leadScores.set(score.id, score);
      return score;
    },
    findByLead: async (leadId: string): Promise<LeadScore | null> => {
      for (const s of this.leadScores.values()) {
        if (s.lead_id === leadId) return s;
      }
      return null;
    },
  };

  public signalRepo = {
    create: async (signal: MarketSignal): Promise<MarketSignal> => {
      this.marketSignals.set(signal.id, signal);
      return signal;
    },
    findByLead: async (leadId: string): Promise<MarketSignal[]> => {
      return Array.from(this.marketSignals.values()).filter((s) => s.lead_id === leadId);
    },
  };

  public campaignRepo = {
    findByOrg: async (orgId: string): Promise<Campaign[]> => {
      const list = Array.from(this.campaigns.values()).filter((c) => c.organization_id === orgId);
      return list.map((camp) => {
        const campaignLeads = Array.from(this.campaignLeads.values()).filter((cl) => cl.campaign_id === camp.id);
        const calls = Array.from(this.calls.values()).filter((c) => c.campaign_id === camp.id);
        const completedCalls = calls.filter((c) => c.status === 'completed').length;
        const interestedLeads = calls.filter((c) => c.prospect_response_status === 'INTERESTED').length;

        return {
          ...camp,
          total_leads: campaignLeads.length,
          completed_calls: completedCalls,
          interested_leads: interestedLeads,
        };
      });
    },
    findById: async (id: string, orgId: string): Promise<Campaign | null> => {
      const camp = this.campaigns.get(id);
      if (!camp || camp.organization_id !== orgId) return null;

      const campaignLeads = Array.from(this.campaignLeads.values()).filter((cl) => cl.campaign_id === camp.id);
      const calls = Array.from(this.calls.values()).filter((c) => c.campaign_id === camp.id);
      const completedCalls = calls.filter((c) => c.status === 'completed').length;
      const interestedLeads = calls.filter((c) => c.prospect_response_status === 'INTERESTED').length;

      return {
        ...camp,
        total_leads: campaignLeads.length,
        completed_calls: completedCalls,
        interested_leads: interestedLeads,
      };
    },
    create: async (campaign: Campaign): Promise<Campaign> => {
      this.campaigns.set(campaign.id, campaign);
      return campaign;
    },
    update: async (id: string, orgId: string, update: Partial<Campaign>): Promise<Campaign | null> => {
      const existing = this.campaigns.get(id);
      if (!existing || existing.organization_id !== orgId) return null;
      const updated = { ...existing, ...update, updated_at: new Date().toISOString() };
      this.campaigns.set(id, updated);
      return updated;
    },
    addLeads: async (campaignId: string, leadIds: string[]): Promise<void> => {
      leadIds.forEach((leadId) => {
        const clId = crypto.randomUUID();
        this.campaignLeads.set(clId, {
          id: clId,
          campaign_id: campaignId,
          lead_id: leadId,
          status: 'QUEUED',
        });
      });
    },
    getLeads: async (campaignId: string): Promise<CampaignLead[]> => {
      return Array.from(this.campaignLeads.values()).filter((cl) => cl.campaign_id === campaignId);
    },
  };

  public callRepo = {
    findByOrg: async (orgId: string): Promise<Call[]> => {
      const calls = Array.from(this.calls.values())
        .filter((c) => c.organization_id === orgId)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      return calls.map((c) => {
        const transcript = Array.from(this.callTranscripts.values()).find((t) => t.call_id === c.id);
        const summary = Array.from(this.callSummaries.values()).find((s) => s.call_id === c.id);
        const lead = this.leads.get(c.lead_id);
        return {
          ...c,
          transcript,
          summary,
          lead,
        };
      });
    },
    findById: async (id: string, orgId: string): Promise<Call | null> => {
      const call = this.calls.get(id);
      if (!call || call.organization_id !== orgId) return null;

      const transcript = Array.from(this.callTranscripts.values()).find((t) => t.call_id === id);
      const summary = Array.from(this.callSummaries.values()).find((s) => s.call_id === id);
      const lead = this.leads.get(call.lead_id);

      return {
        ...call,
        transcript,
        summary,
        lead,
      };
    },
    create: async (call: Call): Promise<Call> => {
      this.calls.set(call.id, call);
      return call;
    },
    update: async (id: string, orgId: string, update: Partial<Call>): Promise<Call | null> => {
      const existing = this.calls.get(id);
      if (!existing || existing.organization_id !== orgId) return null;
      const updated = { ...existing, ...update };
      this.calls.set(id, updated);
      return updated;
    },
    createTranscript: async (transcript: CallTranscript): Promise<CallTranscript> => {
      this.callTranscripts.set(transcript.id, transcript);
      return transcript;
    },
    createSummary: async (summary: CallSummary): Promise<CallSummary> => {
      this.callSummaries.set(summary.id, summary);
      return summary;
    },
  };

  public notificationRepo = {
    findByOrgAndUser: async (orgId: string, userId?: string | null): Promise<Notification[]> => {
      return Array.from(this.notifications.values())
        .filter((n) => n.organization_id === orgId && (!n.user_id || n.user_id === userId))
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    },
    create: async (notif: Notification): Promise<Notification> => {
      this.notifications.set(notif.id, notif);
      return notif;
    },
    markAsRead: async (id: string, orgId: string): Promise<boolean> => {
      const notif = this.notifications.get(id);
      if (!notif || notif.organization_id !== orgId) return false;
      notif.is_read = true;
      return true;
    },
    markAllAsRead: async (orgId: string, userId?: string | null): Promise<void> => {
      for (const n of this.notifications.values()) {
        if (n.organization_id === orgId && (!n.user_id || n.user_id === userId)) {
          n.is_read = true;
        }
      }
    },
  };

  public subscriptionRepo = {
    findByOrg: async (orgId: string): Promise<Subscription | null> => {
      for (const s of this.subscriptions.values()) {
        if (s.organization_id === orgId) return s;
      }
      return null;
    },
    createOrUpdate: async (sub: Subscription): Promise<Subscription> => {
      this.subscriptions.set(sub.id, sub);
      return sub;
    },
    updateMinutes: async (orgId: string, additionalMinutes: number): Promise<Subscription | null> => {
      const sub = await this.subscriptionRepo.findByOrg(orgId);
      if (!sub) return null;
      sub.used_voice_minutes += additionalMinutes;
      return sub;
    },
  };

  public usageRepo = {
    record: async (record: UsageRecord): Promise<UsageRecord> => {
      this.usageRecords.set(record.id, record);
      return record;
    },
    getSummary: async (orgId: string): Promise<{ voice_minutes: number; leads_discovered: number; api_calls: number }> => {
      const records = Array.from(this.usageRecords.values()).filter((u) => u.organization_id === orgId);
      const summary = {
        voice_minutes: 0,
        leads_discovered: 0,
        api_calls: 0,
      };

      records.forEach((r) => {
        if (r.metric === 'voice_minutes') summary.voice_minutes += r.quantity;
        if (r.metric === 'leads_discovered') summary.leads_discovered += r.quantity;
        if (r.metric === 'api_calls') summary.api_calls += r.quantity;
      });

      return summary;
    },
  };

  public auditLogs = {
    create: async (log: AuditLog): Promise<AuditLog> => {
      this.auditLogsMap.set(log.id, log);
      return log;
    },
    query: async (orgId?: string | null, limit: number = 50): Promise<AuditLog[]> => {
      let logs = Array.from(this.auditLogsMap.values());
      if (orgId) {
        logs = logs.filter((l) => l.organization_id === orgId);
      }
      logs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      return logs.slice(0, limit);
    },
  };

  public fraudEvents = {
    create: async (event: FraudEvent): Promise<FraudEvent> => {
      this.fraudEventsMap.set(event.id, event);
      return event;
    },
    query: async (orgId?: string | null, status?: string): Promise<FraudEvent[]> => {
      let events = Array.from(this.fraudEventsMap.values());
      if (orgId) {
        events = events.filter((e) => e.organization_id === orgId);
      }
      if (status) {
        events = events.filter((e) => e.status === status);
      }
      events.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      return events;
    },
    updateStatus: async (id: string, status: FraudEvent['status']): Promise<FraudEvent | null> => {
      const event = this.fraudEventsMap.get(id);
      if (!event) return null;
      event.status = status;
      return event;
    },
  };

  public healthMetrics = {
    listRecent: async (): Promise<SystemHealthMetric[]> => {
      return Array.from(this.systemHealthMetricsMap.values());
    },
    record: async (metric: SystemHealthMetric): Promise<SystemHealthMetric> => {
      this.systemHealthMetricsMap.set(metric.id, metric);
      return metric;
    },
  };
}

export const db = new DatabaseRepository();
