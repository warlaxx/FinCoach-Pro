export interface ActionPlan {
  id?: number;
  userId: string;
  title: string;
  description: string;
  category: "EPARGNE" | "DETTE" | "BUDGET" | "INVESTISSEMENT" | "AUTRE";
  priority: "HAUTE" | "MOYENNE" | "FAIBLE";
  status?: "A_FAIRE" | "EN_COURS" | "TERMINE" | "ABANDONNE";
  targetAmount?: number;
  currentAmount?: number;
  progressPercent?: number;
  deadline?: string;
  createdAt?: string;
}
