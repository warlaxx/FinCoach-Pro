package com.fincoach.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

// ─── Financial Profile ─────────────────────────────────────────────

@Data
@NoArgsConstructor
@AllArgsConstructor
class FinancialProfileRequest {
    private String userId;
    private Double monthlyIncome;
    private Double otherIncome;
    private Double rent;
    private Double utilities;
    private Double insurance;
    private Double loans;
    private Double subscriptions;
    private Double food;
    private Double transport;
    private Double leisure;
    private Double clothing;
    private Double health;
    private Double currentSavings;
    private Double totalDebt;
    private Double monthlySavingsGoal;
}

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
class FinancialSummaryResponse {
    private Long id;
    private String userId;
    private Double monthlyIncome;
    private Double totalFixedExpenses;
    private Double totalVariableExpenses;
    private Double totalExpenses;
    private Double monthlySurplus;
    private Double savingsRate;
    private Double debtRatio;
    private String financialScore;
    private String scoreLabel;
    private List<String> insights;
    private LocalDateTime updatedAt;
}

// ─── Action Plans ──────────────────────────────────────────────────

@Data
@NoArgsConstructor
@AllArgsConstructor
class ActionPlanRequest {
    private String userId;
    private String title;
    private String description;
    private String category;
    private String priority;
    private Double targetAmount;
    private Double currentAmount;
    private LocalDate deadline;
}

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
class ActionPlanResponse {
    private Long id;
    private String userId;
    private String title;
    private String description;
    private String category;
    private String priority;
    private String status;
    private Double targetAmount;
    private Double currentAmount;
    private Double progressPercent;
    private LocalDate deadline;
    private LocalDateTime createdAt;
}

// ─── Chat ──────────────────────────────────────────────────────────

@Data
@NoArgsConstructor
@AllArgsConstructor
class ChatRequest {
    private String userId;
    private String message;
}

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
class ChatResponse {
    private String userId;
    private String role;
    private String content;
    private LocalDateTime createdAt;
}

// ─── Dashboard ─────────────────────────────────────────────────────

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
class DashboardResponse {
    private FinancialSummaryResponse profile;
    private List<ActionPlanResponse> topActions;
    private List<MonthlyDataPoint> monthlyTrend;
    private BudgetBreakdown budgetBreakdown;
}

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
class MonthlyDataPoint {
    private String month;
    private Double income;
    private Double expenses;
    private Double savings;
}

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
class BudgetBreakdown {
    private Double housing;
    private Double food;
    private Double transport;
    private Double leisure;
    private Double savings;
    private Double other;
}
