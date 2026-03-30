import { Router, Request, Response, NextFunction } from 'express';
import { profileController } from '../controllers/profile.controller';
import { requireAuth } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = Router();

router.use(requireAuth as any);

router.get('/:userId', (req: Request, res: Response, next: NextFunction) =>
  profileController.getDashboard(req as AuthRequest, res).catch(next),
);

export default router;
