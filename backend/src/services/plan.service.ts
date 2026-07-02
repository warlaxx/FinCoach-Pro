import prisma from '../config/database';
import { CONSTANTS } from '../config/constants';
import { createLogger } from '../utils/logger';

const logger = createLogger('PlanService');

export type Plan = 'FREEMIUM' | 'PRO' | 'PREMIUM';

/**
 * Thrown when an action would exceed the quota of the user's current plan.
 * Controllers translate this into a { success: false, code: 'UPGRADE_REQUIRED' }
 * response so the frontend can display an upgrade CTA.
 */
export class QuotaExceededError extends Error {
  readonly code = 'UPGRADE_REQUIRED';

  constructor(message: string, public readonly requiredPlan: Plan) {
    super(message);
    this.name = 'QuotaExceededError';
  }
}

/**
 * Subscription plan service — TICKET-16.
 *
 * Reads the user's plan from the database (source of truth — never from the JWT,
 * which may be up to 24h stale) and enforces the per-plan quotas:
 *
 *   Feature        | FREEMIUM | PRO      | PREMIUM
 *   ---------------|----------|----------|--------
 *   Action plans   | 3 max    | illimité | illimité
 *   Messages IA    | 10/jour  | 100/jour | illimité
 */
class PlanService {
  async getUserPlan(userId: string): Promise<Plan> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true },
    });
    const plan = (user?.plan ?? 'FREEMIUM').toUpperCase();
    return plan === 'PRO' || plan === 'PREMIUM' ? plan : 'FREEMIUM';
  }

  /**
   * Throws QuotaExceededError if creating one more action plan would exceed
   * the user's plan limit. Pro and Premium are unlimited.
   */
  async assertCanCreateActionPlan(userId: string): Promise<void> {
    const plan = await this.getUserPlan(userId);
    if (plan !== 'FREEMIUM') return;

    const count = await prisma.actionPlan.count({ where: { userId } });
    if (count >= CONSTANTS.PLAN_FREEMIUM_MAX_ACTION_PLANS) {
      logger.info('Action plan quota reached', { userId, plan, count });
      throw new QuotaExceededError(
        `Le plan Freemium est limité à ${CONSTANTS.PLAN_FREEMIUM_MAX_ACTION_PLANS} objectifs. ` +
          'Passez au plan Pro pour créer des objectifs illimités.',
        'PRO',
      );
    }
  }

  /**
   * Throws QuotaExceededError if the user has already sent their daily quota
   * of AI messages. Premium is unlimited.
   */
  async assertCanSendChatMessage(userId: string): Promise<void> {
    const plan = await this.getUserPlan(userId);
    if (plan === 'PREMIUM') return;

    const limit =
      plan === 'PRO'
        ? CONSTANTS.PLAN_PRO_DAILY_CHAT_MESSAGES
        : CONSTANTS.PLAN_FREEMIUM_DAILY_CHAT_MESSAGES;

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const sentToday = await prisma.chatMessage.count({
      where: { userId, role: 'user', createdAt: { gte: startOfDay } },
    });

    if (sentToday >= limit) {
      logger.info('Daily chat quota reached', { userId, plan, sentToday, limit });
      throw new QuotaExceededError(
        plan === 'PRO'
          ? `Vous avez atteint votre limite de ${limit} messages IA aujourd'hui. ` +
            'Passez au plan Premium pour des conversations illimitées.'
          : `Le plan Freemium est limité à ${limit} messages IA par jour. ` +
            'Passez au plan Pro pour continuer la conversation.',
        plan === 'PRO' ? 'PREMIUM' : 'PRO',
      );
    }
  }

  /**
   * Remaining auto-generated action plan slots for the user (used by
   * generateFromProfile so auto-generation also respects the Freemium cap).
   * Returns Infinity for Pro/Premium.
   */
  async remainingActionPlanSlots(userId: string): Promise<number> {
    const plan = await this.getUserPlan(userId);
    if (plan !== 'FREEMIUM') return Infinity;
    const count = await prisma.actionPlan.count({ where: { userId } });
    return Math.max(0, CONSTANTS.PLAN_FREEMIUM_MAX_ACTION_PLANS - count);
  }
}

export const planService = new PlanService();
