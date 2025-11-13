import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { storage } from '../../../../../server/storage';
import { sendInvoiceEmail, sendStatusChangeEmail } from '@/lib/email/send-invoice';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = parseInt(params.id);
    if (isNaN(id) || id <= 0) {
      return NextResponse.json({ error: 'Invalid invoice ID' }, { status: 400 });
    }

    const invoice = await storage.getInvoice(id);

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Verify ownership through project
    const project = await storage.getProject(invoice.projectId);
    if (!project || project.userId !== session.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ invoice });
  } catch (error: any) {
    console.error('Error fetching invoice:', error);
    return NextResponse.json({ error: 'Failed to fetch invoice' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = parseInt(params.id);
    if (isNaN(id) || id <= 0) {
      return NextResponse.json({ error: 'Invalid invoice ID' }, { status: 400 });
    }

    const data = await request.json();

    // Get old invoice to track status changes
    const oldInvoice = await storage.getInvoice(id);
    if (!oldInvoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Verify ownership through project
    const project = await storage.getProject(oldInvoice.projectId);
    if (!project || project.userId !== session.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // If changing projectId, verify ownership of new project
    if (data.project_id !== undefined && data.project_id !== oldInvoice.projectId) {
      const newProject = await storage.getProject(parseInt(data.project_id));
      if (!newProject || newProject.userId !== session.userId) {
        return NextResponse.json({ error: 'Forbidden - Cannot assign invoice to another user\'s project' }, { status: 403 });
      }
    }
    
    const updateData: any = {};
    
    // Handle project_id
    if (data.project_id !== undefined) {
      updateData.projectId = data.project_id ? parseInt(data.project_id) : null;
    }
    
    if (data.invoice_number) updateData.invoiceNumber = data.invoice_number;
    if (data.client_name !== undefined) updateData.clientName = data.client_name;
    if (data.client_email !== undefined) updateData.clientEmail = data.client_email;
    if (data.client_address !== undefined) updateData.clientAddress = data.client_address;
    
    // Handle amount and tax calculations
    if (data.amount !== undefined) {
      const amount = Math.round(data.amount * 100);
      updateData.amount = amount;
      // Recalculate tax and total using current tax rate
      const taxRate = data.tax_rate !== undefined ? data.tax_rate : oldInvoice.taxRate || 0;
      const taxAmount = Math.round((amount * taxRate) / 100);
      updateData.taxAmount = taxAmount;
      updateData.totalAmount = amount + taxAmount;
    }
    
    if (data.tax_rate !== undefined) {
      updateData.taxRate = data.tax_rate;
      // Recalculate tax and total if amount exists
      const currentAmount = updateData.amount !== undefined ? updateData.amount : oldInvoice.amount;
      const taxAmount = Math.round((currentAmount * data.tax_rate) / 100);
      updateData.taxAmount = taxAmount;
      updateData.totalAmount = currentAmount + taxAmount;
    }
    
    if (data.currency) updateData.currency = data.currency;
    if (data.status) updateData.status = data.status;
    if (data.issue_date) updateData.issueDate = new Date(data.issue_date);
    if (data.due_date !== undefined) updateData.dueDate = data.due_date ? new Date(data.due_date) : null;
    if (data.paid_date !== undefined) updateData.paidDate = data.paid_date ? new Date(data.paid_date) : null;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.items !== undefined) updateData.items = JSON.stringify(data.items);
    if (data.notes !== undefined) updateData.notes = data.notes;

    const invoice = await storage.updateInvoice(id, updateData);

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Send emails based on status changes
    try {
      // If status changed, send status change email
      if (data.status && data.status !== oldInvoice.status) {
        // Fetch project name if projectId exists
        let projectName = '';
        if (invoice.projectId) {
          const project = await storage.getProject(invoice.projectId);
          projectName = project?.name || '';
        }
        
        await sendStatusChangeEmail({
          ...invoice,
          dueDate: invoice.dueDate ? invoice.dueDate.toISOString() : null,
          projectName,
        }, oldInvoice.status);
      }

      // If status changed to 'sent', send invoice email
      if (data.status === 'sent' && oldInvoice.status !== 'sent' && invoice.clientEmail) {
        let projectName = '';
        if (invoice.projectId) {
          const project = await storage.getProject(invoice.projectId);
          projectName = project?.name || '';
        }
        
          await sendInvoiceEmail({
            ...invoice,
            dueDate: invoice.dueDate ? invoice.dueDate.toISOString() : null,
            projectName,
          });
      }
    } catch (emailError) {
      console.error('Failed to send invoice email:', emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({ invoice });
  } catch (error: any) {
    console.error('Error updating invoice:', error);
    const errorMessage = error?.message || error?.detail || error?.toString() || 'Failed to update invoice';
    return NextResponse.json(
      { 
        error: 'Failed to update invoice',
        message: errorMessage,
        details: error?.code || null
      }, 
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = parseInt(params.id);
    if (isNaN(id) || id <= 0) {
      return NextResponse.json({ error: 'Invalid invoice ID' }, { status: 400 });
    }

    // Verify ownership through project before deleting
    const invoice = await storage.getInvoice(id);
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    const project = await storage.getProject(invoice.projectId);
    if (!project || project.userId !== session.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await storage.deleteInvoice(id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting invoice:', error);
    return NextResponse.json({ error: 'Failed to delete invoice' }, { status: 500 });
  }
}

