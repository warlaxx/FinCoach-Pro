import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ActionPlanComponent } from './components/action-plan/action-plan.component';
import { ChatComponent } from './components/chat/chat.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { AuthCallbackComponent } from './components/auth-callback/auth-callback.component';
import { EmailVerifiedComponent } from './components/email-verified/email-verified.component';
import { EmailConfirmationComponent } from './components/email-confirmation/email-confirmation.component';
import { LandingComponent } from './components/landing/landing.component';
import { MarketsComponent } from './components/markets/markets.component';
import { AccountSettingsComponent } from './components/account-settings/account-settings.component';
import { ForgotPasswordComponent } from './components/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './components/reset-password/reset-password.component';
import { authGuard } from './guards/auth.guard';

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
