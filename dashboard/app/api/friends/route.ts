import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { storage } from '../../../../server/storage';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const friendships = await storage.getFriends(session.userId);
    const pendingRequests = await storage.getPendingFriendRequests(session.userId);

    // Get user details for each friend
    const friendsWithDetails = await Promise.all(
      friendships.map(async (friendship) => {
        const friendId = friendship.senderId === session.userId 
          ? friendship.receiverId 
          : friendship.senderId;
        const friendUser = await storage.getUser(friendId);
        return {
          ...friendship,
          friend: friendUser ? {
            id: friendUser.id,
            username: friendUser.username,
            fullName: friendUser.fullName,
            email: friendUser.email,
          } : null,
        };
      })
    );

    return NextResponse.json({ friends: friendsWithDetails, pendingRequests });
  } catch (error: any) {
    console.error('Get friends error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get friends' },
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

    const { receiverEmail } = await request.json();

    if (!receiverEmail) {
      return NextResponse.json(
        { error: 'Receiver email is required' },
        { status: 400 }
      );
    }

    const receiver = await storage.getUserByEmail(receiverEmail);
    if (!receiver) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (receiver.id === session.userId) {
      return NextResponse.json(
        { error: 'Cannot send friend request to yourself' },
        { status: 400 }
      );
    }

    const friendship = await storage.sendFriendRequest(session.userId, receiver.id);

    return NextResponse.json({ success: true, friendship });
  } catch (error: any) {
    console.error('Send friend request error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send friend request' },
      { status: 500 }
    );
  }
}
