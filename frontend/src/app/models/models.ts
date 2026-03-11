export interface FinancialProfile {
  id?: number;
  userId: string;
  monthlyIncome: number;
  otherIncome: number;
  rent: number;
  utilities: number;
  insurance: number;
  loans: number;
  subscriptions: number;
  food: number;
  transport: number;
  leisure: number;
  clothing: number;
  health: number;
  currentSavings: number;
  totalDebt: number;
  monthlySavingsGoal: number;
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
  updatedAt: string;
}

export interface BudgetBreakdown {
  housing: number;
  food: number;
  transport: number;
  leisure: number;
  loans: number;
  other: number;
}

export interface ActionPlan {
  id?: number;
  userId: string;
  title: string;
  description: string;
  category: 'EPARGNE' | 'DETTE' | 'BUDGET' | 'INVESTISSEMENT';
  priority: 'HAUTE' | 'MOYENNE' | 'FAIBLE';
  status?: 'EN_COURS' | 'TERMINE' | 'REPORTE';
  targetAmount?: number;
  currentAmount?: number;
  progressPercent?: number;
  deadline?: string;
  createdAt?: string;
}

export interface ChatMessage {
  id?: number;
  userId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt?: string;
}

export interface DashboardData {
  profile: FinancialSummary | null;
  topActions: ActionPlan[];
  stats: {
    totalActions: number;
    completedActions: number;
    inProgressActions: number;
    completionRate: number;
  };
}
