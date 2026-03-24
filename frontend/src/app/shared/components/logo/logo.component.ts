import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-logo',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg [attr.width]="size" [attr.height]="size" viewBox="0 0 80 80"
         xmlns="http://www.w3.org/2000/svg" style="display:block;flex-shrink:0">
      <defs>
        <!-- Galaxy background radial gradient -->
        <radialGradient [attr.id]="'bg_'+uid" cx="38%" cy="32%" r="72%" gradientUnits="userSpaceOnUse"
                        x1="0" y1="0" x2="80" y2="80">
          <stop offset="0%"   stop-color="#1E1155"/>
          <stop offset="55%"  stop-color="#0E0B2E"/>
          <stop offset="100%" stop-color="#060410"/>
        </radialGradient>

        <!-- Gem top face: violet-purple -->
        <linearGradient [attr.id]="'fT_'+uid" x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0%"   stop-color="#C4B5FD"/>
          <stop offset="50%"  stop-color="#8B5CF6"/>
          <stop offset="100%" stop-color="#6D28D9"/>
        </linearGradient>

        <!-- Gem right face: cyan-teal -->
        <linearGradient [attr.id]="'fR_'+uid" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"   stop-color="#67E8F9"/>
          <stop offset="100%" stop-color="#0891B2"/>
        </linearGradient>

        <!-- Gem left face: deep indigo (shadow) -->
        <linearGradient [attr.id]="'fL_'+uid" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0%"   stop-color="#3730A3"/>
          <stop offset="100%" stop-color="#1E1B4B"/>
        </linearGradient>

        <!-- Gold gradient for $ -->
        <linearGradient [attr.id]="'gld_'+uid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stop-color="#FEF3C7"/>
          <stop offset="40%"  stop-color="#FCD34D"/>
          <stop offset="100%" stop-color="#B45309"/>
        </linearGradient>

        <!-- Inner highlight on top face -->
        <linearGradient [attr.id]="'hl_'+uid" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"   stop-color="white" stop-opacity="0.45"/>
          <stop offset="100%" stop-color="white" stop-opacity="0"/>
        </linearGradient>

        <!-- Glow filter -->
        <filter [attr.id]="'glow_'+uid" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.8" result="blur"/>
          <feMerge>
            <feMergeNode in="blur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>

        <!-- Drop shadow blur -->
        <filter [attr.id]="'drop_'+uid" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="blur"/>
          <feMerge>
            <feMergeNode in="blur"/>
          </feMerge>
        </filter>
      </defs>

      <!-- Background rounded square -->
      <rect width="80" height="80" rx="18" [attr.fill]="'url(#bg_'+uid+')'"/>

      <!-- Nebula glow blobs -->
      <ellipse cx="24" cy="28" rx="22" ry="14" fill="#7C3AED" opacity="0.09"/>
      <ellipse cx="57" cy="52" rx="18" ry="11" fill="#06B6D4" opacity="0.07"/>
      <ellipse cx="40" cy="40" rx="14" ry="10" fill="#4F46E5" opacity="0.05"/>

      <!-- Stars -->
      <circle cx="11" cy="11" r="0.8"  fill="white"   opacity="0.85"/>
      <circle cx="68" cy="8"  r="0.5"  fill="white"   opacity="0.65"/>
      <circle cx="74" cy="57" r="0.65" fill="white"   opacity="0.55"/>
      <circle cx="7"  cy="67" r="0.75" fill="#93C5FD" opacity="0.70"/>
      <circle cx="17" cy="73" r="0.45" fill="white"   opacity="0.45"/>
      <circle cx="64" cy="71" r="0.6"  fill="#C4B5FD" opacity="0.55"/>
      <circle cx="14" cy="49" r="0.5"  fill="white"   opacity="0.35"/>
      <circle cx="71" cy="34" r="0.45" fill="#BAE6FD" opacity="0.45"/>
      <circle cx="42" cy="7"  r="0.35" fill="white"   opacity="0.55"/>
      <circle cx="53" cy="14" r="0.4"  fill="#FDE68A" opacity="0.45"/>
      <circle cx="28" cy="67" r="0.35" fill="#C4B5FD" opacity="0.35"/>
      <circle cx="59" cy="20" r="0.3"  fill="white"   opacity="0.4"/>

      <!-- 3D Gem drop shadow -->
      <ellipse cx="40" cy="57" rx="14" ry="3.8"
               fill="#7C3AED" opacity="0.35"
               [attr.filter]="'url(#drop_'+uid+')'"/>

      <!-- ── 3D ISOMETRIC GEM ── -->
      <!-- Left face (shadow) -->
      <polygon points="40,21 21,37 21,55 40,55"
               [attr.fill]="'url(#fL_'+uid+')'"/>
      <!-- Right face (lit) -->
      <polygon points="40,21 59,37 59,55 40,55"
               [attr.fill]="'url(#fR_'+uid+')'"/>
      <!-- Top face (highlighted) -->
      <polygon points="40,21 59,37 40,48 21,37"
               [attr.fill]="'url(#fT_'+uid+')'"/>
      <!-- Inner highlight overlay on top face -->
      <polygon points="40,21 59,37 40,48 21,37"
               [attr.fill]="'url(#hl_'+uid+')'" opacity="0.6"/>

      <!-- Edge highlights (bevel lines) -->
      <line x1="40" y1="21" x2="59" y2="37" stroke="rgba(103,232,249,0.7)" stroke-width="0.9"/>
      <line x1="40" y1="21" x2="21" y2="37" stroke="rgba(196,181,253,0.55)" stroke-width="0.9"/>
      <line x1="21" y1="37" x2="21" y2="55" stroke="rgba(255,255,255,0.06)" stroke-width="0.5"/>
      <line x1="59" y1="37" x2="59" y2="55" stroke="rgba(255,255,255,0.12)" stroke-width="0.5"/>
      <line x1="21" y1="55" x2="40" y2="55" stroke="rgba(255,255,255,0.07)" stroke-width="0.5"/>
      <line x1="40" y1="55" x2="59" y2="55" stroke="rgba(255,255,255,0.1)"  stroke-width="0.5"/>
      <!-- Bottom center edge -->
      <line x1="40" y1="48" x2="40" y2="55" stroke="rgba(255,255,255,0.12)" stroke-width="0.5"/>

      <!-- Apex sparkle (top point) -->
      <circle cx="40" cy="21" r="1.8"
              fill="#FEF3C7" opacity="0.95"
              [attr.filter]="'url(#glow_'+uid+')'"/>
      <circle cx="40" cy="21" r="3.5"
              fill="none" stroke="#FDE68A" stroke-width="0.4" opacity="0.5"/>

      <!-- $ financial symbol (centered on top face) -->
      <text x="40" y="44"
            text-anchor="middle" dominant-baseline="middle"
            font-family="system-ui,-apple-system,'Segoe UI',sans-serif"
            font-size="13" font-weight="900" letter-spacing="-0.5"
            [attr.fill]="'url(#gld_'+uid+')'"
            [attr.filter]="'url(#glow_'+uid+')'">$</text>

      <!-- Small star glint on right edge -->
      <circle cx="59" cy="37" r="1.2" fill="white" opacity="0.6"
              [attr.filter]="'url(#glow_'+uid+')'"/>
    </svg>
  `
})
export class LogoComponent implements OnInit {
  @Input() size = 40;
  uid = '';

  ngOnInit(): void {
    this.uid = Math.random().toString(36).slice(2, 9);
  }
}
