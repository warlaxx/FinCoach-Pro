package com.fincoach.service;

import com.fincoach.model.FinancialProfile;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class FinancialScoringService {

    public void computeScores(FinancialProfile p) {
        double totalIncome = safe(p.getMonthlyIncome()) + safe(p.getOtherIncome());
        double totalFixed = safe(p.getRent()) + safe(p.getUtilities()) + safe(p.getInsurance())
                + safe(p.getLoans()) + safe(p.getSubscriptions());
        double totalVariable = safe(p.getFood()) + safe(p.getTransport()) + safe(p.getLeisure())
                + safe(p.getClothing()) + safe(p.getHealth());
        double total = totalFixed + totalVariable;
        double surplus = totalIncome - total;

        double savingsRate = totalIncome > 0 ? (surplus / totalIncome) * 100 : 0;
        double debtRatio = totalIncome > 0 ? (safe(p.getLoans()) / totalIncome) * 100 : 0;

        p.setSavingsRate(Math.round(savingsRate * 10.0) / 10.0);
        p.setDebtRatio(Math.round(debtRatio * 10.0) / 10.0);
        p.setFinancialScore(computeScore(savingsRate, debtRatio, p.getCurrentSavings(), totalIncome));
    }

    public String computeScore(double savingsRate, double debtRatio, Double savings, double income) {
        int score = 0;

        // Savings rate (0-40 pts)
        if (savingsRate >= 20)
            score += 40;
        else if (savingsRate >= 10)
            score += 30;
        else if (savingsRate >= 5)
            score += 15;
        else if (savingsRate >= 0)
            score += 5;

        // Debt ratio (0-30 pts)
        if (debtRatio <= 15)
            score += 30;
        else if (debtRatio <= 25)
            score += 20;
        else if (debtRatio <= 33)
            score += 10;

        // Emergency fund (0-30 pts)
        double monthsReserve = income > 0 && savings != null ? savings / income : 0;
        if (monthsReserve >= 6)
            score += 30;
        else if (monthsReserve >= 3)
            score += 20;
        else if (monthsReserve >= 1)
            score += 10;

        if (score >= 80)
            return "A";
        if (score >= 60)
            return "B";
        if (score >= 40)
            return "C";
        if (score >= 20)
            return "D";
        return "F";
    }

    public List<String> generateInsights(FinancialProfile p) {
        List<String> insights = new ArrayList<>();
        double income = safe(p.getMonthlyIncome()) + safe(p.getOtherIncome());
        double surplus = income - (safe(p.getRent()) + safe(p.getUtilities()) + safe(p.getInsurance())
                + safe(p.getLoans()) + safe(p.getSubscriptions()) + safe(p.getFood())
                + safe(p.getTransport()) + safe(p.getLeisure()) + safe(p.getClothing()) + safe(p.getHealth()));

        if (safe(p.getSavingsRate()) < 10)
            insights.add("Votre taux d'épargne est inférieur à 10%. Objectif recommandé : 20% minimum.");
        if (safe(p.getDebtRatio()) > 33)
            insights.add("Vos remboursements de dettes dépassent 33% de vos revenus. Priorisez le désendettement.");
        if (safe(p.getLeisure()) > income * 0.15)
            insights.add("Vos dépenses loisirs représentent plus de 15% de vos revenus.");
        if (safe(p.getCurrentSavings()) < income * 3)
            insights.add("Votre fonds d'urgence couvre moins de 3 mois de revenus. Objectif : 6 mois.");
        if (surplus > 0 && safe(p.getMonthlySavingsGoal()) == 0)
            insights.add("Vous avez un surplus mensuel de " + (int) surplus + " €. Définissez un objectif d'épargne !");
        if (safe(p.getSubscriptions()) > 50)
            insights.add(
                    "Vous dépensez " + (int) safe(p.getSubscriptions()) + " € en abonnements. Passez-les en revue.");

        if (insights.isEmpty())
            insights.add("Excellente gestion financière ! Pensez à optimiser vos placements.");

        return insights;
    }

    private double safe(Double v) {
        return v == null ? 0.0 : v;
    }
}
