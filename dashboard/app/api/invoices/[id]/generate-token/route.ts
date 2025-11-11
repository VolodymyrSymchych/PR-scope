import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { storage } from '../../../../../../server/storage';
import { nanoid } from 'nanoid';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = parseInt(params.id);
    const invoice = await storage.getInvoice(id);

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Verify ownership
    const project = await storage.getProject(invoice.projectId);
    if (!project || project.userId !== session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const data = await request.json();
    const expiresInDays = data.expiresInDays || 30; // Default 30 days

    // Generate public token
    const publicToken = nanoid(32);
    const tokenExpiresAt = new Date();
    tokenExpiresAt.setDate(tokenExpiresAt.getDate() + expiresInDays);

    await storage.updateInvoice(id, {
      publicToken,
      tokenExpiresAt,
    });

    // Get base URL from environment variable - required for production
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_API_URL;
    if (!baseUrl) {
      return NextResponse.json(
        { error: 'NEXT_PUBLIC_APP_URL environment variable is required' },
        { status: 500 }
      );
    }
    const publicUrl = `${baseUrl}/invoices/public/${publicToken}`;

    return NextResponse.json({
      publicToken,
      publicUrl,
      expiresAt: tokenExpiresAt.toISOString(),
    });
  } catch (error: any) {
    console.error('Error generating public token:', error);
    return NextResponse.json(
      { error: 'Failed to generate public token' },
      { status: 500 }
    );
  }
}

