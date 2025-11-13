import { NextRequest, NextResponse } from 'next/server';
import { storage } from '../../../../../server/storage';
import { sendInvoiceEmail } from '@/lib/email/send-invoice';

export const dynamic = 'force-dynamic';

// This endpoint should be called by a cron job daily
export async function POST(request: NextRequest) {
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

    // Get all recurring invoices due for generation
    const recurringInvoices = await storage.getRecurringInvoicesDueForGeneration();
    
    const results = {
      invoicesGenerated: 0,
      errors: [] as string[],
    };

    for (const recurring of recurringInvoices) {
      try {
        // Get base invoice if exists
        let baseInvoice = null;
        if (recurring.baseInvoiceId) {
          baseInvoice = await storage.getInvoice(recurring.baseInvoiceId);
        }

        if (!baseInvoice) {
          results.errors.push(`No base invoice found for recurring invoice ${recurring.id}`);
          continue;
        }

        // Calculate next generation date based on frequency
        const calculateNextDate = (currentDate: Date, frequency: string, customDays?: number | null): Date => {
          const next = new Date(currentDate);
          switch (frequency) {
            case 'weekly':
              next.setDate(next.getDate() + 7);
              break;
            case 'bi-weekly':
              next.setDate(next.getDate() + 14);
              break;
            case 'monthly':
              next.setMonth(next.getMonth() + 1);
              break;
            case 'quarterly':
              next.setMonth(next.getMonth() + 3);
              break;
            case 'yearly':
              next.setFullYear(next.getFullYear() + 1);
              break;
            case 'custom':
              if (customDays) {
                next.setDate(next.getDate() + customDays);
              }
              break;
          }
          return next;
        };

        // Generate new invoice number
        const invoiceNumber = `${baseInvoice.invoiceNumber}-${new Date().toISOString().split('T')[0]}`;

        // Create new invoice
        const newInvoice = await storage.createInvoice({
          projectId: recurring.projectId,
          invoiceNumber,
          clientName: baseInvoice.clientName,
          clientEmail: baseInvoice.clientEmail,
          clientAddress: baseInvoice.clientAddress,
          amount: baseInvoice.amount,
          currency: baseInvoice.currency,
          taxRate: baseInvoice.taxRate,
          taxAmount: baseInvoice.taxAmount,
          totalAmount: baseInvoice.totalAmount,
          status: recurring.autoSendEmail ? 'sent' : 'draft',
          issueDate: new Date(),
          dueDate: baseInvoice.dueDate ? new Date(baseInvoice.dueDate) : null,
          description: baseInvoice.description,
          items: baseInvoice.items,
          notes: baseInvoice.notes,
        });

        // Send email if enabled
        if (recurring.autoSendEmail && newInvoice.clientEmail) {
          try {
            const project = await storage.getProject(recurring.projectId);
            await sendInvoiceEmail({
              ...newInvoice,
              dueDate: newInvoice.dueDate ? newInvoice.dueDate.toISOString() : null,
              projectName: project?.name || '',
            });
          } catch (emailError) {
            console.error('Failed to send invoice email:', emailError);
            // Don't fail the generation if email fails
          }
        }

        // Update recurring invoice
        const nextGenDate = calculateNextDate(
          new Date(recurring.nextGenerationDate),
          recurring.frequency,
          recurring.customIntervalDays
        );
        
        await storage.updateRecurringInvoice(recurring.id, {
          nextGenerationDate: nextGenDate,
          lastGeneratedDate: new Date(),
        });

        results.invoicesGenerated++;
      } catch (error: any) {
        results.errors.push(`Failed to generate invoice for recurring ${recurring.id}: ${error.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      ...results,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error processing recurring invoices:', error);
    return NextResponse.json(
      { error: 'Failed to process recurring invoices', message: error.message },
      { status: 500 }
    );
  }
}

