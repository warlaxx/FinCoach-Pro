import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FinancialProfile } from '../../shared/models/financial-profile.model';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private base = `${environment.apiBaseUrl}/api`;

  constructor(private http: HttpClient, private auth: AuthService) {}

  saveProfile(profile: FinancialProfile): Observable<any> {
    const userId = this.auth.getCurrentUserId();
    return this.http.post<any>(`${this.base}/profile`, { ...profile, userId });
  }
}
