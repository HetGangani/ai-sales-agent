import { CreateLeadInput, UpdateLeadInput, LeadQueryFilter, BulkUpdateLeadsInput, BulkAssignCampaignInput } from '@/lib/schemas/leads';
import { db } from '@/lib/db/repository';
import { Lead, LeadContact, LeadScore, MarketSignal, PaginatedResult } from '@/lib/types/domain';
import { AppError } from '@/lib/utils/api-response';
import { logAuditEvent } from '@/lib/security/audit-logger';

export class LeadService {
  /**
   * Queries leads for an organization with full-text search, multi-field filters, and pagination
   */
  async listLeads(orgId: string, filter: Partial<LeadQueryFilter> = {}): Promise<PaginatedResult<Lead>> {
    const page = typeof filter.page === 'number' ? filter.page : 1;
    const limit = typeof filter.limit === 'number' ? filter.limit : 20;
    const minIntentScore = typeof filter.minIntentScore === 'number' ? filter.minIntentScore : undefined;
    const maxIntentScore = typeof filter.maxIntentScore === 'number' ? filter.maxIntentScore : undefined;
    const isSimulated = typeof filter.isSimulated === 'boolean' ? filter.isSimulated : undefined;

    const { items, total } = await db.leadRepo.query(orgId, {
      ...filter,
      page,
      limit,
      minIntentScore,
      maxIntentScore,
      isSimulated,
    });

    return {
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Retrieves a single lead by ID with joined relations
   */
  async getLeadById(id: string, orgId: string): Promise<Lead> {
    const lead = await db.leadRepo.findById(id, orgId);
    if (!lead) {
      throw new AppError('Lead not found', 'NOT_FOUND', 404);
    }
    return lead;
  }

  /**
   * Creates a new lead with mandatory 11 prospect fields and contacts
   */
  async createLead(orgId: string, input: CreateLeadInput, userId?: string): Promise<Lead> {
    const leadId = crypto.randomUUID();

    const lead: Lead = {
      id: leadId,
      organization_id: orgId,
      source_platform: input.sourcePlatform,
      original_post_url: input.originalPostUrl,
      discovery_date: input.discoveryDate || new Date().toISOString(),
      company_name: input.companyName,
      company_website: input.companyWebsite || null,
      industry: input.industry || null,
      company_size: input.companySize || null,
      location: input.location || null,
      requirement: input.requirement,
      intent_score: input.intentScore !== undefined ? input.intentScore : 50,
      qualification_status: input.qualificationStatus || 'REVIEW_PENDING',
      lead_status: input.leadStatus || 'DISCOVERED',
      ai_reasoning: input.aiReasoning || null,
      is_simulated: input.isSimulated || false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const createdLead = await db.leadRepo.create(lead);

    // Create contacts if provided
    const createdContacts: LeadContact[] = [];
    if (input.contacts && input.contacts.length > 0) {
      for (const c of input.contacts) {
        const contact: LeadContact = {
          id: crypto.randomUUID(),
          lead_id: leadId,
          name: c.name,
          business_email: c.businessEmail || null,
          phone: c.phone || null,
          job_title: c.jobTitle || null,
          linkedin_profile: c.linkedinProfile || null,
          is_verified: c.isVerified || false,
          created_at: new Date().toISOString(),
        };
        await db.contactRepo.create(contact);
        createdContacts.push(contact);
      }
    }

    // Initialize default BANT score
    const score: LeadScore = {
      id: crypto.randomUUID(),
      lead_id: leadId,
      bant_budget_score: Math.max(0, lead.intent_score - 10),
      bant_authority_score: lead.intent_score,
      bant_need_score: Math.min(100, lead.intent_score + 5),
      bant_timeline_score: Math.max(0, lead.intent_score - 5),
      overall_intent_score: lead.intent_score,
      scoring_breakdown: {
        factors: ['Initial requirement ingested', 'Source verified'],
      },
    };
    await db.scoreRepo.createOrUpdate(score);

    // Create initial signal
    const signal: MarketSignal = {
      id: crypto.randomUUID(),
      lead_id: leadId,
      signal_type: 'requirement_posted',
      title: `Commercial requirement posted on ${lead.source_platform}`,
      description: lead.requirement,
      source_url: lead.original_post_url,
      confidence: 0.90,
      created_at: new Date().toISOString(),
    };
    await db.signalRepo.create(signal);

    await logAuditEvent({
      organizationId: orgId,
      userId,
      action: 'lead_created',
      resourceType: 'lead',
      resourceId: leadId,
      details: { companyName: lead.company_name, sourcePlatform: lead.source_platform, intentScore: lead.intent_score },
    });

    return {
      ...createdLead,
      contacts: createdContacts,
      score,
      signals: [signal],
    };
  }

  /**
   * Updates an existing lead
   */
  async updateLead(id: string, orgId: string, input: UpdateLeadInput, userId?: string): Promise<Lead> {
    const existing = await db.leadRepo.findById(id, orgId);
    if (!existing) {
      throw new AppError('Lead not found', 'NOT_FOUND', 404);
    }

    const { contacts, ...leadUpdates } = input;
    const partialLead: Partial<Lead> = {};
    if (leadUpdates.sourcePlatform !== undefined) partialLead.source_platform = leadUpdates.sourcePlatform;
    if (leadUpdates.originalPostUrl !== undefined) partialLead.original_post_url = leadUpdates.originalPostUrl;
    if (leadUpdates.discoveryDate !== undefined) partialLead.discovery_date = leadUpdates.discoveryDate;
    if (leadUpdates.companyName !== undefined) partialLead.company_name = leadUpdates.companyName;
    if (leadUpdates.companyWebsite !== undefined) partialLead.company_website = leadUpdates.companyWebsite;
    if (leadUpdates.industry !== undefined) partialLead.industry = leadUpdates.industry;
    if (leadUpdates.companySize !== undefined) partialLead.company_size = leadUpdates.companySize;
    if (leadUpdates.location !== undefined) partialLead.location = leadUpdates.location;
    if (leadUpdates.requirement !== undefined) partialLead.requirement = leadUpdates.requirement;
    if (leadUpdates.intentScore !== undefined) partialLead.intent_score = leadUpdates.intentScore;
    if (leadUpdates.qualificationStatus !== undefined) partialLead.qualification_status = leadUpdates.qualificationStatus;
    if (leadUpdates.leadStatus !== undefined) partialLead.lead_status = leadUpdates.leadStatus;
    if (leadUpdates.aiReasoning !== undefined) partialLead.ai_reasoning = leadUpdates.aiReasoning;
    if (leadUpdates.isSimulated !== undefined) partialLead.is_simulated = leadUpdates.isSimulated;

    const updated = await db.leadRepo.update(id, orgId, partialLead);
    if (!updated) {
      throw new AppError('Failed to update lead', 'INTERNAL_ERROR', 500);
    }

    await logAuditEvent({
      organizationId: orgId,
      userId,
      action: 'lead_updated',
      resourceType: 'lead',
      resourceId: id,
      details: { companyName: updated.company_name, qualificationStatus: updated.qualification_status },
    });

    return (await db.leadRepo.findById(id, orgId))!;
  }

  /**
   * Deletes / archives a lead
   */
  async deleteLead(id: string, orgId: string, userId?: string): Promise<boolean> {
    const existing = await db.leadRepo.findById(id, orgId);
    if (!existing) {
      throw new AppError('Lead not found', 'NOT_FOUND', 404);
    }

    const success = await db.leadRepo.delete(id, orgId);

    await logAuditEvent({
      organizationId: orgId,
      userId,
      action: 'lead_deleted',
      resourceType: 'lead',
      resourceId: id,
      details: { companyName: existing.company_name },
    });

    return success;
  }

  /**
   * Bulk updates multiple leads
   */
  async bulkUpdate(orgId: string, input: BulkUpdateLeadsInput, userId?: string): Promise<{ updatedCount: number }> {
    let count = 0;
    for (const leadId of input.leadIds) {
      const updatePayload: Partial<Lead> = {};
      if (input.qualificationStatus) updatePayload.qualification_status = input.qualificationStatus;
      if (input.leadStatus) updatePayload.lead_status = input.leadStatus;

      const updated = await db.leadRepo.update(leadId, orgId, updatePayload);
      if (updated) count++;
    }

    await logAuditEvent({
      organizationId: orgId,
      userId,
      action: 'leads_bulk_updated',
      resourceType: 'leads',
      details: { count, leadIds: input.leadIds, updates: input },
    });

    return { updatedCount: count };
  }

  /**
   * Bulk assigns leads to a campaign
   */
  async bulkAssignCampaign(orgId: string, input: BulkAssignCampaignInput, userId?: string): Promise<{ assignedCount: number }> {
    const campaign = await db.campaignRepo.findById(input.campaignId, orgId);
    if (!campaign) {
      throw new AppError('Campaign not found', 'NOT_FOUND', 404);
    }

    await db.campaignRepo.addLeads(input.campaignId, input.leadIds);

    await logAuditEvent({
      organizationId: orgId,
      userId,
      action: 'leads_bulk_assigned_campaign',
      resourceType: 'campaigns',
      resourceId: input.campaignId,
      details: { campaignName: campaign.name, leadCount: input.leadIds.length },
    });

    return { assignedCount: input.leadIds.length };
  }

  /**
   * Discovered public requirements radar
   */
  async getRadar(orgId: string): Promise<Lead[]> {
    const { items } = await db.leadRepo.query(orgId, {
      minIntentScore: 85,
      limit: 10,
      sortBy: 'intent_score',
      sortOrder: 'desc',
    });
    return items;
  }

  /**
   * Market signals for a lead
   */
  async getMarketSignals(leadId: string, orgId: string): Promise<MarketSignal[]> {
    const lead = await db.leadRepo.findById(leadId, orgId);
    if (!lead) {
      throw new AppError('Lead not found', 'NOT_FOUND', 404);
    }
    return db.signalRepo.findByLead(leadId);
  }
}

export const leadService = new LeadService();
