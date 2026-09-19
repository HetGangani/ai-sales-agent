import { NextRequest } from 'next/server';
import { authenticateRequest } from '@/lib/auth/middleware-helper';
import { campaignService } from '@/lib/services/campaign-service';
import { apiSuccess, handleApiError } from '@/lib/utils/api-response';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await authenticateRequest(req);
    const stats = await campaignService.getCampaignStats(id, session.organization.id);
    return apiSuccess(stats, 200);
  } catch (err) {
    return handleApiError(err);
  }
}
