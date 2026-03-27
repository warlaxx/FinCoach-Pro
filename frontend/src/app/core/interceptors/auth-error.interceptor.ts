import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../../features/auth/auth.service';

/**
 * Intercepts 401 responses from the backend and forces a single
 * logout + redirect to /login, preventing repeated 401 calls
 * from multiple components firing simultaneously.
 *
 * Skips the login endpoint itself so that login error messages
 * (wrong password, account not found) propagate to the component.
 */
let redirecting = false;

export const authErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError(err => {
      if (err.status === 401 && !isAuthEndpoint(req.url) && !redirecting) {
        redirecting = true;
        auth.logout();
        router.navigate(['/login']).then(() => {
          redirecting = false;
        });
      }
      return throwError(() => err);
    })
  );
};

/** Auth endpoints where 401 is expected (login with bad credentials). */
function isAuthEndpoint(url: string): boolean {
  return url.includes('/api/auth/login') || url.includes('/api/auth/register');
}
