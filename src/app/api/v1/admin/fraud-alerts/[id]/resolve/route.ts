import { NextRequest } from 'next/server';
import { authenticateRequest } from '@/lib/auth/middleware-helper';
import { adminService } from '@/lib/services/admin-service';
import { apiSuccess, handleApiError, apiError } from '@/lib/utils/api-response';
import { z } from 'zod';

const resolveSchema = z.object({
  status: z.enum(['OPEN', 'INVESTIGATING', 'RESOLVED', 'DISMISSED']),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await authenticateRequest(req, { requiredRole: 'ADMIN' });
    const json = await req.json();
    const validated = resolveSchema.safeParse(json);
    if (!validated.success) {
      return apiError('Invalid status. Allowed: OPEN, INVESTIGATING, RESOLVED, DISMISSED', 'VALIDATION_ERROR', 400);
    }

    const updated = await adminService.resolveFraudAlert(id, validated.data.status, session.user.id);
    return apiSuccess(updated, 200);
  } catch (err) {
    return handleApiError(err);
  }
}
