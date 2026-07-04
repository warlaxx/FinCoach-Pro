import prisma from '../config/database';
import { Notification } from '@prisma/client';
import { emailService } from './email.service';
import { createLogger } from '../utils/logger';

const logger = createLogger('NotificationService');

export type NotificationType = 'INFO' | 'SUCCESS' | 'WARNING' | 'ALERT';

/**
 * Notification service — TICKET-10.
 *
 * Persists in-app notifications and (optionally) sends the matching email.
 * All methods are defensive: a notification failure must never break the
 * business action that triggered it.
 */
class NotificationService {
  /**
   * Creates an in-app notification. When `email` is provided, also sends the
   * matching email (best-effort — SMTP falls back to console when unconfigured).
   */
  async notify(params: {
    userId: string;
    title: string;
    message: string;
    type?: NotificationType;
    email?: { to: string; firstName: string };
  }): Promise<void> {
    const { userId, title, message, type = 'INFO', email } = params;

    try {
      await prisma.notification.create({
        data: { userId, title, message, type },
      });
      logger.debug('Notification created', { userId, type, title });
    } catch (err) {
      logger.error('Failed to create notification', { userId, error: (err as Error).message });
    }

    if (email) {
      await emailService
        .sendNotificationEmail(email.to, email.firstName, title, message)
        .catch((err) =>
          logger.error('Failed to send notification email', { userId, error: (err as Error).message }),
        );
    }
  }

  /** All notifications for a user, newest first (capped). */
  async list(userId: string, limit = 30): Promise<Notification[]> {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async unreadCount(userId: string): Promise<number> {
    return prisma.notification.count({ where: { userId, read: false } });
  }

  /** Marks one notification as read; returns false if it isn't the user's. */
  async markRead(userId: string, id: bigint): Promise<boolean> {
    const result = await prisma.notification.updateMany({
      where: { id, userId, read: false },
      data: { read: true },
    });
    return result.count > 0;
  }

  async markAllRead(userId: string): Promise<void> {
    await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  }

  toResponse(n: Notification): Record<string, unknown> {
    return {
      id: n.id.toString(),
      title: n.title,
      message: n.message,
      type: n.type,
      read: n.read,
      createdAt: n.createdAt,
    };
  }
}

export const notificationService = new NotificationService();
