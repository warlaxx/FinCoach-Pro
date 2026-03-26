import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, first, filter, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { JWT_STORAGE_KEY } from '../../shared/config/app.config';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  picture: string;
  role: string;
  firstName: string;
  lastName: string;
  age?: number;
  emailVerified?: boolean;
}

export interface UpdateProfilePayload {
  firstName: string;
  lastName: string;
  age: number;
  currentPassword?: string;
  newPassword?: string;
}

export interface RegisterPayload {
  email: string;
  firstName: string;
  lastName: string;
  age: number;
  password: string;
}

export interface AuthResponse {
  token?: string;
  userId?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  emailVerified?: boolean;
  message?: string;
}

/**
 * Manages authentication state for the entire Angular application.
 *
 * Supports:
 *  - OAuth2 login (Google, Microsoft, Apple) via browser redirect
 *  - Email/password registration and login via REST API
 *  - Email verification via token link
 */
@Injectable({ providedIn: 'root' })
export class AuthService {

  private readonly TOKEN_KEY = JWT_STORAGE_KEY;
  private readonly API = environment.apiBaseUrl;

  private currentUserSubject = new BehaviorSubject<AuthUser | null>(null);
  currentUser$: Observable<AuthUser | null> = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    if (this.getToken()) {
      this.loadCurrentUser();
    }
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  handleCallback(token: string): Observable<AuthUser> {
    localStorage.setItem(this.TOKEN_KEY, token);
    this.loadCurrentUser();
    // Returns an observable that emits once the user is loaded
    return this.currentUser$.pipe(
      filter((user): user is AuthUser => user !== null),
      first()
    );
  }

  loadCurrentUser(): void {
    this.http.get<AuthUser>(`${this.API}/api/auth/me`).subscribe({
      next: (user) => this.currentUserSubject.next(user),
      error: () => this.logout()
    });
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getCurrentUser(): AuthUser | null {
    return this.currentUserSubject.getValue();
  }

  getCurrentUserId(): string {
    return this.currentUserSubject.getValue()?.id ?? 'user-demo';
  }

  /** Initiates an OAuth2 login (full browser redirect). */
  login(provider: 'google' | 'microsoft' | 'apple'): void {
    window.location.href = `${this.API}/oauth2/authorization/${provider}`;
  }

  /** Registers a new email/password account. */
  register(payload: RegisterPayload): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API}/api/auth/register`, payload);
  }

  /** Authenticates an email/password account. */
  loginWithEmail(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API}/api/auth/login`, { email, password });
  }

  /** Verifies an email address using the token from the verification link. */
  verifyEmail(token: string): Observable<AuthResponse> {
    return this.http.get<AuthResponse>(`${this.API}/api/auth/verify-email`, {
      params: { token }
    });
  }

  /** Resends the verification email. */
  resendVerification(email: string): Observable<any> {
    return this.http.post(`${this.API}/api/auth/resend-verification`, { email });
  }

  /** Requests a password reset email. */
  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${this.API}/api/auth/forgot-password`, { email });
  }

  /** Resets the password using the token from the email. */
  resetPassword(token: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.API}/api/auth/reset-password`, { token, newPassword });
  }

  /** Updates the current user's profile. */
  updateProfile(payload: UpdateProfilePayload): Observable<AuthResponse> {
    return this.http.put<AuthResponse>(`${this.API}/api/auth/profile`, payload).pipe(
      tap(res => {
        if (res.token) {
          localStorage.setItem(this.TOKEN_KEY, res.token);
          this.loadCurrentUser();
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    this.currentUserSubject.next(null);
  }
}
