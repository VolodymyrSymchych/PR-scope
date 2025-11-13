'use client';

import { useState, useEffect } from 'react';
import { Plus, FileText, DollarSign, Search, Filter, Download, Edit, Trash2, Mail } from 'lucide-react';
import axios from 'axios';
import Link from 'next/link';
import { InvoiceForm } from '@/components/InvoiceForm';
import { generateInvoicePDF } from '@/lib/invoice-pdf';
import { DeleteConfirmModal } from '@/components/DeleteConfirmModal';

interface Invoice {
  id: number;
  projectId: number;
  invoiceNumber: string;
  clientName: string | null;
  clientEmail?: string | null;
  amount: number;
  totalAmount: number;
  status: string;
  issueDate: string;
  dueDate: string | null;
  paidDate: string | null;
}

interface Project {
  id: number;
  name: string;
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; invoice: Invoice | null }>({
    isOpen: false,
    invoice: null,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [invoicesRes, projectsRes] = await Promise.all([
        axios.get('/api/invoices'),
        axios.get('/api/projects'),
      ]);
      setInvoices(invoicesRes.data.invoices || []);
      setProjects(projectsRes.data.projects || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
      case 'sent':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400';
      case 'overdue':
        return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400';
      case 'draft':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const getProjectName = (projectId: number) => {
    const project = projects.find(p => p.id === projectId);
    return project?.name || 'Unknown Project';
  };

  const handleSendEmail = async (invoice: Invoice, action: 'send' | 'remind_overdue' | 'remind_due_date' = 'send') => {
    if (!invoice.clientEmail) {
      alert('Client email is required to send email');
      return;
    }

    try {
      await axios.post(`/api/invoices/${invoice.id}/send-email`, { action });
      alert(`Email sent successfully to ${invoice.clientEmail}`);
    } catch (error: any) {
      console.error('Failed to send email:', error);
      alert(`Failed to send email: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleDownloadInvoice = async (invoice: Invoice) => {
    try {
      // Fetch full invoice data
      const response = await axios.get(`/api/invoices/${invoice.id}`);
      const fullInvoice = response.data.invoice;

      // Add project name
      const projectName = getProjectName(invoice.projectId);

      // Generate PDF
      await generateInvoicePDF({
        ...fullInvoice,
        projectName,
      });
    } catch (error) {
      console.error('Failed to download invoice:', error);
      alert('Failed to download invoice. Please try again.');
    }
  };

  const handleDeleteInvoice = async (invoiceId: number) => {
    const invoice = invoices.find(inv => inv.id === invoiceId);
    if (invoice) {
      setDeleteModal({ isOpen: true, invoice });
    }
  };

  const confirmDeleteInvoice = async () => {
    if (!deleteModal.invoice) return;

    try {
      await axios.delete(`/api/invoices/${deleteModal.invoice.id}`);
      setDeleteModal({ isOpen: false, invoice: null });
      loadData();
    } catch (error: any) {
      console.error('Failed to delete invoice:', error);
      alert(error.response?.data?.error || 'Failed to delete invoice. Please try again.');
    }
  };

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getProjectName(invoice.projectId).toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || invoice.status.toLowerCase() === statusFilter.toLowerCase();
    
    return matchesSearch && matchesStatus;
  });

  const totalAmount = filteredInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const paidAmount = filteredInvoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.totalAmount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold gradient-text">Invoices</h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Manage invoices across all projects
          </p>
        </div>
        <button
          onClick={() => setShowInvoiceForm(true)}
          className="flex items-center space-x-2 px-4 py-2 glass-button rounded-lg text-sm font-semibold"
        >
          <Plus className="w-4 h-4" />
          <span>New Invoice</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-medium rounded-lg p-4 border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-medium text-text-tertiary">Total Invoices</h3>
            <FileText className="w-4 h-4 text-primary" />
          </div>
          <p className="text-2xl font-bold text-text-primary">{filteredInvoices.length}</p>
        </div>

        <div className="glass-medium rounded-lg p-4 border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-medium text-text-tertiary">Total Amount</h3>
            <DollarSign className="w-4 h-4 text-green-400" />
          </div>
          <p className="text-2xl font-bold text-green-400">{formatCurrency(totalAmount)}</p>
        </div>

        <div className="glass-medium rounded-lg p-4 border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-medium text-text-tertiary">Paid Amount</h3>
            <DollarSign className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-blue-400">{formatCurrency(paidAmount)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-medium rounded-lg p-3 border border-white/10">
        <div className="flex items-center space-x-3">
          <div className="flex-1 relative">
            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-tertiary" />
            <input
              type="text"
              placeholder="Search invoices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg glass-light border border-white/10 text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm rounded-lg glass-light border border-white/10 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="glass-medium rounded-lg overflow-hidden border border-white/10">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="glass-subtle">
              <tr>
                <th className="px-4 py-2 text-left text-[10px] font-medium text-text-tertiary uppercase">Invoice #</th>
                <th className="px-4 py-2 text-left text-[10px] font-medium text-text-tertiary uppercase">Project</th>
                <th className="px-4 py-2 text-left text-[10px] font-medium text-text-tertiary uppercase">Client</th>
                <th className="px-4 py-2 text-left text-[10px] font-medium text-text-tertiary uppercase">Amount</th>
                <th className="px-4 py-2 text-left text-[10px] font-medium text-text-tertiary uppercase">Status</th>
                <th className="px-4 py-2 text-left text-[10px] font-medium text-text-tertiary uppercase">Issue Date</th>
                <th className="px-4 py-2 text-left text-[10px] font-medium text-text-tertiary uppercase">Due Date</th>
                <th className="px-4 py-2 text-left text-[10px] font-medium text-text-tertiary uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredInvoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 text-xs font-semibold text-text-primary">
                    <Link
                      href={`/invoices/${invoice.id}`}
                      className="text-primary hover:underline"
                    >
                      {invoice.invoiceNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/projects/${invoice.projectId}`}
                      className="text-xs text-primary hover:underline"
                    >
                      {getProjectName(invoice.projectId)}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-xs text-text-primary">{invoice.clientName || '-'}</td>
                  <td className="px-4 py-3 text-xs font-semibold text-text-primary">
                    {formatCurrency(invoice.totalAmount)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${getStatusColor(invoice.status)}`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-text-secondary">
                    {formatDate(invoice.issueDate)}
                  </td>
                  <td className="px-4 py-3 text-xs text-text-secondary">
                    {invoice.dueDate ? formatDate(invoice.dueDate) : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-1.5">
                      {invoice.clientEmail && (
                        <button
                          onClick={() => handleSendEmail(invoice, 'send')}
                          className="p-1 hover:bg-white/10 rounded transition-colors"
                          title="Send email to client"
                        >
                          <Mail className="w-3.5 h-3.5 text-blue-400" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDownloadInvoice(invoice)}
                        className="p-1 hover:bg-white/10 rounded transition-colors"
                        title="Download PDF"
                      >
                        <Download className="w-3.5 h-3.5 text-text-secondary" />
                      </button>
                      <button className="p-1 hover:bg-white/10 rounded transition-colors" title="Edit">
                        <Edit className="w-3.5 h-3.5 text-text-secondary" />
                      </button>
                      <button
                        onClick={() => handleDeleteInvoice(invoice.id)}
                        className="p-1 hover:bg-white/10 rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-400 hover:text-red-300" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-xs text-text-tertiary">
                    {invoices.length === 0 ? 'No invoices yet' : 'No invoices match your filters'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Form Modal */}
      <InvoiceForm
        isOpen={showInvoiceForm}
        onClose={() => setShowInvoiceForm(false)}
        onSave={() => {
          loadData();
          setShowInvoiceForm(false);
        }}
      />

      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        title="Delete Invoice"
        message="This will mark the invoice as deleted. This action can be undone by restoring the invoice from the deleted invoices list."
        itemName={deleteModal.invoice?.invoiceNumber || ''}
        onConfirm={confirmDeleteInvoice}
        onCancel={() => setDeleteModal({ isOpen: false, invoice: null })}
      />
    </div>
  );
}

