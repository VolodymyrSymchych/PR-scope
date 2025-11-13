import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { storage } from '../../../../../server/storage';
import { sendOverdueReminder, sendDueDateReminder } from '@/lib/email/send-invoice';

export const dynamic = 'force-dynamic';

// This endpoint should be called by a cron job (e.g., Vercel Cron, GitHub Actions, etc.)
// Example: Call GET /api/cron/reminders daily
export async function GET(request: NextRequest) {
  try {
    // Require authentication for cron endpoint
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error('CRON_SECRET is not configured');
      return NextResponse.json(
        { error: 'Cron endpoint is not properly configured' },
        { status: 503 }
      );
    }

    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all invoices
    const invoices = await storage.getInvoices();
    
    const results = {
      overdueRemindersSent: 0,
      dueDateRemindersSent: 0,
      errors: [] as string[],
    };

    for (const invoice of invoices) {
      try {
        // Skip if no client email
        if (!invoice.clientEmail) {
          continue;
        }

        // Check for overdue invoices
        if (invoice.status !== 'paid' && invoice.status !== 'cancelled' && invoice.dueDate) {
          const dueDate = new Date(invoice.dueDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          dueDate.setHours(0, 0, 0, 0);
          
          if (today > dueDate) {
            // Invoice is overdue
            try {
              // Fetch project name if projectId exists
              let projectName = '';
              if (invoice.projectId) {
                const project = await storage.getProject(invoice.projectId);
                projectName = project?.name || '';
              }
              
              await sendOverdueReminder({
                ...invoice,
                dueDate: invoice.dueDate ? invoice.dueDate.toISOString() : null,
                projectName,
              });
              results.overdueRemindersSent++;
            } catch (error: any) {
              results.errors.push(`Failed to send overdue reminder for invoice ${invoice.id}: ${error.message}`);
            }
          }
        }

        // Check for invoices due in 3 days
        if (invoice.status !== 'paid' && invoice.status !== 'cancelled' && invoice.dueDate) {
          const dueDate = new Date(invoice.dueDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          dueDate.setHours(0, 0, 0, 0);
          
          const diffTime = dueDate.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays === 3) {
            // Invoice is due in 3 days
            try {
              // Fetch project name if projectId exists
              let projectName = '';
              if (invoice.projectId) {
                const project = await storage.getProject(invoice.projectId);
                projectName = project?.name || '';
              }
              
              await sendDueDateReminder({
                ...invoice,
                dueDate: invoice.dueDate ? invoice.dueDate.toISOString() : null,
                projectName,
              });
              results.dueDateRemindersSent++;
            } catch (error: any) {
              results.errors.push(`Failed to send due date reminder for invoice ${invoice.id}: ${error.message}`);
            }
          }
        }
      } catch (error: any) {
        results.errors.push(`Error processing invoice ${invoice.id}: ${error.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      ...results,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error processing reminders:', error);
    return NextResponse.json(
      { error: 'Failed to process reminders', message: error.message },
      { status: 500 }
    );
  }
}

