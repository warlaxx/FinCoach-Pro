import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../features/auth/auth.service';

/**
 * Route guard that protects all authenticated routes.
 *
 * Angular calls this function before navigating to a protected route.
 * If the user is not authenticated (no JWT in localStorage), they are
 * redirected to the login page.
 *
 * Why CanActivateFn instead of a class-based guard?
 * Angular 17+ recommends functional guards. They are simpler, don't need
 * to be added to providers[], and work exactly the same way.
 *
 * Usage in app.routes.ts:
 *   { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] }
 */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) {
    return true;
  }

  // Redirect to login, preserving the intended destination could be added later
  router.navigate(['/login']);
  return false;
};
