import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TransitionService } from '../../services/transition.service';

@Component({
  selector: 'app-page-transition',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="warp-overlay" [class.active]="svc.active$ | async">
      <div class="warp-streaks">
        <span *ngFor="let s of streaks" class="streak" [style.--d]="s.d" [style.--r]="s.r" [style.--l]="s.l"></span>
      </div>
      <div class="warp-center-glow"></div>
    </div>
  `,
  styles: [`
    .warp-overlay {
      position: fixed;
      inset: 0;
      z-index: 9999;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.18s ease;
      overflow: hidden;
      background: radial-gradient(ellipse at center,
        rgba(30, 17, 85, 0.6) 0%,
        rgba(6, 4, 16, 0.8) 60%,
        rgba(0, 0, 0, 0.9) 100%);
    }
    .warp-overlay.active {
      opacity: 1;
      pointer-events: all;
    }

    /* ── Center glow ── */
    .warp-center-glow {
      position: absolute;
      left: 50%; top: 50%;
      transform: translate(-50%, -50%);
      width: 0; height: 0;
      border-radius: 50%;
      background: transparent;
      box-shadow: 0 0 0 0 rgba(139,92,246,0);
      transition: box-shadow 0.35s ease;
    }
    .warp-overlay.active .warp-center-glow {
      box-shadow:
        0 0 60px 30px rgba(139,92,246,0.25),
        0 0 120px 60px rgba(6,182,212,0.15),
        0 0 200px 100px rgba(201,168,76,0.08);
    }

    /* ── Warp streaks ── */
    .warp-streaks {
      position: absolute; inset: 0;
    }
    .streak {
      position: absolute;
      left: 50%; top: 50%;
      width: 2px;
      height: 0;
      border-radius: 1px;
      background: linear-gradient(to bottom,
        rgba(139,92,246,0) 0%,
        rgba(103,232,249,0.8) 50%,
        rgba(254,243,199,0.4) 100%);
      transform-origin: 50% 0%;
      transform: rotate(var(--r)) translateY(var(--d));
      transition: height 0.3s ease, opacity 0.3s ease;
      opacity: 0;
    }
    .warp-overlay.active .streak {
      height: var(--l);
      opacity: 1;
    }
  `]
})
export class PageTransitionComponent {
  streaks = Array.from({ length: 32 }, (_, i) => ({
    d:  `${20 + Math.random() * 180}px`,
    r:  `${(i / 32) * 360}deg`,
    l:  `${60 + Math.random() * 140}px`,
  }));

  constructor(public svc: TransitionService) {}
}
