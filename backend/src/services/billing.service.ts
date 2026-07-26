import Stripe from 'stripe';
import prisma from '../config/database';
import { createLogger } from '../utils/logger';
import { Plan } from './plan.service';

const logger = createLogger('BillingService');

export type PaidPlan = 'PRO' | 'PREMIUM';
export type BillingInterval = 'monthly' | 'annual';

/**
 * Levée quand Stripe n'est pas configuré (clés absentes). Le contrôleur la
 * traduit en { code: 'BILLING_DISABLED' } pour que le frontend retombe sur le
 * comportement d'avant TICKET-15 (redirection vers /register?plan=...).
 */
export class BillingNotConfiguredError extends Error {
  readonly code = 'BILLING_DISABLED';

  constructor(detail?: string) {
    super("Le paiement en ligne n'est pas encore activé.");
    this.name = 'BillingNotConfiguredError';
    if (detail) logger.warn('Billing not configured', { detail });
  }
}

/** Erreur métier affichable telle quelle à l'utilisateur (ex : pas d'abonnement). */
export class BillingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BillingError';
  }
}

/**
 * Service de facturation Stripe — TICKET-15.
 *
 * Abonnements récurrents via Stripe Checkout (mode subscription) :
 *  - createCheckoutSession : crée la session de paiement Pro/Premium,
 *    mensuel ou annuel (price IDs fournis par variables d'environnement).
 *  - createPortalSession   : portail client Stripe (changer de carte,
 *    annuler, télécharger les factures).
 *  - handleWebhook         : source de vérité du plan en DB. Le plan n'est
 *    JAMAIS activé côté frontend — uniquement via les événements signés.
 *
 * Sans STRIPE_SECRET_KEY, chaque endpoint répond BILLING_DISABLED et
 * l'application reste entièrement fonctionnelle (comme le mode démo OpenAI).
 */
class BillingService {
  private stripe: Stripe | null = null;

  get isConfigured(): boolean {
    // Les deux clés sont requises : sans webhook secret, l'utilisateur pourrait
    // payer sans que son plan soit jamais activé en DB.
    return (
      !!process.env.STRIPE_SECRET_KEY?.trim() && !!process.env.STRIPE_WEBHOOK_SECRET?.trim()
    );
  }

  private getClient(): Stripe {
    if (!this.isConfigured) throw new BillingNotConfiguredError('STRIPE_SECRET_KEY missing');
    if (!this.stripe) {
      this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!.trim());
    }
    return this.stripe;
  }

  private frontendUrl(): string {
    return process.env.FRONTEND_URL ?? 'http://localhost:4200';
  }

  /** Price ID Stripe pour un plan + périodicité, depuis l'environnement. */
  private priceIdFor(plan: PaidPlan, interval: BillingInterval): string {
    const key = `STRIPE_PRICE_${plan}_${interval === 'annual' ? 'ANNUAL' : 'MONTHLY'}`;
    const priceId = process.env[key]?.trim();
    if (!priceId) throw new BillingNotConfiguredError(`${key} missing`);
    return priceId;
  }

  /** Plan correspondant à un price ID (pour resynchroniser depuis un webhook). */
  private planForPriceId(priceId: string): PaidPlan | null {
    const map: [string | undefined, PaidPlan][] = [
      [process.env.STRIPE_PRICE_PRO_MONTHLY, 'PRO'],
      [process.env.STRIPE_PRICE_PRO_ANNUAL, 'PRO'],
      [process.env.STRIPE_PRICE_PREMIUM_MONTHLY, 'PREMIUM'],
      [process.env.STRIPE_PRICE_PREMIUM_ANNUAL, 'PREMIUM'],
    ];
    for (const [envPrice, plan] of map) {
      if (envPrice?.trim() === priceId) return plan;
    }
    return null;
  }

  /**
   * Crée une session Stripe Checkout pour un abonnement Pro/Premium.
   * Réutilise le customer Stripe existant de l'utilisateur (ou le crée).
   * Retourne l'URL de paiement hébergée par Stripe.
   */
  async createCheckoutSession(
    userId: string,
    plan: PaidPlan,
    interval: BillingInterval,
  ): Promise<string> {
    const stripe = this.getClient();
    const priceId = this.priceIdFor(plan, interval);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BillingError('Utilisateur introuvable.');

    // Garde anti-double abonnement : un abonné actif doit passer par le
    // portail client (changement d'offre) — pas par un nouveau checkout,
    // qui créerait une seconde souscription facturée en parallèle.
    if (user.stripeSubscriptionId && (user.plan === 'PRO' || user.plan === 'PREMIUM')) {
      throw new BillingError(
        'Vous avez déjà un abonnement actif. Gérez-le (ou changez d\'offre) depuis ' +
          'Paramètres → Abonnement.',
      );
    }

    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name ?? undefined,
        metadata: { userId },
      });
      customerId = customer.id;
      await prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId: customerId },
      });
      logger.info('Stripe customer created', { userId, customerId });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      success_url: `${this.frontendUrl()}/settings?checkout=success`,
      cancel_url: `${this.frontendUrl()}/pricing?checkout=cancelled`,
      metadata: { userId, plan },
      subscription_data: { metadata: { userId, plan } },
    });

    if (!session.url) throw new BillingError('Stripe n\'a pas retourné d\'URL de paiement.');
    logger.info('Checkout session created', { userId, plan, interval, sessionId: session.id });
    return session.url;
  }

  /** Portail client Stripe — gestion de l'abonnement, factures, annulation. */
  async createPortalSession(userId: string): Promise<string> {
    const stripe = this.getClient();

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user?.stripeCustomerId) {
      throw new BillingError("Aucun abonnement actif n'est associé à ce compte.");
    }

    const portal = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${this.frontendUrl()}/settings`,
    });

    logger.info('Billing portal session created', { userId });
    return portal.url;
  }

  /**
   * Traite un webhook Stripe (signature vérifiée avec STRIPE_WEBHOOK_SECRET).
   * C'est ici — et uniquement ici — que le plan de l'utilisateur change en DB.
   */
  async handleWebhook(rawBody: Buffer, signature: string): Promise<string> {
    const stripe = this.getClient();
    const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
    if (!secret) throw new BillingNotConfiguredError('STRIPE_WEBHOOK_SECRET missing');

    // Lève une erreur si la signature est invalide (le contrôleur répond 400).
    const event = stripe.webhooks.constructEvent(rawBody, signature, secret);
    logger.info('Stripe webhook received', { type: event.type, id: event.id });

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await this.activateFromCheckout(session);
        break;
      }
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        await this.syncFromSubscription(sub);
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        await this.downgradeFromSubscription(sub);
        break;
      }
      default:
        logger.debug('Stripe webhook ignored', { type: event.type });
    }

    return event.type;
  }

  // ─── Webhook handlers ───────────────────────────────────────────────────────

  private async activateFromCheckout(session: Stripe.Checkout.Session): Promise<void> {
    const plan = session.metadata?.['plan'];
    const user = await this.resolveUser(session.metadata?.['userId'], session.customer);
    if (!user || (plan !== 'PRO' && plan !== 'PREMIUM')) {
      logger.error('checkout.session.completed without resolvable user/plan', {
        sessionId: session.id,
        plan,
      });
      return;
    }

    const subscriptionId =
      typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        plan,
        stripeSubscriptionId: subscriptionId ?? null,
        subscriptionStartedAt: new Date(),
      },
    });
    logger.info('Plan activated from checkout', { userId: user.id, plan, subscriptionId });
  }

  private async syncFromSubscription(sub: Stripe.Subscription): Promise<void> {
    const user = await this.resolveUser(sub.metadata?.['userId'], sub.customer);
    if (!user) {
      logger.error('subscription.updated without resolvable user', { subscriptionId: sub.id });
      return;
    }

    // Statuts sans accès payant → retour au Freemium.
    if (['canceled', 'unpaid', 'incomplete_expired'].includes(sub.status)) {
      await this.setPlan(user.id, 'FREEMIUM', null);
      return;
    }
    if (sub.status !== 'active' && sub.status !== 'trialing') return;

    // Le price facturé fait foi (un changement d'offre via le portail client
    // met à jour le price mais PAS les metadata posées au checkout initial).
    const metaPlan = sub.metadata?.['plan'];
    const priceId = sub.items.data[0]?.price?.id;
    const planFromPrice = priceId ? this.planForPriceId(priceId) : null;
    const plan =
      planFromPrice ?? (metaPlan === 'PRO' || metaPlan === 'PREMIUM' ? metaPlan : null);

    if (!plan) {
      logger.error('subscription.updated with unknown plan/price', {
        subscriptionId: sub.id,
        priceId,
      });
      return;
    }
    await this.setPlan(user.id, plan, sub.id);
  }

  private async downgradeFromSubscription(sub: Stripe.Subscription): Promise<void> {
    const user = await this.resolveUser(sub.metadata?.['userId'], sub.customer);
    if (!user) {
      logger.error('subscription.deleted without resolvable user', { subscriptionId: sub.id });
      return;
    }
    await this.setPlan(user.id, 'FREEMIUM', null);
  }

  private async setPlan(userId: string, plan: Plan, subscriptionId: string | null): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { plan, stripeSubscriptionId: subscriptionId },
    });
    logger.info('Plan synced from Stripe webhook', { userId, plan });
  }

  /** Retrouve l'utilisateur par metadata.userId, sinon par customer Stripe. */
  private async resolveUser(
    metadataUserId: string | undefined,
    customer: string | Stripe.Customer | Stripe.DeletedCustomer | null,
  ) {
    if (metadataUserId) {
      const byId = await prisma.user.findUnique({ where: { id: metadataUserId } });
      if (byId) return byId;
    }
    const customerId = typeof customer === 'string' ? customer : customer?.id;
    if (customerId) {
      return prisma.user.findUnique({ where: { stripeCustomerId: customerId } });
    }
    return null;
  }
}

export const billingService = new BillingService();
