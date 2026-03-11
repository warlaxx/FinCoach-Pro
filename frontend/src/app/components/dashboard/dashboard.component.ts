import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { DashboardData, FinancialProfile, FinancialSummary } from '../../models/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="dashboard">
      <header class="page-header">
        <div>
          <h1>Tableau de bord</h1>
          <p class="subtitle">Votre santé financière en un coup d'œil</p>
        </div>
        <button class="btn-gold" (click)="showForm = !showForm">
          {{ showForm ? '✕ Fermer' : '+ Mettre à jour mon profil' }}
        </button>
      </header>

      <!-- Profile Form -->
      <div class="profile-form card animate-in" *ngIf="showForm">
        <h2 class="form-title">💼 Profil Financier Mensuel</h2>
        <p class="form-subtitle">Renseignez vos données pour obtenir des conseils personnalisés</p>

        <div class="form-grid">
          <div class="form-section">
            <h3>📥 Revenus</h3>
            <label>Salaire net mensuel (€)
              <input type="number" [(ngModel)]="profile.monthlyIncome" placeholder="2500">
            </label>
            <label>Autres revenus (€)
              <input type="number" [(ngModel)]="profile.otherIncome" placeholder="0">
            </label>
          </div>

          <div class="form-section">
            <h3>🏠 Charges fixes</h3>
            <label>Loyer / Crédit immobilier (€)
              <input type="number" [(ngModel)]="profile.rent" placeholder="800">
            </label>
            <label>Énergie / Internet (€)
              <input type="number" [(ngModel)]="profile.utilities" placeholder="120">
            </label>
            <label>Assurances (€)
              <input type="number" [(ngModel)]="profile.insurance" placeholder="80">
            </label>
            <label>Crédits à la consommation (€)
              <input type="number" [(ngModel)]="profile.loans" placeholder="0">
            </label>
            <label>Abonnements (streaming, salle...) (€)
              <input type="number" [(ngModel)]="profile.subscriptions" placeholder="50">
            </label>
          </div>

          <div class="form-section">
            <h3>🛒 Charges variables</h3>
            <label>Alimentation (€)
              <input type="number" [(ngModel)]="profile.food" placeholder="300">
            </label>
            <label>Transport (€)
              <input type="number" [(ngModel)]="profile.transport" placeholder="100">
            </label>
            <label>Loisirs / Sorties (€)
              <input type="number" [(ngModel)]="profile.leisure" placeholder="150">
            </label>
            <label>Vêtements (€)
              <input type="number" [(ngModel)]="profile.clothing" placeholder="60">
            </label>
            <label>Santé (€)
              <input type="number" [(ngModel)]="profile.health" placeholder="40">
            </label>
          </div>

          <div class="form-section">
            <h3>💰 Épargne & Dettes</h3>
            <label>Épargne actuelle (€)
              <input type="number" [(ngModel)]="profile.currentSavings" placeholder="5000">
            </label>
            <label>Total des dettes (€)
              <input type="number" [(ngModel)]="profile.totalDebt" placeholder="0">
            </label>
            <label>Objectif épargne mensuelle (€)
              <input type="number" [(ngModel)]="profile.monthlySavingsGoal" placeholder="200">
            </label>
          </div>
        </div>

        <div class="form-actions">
          <button class="btn-ghost" (click)="showForm = false">Annuler</button>
          <button class="btn-gold" (click)="saveProfile()" [disabled]="saving">
            {{ saving ? 'Analyse en cours...' : '🔍 Analyser mon profil' }}
          </button>
        </div>
      </div>

      <!-- No profile state -->
      <div class="empty-state card animate-in" *ngIf="!loading && !data?.profile && !showForm">
        <div class="empty-icon">📊</div>
        <h2>Commencez votre bilan financier</h2>
        <p>Renseignez votre profil pour obtenir votre score de santé financière et un plan d'action personnalisé.</p>
        <button class="btn-gold" (click)="showForm = true">Créer mon profil →</button>
      </div>

      <!-- Dashboard content -->
      <ng-container *ngIf="data?.profile as p">
        <!-- KPI Row -->
        <div class="kpi-grid animate-in">
          <div class="kpi-card">
            <div class="kpi-label">Score Santé</div>
            <div class="kpi-main">
              <div class="score-badge" [class]="'score-' + p.financialScore">{{ p.financialScore }}</div>
              <div class="kpi-sub">{{ getScoreLabel(p.financialScore) }}</div>
            </div>
          </div>

          <div class="kpi-card" [class.kpi-positive]="p.monthlySurplus > 0" [class.kpi-negative]="p.monthlySurplus < 0">
            <div class="kpi-label">Surplus mensuel</div>
            <div class="kpi-value" [class.text-green]="p.monthlySurplus > 0" [class.text-red]="p.monthlySurplus < 0">
              {{ p.monthlySurplus > 0 ? '+' : '' }}{{ p.monthlySurplus | number:'1.0-0' }} €
            </div>
            <div class="kpi-sub">Revenus − Dépenses</div>
          </div>

          <div class="kpi-card">
            <div class="kpi-label">Taux d'épargne</div>
            <div class="kpi-value" [class.text-green]="p.savingsRate >= 20" [class.text-orange]="p.savingsRate > 0 && p.savingsRate < 20" [class.text-red]="p.savingsRate <= 0">
              {{ p.savingsRate }}%
            </div>
            <div class="kpi-sub">Objectif : ≥ 20%</div>
          </div>

          <div class="kpi-card">
            <div class="kpi-label">Ratio d'endettement</div>
            <div class="kpi-value" [class.text-green]="p.debtRatio <= 15" [class.text-orange]="p.debtRatio > 15 && p.debtRatio <= 33" [class.text-red]="p.debtRatio > 33">
              {{ p.debtRatio }}%
            </div>
            <div class="kpi-sub">Limite recommandée : 33%</div>
          </div>

          <div class="kpi-card">
            <div class="kpi-label">Revenus mensuels</div>
            <div class="kpi-value text-gold">{{ p.monthlyIncome | number:'1.0-0' }} €</div>
            <div class="kpi-sub">Dépenses : {{ p.totalExpenses | number:'1.0-0' }} €</div>
          </div>
        </div>

        <!-- Budget breakdown + Insights -->
        <div class="mid-grid animate-in">
          <div class="card breakdown-card">
            <h3 class="card-title">Répartition du budget</h3>
            <div class="breakdown-chart">
              <ng-container *ngFor="let item of getBreakdownItems(p)">
                <div class="breakdown-item">
                  <div class="breakdown-info">
                    <span class="breakdown-icon">{{ item.icon }}</span>
                    <span class="breakdown-label">{{ item.label }}</span>
                  </div>
                  <div class="breakdown-right">
                    <div class="breakdown-bar-wrap">
                      <div class="breakdown-bar">
                        <div class="breakdown-fill" [style.width.%]="item.percent" [style.background]="item.color"></div>
                      </div>
                    </div>
                    <span class="breakdown-amount">{{ item.amount | number:'1.0-0' }} €</span>
                    <span class="breakdown-pct">{{ item.percent | number:'1.0-0' }}%</span>
                  </div>
                </div>
              </ng-container>
            </div>
          </div>

          <div class="card insights-card">
            <h3 class="card-title">💡 Recommandations IA</h3>
            <div class="insights-list">
              <div class="insight-item" *ngFor="let insight of p.insights; let i = index"
                   [style.animation-delay]="i * 0.08 + 's'">
                <span class="insight-dot"></span>
                <span>{{ insight }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Top Actions -->
        <div class="card animate-in" *ngIf="data?.topActions?.length">
          <div class="card-header">
            <h3 class="card-title">🎯 Actions prioritaires</h3>
            <a href="/actions" class="link-see-all">Voir toutes →</a>
          </div>
          <div class="actions-mini-grid">
            <div class="action-mini-card" *ngFor="let action of data!.topActions">
              <div class="action-mini-header">
                <span class="badge" [class]="'badge-' + action.category.toLowerCase()">{{ action.category }}</span>
                <span class="badge" [class]="'badge-' + action.priority.toLowerCase()">{{ action.priority }}</span>
              </div>
              <div class="action-mini-title">{{ action.title }}</div>
              <div class="progress-bar" *ngIf="action.targetAmount">
                <div class="progress-fill" [style.width.%]="action.progressPercent || 0"></div>
              </div>
              <div class="action-mini-meta" *ngIf="action.targetAmount">
                {{ action.currentAmount | number:'1.0-0' }} € / {{ action.targetAmount | number:'1.0-0' }} €
                ({{ action.progressPercent | number:'1.0-0' }}%)
              </div>
            </div>
          </div>
        </div>

        <!-- Stats row -->
        <div class="stats-row animate-in" *ngIf="data?.stats">
          <div class="stat-item">
            <span class="stat-value">{{ data!.stats.totalActions }}</span>
            <span class="stat-label">Actions totales</span>
          </div>
          <div class="stat-item">
            <span class="stat-value text-green">{{ data!.stats.completedActions }}</span>
            <span class="stat-label">Terminées</span>
          </div>
          <div class="stat-item">
            <span class="stat-value text-gold">{{ data!.stats.inProgressActions }}</span>
            <span class="stat-label">En cours</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ data!.stats.completionRate }}%</span>
            <span class="stat-label">Taux de complétion</span>
          </div>
        </div>
      </ng-container>

      <!-- Loading -->
      <div class="loading-state" *ngIf="loading">
        <div class="loading-spinner"></div>
        <p>Chargement de votre tableau de bord...</p>
      </div>
    </div>
  `,
  styles: [`
    .dashboard {
      padding: 32px;
      max-width: 1200px;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;

      h1 { font-size: 28px; }
      .subtitle { color: var(--text-secondary); margin-top: 4px; }
    }

    .profile-form {
      .form-title   { font-size: 20px; margin-bottom: 4px; }
      .form-subtitle { color: var(--text-secondary); font-size: 14px; margin-bottom: 24px; }
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 24px;
      margin-bottom: 24px;
    }

    .form-section {
      h3 { font-size: 13px; font-weight: 700; letter-spacing: 1px; color: var(--gold); text-transform: uppercase; margin-bottom: 14px; }

      label {
        display: flex;
        flex-direction: column;
        gap: 6px;
        font-size: 13px;
        color: var(--text-secondary);
        margin-bottom: 12px;
      }
    }

    .form-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      padding-top: 16px;
      border-top: 1px solid var(--border);
    }

    .empty-state {
      text-align: center;
      padding: 60px 40px;

      .empty-icon { font-size: 48px; margin-bottom: 16px; }
      h2 { font-size: 22px; margin-bottom: 8px; }
      p { color: var(--text-secondary); margin-bottom: 24px; }
    }

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 16px;
    }

    .kpi-card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 20px;
      transition: border-color 0.2s;

      &:hover { border-color: var(--border-glow); }

      .kpi-label { font-size: 12px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.8px; font-weight: 600; margin-bottom: 8px; }
      .kpi-value { font-family: var(--font-display); font-size: 26px; font-weight: 800; margin-bottom: 4px; }
      .kpi-sub   { font-size: 12px; color: var(--text-muted); }
      .kpi-main  { display: flex; align-items: center; gap: 12px; margin-bottom: 4px; }
    }

    .text-green  { color: var(--green) !important; }
    .text-red    { color: var(--red) !important; }
    .text-orange { color: var(--orange) !important; }
    .text-gold   { color: var(--gold) !important; }

    .mid-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;

      @media (max-width: 900px) { grid-template-columns: 1fr; }
    }

    .card-title { font-size: 15px; font-weight: 700; margin-bottom: 18px; }
    .card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; }
    .link-see-all { font-size: 13px; color: var(--gold); }

    .breakdown-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 12px;

      .breakdown-info { display: flex; align-items: center; gap: 8px; min-width: 120px; }
      .breakdown-icon { font-size: 16px; }
      .breakdown-label { font-size: 13px; color: var(--text-secondary); }
      .breakdown-right { display: flex; align-items: center; gap: 8px; flex: 1; justify-content: flex-end; }
      .breakdown-bar-wrap { flex: 1; max-width: 100px; }
      .breakdown-bar { height: 5px; background: var(--border); border-radius: 3px; overflow: hidden; }
      .breakdown-fill { height: 100%; border-radius: 3px; transition: width 0.6s ease; }
      .breakdown-amount { font-size: 13px; font-weight: 600; min-width: 60px; text-align: right; }
      .breakdown-pct { font-size: 12px; color: var(--text-muted); min-width: 36px; text-align: right; }
    }

    .insights-list { display: flex; flex-direction: column; gap: 12px; }
    .insight-item {
      display: flex;
      gap: 12px;
      align-items: flex-start;
      font-size: 13px;
      color: var(--text-secondary);
      line-height: 1.5;
      animation: fadeInUp 0.4s ease both;

      .insight-dot {
        width: 6px; height: 6px;
        background: var(--gold);
        border-radius: 50%;
        margin-top: 6px;
        flex-shrink: 0;
      }
    }

    .actions-mini-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 14px;
    }

    .action-mini-card {
      background: var(--bg-input);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 14px;

      .action-mini-header { display: flex; gap: 6px; margin-bottom: 8px; }
      .action-mini-title { font-size: 13px; font-weight: 600; margin-bottom: 10px; }
      .action-mini-meta { font-size: 11px; color: var(--text-muted); margin-top: 6px; }
    }

    .stats-row {
      display: flex;
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      overflow: hidden;
    }

    .stat-item {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 20px;
      border-right: 1px solid var(--border);
      &:last-child { border-right: none; }

      .stat-value { font-family: var(--font-display); font-size: 24px; font-weight: 800; }
      .stat-label { font-size: 12px; color: var(--text-muted); margin-top: 4px; }
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      padding: 60px;
      color: var(--text-muted);
    }

    .loading-spinner {
      width: 36px; height: 36px;
      border: 3px solid var(--border);
      border-top-color: var(--gold);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class DashboardComponent implements OnInit {
  data: DashboardData | null = null;
  loading = true;
  showForm = false;
  saving = false;

  profile: FinancialProfile = {
    userId: 'user-demo',
    monthlyIncome: 0, otherIncome: 0,
    rent: 0, utilities: 0, insurance: 0, loans: 0, subscriptions: 0,
    food: 0, transport: 0, leisure: 0, clothing: 0, health: 0,
    currentSavings: 0, totalDebt: 0, monthlySavingsGoal: 0
  };

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading = true;
    this.api.getDashboard().subscribe({
      next: d => { this.data = d; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  saveProfile() {
    this.saving = true;
    this.api.saveProfile(this.profile).subscribe({
      next: () => {
        this.saving = false;
        this.showForm = false;
        this.load();
      },
      error: () => { this.saving = false; }
    });
  }

  getScoreLabel(score: string): string {
    const map: Record<string, string> = { A: 'Excellent', B: 'Bon', C: 'Moyen', D: 'Fragile', F: 'Critique' };
    return map[score] || '';
  }

  getBreakdownItems(p: any) {
    const total = p.totalExpenses || 1;
    return [
      { label: 'Logement',    icon: '🏠', amount: p.breakdown.housing,   color: '#3B82F6', percent: (p.breakdown.housing / total) * 100 },
      { label: 'Alimentation',icon: '🛒', amount: p.breakdown.food,      color: '#22C55E', percent: (p.breakdown.food / total) * 100 },
      { label: 'Transport',   icon: '🚗', amount: p.breakdown.transport,  color: '#F97316', percent: (p.breakdown.transport / total) * 100 },
      { label: 'Loisirs',     icon: '🎯', amount: p.breakdown.leisure,    color: '#8B5CF6', percent: (p.breakdown.leisure / total) * 100 },
      { label: 'Crédits',     icon: '📋', amount: p.breakdown.loans,      color: '#EF4444', percent: (p.breakdown.loans / total) * 100 },
      { label: 'Autres',      icon: '📦', amount: p.breakdown.other,      color: '#C9A84C', percent: (p.breakdown.other / total) * 100 },
    ].filter(i => i.amount > 0);
  }
}
