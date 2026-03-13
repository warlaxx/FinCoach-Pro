import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ActionPlanComponent } from './components/action-plan/action-plan.component';
import { ChatComponent } from './components/chat/chat.component';
import { LoginComponent } from './components/login/login.component';
import { AuthCallbackComponent } from './components/auth-callback/auth-callback.component';
import { LandingComponent } from './components/landing/landing.component';
import { MarketsComponent } from './components/markets/markets.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  // Public routes — no JWT required
  { path: '', component: LandingComponent, pathMatch: 'full' },
  { path: 'markets', component: MarketsComponent },
  { path: 'login', component: LoginComponent },
  { path: 'auth/callback', component: AuthCallbackComponent },

  // Protected routes — authGuard redirects to /login if no JWT present
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'actions', component: ActionPlanComponent, canActivate: [authGuard] },
  { path: 'chat', component: ChatComponent, canActivate: [authGuard] },

  { path: '**', redirectTo: '' }
];
