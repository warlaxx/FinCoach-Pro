import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  template: `
    <div class="app-shell">
      <aside class="sidebar">
        <div class="sidebar-logo">
          <span class="logo-icon">💰</span>
          <div>
            <div class="logo-name">FinCoach</div>
            <div class="logo-sub">Pro</div>
          </div>
        </div>

        <nav class="sidebar-nav">
          <a routerLink="/dashboard" routerLinkActive="active" class="nav-item">
            <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
            </svg>
            <span>Tableau de bord</span>
          </a>

          <a routerLink="/actions" routerLinkActive="active" class="nav-item">
            <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
            </svg>
            <span>Plan d'actions</span>
          </a>

          <a routerLink="/chat" routerLinkActive="active" class="nav-item">
            <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
            </svg>
            <span>Assistant IA</span>
            <span class="nav-badge">IA</span>
          </a>
        </nav>

        <div class="sidebar-footer">
          <div class="user-info">
            <div class="user-avatar">U</div>
            <div>
              <div class="user-name">Demo User</div>
              <div class="user-plan">Plan Essentiel</div>
            </div>
          </div>
        </div>
      </aside>

      <main class="main-content">
        <router-outlet />
      </main>
    </div>
  `,
  styles: [`
    .app-shell {
      display: flex;
      height: 100vh;
      overflow: hidden;
    }

    .sidebar {
      width: 240px;
      min-width: 240px;
      background: var(--bg-card);
      border-right: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      padding: 24px 0;
    }

    .sidebar-logo {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 0 20px 28px;
      border-bottom: 1px solid var(--border);

      .logo-icon { font-size: 28px; }
      .logo-name { font-family: var(--font-display); font-size: 18px; font-weight: 800; color: var(--gold); }
      .logo-sub  { font-size: 11px; color: var(--text-muted); letter-spacing: 2px; text-transform: uppercase; margin-top: -2px; }
    }

    .sidebar-nav {
      flex: 1;
      padding: 20px 12px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 11px 14px;
      border-radius: var(--radius);
      color: var(--text-secondary);
      font-size: 14px;
      font-weight: 500;
      text-decoration: none;
      transition: all 0.15s;
      position: relative;

      svg { flex-shrink: 0; }

      &:hover {
        background: var(--bg-card-hover);
        color: var(--text-primary);
      }

      &.active {
        background: var(--gold-bg);
        color: var(--gold);
        border: 1px solid var(--gold-dim);

        svg { color: var(--gold); }
      }

      .nav-badge {
        margin-left: auto;
        background: var(--gold-bg);
        color: var(--gold);
        font-size: 9px;
        font-weight: 700;
        letter-spacing: 1px;
        padding: 2px 6px;
        border-radius: 6px;
        border: 1px solid var(--gold-dim);
      }
    }

    .sidebar-footer {
      padding: 16px 20px;
      border-top: 1px solid var(--border);
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 10px;

      .user-avatar {
        width: 34px; height: 34px;
        background: var(--gold-bg);
        border: 1px solid var(--gold-dim);
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: var(--font-display);
        font-weight: 700;
        color: var(--gold);
        font-size: 14px;
      }

      .user-name  { font-size: 13px; font-weight: 600; color: var(--text-primary); }
      .user-plan  { font-size: 11px; color: var(--text-muted); }
    }

    .main-content {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
    }
  `]
})
export class AppComponent {}
