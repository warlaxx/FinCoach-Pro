import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DashboardData } from '../models/dashboard-data.model';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private base = `${environment.apiBaseUrl}/api`;

  constructor(private http: HttpClient, private auth: AuthService) {}

  getDashboard(): Observable<DashboardData> {
    const userId = this.auth.getCurrentUserId();
    return this.http.get<DashboardData>(`${this.base}/dashboard/${userId}`);
  }
}
