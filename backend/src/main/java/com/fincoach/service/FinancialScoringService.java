package com.fincoach.service;

import com.fincoach.config.AppConstants;
import com.fincoach.model.FinancialProfile;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

import static com.fincoach.util.NumberUtils.orZero;

@Service
public class FinancialScoringService {

    private static final Logger log = LoggerFactory.getLogger(FinancialScoringService.class);

    public void computeScores(FinancialProfile profile) {
        log.debug("Computing scores for userId={}", profile.getUserId());

        double totalIncome = orZero(profile.getMonthlyIncome()) + orZero(profile.getOtherIncome());
        double totalFixed = orZero(profile.getRent()) + orZero(profile.getUtilities()) + orZero(profile.getInsurance())
                + orZero(profile.getLoans()) + orZero(profile.getSubscriptions());
        double totalVariable = orZero(profile.getFood()) + orZero(profile.getTransport()) + orZero(profile.getLeisure())
                + orZero(profile.getClothing()) + orZero(profile.getHealth());
        double totalExpenses = totalFixed + totalVariable;
        double monthlySurplus = totalIncome - totalExpenses;

        log.debug("userId={} - income={}€, fixedExpenses={}€, variableExpenses={}€, total={}€, surplus={}€",
                profile.getUserId(), totalIncome, totalFixed, totalVariable, totalExpenses, monthlySurplus);

        double savingsRate = totalIncome > 0 ? (monthlySurplus / totalIncome) * 100 : 0;
        double debtRatio = totalIncome > 0 ? (orZero(profile.getLoans()) / totalIncome) * 100 : 0;

        log.debug("userId={} - savingsRate={}%, debtRatio={}%", profile.getUserId(), savingsRate, debtRatio);

        profile.setSavingsRate(Math.round(savingsRate * 10.0) / 10.0);
        profile.setDebtRatio(Math.round(debtRatio * 10.0) / 10.0);

        String score = computeScore(savingsRate, debtRatio, profile.getCurrentSavings(), totalIncome);
        profile.setFinancialScore(score);
        log.info("Financial score computed for userId={} -> {} (savingsRate={}%, debtRatio={}%)",
                profile.getUserId(), score, profile.getSavingsRate(), profile.getDebtRatio());
    }

    public String computeScore(double savingsRate, double debtRatio, Double savings, double income) {
        int score = 0;

        // Savings rate contributes up to 40 points
        if (savingsRate >= AppConstants.SAVINGS_RATE_EXCELLENT) {
            score += 40;
            log.debug("Savings rate {}% >= {}% -> +40 pts", savingsRate, AppConstants.SAVINGS_RATE_EXCELLENT);
        } else if (savingsRate >= AppConstants.SAVINGS_RATE_GOOD) {
            score += 30;
            log.debug("Savings rate {}% >= {}% -> +30 pts", savingsRate, AppConstants.SAVINGS_RATE_GOOD);
        } else if (savingsRate >= AppConstants.SAVINGS_RATE_FAIR) {
            score += 15;
            log.debug("Savings rate {}% >= {}% -> +15 pts", savingsRate, AppConstants.SAVINGS_RATE_FAIR);
        } else if (savingsRate >= 0) {
            score += 5;
            log.debug("Savings rate {}% >= 0% -> +5 pts", savingsRate);
        } else {
            log.debug("Savings rate {}% is negative (spending > income) -> +0 pts", savingsRate);
        }

        // Debt ratio contributes up to 30 points
        if (debtRatio <= AppConstants.DEBT_RATIO_HEALTHY) {
            score += 30;
            log.debug("Debt ratio {}% <= {}% -> +30 pts", debtRatio, AppConstants.DEBT_RATIO_HEALTHY);
        } else if (debtRatio <= AppConstants.DEBT_RATIO_ACCEPTABLE) {
            score += 20;
            log.debug("Debt ratio {}% <= {}% -> +20 pts", debtRatio, AppConstants.DEBT_RATIO_ACCEPTABLE);
        } else if (debtRatio <= AppConstants.DEBT_RATIO_HIGH) {
            score += 10;
            log.debug("Debt ratio {}% <= {}% -> +10 pts", debtRatio, AppConstants.DEBT_RATIO_HIGH);
        } else {
            log.debug("Debt ratio {}% > {}% -> +0 pts", debtRatio, AppConstants.DEBT_RATIO_HIGH);
        }

        // Emergency fund contributes up to 30 points
        double monthsReserve = income > 0 && savings != null ? savings / income : 0;
        if (monthsReserve >= AppConstants.EMERGENCY_FUND_FULL) {
            score += 30;
            log.debug("Emergency fund covers {} months >= {} -> +30 pts", monthsReserve, AppConstants.EMERGENCY_FUND_FULL);
        } else if (monthsReserve >= AppConstants.EMERGENCY_FUND_DECENT) {
            score += 20;
            log.debug("Emergency fund covers {} months >= {} -> +20 pts", monthsReserve, AppConstants.EMERGENCY_FUND_DECENT);
        } else if (monthsReserve >= AppConstants.EMERGENCY_FUND_MINIMAL) {
            score += 10;
            log.debug("Emergency fund covers {} months >= {} -> +10 pts", monthsReserve, AppConstants.EMERGENCY_FUND_MINIMAL);
        } else {
            log.debug("Emergency fund covers {} months < {} -> +0 pts", monthsReserve, AppConstants.EMERGENCY_FUND_MINIMAL);
        }

        log.debug("Total score points: {}/100", score);

        if (score >= AppConstants.GRADE_A) return "A";
        if (score >= AppConstants.GRADE_B) return "B";
        if (score >= AppConstants.GRADE_C) return "C";
        if (score >= AppConstants.GRADE_D) return "D";
        return "F";
    }

    public List<String> generateInsights(FinancialProfile profile) {
        log.debug("Generating insights for userId={}", profile.getUserId());
        List<String> insights = new ArrayList<>();
        double totalIncome = orZero(profile.getMonthlyIncome()) + orZero(profile.getOtherIncome());
        double monthlySurplus = totalIncome - (orZero(profile.getRent()) + orZero(profile.getUtilities()) + orZero(profile.getInsurance())
                + orZero(profile.getLoans()) + orZero(profile.getSubscriptions()) + orZero(profile.getFood())
                + orZero(profile.getTransport()) + orZero(profile.getLeisure()) + orZero(profile.getClothing()) + orZero(profile.getHealth()));

        if (orZero(profile.getSavingsRate()) < AppConstants.INSIGHT_LOW_SAVINGS_RATE) {
            insights.add("Votre taux d'épargne est inférieur à 10%. Objectif recommandé : 20% minimum.");
            log.debug("Insight triggered: low savings rate ({}%)", profile.getSavingsRate());
        }
        if (orZero(profile.getDebtRatio()) > AppConstants.INSIGHT_HIGH_DEBT_RATIO) {
            insights.add("Vos remboursements de dettes dépassent 33% de vos revenus. Priorisez le désendettement.");
            log.debug("Insight triggered: high debt ratio ({}%)", profile.getDebtRatio());
        }
        if (orZero(profile.getLeisure()) > totalIncome * AppConstants.INSIGHT_HIGH_LEISURE_RATIO) {
            insights.add("Vos dépenses loisirs représentent plus de 15% de vos revenus.");
            log.debug("Insight triggered: high leisure spending ({}€ vs max {}€)", profile.getLeisure(), totalIncome * AppConstants.INSIGHT_HIGH_LEISURE_RATIO);
        }
        if (orZero(profile.getCurrentSavings()) < totalIncome * AppConstants.INSIGHT_LOW_EMERGENCY_MONTHS) {
            insights.add("Votre fonds d'urgence couvre moins de 3 mois de revenus. Objectif : 6 mois.");
            log.debug("Insight triggered: insufficient emergency fund ({}€ vs target {}€)", profile.getCurrentSavings(), totalIncome * AppConstants.INSIGHT_LOW_EMERGENCY_MONTHS);
        }
        if (monthlySurplus > 0 && orZero(profile.getMonthlySavingsGoal()) == 0) {
            insights.add("Vous avez un surplus mensuel de " + (int) monthlySurplus + " €. Définissez un objectif d'épargne !");
            log.debug("Insight triggered: surplus without savings goal (surplus={}€)", monthlySurplus);
        }
        if (orZero(profile.getSubscriptions()) > AppConstants.INSIGHT_HIGH_SUBSCRIPTIONS) {
            insights.add("Vous dépensez " + (int) orZero(profile.getSubscriptions()) + " € en abonnements. Passez-les en revue.");
            log.debug("Insight triggered: high subscriptions cost ({}€)", profile.getSubscriptions());
        }

        if (insights.isEmpty()) {
            insights.add("Excellente gestion financière ! Pensez à optimiser vos placements.");
            log.debug("No negative insights for userId={} - financial health looks good", profile.getUserId());
        }

        log.info("Generated {} insight(s) for userId={}", insights.size(), profile.getUserId());
        return insights;
    }

}