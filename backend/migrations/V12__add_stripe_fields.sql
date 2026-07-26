-- =============================================================
-- V12: Stripe billing fields on users (TICKET-15)
-- stripe_customer_id     : Stripe Customer ("cus_...") — un par utilisateur
-- stripe_subscription_id : abonnement actif ("sub_...") — null si Freemium
-- =============================================================

ALTER TABLE users
    ADD COLUMN stripe_customer_id VARCHAR(255),
    ADD COLUMN stripe_subscription_id VARCHAR(255);

CREATE UNIQUE INDEX uq_users_stripe_customer_id ON users(stripe_customer_id);
