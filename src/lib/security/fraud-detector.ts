import { FraudEvent, FraudSeverity } from '@/lib/types/domain';
import { db } from '@/lib/db/repository';

// In-memory tracker for failed login attempts
const failedLoginAttempts = new Map<string, { count: number; firstAttempt: number }>();
// In-memory tracker for rapid exports
const rapidExportTracker = new Map<string, { count: number; windowStart: number }>();

/**
 * Records a fraud anomaly event
 */
export async function recordFraudEvent(params: {
  organizationId?: string | null;
  severity: FraudSeverity;
  eventType: string;
  description: string;
  metadata?: Record<string, unknown>;
}): Promise<FraudEvent> {
  const event: FraudEvent = {
    id: crypto.randomUUID(),
    organization_id: params.organizationId || null,
    severity: params.severity,
    event_type: params.eventType,
    description: params.description,
    status: 'OPEN',
    metadata: params.metadata || {},
    created_at: new Date().toISOString(),
  };

  try {
    await db.fraudEvents.create(event);
  } catch (err) {
    console.error('[Fraud Detection Service Error]:', err);
  }

  return event;
}

/**
 * Tracks failed login attempts and triggers fraud alerts if threshold exceeded
 */
export async function trackFailedLogin(email: string, ip: string): Promise<boolean> {
  const key = `${email}:${ip}`;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minute window
  const threshold = 5;

  const current = failedLoginAttempts.get(key);
  if (!current || now - current.firstAttempt > windowMs) {
    failedLoginAttempts.set(key, { count: 1, firstAttempt: now });
    return false;
  }

  current.count += 1;
  if (current.count >= threshold) {
    await recordFraudEvent({
      severity: 'HIGH',
      eventType: 'multiple_failed_logins',
      description: `Detected ${current.count} failed login attempts for ${email} from IP ${ip}`,
      metadata: { email, ip, attempts: current.count },
    });
    return true; // Flagged as suspicious
  }

  return false;
}

/**
 * Resets failed login tracker upon successful authentication
 */
export function resetFailedLogins(email: string, ip: string): void {
  failedLoginAttempts.delete(`${email}:${ip}`);
}

/**
 * Detects rapid bulk operations (e.g. bulk export abuse)
 */
export async function trackBulkOperation(orgId: string, userId: string, operationType: string, count: number): Promise<boolean> {
  const key = `${orgId}:${userId}:${operationType}`;
  const now = Date.now();
  const windowMs = 5 * 60 * 1000; // 5 minute window

  const current = rapidExportTracker.get(key);
  if (!current || now - current.windowStart > windowMs) {
    rapidExportTracker.set(key, { count, windowStart: now });
    return false;
  }

  current.count += count;
  if (current.count > 500) {
    await recordFraudEvent({
      organizationId: orgId,
      severity: 'MEDIUM',
      eventType: 'rapid_bulk_operations',
      description: `Rapid bulk ${operationType} detected (${current.count} records affected within 5 minutes) by user ${userId}`,
      metadata: { organizationId: orgId, userId, operationType, recordCount: current.count },
    });
    return true;
  }

  return false;
}
