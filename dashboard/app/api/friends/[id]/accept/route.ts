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

    const friendship = await storage.acceptFriendRequest(friendshipId);

    if (!friendship) {
      return NextResponse.json(
        { error: 'Friend request not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, friendship });
  } catch (error: any) {
    console.error('Accept friend request error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to accept friend request' },
      { status: 500 }
    );
  }
}
