import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

interface DashboardLayout {
  selectedWidgets: string[];
  widgetSizes: Record<string, number>;
  gridColumns: 12 | 16 | 24;
  updatedAt: string;
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json() as DashboardLayout;

    // Validate the data
    if (!Array.isArray(body.selectedWidgets)) {
      return NextResponse.json(
        { error: 'Invalid selectedWidgets format' },
        { status: 400 }
      );
    }

    if (typeof body.widgetSizes !== 'object') {
      return NextResponse.json(
        { error: 'Invalid widgetSizes format' },
        { status: 400 }
      );
    }

    if (![12, 16, 24].includes(body.gridColumns)) {
      return NextResponse.json(
        { error: 'Invalid gridColumns value' },
        { status: 400 }
      );
    }

    // TODO: Save to database when user preferences table is implemented
    // For now, rely on localStorage on client side
    // await storage.saveDashboardLayout(session.userId, body);

    return NextResponse.json({
      success: true,
      message: 'Dashboard layout saved successfully',
    });
  } catch (error: any) {
    console.error('Error saving dashboard layout:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save dashboard layout' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Load from database when user preferences table is implemented
    // For now, return null so client uses localStorage
    // const layout = await storage.getDashboardLayout(session.userId);

    return NextResponse.json({
      layout: null,
    });
  } catch (error: any) {
    console.error('Error loading dashboard layout:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to load dashboard layout' },
      { status: 500 }
    );
  }
}
