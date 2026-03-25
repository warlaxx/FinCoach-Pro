-- =============================================================
-- Seed data for development environment ONLY
-- Run via: spring.sql.init.data-locations (dev profile)
--
-- Test user: test@fincoach.dev / Test1234!
-- Password hash: BCrypt of "Test1234!"
-- =============================================================

-- 1. Test user (BCrypt hash generated for "Test1234!")
INSERT INTO users (id, email, first_name, last_name, age, password_hash, provider, role, plan, email_verified, created_at, updated_at)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'test@fincoach.dev',
    'Test',
    'User',
    30,
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    'LOCAL',
    'USER',
    'PRO',
    true,
    NOW() - INTERVAL '6 months',
    NOW()
)
ON CONFLICT (email) DO NOTHING;

-- 2. Financial profile
INSERT INTO financial_profiles (user_id, monthly_income, other_income, rent, utilities, insurance, loans,
    subscriptions, food, transport, leisure, clothing, health,
    current_savings, total_debt, monthly_savings_goal, financial_score, savings_rate, debt_ratio,
    created_at, updated_at)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    3500.00, 200.00,      -- income
    850.00, 120.00,       -- housing
    80.00, 300.00,        -- insurance & loans
    45.00, 400.00,        -- subscriptions & food
    150.00, 100.00,       -- transport & leisure
    50.00, 30.00,         -- clothing & health
    8500.00, 12000.00,    -- savings & debt
    500.00,               -- savings goal
    'B', 0.135, 0.343,    -- score metrics
    NOW(), NOW()
)
ON CONFLICT DO NOTHING;

-- 3. Action plans (5 plans with mixed statuses)
INSERT INTO action_plans (user_id, title, description, category, priority, status, target_amount, current_amount, deadline, created_at, updated_at)
VALUES
    ('00000000-0000-0000-0000-000000000001', 'Fonds d''urgence 3 mois',
     'Constituer un fonds d''urgence couvrant 3 mois de charges fixes', 'EPARGNE', 'HIGH', 'EN_COURS',
     3000.00, 1200.00, CURRENT_DATE + INTERVAL '4 months', NOW() - INTERVAL '2 months', NOW()),

    ('00000000-0000-0000-0000-000000000001', 'Rembourser le prêt conso',
     'Rembourser le prêt consommation de 5000€ en priorité', 'DETTE', 'HIGH', 'EN_COURS',
     5000.00, 2000.00, CURRENT_DATE + INTERVAL '8 months', NOW() - INTERVAL '3 months', NOW()),

    ('00000000-0000-0000-0000-000000000001', 'Réduire les abonnements',
     'Auditer et résilier les abonnements inutilisés pour économiser 20€/mois', 'BUDGET', 'MEDIUM', 'TERMINE',
     240.00, 240.00, CURRENT_DATE - INTERVAL '1 month', NOW() - INTERVAL '2 months', NOW()),

    ('00000000-0000-0000-0000-000000000001', 'Épargne vacances',
     'Mettre de côté 100€/mois pour les vacances d''été', 'EPARGNE', 'LOW', 'EN_COURS',
     600.00, 300.00, CURRENT_DATE + INTERVAL '3 months', NOW() - INTERVAL '3 months', NOW()),

    ('00000000-0000-0000-0000-000000000001', 'Ouvrir un PEA',
     'Ouvrir un Plan d''Épargne en Actions pour investir à long terme', 'INVESTISSEMENT', 'MEDIUM', 'A_FAIRE',
     1000.00, 0.00, CURRENT_DATE + INTERVAL '6 months', NOW(), NOW());

-- 4. Chat messages (5 user + 5 assistant, interleaved)
INSERT INTO chat_messages (user_id, role, content, created_at)
VALUES
    ('00000000-0000-0000-0000-000000000001', 'user',
     'Bonjour, j''aimerais avoir des conseils pour mieux gérer mon budget.',
     NOW() - INTERVAL '5 days'),

    ('00000000-0000-0000-0000-000000000001', 'assistant',
     'Bonjour ! Avec plaisir. J''ai analysé votre profil financier. Votre score est B, ce qui est correct mais améliorable. Votre taux d''épargne est de 13.5% — l''objectif recommandé est 20%. Souhaitez-vous qu''on travaille sur un plan d''action ?',
     NOW() - INTERVAL '5 days' + INTERVAL '10 seconds'),

    ('00000000-0000-0000-0000-000000000001', 'user',
     'Oui, par quoi devrais-je commencer ?',
     NOW() - INTERVAL '5 days' + INTERVAL '1 minute'),

    ('00000000-0000-0000-0000-000000000001', 'assistant',
     'Je vous recommande 3 priorités : 1) Constituer un fonds d''urgence de 3 mois de charges (environ 3000€). 2) Accélérer le remboursement de votre prêt conso. 3) Réduire vos abonnements inutilisés. Voulez-vous que je crée ces plans d''action ?',
     NOW() - INTERVAL '5 days' + INTERVAL '1 minute 15 seconds'),

    ('00000000-0000-0000-0000-000000000001', 'user',
     'Oui, crée-les. Et comment réduire mes dépenses alimentaires ?',
     NOW() - INTERVAL '4 days'),

    ('00000000-0000-0000-0000-000000000001', 'assistant',
     'Plans d''action créés ! Pour les dépenses alimentaires (400€/mois), voici quelques pistes : planifier les repas à la semaine, faire une liste de courses et s''y tenir, privilégier les produits de saison, et cuisiner en batch le dimanche. Objectif réaliste : passer à 320€/mois.',
     NOW() - INTERVAL '4 days' + INTERVAL '12 seconds'),

    ('00000000-0000-0000-0000-000000000001', 'user',
     'Merci ! Est-ce que je devrais investir en bourse avec ma situation actuelle ?',
     NOW() - INTERVAL '3 days'),

    ('00000000-0000-0000-0000-000000000001', 'assistant',
     'Avec un ratio d''endettement de 34%, je vous déconseille d''investir en bourse pour l''instant. Priorité : fonds d''urgence + remboursement du prêt. Une fois ces objectifs atteints et votre épargne de précaution constituée, un PEA serait pertinent pour du long terme.',
     NOW() - INTERVAL '3 days' + INTERVAL '15 seconds'),

    ('00000000-0000-0000-0000-000000000001', 'user',
     'D''accord, je vais suivre tes conseils. Peux-tu me faire un résumé de mon plan ?',
     NOW() - INTERVAL '1 day'),

    ('00000000-0000-0000-0000-000000000001', 'assistant',
     'Voici votre plan résumé : Court terme (0-4 mois) : fonds d''urgence 3000€ + réduction abonnements. Moyen terme (4-8 mois) : remboursement prêt conso + épargne vacances. Long terme (8+ mois) : ouverture PEA quand dette remboursée. Revenez me voir chaque mois pour faire le point !',
     NOW() - INTERVAL '1 day' + INTERVAL '18 seconds');

-- 5. Financial history (6 monthly snapshots)
INSERT INTO financial_history (user_id, month, income, expenses, savings, debt, score, created_at)
VALUES
    ('00000000-0000-0000-0000-000000000001', DATE_TRUNC('month', NOW() - INTERVAL '5 months'),
     3500.00, 2975.00, 5500.00, 15000.00, 'C', NOW() - INTERVAL '5 months'),

    ('00000000-0000-0000-0000-000000000001', DATE_TRUNC('month', NOW() - INTERVAL '4 months'),
     3500.00, 2900.00, 6100.00, 14200.00, 'C', NOW() - INTERVAL '4 months'),

    ('00000000-0000-0000-0000-000000000001', DATE_TRUNC('month', NOW() - INTERVAL '3 months'),
     3700.00, 2850.00, 6950.00, 13400.00, 'B', NOW() - INTERVAL '3 months'),

    ('00000000-0000-0000-0000-000000000001', DATE_TRUNC('month', NOW() - INTERVAL '2 months'),
     3700.00, 2800.00, 7800.00, 12800.00, 'B', NOW() - INTERVAL '2 months'),

    ('00000000-0000-0000-0000-000000000001', DATE_TRUNC('month', NOW() - INTERVAL '1 month'),
     3700.00, 2780.00, 8200.00, 12400.00, 'B', NOW() - INTERVAL '1 month'),

    ('00000000-0000-0000-0000-000000000001', DATE_TRUNC('month', NOW()),
     3700.00, 2725.00, 8500.00, 12000.00, 'B', NOW());
