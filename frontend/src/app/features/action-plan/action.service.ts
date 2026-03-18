import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ActionPlan } from '../../shared/models/action-plan.model';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ActionService {
  private base = `${environment.apiBaseUrl}/api`;

  constructor(private http: HttpClient, private auth: AuthService) {}

  getActions(): Observable<ActionPlan[]> {
    const userId = this.auth.getCurrentUserId();
    return this.http.get<ActionPlan[]>(`${this.base}/actions/${userId}`);
  }

  createAction(action: ActionPlan): Observable<ActionPlan> {
    const userId = this.auth.getCurrentUserId();
    return this.http.post<ActionPlan>(`${this.base}/actions`, { ...action, userId });
  }

  updateActionStatus(id: number, status: string, currentAmount?: number): Observable<ActionPlan> {
    return this.http.put<ActionPlan>(`${this.base}/actions/${id}/status`, {
      status,
      ...(currentAmount !== undefined ? { currentAmount } : {}),
    });
  }

  deleteAction(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/actions/${id}`);
  }
}
