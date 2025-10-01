-- ===================================================================
-- Migration 006: Add company_id to business_processes, tasks, feedback
-- ===================================================================

-- Enable UUID extension (если еще не включено)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===================================================================
-- STEP 1: Добавление company_id в business_processes
-- ===================================================================

ALTER TABLE business_processes 
ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE CASCADE;

-- Создаем индекс для производительности
CREATE INDEX idx_business_processes_company_id ON business_processes(company_id);

-- Комментарий
COMMENT ON COLUMN business_processes.company_id IS 'ID компании, к которой относится бизнес-процесс';

-- ===================================================================
-- STEP 2: Добавление company_id в tasks
-- ===================================================================

ALTER TABLE tasks 
ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE CASCADE;

-- Создаем индекс для производительности
CREATE INDEX idx_tasks_company_id ON tasks(company_id);

-- Комментарий
COMMENT ON COLUMN tasks.company_id IS 'ID компании, к которой относится задача';

-- ===================================================================
-- STEP 3: Добавление company_id в feedback
-- ===================================================================

ALTER TABLE feedback 
ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE CASCADE;

-- Создаем индекс для производительности
CREATE INDEX idx_feedback_company_id ON feedback(company_id);

-- Комментарий
COMMENT ON COLUMN feedback.company_id IS 'ID компании, к которой относится обратная связь';

-- ===================================================================
-- STEP 4: Обновление существующих записей (если есть тестовые данные)
-- ===================================================================

-- Если у вас есть тестовая компания, обновите существующие записи
-- Раскомментируйте и измените UUID на ваш реальный ID компании

-- UPDATE business_processes 
-- SET company_id = '550e8400-e29b-41d4-a716-446655440100'::uuid
-- WHERE company_id IS NULL;

-- UPDATE tasks 
-- SET company_id = '550e8400-e29b-41d4-a716-446655440100'::uuid
-- WHERE company_id IS NULL;

-- UPDATE feedback 
-- SET company_id = '550e8400-e29b-41d4-a716-446655440100'::uuid
-- WHERE company_id IS NULL;

-- ===================================================================
-- STEP 5: (Опционально) Сделать company_id NOT NULL
-- ===================================================================

-- Если вы хотите сделать company_id обязательным полем,
-- раскомментируйте следующие команды ПОСЛЕ обновления всех существующих записей:

-- ALTER TABLE business_processes 
-- ALTER COLUMN company_id SET NOT NULL;

-- ALTER TABLE tasks 
-- ALTER COLUMN company_id SET NOT NULL;

-- ALTER TABLE feedback 
-- ALTER COLUMN company_id SET NOT NULL;

-- ===================================================================
-- END OF MIGRATION 006
-- ===================================================================