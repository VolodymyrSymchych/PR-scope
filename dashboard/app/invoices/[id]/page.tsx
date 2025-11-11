'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, FileText, Calendar, DollarSign, Download, Edit, Mail, Link as LinkIcon } from 'lucide-react';
import Link from 'next/link';
import axios from 'axios';
import { generateInvoicePDF } from '@/lib/invoice-pdf';

interface Invoice {
  id: number;
  invoiceNumber: string;
  clientName: string | null;
  clientEmail: string | null;
  clientAddress: string | null;
  amount: number;
  currency: string;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  status: string;
  issueDate: string;
  dueDate: string | null;
  paidDate: string | null;
  description: string | null;
  items: string | null;
  notes: string | null;
  projectId: number | null;
  publicToken: string | null;
}

interface Project {
  id: number;
  name: string;
}

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.id as string;

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (invoiceId) {
      loadInvoice();
    }
  }, [invoiceId]);

  const loadInvoice = async () => {
    try {
      const response = await axios.get(`/api/invoices/${invoiceId}`);
      setInvoice(response.data.invoice);
      
      // Load project if projectId exists
      if (response.data.invoice.projectId) {
        try {
          const projectResponse = await axios.get(`/api/projects/${response.data.invoice.projectId}`);
          setProject(projectResponse.data.project);
        } catch (e) {
          console.error('Failed to load project:', e);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!invoice) return;
    
    try {
      const invoiceForPDF = {
        ...invoice,
        dueDate: invoice.dueDate 
          ? (typeof invoice.dueDate === 'string' 
              ? invoice.dueDate 
              : new Date(invoice.dueDate).toISOString())
          : null,
        projectName: project?.name || '',
      };
      await generateInvoicePDF(invoiceForPDF);
    } catch (error) {
      console.error('Failed to download invoice:', error);
      alert('Failed to download invoice. Please try again.');
    }
  };

  const handleSendEmail = async () => {
    if (!invoice) return;
    
    try {
      const response = await axios.post(`/api/invoices/${invoice.id}/send-email`, { action: 'send' });
      alert(response.data.message || 'Email sent successfully');
    } catch (error: any) {
      console.error('Failed to send email:', error);
      alert(error.response?.data?.error || 'Failed to send email');
    }
  };

  const handleGeneratePublicLink = async () => {
    if (!invoice) return;
    
    try {
      const response = await axios.post(`/api/invoices/${invoice.id}/generate-token`);
      const publicUrl = response.data.publicUrl;
      navigator.clipboard.writeText(publicUrl);
      alert(`Public link copied to clipboard: ${publicUrl}`);
    } catch (error: any) {
      console.error('Failed to generate public link:', error);
      alert(error.response?.data?.error || 'Failed to generate public link');
    }
  };

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'bg-green-500/20 text-green-400';
      case 'sent':
        return 'bg-blue-500/20 text-blue-400';
      case 'overdue':
        return 'bg-red-500/20 text-red-400';
      case 'draft':
        return 'bg-gray-500/20 text-gray-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="glass-medium rounded-xl p-8 border border-white/10 text-center">
          <h1 className="text-2xl font-bold text-text-primary mb-4">Invoice Not Found</h1>
          <p className="text-text-secondary mb-6">{error || 'The invoice you are looking for does not exist.'}</p>
          <button
            onClick={() => router.push('/invoices')}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-colors"
          >
            Back to Invoices
          </button>
        </div>
      </div>
    );
  }

  const parsedItems = invoice.items ? JSON.parse(invoice.items) : [];
  const isPaid = invoice.status === 'paid';
  const isOverdue = invoice.status === 'overdue';

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center space-x-2 text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleDownloadPDF}
            className="flex items-center space-x-2 px-4 py-2 bg-primary/20 text-primary rounded-lg hover:bg-primary/30 transition-colors"
            title="Download PDF"
          >
            <Download className="w-4 h-4" />
            <span>Download</span>
          </button>
          {invoice.clientEmail && (
            <button
              onClick={handleSendEmail}
              className="flex items-center space-x-2 px-4 py-2 bg-primary/20 text-primary rounded-lg hover:bg-primary/30 transition-colors"
              title="Send email"
            >
              <Mail className="w-4 h-4" />
              <span>Send Email</span>
            </button>
          )}
          <button
            onClick={handleGeneratePublicLink}
            className="flex items-center space-x-2 px-4 py-2 bg-primary/20 text-primary rounded-lg hover:bg-primary/30 transition-colors"
            title="Generate public link"
          >
            <LinkIcon className="w-4 h-4" />
            <span>Public Link</span>
          </button>
        </div>
      </div>

      {/* Invoice Header */}
      <div className="glass-medium rounded-xl p-8 border border-white/10 mb-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-text-primary mb-2">Invoice</h1>
            <p className="text-text-secondary">#{invoice.invoiceNumber}</p>
            {project && (
              <Link
                href={`/projects/${project.id}`}
                className="text-sm text-primary hover:underline mt-2 inline-block"
              >
                {project.name}
              </Link>
            )}
          </div>
          <div className={`px-4 py-2 rounded-lg font-semibold ${getStatusColor(invoice.status)}`}>
            {invoice.status.toUpperCase()}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-text-tertiary mb-2">Bill To</h3>
            <p className="text-text-primary font-medium">{invoice.clientName || 'N/A'}</p>
            {invoice.clientEmail && (
              <p className="text-text-secondary text-sm">{invoice.clientEmail}</p>
            )}
            {invoice.clientAddress && (
              <p className="text-text-secondary text-sm mt-2 whitespace-pre-line">{invoice.clientAddress}</p>
            )}
          </div>
          <div>
            <div className="flex items-center space-x-2 text-text-secondary mb-2">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">Issue Date: {formatDate(invoice.issueDate)}</span>
            </div>
            {invoice.dueDate && (
              <div className="flex items-center space-x-2 text-text-secondary mb-2">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">Due Date: {formatDate(invoice.dueDate)}</span>
              </div>
            )}
            {invoice.paidDate && (
              <div className="flex items-center space-x-2 text-text-secondary">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">Paid Date: {formatDate(invoice.paidDate)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Invoice Items */}
      {parsedItems.length > 0 && (
        <div className="glass-medium rounded-xl p-6 border border-white/10 mb-6">
          <h2 className="text-xl font-bold text-text-primary mb-4">Items</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-sm font-medium text-text-tertiary">Description</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-text-tertiary">Quantity</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-text-tertiary">Unit Price</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-text-tertiary">Total</th>
                </tr>
              </thead>
              <tbody>
                {parsedItems.map((item: any, index: number) => (
                  <tr key={index} className="border-b border-white/5">
                    <td className="py-3 px-4 text-text-primary">{item.description || '-'}</td>
                    <td className="py-3 px-4 text-right text-text-secondary">{item.quantity || 0}</td>
                    <td className="py-3 px-4 text-right text-text-secondary">{formatCurrency((item.unitPrice || 0) * 100)}</td>
                    <td className="py-3 px-4 text-right text-text-primary font-semibold">
                      {formatCurrency((item.unitPrice || 0) * (item.quantity || 0) * 100)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Invoice Totals */}
      <div className="glass-medium rounded-xl p-6 border border-white/10 mb-6">
        <div className="flex justify-end">
          <div className="w-full md:w-1/2 space-y-3">
            <div className="flex justify-between text-text-secondary">
              <span>Subtotal:</span>
              <span>{formatCurrency(invoice.amount)}</span>
            </div>
            {invoice.taxRate > 0 && (
              <div className="flex justify-between text-text-secondary">
                <span>Tax ({invoice.taxRate}%):</span>
                <span>{formatCurrency(invoice.taxAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-xl font-bold text-text-primary pt-3 border-t border-white/10">
              <span>Total:</span>
              <span>{formatCurrency(invoice.totalAmount)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      {invoice.description && (
        <div className="glass-medium rounded-xl p-6 border border-white/10 mb-6">
          <h2 className="text-xl font-bold text-text-primary mb-4">Description</h2>
          <p className="text-text-secondary whitespace-pre-line">{invoice.description}</p>
        </div>
      )}

      {/* Notes */}
      {invoice.notes && (
        <div className="glass-medium rounded-xl p-6 border border-white/10">
          <h2 className="text-xl font-bold text-text-primary mb-4">Notes</h2>
          <p className="text-text-secondary whitespace-pre-line">{invoice.notes}</p>
        </div>
      )}
    </div>
  );
}

