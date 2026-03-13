import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService, AuthUser } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {

  currentUser: AuthUser | null = null;

  /**
   * The sidebar should only appear on authenticated pages.
   * On /login and /auth/callback the user sees a full-screen layout (no sidebar).
   * We check the current URL to decide — Angular's Router.url is synchronously available.
   */
  get showSidebar(): boolean {
    const hiddenRoutes = ['/login', '/auth/callback'];
    return !hiddenRoutes.some(r => this.router.url.startsWith(r));
  }

  constructor(
    public auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Subscribe to the reactive user stream from AuthService.
    // currentUser$ is a BehaviorSubject — it emits immediately with the current value,
    // then again on every change (login/logout). This keeps the sidebar up to date.
    this.auth.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  /** Returns the first letter of the name for the avatar when no picture is available */
  getAvatarLetter(): string {
    return this.currentUser?.name?.charAt(0)?.toUpperCase() ?? 'U';
  }
}
