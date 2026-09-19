import { NextRequest } from 'next/server';
import { authenticateRequest } from '@/lib/auth/middleware-helper';
import { notificationService } from '@/lib/services/notification-service';
import { apiSuccess, handleApiError } from '@/lib/utils/api-response';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await authenticateRequest(req);
    await notificationService.markRead(id, session.organization.id);
    return apiSuccess({ read: true }, 200);
  } catch (err) {
    return handleApiError(err);
  }
}
