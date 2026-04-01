import { Response, NextFunction } from 'express';
import { AuthRequest, JwtClaims } from '../types';
import jwt from 'jsonwebtoken';
import { createLogger } from '../utils/logger';

const logger = createLogger('JwtMiddleware');

/**
 * JWT authentication middleware.
 * Extracts the Bearer token from the Authorization header, verifies it,
 * and sets req.userId and req.userClaims for downstream handlers.
 *
 * Returns 401 if the token is missing, invalid, or expired.
 */
export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    logger.warn('Missing or malformed Authorization header', {
      method: req.method,
      path: req.path,
      hasHeader: !!authHeader,
      headerPrefix: authHeader ? authHeader.substring(0, 10) + '...' : null,
    });
    res.status(401).json({ error: "Token d'authentification manquant." });
    return;
  }

  const token = authHeader.substring(7);
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    logger.error('JWT_SECRET environment variable is not set — cannot verify tokens', {
      path: req.path,
    });
    res.status(500).json({ error: 'Configuration JWT manquante.' });
    return;
  }

  try {
    const claims = jwt.verify(token, Buffer.from(secret, 'base64')) as JwtClaims;
    req.userId = claims.sub;
    req.userClaims = claims;
    logger.debug('Token verified successfully', {
      userId: claims.sub,
      email: claims.email,
      path: req.path,
      expiresAt: claims.exp ? new Date(claims.exp * 1000).toISOString() : 'unknown',
    });
    next();
  } catch (err) {
    const jwtErr = err as Error;
    const isExpired = jwtErr.name === 'TokenExpiredError';
    const isMalformed = jwtErr.name === 'JsonWebTokenError';

    logger.warn('Token verification failed', {
      reason: jwtErr.name,
      message: jwtErr.message,
      isExpired,
      isMalformed,
      path: req.path,
      method: req.method,
      tokenPrefix: token.substring(0, 20) + '...',
    });
    res.status(401).json({ error: 'Token invalide ou expiré.' });
  }
}
