-- V1: Create users table with full account management fields
-- Supports both OAuth2 and email/password authentication
-- Includes roles, email verification, and subscription tracking

CREATE TABLE users (
    id                       VARCHAR(36)  PRIMARY KEY,
    email                    VARCHAR(255) NOT NULL UNIQUE,

    -- Identity fields (used for email/password auth; nullable for OAuth2-only users)
    first_name               VARCHAR(100),
    last_name                VARCHAR(100),
    age                      INTEGER,
    password_hash            VARCHAR(255),   -- BCrypt hash; NULL for pure OAuth2 users

    -- Legacy display name (kept for OAuth2 compatibility)
    name                     VARCHAR(255),
    picture_url              VARCHAR(1024),

    -- OAuth2 fields (nullable for email/password users)
    provider                 VARCHAR(50),    -- GOOGLE, MICROSOFT, APPLE, LOCAL
    provider_id              VARCHAR(255),

    -- Role-based access control (VARCHAR for Hibernate @Enumerated(STRING) compatibility)
    role                     VARCHAR(20)  NOT NULL DEFAULT 'USER',

    -- Email verification
    email_verified           BOOLEAN NOT NULL DEFAULT FALSE,
    email_verification_token VARCHAR(64),

    -- Timestamps
    created_at               TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at               TIMESTAMP NOT NULL DEFAULT NOW(),
    subscription_started_at  TIMESTAMP
);

-- Indexes for common lookups
CREATE INDEX idx_users_email             ON users(email);
CREATE INDEX idx_users_provider          ON users(provider, provider_id);
CREATE INDEX idx_users_verification_token ON users(email_verification_token);
