import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
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

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  get passwordsMatch(): boolean {
    return this.form.password === this.form.confirmPassword;
  }

  onSubmit(): void {
    if (!this.passwordsMatch) {
      this.errorMessage = 'Les mots de passe ne correspondent pas.';
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
      next: () => {
        this.loading = false;
        this.router.navigate(['/confirm-email'], {
          state: { email: this.form.email, firstName: this.form.firstName }
        });
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.error ?? 'Une erreur est survenue. Veuillez réessayer.';
      }
    });
  }
}
