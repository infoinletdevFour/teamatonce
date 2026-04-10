import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CreditCard,
  DollarSign,
  Download,
  Eye,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  Plus,
  Edit,
  Trash2,
  Receipt,
  FileText,
  Building2,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { useCompany } from '@/contexts/CompanyContext';
import paymentService from '@/services/paymentService';
import { getClientProjects } from '@/services/projectService';

/**
 * Payments Page
 * Payment history, invoices, payment methods, and transaction management
 */

interface Transaction {
  id: string;
  type: 'payment' | 'refund' | 'invoice';
  status: 'completed' | 'pending' | 'failed';
  amount: number;
  projectId: string;
  projectName: string;
  description: string;
  date: Date;
  paymentMethod: string;
  invoiceNumber?: string;
  receiptUrl?: string;
}

interface PaymentMethod {
  id: string;
  type: 'credit_card' | 'bank_account' | 'paypal';
  last4: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
  billingAddress: {
    line1: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  projectId: string;
  projectName: string;
  amount: number;
  taxAmount: number;
  totalAmount: number;
  status: 'paid' | 'pending' | 'overdue';
  issueDate: Date;
  dueDate: Date;
  paidDate?: Date;
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
  }[];
  downloadUrl: string;
}

export const Payments: React.FC = () => {
  const { companyId, loading: companyLoading } = useCompany();

  const [activeTab, setActiveTab] = useState<'transactions' | 'invoices' | 'methods'>('transactions');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [statusFilter] = useState<string>('all');

  // Data state
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data on mount
  useEffect(() => {
    if (companyId) {
      loadPaymentData();
    }
  }, [companyId]);

  const loadPaymentData = async () => {
    if (!companyId) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch all data in parallel
      const [methodsData, invoicesData, projectsData] = await Promise.all([
        paymentService.getPaymentMethods().catch(() => []),
        paymentService.getInvoices().catch(() => []),
        getClientProjects(companyId).catch(() => []),
      ]);

      // Transform payment methods
      const transformedMethods: PaymentMethod[] = (methodsData || []).map((m: any) => ({
        id: m.id,
        type: m.type === 'card' ? 'credit_card' : m.type,
        last4: m.card?.last4 || m.last4 || '****',
        brand: m.card?.brand || m.brand || 'Unknown',
        expiryMonth: m.card?.exp_month || m.expiryMonth,
        expiryYear: m.card?.exp_year || m.expiryYear,
        isDefault: m.isDefault || false,
        billingAddress: m.billing_details?.address || m.billingAddress || {
          line1: '',
          city: '',
          state: '',
          postalCode: '',
          country: 'US',
        },
      }));
      setPaymentMethods(transformedMethods);

      // Transform invoices
      // Note: Invoice amounts from Stripe are in cents, convert to dollars
      const transformedInvoices: Invoice[] = (invoicesData || []).map((inv: any) => ({
        id: inv.id,
        invoiceNumber: inv.invoice_number || inv.number || `INV-${inv.id.slice(0, 8)}`,
        projectId: inv.project_id,
        projectName: inv.project_name || 'Project',
        amount: (Number(inv.subtotal) || Number(inv.amount) || 0) / 100,
        taxAmount: (Number(inv.tax) || 0) / 100,
        totalAmount: (Number(inv.total) || Number(inv.amount) || 0) / 100,
        status: inv.status === 'paid' ? 'paid' : inv.status === 'open' ? 'pending' : inv.status,
        issueDate: new Date(inv.created_at || inv.issue_date),
        dueDate: new Date(inv.due_date || inv.created_at),
        paidDate: inv.paid_at ? new Date(inv.paid_at) : undefined,
        items: inv.lines?.data?.map((line: any) => ({
          description: line.description || 'Service',
          quantity: line.quantity || 1,
          unitPrice: (line.amount || 0) / 100,
          amount: (line.amount || 0) / 100,
        })) || [],
        downloadUrl: inv.invoice_pdf || inv.hosted_invoice_url || '#',
      }));
      setInvoices(transformedInvoices);

      // Fetch payments for all projects and combine
      const projects = Array.isArray(projectsData) ? projectsData : [];
      const allTransactions: Transaction[] = [];

      for (const project of projects) {
        try {
          const payments = await paymentService.getProjectPayments(companyId, project.id);
          // Note: Payment amounts from Stripe are in cents as strings, parse and convert to dollars
          const projectPayments = (payments || []).map((p: any): Transaction => ({
            id: p.id,
            type: (p.payment_type === 'refund' ? 'refund' : 'payment') as 'payment' | 'refund' | 'invoice',
            status: (p.status === 'completed' ? 'completed' : p.status === 'pending' ? 'pending' : 'failed') as 'completed' | 'pending' | 'failed',
            amount: (Number(p.amount) || 0) / 100, // Parse string to number and convert cents to dollars
            projectId: p.project_id,
            projectName: project.name || 'Project',
            description: p.description || `${p.payment_type} Payment`,
            date: new Date(p.transaction_date || p.created_at),
            paymentMethod: p.payment_method ? `${p.payment_method} •••• ****` : 'Card',
            invoiceNumber: p.invoice_number,
            receiptUrl: p.invoice_url || '#',
          }));
          allTransactions.push(...projectPayments);
        } catch (err) {
          console.warn(`Failed to load payments for project ${project.id}:`, err);
        }
      }

      // Sort by date descending
      allTransactions.sort((a, b) => b.date.getTime() - a.date.getTime());
      setTransactions(allTransactions);

    } catch (err: any) {
      console.error('Failed to load payment data:', err);
      setError(err.message || 'Failed to load payment data');
    } finally {
      setLoading(false);
    }
  };

  // Use fetched data or fallback to empty arrays
  const displayTransactions = transactions.length > 0 ? transactions : [];
  const displayPaymentMethods = paymentMethods.length > 0 ? paymentMethods : [];
  const displayInvoices = invoices.length > 0 ? invoices : [];

  const stats = {
    totalPaid: displayTransactions
      .filter((t) => t.type === 'payment' && t.status === 'completed')
      .reduce((sum, t) => sum + t.amount, 0),
    pendingPayments: displayTransactions.filter(
      (t) => t.type === 'payment' && t.status === 'pending'
    ).length,
    completedTransactions: displayTransactions.filter((t) => t.status === 'completed').length,
    overdueInvoices: displayInvoices.filter((i) => i.status === 'overdue').length,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'paid':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'failed':
      case 'overdue':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'paid':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'failed':
      case 'overdue':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const filteredTransactions = displayTransactions.filter((transaction) => {
    const matchesSearch =
      transaction.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const renderTransactions = () => (
    <div className="space-y-4">
      {filteredTransactions.map((transaction, index) => (
        <motion.div
          key={transaction.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="bg-white/80 backdrop-blur-lg rounded-xl p-6 shadow-lg border border-gray-200 hover:border-blue-300 transition-colors"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4 flex-1">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  transaction.type === 'payment'
                    ? 'bg-gradient-to-br from-green-100 to-emerald-100'
                    : 'bg-gradient-to-br from-blue-100 to-cyan-100'
                }`}
              >
                {transaction.type === 'payment' ? (
                  <ArrowUpRight className="w-6 h-6 text-green-600" />
                ) : (
                  <ArrowDownRight className="w-6 h-6 text-blue-600" />
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">
                      {transaction.description}
                    </h3>
                    <p className="text-sm text-gray-600">{transaction.projectName}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-gray-900">
                      ${transaction.amount.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">
                      {transaction.date.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-1 ${getStatusColor(
                        transaction.status
                      )}`}
                    >
                      {getStatusIcon(transaction.status)}
                      <span className="capitalize">{transaction.status}</span>
                    </span>
                    <span className="text-sm text-gray-600">{transaction.paymentMethod}</span>
                    {transaction.invoiceNumber && (
                      <span className="text-sm text-gray-600">
                        {transaction.invoiceNumber}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    {transaction.receiptUrl && (
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <Download className="w-4 h-4 text-gray-600" />
                      </button>
                    )}
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                      <Eye className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );

  const renderInvoices = () => (
    <div className="space-y-4">
      {displayInvoices.length === 0 && !loading && (
        <div className="text-center py-12 bg-white/80 backdrop-blur-lg rounded-xl border border-gray-200">
          <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900 mb-2">No invoices yet</h3>
          <p className="text-gray-600">Your invoices will appear here once you have payments.</p>
        </div>
      )}
      {displayInvoices.map((invoice, index) => (
        <motion.div
          key={invoice.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="bg-white/80 backdrop-blur-lg rounded-xl p-6 shadow-lg border border-gray-200"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl flex items-center justify-center">
                <Receipt className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-1">{invoice.invoiceNumber}</h3>
                <p className="text-sm text-gray-600 mb-2">{invoice.projectName}</p>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-1 w-fit ${getStatusColor(
                    invoice.status
                  )}`}
                >
                  {getStatusIcon(invoice.status)}
                  <span className="capitalize">{invoice.status}</span>
                </span>
              </div>
            </div>

            <div className="text-right">
              <div className="text-3xl font-black text-gray-900 mb-1">
                ${invoice.totalAmount.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">
                Due:{' '}
                {invoice.dueDate.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <div className="space-y-2 mb-4">
              {invoice.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">{item.description}</span>
                  <span className="font-semibold text-gray-900">
                    ${item.amount.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="flex items-center space-x-3 text-sm text-gray-600">
                <span>
                  Issued:{' '}
                  {invoice.issueDate.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
                {invoice.paidDate && (
                  <span>
                    • Paid:{' '}
                    {invoice.paidDate.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-2">
                {invoice.status === 'pending' && (
                  <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all">
                    Pay Now
                  </button>
                )}
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <Eye className="w-4 h-4 text-gray-600" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <Download className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );

  const renderPaymentMethods = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900">Saved Payment Methods</h3>
        <button
          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Payment Method</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayPaymentMethods.length === 0 && (
          <div className="col-span-2 text-center py-12 bg-white/80 backdrop-blur-lg rounded-xl border border-gray-200">
            <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">No payment methods</h3>
            <p className="text-gray-600 mb-4">Add a payment method to make payments.</p>
            <button
              className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Payment Method</span>
            </button>
          </div>
        )}
        {displayPaymentMethods.map((method, index) => (
          <motion.div
            key={method.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white/80 backdrop-blur-lg rounded-xl p-6 shadow-lg border-2 border-gray-200 hover:border-blue-300 transition-colors"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="font-bold text-gray-900">
                    {method.brand} •••• {method.last4}
                  </div>
                  <div className="text-sm text-gray-600">
                    Expires {method.expiryMonth}/{method.expiryYear}
                  </div>
                </div>
              </div>
              {method.isDefault && (
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                  Default
                </span>
              )}
            </div>

            <div className="text-sm text-gray-600 mb-4">
              <div className="flex items-start space-x-2">
                <Building2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>
                  <div>{method.billingAddress.line1 || 'No address on file'}</div>
                  {method.billingAddress.city && (
                    <div>
                      {method.billingAddress.city}, {method.billingAddress.state}{' '}
                      {method.billingAddress.postalCode}
                    </div>
                  )}
                  <div>{method.billingAddress.country}</div>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-4 border-t border-gray-200">
              {!method.isDefault && (
                <button className="flex-1 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg font-semibold hover:bg-blue-100 transition-colors">
                  Set as Default
                </button>
              )}
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Edit className="w-4 h-4 text-gray-600" />
              </button>
              <button className="p-2 hover:bg-red-100 rounded-lg transition-colors">
                <Trash2 className="w-4 h-4 text-red-600" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  // Show loading state
  if (companyLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payments...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-6 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Payments</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={loadPaymentData}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Payments
          </h1>
          <p className="text-gray-600">Manage payments, invoices, and billing information</p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/80 backdrop-blur-lg rounded-xl p-6 shadow-lg border-2 border-green-200"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <div className="text-3xl font-black text-gray-900">
              ${(stats.totalPaid / 1000).toFixed(0)}K
            </div>
            <div className="text-sm text-gray-600">Total Paid</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/80 backdrop-blur-lg rounded-xl p-6 shadow-lg border-2 border-yellow-200"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
            <div className="text-3xl font-black text-gray-900">{stats.pendingPayments}</div>
            <div className="text-sm text-gray-600">Pending Payments</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/80 backdrop-blur-lg rounded-xl p-6 shadow-lg border-2 border-blue-200"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="text-3xl font-black text-gray-900">
              {stats.completedTransactions}
            </div>
            <div className="text-sm text-gray-600">Completed Transactions</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/80 backdrop-blur-lg rounded-xl p-6 shadow-lg border-2 border-purple-200"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Wallet className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="text-3xl font-black text-gray-900">
              {displayPaymentMethods.length}
            </div>
            <div className="text-sm text-gray-600">Payment Methods</div>
          </motion.div>
        </div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/80 backdrop-blur-lg rounded-xl shadow-lg border border-gray-200 mb-6"
        >
          <div className="flex space-x-8 p-4 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('transactions')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold transition-colors ${
                activeTab === 'transactions'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Receipt className="w-5 h-5" />
              <span>Transactions</span>
            </button>
            <button
              onClick={() => setActiveTab('invoices')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold transition-colors ${
                activeTab === 'invoices'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <FileText className="w-5 h-5" />
              <span>Invoices</span>
            </button>
            <button
              onClick={() => setActiveTab('methods')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold transition-colors ${
                activeTab === 'methods'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <CreditCard className="w-5 h-5" />
              <span>Payment Methods</span>
            </button>
          </div>

          {/* Search and Filter - Only for transactions and invoices */}
          {(activeTab === 'transactions' || activeTab === 'invoices') && (
            <div className="p-4">
              <div className="flex items-center space-x-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  onClick={() => setShowFilterMenu(!showFilterMenu)}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <Filter className="w-5 h-5 text-gray-600" />
                  <span className="font-semibold text-gray-700">Filter</span>
                </button>
              </div>
            </div>
          )}
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          {activeTab === 'transactions' && renderTransactions()}
          {activeTab === 'invoices' && renderInvoices()}
          {activeTab === 'methods' && renderPaymentMethods()}
        </motion.div>
      </div>
    </div>
  );
};

export default Payments;
