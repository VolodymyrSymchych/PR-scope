-- Create file_attachments table
CREATE TABLE IF NOT EXISTS file_attachments (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(100) NOT NULL,
  file_size INTEGER NOT NULL,
  r2_key TEXT NOT NULL,
  uploaded_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  version INTEGER DEFAULT 1 NOT NULL,
  parent_file_id INTEGER REFERENCES file_attachments(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_file_attachments_project_id ON file_attachments(project_id);
CREATE INDEX IF NOT EXISTS idx_file_attachments_task_id ON file_attachments(task_id);
CREATE INDEX IF NOT EXISTS idx_file_attachments_uploaded_by ON file_attachments(uploaded_by);

-- Add public_token to invoices (for public invoice viewing)
ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS public_token VARCHAR(255) UNIQUE,
  ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMP;

-- Create index for public_token
CREATE INDEX IF NOT EXISTS idx_invoices_public_token ON invoices(public_token) WHERE public_token IS NOT NULL;
