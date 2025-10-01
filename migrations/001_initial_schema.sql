-- migrations/001_initial_schema.sql - Обновленная версия без ai_score
-- Database Schema for Task Management System
-- PostgreSQL Migration

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    avatar TEXT,
    role VARCHAR(50) NOT NULL CHECK (role IN ('director', 'department_head', 'employee')),
    position VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    simplified_control BOOLEAN DEFAULT false,
    notification_settings JSONB DEFAULT '{"email": true, "telegram": true, "realTime": true}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Business processes table
CREATE TABLE business_processes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    creator_id UUID REFERENCES users(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tasks table
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    priority INTEGER NOT NULL CHECK (priority BETWEEN 1 AND 5),
    status VARCHAR(50) NOT NULL CHECK (status IN ('new', 'acknowledged', 'in_progress', 'paused', 'waiting_control', 'on_control', 'completed')),
    type VARCHAR(50) NOT NULL CHECK (type IN ('one_time', 'recurring')),
    creator_id UUID REFERENCES users(id) ON DELETE SET NULL,
    responsible_id UUID REFERENCES users(id) ON DELETE SET NULL,
    process_id UUID REFERENCES business_processes(id) ON DELETE SET NULL,
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    tags TEXT[] DEFAULT '{}',
    estimated_hours DECIMAL(5,2),
    actual_hours DECIMAL(5,2),
    result TEXT,
    is_overdue BOOLEAN DEFAULT false,
    is_almost_overdue BOOLEAN DEFAULT false
);

-- Task assignees (many-to-many relationship)
CREATE TABLE task_assignees (
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (task_id, user_id)
);

-- Task observers (many-to-many relationship)
CREATE TABLE task_observers (
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (task_id, user_id)
);

-- Comments table (удален ai_score)
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    author_id UUID REFERENCES users(id) ON DELETE SET NULL,
    text TEXT NOT NULL,
    is_result BOOLEAN DEFAULT false,
    is_edited BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    edited_at TIMESTAMP WITH TIME ZONE
);

-- History entries table
CREATE TABLE history_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    old_value JSONB,
    new_value JSONB,
    additional_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Checklist items table
CREATE TABLE checklist_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    completed BOOLEAN DEFAULT false,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    completed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    parent_id UUID REFERENCES checklist_items(id) ON DELETE CASCADE,
    level INTEGER DEFAULT 0,
    item_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Feedback table
CREATE TABLE feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(20) NOT NULL CHECK (type IN ('gratitude', 'remark')),
    from_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    to_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    message TEXT NOT NULL,
    is_automatic BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_tasks_creator_id ON tasks(creator_id);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_process_id ON tasks(process_id);
CREATE INDEX idx_task_assignees_user_id ON task_assignees(user_id);
CREATE INDEX idx_task_observers_user_id ON task_observers(user_id);
CREATE INDEX idx_comments_task_id ON comments(task_id);
CREATE INDEX idx_history_entries_task_id ON history_entries(task_id);
CREATE INDEX idx_checklist_items_task_id ON checklist_items(task_id);
CREATE INDEX idx_feedback_to_user_id ON feedback(to_user_id);
CREATE INDEX idx_feedback_from_user_id ON feedback(from_user_id);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_business_processes_updated_at BEFORE UPDATE ON business_processes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert test data
INSERT INTO users (id, name, username, avatar, role, position, email, phone, is_active) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Анна Иванова', 'anna_iv', '/2.jpg', 'director', 'Директор', 'anna@company.com', '+7 (999) 123-45-67', true),
('550e8400-e29b-41d4-a716-446655440002', 'Алексей Петров', 'alex_petr', '/7.jpg', 'employee', 'Специалист по закупкам', 'alex.petrov@company.com', '+7 (999) 123-45-68', true);

INSERT INTO business_processes (id, name, description, creator_id, is_active) VALUES
('550e8400-e29b-41d4-a716-446655440010', 'Стратегическое управление', 'Процессы принятия ключевых решений и управления компанией', '550e8400-e29b-41d4-a716-446655440001', true),
('550e8400-e29b-41d4-a716-446655440011', 'Закупки и снабжение', 'Полный цикл закупок: планирование, заказ, контроль поставок', '550e8400-e29b-41d4-a716-446655440001', true);

INSERT INTO tasks (id, title, description, priority, status, type, creator_id, responsible_id, process_id, due_date, tags, estimated_hours) VALUES
('550e8400-e29b-41d4-a716-446655440020', 'Утвердить бюджет на 2025 год', 'Рассмотреть предложения департаментов, внести корректировки, принять окончательное решение по бюджету компании на следующий год.', 1, 'in_progress', 'one_time', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440010', NOW() + INTERVAL '2 hours', ARRAY['бюджет', 'стратегия'], 2.0),
('550e8400-e29b-41d4-a716-446655440021', 'Провести приемку нового оборудования', 'Необходимо провести полную приемку закупленного оборудования для производственной линии.', 2, 'new', 'one_time', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440011', NOW() + INTERVAL '1 day', ARRAY['приемка', 'оборудование'], 3.0);

INSERT INTO task_assignees (task_id, user_id) VALUES
('550e8400-e29b-41d4-a716-446655440020', '550e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440002');

INSERT INTO checklist_items (id, task_id, text, completed, created_by, item_order) VALUES
('550e8400-e29b-41d4-a716-446655440030', '550e8400-e29b-41d4-a716-446655440021', 'Проверить комплектность поставки по накладным', false, '550e8400-e29b-41d4-a716-446655440001', 1),
('550e8400-e29b-41d4-a716-446655440031', '550e8400-e29b-41d4-a716-446655440021', 'Провести визуальный осмотр на наличие повреждений', false, '550e8400-e29b-41d4-a716-446655440001', 2);

INSERT INTO history_entries (id, task_id, action_type, user_id, description) VALUES
('550e8400-e29b-41d4-a716-446655440040', '550e8400-e29b-41d4-a716-446655440020', 'created', '550e8400-e29b-41d4-a716-446655440001', 'Задача создана'),
('550e8400-e29b-41d4-a716-446655440041', '550e8400-e29b-41d4-a716-446655440021', 'created', '550e8400-e29b-41d4-a716-446655440001', 'Задача создана');