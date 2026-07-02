import { bootstrapApplication } from '@angular/platform-browser';
import { provideZoneChangeDetection } from '@angular/core';
import { AppComponent } from './app/app.component';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { routes } from './app/app.routes';
import { jwtInterceptor } from './app/core/interceptors/jwt.interceptor';
import { authErrorInterceptor } from './app/core/interceptors/auth-error.interceptor';

bootstrapApplication(AppComponent, {
  providers: [
    // Enable Zone.js-based change detection. Angular v21 no longer turns this on
    // implicitly just because zone.js is a polyfill — without it the app runs
    // zoneless and views never refresh after async work (HTTP, timers, RxJS
    // subscriptions), leaving the dashboard stuck on "Chargement…", the goals
    // list empty, and the upgrade modal invisible. The codebase relies on
    // classic zone change detection, so provide it explicitly.
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([jwtInterceptor, authErrorInterceptor])),
    provideAnimations()
  ]
}).catch(err => console.error(err));
