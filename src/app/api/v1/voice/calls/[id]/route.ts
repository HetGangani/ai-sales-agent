import { NextRequest } from 'next/server';
import { authenticateRequest } from '@/lib/auth/middleware-helper';
import { callService } from '@/lib/services/call-service';
import { updateCallSchema } from '@/lib/schemas/calls';
import { apiSuccess, handleApiError, apiError } from '@/lib/utils/api-response';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await authenticateRequest(req);
    const call = await callService.getCallById(id, session.organization.id);
    return apiSuccess(call, 200);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await authenticateRequest(req);
    const json = await req.json();
    const validated = updateCallSchema.safeParse(json);
    if (!validated.success) {
      return apiError(
        'Validation failed',
        'VALIDATION_ERROR',
        400,
        validated.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }))
      );
    }

    const updated = await callService.updateCall(id, session.organization.id, validated.data, session.user.id);
    return apiSuccess(updated, 200);
  } catch (err) {
    return handleApiError(err);
  }
}
