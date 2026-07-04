import { Router, Request, Response, NextFunction } from 'express';
import { notificationsController } from '../controllers/notifications.controller';
import { requireAuth } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = Router();

router.use(requireAuth as any);

router.get('/', (req: Request, res: Response, next: NextFunction) =>
  notificationsController.list(req as AuthRequest, res).catch(next),
);

// read-all must be registered before /:id/read
router.put('/read-all', (req: Request, res: Response, next: NextFunction) =>
  notificationsController.markAllRead(req as AuthRequest, res).catch(next),
);

router.put('/:id/read', (req: Request, res: Response, next: NextFunction) =>
  notificationsController.markRead(req as AuthRequest, res).catch(next),
);

export default router;
