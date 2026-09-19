import { CreateCallInput, UpdateCallInput, SimulateCallInput } from '@/lib/schemas/calls';
import { db } from '@/lib/db/repository';
import { Call, CallTranscript, CallSummary } from '@/lib/types/domain';
import { AppError } from '@/lib/utils/api-response';
import { logAuditEvent } from '@/lib/security/audit-logger';

export class CallService {
  /**
   * Lists all call records for an organization
   */
  async listCalls(orgId: string): Promise<Call[]> {
    return db.callRepo.findByOrg(orgId);
  }

  /**
   * Retrieves single call by ID with full transcript, summary, and lead
   */
  async getCallById(id: string, orgId: string): Promise<Call> {
    const call = await db.callRepo.findById(id, orgId);
    if (!call) {
      throw new AppError('Call record not found', 'NOT_FOUND', 404);
    }
    return call;
  }

  /**
   * Initiates / logs a call record
   */
  async createCall(orgId: string, input: CreateCallInput, userId?: string): Promise<Call> {
    const lead = await db.leadRepo.findById(input.leadId, orgId);
    if (!lead) {
      throw new AppError('Lead not found', 'NOT_FOUND', 404);
    }

    const callId = crypto.randomUUID();
    const call: Call = {
      id: callId,
      organization_id: orgId,
      lead_id: input.leadId,
      campaign_id: input.campaignId || null,
      provider: input.provider || 'simulated',
      direction: input.direction,
      status: 'dialing',
      started_at: new Date().toISOString(),
      ended_at: null,
      duration_seconds: 0,
      language: input.language || 'en',
      outcome: null,
      intent: null,
      prospect_response_status: null,
      created_at: new Date().toISOString(),
    };

    await db.callRepo.create(call);

    await logAuditEvent({
      organizationId: orgId,
      userId,
      action: 'call_initiated',
      resourceType: 'call',
      resourceId: callId,
      details: { leadId: input.leadId, direction: input.direction },
    });

    return (await db.callRepo.findById(callId, orgId))!;
  }

  /**
   * Updates call status and attaches transcripts / summaries
   */
  async updateCall(id: string, orgId: string, input: UpdateCallInput, userId?: string): Promise<Call> {
    const existing = await db.callRepo.findById(id, orgId);
    if (!existing) {
      throw new AppError('Call record not found', 'NOT_FOUND', 404);
    }

    const { transcript, summary, ...fields } = input;
    const partialCall: Partial<Call> = {};
    if (fields.status !== undefined) partialCall.status = fields.status;
    if (fields.startedAt !== undefined) partialCall.started_at = fields.startedAt;
    if (fields.endedAt !== undefined) partialCall.ended_at = fields.endedAt;
    if (fields.durationSeconds !== undefined) partialCall.duration_seconds = fields.durationSeconds;
    if (fields.outcome !== undefined) partialCall.outcome = fields.outcome;
    if (fields.intent !== undefined) partialCall.intent = fields.intent;
    if (fields.prospectResponseStatus !== undefined) partialCall.prospect_response_status = fields.prospectResponseStatus;

    await db.callRepo.update(id, orgId, partialCall);

    if (transcript) {
      const transcriptRecord: CallTranscript = {
        id: crypto.randomUUID(),
        call_id: id,
        transcript_text: transcript.transcriptText,
        speaker_segments: transcript.speakerSegments,
        created_at: new Date().toISOString(),
      };
      await db.callRepo.createTranscript(transcriptRecord);
    }

    if (summary) {
      const summaryRecord: CallSummary = {
        id: crypto.randomUUID(),
        call_id: id,
        summary_text: summary.summaryText,
        key_takeaways: summary.keyTakeaways,
        objections_raised: summary.objectionsRaised,
        sentiment: summary.sentiment,
        next_best_action: summary.nextBestAction,
        created_at: new Date().toISOString(),
      };
      await db.callRepo.createSummary(summaryRecord);
    }

    // If duration was added, record voice minute usage
    if (input.durationSeconds && input.durationSeconds > 0) {
      const minutes = Math.ceil(input.durationSeconds / 60);
      await db.usageRepo.record({
        id: crypto.randomUUID(),
        organization_id: orgId,
        metric: 'voice_minutes',
        quantity: minutes,
        recorded_at: new Date().toISOString(),
      });
      await db.subscriptionRepo.updateMinutes(orgId, minutes);
    }

    await logAuditEvent({
      organizationId: orgId,
      userId,
      action: 'call_updated',
      resourceType: 'call',
      resourceId: id,
      details: { status: input.status, outcome: input.outcome },
    });

    return (await db.callRepo.findById(id, orgId))!;
  }

  /**
   * Simulates an AI voice call for demo/testing purposes
   */
  async simulateCall(orgId: string, input: SimulateCallInput, userId?: string): Promise<Call> {
    const lead = await db.leadRepo.findById(input.leadId, orgId);
    if (!lead) {
      throw new AppError('Lead not found', 'NOT_FOUND', 404);
    }

    const primaryContact = lead.contacts && lead.contacts[0];
    const contactName = primaryContact?.name || 'Prospect';
    const callId = crypto.randomUUID();

    const isInterested = input.scenario === 'interested' || input.scenario === 'handoff_scheduled';
    const duration = isInterested ? 185 : input.scenario === 'voicemail' ? 35 : 95;

    const call: Call = {
      id: callId,
      organization_id: orgId,
      lead_id: input.leadId,
      campaign_id: input.campaignId || null,
      provider: 'simulated_webrtc',
      direction: input.direction,
      status: input.scenario === 'voicemail' ? 'voicemail' : 'completed',
      started_at: new Date(Date.now() - duration * 1000).toISOString(),
      ended_at: new Date().toISOString(),
      duration_seconds: duration,
      language: input.language || 'en',
      outcome: isInterested
        ? 'Prospect engaged actively and requested scoping discovery meeting.'
        : input.scenario === 'voicemail'
        ? 'Dropped structured voicemail with callback number.'
        : 'Prospect indicated existing vendor contract under multi-year lock-in.',
      intent: isInterested ? 'HIGH' : 'LOW',
      prospect_response_status: isInterested ? 'INTERESTED' : input.scenario === 'voicemail' ? null : 'NOT_INTERESTED',
      created_at: new Date().toISOString(),
    };

    await db.callRepo.create(call);

    // Create realistic transcript
    const transcriptText = `Agent: Hello ${contactName}, this is Alex calling from Acme Technologies. I noticed your team at ${lead.company_name} is evaluating cloud transformation and ${lead.requirement.substring(0, 50)}...\n\n${contactName}: Yes, we have an active project kickoff targeted soon. What is your turnaround timeline?\n\nAgent: We typically complete architectural assessment within 10 days and execute staged migration with zero cutover downtime.\n\n${contactName}: That matches our schedule. Send the technical brief to my email.\n\nAgent: Scoping package sent! Looking forward to our discussion.`;

    await db.callRepo.createTranscript({
      id: crypto.randomUUID(),
      call_id: callId,
      transcript_text: transcriptText,
      speaker_segments: [
        { speaker: 'Agent', timestamp: '00:00', text: `Hello ${contactName}, this is Alex calling from Acme Technologies.` },
        { speaker: 'Prospect', timestamp: '00:15', text: 'Yes, we have an active project kickoff targeted soon. What is your turnaround timeline?' },
        { speaker: 'Agent', timestamp: '00:30', text: 'We typically complete architectural assessment within 10 days with zero cutover downtime.' },
        { speaker: 'Prospect', timestamp: '00:50', text: 'That matches our schedule. Send the technical brief to my email.' },
        { speaker: 'Agent', timestamp: '01:05', text: 'Scoping package sent! Looking forward to our discussion.' },
      ],
      created_at: new Date().toISOString(),
    });

    // Create summary
    await db.callRepo.createSummary({
      id: crypto.randomUUID(),
      call_id: callId,
      summary_text: `${contactName} from ${lead.company_name} confirmed interest in Acme Technologies solutions for ${lead.requirement.substring(0, 80)}. Requested scoping documentation and discovery calendar link.`,
      key_takeaways: [
        `Commercial requirement verified: ${lead.requirement.substring(0, 60)}`,
        'Confirmed purchasing authority and timeline alignment',
      ],
      objections_raised: ['Clarified timeline expectations'],
      sentiment: isInterested ? 'POSITIVE' : 'NEUTRAL',
      next_best_action: isInterested
        ? 'Schedule 30-min Technical Discovery Call and dispatch custom solution deck.'
        : 'Set follow-up reminder in 60 days.',
      created_at: new Date().toISOString(),
    });

    // Record voice minute usage
    const minutes = Math.ceil(duration / 60);
    await db.usageRepo.record({
      id: crypto.randomUUID(),
      organization_id: orgId,
      metric: 'voice_minutes',
      quantity: minutes,
      recorded_at: new Date().toISOString(),
    });
    await db.subscriptionRepo.updateMinutes(orgId, minutes);

    if (isInterested) {
      await db.notificationRepo.create({
        id: crypto.randomUUID(),
        organization_id: orgId,
        title: 'Prospect Interested from AI Voice Outreach',
        message: `${contactName} (${lead.company_name}) requested follow-up after call.`,
        type: 'interested_prospect',
        is_read: false,
        metadata: { callId, leadId: lead.id },
        created_at: new Date().toISOString(),
      });
    }

    await logAuditEvent({
      organizationId: orgId,
      userId,
      action: 'call_simulated',
      resourceType: 'call',
      resourceId: callId,
      details: { leadId: lead.id, companyName: lead.company_name, durationSeconds: duration },
    });

    return (await db.callRepo.findById(callId, orgId))!;
  }
}

export const callService = new CallService();
