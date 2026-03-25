-- =============================================================
-- V9: Add subscription plan column to users
-- Values: FREEMIUM (default), PRO, PREMIUM
-- =============================================================

ALTER TABLE users
    ADD COLUMN plan VARCHAR(20) NOT NULL DEFAULT 'FREEMIUM';

CREATE INDEX idx_users_plan ON users(plan);
