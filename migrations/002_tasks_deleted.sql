-- Миграция для добавления мягкого удаления задач

-- Добавляем новые поля для мягкого удаления
ALTER TABLE tasks 
ADD COLUMN is_deleted BOOLEAN DEFAULT FALSE NOT NULL,
ADD COLUMN deleted_at TIMESTAMP NULL,
ADD COLUMN deleted_by UUID NULL;

-- Создаем внешний ключ для пользователя, который удалил задачу
ALTER TABLE tasks 
ADD CONSTRAINT fk_tasks_deleted_by 
FOREIGN KEY (deleted_by) REFERENCES users(id);

-- Создаем индекс для быстрого поиска неудаленных задач
CREATE INDEX idx_tasks_is_deleted ON tasks(is_deleted);

-- Создаем индекс для сортировки удаленных задач по дате удаления
CREATE INDEX idx_tasks_deleted_at ON tasks(deleted_at) WHERE deleted_at IS NOT NULL;

-- Обновляем существующие задачи - помечаем их как неудаленные
UPDATE tasks SET is_deleted = FALSE WHERE is_deleted IS NULL;

-- Добавляем комментарий к таблице
COMMENT ON COLUMN tasks.is_deleted IS 'Флаг мягкого удаления задачи';
COMMENT ON COLUMN tasks.deleted_at IS 'Дата и время удаления задачи';
COMMENT ON COLUMN tasks.deleted_by IS 'ID пользователя, который удалил задачу';