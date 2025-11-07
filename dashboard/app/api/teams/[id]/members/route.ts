import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { storage } from '../../../../../../server/storage';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const teamId = parseInt(id);

    const members = await storage.getTeamMembers(teamId);
    return NextResponse.json({ members });
  } catch (error: any) {
    console.error('Get team members error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get team members' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const teamId = parseInt(id);
    const { userEmail, role } = await request.json();

    if (!userEmail) {
      return NextResponse.json(
        { error: 'User email is required' },
        { status: 400 }
      );
    }

    const userToAdd = await storage.getUserByEmail(userEmail);
    if (!userToAdd) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const member = await storage.addTeamMember({
      teamId,
      userId: userToAdd.id,
      role: role || 'member',
    });

    return NextResponse.json({ success: true, member });
  } catch (error: any) {
    console.error('Add team member error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to add team member' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const teamId = parseInt(id);
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    await storage.removeTeamMember(teamId, userId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Remove team member error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to remove team member' },
      { status: 500 }
    );
  }
}
