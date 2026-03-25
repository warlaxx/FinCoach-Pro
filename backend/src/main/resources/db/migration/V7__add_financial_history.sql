-- =============================================================
-- V7: Monthly financial snapshots for tracking progress over time
-- Used by TICKET-42 (Dashboard charts & history)
-- =============================================================

CREATE TABLE financial_history (
    id          BIGSERIAL       PRIMARY KEY,
    user_id     VARCHAR(36)     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    month       DATE            NOT NULL,  -- first day of the month (e.g. 2026-03-01)
    income      DOUBLE PRECISION NOT NULL DEFAULT 0,
    expenses    DOUBLE PRECISION NOT NULL DEFAULT 0,
    savings     DOUBLE PRECISION NOT NULL DEFAULT 0,
    debt        DOUBLE PRECISION NOT NULL DEFAULT 0,
    score       VARCHAR(10),               -- financial score at snapshot time (A-F)
    created_at  TIMESTAMP       NOT NULL DEFAULT NOW()
);

-- One snapshot per user per month
ALTER TABLE financial_history
    ADD CONSTRAINT uq_financial_history_user_month UNIQUE (user_id, month);

CREATE INDEX idx_financial_history_user ON financial_history(user_id, month DESC);
