import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FinancialProfile } from '../../shared/models/financial-profile.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private base = `${environment.apiBaseUrl}/api`;

  constructor(private http: HttpClient) {}

  /** Récupère le profil de l'utilisateur connecté (userId extrait du JWT côté backend). */
  getProfile(): Observable<any> {
    return this.http.get<any>(`${this.base}/profile`);
  }

  /** Sauvegarde (upsert) le profil financier. L'userId est géré côté backend via JWT. */
  saveProfile(profile: FinancialProfile): Observable<any> {
    return this.http.post<any>(`${this.base}/profile`, profile);
  }
}
