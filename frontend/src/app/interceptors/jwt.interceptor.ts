import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

/**
 * HTTP interceptor that automatically adds the JWT to every outgoing request.
 *
 * Without this, every service (DashboardService, ChatService, etc.) would need
 * to manually add the Authorization header. The interceptor does it once for all.
 *
 * How it works:
 * Angular's HTTP pipeline passes every request through registered interceptors.
 * We clone the request (immutable by design) and add the Authorization header.
 *
 * We only add the header when:
 * 1. A token exists in localStorage
 * 2. The request targets our backend (localhost:8080) — not external APIs
 *
 * Why clone the request?
 * HttpRequest objects are immutable in Angular. To modify headers,
 * you must create a new request with the modified headers.
 *
 * Registration: in app.config.ts, add withInterceptors([jwtInterceptor])
 */
export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.getToken();

  // Only attach token for requests to our own backend
  if (token && req.url.includes('localhost:8080')) {
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(authReq);
  }

  return next(req);
};
