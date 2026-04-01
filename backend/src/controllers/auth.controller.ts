import { Request, Response } from "express";
import {
  authService,
  AuthError,
  ConflictError,
} from "../services/auth.service";
import { AuthRequest } from "../types";
import { createLogger } from "../utils/logger";

const logger = createLogger("AuthController");

export const authController = {
  // GET /api/auth/me
  me(req: AuthRequest, res: Response): void {
    const claims = req.userClaims;
    logger.debug("GET /api/auth/me", {
      userId: req.userId,
      email: claims.email,
    });
    res.json({
      success: true,
      data: {
        id: req.userId,
        email: claims.email,
        name: claims.name,
        picture: claims.picture ?? "",
        role: claims.role ?? "USER",
        firstName: claims.firstName ?? "",
        lastName: claims.lastName ?? "",
        age: claims.age ?? null,
        emailVerified: claims.emailVerified ?? false,
      },
    });
  },

  // POST /api/auth/register
  async register(req: Request, res: Response): Promise<void> {
    const { email, firstName, lastName, age, password } = req.body;

    if (!email || !firstName || !lastName || !password) {
      const missing = ["email", "firstName", "lastName", "password"].filter(
        (f) => !req.body[f],
      );
      logger.warn("Register validation failed — missing required fields", {
        missing,
      });
      res.json({
        success: false,
        message: "Tous les champs obligatoires doivent être renseignés.",
      });
      return;
    }
    if (password.length < 8) {
      logger.warn("Register validation failed — password too short", {
        email,
        passwordLength: password.length,
      });
      res.json({
        success: false,
        message: "Le mot de passe doit contenir au moins 8 caractères.",
      });
      return;
    }

    try {
      const response = await authService.register({
        email,
        firstName,
        lastName,
        age,
        password,
      });
      res.json({ success: true, data: response });
    } catch (err) {
      if (err instanceof ConflictError) {
        res.json({ success: false, message: err.message });
      } else {
        logger.error("Register unexpected error", {
          email,
          error: (err as Error).message,
        });
        res.json({
          success: false,
          message: "Erreur serveur. Veuillez réessayer plus tard.",
        });
      }
    }
  },

  // POST /api/auth/login
  async login(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body;

    if (!email || !password) {
      const missing = [!email && "email", !password && "password"].filter(
        Boolean,
      );
      res.json({
        success: false,
        message: "L'e-mail et le mot de passe sont requis.",
      });
      return;
    }

    try {
      const response = await authService.login({ email, password });
      res.json({ success: true, data: response });
    } catch (err) {
      if (err instanceof AuthError || err instanceof ConflictError) {
        res.json({ success: false, message: err.message });
      } else {
        logger.error("Login unexpected error", {
          email,
          error: (err as Error).message,
        });
        res.json({
          success: false,
          message: "Erreur serveur. Veuillez réessayer plus tard.",
        });
      }
    }
  },

  // GET /api/auth/verify-email?token=
  async verifyEmail(req: Request, res: Response): Promise<void> {
    const token = req.query["token"] as string;
    if (!token) {
      res.json({ success: false, message: "Token manquant." });
      return;
    }

    try {
      const response = await authService.verifyEmail(token);
      res.json({ success: true, data: response });
    } catch (err) {
      if (err instanceof AuthError) {
        res.json({ success: false, message: err.message });
      } else {
        logger.error("Verify email unexpected error", {
          error: (err as Error).message,
        });
        res.json({
          success: false,
          message: "Erreur serveur. Veuillez réessayer plus tard.",
        });
      }
    }
  },

  // PUT /api/auth/profile
  async updateProfile(req: AuthRequest, res: Response): Promise<void> {
    const { firstName, lastName, age, currentPassword, newPassword } = req.body;

    if (!firstName || !lastName) {
      res.json({ success: false, message: "Le prénom et le nom sont requis." });
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
      res.json({ success: true, data: response });
    } catch (err) {
      if (err instanceof AuthError || err instanceof ConflictError) {
        res.json({ success: false, message: err.message });
      } else {
        logger.error("Update profile unexpected error", {
          userId: req.userId,
          error: (err as Error).message,
        });
        res.json({
          success: false,
          message: "Erreur serveur. Veuillez réessayer plus tard.",
        });
      }
    }
  },

  // POST /api/auth/forgot-password
  async forgotPassword(req: Request, res: Response): Promise<void> {
    const { email } = req.body;

    if (!email?.trim()) {
      res.json({ success: false, message: "L'adresse e-mail est requise." });
      return;
    }

    await authService.requestPasswordReset(email).catch((err) => {
      logger.error("Forgot password — suppressed error", {
        error: (err as Error).message,
      });
    });

    res.json({
      success: true,
      message:
        "Si un compte existe avec cette adresse, un e-mail de réinitialisation a été envoyé.",
    });
  },

  // POST /api/auth/reset-password
  async resetPassword(req: Request, res: Response): Promise<void> {
    const { token, newPassword } = req.body;

    if (!token?.trim() || !newPassword?.trim()) {
      res.json({
        success: false,
        message: "Le token et le nouveau mot de passe sont requis.",
      });
      return;
    }
    if (newPassword.length < 8) {
      res.json({
        success: false,
        message: "Le mot de passe doit contenir au moins 8 caractères.",
      });
      return;
    }

    try {
      await authService.resetPassword(token, newPassword);
      res.json({
        success: true,
        message: "Votre mot de passe a été réinitialisé avec succès.",
      });
    } catch (err) {
      if (err instanceof AuthError || err instanceof ConflictError) {
        res.json({ success: false, message: err.message });
      } else {
        logger.error("Reset password unexpected error", {
          error: (err as Error).message,
        });
        res.json({
          success: false,
          message: "Erreur serveur. Veuillez réessayer plus tard.",
        });
      }
    }
  },

  // POST /api/auth/resend-verification
  async resendVerification(req: Request, res: Response): Promise<void> {
    const { email } = req.body;

    if (!email?.trim()) {
      res.json({ success: false, message: "L'adresse e-mail est requise." });
      return;
    }

    try {
      await authService.resendVerification(email);
      res.json({ success: true, message: "E-mail de vérification renvoyé." });
    } catch (err) {
      if (err instanceof AuthError || err instanceof ConflictError) {
        res.json({ success: false, message: err.message });
      } else {
        logger.error("Resend verification unexpected error", {
          error: (err as Error).message,
        });
        res.json({
          success: false,
          message: "Erreur serveur. Veuillez réessayer plus tard.",
        });
      }
    }
  },
};
