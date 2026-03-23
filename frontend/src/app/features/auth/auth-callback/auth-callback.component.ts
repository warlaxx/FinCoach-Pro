import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../auth.service';

/**
 * Handles the OAuth2 callback redirect from the backend.
 *
 * After the user authenticates with Google/Microsoft/Apple:
 * 1. The backend's OAuth2SuccessHandler generates a JWT
 * 2. It redirects the browser to: http://localhost:4200/auth/callback?token={JWT}
 * 3. This component reads the token from the URL
 * 4. Stores it via AuthService
 * 5. Navigates to the dashboard
 *
 * If no token is in the URL, we redirect to the login page (something went wrong).
 */
@Component({
  selector: 'app-auth-callback',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="callback-wrapper">
      <div class="callback-card">
        <span class="logo-icon">💰</span>
        <p>Connexion en cours...</p>
        <div class="spinner"></div>
      </div>
    </div>
  `,
  styles: [`
    .callback-wrapper {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg-main, #0f1117);
    }
    .callback-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      color: var(--text-secondary, #94a3b8);
      font-size: 15px;
    }
    .logo-icon { font-size: 40px; }
    .spinner {
      width: 28px;
      height: 28px;
      border: 3px solid rgba(201, 168, 76, 0.2);
      border-top-color: var(--gold, #c9a84c);
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class AuthCallbackComponent implements OnInit {

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const token = params['token'];

      if (token) {
        // Store the JWT and load user profile, then go to dashboard
        this.auth.handleCallback(token);
        this.router.navigate(['/dashboard']);
      } else {
        // No token means something went wrong — back to login
        this.router.navigate(['/login']);
      }
    });
  }
}
