import { NextRequest } from 'next/server';
import { authenticateRequest } from '@/lib/auth/middleware-helper';
import { notificationService } from '@/lib/services/notification-service';
import { apiSuccess, handleApiError } from '@/lib/utils/api-response';

export async function POST(req: NextRequest) {
  try {
    const session = await authenticateRequest(req);
    await notificationService.markAllRead(session.organization.id, session.user.id);
    return apiSuccess({ message: 'All notifications marked as read' }, 200);
  } catch (err) {
    return handleApiError(err);
  }
}
