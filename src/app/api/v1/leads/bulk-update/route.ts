import { NextRequest } from 'next/server';
import { authenticateRequest } from '@/lib/auth/middleware-helper';
import { leadService } from '@/lib/services/lead-service';
import { bulkUpdateLeadsSchema } from '@/lib/schemas/leads';
import { apiSuccess, handleApiError, apiError } from '@/lib/utils/api-response';

export async function PATCH(req: NextRequest) {
  try {
    const session = await authenticateRequest(req, { requiredRole: 'USER' });
    const json = await req.json();
    const validated = bulkUpdateLeadsSchema.safeParse(json);
    if (!validated.success) {
      return apiError(
        'Validation failed',
        'VALIDATION_ERROR',
        400,
        validated.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }))
      );
    }

    const result = await leadService.bulkUpdate(session.organization.id, validated.data, session.user.id);
    return apiSuccess(result, 200);
  } catch (err) {
    return handleApiError(err);
  }
}
