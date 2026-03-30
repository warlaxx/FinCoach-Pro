/**
 * Application-wide constants — all magic numbers and thresholds in one place.
 * Exact port of Java AppConstants.java.
 */
export const CONSTANTS = {
  // ─── Security ───────────────────────────────────────────────────────────────
  BCRYPT_ROUNDS: 12,

  // ─── JWT ────────────────────────────────────────────────────────────────────
  JWT_EXPIRY_MS: 86_400_000, // 24 hours

  // ─── AI Chat ────────────────────────────────────────────────────────────────
  OPENAI_CHAT_URL: 'https://api.openai.com/v1/chat/completions',
  OPENAI_MODEL: 'gpt-4o-mini',
  OPENAI_MAX_TOKENS: 500,
  OPENAI_TEMPERATURE: 0.7,
  CHAT_HISTORY_WINDOW: 10,
  OPENAI_TIMEOUT_MS: 30_000,

  // ─── Financial Scoring — Grade Boundaries (weighted score 0–100) ────────────
  GRADE_A: 85,
  GRADE_B: 70,
  GRADE_C: 55,
  GRADE_D: 40,
  GRADE_E: 25,

  // ─── Action Plan Auto-Generation Triggers ───────────────────────────────────
  ACTION_SAVINGS_TRIGGER_RATE: 10.0,    // below this savings rate (%) → generate savings action
  ACTION_EMERGENCY_FUND_MONTHS: 3.0,    // below this many months of income saved → generate emergency fund action
  ACTION_DEBT_RATIO_TRIGGER: 25.0,      // above this debt ratio (%) → generate debt reduction action
  ACTION_SUBSCRIPTIONS_THRESHOLD: 60.0, // above this monthly subscriptions (€) → generate audit action

  // ─── Financial Insight Thresholds ───────────────────────────────────────────
  INSIGHT_LOW_SAVINGS_RATE: 10.0,
  INSIGHT_HIGH_DEBT_RATIO: 33.0,
  INSIGHT_HIGH_LEISURE_RATIO: 0.15, // fraction of income
  INSIGHT_LOW_EMERGENCY_MONTHS: 3.0,
  INSIGHT_HIGH_SUBSCRIPTIONS: 50.0,

  // ─── Chat ───────────────────────────────────────────────────────────────────
  MAX_MESSAGE_LENGTH: 2_000,

  // ─── Apple OAuth2 ───────────────────────────────────────────────────────────
  APPLE_CLIENT_SECRET_EXPIRY_SECONDS: 15_777_000, // ~6 months (Apple maximum)
} as const;
