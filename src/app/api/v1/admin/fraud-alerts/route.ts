import { NextRequest } from 'next/server';
import { authenticateRequest } from '@/lib/auth/middleware-helper';
import { adminService } from '@/lib/services/admin-service';
import { apiSuccess, handleApiError } from '@/lib/utils/api-response';

export async function GET(req: NextRequest) {
  try {
    const session = await authenticateRequest(req, { requiredRole: 'ADMIN' });
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || undefined;

    const events = await adminService.getFraudAlerts(session.organization.id, status);
    return apiSuccess(events, 200);
  } catch (err) {
    return handleApiError(err);
  }
}
