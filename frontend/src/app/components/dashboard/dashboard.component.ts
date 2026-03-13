import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ApiService } from "../../services/api.service";
import { FinancialProfile } from "src/app/models/financial-profile.model";
import { DashboardData } from "src/app/models/dashboard-data.model";
import { timeout, catchError } from "rxjs/operators";
import { of } from "rxjs";

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

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading = true;
    this.api.dashboard.getDashboard()
      .pipe(
        timeout(10000),
        catchError(() => of(null))
      )
      .subscribe((d) => {
        this.data = d;
        this.loading = false;
      });
  }

  saveProfile() {
    this.saving = true;
    this.api.profile.saveProfile(this.profile).subscribe({
      next: () => {
        this.saving = false;
        this.showForm = false;
        this.load();
      },
      error: () => {
        this.saving = false;
      },
    });
  }

  getScoreLabel(score: string): string {
    const map: Record<string, string> = {
      A: "Excellent",
      B: "Bon",
      C: "Moyen",
      D: "Fragile",
      F: "Critique",
    };
    return map[score] || "";
  }

  getBreakdownItems(p: any) {
    const total = p.totalExpenses || 1;
    return [
      {
        label: "Logement",
        icon: "🏠",
        amount: p.breakdown.housing,
        color: "#3B82F6",
        percent: (p.breakdown.housing / total) * 100,
      },
      {
        label: "Alimentation",
        icon: "🛒",
        amount: p.breakdown.food,
        color: "#22C55E",
        percent: (p.breakdown.food / total) * 100,
      },
      {
        label: "Transport",
        icon: "🚗",
        amount: p.breakdown.transport,
        color: "#F97316",
        percent: (p.breakdown.transport / total) * 100,
      },
      {
        label: "Loisirs",
        icon: "🎯",
        amount: p.breakdown.leisure,
        color: "#8B5CF6",
        percent: (p.breakdown.leisure / total) * 100,
      },
      {
        label: "Crédits",
        icon: "📋",
        amount: p.breakdown.loans,
        color: "#EF4444",
        percent: (p.breakdown.loans / total) * 100,
      },
      {
        label: "Autres",
        icon: "📦",
        amount: p.breakdown.other,
        color: "#C9A84C",
        percent: (p.breakdown.other / total) * 100,
      },
    ].filter((i) => i.amount > 0);
  }
}
