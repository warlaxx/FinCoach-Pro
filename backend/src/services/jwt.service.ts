import jwt from 'jsonwebtoken';
import { JwtClaims } from '../types';
import { CONSTANTS } from '../config/constants';

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
    if (!s) throw new Error('JWT_SECRET environment variable is not set.');
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

    return jwt.sign(payload, this.secret, {
      subject: user.id,
      expiresIn: CONSTANTS.JWT_EXPIRY_MS / 1000, // jwt library expects seconds
      algorithm: 'HS256',
    });
  }

  /**
   * Verifies and decodes a JWT. Throws if invalid or expired.
   */
  verify(token: string): JwtClaims {
    return jwt.verify(token, this.secret) as JwtClaims;
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
