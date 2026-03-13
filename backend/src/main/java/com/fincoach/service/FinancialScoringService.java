package com.fincoach.service;

import com.fincoach.model.FinancialProfile;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class FinancialScoringService {

    private static final Logger log = LoggerFactory.getLogger(FinancialScoringService.class);

    public void computeScores(FinancialProfile p) {
        log.debug("Computing scores for userId={}", p.getUserId());

        double totalIncome = safe(p.getMonthlyIncome()) + safe(p.getOtherIncome());
        double totalFixed = safe(p.getRent()) + safe(p.getUtilities()) + safe(p.getInsurance())
                + safe(p.getLoans()) + safe(p.getSubscriptions());
        double totalVariable = safe(p.getFood()) + safe(p.getTransport()) + safe(p.getLeisure())
                + safe(p.getClothing()) + safe(p.getHealth());
        double total = totalFixed + totalVariable;
        double surplus = totalIncome - total;

        log.debug("userId={} - income={}€, fixedExpenses={}€, variableExpenses={}€, total={}€, surplus={}€",
                p.getUserId(), totalIncome, totalFixed, totalVariable, total, surplus);

        double savingsRate = totalIncome > 0 ? (surplus / totalIncome) * 100 : 0;
        double debtRatio = totalIncome > 0 ? (safe(p.getLoans()) / totalIncome) * 100 : 0;

        log.debug("userId={} - savingsRate={}%, debtRatio={}%", p.getUserId(), savingsRate, debtRatio);

        p.setSavingsRate(Math.round(savingsRate * 10.0) / 10.0);
        p.setDebtRatio(Math.round(debtRatio * 10.0) / 10.0);

        String score = computeScore(savingsRate, debtRatio, p.getCurrentSavings(), totalIncome);
        p.setFinancialScore(score);
        log.info("Financial score computed for userId={} -> {} (savingsRate={}%, debtRatio={}%)",
                p.getUserId(), score, p.getSavingsRate(), p.getDebtRatio());
    }

    public String computeScore(double savingsRate, double debtRatio, Double savings, double income) {
        int score = 0;

        // Savings rate contributes up to 40 points
        if (savingsRate >= 20) {
            score += 40;
            log.debug("Savings rate {}% >= 20% -> +40 pts", savingsRate);
        } else if (savingsRate >= 10) {
            score += 30;
            log.debug("Savings rate {}% >= 10% -> +30 pts", savingsRate);
        } else if (savingsRate >= 5) {
            score += 15;
            log.debug("Savings rate {}% >= 5% -> +15 pts", savingsRate);
        } else if (savingsRate >= 0) {
            score += 5;
            log.debug("Savings rate {}% >= 0% -> +5 pts", savingsRate);
        } else {
            log.debug("Savings rate {}% is negative (spending > income) -> +0 pts", savingsRate);
        }

        // Debt ratio contributes up to 30 points
        if (debtRatio <= 15) {
            score += 30;
            log.debug("Debt ratio {}% <= 15% -> +30 pts", debtRatio);
        } else if (debtRatio <= 25) {
            score += 20;
            log.debug("Debt ratio {}% <= 25% -> +20 pts", debtRatio);
        } else if (debtRatio <= 33) {
            score += 10;
            log.debug("Debt ratio {}% <= 33% -> +10 pts", debtRatio);
        } else {
            log.debug("Debt ratio {}% > 33% -> +0 pts", debtRatio);
        }

        // Emergency fund contributes up to 30 points
        double monthsReserve = income > 0 && savings != null ? savings / income : 0;
        if (monthsReserve >= 6) {
            score += 30;
            log.debug("Emergency fund covers {} months >= 6 -> +30 pts", monthsReserve);
        } else if (monthsReserve >= 3) {
            score += 20;
            log.debug("Emergency fund covers {} months >= 3 -> +20 pts", monthsReserve);
        } else if (monthsReserve >= 1) {
            score += 10;
            log.debug("Emergency fund covers {} months >= 1 -> +10 pts", monthsReserve);
        } else {
            log.debug("Emergency fund covers {} months < 1 -> +0 pts", monthsReserve);
        }

        log.debug("Total score points: {}/100", score);

        if (score >= 80) return "A";
        if (score >= 60) return "B";
        if (score >= 40) return "C";
        if (score >= 20) return "D";
        return "F";
    }

    public List<String> generateInsights(FinancialProfile p) {
        log.debug("Generating insights for userId={}", p.getUserId());
        List<String> insights = new ArrayList<>();
        double income = safe(p.getMonthlyIncome()) + safe(p.getOtherIncome());
        double surplus = income - (safe(p.getRent()) + safe(p.getUtilities()) + safe(p.getInsurance())
                + safe(p.getLoans()) + safe(p.getSubscriptions()) + safe(p.getFood())
                + safe(p.getTransport()) + safe(p.getLeisure()) + safe(p.getClothing()) + safe(p.getHealth()));

        if (safe(p.getSavingsRate()) < 10) {
            insights.add("Votre taux d'épargne est inférieur à 10%. Objectif recommandé : 20% minimum.");
            log.debug("Insight triggered: low savings rate ({}%)", p.getSavingsRate());
        }
        if (safe(p.getDebtRatio()) > 33) {
            insights.add("Vos remboursements de dettes dépassent 33% de vos revenus. Priorisez le désendettement.");
            log.debug("Insight triggered: high debt ratio ({}%)", p.getDebtRatio());
        }
        if (safe(p.getLeisure()) > income * 0.15) {
            insights.add("Vos dépenses loisirs représentent plus de 15% de vos revenus.");
            log.debug("Insight triggered: high leisure spending ({}€ vs max {}€)", p.getLeisure(), income * 0.15);
        }
        if (safe(p.getCurrentSavings()) < income * 3) {
            insights.add("Votre fonds d'urgence couvre moins de 3 mois de revenus. Objectif : 6 mois.");
            log.debug("Insight triggered: insufficient emergency fund ({}€ vs target {}€)", p.getCurrentSavings(), income * 3);
        }
        if (surplus > 0 && safe(p.getMonthlySavingsGoal()) == 0) {
            insights.add("Vous avez un surplus mensuel de " + (int) surplus + " €. Définissez un objectif d'épargne !");
            log.debug("Insight triggered: surplus without savings goal (surplus={}€)", surplus);
        }
        if (safe(p.getSubscriptions()) > 50) {
            insights.add("Vous dépensez " + (int) safe(p.getSubscriptions()) + " € en abonnements. Passez-les en revue.");
            log.debug("Insight triggered: high subscriptions cost ({}€)", p.getSubscriptions());
        }

        if (insights.isEmpty()) {
            insights.add("Excellente gestion financière ! Pensez à optimiser vos placements.");
            log.debug("No negative insights for userId={} - financial health looks good", p.getUserId());
        }

        log.info("Generated {} insight(s) for userId={}", insights.size(), p.getUserId());
        return insights;
    }

    private double safe(Double v) {
        return v == null ? 0.0 : v;
    }
}
