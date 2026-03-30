-- =============================================================
-- V8: In-app notifications (TICKET-44)
-- =============================================================

CREATE TABLE notifications (
    id          BIGSERIAL       PRIMARY KEY,
    user_id     VARCHAR(36)     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title       VARCHAR(255)    NOT NULL,
    message     VARCHAR(1000)   NOT NULL,
    type        VARCHAR(50)     NOT NULL DEFAULT 'INFO',   -- INFO, SUCCESS, WARNING, ALERT
    read        BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP       NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(user_id, read) WHERE read = FALSE;
