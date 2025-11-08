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

    const { searchParams } = new URL(request.url);
    const userIdParam = searchParams.get('user_id');
    const taskIdParam = searchParams.get('task_id');
    
    // If user_id is provided, use it (for team view)
    // Otherwise use session user id
    const targetUserId = userIdParam ? parseInt(userIdParam) : session.userId;
    
    // Allow viewing other users' data if they're in the same team
    // For now, allow viewing any user's data (can be restricted later with team checks)
    
    const taskId = taskIdParam ? parseInt(taskIdParam) : undefined;
    const timeEntries = await storage.getTimeEntries(targetUserId, taskId);
    
    return NextResponse.json({ entries: timeEntries });
  } catch (error: any) {
    console.error('Error fetching time entries:', error);
    return NextResponse.json({ error: 'Failed to fetch time entries' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { task_id, project_id, clock_in, clock_out, notes } = data;

    if (!clock_in) {
      return NextResponse.json({ error: 'Clock in time is required' }, { status: 400 });
    }

    // Calculate duration if clock_out is provided
    let duration = null;
    if (clock_out) {
      const start = new Date(clock_in);
      const end = new Date(clock_out);
      duration = Math.round((end.getTime() - start.getTime()) / (1000 * 60)); // minutes
    }

    const timeEntry = await storage.createTimeEntry({
      userId: session.userId,
      taskId: task_id || null,
      projectId: project_id || null,
      clockIn: new Date(clock_in),
      clockOut: clock_out ? new Date(clock_out) : null,
      duration,
      notes: notes || null,
    });

    return NextResponse.json({ timeEntry }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating time entry:', error);
    return NextResponse.json({ error: 'Failed to create time entry' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { clock_out } = data;

    // Get active time entry
    const activeEntry = await storage.getActiveTimeEntry(session.userId);
    if (!activeEntry) {
      return NextResponse.json({ error: 'No active time entry found' }, { status: 404 });
    }

    // Calculate duration
    const start = new Date(activeEntry.clockIn);
    const end = clock_out ? new Date(clock_out) : new Date();
    const duration = Math.round((end.getTime() - start.getTime()) / (1000 * 60)); // minutes

    const updatedEntry = await storage.updateTimeEntry(activeEntry.id, {
      clockOut: end,
      duration,
    });

    return NextResponse.json({ timeEntry: updatedEntry });
  } catch (error: any) {
    console.error('Error updating time entry:', error);
    return NextResponse.json({ error: 'Failed to update time entry' }, { status: 500 });
  }
}

