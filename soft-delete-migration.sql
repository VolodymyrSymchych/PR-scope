-- Migration script to add soft delete support (deletedAt columns)
-- This adds deletedAt columns to projects, tasks, invoices, and file_attachments tables

-- Add deleted_at column to projects table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'projects' AND column_name = 'deleted_at'
    ) THEN
        ALTER TABLE projects ADD COLUMN deleted_at TIMESTAMP;
        RAISE NOTICE 'Added deleted_at column to projects table';
    ELSE
        RAISE NOTICE 'deleted_at column already exists in projects table';
    END IF;
END $$;

-- Add deleted_at column to tasks table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'tasks' AND column_name = 'deleted_at'
    ) THEN
        ALTER TABLE tasks ADD COLUMN deleted_at TIMESTAMP;
        RAISE NOTICE 'Added deleted_at column to tasks table';
    ELSE
        RAISE NOTICE 'deleted_at column already exists in tasks table';
    END IF;
END $$;

-- Add deleted_at column to invoices table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'invoices' AND column_name = 'deleted_at'
    ) THEN
        ALTER TABLE invoices ADD COLUMN deleted_at TIMESTAMP;
        RAISE NOTICE 'Added deleted_at column to invoices table';
    ELSE
        RAISE NOTICE 'deleted_at column already exists in invoices table';
    END IF;
END $$;

-- Add deleted_at column to file_attachments table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'file_attachments' AND column_name = 'deleted_at'
    ) THEN
        ALTER TABLE file_attachments ADD COLUMN deleted_at TIMESTAMP;
        RAISE NOTICE 'Added deleted_at column to file_attachments table';
    ELSE
        RAISE NOTICE 'deleted_at column already exists in file_attachments table';
    END IF;
END $$;

-- Create indexes for better query performance on deletedAt columns
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE indexname = 'idx_projects_deleted_at'
    ) THEN
        CREATE INDEX idx_projects_deleted_at ON projects(deleted_at);
        RAISE NOTICE 'Created index idx_projects_deleted_at';
    ELSE
        RAISE NOTICE 'Index idx_projects_deleted_at already exists';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE indexname = 'idx_tasks_deleted_at'
    ) THEN
        CREATE INDEX idx_tasks_deleted_at ON tasks(deleted_at);
        RAISE NOTICE 'Created index idx_tasks_deleted_at';
    ELSE
        RAISE NOTICE 'Index idx_tasks_deleted_at already exists';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE indexname = 'idx_invoices_deleted_at'
    ) THEN
        CREATE INDEX idx_invoices_deleted_at ON invoices(deleted_at);
        RAISE NOTICE 'Created index idx_invoices_deleted_at';
    ELSE
        RAISE NOTICE 'Index idx_invoices_deleted_at already exists';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE indexname = 'idx_file_attachments_deleted_at'
    ) THEN
        CREATE INDEX idx_file_attachments_deleted_at ON file_attachments(deleted_at);
        RAISE NOTICE 'Created index idx_file_attachments_deleted_at';
    ELSE
        RAISE NOTICE 'Index idx_file_attachments_deleted_at already exists';
    END IF;
END $$;
