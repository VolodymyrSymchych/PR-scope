import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { storage } from '../../../../../../server/storage';

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
    const friendshipId = parseInt(id);

    await storage.rejectFriendRequest(friendshipId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Reject friend request error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to reject friend request' },
      { status: 500 }
    );
  }
}
