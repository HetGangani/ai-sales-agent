import { NextRequest } from 'next/server';
import { authenticateRequest } from '@/lib/auth/middleware-helper';
import { businessService } from '@/lib/services/business-service';
import { apiSuccess, handleApiError } from '@/lib/utils/api-response';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await authenticateRequest(req, { requiredRole: 'MANAGER' });
    const success = await businessService.deleteDocument(id, session.organization.id, session.user.id);
    return apiSuccess({ deleted: success }, 200);
  } catch (err) {
    return handleApiError(err);
  }
}
