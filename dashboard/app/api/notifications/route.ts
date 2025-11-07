import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { storage } from '../../../../server/storage';

export async function GET(request: Request) {
  try {
    const session = await requireAuth();
    const notifications = await storage.getNotifications(session.userId);

    return NextResponse.json({ notifications });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch notifications' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}

