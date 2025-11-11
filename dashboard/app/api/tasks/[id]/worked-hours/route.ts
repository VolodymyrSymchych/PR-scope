import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { storage } from '@/server/storage';
import { redis } from '@/lib/redis';

export const dynamic = 'force-dynamic';

/**
 * GET /api/tasks/[id]/worked-hours
 * Get total worked hours for a task from time entries
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const taskId = parseInt(params.id);
    if (isNaN(taskId)) {
      return NextResponse.json({ error: 'Invalid task ID' }, { status: 400 });
    }

    // Verify user has access to the task
    const task = await storage.getTask(taskId);
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Try cache first (1 minute TTL for recent data)
    const cacheKey = `task:${taskId}:worked-hours`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return NextResponse.json(JSON.parse(cached));
    }

    // Get time entries for this task
    const timeEntries = await storage.getTimeEntries(undefined, taskId);

    // Calculate total worked hours
    let totalMinutes = 0;
    const entries = timeEntries.map((entry) => {
      let minutes = 0;

      if (entry.duration) {
        // Use stored duration if available
        minutes = entry.duration;
      } else if (entry.clockIn && entry.clockOut) {
        // Calculate from clock in/out times
        const clockIn = new Date(entry.clockIn);
        const clockOut = new Date(entry.clockOut);
        minutes = Math.round((clockOut.getTime() - clockIn.getTime()) / (1000 * 60));
      } else if (entry.clockIn && !entry.clockOut) {
        // Currently clocked in - calculate up to now
        const clockIn = new Date(entry.clockIn);
        const now = new Date();
        minutes = Math.round((now.getTime() - clockIn.getTime()) / (1000 * 60));
      }

      totalMinutes += minutes;

      return {
        id: entry.id,
        userId: entry.userId,
        clockIn: entry.clockIn,
        clockOut: entry.clockOut,
        duration: minutes,
        notes: entry.notes,
      };
    });

    const totalHours = Math.round((totalMinutes / 60) * 10) / 10; // Round to 1 decimal place

    const result = {
      taskId,
      totalHours,
      totalMinutes,
      entryCount: entries.length,
      entries,
    };

    // Cache for 1 minute
    await redis.set(cacheKey, JSON.stringify(result), { ex: 60 });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error fetching worked hours:', error);
    return NextResponse.json(
      { error: 'Failed to fetch worked hours' },
      { status: 500 }
    );
  }
}
