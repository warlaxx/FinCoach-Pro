import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { LogoComponent } from '../../../shared/components/logo/logo.component';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-email-confirmation',
  standalone: true,
  imports: [CommonModule, LogoComponent, RouterLink],
  templateUrl: './email-confirmation.component.html',
  styleUrls: ['./email-confirmation.component.scss']
})
export class EmailConfirmationComponent implements OnInit {

  email = '';
  firstName = '';
  resending = false;
  resendSuccess = false;
  resendError: string | null = null;
  countdown = 0;
  private countdownInterval: any;

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Get registration info from navigation state
    const nav = this.router.getCurrentNavigation()?.extras?.state
      ?? history.state;

    this.email = nav?.['email'] ?? '';
    this.firstName = nav?.['firstName'] ?? '';

    if (!this.email) {
      this.router.navigate(['/register']);
    }
  }

  resendEmail(): void {
    if (this.countdown > 0 || this.resending) return;

    this.resending = true;
    this.resendSuccess = false;
    this.resendError = null;

    this.auth.resendVerification(this.email).subscribe({
      next: () => {
        this.resending = false;
        this.resendSuccess = true;
        this.startCountdown();
      },
      error: (err) => {
        this.resending = false;
        this.resendError = err.error?.error ?? 'Impossible de renvoyer l\'e-mail. Réessayez plus tard.';
      }
    });
  }

  private startCountdown(): void {
    this.countdown = 60;
    this.countdownInterval = setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0) {
        clearInterval(this.countdownInterval);
        this.resendSuccess = false;
      }
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }
}
