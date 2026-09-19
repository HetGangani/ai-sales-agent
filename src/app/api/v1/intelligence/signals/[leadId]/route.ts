import { NextRequest } from 'next/server';
import { authenticateRequest } from '@/lib/auth/middleware-helper';
import { leadService } from '@/lib/services/lead-service';
import { apiSuccess, handleApiError } from '@/lib/utils/api-response';

export async function GET(req: NextRequest, { params }: { params: Promise<{ leadId: string }> }) {
  try {
    const { leadId } = await params;
    const session = await authenticateRequest(req);
    const signals = await leadService.getMarketSignals(leadId, session.organization.id);
    return apiSuccess(signals, 200);
  } catch (err) {
    return handleApiError(err);
  }
}
