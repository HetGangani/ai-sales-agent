import { db } from '@/lib/db/repository';
import { Notification, NotificationType } from '@/lib/types/domain';
import { AppError } from '@/lib/utils/api-response';

export class NotificationService {
  /**
   * Retrieves all notifications for an organization/user
   */
  async listNotifications(orgId: string, userId?: string | null): Promise<{
    notifications: Notification[];
    unreadCount: number;
  }> {
    const list = await db.notificationRepo.findByOrgAndUser(orgId, userId);
    const unreadCount = list.filter((n) => !n.is_read).length;
    return { notifications: list, unreadCount };
  }

  /**
   * Marks a single notification as read
   */
  async markRead(id: string, orgId: string): Promise<boolean> {
    const success = await db.notificationRepo.markAsRead(id, orgId);
    if (!success) {
      throw new AppError('Notification not found', 'NOT_FOUND', 404);
    }
    return true;
  }

  /**
   * Marks all notifications as read
   */
  async markAllRead(orgId: string, userId?: string | null): Promise<void> {
    await db.notificationRepo.markAllAsRead(orgId, userId);
  }

  /**
   * Creates a new notification
   */
  async createNotification(params: {
    organizationId: string;
    userId?: string | null;
    title: string;
    message: string;
    type: NotificationType;
    metadata?: Record<string, unknown>;
  }): Promise<Notification> {
    const notif: Notification = {
      id: crypto.randomUUID(),
      organization_id: params.organizationId,
      user_id: params.userId || null,
      title: params.title,
      message: params.message,
      type: params.type,
      is_read: false,
      metadata: params.metadata || {},
      created_at: new Date().toISOString(),
    };
    return db.notificationRepo.create(notif);
  }
}

export const notificationService = new NotificationService();
