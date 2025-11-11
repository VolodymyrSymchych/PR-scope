import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { storage } from '@/server/storage';
import { redis } from '@/lib/redis';
import { rateLimit } from '@/lib/rate-limit';

// GET /api/tasks/[id]/subtasks - Get all subtasks for a task
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const taskId = parseInt(params.id);
    if (isNaN(taskId)) {
      return NextResponse.json({ error: 'Invalid task ID' }, { status: 400 });
    }

    // Verify user has access to the task
    const canManage = await storage.userCanManageTask(session.user.id, taskId);
    if (!canManage) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Try to get from cache first
    const cacheKey = `subtasks:${taskId}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return NextResponse.json({ subtasks: JSON.parse(cached) });
    }

    const subtasks = await storage.getSubtasks(taskId);

    // Cache for 3 minutes
    await redis.set(cacheKey, JSON.stringify(subtasks), { ex: 180 });

    return NextResponse.json({ subtasks });
  } catch (error) {
    console.error('Error getting subtasks:', error);
    return NextResponse.json({ error: 'Failed to get subtasks' }, { status: 500 });
  }
}

// POST /api/tasks/[id]/subtasks - Create a new subtask
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limit: 20 subtasks per 10 minutes
    const rateLimitResult = await rateLimit(
      `create-subtask:${session.user.id}`,
      20,
      600000
    );
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    const taskId = parseInt(params.id);
    if (isNaN(taskId)) {
      return NextResponse.json({ error: 'Invalid task ID' }, { status: 400 });
    }

    // Verify parent task exists
    const parentTask = await storage.getTask(taskId);
    if (!parentTask) {
      return NextResponse.json({ error: 'Parent task not found' }, { status: 404 });
    }

    // Check if user is assignee of parent task
    const isAssignee = await storage.userIsTaskAssignee(session.user.id, taskId);
    if (!isAssignee) {
      return NextResponse.json(
        { error: 'Only task assignee can create subtasks' },
        { status: 403 }
      );
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
    } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const subtaskData = {
      projectId: parentTask.projectId,
      userId: session.user.id,
      title,
      description: description || null,
      assignee: assignee || null,
      startDate: start_date ? new Date(start_date) : null,
      dueDate: due_date ? new Date(due_date) : null,
      endDate: end_date ? new Date(end_date) : null,
      status: status || 'todo',
      priority: priority || 'medium',
    };

    const subtask = await storage.createSubtask(taskId, subtaskData);

    // Invalidate cache
    await redis.del(`subtasks:${taskId}`);
    await redis.del(`task:${taskId}:with-subtasks`);
    if (parentTask.projectId) {
      await redis.del(`tasks:user:${session.user.id}:project:${parentTask.projectId}`);
    }

    return NextResponse.json({ subtask }, { status: 201 });
  } catch (error) {
    console.error('Error creating subtask:', error);
    return NextResponse.json({ error: 'Failed to create subtask' }, { status: 500 });
  }
}
