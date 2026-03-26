import { BudgetBreakdown } from "./budget-breakdown.model.js";

export interface ScoreBreakdown {
  grade: string;
  totalScore: number;
  breakdown: {
    savingsRate: number;
    debtRatio: number;
    expenseRatio: number;
    emergencyFund: number;
  };
  message: string;
}

export interface FinancialSummary {
  id: number;
  userId: string;
  monthlyIncome: number;
  totalFixedExpenses: number;
  totalVariableExpenses: number;
  totalExpenses: number;
  monthlySurplus: number;
  savingsRate: number;
  debtRatio: number;
  financialScore: string;
  currentSavings: number;
  totalDebt: number;
  insights: string[];
  breakdown: BudgetBreakdown;
  scoreBreakdown?: ScoreBreakdown;
  updatedAt: string;
}
