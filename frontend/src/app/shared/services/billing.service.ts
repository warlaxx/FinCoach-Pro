import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  code?: string;
}

/** Erreur typée : Stripe n'est pas configuré côté backend. */
export class BillingDisabledError extends Error {
  readonly code = 'BILLING_DISABLED';

  constructor(message: string) {
    super(message);
    this.name = 'BillingDisabledError';
  }
}

/**
 * Facturation Stripe — TICKET-15.
 *
 * createCheckout / openPortal retournent l'URL Stripe vers laquelle rediriger
 * (window.location.href). Si le backend répond BILLING_DISABLED, une
 * BillingDisabledError est levée pour que l'appelant applique son fallback.
 */
@Injectable({ providedIn: 'root' })
export class BillingService {
  private base = `${environment.apiBaseUrl}/api/billing`;

  constructor(private http: HttpClient) {}

  /** Le paiement en ligne est-il activé côté backend ? */
  isEnabled(): Observable<boolean> {
    return this.http.get<ApiResponse<{ enabled: boolean }>>(`${this.base}/config`).pipe(
      map(res => !!res.data?.enabled),
    );
  }

  createCheckout(plan: 'PRO' | 'PREMIUM', interval: 'monthly' | 'annual'): Observable<string> {
    return this.http
      .post<ApiResponse<{ url: string }>>(`${this.base}/checkout`, { plan, interval })
      .pipe(map(res => this.extractUrl(res, 'Erreur lors de la création du paiement.')));
  }

  openPortal(): Observable<string> {
    return this.http
      .post<ApiResponse<{ url: string }>>(`${this.base}/portal`, {})
      .pipe(map(res => this.extractUrl(res, "Impossible d'ouvrir le portail d'abonnement.")));
  }

  private extractUrl(res: ApiResponse<{ url: string }>, fallbackMessage: string): string {
    if (!res.success || !res.data?.url) {
      if (res.code === 'BILLING_DISABLED') {
        throw new BillingDisabledError(res.message ?? "Le paiement en ligne n'est pas encore activé.");
      }
      throw new Error(res.message ?? fallbackMessage);
    }
    return res.data.url;
  }
}
