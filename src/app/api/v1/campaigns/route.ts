import { NextRequest } from 'next/server';
import { authenticateRequest } from '@/lib/auth/middleware-helper';
import { campaignService } from '@/lib/services/campaign-service';
import { createCampaignSchema } from '@/lib/schemas/campaigns';
import { apiSuccess, handleApiError, apiError } from '@/lib/utils/api-response';

export async function GET(req: NextRequest) {
  try {
    const session = await authenticateRequest(req);
    const campaigns = await campaignService.listCampaigns(session.organization.id);
    return apiSuccess(campaigns, 200);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await authenticateRequest(req, { requiredRole: 'MANAGER' });
    const json = await req.json();
    const validated = createCampaignSchema.safeParse(json);
    if (!validated.success) {
      return apiError(
        'Validation failed',
        'VALIDATION_ERROR',
        400,
        validated.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }))
      );
    }

    const campaign = await campaignService.createCampaign(session.organization.id, validated.data, session.user.id);
    return apiSuccess(campaign, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
