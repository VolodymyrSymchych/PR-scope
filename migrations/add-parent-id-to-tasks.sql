-- Add parentId column to tasks table for subtask support
ALTER TABLE tasks ADD COLUMN parent_id INTEGER;

-- Add foreign key constraint to tasks table (self-reference)
ALTER TABLE tasks ADD CONSTRAINT tasks_parent_id_fkey
  FOREIGN KEY (parent_id) REFERENCES tasks(id) ON DELETE CASCADE;

-- Add index on parent_id for faster queries
CREATE INDEX idx_tasks_parent_id ON tasks(parent_id);

-- Add comment for documentation
COMMENT ON COLUMN tasks.parent_id IS 'Reference to parent task for subtasks (one level hierarchy only)';
