'use client';

import { useState, useEffect } from 'react';
import { Plus, FileText, DollarSign, TrendingUp, TrendingDown, Edit, Trash2, Download, Mail, Link } from 'lucide-react';
import axios from 'axios';
import { InvoiceForm } from './InvoiceForm';
import { ExpenseForm } from './ExpenseForm';
import { CashFlowAnalytics } from './CashFlowAnalytics';
import { RecurringInvoiceForm } from './RecurringInvoiceForm';
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
  totalAmount: number;
  status: string;
  issueDate: string;
  dueDate: string | null;
  paidDate: string | null;
  description: string | null;
  items: string | null;
  notes: string | null;
  projectId?: number;
}

interface Expense {
  id: number;
  category: string;
  description: string;
  amount: number;
  currency: string;
  expenseDate: string;
  receiptUrl?: string | null;
  notes?: string | null;
}

interface InvoicesAndCashFlowProps {
  projectId: number;
}

export function InvoicesAndCashFlow({ projectId }: InvoicesAndCashFlowProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [recurringInvoices, setRecurringInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'invoices' | 'expenses' | 'cashflow' | 'recurring'>('cashflow');
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showRecurringForm, setShowRecurringForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = async () => {
    try {
      const [invoicesRes, expensesRes, recurringRes] = await Promise.all([
        axios.get(`/api/invoices?project_id=${projectId}`),
        axios.get(`/api/expenses?project_id=${projectId}`),
        axios.get(`/api/recurring-invoices?projectId=${projectId}`),
      ]);
      setInvoices(invoicesRes.data.invoices || []);
      setExpenses(expensesRes.data.expenses || []);
      setRecurringInvoices(recurringRes.data.recurringInvoices || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string | Date) => {
    const date = dateString instanceof Date ? dateString : new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleDeleteExpense = async (expenseId: number) => {
    if (!confirm('Are you sure you want to delete this expense?')) {
      return;
    }

    try {
      await axios.delete(`/api/expenses/${expenseId}`);
      loadData();
    } catch (error) {
      console.error('Failed to delete expense:', error);
      alert('Failed to delete expense. Please try again.');
    }
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setShowExpenseForm(true);
  };

  const handleSendEmail = async (invoice: Invoice, action: 'send' | 'remind') => {
    try {
      const response = await axios.post(`/api/invoices/${invoice.id}/send-email`, { action });
      alert(response.data.message || 'Email sent successfully');
    } catch (error: any) {
      console.error('Failed to send email:', error);
      alert(error.response?.data?.error || 'Failed to send email');
    }
  };

  const handleGeneratePublicLink = async (invoice: Invoice) => {
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

  const handleEditInvoice = async (invoice: Invoice) => {
    try {
      // Fetch full invoice data for editing
      const response = await axios.get(`/api/invoices/${invoice.id}`);
      if (response.data && response.data.invoice) {
        setEditingInvoice(response.data.invoice);
        setShowInvoiceForm(true);
      } else {
        console.error('Invalid response format:', response.data);
        alert('Failed to load invoice data. Invalid response format.');
      }
    } catch (error: any) {
      console.error('Failed to load invoice:', error);
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to load invoice. Please try again.';
      alert(errorMessage);
    }
  };

  const handleDownloadInvoice = async (invoice: Invoice) => {
    try {
      // Fetch full invoice data including project name
      const response = await axios.get(`/api/invoices/${invoice.id}`);
      const fullInvoice = response.data.invoice;
      
      // Fetch project name if projectId exists
      let projectName = '';
      if (fullInvoice.projectId) {
        try {
          const projectResponse = await axios.get(`/api/projects/${fullInvoice.projectId}`);
          projectName = projectResponse.data.project?.name || '';
        } catch (e) {
          console.error('Failed to fetch project name:', e);
        }
      }
      
      // Generate PDF with full invoice data
      const invoiceForPDF = {
        ...fullInvoice,
        dueDate: fullInvoice.dueDate 
          ? (fullInvoice.dueDate instanceof Date 
              ? fullInvoice.dueDate.toISOString() 
              : typeof fullInvoice.dueDate === 'string' 
                ? fullInvoice.dueDate 
                : new Date(fullInvoice.dueDate).toISOString())
          : null,
        projectName,
      };
      await generateInvoicePDF(invoiceForPDF);
    } catch (error) {
      console.error('Failed to download invoice:', error);
      alert('Failed to download invoice. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'bg-success/20 text-success border border-success/30';
      case 'sent':
        return 'bg-primary/20 text-primary border border-primary/30';
      case 'overdue':
        return 'bg-danger/20 text-danger border border-danger/30';
      case 'draft':
        return 'bg-surface-elevated text-text-tertiary border border-white/10';
      default:
        return 'bg-surface-elevated text-text-tertiary border border-white/10';
    }
  };

  // Calculate cash flow
  const totalIncome = invoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.totalAmount, 0);
  
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const netCashFlow = totalIncome - totalExpenses;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-white/10">
        <button
          onClick={() => setActiveTab('cashflow')}
          className={`px-4 py-2 font-semibold transition-all duration-200 border-b-2 ${
            activeTab === 'cashflow'
              ? 'text-primary border-primary'
              : 'text-text-secondary border-transparent hover:text-text-primary'
          }`}
        >
          Cash Flow
        </button>
        <button
          onClick={() => setActiveTab('invoices')}
          className={`px-4 py-2 font-semibold transition-all duration-200 border-b-2 ${
            activeTab === 'invoices'
              ? 'text-primary border-primary'
              : 'text-text-secondary border-transparent hover:text-text-primary'
          }`}
        >
          Invoices
        </button>
        <button
          onClick={() => setActiveTab('expenses')}
          className={`px-4 py-2 font-semibold transition-all duration-200 border-b-2 ${
            activeTab === 'expenses'
              ? 'text-primary border-primary'
              : 'text-text-secondary border-transparent hover:text-text-primary'
          }`}
        >
          Expenses
        </button>
        <button
          onClick={() => setActiveTab('recurring')}
          className={`px-4 py-2 font-semibold transition-all duration-200 border-b-2 ${
            activeTab === 'recurring'
              ? 'text-primary border-primary'
              : 'text-text-secondary border-transparent hover:text-text-primary'
          }`}
        >
          Recurring
        </button>
      </div>

      {/* Cash Flow Overview */}
      {activeTab === 'cashflow' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-medium rounded-xl p-6 border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-text-tertiary">Total Income</h3>
                <TrendingUp className="w-5 h-5 text-success" />
              </div>
              <p className="text-3xl font-bold text-success">{formatCurrency(totalIncome)}</p>
              <p className="text-xs text-text-tertiary mt-2">
                {invoices.filter(inv => inv.status === 'paid').length} paid invoices
              </p>
            </div>

            <div className="glass-medium rounded-xl p-6 border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-text-tertiary">Total Expenses</h3>
                <TrendingDown className="w-5 h-5 text-danger" />
              </div>
              <p className="text-3xl font-bold text-danger">{formatCurrency(totalExpenses)}</p>
              <p className="text-xs text-text-tertiary mt-2">
                {expenses.length} expense entries
              </p>
            </div>

            <div className="glass-medium rounded-xl p-6 border border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-text-tertiary">Net Cash Flow</h3>
                <DollarSign className={`w-5 h-5 ${netCashFlow >= 0 ? 'text-green-400' : 'text-red-400'}`} />
              </div>
              <p className={`text-3xl font-bold ${netCashFlow >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {formatCurrency(netCashFlow)}
              </p>
              <p className="text-xs text-text-tertiary mt-2">
                {netCashFlow >= 0 ? 'Positive' : 'Negative'} balance
              </p>
            </div>
          </div>

          {/* Advanced Cash Flow Analytics */}
          <CashFlowAnalytics projectId={projectId} />
        </div>
      )}

      {/* Invoices Tab */}
      {activeTab === 'invoices' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-text-primary">Invoices</h3>
            <button
              onClick={() => setShowInvoiceForm(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>New Invoice</span>
            </button>
          </div>

          <div className="glass-medium rounded-xl overflow-hidden border border-white/10">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="glass-subtle">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase">Invoice #</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase">Client</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase">Due Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {invoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 text-sm text-text-primary">{invoice.invoiceNumber}</td>
                      <td className="px-6 py-4 text-sm text-text-primary">{invoice.clientName || '-'}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-text-primary">
                        {formatCurrency(invoice.totalAmount)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(invoice.status)}`}>
                          {invoice.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-text-secondary">
                        {invoice.dueDate ? formatDate(invoice.dueDate) : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          {invoice.clientEmail && (
                            <button 
                              onClick={() => handleSendEmail(invoice, 'send')}
                              className="p-1 hover:bg-white/10 rounded transition-colors"
                              title="Send email to client"
                            >
                              <Mail className="w-4 h-4 text-blue-400" />
                            </button>
                          )}
                          <button 
                            onClick={() => handleGeneratePublicLink(invoice)}
                            className="p-1 hover:bg-white/10 rounded transition-colors"
                            title="Generate public link"
                          >
                            <Link className="w-4 h-4 text-text-secondary" />
                          </button>
                          <button 
                            onClick={() => handleDownloadInvoice(invoice)}
                            className="p-1 hover:bg-white/10 rounded transition-colors"
                            title="Download PDF"
                          >
                            <Download className="w-4 h-4 text-text-secondary" />
                          </button>
                          <button 
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleEditInvoice(invoice);
                            }}
                            className="p-1 hover:bg-white/10 rounded transition-colors"
                            title="Edit invoice"
                          >
                            <Edit className="w-4 h-4 text-text-secondary" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {invoices.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-text-tertiary">
                        No invoices yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Expenses Tab */}
      {activeTab === 'expenses' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-text-primary">Expenses</h3>
            <button
              onClick={() => {
                setEditingExpense(null);
                setShowExpenseForm(true);
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>New Expense</span>
            </button>
          </div>

          <div className="space-y-3">
            {expenses.map((expense) => (
              <div
                key={expense.id}
                className="glass-medium rounded-xl p-4 border border-white/10 hover:glass-light transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400">
                        {expense.category}
                      </span>
                      <span className="text-sm font-semibold text-text-primary">{formatCurrency(expense.amount)}</span>
                    </div>
                    <p className="text-sm text-text-secondary">{expense.description}</p>
                    <p className="text-xs text-text-tertiary mt-1">{formatDate(expense.expenseDate)}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => handleEditExpense(expense)}
                      className="p-2 hover:bg-white/10 rounded transition-colors"
                      title="Edit expense"
                    >
                      <Edit className="w-4 h-4 text-text-secondary" />
                    </button>
                    <button 
                      onClick={() => handleDeleteExpense(expense.id)}
                      className="p-2 hover:bg-white/10 rounded transition-colors"
                      title="Delete expense"
                    >
                      <Trash2 className="w-4 h-4 text-text-secondary" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {expenses.length === 0 && (
              <div className="text-center py-12 text-text-tertiary">
                <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No expenses yet</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recurring Invoices Tab */}
      {activeTab === 'recurring' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-text-primary">Recurring Invoices</h3>
            <button
              onClick={() => setShowRecurringForm(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>New Recurring Invoice</span>
            </button>
          </div>

          <div className="space-y-3">
            {recurringInvoices.map((recurring) => (
              <div
                key={recurring.id}
                className="glass-medium rounded-xl p-4 border border-white/10 hover:glass-light transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-sm font-semibold text-text-primary">
                        {recurring.frequency.charAt(0).toUpperCase() + recurring.frequency.slice(1)}
                      </span>
                      {recurring.isActive ? (
                        <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                          Active
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-text-tertiary">
                      Next: {new Date(recurring.nextGenerationDate).toLocaleDateString()}
                    </p>
                    {recurring.lastGeneratedDate && (
                      <p className="text-xs text-text-tertiary">
                        Last: {new Date(recurring.lastGeneratedDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={async () => {
                        if (!confirm('Are you sure you want to deactivate this recurring invoice?')) return;
                        try {
                          await axios.put(`/api/recurring-invoices/${recurring.id}`, { is_active: false });
                          loadData();
                        } catch (error) {
                          console.error('Failed to deactivate:', error);
                        }
                      }}
                      className="p-2 hover:bg-white/10 rounded transition-colors"
                      title="Deactivate"
                    >
                      <Trash2 className="w-4 h-4 text-text-secondary" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {recurringInvoices.length === 0 && (
              <div className="text-center py-12 text-text-tertiary">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No recurring invoices yet</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Invoice Form Modal */}
      <InvoiceForm
        isOpen={showInvoiceForm}
        onClose={() => {
          setShowInvoiceForm(false);
          setEditingInvoice(null);
        }}
        onSave={() => {
          loadData();
          setShowInvoiceForm(false);
          setEditingInvoice(null);
        }}
        projectId={projectId}
        invoice={editingInvoice}
      />

      {/* Expense Form Modal */}
      <ExpenseForm
        isOpen={showExpenseForm}
        onClose={() => {
          setShowExpenseForm(false);
          setEditingExpense(null);
        }}
        onSave={() => {
          loadData();
          setShowExpenseForm(false);
          setEditingExpense(null);
        }}
        projectId={projectId}
        expense={editingExpense}
      />

      {/* Recurring Invoice Form Modal */}
      <RecurringInvoiceForm
        isOpen={showRecurringForm}
        onClose={() => setShowRecurringForm(false)}
        onSave={loadData}
        projectId={projectId}
      />
    </div>
  );
}

