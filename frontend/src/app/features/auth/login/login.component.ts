import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LogoComponent } from '../../../shared/components/logo/logo.component';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, LogoComponent, FormsModule, RouterLink],
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
  isAccountNotFound = false;
  showPassword = false;

  showEmailForm = false;

  @ViewChild('emailErrorBanner') emailErrorBanner?: ElementRef<HTMLElement>;

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
    this.isAccountNotFound = false;

    this.auth.loginWithEmail(this.emailForm.email, this.emailForm.password).subscribe({
      next: (res) => {
        if (!res.token) {
          this.emailLoading = false;
          return;
        }
        this.auth.handleCallback(res.token).subscribe({
          next: () => {
            this.emailLoading = false;
            this.router.navigate(['/dashboard']);
          },
          error: () => {
            this.emailLoading = false;
            this.showError('Impossible de charger votre profil.');
          }
        });
      },
      error: (err: any) => {
        this.emailLoading = false;
        const msg: string = err?.error?.error ?? 'Une erreur est survenue. Veuillez réessayer.';
        this.isAccountNotFound = msg.toLowerCase().includes('aucun compte');
        this.showError(msg);
      }
    });
  }

  private showError(message: string): void {
    this.emailError = message;
    setTimeout(() => {
      this.emailErrorBanner?.nativeElement?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 0);
  }
}
