import { Response } from 'express';
import { AuthRequest } from '../types';
import { notificationService } from '../services/notification.service';
import { createLogger } from '../utils/logger';

const logger = createLogger('NotificationsController');

/**
 * Notifications controller — TICKET-10.
 *
 * Routes:
 *  GET  /api/notifications          — list + unread count
 *  PUT  /api/notifications/:id/read — mark one as read
 *  PUT  /api/notifications/read-all — mark all as read
 */
export const notificationsController = {
  // GET /api/notifications
  async list(req: AuthRequest, res: Response): Promise<void> {
    logger.debug('GET /api/notifications', { userId: req.userId });

    try {
      const [items, unread] = await Promise.all([
        notificationService.list(req.userId),
        notificationService.unreadCount(req.userId),
      ]);
      res.json({
        success: true,
        data: { notifications: items.map((n) => notificationService.toResponse(n)), unread },
      });
    } catch (err) {
      logger.error('List notifications unexpected error', { userId: req.userId, error: (err as Error).message });
      res.json({ success: false, message: 'Erreur serveur. Veuillez réessayer plus tard.' });
    }
  },

  // PUT /api/notifications/:id/read
  async markRead(req: AuthRequest, res: Response): Promise<void> {
    const rawId = req.params['id'];
    if (!/^\d+$/.test(rawId)) {
      res.json({ success: false, message: 'Identifiant de notification invalide.' });
      return;
    }

    try {
      const ok = await notificationService.markRead(req.userId, BigInt(rawId));
      if (!ok) {
        res.json({ success: false, message: 'Notification introuvable.' });
        return;
      }
      res.json({ success: true });
    } catch (err) {
      logger.error('Mark notification read unexpected error', { userId: req.userId, error: (err as Error).message });
      res.json({ success: false, message: 'Erreur serveur. Veuillez réessayer plus tard.' });
    }
  },

  // PUT /api/notifications/read-all
  async markAllRead(req: AuthRequest, res: Response): Promise<void> {
    try {
      await notificationService.markAllRead(req.userId);
      res.json({ success: true });
    } catch (err) {
      logger.error('Mark all read unexpected error', { userId: req.userId, error: (err as Error).message });
      res.json({ success: false, message: 'Erreur serveur. Veuillez réessayer plus tard.' });
    }
  },
};
