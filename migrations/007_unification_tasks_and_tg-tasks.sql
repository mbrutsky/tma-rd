-- ===================================================================
-- Migration 007: Объединение tg_tasks с tasks
-- Объединяет функциональность Telegram бота с основной системой задач
-- ===================================================================

BEGIN;

-- 1. Добавляем новые поля в таблицу tasks
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS provider_type VARCHAR(16) CHECK (provider_type IN ('notion', 'dc')),
ADD COLUMN IF NOT EXISTS telegram_origin BOOLEAN DEFAULT FALSE;

-- 2. Создаем временную таблицу для маппинга пользователей
CREATE TEMP TABLE user_mapping AS
SELECT 
    u.id as user_id,
    u.tg_user_id,
    u.company_id,
    cb.default_assignee_option
FROM users u
LEFT JOIN tg_chat_bindings cb ON u.company_id = cb.company_id
WHERE u.tg_user_id IS NOT NULL;

-- 3. Мигрируем данные из tg_tasks в tasks
INSERT INTO tasks (
    id,
    title,
    description,
    priority,
    status,
    type,
    creator_id,
    responsible_id,
    process_id,
    company_id,
    due_date,
    created_at,
    updated_at,
    estimated_hours,
    provider_type,
    telegram_origin,
    tags
)
SELECT 
    uuid_generate_v4() as id,
    COALESCE(tgt.title, 'Задача из Telegram') as title,
    tgt.meta->>'description' as description,
    2 as priority, -- default priority
    'new' as status,
    'one_time' as type,
    um_creator.user_id as creator_id,
    um_responsible.user_id as responsible_id,
    bp.id as process_id,
    tgt.company_id,
    tgt.created_at + INTERVAL '1 day' as due_date, -- default deadline
    tgt.created_at,
    tgt.updated_at,
    tgt.duration_hours,
    tgt.provider_type,
    TRUE as telegram_origin,
    ARRAY[]::TEXT[] as tags
FROM tg_tasks tgt
LEFT JOIN user_mapping um_creator ON tgt.company_id = um_creator.company_id
LEFT JOIN user_mapping um_responsible ON tgt.company_id = um_responsible.company_id 
    AND um_responsible.default_assignee_option = tgt.assignee_option
LEFT JOIN business_processes bp ON bp.name ILIKE '%' || COALESCE(tgt.process_external_id, 'общий') || '%'
    AND bp.company_id = tgt.company_id;

-- 4. Создаем связи исполнителей для мигрированных задач
INSERT INTO task_assignees (task_id, user_id)
SELECT DISTINCT
    t.id as task_id,
    um.user_id
FROM tasks t
JOIN tg_tasks tgt ON t.telegram_origin = TRUE 
    AND t.created_at = tgt.created_at 
    AND t.company_id = tgt.company_id
JOIN user_mapping um ON tgt.company_id = um.company_id 
    AND um.default_assignee_option = tgt.assignee_option
WHERE t.telegram_origin = TRUE
    AND um.user_id IS NOT NULL;

-- 5. Добавляем записи в историю для мигрированных задач
INSERT INTO history_entries (
    task_id,
    action_type,
    user_id,
    description,
    additional_data,
    created_at
)
SELECT 
    t.id as task_id,
    'created' as action_type,
    t.creator_id,
    'Задача создана через Telegram бота' as description,
    jsonb_build_object(
        'provider_type', t.provider_type,
        'migrated_from', 'tg_tasks',
        'original_external_id', tgt.external_id
    ) as additional_data,
    t.created_at
FROM tasks t
JOIN tg_tasks tgt ON t.telegram_origin = TRUE 
    AND t.created_at = tgt.created_at 
    AND t.company_id = tgt.company_id
WHERE t.telegram_origin = TRUE;

-- 6. Мигрируем чек-листы из tg_tasks в checklist_items
INSERT INTO checklist_items (
    task_id,
    text,
    completed,
    created_by,
    level,
    item_order,
    created_at
)
SELECT 
    t.id as task_id,
    checklist_item->>'text' as text,
    COALESCE((checklist_item->>'completed')::boolean, false) as completed,
    t.creator_id as created_by,
    COALESCE((checklist_item->>'level')::integer, 0) as level,
    (row_number() OVER (PARTITION BY t.id ORDER BY checklist_item))::integer as item_order,
    t.created_at
FROM tasks t
JOIN tg_tasks tgt ON t.telegram_origin = TRUE 
    AND t.created_at = tgt.created_at 
    AND t.company_id = tgt.company_id
CROSS JOIN LATERAL jsonb_array_elements(COALESCE(tgt.checklist->'items', '[]'::jsonb)) as checklist_item
WHERE t.telegram_origin = TRUE
    AND jsonb_typeof(tgt.checklist->'items') = 'array'
    AND checklist_item->>'text' IS NOT NULL;

-- 7. Обновляем ссылки в tg_message_links на новые задачи
UPDATE tg_message_links ml
SET task_external_id = t.id::text
FROM tasks t
JOIN tg_tasks tgt ON t.telegram_origin = TRUE 
    AND t.created_at = tgt.created_at 
    AND t.company_id = tgt.company_id
WHERE ml.company_id = tgt.company_id
    AND ml.task_external_id = tgt.external_id
    AND ml.provider_type = tgt.provider_type;

-- 8. Добавляем индексы для новых полей
CREATE INDEX IF NOT EXISTS idx_tasks_provider_type ON tasks(provider_type);
CREATE INDEX IF NOT EXISTS idx_tasks_telegram_origin ON tasks(telegram_origin);
CREATE INDEX IF NOT EXISTS idx_tasks_company_provider ON tasks(company_id, provider_type) WHERE telegram_origin = TRUE;

-- 9. Обновляем комментарии к колонкам
COMMENT ON COLUMN tasks.provider_type IS 'Тип провайдера внешней системы: notion, dc';
COMMENT ON COLUMN tasks.telegram_origin IS 'Флаг задач, созданных через Telegram бота';

-- 10. Добавляем company_id в tasks если его нет (из анализа схемы видно что поле отсутствует)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tasks' AND column_name = 'company_id'
    ) THEN
        ALTER TABLE tasks ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE CASCADE;
        CREATE INDEX idx_tasks_company_id ON tasks(company_id);
        COMMENT ON COLUMN tasks.company_id IS 'ID компании (для multi-tenant поддержки)';
    END IF;
END $$;

-- 11. Заполняем company_id для существующих задач через creator_id
UPDATE tasks 
SET company_id = u.company_id
FROM users u 
WHERE tasks.creator_id = u.id 
    AND tasks.company_id IS NULL;

-- 12. Удаляем таблицу tg_tasks
DROP TABLE IF EXISTS tg_tasks CASCADE;

-- 13. Обновляем статистику таблиц
ANALYZE tasks;
ANALYZE task_assignees;
ANALYZE checklist_items;
ANALYZE history_entries;

COMMIT;