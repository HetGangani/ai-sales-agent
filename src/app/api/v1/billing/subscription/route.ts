import { NextRequest } from 'next/server';
import { authenticateRequest } from '@/lib/auth/middleware-helper';
import { subscriptionService } from '@/lib/services/subscription-service';
import { apiSuccess, handleApiError } from '@/lib/utils/api-response';

export async function GET(req: NextRequest) {
  try {
    const session = await authenticateRequest(req);
    const sub = await subscriptionService.getSubscription(session.organization.id);
    return apiSuccess(sub, 200);
  } catch (err) {
    return handleApiError(err);
  }
}
