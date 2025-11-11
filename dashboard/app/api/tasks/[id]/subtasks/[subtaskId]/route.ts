import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { storage } from '../../../../../../server/storage';
import { redis } from '@/lib/redis';

// PUT /api/tasks/[id]/subtasks/[subtaskId] - Update a subtask
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; subtaskId: string } }
) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const parentId = parseInt(params.id);
    const subtaskId = parseInt(params.subtaskId);

    if (isNaN(parentId) || isNaN(subtaskId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    // Verify subtask exists and belongs to parent
    const subtask = await storage.getTask(subtaskId);
    if (!subtask || subtask.parentId !== parentId) {
      return NextResponse.json({ error: 'Subtask not found' }, { status: 404 });
    }

    // Verify user has access
    const canManage = await storage.userCanManageTask(session.user.id, subtaskId);
    if (!canManage) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      title,
      description,
      assignee,
      start_date,
      due_date,
      end_date,
      status,
      priority,
      progress,
    } = body;

    const updates: any = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (assignee !== undefined) updates.assignee = assignee;
    if (start_date !== undefined) updates.startDate = start_date ? new Date(start_date) : null;
    if (due_date !== undefined) updates.dueDate = due_date ? new Date(due_date) : null;
    if (end_date !== undefined) updates.endDate = end_date ? new Date(end_date) : null;
    if (status !== undefined) updates.status = status;
    if (priority !== undefined) updates.priority = priority;
    if (progress !== undefined) updates.progress = progress;

    const updated = await storage.updateTask(subtaskId, updates);

    // Update parent date range if subtask dates changed
    if (start_date !== undefined || end_date !== undefined) {
      await storage.updateParentDateRange(parentId);
    }

    // Invalidate cache
    await redis.del(`subtasks:${parentId}`);
    await redis.del(`task:${parentId}:with-subtasks`);
    await redis.del(`task:${subtaskId}`);
    if (subtask.projectId) {
      await redis.del(`tasks:user:${session.user.id}:project:${subtask.projectId}`);
    }

    return NextResponse.json({ subtask: updated });
  } catch (error) {
    console.error('Error updating subtask:', error);
    return NextResponse.json({ error: 'Failed to update subtask' }, { status: 500 });
  }
}

// DELETE /api/tasks/[id]/subtasks/[subtaskId] - Delete a subtask
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; subtaskId: string } }
) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const parentId = parseInt(params.id);
    const subtaskId = parseInt(params.subtaskId);

    if (isNaN(parentId) || isNaN(subtaskId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    // Verify subtask exists and belongs to parent
    const subtask = await storage.getTask(subtaskId);
    if (!subtask || subtask.parentId !== parentId) {
      return NextResponse.json({ error: 'Subtask not found' }, { status: 404 });
    }

    // Verify user has access
    const canManage = await storage.userCanManageTask(session.user.id, subtaskId);
    if (!canManage) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await storage.deleteTask(subtaskId);

    // Update parent date range after deletion
    await storage.updateParentDateRange(parentId);

    // Invalidate cache
    await redis.del(`subtasks:${parentId}`);
    await redis.del(`task:${parentId}:with-subtasks`);
    await redis.del(`task:${subtaskId}`);
    if (subtask.projectId) {
      await redis.del(`tasks:user:${session.user.id}:project:${subtask.projectId}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting subtask:', error);
    return NextResponse.json({ error: 'Failed to delete subtask' }, { status: 500 });
  }
}
