import { Request, Response } from 'express';
import { authService, AuthError, ConflictError } from '../services/auth.service';
import { AuthRequest } from '../types';
import { createLogger } from '../utils/logger';

const logger = createLogger('AuthController');

/**
 * Auth controller — port of Java AuthController.java.
 *
 * Routes:
 *  GET  /api/auth/me                   — current user info from JWT
 *  POST /api/auth/register             — email/password registration
 *  POST /api/auth/login                — email/password login
 *  GET  /api/auth/verify-email?token=  — email verification
 *  PUT  /api/auth/profile              — update profile / password
 *  POST /api/auth/forgot-password      — request password reset
 *  POST /api/auth/reset-password       — reset password with token
 *  POST /api/auth/resend-verification  — resend verification email
 */
export const authController = {
  // GET /api/auth/me
  me(req: AuthRequest, res: Response): void {
    const claims = req.userClaims;
    logger.debug('GET /api/auth/me', { userId: req.userId, email: claims.email });
    res.json({
      id: req.userId,
      email: claims.email,
      name: claims.name,
      picture: claims.picture ?? '',
      role: claims.role ?? 'USER',
      firstName: claims.firstName ?? '',
      lastName: claims.lastName ?? '',
      age: claims.age ?? null,
      emailVerified: claims.emailVerified ?? false,
    });
  },

  // POST /api/auth/register
  async register(req: Request, res: Response): Promise<void> {
    const { email, firstName, lastName, age, password } = req.body;

    logger.info('POST /api/auth/register', { email, firstName, lastName, hasAge: age !== undefined });

    if (!email || !firstName || !lastName || !password) {
      const missing = ['email', 'firstName', 'lastName', 'password'].filter(f => !req.body[f]);
      logger.warn('Register validation failed — missing required fields', { missing });
      res.status(400).json({ error: 'Tous les champs obligatoires doivent être renseignés.' });
      return;
    }
    if (password.length < 8) {
      logger.warn('Register validation failed — password too short', { email, passwordLength: password.length });
      res.status(400).json({ error: 'Le mot de passe doit contenir au moins 8 caractères.' });
      return;
    }

    try {
      const response = await authService.register({ email, firstName, lastName, age, password });
      logger.info('Register succeeded', { email });
      res.status(201).json(response);
    } catch (err) {
      if (err instanceof ConflictError) {
        logger.warn('Register conflict — email already used', { email });
        res.status(409).json({ error: (err as Error).message });
      } else {
        logger.error('Register unexpected error', { email, error: (err as Error).message });
        throw err;
      }
    }
  },

  // POST /api/auth/login
  async login(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body;

    logger.info('POST /api/auth/login', { email, hasPassword: !!password });

    if (!email || !password) {
      const missing = [!email && 'email', !password && 'password'].filter(Boolean);
      logger.warn('Login validation failed — missing fields', { missing });
      res.status(400).json({ error: "L'e-mail et le mot de passe sont requis." });
      return;
    }

    try {
      const response = await authService.login({ email, password });
      logger.info('Login controller — success, returning token', { email });
      res.json(response);
    } catch (err) {
      if (err instanceof AuthError) {
        logger.warn('Login controller — auth error returned to client', {
          email,
          statusCode: err.status,
          reason: err.message,
        });
        res.status(err.status).json({ error: err.message });
      } else {
        logger.error('Login controller — unexpected error', {
          email,
          error: (err as Error).message,
          stack: (err as Error).stack,
        });
        throw err;
      }
    }
  },

  // GET /api/auth/verify-email?token=
  async verifyEmail(req: Request, res: Response): Promise<void> {
    const token = req.query['token'] as string;

    logger.info('GET /api/auth/verify-email', { hasToken: !!token });

    if (!token) {
      logger.warn('Email verification failed — no token in query string');
      res.status(400).json({ error: 'Token manquant.' });
      return;
    }

    try {
      const response = await authService.verifyEmail(token);
      logger.info('Email verification controller — success');
      res.json(response);
    } catch (err) {
      if (err instanceof AuthError) {
        logger.warn('Email verification controller — auth error', {
          statusCode: err.status,
          reason: err.message,
        });
        res.status(err.status).json({ error: err.message });
      } else {
        logger.error('Email verification controller — unexpected error', { error: (err as Error).message });
        throw err;
      }
    }
  },

  // PUT /api/auth/profile
  async updateProfile(req: AuthRequest, res: Response): Promise<void> {
    const { firstName, lastName, age, currentPassword, newPassword } = req.body;

    logger.info('PUT /api/auth/profile', {
      userId: req.userId,
      hasNewPassword: !!newPassword,
    });

    if (!firstName || !lastName) {
      const missing = [!firstName && 'firstName', !lastName && 'lastName'].filter(Boolean);
      logger.warn('Profile update validation failed — missing fields', { userId: req.userId, missing });
      res.status(400).json({ error: 'Le prénom et le nom sont requis.' });
      return;
    }

    try {
      const response = await authService.updateProfile(req.userId, {
        firstName,
        lastName,
        age,
        currentPassword,
        newPassword,
      });
      logger.info('Profile update controller — success', { userId: req.userId });
      res.json(response);
    } catch (err) {
      if (err instanceof AuthError) {
        logger.warn('Profile update controller — auth error', {
          userId: req.userId,
          statusCode: err.status,
          reason: err.message,
        });
        res.status(err.status).json({ error: err.message });
      } else {
        logger.error('Profile update controller — unexpected error', {
          userId: req.userId,
          error: (err as Error).message,
        });
        throw err;
      }
    }
  },

  // POST /api/auth/forgot-password
  async forgotPassword(req: Request, res: Response): Promise<void> {
    const { email } = req.body;

    logger.info('POST /api/auth/forgot-password', { email: email?.trim() || '[empty]' });

    if (!email?.trim()) {
      logger.warn('Forgot password validation failed — missing email');
      res.status(400).json({ error: "L'adresse e-mail est requise." });
      return;
    }

    // Always return success to prevent email enumeration
    await authService.requestPasswordReset(email).catch((err) => {
      logger.error('Forgot password — unexpected error (suppressed to prevent enumeration)', {
        error: (err as Error).message,
      });
    });
    res.json({
      message: "Si un compte existe avec cette adresse, un e-mail de réinitialisation a été envoyé.",
    });
  },

  // POST /api/auth/reset-password
  async resetPassword(req: Request, res: Response): Promise<void> {
    const { token, newPassword } = req.body;

    logger.info('POST /api/auth/reset-password', { hasToken: !!token?.trim(), hasPassword: !!newPassword?.trim() });

    if (!token?.trim() || !newPassword?.trim()) {
      const missing = [!token?.trim() && 'token', !newPassword?.trim() && 'newPassword'].filter(Boolean);
      logger.warn('Reset password validation failed — missing fields', { missing });
      res.status(400).json({ error: 'Le token et le nouveau mot de passe sont requis.' });
      return;
    }
    if (newPassword.length < 8) {
      logger.warn('Reset password validation failed — password too short', { passwordLength: newPassword.length });
      res.status(400).json({ error: 'Le mot de passe doit contenir au moins 8 caractères.' });
      return;
    }

    try {
      await authService.resetPassword(token, newPassword);
      logger.info('Reset password controller — success');
      res.json({ message: 'Votre mot de passe a été réinitialisé avec succès.' });
    } catch (err) {
      if (err instanceof AuthError) {
        logger.warn('Reset password controller — auth error', {
          statusCode: err.status,
          reason: err.message,
        });
        res.status(err.status).json({ error: err.message });
      } else {
        logger.error('Reset password controller — unexpected error', { error: (err as Error).message });
        throw err;
      }
    }
  },

  // POST /api/auth/resend-verification
  async resendVerification(req: Request, res: Response): Promise<void> {
    const { email } = req.body;

    logger.info('POST /api/auth/resend-verification', { email: email?.trim() || '[empty]' });

    if (!email?.trim()) {
      logger.warn('Resend verification validation failed — missing email');
      res.status(400).json({ error: "L'adresse e-mail est requise." });
      return;
    }

    try {
      await authService.resendVerification(email);
      logger.info('Resend verification controller — success', { email });
      res.json({ message: 'E-mail de vérification renvoyé.' });
    } catch (err) {
      if (err instanceof AuthError) {
        logger.warn('Resend verification controller — auth error', {
          email,
          statusCode: err.status,
          reason: err.message,
        });
        res.status(err.status).json({ error: err.message });
      } else {
        logger.error('Resend verification controller — unexpected error', { error: (err as Error).message });
        throw err;
      }
    }
  },
};
