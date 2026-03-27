import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { filter, map, take } from 'rxjs';
import { AuthService } from '../../features/auth/auth.service';

/**
 * Route guard that protects all authenticated routes.
 *
 * Waits for the initial auth check (GET /api/auth/me) to complete before
 * deciding. This prevents a race condition where the guard would reject
 * a user whose token is valid but whose profile hasn't loaded yet.
 *
 * If the user is not authenticated (no JWT in localStorage), they are
 * redirected to the login page.
 */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.authReady$.pipe(
    filter(ready => ready),
    take(1),
    map(() => {
      if (auth.isAuthenticated()) {
        return true;
      }
      router.navigate(['/login']);
      return false;
    })
  );
};
