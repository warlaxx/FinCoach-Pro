-- V2: Create financial_profiles table

CREATE TABLE financial_profiles (
    id                  BIGSERIAL    PRIMARY KEY,
    user_id             VARCHAR(36)  NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Income
    monthly_income      DOUBLE PRECISION NOT NULL DEFAULT 0,
    other_income        DOUBLE PRECISION NOT NULL DEFAULT 0,

    -- Fixed expenses
    rent                DOUBLE PRECISION NOT NULL DEFAULT 0,
    utilities           DOUBLE PRECISION NOT NULL DEFAULT 0,
    insurance           DOUBLE PRECISION NOT NULL DEFAULT 0,
    loans               DOUBLE PRECISION NOT NULL DEFAULT 0,
    subscriptions       DOUBLE PRECISION NOT NULL DEFAULT 0,

    -- Variable expenses
    food                DOUBLE PRECISION NOT NULL DEFAULT 0,
    transport           DOUBLE PRECISION NOT NULL DEFAULT 0,
    leisure             DOUBLE PRECISION NOT NULL DEFAULT 0,
    clothing            DOUBLE PRECISION NOT NULL DEFAULT 0,
    health              DOUBLE PRECISION NOT NULL DEFAULT 0,

    -- Financial metrics (computed by FinancialScoringService)
    current_savings     DOUBLE PRECISION NOT NULL DEFAULT 0,
    total_debt          DOUBLE PRECISION NOT NULL DEFAULT 0,
    monthly_savings_goal DOUBLE PRECISION NOT NULL DEFAULT 0,
    financial_score     VARCHAR(10),     -- letter grade: A, B, C, D, F
    savings_rate        DOUBLE PRECISION,
    debt_ratio          DOUBLE PRECISION,

    created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_financial_profiles_user ON financial_profiles(user_id, created_at DESC);
