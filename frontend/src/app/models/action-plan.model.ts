export interface ActionPlan {
  id?: number;
  userId: string;
  title: string;
  description: string;
  category: "EPARGNE" | "DETTE" | "BUDGET" | "INVESTISSEMENT";
  priority: "HAUTE" | "MOYENNE" | "FAIBLE";
  status?: "EN_COURS" | "TERMINE" | "REPORTE";
  targetAmount?: number;
  currentAmount?: number;
  progressPercent?: number;
  deadline?: string;
  createdAt?: string;
}
