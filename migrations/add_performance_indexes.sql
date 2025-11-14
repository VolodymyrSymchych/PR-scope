-- Performance optimization indexes
-- These indexes will significantly improve query performance

-- Tasks indexes (most frequently queried)
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_dates ON tasks(start_date, end_date) WHERE deleted_at IS NULL;

-- Projects indexes
CREATE INDEX IF NOT EXISTS idx_projects_user_status ON projects(user_id, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_projects_team_id ON projects(team_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC) WHERE deleted_at IS NULL;

-- Time entries indexes
CREATE INDEX IF NOT EXISTS idx_time_entries_user_date ON time_entries(user_id, clock_in DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_time_entries_project_id ON time_entries(project_id) WHERE deleted_at IS NULL;

-- Expenses indexes
CREATE INDEX IF NOT EXISTS idx_expenses_project_date ON expenses(project_id, expense_date DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id) WHERE deleted_at IS NULL;

-- Invoices indexes
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status, due_date) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_invoices_project_id ON invoices(project_id) WHERE deleted_at IS NULL;

-- Team members indexes
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id) WHERE deleted_at IS NULL;

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_tasks_project_status_dates ON tasks(project_id, status, start_date, end_date) WHERE deleted_at IS NULL;
