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
        <!-- Top face: light white -->
        <linearGradient [attr.id]="'fT_'+uid" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"   stop-color="#FFFFFF"/>
          <stop offset="100%" stop-color="#CCCCCC"/>
        </linearGradient>
        <!-- Right face: medium gray -->
        <linearGradient [attr.id]="'fR_'+uid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stop-color="#888888"/>
          <stop offset="100%" stop-color="#555555"/>
        </linearGradient>
        <!-- Left face: dark -->
        <linearGradient [attr.id]="'fL_'+uid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stop-color="#333333"/>
          <stop offset="100%" stop-color="#1A1A1A"/>
        </linearGradient>
        <!-- Glow filter -->
        <filter [attr.id]="'glow_'+uid" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="blur"/>
          <feMerge>
            <feMergeNode in="blur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      <!-- Background: near-black rounded square -->
      <rect width="80" height="80" rx="18" fill="#0A0A0A"/>
      <!-- Subtle border -->
      <rect width="80" height="80" rx="18" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>

      <!-- ── 3D ISOMETRIC GEM (monochrome) ── -->
      <!-- Left face (dark) -->
      <polygon points="40,20 21,36 21,55 40,55"
               [attr.fill]="'url(#fL_'+uid+')'"/>
      <!-- Right face (mid gray) -->
      <polygon points="40,20 59,36 59,55 40,55"
               [attr.fill]="'url(#fR_'+uid+')'"/>
      <!-- Top face (white) -->
      <polygon points="40,20 59,36 40,47 21,36"
               [attr.fill]="'url(#fT_'+uid+')'"/>

      <!-- Edge lines -->
      <line x1="40" y1="20" x2="59" y2="36" stroke="rgba(255,255,255,0.35)" stroke-width="0.8"/>
      <line x1="40" y1="20" x2="21" y2="36" stroke="rgba(255,255,255,0.20)" stroke-width="0.8"/>
      <line x1="21" y1="36" x2="21" y2="55" stroke="rgba(255,255,255,0.05)" stroke-width="0.5"/>
      <line x1="59" y1="36" x2="59" y2="55" stroke="rgba(255,255,255,0.08)" stroke-width="0.5"/>
      <line x1="21" y1="55" x2="59" y2="55" stroke="rgba(255,255,255,0.06)" stroke-width="0.5"/>
      <line x1="40" y1="47" x2="40" y2="55" stroke="rgba(255,255,255,0.10)" stroke-width="0.5"/>

      <!-- $ symbol in white -->
      <text x="40" y="44"
            text-anchor="middle" dominant-baseline="middle"
            font-family="system-ui,-apple-system,'Segoe UI',sans-serif"
            font-size="12" font-weight="900"
            fill="#000000"
            [attr.filter]="'url(#glow_'+uid+')'">$</text>

      <!-- Apex dot -->
      <circle cx="40" cy="20" r="1.5" fill="white" opacity="0.9"
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
