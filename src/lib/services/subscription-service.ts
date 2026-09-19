import { db } from '@/lib/db/repository';
import { PlanTier, Subscription } from '@/lib/types/domain';
import { AppError } from '@/lib/utils/api-response';
import { logAuditEvent } from '@/lib/security/audit-logger';

export interface PlanDetails {
  tier: PlanTier;
  name: string;
  monthlyMinutes: number;
  features: string[];
}

export const PLAN_CONFIGS: Record<PlanTier, PlanDetails> = {
  STARTER: {
    tier: 'STARTER',
    name: 'Starter Plan',
    monthlyMinutes: 500,
    features: ['500 Voice Minutes', 'Up to 500 Discovered Leads/mo', 'Basic CRM Sync', 'Email Support'],
  },
  GROWTH: {
    tier: 'GROWTH',
    name: 'Growth Plan',
    monthlyMinutes: 2000,
    features: [
      '2,000 Voice Minutes',
      'Unlimited Lead Discovery',
      'Advanced Buying Signal Graph',
      'Bi-directional CRM Sync',
      'Priority Phone Support',
    ],
  },
  ENTERPRISE: {
    tier: 'ENTERPRISE',
    name: 'Enterprise Plan',
    monthlyMinutes: 5000,
    features: [
      '5,000+ Voice Minutes',
      'Custom AI Voice Fine-Tuning',
      'Dedicated Customer Success Manager',
      'Custom SLA & Audit Export',
      'Multi-Organization Tenancy',
    ],
  },
};

export class SubscriptionService {
  /**
   * Retrieves current subscription details
   */
  async getSubscription(orgId: string): Promise<{
    subscription: Subscription;
    planDetails: PlanDetails;
  }> {
    const sub = await db.subscriptionRepo.findByOrg(orgId);
    if (!sub) {
      throw new AppError('Subscription not found for this organization', 'NOT_FOUND', 404);
    }
    return {
      subscription: sub,
      planDetails: PLAN_CONFIGS[sub.plan_tier],
    };
  }

  /**
   * Updates plan tier (Starter, Growth, Enterprise)
   */
  async updatePlanTier(orgId: string, newTier: PlanTier, userId?: string): Promise<Subscription> {
    const sub = await db.subscriptionRepo.findByOrg(orgId);
    if (!sub) {
      throw new AppError('Subscription not found', 'NOT_FOUND', 404);
    }

    const previousTier = sub.plan_tier;
    const planConfig = PLAN_CONFIGS[newTier];

    sub.plan_tier = newTier;
    sub.allocated_voice_minutes = planConfig.monthlyMinutes;

    await db.subscriptionRepo.createOrUpdate(sub);
    await db.orgRepo.update(orgId, { plan_tier: newTier });

    await logAuditEvent({
      organizationId: orgId,
      userId,
      action: 'subscription_changed',
      resourceType: 'subscription',
      resourceId: sub.id,
      details: { previousTier, newTier, allocatedMinutes: planConfig.monthlyMinutes },
    });

    return sub;
  }
}

export const subscriptionService = new SubscriptionService();
