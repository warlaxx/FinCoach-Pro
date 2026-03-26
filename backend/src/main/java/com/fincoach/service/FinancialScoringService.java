package com.fincoach.service;

import com.fincoach.config.AppConstants;
import com.fincoach.dto.ScoreResult;
import com.fincoach.model.FinancialProfile;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static com.fincoach.util.NumberUtils.orZero;

@Service
public class FinancialScoringService {

    private static final Logger log = LoggerFactory.getLogger(FinancialScoringService.class);

    /**
     * Mutates the profile: sets savingsRate, debtRatio, and financialScore.
     * Called after every profile save so the stored grade stays up-to-date.
     */
    public void computeScores(FinancialProfile profile) {
        log.debug("Computing scores for userId={}", profile.getUserId());

        double totalIncome = orZero(profile.getMonthlyIncome()) + orZero(profile.getOtherIncome());
        double totalFixed = orZero(profile.getRent()) + orZero(profile.getUtilities())
                + orZero(profile.getInsurance()) + orZero(profile.getLoans())
                + orZero(profile.getSubscriptions());
        double totalVariable = orZero(profile.getFood()) + orZero(profile.getTransport())
                + orZero(profile.getLeisure()) + orZero(profile.getClothing())
                + orZero(profile.getHealth());
        double totalExpenses = totalFixed + totalVariable;
        double monthlySurplus = totalIncome - totalExpenses;

        // savingsRate stored as percentage (for KPI display)
        double savingsRate = totalIncome > 0 ? (monthlySurplus / totalIncome) * 100 : 0;
        // debtRatio stored as percentage of monthly income (for KPI display)
        double debtRatio = totalIncome > 0 ? (orZero(profile.getLoans()) / totalIncome) * 100 : 0;

        profile.setSavingsRate(Math.round(savingsRate * 10.0) / 10.0);
        profile.setDebtRatio(Math.round(debtRatio * 10.0) / 10.0);

        ScoreResult result = calculateScore(profile);
        profile.setFinancialScore(result.getGrade());

        log.info("Score computed for userId={} -> grade={} totalScore={} (savingsRate={}%, debtRatio={}%)",
                profile.getUserId(), result.getGrade(), result.getTotalScore(),
                profile.getSavingsRate(), profile.getDebtRatio());
    }

    /**
     * Calculates the full ScoreResult on-the-fly from a profile.
     * Safe to call with a null profile — returns grade "N/A".
     *
     * <p>Algorithm (weighted sum of four criteria):
     * <ul>
     *   <li>Savings rate    — 30%  (monthlySurplus / totalIncome)</li>
     *   <li>Debt/annual income — 25%  (totalDebt / totalIncome×12)</li>
     *   <li>Expense ratio   — 25%  (totalExpenses / totalIncome)</li>
     *   <li>Emergency fund  — 20%  (currentSavings / totalExpenses×3)</li>
     * </ul>
     * Each criterion scores 0, 25, 50, 75 or 100 pts before weighting.
     * Total maps to A(≥85) B(≥70) C(≥55) D(≥40) E(≥25) F(<25).
     */
    public ScoreResult calculateScore(FinancialProfile profile) {
        if (profile == null) {
            return ScoreResult.incomplete("Profil introuvable.");
        }

        double totalIncome = orZero(profile.getMonthlyIncome()) + orZero(profile.getOtherIncome());

        if (totalIncome <= 0) {
            log.debug("calculateScore: income=0 for userId={} -> N/A", profile.getUserId());
            return ScoreResult.incomplete("Revenus non renseignés — impossible de calculer le score.");
        }

        double totalFixed = orZero(profile.getRent()) + orZero(profile.getUtilities())
                + orZero(profile.getInsurance()) + orZero(profile.getLoans())
                + orZero(profile.getSubscriptions());
        double totalVariable = orZero(profile.getFood()) + orZero(profile.getTransport())
                + orZero(profile.getLeisure()) + orZero(profile.getClothing())
                + orZero(profile.getHealth());
        double totalExpenses = totalFixed + totalVariable;
        double monthlySurplus = totalIncome - totalExpenses;
        double currentSavings = orZero(profile.getCurrentSavings());
        double totalDebt = orZero(profile.getTotalDebt());

        // ── Criterion 1 : savings rate ────────────────────────────────────────
        int savingsScore = scoreSavingsRate(monthlySurplus / totalIncome);

        // ── Criterion 2 : total debt / annual income ──────────────────────────
        int debtScore = scoreDebtToAnnualIncome(totalDebt / (totalIncome * 12));

        // ── Criterion 3 : expense ratio ───────────────────────────────────────
        int expenseScore = scoreExpenseRatio(totalExpenses / totalIncome);

        // ── Criterion 4 : emergency fund (covers 3 months of expenses) ────────
        double emergencyRatio = totalExpenses > 0 ? currentSavings / (totalExpenses * 3) : 0;
        int emergencyScore = scoreEmergencyFund(emergencyRatio);

        // ── Weighted total ─────────────────────────────────────────────────────
        int totalScore = (int) Math.round(
                0.30 * savingsScore + 0.25 * debtScore + 0.25 * expenseScore + 0.20 * emergencyScore
        );

        String grade = gradeFromScore(totalScore);

        Map<String, Integer> breakdown = new LinkedHashMap<>();
        breakdown.put("savingsRate", savingsScore);
        breakdown.put("debtRatio", debtScore);
        breakdown.put("expenseRatio", expenseScore);
        breakdown.put("emergencyFund", emergencyScore);

        log.debug("calculateScore userId={}: savings={} debt={} expense={} emergency={} -> total={} grade={}",
                profile.getUserId(), savingsScore, debtScore, expenseScore, emergencyScore, totalScore, grade);

        return new ScoreResult(grade, totalScore, breakdown, messageForGrade(grade));
    }

    // ── Scoring helpers ───────────────────────────────────────────────────────

    /** Taux d'épargne : monthlySurplus / totalIncome */
    private int scoreSavingsRate(double rate) {
        if (rate >= 0.20) return 100;
        if (rate >= 0.10) return 75;
        if (rate >= 0.05) return 50;
        if (rate >= 0.00) return 25;
        return 0;
    }

    /** Ratio dettes / revenus annuels : totalDebt / (totalIncome × 12) */
    private int scoreDebtToAnnualIncome(double ratio) {
        if (ratio < 0.10) return 100;
        if (ratio < 0.30) return 75;
        if (ratio < 0.50) return 50;
        if (ratio < 0.70) return 25;
        return 0;
    }

    /** Ratio charges / revenus : totalExpenses / totalIncome */
    private int scoreExpenseRatio(double ratio) {
        if (ratio < 0.40) return 100;
        if (ratio < 0.50) return 75;
        if (ratio < 0.60) return 50;
        if (ratio < 0.70) return 25;
        return 0;
    }

    /** Épargne d'urgence : currentSavings / (totalExpenses × 3) */
    private int scoreEmergencyFund(double ratio) {
        if (ratio >= 1.00) return 100;
        if (ratio >= 0.50) return 75;
        if (ratio >= 0.25) return 50;
        if (ratio >= 0.10) return 25;
        return 0;
    }

    private String gradeFromScore(int score) {
        if (score >= AppConstants.GRADE_A) return "A";
        if (score >= AppConstants.GRADE_B) return "B";
        if (score >= AppConstants.GRADE_C) return "C";
        if (score >= AppConstants.GRADE_D) return "D";
        if (score >= AppConstants.GRADE_E) return "E";
        return "F";
    }

    private String messageForGrade(String grade) {
        return switch (grade) {
            case "A" -> "Excellent ! Votre santé financière est remarquable. Continuez ainsi.";
            case "B" -> "Bonne gestion ! Quelques ajustements pourraient vous faire atteindre l'excellence.";
            case "C" -> "Situation moyenne. Des améliorations ciblées vous permettront de progresser.";
            case "D" -> "Situation fragile. Prenez des mesures pour renforcer votre stabilité financière.";
            case "E" -> "Situation préoccupante. Agissez vite pour éviter une dégradation.";
            default  -> "Situation critique. Une restructuration complète de vos finances est nécessaire.";
        };
    }

    // ── Insights (unchanged) ──────────────────────────────────────────────────

    public List<String> generateInsights(FinancialProfile profile) {
        log.debug("Generating insights for userId={}", profile.getUserId());
        List<String> insights = new ArrayList<>();
        double totalIncome = orZero(profile.getMonthlyIncome()) + orZero(profile.getOtherIncome());
        double monthlySurplus = totalIncome - (orZero(profile.getRent()) + orZero(profile.getUtilities())
                + orZero(profile.getInsurance()) + orZero(profile.getLoans())
                + orZero(profile.getSubscriptions()) + orZero(profile.getFood())
                + orZero(profile.getTransport()) + orZero(profile.getLeisure())
                + orZero(profile.getClothing()) + orZero(profile.getHealth()));

        if (orZero(profile.getSavingsRate()) < AppConstants.INSIGHT_LOW_SAVINGS_RATE) {
            insights.add("Votre taux d'épargne est inférieur à 10%. Objectif recommandé : 20% minimum.");
        }
        if (orZero(profile.getDebtRatio()) > AppConstants.INSIGHT_HIGH_DEBT_RATIO) {
            insights.add("Vos remboursements de dettes dépassent 33% de vos revenus. Priorisez le désendettement.");
        }
        if (orZero(profile.getLeisure()) > totalIncome * AppConstants.INSIGHT_HIGH_LEISURE_RATIO) {
            insights.add("Vos dépenses loisirs représentent plus de 15% de vos revenus.");
        }
        if (orZero(profile.getCurrentSavings()) < totalIncome * AppConstants.INSIGHT_LOW_EMERGENCY_MONTHS) {
            insights.add("Votre fonds d'urgence couvre moins de 3 mois de revenus. Objectif : 6 mois.");
        }
        if (monthlySurplus > 0 && orZero(profile.getMonthlySavingsGoal()) == 0) {
            insights.add("Vous avez un surplus mensuel de " + (int) monthlySurplus + " €. Définissez un objectif d'épargne !");
        }
        if (orZero(profile.getSubscriptions()) > AppConstants.INSIGHT_HIGH_SUBSCRIPTIONS) {
            insights.add("Vous dépensez " + (int) orZero(profile.getSubscriptions()) + " € en abonnements. Passez-les en revue.");
        }

        if (insights.isEmpty()) {
            insights.add("Excellente gestion financière ! Pensez à optimiser vos placements.");
        }

        log.info("Generated {} insight(s) for userId={}", insights.size(), profile.getUserId());
        return insights;
    }
}
