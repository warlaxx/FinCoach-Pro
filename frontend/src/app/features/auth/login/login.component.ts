import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  // OAuth2
  errorMessage: string | null = null;
  loading: string | null = null;

  // Email/password
  emailForm = { email: '', password: '' };
  emailLoading = false;
  emailError: string | null = null;
  showPassword = false;

  // Toggle between email/password and OAuth2 sections
  showEmailForm = false;

  constructor(
    private auth: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['error']) {
        this.errorMessage = decodeURIComponent(params['error']);
      }
    });
  }

  loginWith(provider: 'google' | 'microsoft' | 'apple'): void {
    this.loading = provider;
    this.auth.login(provider);
  }

  onEmailLogin(): void {
    this.emailLoading = true;
    this.emailError = null;

    this.auth.loginWithEmail(this.emailForm.email, this.emailForm.password).subscribe({
      next: (res) => {
        this.emailLoading = false;
        if (res.token) {
          this.auth.handleCallback(res.token);
          this.router.navigate(['/dashboard']);
        }
      },
      error: (err) => {
        this.emailLoading = false;
        this.emailError = err.error?.error ?? 'Identifiants incorrects.';
      }
    });
  }
}
