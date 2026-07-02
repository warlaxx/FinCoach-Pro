import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import {
  BehaviorSubject,
  Observable,
  Subscription,
  of,
  throwError,
  catchError,
  tap,
  timeout,
  map,
} from "rxjs";
import { environment } from "../../../environments/environment";
import {
  JWT_STORAGE_KEY,
  AUTH_REQUEST_TIMEOUT_MS,
} from "../../shared/config/app.config";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  picture: string;
  role: string;
  plan?: string;
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

/** Shape of every backend response envelope */
interface ApiEnvelope {
  success: boolean;
  data?: any;
  message?: string;
}

/**
 * Manages authentication state for the entire Angular application.
 *
 * All public methods either:
 *  - emit the resolved value in `next` on success
 *  - throw a plain Error (with a user-facing message) that lands in `error`
 *
 * Components only need to handle `next` (success) and `error` (failure) —
 * never inspect `res.success` directly.
 */
@Injectable({ providedIn: "root" })
export class AuthService {
  private readonly TOKEN_KEY = JWT_STORAGE_KEY;
  private readonly API = environment.apiBaseUrl;

  private currentUserSubject = new BehaviorSubject<AuthUser | null>(null);
  currentUser$: Observable<AuthUser | null> =
    this.currentUserSubject.asObservable();

  /** Emits true once the initial auth check (GET /api/auth/me) has completed or was skipped. */
  private authReadySubject = new BehaviorSubject<boolean>(false);
  authReady$: Observable<boolean> = this.authReadySubject.asObservable();

  /** Holds the bootstrap loadCurrentUser() subscription so handleCallback() can cancel it. */
  private bootstrapSub: Subscription | null = null;

  constructor(private http: HttpClient) {
    if (this.getToken()) {
      this.bootstrapSub = this.loadCurrentUser().subscribe();
    } else {
      this.authReadySubject.next(true);
    }
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  handleCallback(token: string): Observable<AuthUser> {
    this.bootstrapSub?.unsubscribe();
    this.bootstrapSub = null;

    localStorage.setItem(this.TOKEN_KEY, token);
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    return this.http
      .get<{ success: boolean; data?: AuthUser }>(
        `${this.API}/api/auth/me`,
        { headers },
      )
      .pipe(
        timeout(AUTH_REQUEST_TIMEOUT_MS),
        map((res) => res.data!),
        tap((user) => {
          this.currentUserSubject.next(user);
          this.authReadySubject.next(true);
        }),
        catchError((err) => {
          if (err.status === 401 || err.status === 403) {
            this.logout();
          }
          this.authReadySubject.next(true);
          return throwError(() => err);
        }),
      );
  }

  loadCurrentUser(): Observable<AuthUser | null> {
    const tokenAtRequest = this.getToken();
    const headers = tokenAtRequest
      ? new HttpHeaders({ Authorization: `Bearer ${tokenAtRequest}` })
      : new HttpHeaders();
    return this.http
      .get<{ success: boolean; data?: AuthUser }>(
        `${this.API}/api/auth/me`,
        { headers },
      )
      .pipe(
        timeout(AUTH_REQUEST_TIMEOUT_MS),
        map((res) => res.data ?? null),
        tap((user) => {
          if (this.getToken() !== tokenAtRequest) return;
          this.currentUserSubject.next(user);
          this.authReadySubject.next(true);
        }),
        catchError((err) => {
          if (this.getToken() !== tokenAtRequest) {
            this.authReadySubject.next(true);
            return of(null);
          }
          if (err.status === 401 || err.status === 403) {
            this.logout();
          }
          this.authReadySubject.next(true);
          return of(null);
        }),
      );
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getCurrentUser(): AuthUser | null {
    return this.currentUserSubject.getValue();
  }

  getCurrentUserId(): string {
    return this.currentUserSubject.getValue()?.id ?? "user-demo";
  }

  /** Initiates an OAuth2 login (full browser redirect). */
  login(provider: "google" | "microsoft" | "apple"): void {
    window.location.href = `${this.API}/oauth2/authorization/${provider}`;
  }

  /**
   * Authenticates with email + password.
   * Emits the JWT token on success; throws an Error with a user-facing message on failure.
   */
  loginWithEmail(email: string, password: string): Observable<string> {
    return this.http
      .post<ApiEnvelope>(`${this.API}/api/auth/login`, { email, password })
      .pipe(
        map((res) => {
          if (!res.success) {
            throw new Error(res.message ?? "Identifiants incorrects.");
          }
          const token: string | undefined = res.data?.token;
          if (!token) {
            throw new Error("Réponse inattendue du serveur. Veuillez réessayer.");
          }
          return token;
        }),
      );
  }

  /** Stores the token and loads the user profile from /api/auth/me. */
  loginWithToken(token: string): Observable<AuthUser> {
    localStorage.setItem(this.TOKEN_KEY, token);
    return this.loadCurrentUser().pipe(
      map((user) => {
        if (!user) {
          throw new Error(
            "Impossible de charger votre profil. Veuillez réessayer.",
          );
        }
        return user;
      }),
    );
  }

  /**
   * Registers a new email/password account.
   * Completes (void) on success; throws an Error with a user-facing message on failure.
   */
  register(payload: RegisterPayload): Observable<void> {
    return this.http
      .post<ApiEnvelope>(`${this.API}/api/auth/register`, payload)
      .pipe(
        map((res) => {
          if (!res.success) {
            throw new Error(res.message ?? "Erreur lors de l'inscription.");
          }
          return void 0;
        }),
      );
  }

  /**
   * Verifies an email address using the token from the verification link.
   * Emits the full envelope on success (caller may extract token); throws on failure.
   */
  verifyEmail(token: string): Observable<ApiEnvelope> {
    return this.http
      .get<ApiEnvelope>(`${this.API}/api/auth/verify-email`, {
        params: { token },
      })
      .pipe(
        map((res) => {
          if (!res.success) {
            throw new Error(res.message ?? "Lien invalide ou expiré.");
          }
          return res;
        }),
      );
  }

  /**
   * Resends the verification email.
   * Throws an Error with a user-facing message on failure.
   */
  resendVerification(email: string): Observable<void> {
    return this.http
      .post<ApiEnvelope>(`${this.API}/api/auth/resend-verification`, { email })
      .pipe(
        map((res) => {
          if (!res.success) {
            throw new Error(res.message ?? "Impossible de renvoyer l'e-mail.");
          }
          return void 0;
        }),
      );
  }

  /**
   * Requests a password-reset email.
   * Always completes (void) — never throws, to prevent email enumeration.
   */
  forgotPassword(email: string): Observable<void> {
    return this.http
      .post<ApiEnvelope>(`${this.API}/api/auth/forgot-password`, { email })
      .pipe(map(() => void 0));
  }

  /**
   * Resets the password using the token from the email.
   * Completes (void) on success; throws an Error with a user-facing message on failure.
   */
  resetPassword(token: string, newPassword: string): Observable<void> {
    return this.http
      .post<ApiEnvelope>(`${this.API}/api/auth/reset-password`, {
        token,
        newPassword,
      })
      .pipe(
        map((res) => {
          if (!res.success) {
            throw new Error(
              res.message ?? "Erreur lors de la réinitialisation.",
            );
          }
          return void 0;
        }),
      );
  }

  /**
   * Updates the current user's profile (name, age, password).
   * Refreshes the JWT automatically on success.
   * Completes (void) on success; throws an Error with a user-facing message on failure.
   */
  updateProfile(payload: UpdateProfilePayload): Observable<void> {
    return this.http
      .put<ApiEnvelope>(`${this.API}/api/auth/profile`, payload)
      .pipe(
        map((res) => {
          if (!res.success) {
            throw new Error(res.message ?? "Erreur lors de la mise à jour.");
          }
          return res;
        }),
        tap((res) => {
          const token: string | undefined = res.data?.token;
          if (token) {
            localStorage.setItem(this.TOKEN_KEY, token);
            this.loadCurrentUser().subscribe();
          }
        }),
        map(() => void 0),
      );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    this.currentUserSubject.next(null);
  }
}
