import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FinancialProfile } from '../models/financial-profile.model';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private base = 'http://localhost:8080/api';

  constructor(private http: HttpClient, private auth: AuthService) {}

  saveProfile(profile: FinancialProfile): Observable<any> {
    const userId = this.auth.getCurrentUserId();
    return this.http.post<any>(`${this.base}/profile`, { ...profile, userId });
  }
}
