export interface FinancialProfile {
  id?: number;
  userId?: string;
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
  typeHabitation?: string;
  situationFamiliale?: string;
  nombrePersonnes?: number;
}
