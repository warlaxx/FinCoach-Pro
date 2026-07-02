import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { UpgradeModalService, UpgradePrompt } from '../../services/upgrade-modal.service';

/**
 * Global upgrade modal (TICKET-16).
 *
 * Hosted once in AppComponent; opens whenever the API answers with
 * { code: 'UPGRADE_REQUIRED' } (quota reached on the current plan).
 */
@Component({
  selector: 'app-upgrade-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="upgrade-overlay" *ngIf="prompt" (click)="close()">
      <div class="upgrade-modal" (click)="$event.stopPropagation()" role="dialog" aria-modal="true">
        <button class="upgrade-close" (click)="close()" aria-label="Fermer">✕</button>

        <div class="upgrade-icon">{{ prompt.requiredPlan === 'PREMIUM' ? '🏆' : '💎' }}</div>
        <h2 class="upgrade-title">
          Passez au plan {{ prompt.requiredPlan === 'PREMIUM' ? 'Premium' : 'Pro' }}
        </h2>
        <p class="upgrade-message">{{ prompt.message }}</p>

        <ul class="upgrade-benefits">
          <ng-container *ngIf="prompt.requiredPlan !== 'PREMIUM'">
            <li>Objectifs financiers illimités</li>
            <li>100 messages IA par jour</li>
            <li>Export PDF de votre bilan</li>
            <li>Graphiques d'évolution sur 30 jours</li>
          </ng-container>
          <ng-container *ngIf="prompt.requiredPlan === 'PREMIUM'">
            <li>Assistant IA illimité</li>
            <li>Données de marché en temps réel</li>
            <li>Support prioritaire</li>
          </ng-container>
        </ul>

        <div class="upgrade-actions">
          <button class="btn-secondary" (click)="close()">Plus tard</button>
          <button class="btn-primary" (click)="goToPricing()">Découvrir les offres</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .upgrade-overlay {
      position: fixed;
      inset: 0;
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(0, 0, 0, 0.75);
      backdrop-filter: blur(6px);
      animation: fadeIn 0.2s ease;
    }

    .upgrade-modal {
      position: relative;
      width: min(440px, calc(100vw - 40px));
      background: var(--bg-card, #0A0A0A);
      border: 1px solid var(--border-glow, #2E2E2E);
      border-radius: 20px;
      padding: 36px 32px 28px;
      text-align: center;
      box-shadow: var(--glow-card, 0 8px 40px rgba(0,0,0,0.95));
      animation: slideUp 0.25s ease;
    }

    .upgrade-close {
      position: absolute;
      top: 14px;
      right: 16px;
      background: none;
      border: none;
      color: var(--text-muted, #444);
      font-size: 16px;
      cursor: pointer;
      transition: color 0.15s;
    }
    .upgrade-close:hover { color: var(--text-primary, #fff); }

    .upgrade-icon { font-size: 42px; margin-bottom: 12px; }

    .upgrade-title {
      font-family: var(--font-display, 'Syne', sans-serif);
      font-size: 22px;
      font-weight: 700;
      color: var(--text-primary, #fff);
      margin: 0 0 10px;
    }

    .upgrade-message {
      font-size: 14px;
      line-height: 1.6;
      color: var(--text-secondary, #888);
      margin: 0 0 20px;
    }

    .upgrade-benefits {
      list-style: none;
      margin: 0 0 26px;
      padding: 0;
      text-align: left;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .upgrade-benefits li {
      font-size: 13.5px;
      color: var(--text-primary, #fff);
      padding-left: 26px;
      position: relative;
    }
    .upgrade-benefits li::before {
      content: '✓';
      position: absolute;
      left: 4px;
      color: var(--green, #22C55E);
      font-weight: 700;
    }

    .upgrade-actions {
      display: flex;
      gap: 12px;
      justify-content: center;
    }

    .btn-primary, .btn-secondary {
      flex: 1;
      padding: 12px 18px;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s;
    }

    .btn-primary {
      background: var(--gold, #fff);
      color: #000;
      border: 1px solid var(--gold, #fff);
    }
    .btn-primary:hover { background: var(--gold-light, #ddd); }

    .btn-secondary {
      background: transparent;
      color: var(--text-secondary, #888);
      border: 1px solid var(--border, #1A1A1A);
    }
    .btn-secondary:hover { color: var(--text-primary, #fff); border-color: var(--border-glow, #2E2E2E); }

    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { transform: translateY(14px); opacity: 0; } to { transform: none; opacity: 1; } }
  `],
})
export class UpgradeModalComponent {
  prompt: UpgradePrompt | null = null;

  constructor(
    private upgradeModal: UpgradeModalService,
    private router: Router,
  ) {
    this.upgradeModal.prompt$.subscribe((p) => (this.prompt = p));
  }

  close(): void {
    this.upgradeModal.close();
  }

  goToPricing(): void {
    this.close();
    this.router.navigate(['/pricing']);
  }
}
