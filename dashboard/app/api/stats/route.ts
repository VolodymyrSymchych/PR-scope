import { NextResponse } from 'next/server';
import { storage } from '../../../../server/storage';
import { getSession } from '@/lib/auth';
import { cached } from '@/lib/redis';
import { db } from '../../../../server/db';
import { projects } from '../../../../shared/schema';
import { eq, sql, and, isNull, gte, lt } from 'drizzle-orm';
import { neon } from '@neondatabase/serverless';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use cached stats with 5 minute TTL
    const stats = await cached(
      `stats:user:${session.userId}`,
      async () => {
        // Calculate date ranges
        const now = new Date();
        const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

        // OPTIMIZED: Use SQL aggregation instead of loading all projects
        // Single query with conditional aggregation
        // Use raw SQL to avoid drizzle-orm version mismatch issues
        const sqlClient = neon(process.env.DATABASE_URL!);
        const result = await sqlClient`
          SELECT 
            count(*)::int as total,
            count(*) filter (where status = 'in_progress')::int as "inProgress",
            count(*) filter (where status = 'completed')::int as completed,
            count(*) filter (where created_at >= ${currentMonthStart})::int as "currentMonth",
            count(*) filter (where created_at >= ${currentMonthStart} and status = 'in_progress')::int as "currentMonthInProgress",
            count(*) filter (where created_at >= ${lastMonthStart} and created_at < ${currentMonthStart})::int as "lastMonth",
            count(*) filter (where created_at >= ${lastMonthStart} and created_at < ${currentMonthStart} and status = 'in_progress')::int as "lastMonthInProgress"
          FROM projects
          WHERE user_id = ${session.userId} AND deleted_at IS NULL
        ` as any;

        const data = result[0] || {
          total: 0,
          inProgress: 0,
          completed: 0,
          currentMonth: 0,
          currentMonthInProgress: 0,
          lastMonth: 0,
          lastMonthInProgress: 0,
        };

        // Calculate completion rate
        const completion_rate = data.total > 0
          ? Math.round((data.completed / data.total) * 100)
          : 0;

        // Calculate trends (percentage change from last month)
        const calculateTrend = (current: number, last: number): number => {
          if (last === 0) return current > 0 ? 100 : 0;
          return Math.round(((current - last) / last) * 100);
        };

        const projectsInProgressTrend = calculateTrend(
          data.currentMonthInProgress,
          data.lastMonthInProgress
        );

        const totalProjectsTrend = calculateTrend(
          data.currentMonth,
          data.lastMonth
        );

        return {
          projects_in_progress: data.inProgress,
          total_projects: data.total,
          completion_rate: completion_rate,
          projects_completed: data.completed,
          trends: {
            projects_in_progress: {
              value: Math.abs(projectsInProgressTrend),
              isPositive: projectsInProgressTrend >= 0,
            },
            total_projects: {
              value: Math.abs(totalProjectsTrend),
              isPositive: totalProjectsTrend >= 0,
            },
          },
        };
      },
      { ttl: 300 } // Cache for 5 minutes
    );

    return NextResponse.json(stats);
  } catch (error: any) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
