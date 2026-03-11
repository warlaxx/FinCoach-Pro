import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ActionPlanComponent } from './components/action-plan/action-plan.component';
import { ChatComponent } from './components/chat/chat.component';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'actions', component: ActionPlanComponent },
  { path: 'chat', component: ChatComponent },
  { path: '**', redirectTo: 'dashboard' }
];
