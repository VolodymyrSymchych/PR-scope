import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { storage } from '../../../../../server/storage';
import { invalidateUserCache } from '@/lib/redis';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = parseInt(params.id);
    if (isNaN(id) || id <= 0) {
      return NextResponse.json({ error: 'Invalid task ID' }, { status: 400 });
    }

    const task = await storage.getTask(id);

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Verify ownership
    if (task.userId !== session.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ task });
  } catch (error: any) {
    console.error('Error fetching task:', error);
    return NextResponse.json({ error: 'Failed to fetch task' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = parseInt(params.id);
    if (isNaN(id) || id <= 0) {
      return NextResponse.json({ error: 'Invalid task ID' }, { status: 400 });
    }

    const data = await request.json();

    // Get original task to calculate date delta
    const originalTask = await storage.getTask(id);
    if (!originalTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Verify ownership
    if (originalTask.userId !== session.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // If changing projectId, verify ownership of new project
    if (data.project_id !== undefined && data.project_id !== originalTask.projectId) {
      if (data.project_id) {
        const newProject = await storage.getProject(parseInt(data.project_id));
        if (!newProject || newProject.userId !== session.userId) {
          return NextResponse.json({ error: 'Forbidden - Cannot assign task to another user\'s project' }, { status: 403 });
        }
      }
    }

    const updateData: any = {};
    if (data.status) updateData.status = data.status;
    if (data.title) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.priority) updateData.priority = data.priority;
    if (data.assignee !== undefined) updateData.assignee = data.assignee;
    if (data.start_date !== undefined) updateData.startDate = data.start_date ? new Date(data.start_date) : null;
    if (data.due_date !== undefined) updateData.dueDate = data.due_date ? new Date(data.due_date) : null;
    if (data.end_date !== undefined) updateData.endDate = data.end_date ? new Date(data.end_date) : null;
    if (data.project_id !== undefined) updateData.projectId = data.project_id;
    if (data.depends_on !== undefined) {
      updateData.dependsOn = data.depends_on ? JSON.stringify(data.depends_on) : null;
    }
    if (data.progress !== undefined) updateData.progress = data.progress;

    // Calculate days delta if start_date changed and shift_subtasks flag is set
    let daysDelta = 0;
    if (data.shift_subtasks && data.start_date && originalTask.startDate) {
      const newStart = new Date(data.start_date);
      const oldStart = new Date(originalTask.startDate);
      daysDelta = Math.round((newStart.getTime() - oldStart.getTime()) / (1000 * 60 * 60 * 24));
    }

    const task = await storage.updateTask(id, updateData);

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Shift subtasks if requested and dates changed
    if (data.shift_subtasks && daysDelta !== 0) {
      await storage.shiftSubtasks(id, daysDelta);
    }

    // If this is a subtask, update parent date range
    if (task.parentId && (data.start_date !== undefined || data.end_date !== undefined)) {
      await storage.updateParentDateRange(task.parentId);
    }

    // Invalidate user caches after updating task
    await invalidateUserCache(session.userId);

    return NextResponse.json({ task });
  } catch (error: any) {
    console.error('Error updating task:', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = parseInt(params.id);
    if (isNaN(id) || id <= 0) {
      return NextResponse.json({ error: 'Invalid task ID' }, { status: 400 });
    }

    // Verify ownership before deleting
    const task = await storage.getTask(id);
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    if (task.userId !== session.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await storage.deleteTask(id);

    // Invalidate user caches after deleting task
    await invalidateUserCache(session.userId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting task:', error);
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}
