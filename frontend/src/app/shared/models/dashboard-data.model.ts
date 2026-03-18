import { ActionPlan } from "./action-plan.model";
import { FinancialSummary } from "./financial-summary.model";

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
