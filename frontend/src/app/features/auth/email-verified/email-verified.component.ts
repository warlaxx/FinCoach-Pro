import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-email-verified',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './email-verified.component.html',
  styleUrls: ['./email-verified.component.scss']
})
export class EmailVerifiedComponent implements OnInit {

  status: 'loading' | 'success' | 'error' = 'loading';
  message = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');

    if (!token) {
      this.status = 'error';
      this.message = 'Lien de vérification invalide.';
      return;
    }

    this.auth.verifyEmail(token).subscribe({
      next: (res) => {
        this.status = 'success';
        this.message = res.message ?? 'Votre e-mail a été vérifié avec succès !';
        // Store JWT and update user state, then redirect to dashboard
        if (res.token) {
          this.auth.handleCallback(res.token);
          setTimeout(() => this.router.navigate(['/dashboard']), 2000);
        }
      },
      error: (err) => {
        this.status = 'error';
        this.message = err.error?.error ?? 'Le lien est invalide ou a expiré.';
      }
    });
  }
}
