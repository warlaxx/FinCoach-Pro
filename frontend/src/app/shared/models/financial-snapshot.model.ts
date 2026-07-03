/**
 * One monthly snapshot of the user's financial situation (TICKET-09).
 * Returned by GET /api/profile/history.
 */
export interface FinancialSnapshot {
  /** First day of the month, ISO date (e.g. "2026-07-01") */
  month: string;
  income: number;
  expenses: number;
  savings: number;
  debt: number;
  /** Letter grade A–F at snapshot time, null if score was not computable */
  score: string | null;
  /** Chartable value of the grade: A=100, B=80, C=60, D=40, E=20, F=10 */
  scoreValue: number | null;
}
