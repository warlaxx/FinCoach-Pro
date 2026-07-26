import { Router, Request, Response, NextFunction } from 'express';
import { billingController } from '../controllers/billing.controller';
import { requireAuth } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = Router();

// Public : le frontend adapte ses CTA selon que Stripe est configuré ou non.
router.get('/config', (req: Request, res: Response) => billingController.getConfig(req, res));

// Webhook Stripe : PAS d'auth JWT — la sécurité repose sur la signature
// Stripe vérifiée avec le body brut (monté en express.raw dans app.ts).
router.post('/webhook', (req: Request, res: Response, next: NextFunction) =>
  billingController.webhook(req, res).catch(next),
);

// Authentifié : création de session Checkout et portail client.
router.use(requireAuth as any);

router.post('/checkout', (req: Request, res: Response, next: NextFunction) =>
  billingController.createCheckout(req as AuthRequest, res).catch(next),
);

router.post('/portal', (req: Request, res: Response, next: NextFunction) =>
  billingController.createPortal(req as AuthRequest, res).catch(next),
);

export default router;
