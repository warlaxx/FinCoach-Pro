import { Response, NextFunction } from 'express';
import { AuthRequest, JwtClaims } from '../types';
import jwt from 'jsonwebtoken';

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
    res.status(401).json({ error: "Token d'authentification manquant." });
    return;
  }

  const token = authHeader.substring(7);
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    res.status(500).json({ error: 'Configuration JWT manquante.' });
    return;
  }

  try {
    const claims = jwt.verify(token, Buffer.from(secret, 'base64')) as JwtClaims;
    req.userId = claims.sub;
    req.userClaims = claims;
    next();
  } catch {
    res.status(401).json({ error: 'Token invalide ou expiré.' });
  }
}
