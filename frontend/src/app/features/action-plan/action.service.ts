import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ActionPlan } from '../../shared/models/action-plan.model';
import { AuthService } from '../auth/auth.service';
import { UpgradeModalService } from '../../shared/services/upgrade-modal.service';
import { environment } from '../../../environments/environment';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  code?: string;
  requiredPlan?: string;
}

@Injectable({ providedIn: 'root' })
export class ActionService {
  private base = `${environment.apiBaseUrl}/api`;

  constructor(
    private http: HttpClient,
    private auth: AuthService,
    private upgradeModal: UpgradeModalService,
  ) {}

  getActions(): Observable<ActionPlan[]> {
    const userId = this.auth.getCurrentUserId();
    return this.http.get<ApiResponse<ActionPlan[]>>(`${this.base}/actions/${userId}`).pipe(
      map(res => {
        if (!res.success) throw new Error(res.message ?? 'Erreur lors du chargement des actions');
        return res.data ?? [];
      })
    );
  }

  createAction(action: ActionPlan): Observable<ActionPlan> {
    const userId = this.auth.getCurrentUserId();
    return this.http.post<ApiResponse<ActionPlan>>(`${this.base}/actions`, { ...action, userId }).pipe(
      map(res => {
        if (!res.success) {
          if (res.code === 'UPGRADE_REQUIRED') {
            this.upgradeModal.open(res.message ?? 'Limite d\'objectifs atteinte.', res.requiredPlan ?? 'PRO');
          }
          throw new Error(res.message ?? 'Erreur lors de la création');
        }
        return res.data!;
      })
    );
  }

  updateActionStatus(id: number, status: string, currentAmount?: number): Observable<ActionPlan> {
    return this.http.put<ApiResponse<ActionPlan>>(`${this.base}/actions/${id}/status`, {
      status,
      ...(currentAmount !== undefined ? { currentAmount } : {}),
    }).pipe(
      map(res => {
        if (!res.success) throw new Error(res.message ?? 'Erreur lors de la mise à jour');
        return res.data!;
      })
    );
  }

  deleteAction(id: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.base}/actions/${id}`).pipe(
      map(res => {
        if (!res.success) throw new Error(res.message ?? 'Erreur lors de la suppression');
      })
    );
  }
}
