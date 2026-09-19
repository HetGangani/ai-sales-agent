import { NextRequest } from 'next/server';
import { authenticateRequest } from '@/lib/auth/middleware-helper';
import { adminService } from '@/lib/services/admin-service';
import { apiSuccess, handleApiError } from '@/lib/utils/api-response';

export async function GET(req: NextRequest) {
  try {
    await authenticateRequest(req, { requiredRole: 'ADMIN' });
    const stats = await adminService.getDashboardStats();
    return apiSuccess(stats, 200);
  } catch (err) {
    return handleApiError(err);
  }
}
