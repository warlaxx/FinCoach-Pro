/**
 * Application-wide constants.
 * All magic numbers and hardcoded values live here so they can be
 * reviewed and adjusted in one place.
 */

// ─── Storage Keys ──────────────────────────────────────────────────────────
export const JWT_STORAGE_KEY = 'fincoach_token';
export const FAVORITES_STORAGE_KEY = 'fincoach_favorite_stocks';

// ─── TwelveData API ────────────────────────────────────────────────────────
/** Max symbols per API request (free plan: 8 credits/min) */
export const TWELVEDATA_BATCH_SIZE = 8;
/** Milliseconds to wait between batches to stay under rate limit */
export const TWELVEDATA_BATCH_DELAY_MS = 8_000;
/** How long a cached quote stays valid before a fresh fetch is triggered */
export const QUOTE_CACHE_TTL_MS = 30_000;
/** Default time series interval for charts */
export const CHART_DEFAULT_INTERVAL = '1day';
/** Default number of data points to fetch for mini-charts */
export const CHART_DEFAULT_OUTPUT_SIZE = 30;

// ─── UI Timings ────────────────────────────────────────────────────────────
/** How often the visible price ticker refreshes (ms) */
export const PRICE_REFRESH_INTERVAL_MS = 60_000;
/** Minimum seconds between "resend verification email" requests */
export const RESEND_EMAIL_COOLDOWN_S = 60;
/** Dashboard API timeout (ms) — fail fast rather than hang forever */
export const DASHBOARD_REQUEST_TIMEOUT_MS = 10_000;

// ─── Brand Colors ──────────────────────────────────────────────────────────
export const COLOR_BRAND_GOLD   = '#C9A84C';
export const COLOR_POSITIVE     = '#22C55E';
export const COLOR_NEGATIVE     = '#EF4444';
export const COLOR_BLUE         = '#3B82F6';
export const COLOR_PURPLE       = '#8B5CF6';
export const COLOR_TEAL         = '#14B8A6';
export const COLOR_ORANGE       = '#F97316';
export const COLOR_YELLOW       = '#EAB308';
export const COLOR_SILVER       = '#8892A4';

// ─── Chart Tooltip ─────────────────────────────────────────────────────────
export const CHART_TOOLTIP_BG            = '#111620';
export const CHART_TOOLTIP_TITLE_COLOR   = '#F0F4FF';
export const CHART_TOOLTIP_BODY_COLOR    = '#8892A4';
export const CHART_TOOLTIP_BORDER_COLOR  = '#1E2738';

// ─── Financial Score Labels ────────────────────────────────────────────────
export const SCORE_LABELS: Record<string, string> = {
  A: 'Excellent',
  B: 'Bon',
  C: 'Moyen',
  D: 'Fragile',
  E: 'Préoccupant',
  F: 'Critique',
};

// ─── Financial Score Colors (A → F) ────────────────────────────────────────
export const SCORE_COLORS: Record<string, string> = {
  A: '#22C55E',
  B: '#84CC16',
  C: '#EAB308',
  D: '#F97316',
  E: '#EF4444',
  F: '#DC2626',
};
