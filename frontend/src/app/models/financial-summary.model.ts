import { BudgetBreakdown } from "./budget-breakdown.model.js";

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
  updatedAt: string;
}
