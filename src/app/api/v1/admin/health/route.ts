import { adminService } from '@/lib/services/admin-service';
import { testDbConnection } from '@/lib/db/pool';
import { apiSuccess } from '@/lib/utils/api-response';

export async function GET() {
  const healthMetrics = await adminService.getSystemHealth();
  const dbHealth = await testDbConnection();

  return apiSuccess(
    {
      status: 'HEALTHY',
      timestamp: new Date().toISOString(),
      uptimeSeconds: process.uptime(),
      components: healthMetrics,
      database: dbHealth,
    },
    200
  );
}
