import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { storage } from '../../../../../server/storage';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ users: [] });
    }

    // Search by email or username
    const searchTerm = query.trim().toLowerCase();
    
    // Try to find by email first
    let user = await storage.getUserByEmail(searchTerm);
    
    // If not found by email, try by username
    if (!user) {
      user = await storage.getUserByUsername(searchTerm);
    }

    // If still not found, search for partial matches
    // For now, return exact match only
    const users = [];
    if (user && user.id !== session.userId) {
      users.push({
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
      });
    }

    return NextResponse.json({ users });
  } catch (error: any) {
    console.error('Search users error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to search users' },
      { status: 500 }
    );
  }
}

