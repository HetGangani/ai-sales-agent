import { NextRequest } from 'next/server';
import { authenticateRequest } from '@/lib/auth/middleware-helper';
import { callService } from '@/lib/services/call-service';
import { simulateCallSchema } from '@/lib/schemas/calls';
import { apiSuccess, handleApiError, apiError } from '@/lib/utils/api-response';

export async function POST(req: NextRequest) {
  try {
    const session = await authenticateRequest(req, { requiredRole: 'USER' });
    const json = await req.json();
    const validated = simulateCallSchema.safeParse(json);
    if (!validated.success) {
      return apiError(
        'Validation failed',
        'VALIDATION_ERROR',
        400,
        validated.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }))
      );
    }

    const call = await callService.simulateCall(session.organization.id, validated.data, session.user.id);
    return apiSuccess(call, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
