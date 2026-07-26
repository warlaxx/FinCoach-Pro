import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService, AuthUser, UpdateProfilePayload } from '../auth/auth.service';
import { BillingService, BillingDisabledError } from '../../shared/services/billing.service';

@Component({
  selector: 'app-account-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
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

  /** Abonnement (TICKET-15) */
  portalLoading = false;
  billingMessage: string | null = null;
  billingError: string | null = null;

  constructor(
    private auth: AuthService,
    private billing: BillingService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.auth.currentUser$.subscribe(user => {
      this.user = user;
      if (user) {
        this.form.firstName = user.firstName || '';
        this.form.lastName = user.lastName || '';
        this.form.age = user.age ?? null;
      }
    });

    // Retour de Stripe Checkout : le plan est activé par webhook (asynchrone),
    // on recharge donc le profil et on confirme à l'utilisateur.
    const checkout = this.route.snapshot.queryParamMap.get('checkout');
    if (checkout === 'success') {
      this.billingMessage =
        'Paiement confirmé ! Votre abonnement sera actif d\'ici quelques secondes.';
      this.auth.loadCurrentUser().subscribe();
      this.router.navigate([], { queryParams: {}, replaceUrl: true });
    }
  }

  get isPaidPlan(): boolean {
    const plan = (this.user?.plan ?? 'FREEMIUM').toUpperCase();
    return plan === 'PRO' || plan === 'PREMIUM';
  }

  /** Ouvre le portail client Stripe (gestion carte, factures, annulation). */
  openBillingPortal(): void {
    if (this.portalLoading) return;
    this.portalLoading = true;
    this.billingError = null;

    this.billing.openPortal().subscribe({
      next: (url) => {
        window.location.href = url;
      },
      error: (err: Error) => {
        this.portalLoading = false;
        this.billingError =
          err instanceof BillingDisabledError
            ? "Le paiement en ligne n'est pas encore activé sur ce serveur."
            : err?.message ?? "Impossible d'ouvrir le portail d'abonnement.";
      },
    });
  }

  get passwordsMatch(): boolean {
    return this.passwordForm.newPassword === this.passwordForm.confirmPassword;
  }

  /** Human-readable subscription plan name (TICKET-16) */
  get planLabel(): string {
    const plan = (this.user?.plan ?? 'FREEMIUM').toUpperCase();
    if (plan === 'PRO') return 'Pro';
    if (plan === 'PREMIUM') return 'Premium';
    return 'Freemium';
  }

  get planIcon(): string {
    const plan = (this.user?.plan ?? 'FREEMIUM').toUpperCase();
    if (plan === 'PRO') return '💎';
    if (plan === 'PREMIUM') return '🏆';
    return '🆓';
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
      next: () => {
        this.loading = false;
        this.successMessage = 'Profil mis à jour avec succès.';
        setTimeout(() => this.successMessage = null, 4000);
      },
      error: (err: Error) => {
        this.loading = false;
        this.errorMessage = err?.message ?? 'Erreur lors de la mise à jour.';
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
      next: () => {
        this.passwordLoading = false;
        this.passwordSuccess = 'Mot de passe modifié avec succès.';
        this.passwordForm = { currentPassword: '', newPassword: '', confirmPassword: '' };
        setTimeout(() => this.passwordSuccess = null, 4000);
      },
      error: (err: Error) => {
        this.passwordLoading = false;
        this.passwordError = err?.message ?? 'Erreur lors du changement de mot de passe.';
      }
    });
  }
}
