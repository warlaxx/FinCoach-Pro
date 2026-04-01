import jwt from 'jsonwebtoken';
import { JwtClaims } from '../types';
import { CONSTANTS } from '../config/constants';
import { createLogger } from '../utils/logger';

const logger = createLogger('JwtService');

/**
 * JWT service — exact port of Java JwtService.java.
 *
 * Generates and verifies our application JWT tokens (NOT the OAuth2 provider's tokens).
 * Token lifetime: 24 hours.
 *
 * The JWT secret must be a Base64-encoded 256-bit key.
 * Generate one with: openssl rand -base64 32
 */
class JwtService {
  private get secret(): Buffer {
    const s = process.env.JWT_SECRET;
    if (!s) {
      logger.error('JWT_SECRET environment variable is not set — token operations will fail');
      throw new Error('JWT_SECRET environment variable is not set.');
    }
    return Buffer.from(s, 'base64');
  }

  /**
   * Generates a signed JWT for the given user.
   */
  generateToken(user: {
    id: string;
    email: string;
    name?: string | null;
    pictureUrl?: string | null;
    role?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    age?: number | null;
    emailVerified?: boolean;
  }): string {
    const payload: Partial<JwtClaims> = {
      email: user.email,
      name: user.name ?? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim(),
      picture: user.pictureUrl ?? undefined,
      role: user.role ?? 'USER',
      firstName: user.firstName ?? undefined,
      lastName: user.lastName ?? undefined,
      age: user.age ?? undefined,
      emailVerified: user.emailVerified ?? false,
    };

    const token = jwt.sign(payload, this.secret, {
      subject: user.id,
      expiresIn: CONSTANTS.JWT_EXPIRY_MS / 1000, // jwt library expects seconds
      algorithm: 'HS256',
    });

    const expiresAt = new Date(Date.now() + CONSTANTS.JWT_EXPIRY_MS).toISOString();
    logger.debug('JWT generated', { userId: user.id, email: user.email, expiresAt });

    return token;
  }

  /**
   * Verifies and decodes a JWT. Throws if invalid or expired.
   */
  verify(token: string): JwtClaims {
    try {
      const claims = jwt.verify(token, this.secret) as JwtClaims;
      logger.debug('JWT verified', { userId: claims.sub, email: claims.email });
      return claims;
    } catch (err) {
      const jwtErr = err as Error;
      logger.warn('JWT verification failed', {
        reason: jwtErr.name,
        message: jwtErr.message,
      });
      throw err;
    }
  }

  isValid(token: string): boolean {
    try {
      this.verify(token);
      return true;
    } catch {
      return false;
    }
  }
}

export const jwtService = new JwtService();
