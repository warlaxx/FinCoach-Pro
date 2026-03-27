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

  // Attach JWT only for requests to our own backend.
  // Uses origin + path comparison to prevent sending the JWT to look-alike hosts
  // (e.g. startsWith alone would match https://api.example.com.evil.tld/...).
  let isBackendRequest: boolean;
  try {
    const reqUrl = new URL(req.url, window.location.origin);
    const backendUrl = new URL(environment.apiBaseUrl || '/api/', window.location.origin);
    const backendPath = backendUrl.pathname.endsWith('/')
      ? backendUrl.pathname
      : `${backendUrl.pathname}/`;
    isBackendRequest =
      reqUrl.origin === backendUrl.origin &&
      (reqUrl.pathname === backendPath.slice(0, -1) ||
        reqUrl.pathname.startsWith(backendPath));
  } catch {
    isBackendRequest = false;
  }

  // Never attach JWT to public auth endpoints — avoids sending stale tokens
  // on login/register requests which pollutes logs and leaks session info.
  const isPublicAuthEndpoint = /\/api\/auth\/(login|register|verify-email|forgot-password|reset-password|resend-verification)\b/.test(req.url);

  if (token && isBackendRequest && !isPublicAuthEndpoint) {
    const authReq = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
    return next(authReq);
  }

  return next(req);
};
