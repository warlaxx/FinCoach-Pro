import { Request } from 'express';

// ─── JWT Claims ───────────────────────────────────────────────────────────────

export interface JwtClaims {
  sub: string;
  email: string;
  name: string;
  picture?: string;
  role: string;
  plan?: string;
  firstName?: string;
  lastName?: string;
  age?: number;
  emailVerified?: boolean;
  iat: number;
  exp: number;
}

// ─── Express Request Extension ────────────────────────────────────────────────

export interface AuthRequest extends Request {
  userId: string;
  userClaims: JwtClaims;
}

// ─── Auth DTOs ────────────────────────────────────────────────────────────────

export interface RegisterPayload {
  email: string;
  firstName: string;
  lastName: string;
  age?: number;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface UpdateProfilePayload {
  firstName: string;
  lastName: string;
  age?: number;
  currentPassword?: string;
  newPassword?: string;
}

export interface AuthResponse {
  token?: string;
  userId?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  plan?: string;
  emailVerified?: boolean;
  message?: string;
}

// ─── Financial Profile ────────────────────────────────────────────────────────

export interface FinancialProfilePayload {
  monthlyIncome: number;
  otherIncome?: number;
  rent: number;
  utilities?: number;
  insurance?: number;
  loans: number;
  subscriptions?: number;
  food: number;
  transport?: number;
  leisure?: number;
  clothing?: number;
  health?: number;
  currentSavings: number;
  totalDebt: number;
  monthlySavingsGoal?: number;
  typeHabitation?: string;
  situationFamiliale?: string;
  nombrePersonnes?: number;
}

// ─── Score Result ─────────────────────────────────────────────────────────────

export interface ScoreResult {
  grade: string;
  totalScore: number;
  breakdown: Record<string, number>;
  message: string;
}

// ─── Action Plan ─────────────────────────────────────────────────────────────

export interface ActionPlanPayload {
  title: string;
  description?: string;
  category?: string;
  priority?: string;
  targetAmount?: number;
  currentAmount?: number;
  deadline?: string;
}

// ─── OAuth2 User Profile ──────────────────────────────────────────────────────

export interface OAuthUserProfile {
  provider: string;
  providerId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  pictureUrl?: string;
}
