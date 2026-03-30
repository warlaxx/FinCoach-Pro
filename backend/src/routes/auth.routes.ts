import { Router, Request, Response, NextFunction } from 'express';
import { authController } from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = Router();

// Public endpoints
router.post('/register', (req: Request, res: Response, next: NextFunction) => {
  authController.register(req, res).catch(next);
});

router.post('/login', (req: Request, res: Response, next: NextFunction) => {
  authController.login(req, res).catch(next);
});

router.get('/verify-email', (req: Request, res: Response, next: NextFunction) => {
  authController.verifyEmail(req, res).catch(next);
});

router.post('/forgot-password', (req: Request, res: Response, next: NextFunction) => {
  authController.forgotPassword(req, res).catch(next);
});

router.post('/reset-password', (req: Request, res: Response, next: NextFunction) => {
  authController.resetPassword(req, res).catch(next);
});

router.post('/resend-verification', (req: Request, res: Response, next: NextFunction) => {
  authController.resendVerification(req, res).catch(next);
});

// Protected endpoints (require JWT)
router.get(
  '/me',
  requireAuth as any,
  (req: Request, res: Response) => authController.me(req as AuthRequest, res),
);

router.put(
  '/profile',
  requireAuth as any,
  (req: Request, res: Response, next: NextFunction) =>
    authController.updateProfile(req as AuthRequest, res).catch(next),
);

export default router;
