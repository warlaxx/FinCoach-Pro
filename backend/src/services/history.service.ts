import prisma from '../config/database';
import { FinancialHistory, FinancialProfile } from '@prisma/client';
import { createLogger } from '../utils/logger';

const logger = createLogger('HistoryService');

/** Numeric value of a letter grade for charting (A=100 … F=10). */
const SCORE_VALUES: Record<string, number> = {
  A: 100,
  B: 80,
  C: 60,
  D: 40,
  E: 20,
  F: 10,
};

/**
 * Financial history service — TICKET-09.
 *
 * Records one snapshot of the financial profile per user per month
 * (upsert on the V7 unique constraint user_id + month) so the dashboard
 * can chart the evolution of income, expenses, savings, debt and score.
 */
class HistoryService {
  private orZero(v: number | null | undefined): number {
    return v ?? 0;
  }

  /** First day of the current month, at UTC midnight (matches the DATE column). */
  private currentMonth(): Date {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  }

  /**
   * Creates or refreshes this month's snapshot from a freshly saved profile.
   * Never throws — a snapshot failure must not break the profile save.
   */
  async recordSnapshot(profile: FinancialProfile): Promise<void> {
    const income = this.orZero(profile.monthlyIncome) + this.orZero(profile.otherIncome);
    const expenses =
      this.orZero(profile.rent) +
      this.orZero(profile.utilities) +
      this.orZero(profile.insurance) +
      this.orZero(profile.loans) +
      this.orZero(profile.subscriptions) +
      this.orZero(profile.food) +
      this.orZero(profile.transport) +
      this.orZero(profile.leisure) +
      this.orZero(profile.clothing) +
      this.orZero(profile.health);

    const month = this.currentMonth();
    const data = {
      income,
      expenses,
      savings: this.orZero(profile.currentSavings),
      debt: this.orZero(profile.totalDebt),
      score: profile.financialScore,
    };

    try {
      await prisma.financialHistory.upsert({
        where: { userId_month: { userId: profile.userId, month } },
        update: data,
        create: { userId: profile.userId, month, ...data },
      });
      logger.debug('Financial snapshot recorded', {
        userId: profile.userId,
        month: month.toISOString().slice(0, 10),
        score: data.score,
      });
    } catch (err) {
      logger.error('Failed to record financial snapshot — profile save unaffected', {
        userId: profile.userId,
        error: (err as Error).message,
      });
    }
  }

  /** Returns the last `months` snapshots, oldest first. */
  async getHistory(userId: string, months: number): Promise<FinancialHistory[]> {
    const rows = await prisma.financialHistory.findMany({
      where: { userId },
      orderBy: { month: 'desc' },
      take: months,
    });
    return rows.reverse();
  }

  toResponse(row: FinancialHistory): Record<string, unknown> {
    const grade = row.score?.toUpperCase() ?? null;
    return {
      month: row.month.toISOString().slice(0, 10),
      income: row.income,
      expenses: row.expenses,
      savings: row.savings,
      debt: row.debt,
      score: grade,
      scoreValue: grade ? SCORE_VALUES[grade] ?? null : null,
    };
  }
}

export const historyService = new HistoryService();
