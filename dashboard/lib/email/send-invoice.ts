import { Resend } from 'resend';
import { render } from '@react-email/render';
import { InvoiceSentEmail } from './templates/invoice-sent-email';
import { InvoiceOverdueReminder } from './templates/invoice-overdue-email';
import { InvoiceDueDateReminder } from './templates/invoice-due-date-email';
import { InvoiceStatusChangeEmail } from './templates/invoice-status-change-email';
import { generateInvoicePDF } from '@/lib/invoice-pdf';

// Lazy initialization to avoid errors during build time
let resendClient: Resend | null = null;
function getResendClient() {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY is not configured. Please add it to your environment variables.');
    }
    resendClient = new Resend(apiKey);
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

  // Get base URL from environment variable - required for production
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_API_URL;
  if (!baseUrl) {
    console.warn('NEXT_PUBLIC_APP_URL is not set. Using placeholder URL. Please set it in your environment variables.');
    // Don't use localhost in production - it won't work
    throw new Error('NEXT_PUBLIC_APP_URL environment variable is required for sending invoice emails');
  }
  const publicUrl = invoice.publicToken
    ? `${baseUrl}/invoices/public/${invoice.publicToken}`
    : `${baseUrl}/invoices/${invoice.id}`;

  try {
    // Render React component to HTML for better compatibility
    const emailHtml = await render(
      InvoiceSentEmail({
        invoiceNumber: invoice.invoiceNumber,
        clientName: invoice.clientName || 'Valued Client',
        amount: formatCurrency(invoice.totalAmount, invoice.currency),
        dueDate: formatDate(invoice.dueDate),
        invoiceUrl: publicUrl,
      })
    );

    const { data, error } = await getResendClient().emails.send({
      from: process.env.EMAIL_FROM || 'Project Scope Analyzer <onboarding@resend.dev>',
      to: [email],
      subject: `Invoice #${invoice.invoiceNumber} - ${formatCurrency(invoice.totalAmount, invoice.currency)}`,
      html: emailHtml,
    });

    if (error) {
      console.error('Failed to send invoice email:', error);
      // Provide more detailed error message
      const errorMessage = error.message || JSON.stringify(error) || 'Unknown error';
      throw new Error(`Failed to send invoice email: ${errorMessage}`);
    }
  } catch (error: any) {
    console.error('Error sending invoice email:', error);
    // Preserve original error message if available
    if (error?.message) {
      throw error;
    }
    throw new Error(`Failed to send invoice email: ${error?.toString() || 'Unknown error'}`);
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

  // Get base URL from environment variable - required for production
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_API_URL;
  if (!baseUrl) {
    console.warn('NEXT_PUBLIC_APP_URL is not set. Using placeholder URL. Please set it in your environment variables.');
    // Don't use localhost in production - it won't work
    throw new Error('NEXT_PUBLIC_APP_URL environment variable is required for sending invoice emails');
  }
  const invoiceUrl = `${baseUrl}/invoices/${invoice.id}`;

  try {
    // Render React component to HTML for better compatibility
    const emailHtml = await render(
      InvoiceOverdueReminder({
        invoiceNumber: invoice.invoiceNumber,
        clientName: invoice.clientName || 'Valued Client',
        amount: formatCurrency(invoice.totalAmount, invoice.currency),
        dueDate: formatDate(invoice.dueDate),
        daysOverdue,
        invoiceUrl,
      })
    );

    const { data, error } = await getResendClient().emails.send({
      from: process.env.EMAIL_FROM || 'Project Scope Analyzer <onboarding@resend.dev>',
      to: [email],
      subject: `Overdue Invoice #${invoice.invoiceNumber} - Action Required`,
      html: emailHtml,
    });

    if (error) {
      console.error('Failed to send overdue reminder:', error);
      const errorMessage = error.message || JSON.stringify(error) || 'Unknown error';
      throw new Error(`Failed to send overdue reminder: ${errorMessage}`);
    }
  } catch (error: any) {
    console.error('Error sending overdue reminder:', error);
    if (error?.message) {
      throw error;
    }
    throw new Error(`Failed to send overdue reminder: ${error?.toString() || 'Unknown error'}`);
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

  // Get base URL from environment variable - required for production
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_API_URL;
  if (!baseUrl) {
    console.warn('NEXT_PUBLIC_APP_URL is not set. Using placeholder URL. Please set it in your environment variables.');
    // Don't use localhost in production - it won't work
    throw new Error('NEXT_PUBLIC_APP_URL environment variable is required for sending invoice emails');
  }
  const invoiceUrl = `${baseUrl}/invoices/${invoice.id}`;

  try {
    // Render React component to HTML for better compatibility
    const emailHtml = await render(
      InvoiceDueDateReminder({
        invoiceNumber: invoice.invoiceNumber,
        clientName: invoice.clientName || 'Valued Client',
        amount: formatCurrency(invoice.totalAmount, invoice.currency),
        dueDate: formatDate(invoice.dueDate),
        daysUntilDue: 3,
        invoiceUrl,
      })
    );

    const { data, error } = await getResendClient().emails.send({
      from: process.env.EMAIL_FROM || 'Project Scope Analyzer <onboarding@resend.dev>',
      to: [email],
      subject: `Invoice #${invoice.invoiceNumber} due in 3 days`,
      html: emailHtml,
    });

    if (error) {
      console.error('Failed to send due date reminder:', error);
      const errorMessage = error.message || JSON.stringify(error) || 'Unknown error';
      throw new Error(`Failed to send due date reminder: ${errorMessage}`);
    }
  } catch (error: any) {
    console.error('Error sending due date reminder:', error);
    if (error?.message) {
      throw error;
    }
    throw new Error(`Failed to send due date reminder: ${error?.toString() || 'Unknown error'}`);
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

  // Get base URL from environment variable - required for production
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_API_URL;
  if (!baseUrl) {
    console.warn('NEXT_PUBLIC_APP_URL is not set. Using placeholder URL. Please set it in your environment variables.');
    // Don't use localhost in production - it won't work
    throw new Error('NEXT_PUBLIC_APP_URL environment variable is required for sending invoice emails');
  }
  const invoiceUrl = `${baseUrl}/invoices/${invoice.id}`;

  try {
    // Render React component to HTML for better compatibility
    const emailHtml = await render(
      InvoiceStatusChangeEmail({
        invoiceNumber: invoice.invoiceNumber,
        clientName: invoice.clientName || 'Valued Client',
        amount: formatCurrency(invoice.totalAmount, invoice.currency),
        oldStatus,
        newStatus: invoice.status,
        invoiceUrl,
      })
    );

    const { data, error } = await getResendClient().emails.send({
      from: process.env.EMAIL_FROM || 'Project Scope Analyzer <onboarding@resend.dev>',
      to: [email],
      subject: `Invoice #${invoice.invoiceNumber} status updated to ${invoice.status}`,
      html: emailHtml,
    });

    if (error) {
      console.error('Failed to send status change email:', error);
      const errorMessage = error.message || JSON.stringify(error) || 'Unknown error';
      throw new Error(`Failed to send status change email: ${errorMessage}`);
    }
  } catch (error: any) {
    console.error('Error sending status change email:', error);
    if (error?.message) {
      throw error;
    }
    throw new Error(`Failed to send status change email: ${error?.toString() || 'Unknown error'}`);
  }
}

