-- Add abs_order column to tasks table for kanban board sorting
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS abs_order INTEGER NOT NULL DEFAULT 0;

-- Create index for faster sorting
CREATE INDEX IF NOT EXISTS idx_tasks_abs_order ON tasks(abs_order);

-- Update existing tasks to have sequential order based on creation time
UPDATE tasks 
SET abs_order = subquery.row_number
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at, id) as row_number
  FROM tasks
) AS subquery
WHERE tasks.id = subquery.id;

