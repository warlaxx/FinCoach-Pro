import { Request, Response, NextFunction } from 'express';

/**
 * Global error handler — must be registered as the last middleware.
 * Catches any unhandled errors and returns a consistent JSON response.
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  console.error('[ErrorHandler]', err.message, err.stack);

  const status = (err as any).status ?? 500;
  res.status(status).json({
    error: err.message || 'Une erreur interne est survenue.',
  });
}

/**
 * 404 handler — must be registered after all routes.
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({ error: `Route ${req.method} ${req.path} introuvable.` });
}
