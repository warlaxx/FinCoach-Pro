ALTER TABLE financial_profiles
    ADD COLUMN IF NOT EXISTS type_habitation   VARCHAR(50),
    ADD COLUMN IF NOT EXISTS situation_familiale VARCHAR(50),
    ADD COLUMN IF NOT EXISTS nombre_personnes  INTEGER DEFAULT 0;
