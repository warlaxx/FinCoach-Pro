import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../../features/auth/auth.service';
import { environment } from '../../../environments/environment';

/**
 * HTTP interceptor that automatically adds the JWT to every outgoing request
 * that targets our own backend (apiBaseUrl from environment).
 *
 * This centralises the Authorization header logic so individual services
 * don't each need to handle it.
 *
 * Only attaches the token when:
 *  1. A token exists in localStorage
 *  2. The request URL starts with the configured apiBaseUrl
 *     (guards against leaking the JWT to third-party APIs like TwelveData)
 */
export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.getToken();

  // Attach JWT for requests to our own backend, not to third-party APIs.
  // When apiBaseUrl is set (e.g. http://localhost:8080), match on that prefix.
  // When apiBaseUrl is empty (production with relative URLs), match on /api/.
  const isBackendRequest = environment.apiBaseUrl
    ? req.url.startsWith(environment.apiBaseUrl)
    : req.url.startsWith('/api/') || req.url.startsWith('api/');

  if (token && isBackendRequest) {
    const authReq = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
    return next(authReq);
  }

  return next(req);
};
