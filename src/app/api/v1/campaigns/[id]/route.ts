import { NextRequest } from 'next/server';
import { authenticateRequest } from '@/lib/auth/middleware-helper';
import { campaignService } from '@/lib/services/campaign-service';
import { updateCampaignSchema } from '@/lib/schemas/campaigns';
import { apiSuccess, handleApiError, apiError } from '@/lib/utils/api-response';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await authenticateRequest(req);
    const campaign = await campaignService.getCampaignById(id, session.organization.id);
    return apiSuccess(campaign, 200);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await authenticateRequest(req, { requiredRole: 'MANAGER' });
    const json = await req.json();
    const validated = updateCampaignSchema.safeParse(json);
    if (!validated.success) {
      return apiError(
        'Validation failed',
        'VALIDATION_ERROR',
        400,
        validated.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }))
      );
    }

    const updated = await campaignService.updateCampaign(id, session.organization.id, validated.data, session.user.id);
    return apiSuccess(updated, 200);
  } catch (err) {
    return handleApiError(err);
  }
}
