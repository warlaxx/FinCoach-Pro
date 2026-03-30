import { CONSTANTS } from '../config/constants';
import { ScoreResult } from '../types';
import { FinancialProfile } from '@prisma/client';

type ProfileLike = Partial<FinancialProfile>;

/**
 * Financial scoring service — exact port of Java FinancialScoringService.java.
 *
 * Algorithm (weighted sum of four criteria):
 *   Savings rate       — 30%  (monthlySurplus / totalIncome)
 *   Debt/annual income — 25%  (totalDebt / totalIncome×12)
 *   Expense ratio      — 25%  (totalExpenses / totalIncome)
 *   Emergency fund     — 20%  (currentSavings / totalExpenses×3)
 *
 * Each criterion scores 0, 25, 50, 75 or 100 pts before weighting.
 * Total maps to A(≥85) B(≥70) C(≥55) D(≥40) E(≥25) F(<25).
 */
class ScoringService {
  private orZero(v: number | null | undefined): number {
    return v ?? 0;
  }

  /**
   * Computes and returns savingsRate, debtRatio, and financialScore.
   * Called after every profile save so the stored grade stays up-to-date.
   */
  computeScores(profile: ProfileLike): {
    savingsRate: number;
    debtRatio: number;
    financialScore: string;
  } {
    const totalIncome = this.orZero(profile.monthlyIncome) + this.orZero(profile.otherIncome);
    const totalFixed =
      this.orZero(profile.rent) +
      this.orZero(profile.utilities) +
      this.orZero(profile.insurance) +
      this.orZero(profile.loans) +
      this.orZero(profile.subscriptions);
    const totalVariable =
      this.orZero(profile.food) +
      this.orZero(profile.transport) +
      this.orZero(profile.leisure) +
      this.orZero(profile.clothing) +
      this.orZero(profile.health);
    const totalExpenses = totalFixed + totalVariable;
    const monthlySurplus = totalIncome - totalExpenses;

    const savingsRate = totalIncome > 0 ? (monthlySurplus / totalIncome) * 100 : 0;
    const debtRatio = totalIncome > 0 ? (this.orZero(profile.loans) / totalIncome) * 100 : 0;

    const result = this.calculateScore(profile);

    return {
      savingsRate: Math.round(savingsRate * 10) / 10,
      debtRatio: Math.round(debtRatio * 10) / 10,
      financialScore: result.grade,
    };
  }

  /**
   * Calculates the full ScoreResult on-the-fly.
   * Safe to call with an incomplete profile — returns grade "N/A".
   */
  calculateScore(profile: ProfileLike): ScoreResult & { grade: string } {
    const totalIncome = this.orZero(profile.monthlyIncome) + this.orZero(profile.otherIncome);

    if (totalIncome <= 0) {
      return {
        grade: 'N/A',
        totalScore: 0,
        breakdown: {},
        message: 'Revenus non renseignés — impossible de calculer le score.',
      };
    }

    const totalFixed =
      this.orZero(profile.rent) +
      this.orZero(profile.utilities) +
      this.orZero(profile.insurance) +
      this.orZero(profile.loans) +
      this.orZero(profile.subscriptions);
    const totalVariable =
      this.orZero(profile.food) +
      this.orZero(profile.transport) +
      this.orZero(profile.leisure) +
      this.orZero(profile.clothing) +
      this.orZero(profile.health);
    const totalExpenses = totalFixed + totalVariable;
    const monthlySurplus = totalIncome - totalExpenses;
    const currentSavings = this.orZero(profile.currentSavings);
    const totalDebt = this.orZero(profile.totalDebt);

    // Criterion 1: savings rate (monthlySurplus / totalIncome)
    const savingsScore = this.scoreSavingsRate(monthlySurplus / totalIncome);

    // Criterion 2: total debt / annual income
    const debtScore = this.scoreDebtToAnnualIncome(totalDebt / (totalIncome * 12));

    // Criterion 3: expense ratio (totalExpenses / totalIncome)
    const expenseScore = this.scoreExpenseRatio(totalExpenses / totalIncome);

    // Criterion 4: emergency fund (covers 3 months of expenses)
    const emergencyRatio = totalExpenses > 0 ? currentSavings / (totalExpenses * 3) : 0;
    const emergencyScore = this.scoreEmergencyFund(emergencyRatio);

    // Weighted total
    const totalScore = Math.round(
      0.3 * savingsScore + 0.25 * debtScore + 0.25 * expenseScore + 0.2 * emergencyScore,
    );

    const grade = this.gradeFromScore(totalScore);

    return {
      grade,
      totalScore,
      breakdown: {
        savingsRate: savingsScore,
        debtRatio: debtScore,
        expenseRatio: expenseScore,
        emergencyFund: emergencyScore,
      },
      message: this.messageForGrade(grade),
    };
  }

  generateInsights(profile: ProfileLike): string[] {
    const insights: string[] = [];
    const totalIncome = this.orZero(profile.monthlyIncome) + this.orZero(profile.otherIncome);
    const totalExpenses =
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
    const monthlySurplus = totalIncome - totalExpenses;

    if (this.orZero(profile.savingsRate) < CONSTANTS.INSIGHT_LOW_SAVINGS_RATE) {
      insights.push("Votre taux d'épargne est inférieur à 10%. Objectif recommandé : 20% minimum.");
    }
    if (this.orZero(profile.debtRatio) > CONSTANTS.INSIGHT_HIGH_DEBT_RATIO) {
      insights.push(
        'Vos remboursements de dettes dépassent 33% de vos revenus. Priorisez le désendettement.',
      );
    }
    if (this.orZero(profile.leisure) > totalIncome * CONSTANTS.INSIGHT_HIGH_LEISURE_RATIO) {
      insights.push('Vos dépenses loisirs représentent plus de 15% de vos revenus.');
    }
    if (this.orZero(profile.currentSavings) < totalIncome * CONSTANTS.INSIGHT_LOW_EMERGENCY_MONTHS) {
      insights.push(
        "Votre fonds d'urgence couvre moins de 3 mois de revenus. Objectif : 6 mois.",
      );
    }
    if (monthlySurplus > 0 && this.orZero(profile.monthlySavingsGoal) === 0) {
      insights.push(
        `Vous avez un surplus mensuel de ${Math.floor(monthlySurplus)} €. Définissez un objectif d'épargne !`,
      );
    }
    if (this.orZero(profile.subscriptions) > CONSTANTS.INSIGHT_HIGH_SUBSCRIPTIONS) {
      insights.push(
        `Vous dépensez ${Math.floor(this.orZero(profile.subscriptions))} € en abonnements. Passez-les en revue.`,
      );
    }

    if (insights.length === 0) {
      insights.push('Excellente gestion financière ! Pensez à optimiser vos placements.');
    }

    return insights;
  }

  // ─── Private scoring helpers ──────────────────────────────────────────────

  private scoreSavingsRate(rate: number): number {
    if (rate >= 0.2) return 100;
    if (rate >= 0.1) return 75;
    if (rate >= 0.05) return 50;
    if (rate >= 0.0) return 25;
    return 0;
  }

  private scoreDebtToAnnualIncome(ratio: number): number {
    if (ratio < 0.1) return 100;
    if (ratio < 0.3) return 75;
    if (ratio < 0.5) return 50;
    if (ratio < 0.7) return 25;
    return 0;
  }

  private scoreExpenseRatio(ratio: number): number {
    if (ratio < 0.4) return 100;
    if (ratio < 0.5) return 75;
    if (ratio < 0.6) return 50;
    if (ratio < 0.7) return 25;
    return 0;
  }

  private scoreEmergencyFund(ratio: number): number {
    if (ratio >= 1.0) return 100;
    if (ratio >= 0.5) return 75;
    if (ratio >= 0.25) return 50;
    if (ratio >= 0.1) return 25;
    return 0;
  }

  private gradeFromScore(score: number): string {
    if (score >= CONSTANTS.GRADE_A) return 'A';
    if (score >= CONSTANTS.GRADE_B) return 'B';
    if (score >= CONSTANTS.GRADE_C) return 'C';
    if (score >= CONSTANTS.GRADE_D) return 'D';
    if (score >= CONSTANTS.GRADE_E) return 'E';
    return 'F';
  }

  private messageForGrade(grade: string): string {
    const messages: Record<string, string> = {
      A: 'Excellent ! Votre santé financière est remarquable. Continuez ainsi.',
      B: 'Bonne gestion ! Quelques ajustements pourraient vous faire atteindre l\'excellence.',
      C: 'Situation moyenne. Des améliorations ciblées vous permettront de progresser.',
      D: 'Situation fragile. Prenez des mesures pour renforcer votre stabilité financière.',
      E: 'Situation préoccupante. Agissez vite pour éviter une dégradation.',
    };
    return messages[grade] ?? 'Situation critique. Une restructuration complète de vos finances est nécessaire.';
  }
}

export const scoringService = new ScoringService();
