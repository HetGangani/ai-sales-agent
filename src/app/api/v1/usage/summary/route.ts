import { NextRequest } from 'next/server';
import { authenticateRequest } from '@/lib/auth/middleware-helper';
import { usageService } from '@/lib/services/usage-service';
import { apiSuccess, handleApiError } from '@/lib/utils/api-response';

export async function GET(req: NextRequest) {
  try {
    const session = await authenticateRequest(req);
    const summary = await usageService.getUsageSummary(session.organization.id);
    return apiSuccess(summary, 200);
  } catch (err) {
    return handleApiError(err);
  }
}
