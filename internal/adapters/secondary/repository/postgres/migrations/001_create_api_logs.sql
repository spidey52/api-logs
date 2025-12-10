-- Migration: Create all tables for API Logs system in TimescaleDB
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    name TEXT NOT NULL,
    description TEXT,
    api_key TEXT NOT NULL UNIQUE,
    environment TEXT NOT NULL CHECK (
        environment IN ('dev', 'production')
    ),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    name TEXT NOT NULL,
    identifier TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    project_id UUID NOT NULL REFERENCES projects (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS api_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    project_id UUID NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
    environment TEXT NOT NULL,
    METHOD TEXT NOT NULL,
    PATH TEXT NOT NULL,
    params JSONB,
    query_params JSONB,
    status_code INTEGER NOT NULL,
    response_time BIGINT NOT NULL,
    content_length BIGINT NOT NULL,
    ip_address TEXT NOT NULL,
    user_agent TEXT NOT NULL,
    error_message TEXT,
    user_id UUID REFERENCES users (id),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Convert to hypertable
SELECT create_hypertable (
        'api_logs', 'timestamp', if_not_exists => TRUE
    );

CREATE TABLE IF NOT EXISTS apilog_headers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    log_id UUID NOT NULL REFERENCES api_logs (id) ON DELETE CASCADE,
    request_headers JSONB,
    response_headers JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS apilog_bodies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    log_id UUID NOT NULL REFERENCES api_logs (id) ON DELETE CASCADE,
    request_body JSONB,
    response_body JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_projects_api_key ON projects (api_key);

CREATE INDEX IF NOT EXISTS idx_projects_environment ON projects (environment);

CREATE INDEX IF NOT EXISTS idx_users_project_id ON users (project_id);

CREATE INDEX IF NOT EXISTS idx_users_identifier ON users (identifier);

CREATE INDEX IF NOT EXISTS idx_api_logs_project_id ON api_logs (project_id);

CREATE INDEX IF NOT EXISTS idx_api_logs_user_id ON api_logs (user_id);

CREATE INDEX IF NOT EXISTS idx_api_logs_environment ON api_logs (environment);

CREATE INDEX IF NOT EXISTS idx_api_logs_path ON api_logs (PATH);

CREATE INDEX IF NOT EXISTS idx_api_logs_timestamp ON api_logs (timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_api_logs_params_gin ON api_logs USING GIN (params);

CREATE INDEX IF NOT EXISTS idx_api_logs_query_params_gin ON api_logs USING GIN (query_params);

CREATE INDEX IF NOT EXISTS idx_apilog_headers_log_id ON apilog_headers (log_id);

CREATE INDEX IF NOT EXISTS idx_apilog_bodies_log_id ON apilog_bodies (log_id);