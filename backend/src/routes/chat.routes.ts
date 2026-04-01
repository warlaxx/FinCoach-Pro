import { Router, Request, Response, NextFunction } from 'express';
import { chatController } from '../controllers/chat.controller';
import { requireAuth } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = Router();

router.use(requireAuth as any);

router.get('/history', (req: Request, res: Response, next: NextFunction) =>
  chatController.getHistory(req as AuthRequest, res).catch(next),
);

router.post('/', (req: Request, res: Response, next: NextFunction) =>
  chatController.sendMessage(req as AuthRequest, res).catch(next),
);

router.delete('/', (req: Request, res: Response, next: NextFunction) =>
  chatController.clearHistory(req as AuthRequest, res).catch(next),
);

export default router;
