import { Request, Response, NextFunction } from 'express';
import { createLogger } from '../utils/logger';

const logger = createLogger('ErrorHandler');

/**
 * Global error handler — must be registered as the last middleware.
 * Catches any unhandled errors and returns a consistent JSON response.
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const status = (err as any).status ?? 500;
  const isServerError = status >= 500;

  if (isServerError) {
    logger.error('Unhandled server error', {
      name: err.name,
      message: err.message,
      stack: err.stack,
      method: req.method,
      path: req.path,
      statusCode: status,
    });
  } else {
    logger.warn('Request error (client-side)', {
      name: err.name,
      message: err.message,
      method: req.method,
      path: req.path,
      statusCode: status,
    });
  }

  res.status(status).json({
    error: err.message || 'Une erreur interne est survenue.',
  });
}

/**
 * 404 handler — must be registered after all routes.
 */
export function notFoundHandler(req: Request, res: Response): void {
  logger.warn('Route not found', {
    method: req.method,
    path: req.path,
    ip: req.ip,
  });
  res.status(404).json({ error: `Route ${req.method} ${req.path} introuvable.` });
}
