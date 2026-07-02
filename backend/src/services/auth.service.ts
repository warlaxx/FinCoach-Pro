import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../config/database';
import { jwtService } from './jwt.service';
import { emailService } from './email.service';
import { CONSTANTS } from '../config/constants';
import { AuthResponse, OAuthUserProfile, RegisterPayload, LoginPayload, UpdateProfilePayload } from '../types';
import { User } from '@prisma/client';
import { createLogger } from '../utils/logger';

const logger = createLogger('AuthService');

/**
 * Authentication service — port of Java UserService.java.
 *
 * Handles email/password registration, login, email verification,
 * password reset, profile updates, and OAuth2 user upsert.
 */
class AuthService {
  // ─── Email/Password Auth ────────────────────────────────────────────────────

  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const email = payload.email.toLowerCase().trim();
    logger.info('Registration attempt', { email });

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      logger.warn('Registration failed — email already in use', { email, existingUserId: existing.id });
      throw new ConflictError('Cette adresse e-mail est déjà utilisée.');
    }

    logger.debug('Hashing password', { email, bcryptRounds: CONSTANTS.BCRYPT_ROUNDS });
    const passwordHash = await bcrypt.hash(payload.password, CONSTANTS.BCRYPT_ROUNDS);
    const verificationToken = uuidv4();
    const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    const user = await prisma.user.create({
      data: {
        id: uuidv4(),
        email,
        firstName: payload.firstName.trim(),
        lastName: payload.lastName.trim(),
        age: payload.age,
        passwordHash,
        name: `${payload.firstName.trim()} ${payload.lastName.trim()}`,
        provider: 'LOCAL',
        role: 'USER',
        plan: 'FREEMIUM',
        emailVerified: false,
        emailVerificationToken: verificationToken,
        emailVerificationTokenExpiry: verificationExpiry,
      },
    });

    logger.info('New LOCAL user registered successfully', {
      userId: user.id,
      email,
      verificationTokenExpiry: verificationExpiry.toISOString(),
    });

    await emailService.sendVerificationEmail(user.email, user.firstName ?? '', verificationToken);

    return {
      message: 'Inscription réussie ! Vérifiez votre boîte mail pour activer votre compte.',
      emailVerified: false,
    };
  }

  async login(payload: LoginPayload): Promise<AuthResponse> {
    const email = payload.email.toLowerCase().trim();
    logger.info('Login attempt', { email });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      logger.warn('Login failed — no account found with this email', { email });
      throw new AuthError('Aucun compte trouvé avec cette adresse e-mail.', 401);
    }

    logger.debug('User found in database', { userId: user.id, email, provider: user.provider });

    // null provider = legacy LOCAL account (pre-migration data)
    if (user.provider && user.provider !== 'LOCAL') {
      logger.warn('Login failed — account uses OAuth provider, not password auth', {
        userId: user.id,
        email,
        provider: user.provider,
      });
      throw new AuthError(
        `Ce compte utilise la connexion via ${user.provider}. Utilisez le bouton correspondant sur la page de connexion.`,
        401,
      );
    }

    if (!user.passwordHash) {
      logger.warn('Login failed — account has no password hash (OAuth-only account)', {
        userId: user.id,
        email,
      });
      throw new AuthError('Mot de passe incorrect.', 401);
    }

    logger.debug('Comparing password with stored hash', { userId: user.id });
    const passwordMatch = await bcrypt.compare(payload.password, user.passwordHash);
    if (!passwordMatch) {
      logger.warn('Login failed — incorrect password', { userId: user.id, email });
      throw new AuthError('Mot de passe incorrect.', 401);
    }

    logger.debug('Password match successful', { userId: user.id });

    // In development, skip email verification so you can log in without SMTP setup
    const skipVerif = process.env.NODE_ENV === 'development' || process.env.SKIP_EMAIL_VERIFICATION === 'true';
    if (!user.emailVerified && !skipVerif) {
      logger.warn('Login failed — email not verified', {
        userId: user.id,
        email,
        skipVerif,
        nodeEnv: process.env.NODE_ENV,
      });
      throw new AuthError('Veuillez vérifier votre adresse e-mail avant de vous connecter.', 403);
    }

    if (!user.emailVerified && skipVerif) {
      logger.debug('Email verification skipped (dev mode or SKIP_EMAIL_VERIFICATION=true)', {
        userId: user.id,
        nodeEnv: process.env.NODE_ENV,
      });
    }

    const token = jwtService.generateToken(user);
    logger.info('Login successful', { userId: user.id, email, emailVerified: user.emailVerified });
    return this.buildAuthResponse(user, token);
  }

  async verifyEmail(token: string): Promise<AuthResponse> {
    logger.info('Email verification attempt', { tokenPrefix: token.substring(0, 8) + '...' });

    const user = await prisma.user.findFirst({ where: { emailVerificationToken: token } });

    if (!user) {
      logger.warn('Email verification failed — token not found in database', {
        tokenPrefix: token.substring(0, 8) + '...',
      });
      throw new AuthError('Lien de vérification invalide ou expiré.', 400);
    }

    if (user.emailVerified) {
      logger.warn('Email verification failed — account already verified', { userId: user.id, email: user.email });
      throw new AuthError('Ce compte est déjà activé.', 400);
    }

    if (
      !user.emailVerificationTokenExpiry ||
      user.emailVerificationTokenExpiry < new Date()
    ) {
      logger.warn('Email verification failed — token expired', {
        userId: user.id,
        email: user.email,
        expiry: user.emailVerificationTokenExpiry?.toISOString() ?? 'null',
        now: new Date().toISOString(),
      });
      throw new AuthError(
        'Ce lien de vérification a expiré. Veuillez en demander un nouveau.',
        400,
      );
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationTokenExpiry: null,
      },
    });

    logger.info('Email verified successfully', { userId: user.id, email: user.email });
    const jwt = jwtService.generateToken(updated);
    return { ...this.buildAuthResponse(updated, jwt), message: 'E-mail vérifié avec succès. Bienvenue sur FinCoach Pro !' };
  }

  async resendVerification(email: string): Promise<void> {
    const normalizedEmail = email.toLowerCase().trim();
    logger.info('Resend verification email requested', { email: normalizedEmail });

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
      logger.warn('Resend verification failed — no account found', { email: normalizedEmail });
      throw new AuthError('Aucun compte trouvé avec cette adresse e-mail.', 400);
    }
    if (user.emailVerified) {
      logger.warn('Resend verification failed — account already verified', { userId: user.id, email: normalizedEmail });
      throw new AuthError('Ce compte est déjà activé. Vous pouvez vous connecter.', 400);
    }

    const token = uuidv4();
    const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerificationToken: token, emailVerificationTokenExpiry: expiry },
    });

    await emailService.sendVerificationEmail(user.email, user.firstName ?? '', token);
    logger.info('Verification email resent', {
      userId: user.id,
      email: normalizedEmail,
      newExpiry: expiry.toISOString(),
    });
  }

  async requestPasswordReset(email: string): Promise<void> {
    const normalizedEmail = email.toLowerCase().trim();
    logger.info('Password reset requested', { email: normalizedEmail });

    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (!user) {
      logger.warn('Password reset silently skipped — no account found (anti-enumeration)', { email: normalizedEmail });
      return; // Silently ignore — prevents email enumeration
    }

    if (user.provider !== 'LOCAL') {
      logger.warn('Password reset silently skipped — account uses OAuth provider', {
        userId: user.id,
        provider: user.provider,
      });
      return;
    }

    const token = uuidv4();
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1h

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordResetToken: token, passwordResetTokenExpiry: expiry },
    });

    await emailService.sendPasswordResetEmail(user.email, user.firstName ?? '', token);
    logger.info('Password reset email sent', {
      userId: user.id,
      email: normalizedEmail,
      expiry: expiry.toISOString(),
    });
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    logger.info('Password reset attempt', { tokenPrefix: token.substring(0, 8) + '...' });

    const user = await prisma.user.findFirst({ where: { passwordResetToken: token } });

    if (!user) {
      logger.warn('Password reset failed — token not found', { tokenPrefix: token.substring(0, 8) + '...' });
      throw new AuthError('Lien de réinitialisation invalide ou expiré.', 400);
    }

    if (!user.passwordResetTokenExpiry || user.passwordResetTokenExpiry < new Date()) {
      logger.warn('Password reset failed — token expired', {
        userId: user.id,
        expiry: user.passwordResetTokenExpiry?.toISOString() ?? 'null',
        now: new Date().toISOString(),
      });
      throw new AuthError('Ce lien de réinitialisation a expiré. Veuillez en demander un nouveau.', 400);
    }

    logger.debug('Hashing new password for reset', { userId: user.id });
    const hash = await bcrypt.hash(newPassword, CONSTANTS.BCRYPT_ROUNDS);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: hash, passwordResetToken: null, passwordResetTokenExpiry: null },
    });

    logger.info('Password reset completed successfully', { userId: user.id, email: user.email });
  }

  async updateProfile(userId: string, payload: UpdateProfilePayload): Promise<AuthResponse> {
    logger.info('Profile update requested', {
      userId,
      hasNewPassword: !!payload.newPassword,
      hasCurrentPassword: !!payload.currentPassword,
    });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      logger.warn('Profile update failed — user not found', { userId });
      throw new AuthError('Utilisateur introuvable.', 404);
    }

    const updates: Partial<User> = {
      firstName: payload.firstName.trim(),
      lastName: payload.lastName.trim(),
      age: payload.age,
      name: `${payload.firstName.trim()} ${payload.lastName.trim()}`,
    };

    if (payload.newPassword) {
      if (!payload.currentPassword) {
        logger.warn('Profile update — password change rejected: missing current password', { userId });
        throw new AuthError('Le mot de passe actuel est requis pour changer de mot de passe.', 400);
      }
      if (!user.passwordHash) {
        logger.warn('Profile update — password change rejected: OAuth-only account has no hash', { userId });
        throw new AuthError('Ce compte utilise la connexion sociale. Le mot de passe ne peut pas être modifié ici.', 400);
      }
      const currentMatch = await bcrypt.compare(payload.currentPassword, user.passwordHash);
      if (!currentMatch) {
        logger.warn('Profile update — password change rejected: current password incorrect', { userId });
        throw new AuthError('Le mot de passe actuel est incorrect.', 400);
      }
      logger.debug('Current password verified, hashing new password', { userId });
      updates.passwordHash = await bcrypt.hash(payload.newPassword, CONSTANTS.BCRYPT_ROUNDS);
    }

    const updated = await prisma.user.update({ where: { id: userId }, data: updates });
    logger.info('Profile updated successfully', {
      userId,
      passwordChanged: !!payload.newPassword,
    });

    const token = jwtService.generateToken(updated);
    return this.buildAuthResponse(updated, token);
  }

  // ─── OAuth2 User Upsert ─────────────────────────────────────────────────────

  /**
   * Finds or creates a user from an OAuth2 provider profile.
   * Used after a successful OAuth2 authentication.
   */
  async upsertOAuthUser(profile: OAuthUserProfile): Promise<User> {
    const provider = profile.provider.toUpperCase();
    logger.info('OAuth2 user upsert', { provider, email: profile.email, providerId: profile.providerId });

    // Try to find by provider + providerId
    let user = await prisma.user.findFirst({
      where: { provider, providerId: profile.providerId },
    });

    if (!user) {
      logger.debug('No existing user found by providerId, checking by email', { email: profile.email });
      // Check if there's already a LOCAL account with the same email
      user = await prisma.user.findUnique({ where: { email: profile.email.toLowerCase() } });
      if (user) {
        // Link the OAuth2 provider to the existing account
        logger.info('Linking OAuth2 provider to existing LOCAL account', {
          userId: user.id,
          email: user.email,
          provider,
        });
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            provider,
            providerId: profile.providerId,
            pictureUrl: profile.pictureUrl,
            emailVerified: true,
          },
        });
      } else {
        // Create a new user
        user = await prisma.user.create({
          data: {
            id: uuidv4(),
            email: profile.email.toLowerCase(),
            firstName: profile.firstName ?? profile.name?.split(' ')[0],
            lastName: profile.lastName ?? profile.name?.split(' ').slice(1).join(' '),
            name: profile.name ?? `${profile.firstName ?? ''} ${profile.lastName ?? ''}`.trim(),
            pictureUrl: profile.pictureUrl,
            provider,
            providerId: profile.providerId,
            role: 'USER',
            plan: 'FREEMIUM',
            emailVerified: true,
          },
        });
        logger.info('New OAuth2 user created', { userId: user.id, email: user.email, provider });
      }
    } else {
      logger.debug('Existing OAuth2 user found', { userId: user.id, email: user.email, provider });
      // Update picture if changed
      if (profile.pictureUrl && profile.pictureUrl !== user.pictureUrl) {
        logger.debug('Updating OAuth2 user picture', { userId: user.id });
        user = await prisma.user.update({
          where: { id: user.id },
          data: { pictureUrl: profile.pictureUrl },
        });
      }
    }

    return user;
  }

  // ─── Helper ──────────────────────────────────────────────────────────────────

  private buildAuthResponse(user: User, token: string): AuthResponse {
    return {
      token,
      userId: user.id,
      email: user.email,
      firstName: user.firstName ?? '',
      lastName: user.lastName ?? '',
      role: user.role,
      plan: user.plan,
      emailVerified: user.emailVerified,
    };
  }
}

// ─── Custom error classes ────────────────────────────────────────────────────

export class AuthError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = 'AuthError';
  }
}

export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
    (this as any).status = 409;
  }
}

export const authService = new AuthService();
