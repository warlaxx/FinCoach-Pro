import { Component, OnInit, OnDestroy } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Subscription } from "rxjs";
import { filter, take, switchMap, timeout, catchError } from "rxjs/operators";
import { of } from "rxjs";
import { ApiService } from "../api.service";
import { ProfileService } from "../settings/profile.service";
import { AuthService } from "../auth/auth.service";
import { FinancialProfile } from "../../shared/models/financial-profile.model";
import { DashboardData } from "../../shared/models/dashboard-data.model";
import { FinancialSummary } from "../../shared/models/financial-summary.model";
import { SCORE_LABELS, SCORE_COLORS, COLOR_BLUE, COLOR_POSITIVE, COLOR_ORANGE, COLOR_PURPLE, COLOR_NEGATIVE, COLOR_BRAND_GOLD, COLOR_YELLOW, DASHBOARD_REQUEST_TIMEOUT_MS } from "../../shared/config/app.config";

interface BreakdownItem {
  label: string;
  icon: string;
  amount: number;
  color: string;
  percent: number;
}

interface ScoreCriteriaItem {
  label: string;
  icon: string;
  weight: string;
  score: number;
  interpretation: string;
  color: string;
}

@Component({
  selector: "app-dashboard",
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: "./dashboard.component.html",
  styleUrls: ["./dashboard.component.scss"],
})
export class DashboardComponent implements OnInit, OnDestroy {
  data: DashboardData | null = null;
  loading = true;
  loadError = false;
  showForm = false;
  saving = false;

  toastMessage = '';
  toastType: 'success' | 'error' = 'success';
  private toastTimer: any = null;
  private sub: Subscription | null = null;

  profile: FinancialProfile = {
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
    typeHabitation: '',
    situationFamiliale: '',
    nombrePersonnes: 0,
  };

  constructor(
    private api: ApiService,
    private profileService: ProfileService,
    private auth: AuthService,
  ) {}

  ngOnInit(): void {
    this.loadDashboard();
    this.loadProfileForm();
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    if (this.toastTimer) clearTimeout(this.toastTimer);
  }

  loadProfileForm(): void {
    this.profileService.getProfile().subscribe({
      next: (data) => {
        if (data?.raw) {
          this.profile = {
            ...this.profile,
            ...data.raw,
            typeHabitation: data.typeHabitation ?? '',
            situationFamiliale: data.situationFamiliale ?? '',
            nombrePersonnes: data.nombrePersonnes ?? 0,
          };
        }
      },
      error: () => { /* pas de profil existant — on garde les valeurs à 0 */ }
    });
  }

  loadDashboard(): void {
    this.loading = true;
    this.loadError = false;

    // Attend que le user soit chargé depuis /api/auth/me avant de requêter le dashboard
    this.sub?.unsubscribe();
    this.sub = this.auth.currentUser$.pipe(
      filter(user => user !== null),
      take(1),
      timeout(DASHBOARD_REQUEST_TIMEOUT_MS),
      switchMap(() => this.api.dashboard.getDashboard().pipe(
        timeout(DASHBOARD_REQUEST_TIMEOUT_MS),
      )),
      catchError(() => {
        this.loadError = true;
        return of(null);
      })
    ).subscribe((dashboardData) => {
      this.data = dashboardData;
      this.loading = false;
    });
  }

  saveProfile(): void {
    this.saving = true;
    this.profileService.saveProfile(this.profile).subscribe({
      next: () => {
        this.saving = false;
        this.showForm = false;
        this.showToast('Profil sauvegardé avec succès', 'success');
        this.loadDashboard();
      },
      error: (err) => {
        this.saving = false;
        const msg = err?.error?.errors
          ? Object.values(err.error.errors).join(' • ')
          : 'Erreur lors de la sauvegarde';
        this.showToast(msg, 'error');
      },
    });
  }

  private showToast(message: string, type: 'success' | 'error'): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastMessage = message;
    this.toastType = type;
    this.toastTimer = setTimeout(() => { this.toastMessage = ''; }, 4000);
  }

  getScoreLabel(score: string): string {
    return SCORE_LABELS[score] ?? '';
  }

  getScoreColor(grade: string): string {
    return SCORE_COLORS[grade] ?? '#8892A4';
  }

  getScoreMessage(p: FinancialSummary): string {
    return p.scoreBreakdown?.message ?? '';
  }

  getScoreCriteriaItems(p: FinancialSummary): ScoreCriteriaItem[] {
    const b = p.scoreBreakdown?.breakdown;
    if (!b) return [];
    return [
      { label: "Taux d'épargne",    icon: '💰', weight: '30%', score: b.savingsRate   ?? 0, ...this.criteriaStyle(b.savingsRate   ?? 0) },
      { label: 'Ratio dettes',       icon: '📋', weight: '25%', score: b.debtRatio     ?? 0, ...this.criteriaStyle(b.debtRatio     ?? 0) },
      { label: 'Ratio charges',      icon: '🏠', weight: '25%', score: b.expenseRatio  ?? 0, ...this.criteriaStyle(b.expenseRatio  ?? 0) },
      { label: 'Épargne urgence',    icon: '🛡️', weight: '20%', score: b.emergencyFund ?? 0, ...this.criteriaStyle(b.emergencyFund ?? 0) },
    ];
  }

  private criteriaStyle(score: number): { color: string; interpretation: string } {
    if (score >= 75) return { color: COLOR_POSITIVE, interpretation: 'Bon' };
    if (score >= 50) return { color: COLOR_YELLOW,   interpretation: 'Moyen' };
    if (score >= 25) return { color: COLOR_ORANGE,   interpretation: 'Fragile' };
    return { color: COLOR_NEGATIVE, interpretation: 'Critique' };
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
