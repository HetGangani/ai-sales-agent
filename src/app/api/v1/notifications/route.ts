import { NextRequest } from 'next/server';
import { authenticateRequest } from '@/lib/auth/middleware-helper';
import { notificationService } from '@/lib/services/notification-service';
import { apiSuccess, handleApiError } from '@/lib/utils/api-response';

export async function GET(req: NextRequest) {
  try {
    const session = await authenticateRequest(req);
    const result = await notificationService.listNotifications(session.organization.id, session.user.id);
    return apiSuccess(result, 200);
  } catch (err) {
    return handleApiError(err);
  }
}
