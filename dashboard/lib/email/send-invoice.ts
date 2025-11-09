import { Resend } from 'resend';
import { InvoiceSentEmail } from './templates/invoice-sent-email';
import { InvoiceOverdueReminder } from './templates/invoice-overdue-email';
import { InvoiceDueDateReminder } from './templates/invoice-due-date-email';
import { InvoiceStatusChangeEmail } from './templates/invoice-status-change-email';
import { generateInvoicePDF } from '@/lib/invoice-pdf';

// Lazy initialization to avoid errors during build time
let resendClient: Resend | null = null;
function getResendClient() {
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

interface Invoice {
  id: number;
  invoiceNumber: string;
  clientName: string | null;
  clientEmail: string | null;
  amount: number;
  totalAmount: number;
  currency?: string;
  dueDate: string | null;
  status: string;
  projectId?: number;
  projectName?: string;
  publicToken?: string | null;
}

function formatCurrency(cents: number, currency: string = 'USD'): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatDate(dateString: string | null): string {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function calculateDaysOverdue(dueDate: string | null): number {
  if (!dueDate) return 0;
  const due = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  const diffTime = today.getTime() - due.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

function calculateDaysUntilDue(dueDate: string | null): number {
  if (!dueDate) return 0;
  const due = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

export async function sendInvoiceEmail(
  invoice: Invoice,
  clientEmail?: string | null
): Promise<void> {
  const email = clientEmail || invoice.clientEmail;
  if (!email) {
    throw new Error('Client email is required to send invoice');
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
  const publicUrl = invoice.publicToken
    ? `${baseUrl}/invoices/public/${invoice.publicToken}`
    : `${baseUrl}/invoices/${invoice.id}`;

  try {
    const { data, error } = await getResendClient().emails.send({
      from: process.env.EMAIL_FROM || 'Project Scope Analyzer <onboarding@resend.dev>',
      to: [email],
      subject: `Invoice #${invoice.invoiceNumber} - ${formatCurrency(invoice.totalAmount, invoice.currency)}`,
      react: InvoiceSentEmail({
        invoiceNumber: invoice.invoiceNumber,
        clientName: invoice.clientName || 'Valued Client',
        amount: formatCurrency(invoice.totalAmount, invoice.currency),
        dueDate: formatDate(invoice.dueDate),
        invoiceUrl: publicUrl,
      }),
    });

    if (error) {
      console.error('Failed to send invoice email:', error);
      throw new Error('Failed to send invoice email');
    }
  } catch (error) {
    console.error('Error sending invoice email:', error);
    throw error;
  }
}

export async function sendOverdueReminder(invoice: Invoice): Promise<void> {
  const email = invoice.clientEmail;
  if (!email) {
    throw new Error('Client email is required to send reminder');
  }

  const daysOverdue = calculateDaysOverdue(invoice.dueDate);
  if (daysOverdue === 0) {
    return; // Not overdue yet
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
  const invoiceUrl = `${baseUrl}/invoices/${invoice.id}`;

  try {
    const { data, error } = await getResendClient().emails.send({
      from: process.env.EMAIL_FROM || 'Project Scope Analyzer <onboarding@resend.dev>',
      to: [email],
      subject: `Overdue Invoice #${invoice.invoiceNumber} - Action Required`,
      react: InvoiceOverdueReminder({
        invoiceNumber: invoice.invoiceNumber,
        clientName: invoice.clientName || 'Valued Client',
        amount: formatCurrency(invoice.totalAmount, invoice.currency),
        dueDate: formatDate(invoice.dueDate),
        daysOverdue,
        invoiceUrl,
      }),
    });

    if (error) {
      console.error('Failed to send overdue reminder:', error);
      throw new Error('Failed to send overdue reminder');
    }
  } catch (error) {
    console.error('Error sending overdue reminder:', error);
    throw error;
  }
}

export async function sendDueDateReminder(invoice: Invoice): Promise<void> {
  const email = invoice.clientEmail;
  if (!email || !invoice.dueDate) {
    return; // No email or no due date
  }

  const daysUntilDue = calculateDaysUntilDue(invoice.dueDate);
  if (daysUntilDue !== 3) {
    return; // Only send 3 days before due date
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
  const invoiceUrl = `${baseUrl}/invoices/${invoice.id}`;

  try {
    const { data, error } = await getResendClient().emails.send({
      from: process.env.EMAIL_FROM || 'Project Scope Analyzer <onboarding@resend.dev>',
      to: [email],
      subject: `Invoice #${invoice.invoiceNumber} due in 3 days`,
      react: InvoiceDueDateReminder({
        invoiceNumber: invoice.invoiceNumber,
        clientName: invoice.clientName || 'Valued Client',
        amount: formatCurrency(invoice.totalAmount, invoice.currency),
        dueDate: formatDate(invoice.dueDate),
        daysUntilDue: 3,
        invoiceUrl,
      }),
    });

    if (error) {
      console.error('Failed to send due date reminder:', error);
      throw new Error('Failed to send due date reminder');
    }
  } catch (error) {
    console.error('Error sending due date reminder:', error);
    throw error;
  }
}

export async function sendStatusChangeEmail(
  invoice: Invoice,
  oldStatus: string
): Promise<void> {
  const email = invoice.clientEmail;
  if (!email) {
    return; // No email to send to
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
  const invoiceUrl = `${baseUrl}/invoices/${invoice.id}`;

  try {
    const { data, error } = await getResendClient().emails.send({
      from: process.env.EMAIL_FROM || 'Project Scope Analyzer <onboarding@resend.dev>',
      to: [email],
      subject: `Invoice #${invoice.invoiceNumber} status updated to ${invoice.status}`,
      react: InvoiceStatusChangeEmail({
        invoiceNumber: invoice.invoiceNumber,
        clientName: invoice.clientName || 'Valued Client',
        amount: formatCurrency(invoice.totalAmount, invoice.currency),
        oldStatus,
        newStatus: invoice.status,
        invoiceUrl,
      }),
    });

    if (error) {
      console.error('Failed to send status change email:', error);
      throw new Error('Failed to send status change email');
    }
  } catch (error) {
    console.error('Error sending status change email:', error);
    throw error;
  }
}

