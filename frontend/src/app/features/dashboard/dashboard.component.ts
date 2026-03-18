import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ApiService } from "../api.service";
import { FinancialProfile } from "../../shared/models/financial-profile.model";
import { DashboardData } from "../../shared/models/dashboard-data.model";
import { FinancialSummary } from "../../shared/models/financial-summary.model";
import { SCORE_LABELS, COLOR_BLUE, COLOR_POSITIVE, COLOR_ORANGE, COLOR_PURPLE, COLOR_NEGATIVE, COLOR_BRAND_GOLD, DASHBOARD_REQUEST_TIMEOUT_MS } from "../../shared/config/app.config";
import { timeout, catchError } from "rxjs/operators";
import { of } from "rxjs";

interface BreakdownItem {
  label: string;
  icon: string;
  amount: number;
  color: string;
  percent: number;
}

@Component({
  selector: "app-dashboard",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./dashboard.component.html",
  styleUrls: ["./dashboard.component.scss"],
})
export class DashboardComponent implements OnInit {
  data: DashboardData | null = null;
  loading = true;
  showForm = false;
  saving = false;

  profile: FinancialProfile = {
    userId: "user-demo",
    monthlyIncome: 0,
    otherIncome: 0,
    rent: 0,
    utilities: 0,
    insurance: 0,
    loans: 0,
    subscriptions: 0,
    food: 0,
    transport: 0,
    leisure: 0,
    clothing: 0,
    health: 0,
    currentSavings: 0,
    totalDebt: 0,
    monthlySavingsGoal: 0,
  };

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loading = true;
    this.api.dashboard.getDashboard()
      .pipe(
        timeout(DASHBOARD_REQUEST_TIMEOUT_MS),
        catchError(() => of(null))
      )
      .subscribe((dashboardData) => {
        this.data = dashboardData;
        this.loading = false;
      });
  }

  saveProfile(): void {
    this.saving = true;
    this.api.profile.saveProfile(this.profile).subscribe({
      next: () => {
        this.saving = false;
        this.showForm = false;
        this.loadDashboard();
      },
      error: () => {
        this.saving = false;
      },
    });
  }

  getScoreLabel(score: string): string {
    return SCORE_LABELS[score] ?? '';
  }

  getBreakdownItems(financialSummary: FinancialSummary): BreakdownItem[] {
    const totalExpenses = financialSummary.totalExpenses || 1;
    return [
      {
        label: "Logement",
        icon: "🏠",
        amount: financialSummary.breakdown.housing,
        color: COLOR_BLUE,
        percent: (financialSummary.breakdown.housing / totalExpenses) * 100,
      },
      {
        label: "Alimentation",
        icon: "🛒",
        amount: financialSummary.breakdown.food,
        color: COLOR_POSITIVE,
        percent: (financialSummary.breakdown.food / totalExpenses) * 100,
      },
      {
        label: "Transport",
        icon: "🚗",
        amount: financialSummary.breakdown.transport,
        color: COLOR_ORANGE,
        percent: (financialSummary.breakdown.transport / totalExpenses) * 100,
      },
      {
        label: "Loisirs",
        icon: "🎯",
        amount: financialSummary.breakdown.leisure,
        color: COLOR_PURPLE,
        percent: (financialSummary.breakdown.leisure / totalExpenses) * 100,
      },
      {
        label: "Crédits",
        icon: "📋",
        amount: financialSummary.breakdown.loans,
        color: COLOR_NEGATIVE,
        percent: (financialSummary.breakdown.loans / totalExpenses) * 100,
      },
      {
        label: "Autres",
        icon: "📦",
        amount: financialSummary.breakdown.other,
        color: COLOR_BRAND_GOLD,
        percent: (financialSummary.breakdown.other / totalExpenses) * 100,
      },
    ].filter((item) => item.amount > 0);
  }
}
