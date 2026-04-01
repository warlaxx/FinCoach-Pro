import { Response } from 'express';
import { AuthRequest, FinancialProfilePayload } from '../types';
import prisma from '../config/database';
import { scoringService } from '../services/scoring.service';
import { actionPlanService } from '../services/action-plan.service';
import { FinancialProfile } from '@prisma/client';
import { createLogger } from '../utils/logger';

const logger = createLogger('ProfileController');

/**
 * Profile controller — port of Java ProfileController.java.
 *
 * Routes:
 *  GET  /api/profile              — get current user's profile (from JWT)
 *  GET  /api/profile/:userId      — get profile by userId (backward compat)
 *  POST /api/profile              — upsert financial profile
 *  GET  /api/dashboard/:userId    — dashboard (profile + top actions + stats)
 */
export const profileController = {
  // GET /api/profile
  async getMyProfile(req: AuthRequest, res: Response): Promise<void> {
    logger.debug('GET /api/profile', { userId: req.userId });

    const profile = await prisma.financialProfile.findFirst({
      where: { userId: req.userId },
      orderBy: { updatedAt: 'desc' },
    });

    if (!profile) {
      logger.warn('Profile not found', { userId: req.userId });
      res.status(404).json({ error: 'Profil introuvable.' });
      return;
    }

    logger.debug('Profile fetched', { userId: req.userId, profileId: profile.id });
    res.json(buildProfileResponse(profile));
  },

  // GET /api/profile/:userId
  async getProfileByUserId(req: AuthRequest, res: Response): Promise<void> {
    const { userId } = req.params as { userId: string };
    logger.debug('GET /api/profile/:userId', { requestedUserId: userId, callerUserId: req.userId });

    const profile = await prisma.financialProfile.findFirst({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });

    if (!profile) {
      logger.warn('Profile not found by userId', { requestedUserId: userId });
      res.status(404).json({ error: 'Profil introuvable.' });
      return;
    }

    logger.debug('Profile fetched by userId', { requestedUserId: userId, profileId: profile.id });
    res.json(buildProfileResponse(profile));
  },

  // POST /api/profile
  async saveProfile(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.userId;
    const body = req.body as FinancialProfilePayload;

    logger.info('POST /api/profile — saving financial profile', {
      userId,
      monthlyIncome: body.monthlyIncome,
    });

    if (body.monthlyIncome === undefined || body.monthlyIncome === null) {
      logger.warn('Save profile validation failed — missing monthlyIncome', { userId });
      res.status(400).json({ error: 'Le revenu mensuel est requis.' });
      return;
    }

    // Upsert: update existing profile or create a new one
    const existing = await prisma.financialProfile.findFirst({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });

    const orZero = (v: number | undefined | null) => v ?? 0;

    // Compute scores from the incoming data
    const profileData = {
      monthlyIncome: orZero(body.monthlyIncome),
      otherIncome: orZero(body.otherIncome),
      rent: orZero(body.rent),
      utilities: orZero(body.utilities),
      insurance: orZero(body.insurance),
      loans: orZero(body.loans),
      subscriptions: orZero(body.subscriptions),
      food: orZero(body.food),
      transport: orZero(body.transport),
      leisure: orZero(body.leisure),
      clothing: orZero(body.clothing),
      health: orZero(body.health),
      currentSavings: orZero(body.currentSavings),
      totalDebt: orZero(body.totalDebt),
      monthlySavingsGoal: orZero(body.monthlySavingsGoal),
      typeHabitation: body.typeHabitation ?? null,
      situationFamiliale: body.situationFamiliale ?? null,
      nombrePersonnes: body.nombrePersonnes ?? 0,
    };

    const scores = scoringService.computeScores(profileData);

    const savedProfile = existing
      ? await prisma.financialProfile.update({
          where: { id: existing.id },
          data: { ...profileData, ...scores },
        })
      : await prisma.financialProfile.create({
          data: { userId, ...profileData, ...scores },
        });

    logger.info('Profile upserted successfully', {
      userId,
      profileId: savedProfile.id,
      financialScore: savedProfile.financialScore,
      isUpdate: !!existing,
    });

    // Auto-generate action plans based on the new profile
    await actionPlanService.generateFromProfile(savedProfile);

    res.json(buildProfileResponse(savedProfile));
  },

  // GET /api/dashboard/:userId
  async getDashboard(req: AuthRequest, res: Response): Promise<void> {
    const { userId } = req.params as { userId: string };
    logger.debug('GET /api/dashboard/:userId', { requestedUserId: userId, callerUserId: req.userId });

    const profile = await prisma.financialProfile.findFirst({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });

    const allActions = await actionPlanService.getActionsForUser(userId);
    const topActions = allActions
      .filter((a) => a.status === 'EN_COURS')
      .slice(0, 4)
      .map(actionPlanService.toResponse.bind(actionPlanService));

    const stats = await actionPlanService.buildStats(userId);

    logger.debug('Dashboard data loaded', {
      userId,
      hasProfile: !!profile,
      topActionsCount: topActions.length,
    });

    res.json({
      profile: profile ? buildProfileResponse(profile) : null,
      topActions,
      stats,
    });
  },
};

// ─── Profile response builder ──────────────────────────────────────────────────

function buildProfileResponse(p: FinancialProfile): Record<string, unknown> {
  const orZero = (v: number | null | undefined) => v ?? 0;

  const income = orZero(p.monthlyIncome) + orZero(p.otherIncome);
  const fixed =
    orZero(p.rent) +
    orZero(p.utilities) +
    orZero(p.insurance) +
    orZero(p.loans) +
    orZero(p.subscriptions);
  const variable =
    orZero(p.food) +
    orZero(p.transport) +
    orZero(p.leisure) +
    orZero(p.clothing) +
    orZero(p.health);
  const total = fixed + variable;

  const scoreResult = scoringService.calculateScore(p);

  const response: Record<string, unknown> = {
    id: p.id.toString(),
    userId: p.userId,
    monthlyIncome: income,
    totalFixedExpenses: fixed,
    totalVariableExpenses: variable,
    totalExpenses: total,
    monthlySurplus: income - total,
    savingsRate: p.savingsRate,
    debtRatio: p.debtRatio,
    financialScore: p.financialScore,
    currentSavings: p.currentSavings,
    totalDebt: p.totalDebt,
    typeHabitation: p.typeHabitation,
    situationFamiliale: p.situationFamiliale,
    nombrePersonnes: p.nombrePersonnes,
    insights: scoringService.generateInsights(p),
    breakdown: {
      housing: orZero(p.rent),
      food: orZero(p.food),
      transport: orZero(p.transport),
      leisure: orZero(p.leisure),
      loans: orZero(p.loans),
      other:
        orZero(p.utilities) +
        orZero(p.insurance) +
        orZero(p.subscriptions) +
        orZero(p.clothing) +
        orZero(p.health),
    },
    updatedAt: p.updatedAt,
    raw: {
      monthlyIncome: orZero(p.monthlyIncome),
      otherIncome: orZero(p.otherIncome),
      rent: orZero(p.rent),
      utilities: orZero(p.utilities),
      insurance: orZero(p.insurance),
      loans: orZero(p.loans),
      subscriptions: orZero(p.subscriptions),
      food: orZero(p.food),
      transport: orZero(p.transport),
      leisure: orZero(p.leisure),
      clothing: orZero(p.clothing),
      health: orZero(p.health),
      currentSavings: orZero(p.currentSavings),
      totalDebt: orZero(p.totalDebt),
      monthlySavingsGoal: orZero(p.monthlySavingsGoal),
    },
  };

  if (scoreResult.grade !== 'N/A') {
    response['scoreBreakdown'] = {
      grade: scoreResult.grade,
      totalScore: scoreResult.totalScore,
      breakdown: scoreResult.breakdown,
      message: scoreResult.message,
    };
  }

  return response;
}
