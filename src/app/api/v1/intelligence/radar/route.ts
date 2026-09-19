import { NextRequest } from 'next/server';
import { authenticateRequest } from '@/lib/auth/middleware-helper';
import { leadService } from '@/lib/services/lead-service';
import { apiSuccess, handleApiError } from '@/lib/utils/api-response';

export async function GET(req: NextRequest) {
  try {
    const session = await authenticateRequest(req);
    const radarLeads = await leadService.getRadar(session.organization.id);
    return apiSuccess(radarLeads, 200);
  } catch (err) {
    return handleApiError(err);
  }
}
