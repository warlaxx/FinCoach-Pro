import { Component, ChangeDetectorRef, NgZone, OnInit } from '@angular/core';
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

  // Toggle between email/password and OAuth2 sections
  showEmailForm = true;

  constructor(
    private auth: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private cd: ChangeDetectorRef,
    private zone: NgZone
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
    if (this.emailLoading) return;

    this.emailLoading = true;
    this.emailError = null;
    this.isAccountNotFound = false;

    this.auth.loginWithEmail(this.emailForm.email, this.emailForm.password).subscribe({
      next: (res) => {
        if (res.token) {
          this.auth.handleCallback(res.token).subscribe({
            next: () => this.router.navigate(['/dashboard']),
            error: () => {
              this.emailLoading = false;
              this.emailError = 'Erreur lors du chargement du profil.';
              this.cd.detectChanges();
            }
          });
        } else {
          this.emailLoading = false;
          this.cd.detectChanges();
        }
      },
      error: (err) => {
        this.zone.run(() => {
          this.emailLoading = false;
          const msg = err.error?.error ?? 'Identifiants incorrects.';
          this.emailError = msg;
          this.isAccountNotFound = msg.includes('Aucun compte');
          this.cd.detectChanges();
        });
      }
    });
  }
}
