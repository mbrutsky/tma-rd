-- Migration 009: Add priority format flags
-- Добавляем флаг для управления форматом приоритетов (с точкой или без)

-- Сначала удаляем старый constraint
ALTER TABLE tg_feature_flags DROP CONSTRAINT IF EXISTS tg_feature_flags_scope_check;

-- Создаем новый constraint с поддержкой global, user, company, chat, role (без tenant)
ALTER TABLE tg_feature_flags ADD CONSTRAINT tg_feature_flags_scope_check 
CHECK (scope = ANY (ARRAY['global'::text, 'user'::text, 'company'::text, 'chat'::text, 'role'::text]));

-- По умолчанию все компании используют простые приоритеты 1-5
INSERT INTO tg_feature_flags (company_id, scope, scope_ref, flag, enabled, payload)
SELECT 
    id AS company_id,
    'company' AS scope,
    id::text AS scope_ref,
    'priority_with_decimal' AS flag,
    false AS enabled,  -- По умолчанию выключено (используется формат 1-5)
    '{"format": "simple", "range": "1-5"}'::jsonb AS payload
FROM companies
WHERE NOT EXISTS (
    SELECT 1 FROM tg_feature_flags 
    WHERE company_id = companies.id 
    AND flag = 'priority_with_decimal'
);

-- Для включения десятичных приоритетов для конкретной компании, выполните:
-- UPDATE tg_feature_flags 
-- SET enabled = true, 
--     payload = '{"format": "decimal", "range": "1.0-5.10"}'::jsonb
-- WHERE company_id = 'YOUR_COMPANY_UUID' 
-- AND flag = 'priority_with_decimal';