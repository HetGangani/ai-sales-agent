import { db } from '@/lib/db/repository';
import { UsageMetric } from '@/lib/types/domain';

export class UsageService {
  /**
   * Records a usage consumption metric
   */
  async recordUsage(orgId: string, metric: UsageMetric, quantity: number): Promise<void> {
    await db.usageRepo.record({
      id: crypto.randomUUID(),
      organization_id: orgId,
      metric,
      quantity,
      recorded_at: new Date().toISOString(),
    });

    if (metric === 'voice_minutes') {
      await db.subscriptionRepo.updateMinutes(orgId, quantity);
    }
  }

  /**
   * Retrieves usage summary comparing actuals against subscription quotas
   */
  async getUsageSummary(orgId: string): Promise<{
    voiceMinutes: { used: number; allocated: number; remaining: number };
    leadsDiscovered: number;
    apiCalls: number;
    planTier: string;
  }> {
    const summary = await db.usageRepo.getSummary(orgId);
    const sub = await db.subscriptionRepo.findByOrg(orgId);

    const allocated = sub ? sub.allocated_voice_minutes : 500;
    const used = sub ? sub.used_voice_minutes : summary.voice_minutes;

    return {
      voiceMinutes: {
        used,
        allocated,
        remaining: Math.max(0, allocated - used),
      },
      leadsDiscovered: summary.leads_discovered,
      apiCalls: summary.api_calls,
      planTier: sub ? sub.plan_tier : 'STARTER',
    };
  }
}

export const usageService = new UsageService();
