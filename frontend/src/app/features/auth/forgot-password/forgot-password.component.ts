import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LogoComponent } from '../../../shared/components/logo/logo.component';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, LogoComponent, FormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent {

  email = '';
  loading = false;
  success = false;
  error: string | null = null;

  constructor(private auth: AuthService) {}

  onSubmit(): void {
    if (!this.email.trim()) return;

    this.loading = true;
    this.error = null;

    this.auth.forgotPassword(this.email).subscribe({
      next: () => {
        this.loading = false;
        this.success = true;
      },
      error: () => {
        this.loading = false;
        // Show success anyway to prevent email enumeration
        this.success = true;
      }
    });
  }
}
