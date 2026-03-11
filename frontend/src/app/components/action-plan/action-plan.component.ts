import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { ActionPlan } from '../../models/models';

@Component({
  selector: 'app-action-plan',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="actions-page">
      <header class="page-header">
        <div>
          <h1>Plan d'actions</h1>
          <p class="subtitle">Suivez vos objectifs financiers</p>
        </div>
        <button class="btn-gold" (click)="showNew = !showNew">
          {{ showNew ? '✕ Fermer' : '+ Nouvelle action' }}
        </button>
      </header>

      <!-- New action form -->
      <div class="card new-action-form animate-in" *ngIf="showNew">
        <h3>Créer une action</h3>
        <div class="new-form-grid">
          <label>Titre *
            <input [(ngModel)]="newAction.title" placeholder="Ex: Rembourser le crédit auto">
          </label>
          <label>Catégorie
            <select [(ngModel)]="newAction.category">
              <option value="EPARGNE">💰 Épargne</option>
              <option value="DETTE">📉 Dette</option>
              <option value="BUDGET">📊 Budget</option>
              <option value="INVESTISSEMENT">📈 Investissement</option>
            </select>
          </label>
          <label>Priorité
            <select [(ngModel)]="newAction.priority">
              <option value="HAUTE">🔴 Haute</option>
              <option value="MOYENNE">🟠 Moyenne</option>
              <option value="FAIBLE">🟢 Faible</option>
            </select>
          </label>
          <label>Montant cible (€)
            <input type="number" [(ngModel)]="newAction.targetAmount" placeholder="1000">
          </label>
          <label>Montant actuel (€)
            <input type="number" [(ngModel)]="newAction.currentAmount" placeholder="0">
          </label>
          <label>Échéance
            <input type="date" [(ngModel)]="newAction.deadline">
          </label>
          <label class="full-width">Description
            <textarea [(ngModel)]="newAction.description" placeholder="Décrivez votre objectif..." rows="2"></textarea>
          </label>
        </div>
        <div class="form-actions">
          <button class="btn-ghost" (click)="showNew = false">Annuler</button>
          <button class="btn-gold" (click)="createAction()" [disabled]="!newAction.title">Créer l'action</button>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters">
        <button class="filter-btn" [class.active]="filter === 'all'" (click)="filter = 'all'; applyFilter()">Toutes ({{ actions.length }})</button>
        <button class="filter-btn" [class.active]="filter === 'EN_COURS'" (click)="filter = 'EN_COURS'; applyFilter()">
          En cours ({{ countByStatus('EN_COURS') }})
        </button>
        <button class="filter-btn" [class.active]="filter === 'TERMINE'" (click)="filter = 'TERMINE'; applyFilter()">
          Terminées ({{ countByStatus('TERMINE') }})
        </button>
        <button class="filter-btn" [class.active]="filter === 'EPARGNE'" (click)="filter = 'EPARGNE'; applyFilter()">💰 Épargne</button>
        <button class="filter-btn" [class.active]="filter === 'DETTE'" (click)="filter = 'DETTE'; applyFilter()">📉 Dettes</button>
        <button class="filter-btn" [class.active]="filter === 'BUDGET'" (click)="filter = 'BUDGET'; applyFilter()">📊 Budget</button>
      </div>

      <!-- Summary bar -->
      <div class="summary-bar card" *ngIf="actions.length > 0">
        <div class="sum-item">
          <span class="sum-val">{{ actions.length }}</span>
          <span class="sum-label">Actions</span>
        </div>
        <div class="sum-item">
          <span class="sum-val text-green">{{ countByStatus('TERMINE') }}</span>
          <span class="sum-label">Terminées</span>
        </div>
        <div class="sum-item">
          <span class="sum-val text-gold">{{ totalProgress() | number:'1.0-0' }}%</span>
          <span class="sum-label">Progression globale</span>
        </div>
        <div class="sum-item">
          <span class="sum-val">{{ totalSaved() | number:'1.0-0' }} €</span>
          <span class="sum-label">Économisés</span>
        </div>
      </div>

      <!-- Loading -->
      <div class="loading-state" *ngIf="loading">
        <div class="loading-spinner"></div>
      </div>

      <!-- Empty -->
      <div class="empty-state card" *ngIf="!loading && filtered.length === 0 && actions.length === 0">
        <div class="empty-icon">🎯</div>
        <h2>Aucune action pour le moment</h2>
        <p>Créez votre premier objectif ou renseignez votre profil financier pour obtenir des suggestions automatiques.</p>
        <button class="btn-gold" (click)="showNew = true">Créer ma première action →</button>
      </div>

      <div class="empty-state card" *ngIf="!loading && filtered.length === 0 && actions.length > 0">
        <p style="color: var(--text-muted)">Aucune action ne correspond à ce filtre.</p>
      </div>

      <!-- Actions grid -->
      <div class="actions-grid" *ngIf="!loading && filtered.length > 0">
        <div class="action-card card animate-in" *ngFor="let action of filtered; let i = index"
             [style.animation-delay]="i * 0.05 + 's'"
             [class.action-done]="action.status === 'TERMINE'">

          <div class="action-header">
            <div class="action-badges">
              <span class="badge" [class]="'badge-' + action.category.toLowerCase()">
                {{ getCategoryIcon(action.category) }} {{ action.category }}
              </span>
              <span class="badge" [class]="'badge-' + action.priority.toLowerCase()">{{ action.priority }}</span>
            </div>
            <div class="action-menu">
              <button class="icon-btn" (click)="deleteAction(action)" title="Supprimer">✕</button>
            </div>
          </div>

          <h3 class="action-title">{{ action.title }}</h3>
          <p class="action-desc" *ngIf="action.description">{{ action.description }}</p>

          <!-- Progress -->
          <div class="action-progress" *ngIf="action.targetAmount">
            <div class="progress-meta">
              <span>{{ action.currentAmount || 0 | number:'1.0-0' }} € / {{ action.targetAmount | number:'1.0-0' }} €</span>
              <span class="pct">{{ action.progressPercent | number:'1.0-0' }}%</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" [style.width.%]="action.progressPercent || 0"></div>
            </div>
          </div>

          <!-- Deadline -->
          <div class="action-deadline" *ngIf="action.deadline">
            📅 Échéance : {{ action.deadline | date:'dd/MM/yyyy' }}
            <span class="overdue" *ngIf="isOverdue(action)"> — En retard</span>
          </div>

          <!-- Update progress inline -->
          <div class="progress-update" *ngIf="editingId === action.id">
            <input type="number" [(ngModel)]="editAmount" placeholder="Montant actuel" class="small-input">
            <div class="prog-btns">
              <button class="btn-ghost" (click)="editingId = null">Annuler</button>
              <button class="btn-gold" (click)="updateProgress(action)">Mettre à jour</button>
            </div>
          </div>

          <!-- Actions bar -->
          <div class="action-footer">
            <div class="status-select">
              <span class="badge" [class]="'badge-' + (action.status || 'en_cours').toLowerCase()">
                {{ action.status === 'TERMINE' ? '✓' : action.status === 'REPORTE' ? '⏸' : '▶' }}
                {{ action.status || 'EN_COURS' }}
              </span>
            </div>
            <div class="action-btns">
              <button class="btn-ghost btn-sm" *ngIf="action.targetAmount && action.status !== 'TERMINE'" (click)="startEdit(action)">
                Mettre à jour
              </button>
              <button class="btn-gold btn-sm" *ngIf="action.status !== 'TERMINE'" (click)="markDone(action)">
                ✓ Terminer
              </button>
              <button class="btn-ghost btn-sm text-gold" *ngIf="action.status === 'TERMINE'" (click)="reopen(action)">
                ↩ Réouvrir
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .actions-page { padding: 32px; max-width: 1200px; display: flex; flex-direction: column; gap: 24px; }

    .page-header {
      display: flex; align-items: center; justify-content: space-between;
      h1 { font-size: 28px; }
      .subtitle { color: var(--text-secondary); margin-top: 4px; }
    }

    .new-action-form {
      h3 { font-size: 16px; margin-bottom: 18px; }
    }

    .new-form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 14px;
      margin-bottom: 18px;

      label { display: flex; flex-direction: column; gap: 6px; font-size: 13px; color: var(--text-secondary); }
      .full-width { grid-column: 1 / -1; }
      textarea { resize: vertical; }
      select { background: var(--bg-input); border: 1px solid var(--border); border-radius: var(--radius); padding: 10px 14px; color: var(--text-primary); }
    }

    .form-actions { display: flex; gap: 12px; justify-content: flex-end; padding-top: 14px; border-top: 1px solid var(--border); }

    .filters {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .filter-btn {
      padding: 7px 14px;
      border-radius: 100px;
      background: var(--bg-card);
      border: 1px solid var(--border);
      color: var(--text-secondary);
      font-size: 13px;
      transition: all 0.15s;

      &:hover { border-color: var(--border-glow); color: var(--text-primary); }
      &.active { background: var(--gold-bg); border-color: var(--gold-dim); color: var(--gold); }
    }

    .summary-bar {
      display: flex;
      gap: 0;
      padding: 0;
      overflow: hidden;

      .sum-item {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 16px;
        border-right: 1px solid var(--border);
        &:last-child { border-right: none; }
      }
      .sum-val { font-family: var(--font-display); font-size: 20px; font-weight: 800; }
      .sum-label { font-size: 12px; color: var(--text-muted); margin-top: 2px; }
    }

    .text-green { color: var(--green); }
    .text-gold { color: var(--gold); }

    .actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 16px;
    }

    .action-card {
      display: flex;
      flex-direction: column;
      gap: 12px;
      transition: all 0.2s;

      &.action-done { opacity: 0.65; }
      &:hover { border-color: var(--border-glow); }
    }

    .action-header { display: flex; align-items: center; justify-content: space-between; }
    .action-badges { display: flex; gap: 6px; flex-wrap: wrap; }

    .icon-btn {
      background: none; border: none; color: var(--text-muted); font-size: 14px; padding: 4px;
      transition: color 0.15s;
      &:hover { color: var(--red); }
    }

    .action-title { font-size: 14px; font-weight: 700; }
    .action-desc  { font-size: 13px; color: var(--text-secondary); line-height: 1.5; }

    .action-progress {
      .progress-meta { display: flex; justify-content: space-between; font-size: 12px; color: var(--text-muted); margin-bottom: 6px; }
      .pct { color: var(--gold); font-weight: 600; }
    }

    .action-deadline {
      font-size: 12px;
      color: var(--text-muted);
      .overdue { color: var(--red); font-weight: 600; }
    }

    .progress-update {
      background: var(--bg-input);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 10px;

      .small-input { font-size: 14px; }
      .prog-btns { display: flex; gap: 8px; justify-content: flex-end; }
    }

    .action-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-top: 8px;
      border-top: 1px solid var(--border);
    }

    .action-btns { display: flex; gap: 8px; }
    .btn-sm { padding: 7px 12px; font-size: 12px; }

    .empty-state { text-align: center; padding: 48px; .empty-icon { font-size: 40px; margin-bottom: 14px; } h2 { font-size: 20px; margin-bottom: 8px; } p { color: var(--text-secondary); margin-bottom: 20px; } }
    .loading-state { display: flex; justify-content: center; padding: 48px; }
    .loading-spinner { width: 32px; height: 32px; border: 3px solid var(--border); border-top-color: var(--gold); border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class ActionPlanComponent implements OnInit {
  actions: ActionPlan[] = [];
  filtered: ActionPlan[] = [];
  loading = true;
  showNew = false;
  filter = 'all';
  editingId: number | null = null;
  editAmount: number = 0;

  newAction: Partial<ActionPlan> = {
    title: '', description: '', category: 'EPARGNE', priority: 'MOYENNE',
    targetAmount: undefined, currentAmount: 0
  };

  constructor(private api: ApiService) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.api.getActions().subscribe({
      next: a => { this.actions = a; this.applyFilter(); this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  applyFilter() {
    if (this.filter === 'all') this.filtered = this.actions;
    else if (['EN_COURS', 'TERMINE', 'REPORTE'].includes(this.filter))
      this.filtered = this.actions.filter(a => a.status === this.filter);
    else
      this.filtered = this.actions.filter(a => a.category === this.filter);
  }

  createAction() {
    this.api.createAction(this.newAction as ActionPlan).subscribe(() => {
      this.showNew = false;
      this.newAction = { title: '', description: '', category: 'EPARGNE', priority: 'MOYENNE', currentAmount: 0 };
      this.load();
    });
  }

  markDone(a: ActionPlan) {
    this.api.updateActionStatus(a.id!, 'TERMINE', a.targetAmount || undefined).subscribe(() => this.load());
  }

  reopen(a: ActionPlan) {
    this.api.updateActionStatus(a.id!, 'EN_COURS').subscribe(() => this.load());
  }

  startEdit(a: ActionPlan) {
    this.editingId = a.id!;
    this.editAmount = a.currentAmount || 0;
  }

  updateProgress(a: ActionPlan) {
    this.api.updateActionStatus(a.id!, a.status!, this.editAmount).subscribe(() => {
      this.editingId = null;
      this.load();
    });
  }

  deleteAction(a: ActionPlan) {
    if (confirm('Supprimer cette action ?')) {
      this.api.deleteAction(a.id!).subscribe(() => this.load());
    }
  }

  countByStatus(s: string) { return this.actions.filter(a => a.status === s).length; }

  totalProgress(): number {
    const withTarget = this.actions.filter(a => a.targetAmount && a.targetAmount > 0);
    if (!withTarget.length) return 0;
    return withTarget.reduce((sum, a) => sum + (a.progressPercent || 0), 0) / withTarget.length;
  }

  totalSaved(): number {
    return this.actions.reduce((sum, a) => sum + (a.currentAmount || 0), 0);
  }

  isOverdue(a: ActionPlan): boolean {
    return !!a.deadline && new Date(a.deadline) < new Date() && a.status !== 'TERMINE';
  }

  getCategoryIcon(cat: string): string {
    return { EPARGNE: '💰', DETTE: '📉', BUDGET: '📊', INVESTISSEMENT: '📈' }[cat] || '';
  }
}
