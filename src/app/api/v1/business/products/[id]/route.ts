import { NextRequest } from 'next/server';
import { authenticateRequest } from '@/lib/auth/middleware-helper';
import { businessService } from '@/lib/services/business-service';
import { productServiceSchema } from '@/lib/schemas/business';
import { apiSuccess, handleApiError, apiError } from '@/lib/utils/api-response';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await authenticateRequest(req, { requiredRole: 'MANAGER' });
    const json = await req.json();
    const validated = productServiceSchema.partial().safeParse(json);
    if (!validated.success) {
      return apiError(
        'Validation failed',
        'VALIDATION_ERROR',
        400,
        validated.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }))
      );
    }

    const updated = await businessService.updateProduct(id, session.organization.id, validated.data, session.user.id);
    return apiSuccess(updated, 200);
  } catch (err) {
    return handleApiError(err);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await authenticateRequest(req, { requiredRole: 'MANAGER' });
    const success = await businessService.deleteProduct(id, session.organization.id, session.user.id);
    return apiSuccess({ deleted: success }, 200);
  } catch (err) {
    return handleApiError(err);
  }
}
