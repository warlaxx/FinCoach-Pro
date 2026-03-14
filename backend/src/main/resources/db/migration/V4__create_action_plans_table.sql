-- V4: Create action_plans table

CREATE TABLE action_plans (
    id              BIGSERIAL    PRIMARY KEY,
    user_id         VARCHAR(36)  NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title           VARCHAR(255) NOT NULL,
    description     VARCHAR(1000),
    category        VARCHAR(100),
    priority        VARCHAR(50)  NOT NULL DEFAULT 'MEDIUM',
    status          VARCHAR(50)  NOT NULL DEFAULT 'EN_COURS',
    target_amount   DOUBLE PRECISION,
    current_amount  DOUBLE PRECISION NOT NULL DEFAULT 0,
    deadline        DATE,
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_action_plans_user   ON action_plans(user_id);
CREATE INDEX idx_action_plans_status ON action_plans(user_id, status);
