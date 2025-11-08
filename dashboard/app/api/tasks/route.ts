import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { storage } from '../../../../server/storage';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get('project_id');

    const tasks = await storage.getTasks(
      session.userId,
      projectId ? parseInt(projectId) : undefined
    );
    
    return NextResponse.json({ tasks });
  } catch (error: any) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { title, description, project_id, assignee, due_date, status, priority } = data;

    if (!title) {
      return NextResponse.json({ error: 'Task title is required' }, { status: 400 });
    }

    const task = await storage.createTask({
      title,
      description: description || null,
      projectId: project_id || null,
      userId: session.userId,
      assignee: assignee || null,
      dueDate: due_date ? new Date(due_date) : null,
      status: status || 'todo',
      priority: priority || 'medium',
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating task:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}
