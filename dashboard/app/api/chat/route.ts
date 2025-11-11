import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { storage } from '@/server/storage';

export const dynamic = 'force-dynamic';

/**
 * GET /api/chat - Get chat messages
 * POST /api/chat - Send a chat message
 */
export async function GET(request: NextRequest) {
  try {
    // First, verify user is authenticated
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userIdParam = searchParams.get('userId');
    
    // If userId is provided in query, validate it matches session user
    if (userIdParam) {
      const requestedUserId = parseInt(userIdParam);
      if (isNaN(requestedUserId) || requestedUserId !== session.userId) {
        return NextResponse.json(
          { error: 'Unauthorized - cannot access other user\'s data' },
          { status: 403 }
        );
      }
    }

    // Use session userId (not from query params to prevent impersonation)
    const userId = session.userId;

    // TODO: Implement chat message retrieval
    // const messages = await storage.getChatMessages(userId);
    
    return NextResponse.json({ messages: [] });
  } catch (error: any) {
    console.error('Error fetching chat messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chat messages' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // First, verify user is authenticated
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { userId, message, recipientId } = body;

    // CRITICAL: Validate that userId from request body matches authenticated user
    // This prevents user impersonation attacks
    if (userId !== undefined && userId !== session.userId) {
      return NextResponse.json(
        { error: 'Unauthorized - cannot send messages as another user' },
        { status: 403 }
      );
    }

    // Use session userId (not from request body to prevent impersonation)
    const authenticatedUserId = session.userId;

    // Validate required fields
    if (!message || typeof message !== 'string' || message.trim() === '') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    if (!recipientId || typeof recipientId !== 'number') {
      return NextResponse.json(
        { error: 'Recipient ID is required' },
        { status: 400 }
      );
    }

    // TODO: Implement chat message creation
    // const chatMessage = await storage.createChatMessage({
    //   userId: authenticatedUserId,
    //   recipientId,
    //   message: message.trim(),
    // });

    return NextResponse.json(
      { success: true, message: 'Message sent successfully' },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error sending chat message:', error);
    return NextResponse.json(
      { error: 'Failed to send chat message' },
      { status: 500 }
    );
  }
}

