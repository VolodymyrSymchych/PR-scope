import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { storage } from '../../../../server/storage';
import { cached, invalidateUserCache } from '@/lib/redis';
import { withRateLimit } from '@/lib/rate-limit';
import { createProjectSchema, validateRequestBody, formatZodError } from '@/lib/validations';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Cache projects list for 5 minutes
    const userProjects = await cached(
      `projects:user:${session.userId}`,
      async () => await storage.getUserProjects(session.userId),
      { ttl: 300 }
    );

    return NextResponse.json({
      projects: userProjects,
      total: userProjects.length
    });
  } catch (error: any) {
    console.error('Get projects error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get projects' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 10 projects per 10 minutes per user
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rateLimitResult = await withRateLimit(request, {
      limit: 10,
      window: 600, // 10 minutes
      identifier: () => `create-project:${session.userId}`,
    });

    if (!rateLimitResult.success) {
      return rateLimitResult.response!;
    }

    const data = await request.json();

    // Validate request body
    const validation = validateRequestBody(createProjectSchema, data);
    if (validation.success === false) {
      return NextResponse.json(formatZodError(validation.error), { status: 400 });
    }

    const { name, type, industry, teamSize, timeline, budget, startDate, endDate, document, analysisData, score, riskLevel, status } = validation.data;

    const project = await storage.createProject({
      userId: session.userId,
      name,
      type: type || null,
      industry: industry || null,
      teamSize: teamSize || null,
      timeline: timeline || null,
      budget: budget || null,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      score: score || 0,
      riskLevel: riskLevel || null,
      status: status || 'in_progress',
      document: document || null,
      analysisData: analysisData ? JSON.stringify(analysisData) : null,
    });

    // Invalidate user caches after creating project
    await invalidateUserCache(session.userId);

    return NextResponse.json({ project }, { status: 201 });
  } catch (error: any) {
    console.error('Create project error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create project' },
      { status: 500 }
    );
  }
}
