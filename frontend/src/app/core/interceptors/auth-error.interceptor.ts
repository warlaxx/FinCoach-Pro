import { HttpInterceptorFn, HttpRequest } from "@angular/common/http";
import { inject } from "@angular/core";
import { Router } from "@angular/router";
import { catchError, throwError } from "rxjs";
import { AuthService } from "../../features/auth/auth.service";

/**
 * Intercepts 401 responses and forces a single logout + redirect to /login.
 * Skips authentication endpoints so that login/register errors propagate normally.
 */
let redirecting = false;

export const authErrorInterceptor: HttpInterceptorFn = (
  req: HttpRequest<any>,
  next,
) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((err) => {
      if (err.status === 401 && !isAuthEndpoint(req.url) && !redirecting) {
        redirecting = true;
        auth.logout();
        router.navigate(["/login"]).finally(() => {
          redirecting = false;
        });
      }
      return throwError(() => err);
    }),
  );
};

/** Returns true if the request URL is an auth endpoint (no redirect on 401) */
function isAuthEndpoint(url: string): boolean {
  return url.includes("/api/auth/");
}
