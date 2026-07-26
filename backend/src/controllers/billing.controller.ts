import { Request, Response } from 'express';
import { AuthRequest } from '../types';
import {
  billingService,
  BillingNotConfiguredError,
  BillingError,
  PaidPlan,
  BillingInterval,
} from '../services/billing.service';
import { createLogger } from '../utils/logger';

const logger = createLogger('BillingController');

/**
 * Contrôleur de facturation Stripe — TICKET-15.
 *
 * Routes :
 *  GET  /api/billing/config    — { enabled } : Stripe est-il configuré ?
 *  POST /api/billing/checkout  — crée une session Checkout (auth requise)
 *  POST /api/billing/portal    — ouvre le portail client Stripe (auth requise)
 *  POST /api/billing/webhook   — webhooks Stripe (signature vérifiée, body brut)
 */
export const billingController = {
  // GET /api/billing/config
  getConfig(_req: Request, res: Response): void {
    res.json({ success: true, data: { enabled: billingService.isConfigured } });
  },

  // POST /api/billing/checkout  { plan: 'PRO'|'PREMIUM', interval: 'monthly'|'annual' }
  async createCheckout(req: AuthRequest, res: Response): Promise<void> {
    const { plan, interval } = req.body as { plan?: string; interval?: string };

    if (plan !== 'PRO' && plan !== 'PREMIUM') {
      res.json({ success: false, message: 'Plan invalide. Choisissez Pro ou Premium.' });
      return;
    }
    const billingInterval: BillingInterval = interval === 'annual' ? 'annual' : 'monthly';

    try {
      const url = await billingService.createCheckoutSession(
        req.userId,
        plan as PaidPlan,
        billingInterval,
      );
      res.json({ success: true, data: { url } });
    } catch (err) {
      this.handleError(err, req, res, 'Create checkout failed');
    }
  },

  // POST /api/billing/portal
  async createPortal(req: AuthRequest, res: Response): Promise<void> {
    try {
      const url = await billingService.createPortalSession(req.userId);
      res.json({ success: true, data: { url } });
    } catch (err) {
      this.handleError(err, req, res, 'Create portal failed');
    }
  },

  // POST /api/billing/webhook — appelé par Stripe, jamais par le frontend
  async webhook(req: Request, res: Response): Promise<void> {
    const signature = req.headers['stripe-signature'];
    if (typeof signature !== 'string' || !Buffer.isBuffer(req.body)) {
      res.status(400).json({ error: 'Requête webhook invalide.' });
      return;
    }

    try {
      const type = await billingService.handleWebhook(req.body, signature);
      res.json({ received: true, type });
    } catch (err) {
      if (err instanceof BillingNotConfiguredError) {
        res.status(503).json({ error: err.message });
        return;
      }
      // Signature invalide ou payload corrompu → 400 (Stripe ne réessaie pas) ;
      // toute autre erreur → 500 (Stripe réessaie automatiquement).
      const message = (err as Error).message ?? '';
      const isSignatureError = message.toLowerCase().includes('signature');
      logger.error('Webhook processing failed', { error: message, isSignatureError });
      res.status(isSignatureError ? 400 : 500).json({ error: 'Webhook non traité.' });
    }
  },

  // ─── Helper ─────────────────────────────────────────────────────────────────

  handleError(err: unknown, req: AuthRequest, res: Response, context: string): void {
    if (err instanceof BillingNotConfiguredError) {
      res.json({ success: false, code: err.code, message: err.message });
      return;
    }
    if (err instanceof BillingError) {
      res.json({ success: false, message: err.message });
      return;
    }
    logger.error(context, { userId: req.userId, error: (err as Error).message });
    res.json({ success: false, message: 'Erreur serveur. Veuillez réessayer plus tard.' });
  },
};
