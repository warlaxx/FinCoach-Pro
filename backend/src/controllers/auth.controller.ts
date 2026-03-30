import { Request, Response } from 'express';
import { authService, AuthError, ConflictError } from '../services/auth.service';
import { AuthRequest } from '../types';

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

    if (!email || !firstName || !lastName || !password) {
      res.status(400).json({ error: 'Tous les champs obligatoires doivent être renseignés.' });
      return;
    }
    if (password.length < 8) {
      res.status(400).json({ error: 'Le mot de passe doit contenir au moins 8 caractères.' });
      return;
    }

    try {
      const response = await authService.register({ email, firstName, lastName, age, password });
      res.status(201).json(response);
    } catch (err) {
      if (err instanceof ConflictError) {
        res.status(409).json({ error: (err as Error).message });
      } else {
        throw err;
      }
    }
  },

  // POST /api/auth/login
  async login(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "L'e-mail et le mot de passe sont requis." });
      return;
    }

    try {
      const response = await authService.login({ email, password });
      res.json(response);
    } catch (err) {
      if (err instanceof AuthError) {
        res.status(err.status).json({ error: err.message });
      } else {
        throw err;
      }
    }
  },

  // GET /api/auth/verify-email?token=
  async verifyEmail(req: Request, res: Response): Promise<void> {
    const token = req.query['token'] as string;
    if (!token) {
      res.status(400).json({ error: 'Token manquant.' });
      return;
    }

    try {
      const response = await authService.verifyEmail(token);
      res.json(response);
    } catch (err) {
      if (err instanceof AuthError) {
        res.status(err.status).json({ error: err.message });
      } else {
        throw err;
      }
    }
  },

  // PUT /api/auth/profile
  async updateProfile(req: AuthRequest, res: Response): Promise<void> {
    const { firstName, lastName, age, currentPassword, newPassword } = req.body;
    if (!firstName || !lastName) {
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
      res.json(response);
    } catch (err) {
      if (err instanceof AuthError) {
        res.status(err.status).json({ error: err.message });
      } else {
        throw err;
      }
    }
  },

  // POST /api/auth/forgot-password
  async forgotPassword(req: Request, res: Response): Promise<void> {
    const { email } = req.body;
    if (!email?.trim()) {
      res.status(400).json({ error: "L'adresse e-mail est requise." });
      return;
    }

    // Always return success to prevent email enumeration
    await authService.requestPasswordReset(email).catch(() => {/* ignore */});
    res.json({
      message: "Si un compte existe avec cette adresse, un e-mail de réinitialisation a été envoyé.",
    });
  },

  // POST /api/auth/reset-password
  async resetPassword(req: Request, res: Response): Promise<void> {
    const { token, newPassword } = req.body;
    if (!token?.trim() || !newPassword?.trim()) {
      res.status(400).json({ error: 'Le token et le nouveau mot de passe sont requis.' });
      return;
    }
    if (newPassword.length < 8) {
      res.status(400).json({ error: 'Le mot de passe doit contenir au moins 8 caractères.' });
      return;
    }

    try {
      await authService.resetPassword(token, newPassword);
      res.json({ message: 'Votre mot de passe a été réinitialisé avec succès.' });
    } catch (err) {
      if (err instanceof AuthError) {
        res.status(err.status).json({ error: err.message });
      } else {
        throw err;
      }
    }
  },

  // POST /api/auth/resend-verification
  async resendVerification(req: Request, res: Response): Promise<void> {
    const { email } = req.body;
    if (!email?.trim()) {
      res.status(400).json({ error: "L'adresse e-mail est requise." });
      return;
    }

    try {
      await authService.resendVerification(email);
      res.json({ message: 'E-mail de vérification renvoyé.' });
    } catch (err) {
      if (err instanceof AuthError) {
        res.status(err.status).json({ error: err.message });
      } else {
        throw err;
      }
    }
  },
};
