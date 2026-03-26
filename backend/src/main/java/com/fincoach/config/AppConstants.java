package com.fincoach.config;

/**
 * Application-wide constants.
 *
 * All magic numbers and thresholds live here so they can be reviewed
 * and adjusted in one place rather than scattered across services.
 */
public final class AppConstants {

    private AppConstants() { /* utility class — no instantiation */ }

    // ─── Security ────────────────────────────────────────────────────────────
    /** BCrypt work factor. Strength 12 ≈ 200–400 ms per hash on modern hardware. */
    public static final int BCRYPT_STRENGTH = 12;

    // ─── JWT ─────────────────────────────────────────────────────────────────
    /** Access-token lifetime in milliseconds (24 hours). */
    public static final long JWT_EXPIRY_MS = 86_400_000L;

    // ─── Password Reset ──────────────────────────────────────────────────────
    /** Hours a password-reset link remains valid before it expires. */
    public static final int PASSWORD_RESET_EXPIRY_HOURS = 1;

    // ─── AI Chat ─────────────────────────────────────────────────────────────
    /** OpenAI chat-completions endpoint. */
    public static final String OPENAI_CHAT_URL = "https://api.openai.com/v1/chat/completions";
    /** Model used for chat responses. */
    public static final String OPENAI_MODEL = "gpt-4o-mini";
    /** Maximum tokens to generate per response. */
    public static final int OPENAI_MAX_TOKENS = 500;
    /** Sampling temperature (0 = deterministic, 1 = most creative). */
    public static final double OPENAI_TEMPERATURE = 0.7;
    /** Number of previous conversation turns included in each prompt. */
    public static final int CHAT_HISTORY_WINDOW = 10;
    /** HTTP timeout for OpenAI requests in seconds. */
    public static final int OPENAI_TIMEOUT_SECONDS = 30;

    // ─── Financial Scoring — Savings Rate ────────────────────────────────────
    /** Savings rate (%) that earns the maximum savings points. */
    public static final double SAVINGS_RATE_EXCELLENT = 20.0;
    /** Savings rate (%) that earns good savings points. */
    public static final double SAVINGS_RATE_GOOD      = 10.0;
    /** Savings rate (%) that earns fair savings points. */
    public static final double SAVINGS_RATE_FAIR      = 5.0;

    // ─── Financial Scoring — Debt Ratio ──────────────────────────────────────
    /** Debt ratio (%) at or below which the maximum debt points are awarded. */
    public static final double DEBT_RATIO_HEALTHY    = 15.0;
    /** Debt ratio (%) threshold for the mid-tier debt score. */
    public static final double DEBT_RATIO_ACCEPTABLE = 25.0;
    /** Debt ratio (%) above which no debt points are awarded. */
    public static final double DEBT_RATIO_HIGH       = 33.0;

    // ─── Financial Scoring — Emergency Fund (months of income) ───────────────
    public static final double EMERGENCY_FUND_FULL    = 6.0;
    public static final double EMERGENCY_FUND_DECENT  = 3.0;
    public static final double EMERGENCY_FUND_MINIMAL = 1.0;

    // ─── Score Grade Boundaries (weighted score 0–100) ───────────────────────
    // Algorithm: 30% savings rate + 25% debt ratio + 25% expense ratio + 20% emergency fund
    public static final int GRADE_A = 85;
    public static final int GRADE_B = 70;
    public static final int GRADE_C = 55;
    public static final int GRADE_D = 40;
    public static final int GRADE_E = 25;

    // ─── Action Plan Auto-Generation Triggers ────────────────────────────────
    /** Auto-generate a savings action when savings rate is below this value (%). */
    public static final double ACTION_SAVINGS_TRIGGER_RATE    = 10.0;
    /** Auto-generate an emergency-fund action when savings < income × this factor. */
    public static final double ACTION_EMERGENCY_FUND_MONTHS   = 3.0;
    /** Auto-generate a debt-reduction action when debt ratio exceeds this value (%). */
    public static final double ACTION_DEBT_RATIO_TRIGGER      = 25.0;
    /** Auto-generate a subscriptions audit when monthly subscriptions exceed this (€). */
    public static final double ACTION_SUBSCRIPTIONS_THRESHOLD = 60.0;

    // ─── Financial Insight Thresholds ────────────────────────────────────────
    public static final double INSIGHT_LOW_SAVINGS_RATE     = 10.0;
    public static final double INSIGHT_HIGH_DEBT_RATIO      = 33.0;
    /** Leisure spending above this fraction of income triggers an insight. */
    public static final double INSIGHT_HIGH_LEISURE_RATIO   = 0.15;
    /** Emergency fund below this many months of income triggers an insight. */
    public static final double INSIGHT_LOW_EMERGENCY_MONTHS = 3.0;
    /** Monthly subscriptions above this amount (€) trigger an insight. */
    public static final double INSIGHT_HIGH_SUBSCRIPTIONS   = 50.0;
}
