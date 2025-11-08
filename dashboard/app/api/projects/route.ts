import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { storage } from '../../../../server/storage';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userProjects = await storage.getUserProjects(session.userId);
    
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

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { name, type, industry, teamSize, timeline, budget, startDate, endDate, document, analysisData, score, riskLevel, status } = data;

    if (!name) {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
    }

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

    return NextResponse.json({ project }, { status: 201 });
  } catch (error: any) {
    console.error('Create project error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create project' },
      { status: 500 }
    );
  }
}
