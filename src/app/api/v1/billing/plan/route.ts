import { NextRequest } from 'next/server';
import { authenticateRequest } from '@/lib/auth/middleware-helper';
import { subscriptionService } from '@/lib/services/subscription-service';
import { apiSuccess, handleApiError, apiError } from '@/lib/utils/api-response';
import { z } from 'zod';

const updatePlanSchema = z.object({
  planTier: z.enum(['STARTER', 'GROWTH', 'ENTERPRISE']),
});

export async function POST(req: NextRequest) {
  try {
    const session = await authenticateRequest(req, { requiredRole: 'ADMIN' });
    const json = await req.json();
    const validated = updatePlanSchema.safeParse(json);
    if (!validated.success) {
      return apiError('Invalid plan tier. Allowed: STARTER, GROWTH, ENTERPRISE', 'VALIDATION_ERROR', 400);
    }

    const updated = await subscriptionService.updatePlanTier(
      session.organization.id,
      validated.data.planTier,
      session.user.id
    );

    return apiSuccess(updated, 200);
  } catch (err) {
    return handleApiError(err);
  }
}
