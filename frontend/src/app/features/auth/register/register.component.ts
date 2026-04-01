import { Component, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LogoComponent } from '../../../shared/components/logo/logo.component';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, LogoComponent, FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {

  form = {
    email: '',
    firstName: '',
    lastName: '',
    age: null as number | null,
    password: '',
    confirmPassword: ''
  };

  loading = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  showPassword = false;
  showConfirmPassword = false;

  @ViewChild('errorBanner') errorBanner?: ElementRef<HTMLElement>;

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  get passwordsMatch(): boolean {
    return this.form.password === this.form.confirmPassword;
  }

  onSubmit(): void {
    if (!this.passwordsMatch) {
      this.showError('Les mots de passe ne correspondent pas.');
      return;
    }

    this.loading = true;
    this.errorMessage = null;
    this.successMessage = null;

    this.auth.register({
      email: this.form.email,
      firstName: this.form.firstName,
      lastName: this.form.lastName,
      age: this.form.age!,
      password: this.form.password
    }).subscribe({
      next: (res) => {
        this.loading = false;
        if (!res.success) {
          this.showError(res.message ?? 'Une erreur est survenue. Veuillez réessayer.');
          return;
        }
        this.router.navigate(['/confirm-email'], {
          state: { email: this.form.email, firstName: this.form.firstName }
        });
      },
      error: () => {
        this.loading = false;
        this.showError('Impossible de contacter le serveur. Vérifiez votre connexion.');
      }
    });
  }

  private showError(message: string): void {
    this.errorMessage = message;
    setTimeout(() => {
      this.errorBanner?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 0);
  }
}
