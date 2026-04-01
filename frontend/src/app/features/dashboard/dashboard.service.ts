import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { DashboardData } from '../../shared/models/dashboard-data.model';
import { AuthService } from '../auth/auth.service';
import { environment } from '../../../environments/environment';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private base = `${environment.apiBaseUrl}/api`;

  constructor(private http: HttpClient, private auth: AuthService) {}

  getDashboard(): Observable<DashboardData> {
    const userId = this.auth.getCurrentUserId();
    return this.http.get<ApiResponse<DashboardData>>(`${this.base}/dashboard/${userId}`).pipe(
      map(res => {
        if (!res.success) throw new Error(res.message ?? 'Erreur lors du chargement du dashboard');
        return res.data!;
      })
    );
  }
}
