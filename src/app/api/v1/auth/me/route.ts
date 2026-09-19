import { NextRequest } from 'next/server';
import { authenticateRequest } from '@/lib/auth/middleware-helper';
import { authService } from '@/lib/services/auth-service';
import { apiSuccess, handleApiError } from '@/lib/utils/api-response';

export async function GET(req: NextRequest) {
  try {
    const session = await authenticateRequest(req);
    const result = await authService.getMe(session.user.id, session.organization.id);
    return apiSuccess(result, 200);
  } catch (err) {
    return handleApiError(err);
  }
}
