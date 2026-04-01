import { Component, OnInit, ViewChild, ElementRef } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { LogoComponent } from "../../../shared/components/logo/logo.component";
import { AuthService, AuthResponse } from "../auth.service";

@Component({
  selector: "app-login",
  standalone: true,
  imports: [CommonModule, LogoComponent, FormsModule, RouterLink],
  templateUrl: "./login.component.html",
  styleUrls: ["./login.component.scss"],
})
export class LoginComponent implements OnInit {
  // OAuth2
  errorMessage: string | null = null;
  loading: string | null = null;

  // Email/password
  emailForm = { email: "", password: "" };
  emailLoading = false;
  emailError: string | null = null;
  isAccountNotFound = false;
  showPassword = false;

  // Toggle between email/password and OAuth2 sections
  showEmailForm = false;

  @ViewChild("emailErrorBanner") emailErrorBanner?: ElementRef<HTMLElement>;

  constructor(
    private auth: AuthService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      if (params["error"]) {
        this.errorMessage = decodeURIComponent(params["error"]);
      }
    });
  }

  loginWith(provider: "google" | "microsoft" | "apple"): void {
    this.loading = provider;
    this.auth.login(provider);
  }

  oonEmailLogin(): void {
    this.emailLoading = true;
    this.emailError = null;
    this.isAccountNotFound = false;

    this.auth
      .loginWithEmail(this.emailForm.email, this.emailForm.password)
      .subscribe({
        next: (res: AuthResponse) => {
          this.emailLoading = false;

          if (res.success === false) {
            this.isAccountNotFound =
              res.message?.toLowerCase().includes("aucun compte") ?? false;
            this.showError(res.message ?? "Erreur lors de la connexion.");
            return;
          }

          if (res.data?.token) {
            this.auth.loginWithToken(res.data.token).subscribe({
              next: () => {
                this.router.navigate(["/dashboard"]);
              },
              error: (err) => {
                this.showError(
                  err?.message ?? "Erreur lors du chargement du profil.",
                );
              },
            });
          }
        },
        error: (err) => {
          this.emailLoading = false;
          this.showError(err?.message ?? "Erreur réseau ou serveur.");
        },
      });
  }

  private showError(message: string): void {
    this.emailError = message;
    setTimeout(() => {
      this.emailErrorBanner?.nativeElement.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }, 0);
  }
}
