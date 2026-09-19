import { NextRequest } from 'next/server';
import { authenticateRequest } from '@/lib/auth/middleware-helper';
import { db } from '@/lib/db/repository';
import { apiSuccess, handleApiError } from '@/lib/utils/api-response';

export async function GET(req: NextRequest) {
  try {
    const session = await authenticateRequest(req);
    const orgId = session.organization.id;

    const leads = (await db.leadRepo.query(orgId, { limit: 1000 })).items;
    const calls = await db.callRepo.findByOrg(orgId);
    const campaigns = await db.campaignRepo.findByOrg(orgId);
    const sub = await db.subscriptionRepo.findByOrg(orgId);

    const totalLeads = leads.length;
    const qualifiedLeads = leads.filter((l) => l.qualification_status === 'QUALIFIED').length;
    const totalCalls = calls.length;
    const completedCalls = calls.filter((c) => c.status === 'completed').length;
    const interestedProspects = calls.filter((c) => c.prospect_response_status === 'INTERESTED').length;
    const totalMinutes = calls.reduce((acc, c) => acc + Math.ceil((c.duration_seconds || 0) / 60), 0);

    // Intent distribution
    const intentDistribution = {
      high: leads.filter((l) => l.intent_score >= 80).length,
      medium: leads.filter((l) => l.intent_score >= 50 && l.intent_score < 80).length,
      low: leads.filter((l) => l.intent_score < 50).length,
    };

    // Source breakdown
    const sourceBreakdown: Record<string, number> = {};
    leads.forEach((l) => {
      sourceBreakdown[l.source_platform] = (sourceBreakdown[l.source_platform] || 0) + 1;
    });

    return apiSuccess(
      {
        summary: {
          totalOpportunities: totalLeads,
          qualifiedLeads,
          totalCallsPlaced: totalCalls,
          completedCalls,
          interestedProspects,
          conversionRate: completedCalls > 0 ? Math.round((interestedProspects / completedCalls) * 1000) / 10 : 0,
          totalMinutesUsed: totalMinutes,
          voiceMinutesAllocated: sub ? sub.allocated_voice_minutes : 500,
        },
        intentDistribution,
        sourceBreakdown,
        activeCampaignsCount: campaigns.filter((c) => c.status === 'ACTIVE').length,
      },
      200
    );
  } catch (err) {
    return handleApiError(err);
  }
}
