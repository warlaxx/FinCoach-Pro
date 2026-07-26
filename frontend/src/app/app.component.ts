import { Component, OnInit, HostListener, ViewChild, ElementRef } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService, AuthUser } from './features/auth/auth.service';
import { GalaxyBgComponent } from './shared/components/galaxy-bg/galaxy-bg.component';
import { LogoComponent } from './shared/components/logo/logo.component';
import { UpgradeModalComponent } from './shared/components/upgrade-modal/upgrade-modal.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule,
            GalaxyBgComponent, LogoComponent, UpgradeModalComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {

  currentUser: AuthUser | null = null;

  /** Menu latéral mobile (burger) — fermé par défaut, se referme à chaque navigation. */
  menuOpen = false;

  @ViewChild('burgerBtn') private burgerBtn?: ElementRef<HTMLButtonElement>;

  /**
   * The sidebar should only appear on authenticated pages.
   * On /, /login and /auth/callback the user sees a full-screen layout (no sidebar).
   */
  get showSidebar(): boolean {
    const url = this.router.url;
    const hiddenRoutes = ['/', '/login', '/register', '/auth/callback', '/markets', '/pricing',
                          '/confirm-email', '/verify-email', '/forgot-password', '/reset-password'];
    return !hiddenRoutes.some(r => url === r || (r !== '/' && url.startsWith(r)));
  }

  constructor(
    public auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.auth.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) this.menuOpen = false;
    });
  }

  /** Ferme le menu mobile au clavier et rend le focus au bouton burger. */
  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.menuOpen) {
      this.closeMenu();
      this.burgerBtn?.nativeElement.focus();
    }
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu(): void {
    this.menuOpen = false;
  }

  logout(): void {
    this.menuOpen = false;
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  /** Returns the first letter of the name for the avatar when no picture is available */
  getAvatarLetter(): string {
    return this.currentUser?.name?.charAt(0)?.toUpperCase() ?? 'U';
  }
}
