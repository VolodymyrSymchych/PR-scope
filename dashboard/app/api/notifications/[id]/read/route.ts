import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { storage } from '../../../../../../server/storage';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth();
    const notificationId = parseInt(params.id);

    if (isNaN(notificationId)) {
      return NextResponse.json(
        { error: 'Invalid notification ID' },
        { status: 400 }
      );
    }

    await storage.markNotificationAsRead(notificationId, session.userId);

    return NextResponse.json({
      success: true,
      message: 'Notification marked as read',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to mark notification as read' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}

