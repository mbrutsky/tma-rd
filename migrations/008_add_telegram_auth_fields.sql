-- Добавляем поле telegram_user_id в таблицу users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS telegram_user_id BIGINT UNIQUE;

-- Создаем индекс для быстрого поиска по telegram_user_id
CREATE INDEX IF NOT EXISTS idx_users_telegram_user_id 
ON users(telegram_user_id);

-- Добавляем поле для хранения refresh token
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS refresh_token TEXT,
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

-- Создаем таблицу для сессий (опционально, для более надежной системы)
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    telegram_session_string TEXT,
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индексы для таблицы сессий
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token_hash ON user_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);

-- Таблица для логирования попыток входа (для безопасности)
CREATE TABLE IF NOT EXISTS auth_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    telegram_user_id BIGINT,
    telegram_username VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN NOT NULL,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индекс для логов авторизации
CREATE INDEX IF NOT EXISTS idx_auth_attempts_telegram_user_id 
ON auth_attempts(telegram_user_id);
CREATE INDEX IF NOT EXISTS idx_auth_attempts_created_at 
ON auth_attempts(created_at);