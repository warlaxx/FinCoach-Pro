import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../config/database';
import { jwtService } from './jwt.service';
import { emailService } from './email.service';
import { CONSTANTS } from '../config/constants';
import { AuthResponse, OAuthUserProfile, RegisterPayload, LoginPayload, UpdateProfilePayload } from '../types';
import { User } from '@prisma/client';

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

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictError('Cette adresse e-mail est déjà utilisée.');

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

    console.info(`[AuthService] New LOCAL user registered: ${email} (id=${user.id})`);
    await emailService.sendVerificationEmail(user.email, user.firstName ?? '', verificationToken);

    return {
      message: 'Inscription réussie ! Vérifiez votre boîte mail pour activer votre compte.',
      emailVerified: false,
    };
  }

  async login(payload: LoginPayload): Promise<AuthResponse> {
    const email = payload.email.toLowerCase().trim();

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new AuthError('Aucun compte trouvé avec cette adresse e-mail.', 401);

    // null provider = legacy LOCAL account (pre-migration data)
    if (user.provider && user.provider !== 'LOCAL') {
      throw new AuthError(
        `Ce compte utilise la connexion via ${user.provider}. Utilisez le bouton correspondant sur la page de connexion.`,
        401,
      );
    }

    if (!user.passwordHash || !(await bcrypt.compare(payload.password, user.passwordHash))) {
      throw new AuthError('Mot de passe incorrect.', 401);
    }

    // In development, skip email verification so you can log in without SMTP setup
    const skipVerif = process.env.NODE_ENV === 'development' || process.env.SKIP_EMAIL_VERIFICATION === 'true';
    if (!user.emailVerified && !skipVerif) {
      throw new AuthError('Veuillez vérifier votre adresse e-mail avant de vous connecter.', 403);
    }

    const token = jwtService.generateToken(user);
    console.info(`[AuthService] LOCAL login success for userId=${user.id}`);
    return this.buildAuthResponse(user, token);
  }

  async verifyEmail(token: string): Promise<AuthResponse> {
    const user = await prisma.user.findFirst({ where: { emailVerificationToken: token } });

    if (!user) throw new AuthError('Lien de vérification invalide ou expiré.', 400);
    if (user.emailVerified) throw new AuthError('Ce compte est déjà activé.', 400);

    if (
      !user.emailVerificationTokenExpiry ||
      user.emailVerificationTokenExpiry < new Date()
    ) {
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

    console.info(`[AuthService] Email verified for userId=${user.id}`);
    const jwt = jwtService.generateToken(updated);
    return { ...this.buildAuthResponse(updated, jwt), message: 'E-mail vérifié avec succès. Bienvenue sur FinCoach Pro !' };
  }

  async resendVerification(email: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (!user) throw new AuthError('Aucun compte trouvé avec cette adresse e-mail.', 400);
    if (user.emailVerified) throw new AuthError('Ce compte est déjà activé. Vous pouvez vous connecter.', 400);

    const token = uuidv4();
    const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerificationToken: token, emailVerificationTokenExpiry: expiry },
    });

    await emailService.sendVerificationEmail(user.email, user.firstName ?? '', token);
    console.info(`[AuthService] Verification email resent to ${email}`);
  }

  async requestPasswordReset(email: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (!user) return; // Silently ignore — prevents email enumeration

    if (user.provider !== 'LOCAL') return;

    const token = uuidv4();
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1h

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordResetToken: token, passwordResetTokenExpiry: expiry },
    });

    await emailService.sendPasswordResetEmail(user.email, user.firstName ?? '', token);
    console.info(`[AuthService] Password reset requested for userId=${user.id}`);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const user = await prisma.user.findFirst({ where: { passwordResetToken: token } });

    if (!user) throw new AuthError('Lien de réinitialisation invalide ou expiré.', 400);
    if (!user.passwordResetTokenExpiry || user.passwordResetTokenExpiry < new Date()) {
      throw new AuthError('Ce lien de réinitialisation a expiré. Veuillez en demander un nouveau.', 400);
    }

    const hash = await bcrypt.hash(newPassword, CONSTANTS.BCRYPT_ROUNDS);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: hash, passwordResetToken: null, passwordResetTokenExpiry: null },
    });

    console.info(`[AuthService] Password reset completed for userId=${user.id}`);
  }

  async updateProfile(userId: string, payload: UpdateProfilePayload): Promise<AuthResponse> {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AuthError('Utilisateur introuvable.', 404);

    const updates: Partial<User> = {
      firstName: payload.firstName.trim(),
      lastName: payload.lastName.trim(),
      age: payload.age,
      name: `${payload.firstName.trim()} ${payload.lastName.trim()}`,
    };

    if (payload.newPassword) {
      if (!payload.currentPassword) {
        throw new AuthError('Le mot de passe actuel est requis pour changer de mot de passe.', 400);
      }
      if (!user.passwordHash) {
        throw new AuthError('Ce compte utilise la connexion sociale. Le mot de passe ne peut pas être modifié ici.', 400);
      }
      if (!(await bcrypt.compare(payload.currentPassword, user.passwordHash))) {
        throw new AuthError('Le mot de passe actuel est incorrect.', 400);
      }
      updates.passwordHash = await bcrypt.hash(payload.newPassword, CONSTANTS.BCRYPT_ROUNDS);
    }

    const updated = await prisma.user.update({ where: { id: userId }, data: updates });
    console.info(`[AuthService] Profile updated for userId=${userId}`);

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

    // Try to find by provider + providerId
    let user = await prisma.user.findFirst({
      where: { provider, providerId: profile.providerId },
    });

    if (!user) {
      // Check if there's already a LOCAL account with the same email
      user = await prisma.user.findUnique({ where: { email: profile.email.toLowerCase() } });
      if (user) {
        // Link the OAuth2 provider to the existing account
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
        console.info(`[AuthService] New OAuth2 user created: ${user.email} via ${provider}`);
      }
    } else {
      // Update picture if changed
      if (profile.pictureUrl && profile.pictureUrl !== user.pictureUrl) {
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
