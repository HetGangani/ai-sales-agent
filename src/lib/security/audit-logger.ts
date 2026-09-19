import { AuditLog } from '@/lib/types/domain';
import { db } from '@/lib/db/repository';

export interface LogAuditParams {
  organizationId?: string | null;
  userId?: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  details?: Record<string, unknown>;
  ipAddress?: string | null;
}

/**
 * Records an immutable security or operational audit log
 */
export async function logAuditEvent(params: LogAuditParams): Promise<AuditLog> {
  const log: AuditLog = {
    id: crypto.randomUUID(),
    organization_id: params.organizationId || null,
    user_id: params.userId || null,
    action: params.action,
    resource_type: params.resourceType,
    resource_id: params.resourceId || null,
    details: params.details || {},
    ip_address: params.ipAddress || null,
    created_at: new Date().toISOString(),
  };

  try {
    await db.auditLogs.create(log);
  } catch (err) {
    console.error('[Audit Logger Error]: Failed to persist audit log', err);
  }

  return log;
}
