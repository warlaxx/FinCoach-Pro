import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { FinancialProfile } from '../../shared/models/financial-profile.model';
import { environment } from '../../../environments/environment';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private base = `${environment.apiBaseUrl}/api`;

  constructor(private http: HttpClient) {}

  /** Récupère le profil de l'utilisateur connecté (userId extrait du JWT côté backend). */
  getProfile(): Observable<any> {
    return this.http.get<ApiResponse<any>>(`${this.base}/profile`).pipe(
      map(res => {
        if (!res.success) throw new Error(res.message ?? 'Profil introuvable');
        return res.data;
      })
    );
  }

  /** Sauvegarde (upsert) le profil financier. L'userId est géré côté backend via JWT. */
  saveProfile(profile: FinancialProfile): Observable<any> {
    return this.http.post<ApiResponse<any>>(`${this.base}/profile`, profile).pipe(
      map(res => {
        if (!res.success) throw new Error(res.message ?? 'Erreur lors de la sauvegarde');
        return res.data;
      })
    );
  }
}
