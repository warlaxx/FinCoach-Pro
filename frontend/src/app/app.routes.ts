import { Routes } from '@angular/router';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { ActionPlanComponent } from './features/action-plan/action-plan.component';
import { ChatComponent } from './features/chat/chat.component';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { AuthCallbackComponent } from './features/auth/auth-callback/auth-callback.component';
import { EmailVerifiedComponent } from './features/auth/email-verified/email-verified.component';
import { EmailConfirmationComponent } from './features/auth/email-confirmation/email-confirmation.component';
import { LandingComponent } from './features/markets/landing/landing.component';
import { MarketsComponent } from './features/markets/markets.component';
import { AccountSettingsComponent } from './features/settings/account-settings.component';
import { ForgotPasswordComponent } from './features/auth/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './features/auth/reset-password/reset-password.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // Public routes — no JWT required
  { path: '', component: LandingComponent, pathMatch: 'full' },
  { path: 'markets', component: MarketsComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'auth/callback', component: AuthCallbackComponent },
  { path: 'verify-email', component: EmailVerifiedComponent },
  { path: 'confirm-email', component: EmailConfirmationComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'reset-password', component: ResetPasswordComponent },

  // Protected routes — authGuard redirects to /login if no JWT present
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'actions', component: ActionPlanComponent, canActivate: [authGuard] },
  { path: 'chat', component: ChatComponent, canActivate: [authGuard] },
  { path: 'settings', component: AccountSettingsComponent, canActivate: [authGuard] },

  { path: '**', redirectTo: '' }
];
