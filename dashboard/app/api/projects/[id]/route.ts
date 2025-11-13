import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { storage } from '@/server/storage';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

  const projectId = parseInt(params.id);
    if (isNaN(projectId)) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
    }

    // Get project from database
    const project = await storage.getProject(projectId);
  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }

    // Verify user has access to this project
    const hasAccess = await storage.userHasProjectAccess(session.userId, projectId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse analysis data if it exists
    let analysis = {
    results: {},
    report: 'Analysis not available',
    metadata: {}
  };

    if (project.analysisData) {
      try {
        const parsed = JSON.parse(project.analysisData);
        analysis = {
          results: parsed.results || {},
          report: parsed.report || project.document || 'Analysis not available',
          metadata: parsed.metadata || {}
        };
      } catch (e) {
        // If parsing fails, use document as report
        analysis.report = project.document || 'Analysis not available';
      }
    } else if (project.document) {
      analysis.report = project.document;
    }

    // Format project data to match expected interface
    const projectData = {
      id: project.id,
      name: project.name,
      type: project.type || '',
      industry: project.industry || '',
      team_size: project.teamSize || '',
      timeline: project.timeline || '',
      score: project.score || 0,
      risk_level: project.riskLevel || 'LOW',
      created_at: project.createdAt?.toISOString() || new Date().toISOString(),
      status: project.status || 'in_progress',
      budget: project.budget,
      start_date: project.startDate?.toISOString(),
      end_date: project.endDate?.toISOString(),
    };

  return NextResponse.json({
      project: projectData,
    analysis
  });
  } catch (error: any) {
    console.error('Error fetching project:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch project' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();

    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const projectId = parseInt(params.id);

    // Verify project exists
    const project = await storage.getProject(projectId);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Soft delete the project
    await storage.deleteProject(projectId);

    return NextResponse.json({ success: true, message: 'Project deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting project:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete project' },
      { status: 500 }
    );
  }
}
