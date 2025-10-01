-- migrations/002_companies_and_notifications.sql
-- Database Migration for Companies and Notifications
-- PostgreSQL Migration

-- Таблица компаний
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    director_telegram_user_id BIGINT NOT NULL,
    director_telegram_username VARCHAR(255),
    director_app_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    plan VARCHAR(20) NOT NULL CHECK (plan IN ('free', 'pro')) DEFAULT 'free',
    employee_user_ids UUID[] DEFAULT '{}',
    connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица уведомлений
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    send_to_telegram BOOLEAN DEFAULT true,
    send_to_email BOOLEAN DEFAULT true,
    message_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sent_at TIMESTAMP WITH TIME ZONE,
    is_sent BOOLEAN DEFAULT false,
    telegram_sent BOOLEAN DEFAULT false,
    email_sent BOOLEAN DEFAULT false,
    telegram_sent_at TIMESTAMP WITH TIME ZONE,
    email_sent_at TIMESTAMP WITH TIME ZONE,
    notification_type VARCHAR(50) DEFAULT 'general',
    task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE
);

-- Индексы для производительности
CREATE INDEX idx_companies_director_telegram ON companies(director_telegram_user_id);
CREATE INDEX idx_companies_director_app_user ON companies(director_app_user_id);
CREATE INDEX idx_companies_plan ON companies(plan);
CREATE INDEX idx_companies_connected_at ON companies(connected_at);

CREATE INDEX idx_notifications_recipient ON notifications(recipient_user_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_notifications_sent_at ON notifications(sent_at);
CREATE INDEX idx_notifications_is_sent ON notifications(is_sent);
CREATE INDEX idx_notifications_type ON notifications(notification_type);
CREATE INDEX idx_notifications_task_id ON notifications(task_id);
CREATE INDEX idx_notifications_company_id ON notifications(company_id);

-- Триггер для updated_at в таблице companies
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Добавляем связь пользователей с компаниями (опционально)
ALTER TABLE users ADD COLUMN company_id UUID REFERENCES companies(id) ON DELETE SET NULL;
CREATE INDEX idx_users_company_id ON users(company_id);

-- Обновляем существующих пользователей, привязывая их к тестовой компании
INSERT INTO companies (id, director_telegram_user_id, director_telegram_username, director_app_user_id, plan, employee_user_ids) 
VALUES (
    '550e8400-e29b-41d4-a716-446655440100', 
    123456789, 
    'director_username', 
    '550e8400-e29b-41d4-a716-446655440001',
    'pro',
    ARRAY['550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002']::UUID[]
);

-- Привязываем существующих пользователей к компании
UPDATE users SET company_id = '550e8400-e29b-41d4-a716-446655440100' 
WHERE id IN ('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002');

-- Создаем тестовые уведомления
INSERT INTO notifications (recipient_user_id, send_to_telegram, send_to_email, message_text, notification_type, company_id) VALUES
('550e8400-e29b-41d4-a716-446655440001', true, true, 'Добро пожаловать в систему управления задачами!', 'welcome', '550e8400-e29b-41d4-a716-446655440100'),
('550e8400-e29b-41d4-a716-446655440002', true, false, 'Вам назначена новая задача: Провести приемку нового оборудования', 'task_assigned', '550e8400-e29b-41d4-a716-446655440100');

-- Комментарии для документации
COMMENT ON TABLE companies IS 'Таблица компаний с информацией о директоре и тарифном плане';
COMMENT ON TABLE notifications IS 'Таблица уведомлений для пользователей системы';

COMMENT ON COLUMN companies.director_telegram_user_id IS 'Telegram User ID директора компании';
COMMENT ON COLUMN companies.director_telegram_username IS 'Telegram username директора компании';
COMMENT ON COLUMN companies.director_app_user_id IS 'ID пользователя в приложении (директор)';
COMMENT ON COLUMN companies.plan IS 'Тарифный план: free или pro';
COMMENT ON COLUMN companies.employee_user_ids IS 'Массив ID сотрудников компании';
COMMENT ON COLUMN companies.connected_at IS 'Дата подключения компании к приложению';

COMMENT ON COLUMN notifications.recipient_user_id IS 'ID получателя уведомления в приложении';
COMMENT ON COLUMN notifications.send_to_telegram IS 'Флаг отправки в Telegram';
COMMENT ON COLUMN notifications.send_to_email IS 'Флаг отправки на email';
COMMENT ON COLUMN notifications.message_text IS 'Текст уведомления';
COMMENT ON COLUMN notifications.created_at IS 'Дата создания уведомления';
COMMENT ON COLUMN notifications.sent_at IS 'Дата отправки уведомления';
COMMENT ON COLUMN notifications.notification_type IS 'Тип уведомления (task_assigned, reminder, etc.)';
COMMENT ON COLUMN notifications.company_id IS 'ID компании для группировки уведомлений';