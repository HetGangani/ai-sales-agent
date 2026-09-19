import { NextRequest } from 'next/server';
import { authenticateRequest } from '@/lib/auth/middleware-helper';
import { adminService } from '@/lib/services/admin-service';
import { apiSuccess, handleApiError } from '@/lib/utils/api-response';

export async function GET(req: NextRequest) {
  try {
    const session = await authenticateRequest(req, { requiredRole: 'ADMIN' });
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const logs = await adminService.getAuditLogs(session.organization.id, limit);
    return apiSuccess(logs, 200);
  } catch (err) {
    return handleApiError(err);
  }
}
