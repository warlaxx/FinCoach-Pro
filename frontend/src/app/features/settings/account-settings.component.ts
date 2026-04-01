import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService, AuthUser, UpdateProfilePayload } from '../auth/auth.service';

@Component({
  selector: 'app-account-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './account-settings.component.html',
  styleUrls: ['./account-settings.component.scss']
})
export class AccountSettingsComponent implements OnInit {

  user: AuthUser | null = null;

  form = {
    firstName: '',
    lastName: '',
    age: null as number | null
  };

  passwordForm = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  loading = false;
  passwordLoading = false;
  successMessage: string | null = null;
  errorMessage: string | null = null;
  passwordSuccess: string | null = null;
  passwordError: string | null = null;
  showCurrentPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;

  constructor(private auth: AuthService) {}

  ngOnInit(): void {
    this.auth.currentUser$.subscribe(user => {
      this.user = user;
      if (user) {
        this.form.firstName = user.firstName || '';
        this.form.lastName = user.lastName || '';
        this.form.age = user.age ?? null;
      }
    });
  }

  get passwordsMatch(): boolean {
    return this.passwordForm.newPassword === this.passwordForm.confirmPassword;
  }

  onSaveProfile(): void {
    this.loading = true;
    this.successMessage = null;
    this.errorMessage = null;

    const payload: UpdateProfilePayload = {
      firstName: this.form.firstName,
      lastName: this.form.lastName,
      age: this.form.age!
    };

    this.auth.updateProfile(payload).subscribe({
      next: (res) => {
        this.loading = false;
        if (!res.success) {
          this.errorMessage = res.message ?? 'Erreur lors de la mise à jour.';
          return;
        }
        this.successMessage = 'Profil mis à jour avec succès.';
        setTimeout(() => this.successMessage = null, 4000);
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'Impossible de contacter le serveur. Vérifiez votre connexion.';
      }
    });
  }

  onChangePassword(): void {
    if (!this.passwordsMatch) {
      this.passwordError = 'Les mots de passe ne correspondent pas.';
      return;
    }

    this.passwordLoading = true;
    this.passwordSuccess = null;
    this.passwordError = null;

    const payload: UpdateProfilePayload = {
      firstName: this.form.firstName,
      lastName: this.form.lastName,
      age: this.form.age!,
      currentPassword: this.passwordForm.currentPassword,
      newPassword: this.passwordForm.newPassword
    };

    this.auth.updateProfile(payload).subscribe({
      next: (res) => {
        this.passwordLoading = false;
        if (!res.success) {
          this.passwordError = res.message ?? 'Erreur lors du changement de mot de passe.';
          return;
        }
        this.passwordSuccess = 'Mot de passe modifié avec succès.';
        this.passwordForm = { currentPassword: '', newPassword: '', confirmPassword: '' };
        setTimeout(() => this.passwordSuccess = null, 4000);
      },
      error: () => {
        this.passwordLoading = false;
        this.passwordError = 'Impossible de contacter le serveur. Vérifiez votre connexion.';
      }
    });
  }
}
