import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { storage } from '../../../../server/storage';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const teams = await storage.getUserTeams(session.userId);
    return NextResponse.json({ teams });
  } catch (error: any) {
    console.error('Get teams error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get teams' },
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

    const { name, description } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: 'Team name is required' },
        { status: 400 }
      );
    }

    const team = await storage.createTeam({
      name,
      description: description || null,
      ownerId: session.userId,
    });

    await storage.addTeamMember({
      teamId: team.id,
      userId: session.userId,
      role: 'owner',
    });

    return NextResponse.json({ success: true, team });
  } catch (error: any) {
    console.error('Create team error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create team' },
      { status: 500 }
    );
  }
}
