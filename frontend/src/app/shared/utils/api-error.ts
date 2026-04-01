import { HttpErrorResponse } from '@angular/common/http';

/**
 * Extracts a human-readable error message from an HTTP error response.
 *
 * The backend returns errors in the shape { error: "message" }.
 * Handles cases where the response body is a parsed object, a raw string, or missing.
 *
 * @param err     The HttpErrorResponse from Angular's HttpClient
 * @param fallback Message to return when the API provides no specific reason
 */
export function apiErrorMessage(err: HttpErrorResponse, fallback: string): string {
  if (!err) return fallback;

  const body = err.error;

  // Standard backend format: { error: "..." }
  if (body && typeof body === 'object') {
    if (typeof body['error'] === 'string' && body['error']) return body['error'];
    if (typeof body['message'] === 'string' && body['message']) return body['message'];
  }

  // Body is a raw string (e.g. server sent text/plain)
  if (typeof body === 'string' && body) return body;

  // HTTP status fallbacks
  if (err.status === 0) return 'Impossible de contacter le serveur. Vérifiez votre connexion.';
  if (err.status === 429) return 'Trop de tentatives. Veuillez réessayer dans quelques minutes.';
  if (err.status >= 500) return 'Une erreur serveur est survenue. Veuillez réessayer.';

  return fallback;
}
