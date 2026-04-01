ALTER TABLE users ADD COLUMN password_reset_token VARCHAR(255);
ALTER TABLE users ADD COLUMN password_reset_token_expiry TIMESTAMP;

CREATE INDEX idx_users_password_reset_token ON users(password_reset_token);
