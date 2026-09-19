import { CreateCampaignInput, UpdateCampaignInput, UpdateCampaignStatusInput } from '@/lib/schemas/campaigns';
import { db } from '@/lib/db/repository';
import { Campaign, CampaignStatus } from '@/lib/types/domain';
import { AppError } from '@/lib/utils/api-response';
import { logAuditEvent } from '@/lib/security/audit-logger';

export class CampaignService {
  /**
   * Lists campaigns for an organization
   */
  async listCampaigns(orgId: string): Promise<Campaign[]> {
    return db.campaignRepo.findByOrg(orgId);
  }

  /**
   * Gets single campaign by ID
   */
  async getCampaignById(id: string, orgId: string): Promise<Campaign> {
    const camp = await db.campaignRepo.findById(id, orgId);
    if (!camp) {
      throw new AppError('Campaign not found', 'NOT_FOUND', 404);
    }
    return camp;
  }

  /**
   * Creates a new voice / outreach campaign
   */
  async createCampaign(orgId: string, input: CreateCampaignInput, userId?: string): Promise<Campaign> {
    const campaignId = crypto.randomUUID();

    const cfg = input.config || {};
    const campaign: Campaign = {
      id: campaignId,
      organization_id: orgId,
      name: input.name,
      type: input.type || 'LEADS_AND_CALLING',
      status: 'DRAFT',
      target_timezone: input.targetTimezone || 'UTC',
      schedule_cron: input.scheduleCron || null,
      config: {
        language: cfg.language || 'en',
        timezone: cfg.timezone || 'UTC',
        calling_window_start: cfg.calling_window_start || '09:00',
        calling_window_end: cfg.calling_window_end || '17:00',
        retry_count: cfg.retry_count !== undefined ? cfg.retry_count : 3,
        voicemail_enabled: cfg.voicemail_enabled !== undefined ? cfg.voicemail_enabled : true,
        callback_enabled: cfg.callback_enabled !== undefined ? cfg.callback_enabled : true,
        frequency: cfg.frequency || 'immediate',
      },
      voice_script_id: input.voiceScriptId || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await db.campaignRepo.create(campaign);

    if (input.leadIds && input.leadIds.length > 0) {
      await db.campaignRepo.addLeads(campaignId, input.leadIds);
    }

    await logAuditEvent({
      organizationId: orgId,
      userId,
      action: 'campaign_created',
      resourceType: 'campaign',
      resourceId: campaignId,
      details: { name: campaign.name, type: campaign.type, leadCount: input.leadIds?.length || 0 },
    });

    return (await db.campaignRepo.findById(campaignId, orgId))!;
  }

  /**
   * Updates campaign configuration
   */
  async updateCampaign(id: string, orgId: string, input: UpdateCampaignInput, userId?: string): Promise<Campaign> {
    const existing = await db.campaignRepo.findById(id, orgId);
    if (!existing) {
      throw new AppError('Campaign not found', 'NOT_FOUND', 404);
    }

    const { leadIds, config, ...fields } = input;
    const updatePayload: Partial<Campaign> = {
      ...fields,
      ...(config ? { config: { ...existing.config, ...config } } : {}),
    };

    await db.campaignRepo.update(id, orgId, updatePayload);

    if (leadIds && leadIds.length > 0) {
      await db.campaignRepo.addLeads(id, leadIds);
    }

    await logAuditEvent({
      organizationId: orgId,
      userId,
      action: 'campaign_updated',
      resourceType: 'campaign',
      resourceId: id,
      details: { name: existing.name },
    });

    return (await db.campaignRepo.findById(id, orgId))!;
  }

  /**
   * State Machine transition for campaign status
   */
  async updateStatus(id: string, orgId: string, input: UpdateCampaignStatusInput, userId?: string): Promise<Campaign> {
    const existing = await db.campaignRepo.findById(id, orgId);
    if (!existing) {
      throw new AppError('Campaign not found', 'NOT_FOUND', 404);
    }

    const currentStatus = existing.status;
    const targetStatus = input.status;

    // Validate state transition
    const validTransitions: Record<CampaignStatus, CampaignStatus[]> = {
      DRAFT: ['SCHEDULED', 'ACTIVE', 'CANCELLED'],
      SCHEDULED: ['ACTIVE', 'PAUSED', 'CANCELLED'],
      ACTIVE: ['PAUSED', 'COMPLETED', 'CANCELLED'],
      PAUSED: ['ACTIVE', 'COMPLETED', 'CANCELLED'],
      COMPLETED: [],
      CANCELLED: ['DRAFT'],
    };

    if (!validTransitions[currentStatus].includes(targetStatus)) {
      throw new AppError(
        `Invalid status transition from ${currentStatus} to ${targetStatus}`,
        'BAD_REQUEST',
        400
      );
    }

    await db.campaignRepo.update(id, orgId, { status: targetStatus });

    // Generate notification when campaign launches
    if (targetStatus === 'ACTIVE') {
      await db.notificationRepo.create({
        id: crypto.randomUUID(),
        organization_id: orgId,
        title: `Campaign Launched: ${existing.name}`,
        message: `Campaign ${existing.name} is now actively executing.`,
        type: 'campaign_started',
        is_read: false,
        metadata: { campaignId: id },
        created_at: new Date().toISOString(),
      });
    }

    await logAuditEvent({
      organizationId: orgId,
      userId,
      action: `campaign_${targetStatus.toLowerCase()}`,
      resourceType: 'campaign',
      resourceId: id,
      details: { previousStatus: currentStatus, newStatus: targetStatus },
    });

    return (await db.campaignRepo.findById(id, orgId))!;
  }

  /**
   * Calculates campaign aggregate statistics
   */
  async getCampaignStats(id: string, orgId: string): Promise<{
    totalLeads: number;
    completedCalls: number;
    interestedProspects: number;
    voicemails: number;
    failedCalls: number;
    connectRate: number;
    conversionRate: number;
    totalDurationSeconds: number;
  }> {
    const campaign = await db.campaignRepo.findById(id, orgId);
    if (!campaign) {
      throw new AppError('Campaign not found', 'NOT_FOUND', 404);
    }

    const leads = await db.campaignRepo.getLeads(id);
    const orgCalls = await db.callRepo.findByOrg(orgId);
    const campaignCalls = orgCalls.filter((c) => c.campaign_id === id);

    const completedCalls = campaignCalls.filter((c) => c.status === 'completed').length;
    const interestedProspects = campaignCalls.filter((c) => c.prospect_response_status === 'INTERESTED').length;
    const voicemails = campaignCalls.filter((c) => c.status === 'voicemail').length;
    const failedCalls = campaignCalls.filter((c) => c.status === 'failed').length;
    const totalDurationSeconds = campaignCalls.reduce((acc, c) => acc + (c.duration_seconds || 0), 0);

    const connectRate = campaignCalls.length > 0 ? (completedCalls / campaignCalls.length) * 100 : 0;
    const conversionRate = completedCalls > 0 ? (interestedProspects / completedCalls) * 100 : 0;

    return {
      totalLeads: leads.length,
      completedCalls,
      interestedProspects,
      voicemails,
      failedCalls,
      connectRate: Math.round(connectRate * 10) / 10,
      conversionRate: Math.round(conversionRate * 10) / 10,
      totalDurationSeconds,
    };
  }
}

export const campaignService = new CampaignService();
