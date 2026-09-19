import { NextRequest } from 'next/server';
import { authenticateRequest } from '@/lib/auth/middleware-helper';
import { businessService } from '@/lib/services/business-service';
import { businessProfileSchema } from '@/lib/schemas/business';
import { apiSuccess, handleApiError, apiError } from '@/lib/utils/api-response';

export async function GET(req: NextRequest) {
  try {
    const session = await authenticateRequest(req);
    const profile = await businessService.getProfile(session.organization.id);
    return apiSuccess(profile, 200);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await authenticateRequest(req, { requiredRole: 'MANAGER' });
    const json = await req.json();
    const validated = businessProfileSchema.safeParse(json);
    if (!validated.success) {
      return apiError(
        'Validation failed',
        'VALIDATION_ERROR',
        400,
        validated.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }))
      );
    }

    const updated = await businessService.updateProfile(session.organization.id, validated.data, session.user.id);
    return apiSuccess(updated, 200);
  } catch (err) {
    return handleApiError(err);
  }
}
