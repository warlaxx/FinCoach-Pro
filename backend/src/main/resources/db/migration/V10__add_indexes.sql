-- =============================================================
-- V10: Additional performance indexes
-- Covers user_id lookups and created_at ordering across all tables
-- =============================================================

-- financial_profiles: user_id already indexed via V2 (idx_financial_profiles_user)
-- chat_messages:      user_id already indexed via V3 (idx_chat_messages_user)
-- action_plans:       user_id already indexed via V4 (idx_action_plans_user)
-- financial_history:  user_id already indexed via V7 (idx_financial_history_user)
-- notifications:      user_id already indexed via V8 (idx_notifications_user)

-- created_at indexes for time-based queries
CREATE INDEX IF NOT EXISTS idx_financial_profiles_created ON financial_profiles(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_action_plans_created ON action_plans(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_created ON users(created_at DESC);
