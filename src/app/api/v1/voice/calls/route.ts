import { NextRequest } from 'next/server';
import { authenticateRequest } from '@/lib/auth/middleware-helper';
import { callService } from '@/lib/services/call-service';
import { createCallSchema } from '@/lib/schemas/calls';
import { apiSuccess, handleApiError, apiError } from '@/lib/utils/api-response';

export async function GET(req: NextRequest) {
  try {
    const session = await authenticateRequest(req);
    const calls = await callService.listCalls(session.organization.id);
    return apiSuccess(calls, 200);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await authenticateRequest(req, { requiredRole: 'USER' });
    const json = await req.json();
    const validated = createCallSchema.safeParse(json);
    if (!validated.success) {
      return apiError(
        'Validation failed',
        'VALIDATION_ERROR',
        400,
        validated.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }))
      );
    }

    const call = await callService.createCall(session.organization.id, validated.data, session.user.id);
    return apiSuccess(call, 201);
  } catch (err) {
    return handleApiError(err);
  }
}
