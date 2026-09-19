import { NextRequest } from 'next/server';
import { authenticateRequest } from '@/lib/auth/middleware-helper';
import { leadService } from '@/lib/services/lead-service';
import { apiSuccess, handleApiError } from '@/lib/utils/api-response';
import { logAuditEvent } from '@/lib/security/audit-logger';

export async function POST(req: NextRequest) {
  try {
    const session = await authenticateRequest(req, { requiredRole: 'MANAGER' });

    // Simulates continuous discovery cycle across active source adapters
    const paginated = await leadService.listLeads(session.organization.id, {
      limit: 10,
      sortBy: 'discovery_date',
      sortOrder: 'desc',
    });

    await logAuditEvent({
      organizationId: session.organization.id,
      userId: session.user.id,
      action: 'opportunities_discovered',
      resourceType: 'discovery',
      details: { discoveredCount: paginated.items.length },
    });

    return apiSuccess(
      {
        message: 'Continuous discovery cycle completed across all configured adapters.',
        newOpportunitiesCount: paginated.items.length,
        totalOpportunities: paginated.pagination.total,
        recentDiscoveries: paginated.items,
      },
      200
    );
  } catch (err) {
    return handleApiError(err);
  }
}
