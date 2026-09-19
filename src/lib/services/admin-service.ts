import { db } from '@/lib/db/repository';
import { AuditLog, FraudEvent, SystemHealthMetric, FraudStatus } from '@/lib/types/domain';
import { AppError } from '@/lib/utils/api-response';
import { logAuditEvent } from '@/lib/security/audit-logger';

export class AdminService {
  /**
   * Retrieves platform-wide administrative dashboard statistics
   */
  async getDashboardStats(): Promise<{
    totalOrganizations: number;
    totalUsers: number;
    totalLeadsDiscovered: number;
    totalCallsPlaced: number;
    totalMinutesUsed: number;
    activeCampaigns: number;
    openFraudAlerts: number;
  }> {
    const orgs = Array.from(db.organizations.values());
    const users = Array.from(db.users.values());
    const leads = Array.from(db.leads.values());
    const calls = Array.from(db.calls.values());
    const campaigns = Array.from(db.campaigns.values());
    const fraudEvents = await db.fraudEvents.query();

    const totalMinutes = calls.reduce((acc, c) => acc + Math.ceil((c.duration_seconds || 0) / 60), 0);
    const activeCampaigns = campaigns.filter((c) => c.status === 'ACTIVE').length;
    const openFraudAlerts = fraudEvents.filter((f) => f.status === 'OPEN' || f.status === 'INVESTIGATING').length;

    return {
      totalOrganizations: orgs.length,
      totalUsers: users.length,
      totalLeadsDiscovered: leads.length,
      totalCallsPlaced: calls.length,
      totalMinutesUsed: totalMinutes,
      activeCampaigns,
      openFraudAlerts,
    };
  }

  /**
   * Queries audit logs with pagination and filters
   */
  async getAuditLogs(orgId?: string | null, limit: number = 50): Promise<AuditLog[]> {
    return db.auditLogs.query(orgId, limit);
  }

  /**
   * Queries fraud events with status filtering
   */
  async getFraudAlerts(orgId?: string | null, status?: string): Promise<FraudEvent[]> {
    return db.fraudEvents.query(orgId, status);
  }

  /**
   * Resolves or updates a fraud event status
   */
  async resolveFraudAlert(
    id: string,
    status: FraudStatus,
    adminUserId?: string
  ): Promise<FraudEvent> {
    const updated = await db.fraudEvents.updateStatus(id, status);
    if (!updated) {
      throw new AppError('Fraud event not found', 'NOT_FOUND', 404);
    }

    await logAuditEvent({
      userId: adminUserId,
      action: 'fraud_alert_resolved',
      resourceType: 'fraud_event',
      resourceId: id,
      details: { newStatus: status },
    });

    return updated;
  }

  /**
   * Retrieves current system component health metrics
   */
  async getSystemHealth(): Promise<SystemHealthMetric[]> {
    return db.healthMetrics.listRecent();
  }
}

export const adminService = new AdminService();
