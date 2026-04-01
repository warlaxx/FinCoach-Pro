import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LogoComponent } from '../../../shared/components/logo/logo.component';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, LogoComponent, FormsModule, RouterLink],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent implements OnInit {

  token = '';
  newPassword = '';
  confirmPassword = '';
  showPassword = false;
  showConfirm = false;

  loading = false;
  success = false;
  error: string | null = null;

  @ViewChild('errorBanner') errorBanner?: ElementRef<HTMLElement>;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';

    if (!this.token) {
      this.showError('Lien de réinitialisation invalide.');
    }
  }

  onSubmit(): void {
    this.error = null;

    if (this.newPassword.length < 8) {
      this.showError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.showError('Les mots de passe ne correspondent pas.');
      return;
    }

    this.loading = true;

    this.auth.resetPassword(this.token, this.newPassword).subscribe({
      next: (res: any) => {
        this.loading = false;
        if (!res.success) {
          this.showError(res.message ?? 'Une erreur est survenue. Veuillez réessayer.');
          return;
        }
        this.success = true;
        setTimeout(() => this.router.navigate(['/login']), 3000);
      },
      error: () => {
        this.loading = false;
        this.showError('Impossible de contacter le serveur. Vérifiez votre connexion.');
      }
    });
  }

  private showError(message: string): void {
    this.error = message;
    setTimeout(() => {
      this.errorBanner?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 0);
  }
}
