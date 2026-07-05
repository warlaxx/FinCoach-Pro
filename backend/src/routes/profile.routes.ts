import { Router, Request, Response, NextFunction } from 'express';
import { profileController } from '../controllers/profile.controller';
import { requireAuth } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = Router();

// All profile routes require authentication
router.use(requireAuth as any);

router.get('/', (req: Request, res: Response, next: NextFunction) =>
  profileController.getMyProfile(req as AuthRequest, res).catch(next),
);

// Must be registered BEFORE /:userId, otherwise "history" is captured as a userId
router.get('/history', (req: Request, res: Response, next: NextFunction) =>
  profileController.getHistory(req as AuthRequest, res).catch(next),
);

router.get('/:userId', (req: Request, res: Response, next: NextFunction) =>
  profileController.getProfileByUserId(req as AuthRequest, res).catch(next),
);

router.post('/', (req: Request, res: Response, next: NextFunction) =>
  profileController.saveProfile(req as AuthRequest, res).catch(next),
);

export default router;
