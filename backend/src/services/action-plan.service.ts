import prisma from '../config/database';
import { CONSTANTS } from '../config/constants';
import { planService } from './plan.service';
import { ActionPlan, FinancialProfile, Prisma } from '@prisma/client';
import { ActionPlanPayload } from '../types';

/**
 * Action plan service — exact port of Java ActionPlanService.java.
 */
class ActionPlanService {
  private orZero(v: number | null | undefined): number {
    return v ?? 0;
  }

  async getActionsForUser(userId: string): Promise<ActionPlan[]> {
    return prisma.actionPlan.findMany({
      where: { userId },
      orderBy: [{ deadline: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async findById(id: bigint): Promise<ActionPlan | null> {
    return prisma.actionPlan.findUnique({ where: { id } });
  }

  async create(userId: string, payload: ActionPlanPayload): Promise<ActionPlan> {
    const action = await prisma.actionPlan.create({
      data: {
        userId,
        title: payload.title,
        description: payload.description,
        category: payload.category,
        priority: payload.priority ?? 'MOYENNE',
        status: 'EN_COURS',
        targetAmount: payload.targetAmount,
        currentAmount: payload.currentAmount ?? 0,
        deadline: payload.deadline ? new Date(payload.deadline) : undefined,
      },
    });
    return this.autoComplete(action);
  }

  async updateStatus(
    id: bigint,
    status?: string,
    currentAmount?: number,
    explicitStatus = false,
  ): Promise<ActionPlan> {
    const existing = await prisma.actionPlan.findUniqueOrThrow({ where: { id } });

    const updatedCurrentAmount = currentAmount !== undefined ? currentAmount : this.orZero(existing.currentAmount);
    const updatedStatus = status ?? existing.status;

    const action = await prisma.actionPlan.update({
      where: { id },
      data: {
        status: updatedStatus,
        currentAmount: updatedCurrentAmount,
      },
    });

    if (!explicitStatus) {
      return this.autoComplete(action);
    }
    return action;
  }

  async deleteById(id: bigint): Promise<void> {
    await prisma.actionPlan.delete({ where: { id } });
  }

  async buildStats(userId: string): Promise<Record<string, unknown>> {
    const all = await this.getActionsForUser(userId);
    const total = all.length;
    const done = all.filter((a) => a.status === 'TERMINE').length;
    const inProgress = all.filter((a) => a.status === 'EN_COURS').length;

    return {
      totalActions: total,
      completedActions: done,
      inProgressActions: inProgress,
      completionRate: total > 0 ? Math.round((done / total) * 1000) / 10 : 0,
    };
  }

  toResponse(action: ActionPlan): Record<string, unknown> {
    let progressPercent = 0;
    if (action.targetAmount && action.targetAmount > 0 && action.currentAmount !== null) {
      progressPercent = Math.min(100, (this.orZero(action.currentAmount) / action.targetAmount) * 100);
    }

    return {
      id: action.id.toString(),
      userId: action.userId,
      title: action.title,
      description: action.description,
      category: action.category,
      priority: action.priority,
      status: action.status,
      targetAmount: action.targetAmount,
      currentAmount: action.currentAmount,
      progressPercent: Math.round(progressPercent * 10) / 10,
      deadline: action.deadline,
      createdAt: action.createdAt,
    };
  }

  /**
   * Auto-generates action plans based on the user's financial profile.
   * Each action is created only once (checked by title uniqueness per user).
   * Exact port of Java ActionPlanService.generateFromProfile().
   */
  async generateFromProfile(profile: FinancialProfile): Promise<void> {
    const totalIncome = this.orZero(profile.monthlyIncome) + this.orZero(profile.otherIncome);
    const toCreate: Prisma.ActionPlanCreateManyInput[] = [];

    const existingTitles = await prisma.actionPlan
      .findMany({ where: { userId: profile.userId }, select: { title: true } })
      .then((rows) => new Set(rows.map((r) => r.title)));

    const today = new Date();
    const addMonths = (d: Date, m: number): Date => {
      const r = new Date(d);
      r.setMonth(r.getMonth() + m);
      return r;
    };
    const addWeeks = (d: Date, w: number): Date => {
      const r = new Date(d);
      r.setDate(r.getDate() + w * 7);
      return r;
    };

    // 1. Savings rate < 10%
    if (
      this.orZero(profile.savingsRate) < CONSTANTS.ACTION_SAVINGS_TRIGGER_RATE &&
      totalIncome > 0 &&
      !existingTitles.has("Atteindre 10% de taux d'épargne")
    ) {
      toCreate.push({
        userId: profile.userId,
        title: "Atteindre 10% de taux d'épargne",
        description: `Mettez en place un virement automatique dès réception du salaire. Objectif : épargner ${Math.floor(totalIncome * 0.1)} €/mois.`,
        category: 'EPARGNE',
        priority: 'HAUTE',
        status: 'EN_COURS',
        targetAmount: totalIncome * 0.1 * 12,
        currentAmount: 0,
        deadline: addMonths(today, 6),
      });
    }

    // 2. Emergency fund < 3 months of income
    if (
      this.orZero(profile.currentSavings) < totalIncome * CONSTANTS.ACTION_EMERGENCY_FUND_MONTHS &&
      !existingTitles.has("Constituer un fonds d'urgence (3 mois)")
    ) {
      toCreate.push({
        userId: profile.userId,
        title: "Constituer un fonds d'urgence (3 mois)",
        description: `Objectif : ${Math.floor(totalIncome * CONSTANTS.ACTION_EMERGENCY_FUND_MONTHS)} € sur Livret A. Ce coussin vous protège des imprévus.`,
        category: 'EPARGNE',
        priority: 'HAUTE',
        status: 'EN_COURS',
        targetAmount: totalIncome * CONSTANTS.ACTION_EMERGENCY_FUND_MONTHS,
        currentAmount: this.orZero(profile.currentSavings),
        deadline: addMonths(today, 12),
      });
    }

    // 3. Debt ratio > 25%
    if (
      this.orZero(profile.debtRatio) > CONSTANTS.ACTION_DEBT_RATIO_TRIGGER &&
      !existingTitles.has("Réduire le ratio d'endettement")
    ) {
      toCreate.push({
        userId: profile.userId,
        title: "Réduire le ratio d'endettement",
        description:
          "Votre taux d'endettement dépasse 25%. Appliquez la méthode avalanche : remboursez en priorité la dette au taux le plus élevé.",
        category: 'DETTE',
        priority: 'HAUTE',
        status: 'EN_COURS',
        targetAmount: this.orZero(profile.totalDebt) * 0.3,
        currentAmount: 0,
        deadline: addMonths(today, 18),
      });
    }

    // 4. Subscriptions > €60/month
    if (
      this.orZero(profile.subscriptions) > CONSTANTS.ACTION_SUBSCRIPTIONS_THRESHOLD &&
      !existingTitles.has('Auditer vos abonnements')
    ) {
      toCreate.push({
        userId: profile.userId,
        title: 'Auditer vos abonnements',
        description: `Listez tous vos abonnements et supprimez ceux que vous utilisez peu. Potentiel d'économie : ${Math.floor(this.orZero(profile.subscriptions) * 0.3)} €/mois.`,
        category: 'BUDGET',
        priority: 'MOYENNE',
        status: 'EN_COURS',
        targetAmount: this.orZero(profile.subscriptions) * 0.3 * 12,
        currentAmount: 0,
        deadline: addWeeks(today, 2),
      });
    }

    if (toCreate.length > 0) {
      // Auto-generation also respects the Freemium cap (TICKET-16): never push
      // a Freemium user beyond their max simultaneous action plans.
      const slots = await planService.remainingActionPlanSlots(profile.userId);
      const capped = Number.isFinite(slots) ? toCreate.slice(0, slots) : toCreate;
      if (capped.length > 0) {
        await prisma.actionPlan.createMany({ data: capped });
        console.log(`[ActionPlanService] ${capped.length} action(s) generated for userId=${profile.userId}`);
      }
    }
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private async autoComplete(action: ActionPlan): Promise<ActionPlan> {
    if (
      action.targetAmount &&
      action.targetAmount > 0 &&
      action.currentAmount !== null &&
      this.orZero(action.currentAmount) >= action.targetAmount &&
      action.status !== 'TERMINE'
    ) {
      return prisma.actionPlan.update({
        where: { id: action.id },
        data: { status: 'TERMINE' },
      });
    }
    return action;
  }
}

export const actionPlanService = new ActionPlanService();
