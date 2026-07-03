import { Component, OnInit, ViewChild, ElementRef } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { LogoComponent } from "../../../shared/components/logo/logo.component";
import { AuthService } from "../auth.service";

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

  showEmailForm = true;

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

  onEmailLogin(): void {
    // Guard against double submission while a request is in flight.
    if (this.emailLoading) return;

    this.emailLoading = true;
    this.emailError = null;
    this.isAccountNotFound = false;

    this.auth
      .loginWithEmail(this.emailForm.email, this.emailForm.password)
      .subscribe({
        next: (token) => {
          // Login OK — now load the user profile
          this.auth.loginWithToken(token).subscribe({
            next: () => this.router.navigate(["/dashboard"]),
            error: (err: Error) => {
              this.emailLoading = false;
              this.showError(
                err?.message ?? "Impossible de charger votre profil.",
              );
            },
          });
        },
        error: (err: Error) => {
          this.emailLoading = false;
          this.isAccountNotFound = err?.message
            ?.toLowerCase()
            .includes("aucun compte") ?? false;
          this.showError(
            err?.message ?? "Une erreur est survenue. Veuillez réessayer.",
          );
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
