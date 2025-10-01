-- ===================================================================
-- Migration 005: Unify Telegram Integration
-- Объединение таблиц пользователей и ролей, добавление таблиц Telegram бота
-- ===================================================================

-- ===================================================================
-- STEP 1: Модификация таблицы users (добавление Telegram полей)
-- ===================================================================

-- Добавляем поля для интеграции с Telegram
ALTER TABLE users ADD COLUMN IF NOT EXISTS tg_user_id BIGINT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Создаем индексы для Telegram полей
CREATE INDEX IF NOT EXISTS idx_users_tg_user_id ON users(tg_user_id);
CREATE INDEX IF NOT EXISTS idx_users_company_tg_user ON users(company_id, tg_user_id);

-- ===================================================================
-- STEP 2: Создание таблицы user_roles (вместо старого поля role)
-- ===================================================================

-- Создаем новую таблицу ролей
CREATE TABLE IF NOT EXISTS user_roles (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('director', 'employee', 'manager', 'admin')),
    PRIMARY KEY (user_id, role)
);

-- Создаем индексы для user_roles
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role);

-- Мигрируем данные из старого поля role в новую таблицу
INSERT INTO user_roles (user_id, role)
SELECT id, 
    CASE 
        WHEN role = 'department_head' THEN 'manager'
        ELSE role
    END
FROM users
WHERE role IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- Удаляем старое поле role из users (опционально, можно оставить для совместимости)
-- ALTER TABLE users DROP COLUMN IF EXISTS role;

-- ===================================================================
-- STEP 3: Создание таблиц Telegram бота
-- ===================================================================

-- Chat bindings (Telegram chat to provider mapping)
CREATE TABLE IF NOT EXISTS tg_chat_bindings (
    id SERIAL PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    chat_id BIGINT NOT NULL UNIQUE,
    provider_type TEXT NOT NULL CHECK (provider_type IN ('notion', 'dc')),
    provider_config_id TEXT,
    default_assignee_option TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Provider identities (mapping telegram users to external systems)
CREATE TABLE IF NOT EXISTS tg_provider_identities (
    id SERIAL PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    chat_id BIGINT NOT NULL,
    tg_user_id BIGINT NOT NULL,
    external_user_id TEXT,
    external_display TEXT,
    UNIQUE(company_id, chat_id, tg_user_id)
);

-- Provider processes cache (e.g., Notion pages representing processes)
CREATE TABLE IF NOT EXISTS tg_provider_processes (
    id SERIAL PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    provider_type TEXT NOT NULL CHECK (provider_type IN ('notion', 'dc')),
    external_id TEXT NOT NULL,
    name TEXT NOT NULL,
    parent_external_id TEXT,
    UNIQUE(company_id, provider_type, external_id)
);

-- Task drafts (scenario persistence)
CREATE TABLE IF NOT EXISTS tg_task_drafts (
    id UUID PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    chat_id BIGINT NOT NULL,
    tg_user_id BIGINT NOT NULL,
    title TEXT,
    description TEXT,
    priority_num NUMERIC(3,2),
    deadline TIMESTAMPTZ,
    duration_hours INTEGER,
    checklist JSONB,
    process_external_id TEXT,
    process_confidence NUMERIC(3,2),
    state TEXT,
    current_missing TEXT,
    confirm_msg_id BIGINT,
    created_msg_id BIGINT,
    meta JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Message links (linking telegram messages to drafts/tasks)
CREATE TABLE IF NOT EXISTS tg_message_links (
    id SERIAL PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    chat_id BIGINT NOT NULL,
    message_id BIGINT NOT NULL,
    draft_id UUID,
    provider_type TEXT CHECK (provider_type IN ('notion', 'dc')),
    task_external_id TEXT,
    kind TEXT NOT NULL CHECK (kind IN ('prompt','confirm','created')),
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(chat_id, message_id)
);

-- Created tasks registry (for telegram bot)
CREATE TABLE IF NOT EXISTS tg_tasks (
    id SERIAL PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    provider_type TEXT NOT NULL CHECK (provider_type IN ('notion', 'dc')),
    external_id TEXT NOT NULL,
    url TEXT,
    title TEXT,
    assignee_option TEXT NOT NULL,
    process_external_id TEXT,
    duration_hours INTEGER,
    checklist JSONB,
    meta JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(company_id, provider_type, external_id)
);

-- Feature flags
CREATE TABLE IF NOT EXISTS tg_feature_flags (
    id SERIAL PRIMARY KEY,
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    scope TEXT NOT NULL CHECK (scope IN ('tenant','chat','role')),
    scope_ref TEXT NOT NULL,
    flag TEXT NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT true,
    payload JSONB,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ===================================================================
-- STEP 4: Создание индексов для таблиц Telegram бота
-- ===================================================================

CREATE INDEX IF NOT EXISTS idx_tg_chat_bindings_company ON tg_chat_bindings(company_id);
CREATE INDEX IF NOT EXISTS idx_tg_provider_identities_company ON tg_provider_identities(company_id);
CREATE INDEX IF NOT EXISTS idx_tg_provider_processes_company ON tg_provider_processes(company_id);
CREATE INDEX IF NOT EXISTS idx_tg_task_drafts_company ON tg_task_drafts(company_id);
CREATE INDEX IF NOT EXISTS idx_tg_task_drafts_chat_user ON tg_task_drafts(chat_id, tg_user_id);
CREATE INDEX IF NOT EXISTS idx_tg_message_links_company ON tg_message_links(company_id);
CREATE INDEX IF NOT EXISTS idx_tg_tasks_company ON tg_tasks(company_id);

-- ===================================================================
-- STEP 5: Создание триггеров для новых таблиц
-- ===================================================================

-- Триггеры для tg_chat_bindings
CREATE TRIGGER update_tg_chat_bindings_updated_at BEFORE UPDATE ON tg_chat_bindings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Триггеры для tg_task_drafts
CREATE TRIGGER update_tg_task_drafts_updated_at BEFORE UPDATE ON tg_task_drafts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Триггеры для tg_tasks
CREATE TRIGGER update_tg_tasks_updated_at BEFORE UPDATE ON tg_tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===================================================================
-- STEP 6: Добавление комментариев для документации
-- ===================================================================

COMMENT ON TABLE user_roles IS 'Роли пользователей: director, employee, manager, admin';

COMMENT ON TABLE tg_chat_bindings IS 'Привязка Telegram чатов к провайдерам (Notion/DC)';
COMMENT ON TABLE tg_task_drafts IS 'Черновики задач из Telegram (персист сценария)';
COMMENT ON TABLE tg_message_links IS 'Связь между Telegram сообщениями и задачами/черновиками';
COMMENT ON TABLE tg_tasks IS 'Реестр созданных задач через Telegram бота';

COMMENT ON COLUMN users.tg_user_id IS 'Telegram User ID (для интеграции с ботом)';
COMMENT ON COLUMN users.display_name IS 'Отображаемое имя в Telegram';

COMMENT ON COLUMN tg_chat_bindings.provider_type IS 'Тип провайдера: notion или dc';
COMMENT ON COLUMN tg_chat_bindings.default_assignee_option IS 'Опция исполнителя по умолчанию (например, "МБ" или "ГС")';

COMMENT ON COLUMN tg_task_drafts.priority_num IS 'Приоритет от 1.00 до 5.10';
COMMENT ON COLUMN tg_task_drafts.state IS 'Состояние черновика: collecting | confirming | NULL';

-- ===================================================================
-- STEP 7: Обновление существующих тестовых данных (опционально)
-- ===================================================================

-- Обновляем тестовых пользователей с Telegram ID
UPDATE users 
SET tg_user_id = 123456789, display_name = 'Анна Иванова'
WHERE id = '550e8400-e29b-41d4-a716-446655440001';

UPDATE users 
SET tg_user_id = 987654321, display_name = 'Алексей Петров'
WHERE id = '550e8400-e29b-41d4-a716-446655440002';

-- ===================================================================
-- END OF MIGRATION 005
-- ===================================================================