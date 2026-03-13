import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  picture: string;
}

/**
 * Manages authentication state for the entire Angular application.
 *
 * The JWT is stored in localStorage so it persists across page refreshes.
 * A BehaviorSubject broadcasts the current user to all subscribers — any
 * component that needs the user info (sidebar, dashboard) just subscribes
 * to currentUser$ and will automatically update when the user logs in/out.
 *
 * Why BehaviorSubject and not a simple variable?
 * BehaviorSubject is a reactive stream: it always has a current value AND
 * notifies all subscribers whenever it changes. Perfect for auth state.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {

  private readonly TOKEN_KEY = 'fincoach_token';
  private readonly API = 'http://localhost:8080';

  // null = not logged in, AuthUser = logged in
  private currentUserSubject = new BehaviorSubject<AuthUser | null>(null);

  // Public Observable that components subscribe to
  currentUser$: Observable<AuthUser | null> = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    // On startup, if there's a token in localStorage, load the user from the API
    if (this.getToken()) {
      this.loadCurrentUser();
    }
  }

  /** Returns the stored JWT, or null if not logged in */
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /** Stores the JWT and loads the user profile from the API */
  handleCallback(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    this.loadCurrentUser();
  }

  /** Fetches the current user info from /api/auth/me using the stored JWT */
  loadCurrentUser(): void {
    this.http.get<AuthUser>(`${this.API}/api/auth/me`).subscribe({
      next: (user) => {
        this.currentUserSubject.next(user);
      },
      error: () => {
        // Token is invalid or expired — clean up
        this.logout();
      }
    });
  }

  /** Returns true if a JWT is present in localStorage */
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  /** Returns the current user synchronously (may be null on first render) */
  getCurrentUser(): AuthUser | null {
    return this.currentUserSubject.getValue();
  }

  /** Returns the current user's ID, or 'user-demo' as fallback */
  getCurrentUserId(): string {
    return this.currentUserSubject.getValue()?.id ?? 'user-demo';
  }

  /**
   * Initiates an OAuth2 login with the given provider.
   * This is a full browser redirect (not an AJAX call) because the user
   * needs to be sent to Google/Microsoft/Apple's login page.
   * Spring Security handles the rest of the OAuth2 flow.
   */
  login(provider: 'google' | 'microsoft' | 'apple'): void {
    window.location.href = `${this.API}/oauth2/authorization/${provider}`;
  }

  /** Clears the token and user state */
  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    this.currentUserSubject.next(null);
  }
}
