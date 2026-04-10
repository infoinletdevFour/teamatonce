import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams } from 'react-router-dom';
import {
  DollarSign, TrendingUp, Clock, CheckCircle2, CreditCard,
  Calendar, Download, Search, ArrowUpRight,
  Wallet, Shield, Plus, Settings, AlertCircle, Loader2
} from 'lucide-react';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { format } from 'date-fns';
import { StatusBadge, SecurityIndicator, MilestoneCard } from '@/components/payment';
import { paymentService } from '@/services/paymentService';
import { milestoneService } from '@/services/milestoneService';
import { useCompany } from '@/contexts/CompanyContext';
import type { Payment, PaymentStats, Currency, Milestone } from '@/types/payment';
import type { Milestone as MilestoneType, DeliverableFile } from '@/types/milestone';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const PaymentDashboard: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { company } = useCompany();
  const companyId = company?.id || '';

  const [selectedCurrency, setSelectedCurrency] = useState<Currency>('USD');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed' | 'failed'>('all');

  // Data states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [transactions, setTransactions] = useState<Payment[]>([]);

  useEffect(() => {
    if (projectId && companyId) {
      loadPaymentData();
    }
  }, [projectId, companyId]);

  const loadPaymentData = async () => {
    if (!projectId || !companyId) return;

    try {
      setLoading(true);
      setError(null);

      // Load all data in parallel
      const [paymentsData, statsData, milestonesData] = await Promise.all([
        paymentService.getProjectPayments(companyId, projectId).catch(() => []),
        paymentService.getProjectPaymentStats(companyId, projectId).catch(() => null),
        milestoneService.getProjectMilestones(companyId, projectId).catch(() => ({ milestones: [] })),
      ]);

      // Convert payments to frontend format
      const convertedPayments = paymentsData.map(p => paymentService.convertToPayment(p));
      setTransactions(convertedPayments);

      // Set stats (use calculated values if API doesn't return stats)
      // Note: Stats amounts from API may be strings and in cents, parse and convert to dollars
      if (statsData) {
        setStats({
          totalEarned: (Number(statsData.totalAmount) || 0) / 100,
          totalPaid: (Number(statsData.paidAmount) || 0) / 100,
          inEscrow: (Number(statsData.pendingAmount) || 0) / 100,
          pendingPayments: Number(statsData.pendingPayments) || 0,
          completedPayments: Number(statsData.completedPayments) || 0,
          currency: selectedCurrency,
        });
      } else {
        // Calculate from transactions
        const totalEarned = convertedPayments.reduce((sum, p) => sum + p.amount, 0);
        const totalPaid = convertedPayments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0);
        const inEscrow = convertedPayments.filter(p => p.status === 'pending' || p.status === 'processing').reduce((sum, p) => sum + p.amount, 0);
        setStats({
          totalEarned,
          totalPaid,
          inEscrow,
          pendingPayments: convertedPayments.filter(p => p.status === 'pending').length,
          completedPayments: convertedPayments.filter(p => p.status === 'completed').length,
          currency: selectedCurrency,
        });
      }

      // Convert milestones to payment Milestone format
      const convertedMilestones: Milestone[] = (milestonesData.milestones || []).map((m: MilestoneType) => ({
        id: m.id,
        projectId: m.id, // Use milestone id as projectId for now
        title: m.title,
        description: m.description || '',
        amount: Number(m.amount) || 0, // Parse string to number (milestones stored in dollars)
        currency: 'USD' as Currency,
        status: convertMilestoneStatus(m.status),
        dueDate: m.dueDate ? new Date(m.dueDate) : new Date(),
        completedDate: m.status === 'completed' ? new Date() : undefined,
        deliverables: (m.deliverables || []).map((d, idx) => {
          const isFileObject = typeof d === 'object' && 'title' in d;
          return {
            id: `d-${idx}`,
            milestoneId: m.id,
            title: isFileObject ? (d as DeliverableFile).title : (d as string),
            description: isFileObject ? ((d as DeliverableFile).description || '') : '',
            fileName: isFileObject ? (d as DeliverableFile).fileName : undefined,
            fileSize: isFileObject ? (d as DeliverableFile).fileSize : undefined,
            fileUrl: isFileObject ? (d as DeliverableFile).fileUrl : undefined,
            uploadedAt: isFileObject ? new Date((d as DeliverableFile).uploadedAt) : undefined,
          };
        }),
        createdAt: new Date(m.createdAt),
        updatedAt: new Date(m.updatedAt),
      }));
      setMilestones(convertedMilestones);

    } catch (err) {
      console.error('Error loading payment data:', err);
      setError('Failed to load payment data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const convertMilestoneStatus = (status: string): 'pending' | 'in-progress' | 'review' | 'completed' | 'paid' | 'disputed' => {
    switch (status) {
      case 'pending': return 'pending';
      case 'in_progress': return 'in-progress';
      case 'submitted': return 'review';
      case 'feedback_required': return 'review';
      case 'completed': return 'completed';
      case 'approved': return 'paid';
      default: return 'pending';
    }
  };

  // Chart data based on real transactions
  const getChartData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const earningsData = months.map(() => 0);
    const paymentsData = months.map(() => 0);

    transactions.forEach(t => {
      const month = new Date(t.createdAt).getMonth();
      if (month < 6) {
        earningsData[month] += t.amount;
        if (t.status === 'completed') {
          paymentsData[month] += t.amount;
        }
      }
    });

    return {
      labels: months,
      datasets: [
        {
          label: 'Earnings',
          data: earningsData,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          fill: true
        },
        {
          label: 'Payments',
          data: paymentsData,
          borderColor: 'rgb(168, 85, 247)',
          backgroundColor: 'rgba(168, 85, 247, 0.1)',
          tension: 0.4,
          fill: true
        }
      ]
    };
  };

  const getDoughnutData = () => {
    const completed = transactions.filter(t => t.status === 'completed').length;
    const pending = transactions.filter(t => t.status === 'pending').length;
    const processing = transactions.filter(t => t.status === 'processing').length;
    const failed = transactions.filter(t => t.status === 'failed').length;

    return {
      labels: ['Completed', 'Processing', 'Pending', 'Failed'],
      datasets: [
        {
          data: [completed, processing, pending, failed],
          backgroundColor: [
            'rgba(34, 197, 94, 0.8)',
            'rgba(59, 130, 246, 0.8)',
            'rgba(156, 163, 175, 0.8)',
            'rgba(239, 68, 68, 0.8)'
          ],
          borderWidth: 0
        }
      ]
    };
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.transactionId?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || t.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading payment data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl p-8 shadow-lg max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Data</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadPaymentData}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center shadow-lg">
                <Wallet className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-black text-gray-900">Payment Dashboard</h1>
                <p className="text-gray-600 mt-1">Manage your payments and transactions</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value as Currency)}
                className="px-4 py-2 rounded-xl border-2 border-gray-300 font-semibold focus:border-blue-500 focus:outline-none"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="JPY">JPY (¥)</option>
              </select>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-semibold shadow-lg flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                New Payment
              </motion.button>
            </div>
          </div>

          <SecurityIndicator level="high" />
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            whileHover={{ y: -4, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
            className="bg-white rounded-2xl p-6 border-2 border-gray-200 shadow-lg"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <span className="text-green-600 text-sm font-semibold flex items-center gap-1">
                <ArrowUpRight className="w-4 h-4" />
                +12.5%
              </span>
            </div>
            <div className="text-3xl font-black text-gray-900 mb-1">
              {formatCurrency(stats?.totalEarned || 0, stats?.currency || 'USD')}
            </div>
            <div className="text-sm text-gray-600">Total Earned</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ y: -4, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
            className="bg-white rounded-2xl p-6 border-2 border-gray-200 shadow-lg"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <span className="text-blue-600 text-sm font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                Paid
              </span>
            </div>
            <div className="text-3xl font-black text-gray-900 mb-1">
              {formatCurrency(stats?.totalPaid || 0, stats?.currency || 'USD')}
            </div>
            <div className="text-sm text-gray-600">Total Paid Out</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            whileHover={{ y: -4, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
            className="bg-white rounded-2xl p-6 border-2 border-gray-200 shadow-lg"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <span className="text-purple-600 text-sm font-semibold">Secured</span>
            </div>
            <div className="text-3xl font-black text-gray-900 mb-1">
              {formatCurrency(stats?.inEscrow || 0, stats?.currency || 'USD')}
            </div>
            <div className="text-sm text-gray-600">In Escrow</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            whileHover={{ y: -4, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
            className="bg-white rounded-2xl p-6 border-2 border-gray-200 shadow-lg"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <span className="text-orange-600 text-sm font-semibold">{stats?.pendingPayments || 0} pending</span>
            </div>
            <div className="text-3xl font-black text-gray-900 mb-1">
              {stats?.completedPayments || 0}
            </div>
            <div className="text-sm text-gray-600">Completed Payments</div>
          </motion.div>
        </div>

        {/* Charts Section */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="lg:col-span-2 bg-white rounded-2xl p-6 border-2 border-gray-200 shadow-lg"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Payment Trends
            </h3>
            <Line
              data={getChartData()}
              options={{
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                  legend: {
                    display: true,
                    position: 'top'
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true
                  }
                }
              }}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-2xl p-6 border-2 border-gray-200 shadow-lg"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-purple-600" />
              Payment Status
            </h3>
            <Doughnut
              data={getDoughnutData()}
              options={{
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                  legend: {
                    display: true,
                    position: 'bottom'
                  }
                }
              }}
            />
          </motion.div>
        </div>

        {/* Active Milestones */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-blue-600" />
            Active Milestones
          </h2>
          {milestones.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {milestones.map((milestone, index) => (
                <motion.div
                  key={milestone.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                >
                  <MilestoneCard
                    milestone={milestone}
                    showActions={true}
                    onViewDetails={() => {/* Navigate to milestone details */}}
                  />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-8 text-center border-2 border-gray-200">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No active milestones found</p>
            </div>
          )}
        </motion.div>

        {/* Transaction History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="bg-white rounded-2xl p-6 border-2 border-gray-200 shadow-lg"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-blue-600" />
              Transaction History
            </h2>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search transactions..."
                  className="pl-10 pr-4 py-2 rounded-xl border-2 border-gray-300 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-4 py-2 rounded-xl border-2 border-gray-300 font-semibold focus:border-blue-500 focus:outline-none"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors flex items-center gap-2"
              >
                <Download className="w-5 h-5" />
                Export
              </motion.button>
            </div>
          </div>

          {filteredTransactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-4 px-4 font-bold text-gray-700">Transaction ID</th>
                    <th className="text-left py-4 px-4 font-bold text-gray-700">Date</th>
                    <th className="text-left py-4 px-4 font-bold text-gray-700">Amount</th>
                    <th className="text-left py-4 px-4 font-bold text-gray-700">Method</th>
                    <th className="text-left py-4 px-4 font-bold text-gray-700">Status</th>
                    <th className="text-right py-4 px-4 font-bold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((transaction, index) => (
                    <motion.tr
                      key={transaction.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-gray-100 hover:bg-blue-50 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <div className="font-semibold text-gray-900">{transaction.id}</div>
                        {transaction.transactionId && (
                          <div className="text-xs text-gray-500">{transaction.transactionId}</div>
                        )}
                      </td>
                      <td className="py-4 px-4 text-gray-600">
                        {format(transaction.createdAt, 'MMM dd, yyyy')}
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-bold text-gray-900">
                          {formatCurrency(transaction.amount, transaction.currency)}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-sm font-semibold">
                          {transaction.method === 'escrow' && <Shield className="w-4 h-4" />}
                          {transaction.method === 'card' && <CreditCard className="w-4 h-4" />}
                          {transaction.method.charAt(0).toUpperCase() + transaction.method.slice(1)}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <StatusBadge status={transaction.status} size="sm" />
                      </td>
                      <td className="py-4 px-4 text-right">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="text-blue-600 font-semibold hover:text-blue-700"
                        >
                          View
                        </motion.button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No transactions found</p>
            </div>
          )}
        </motion.div>

        {/* Payment Methods */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          className="mt-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold mb-2">Payment Methods</h3>
              <p className="text-blue-100">Manage your payment methods and preferences</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-white text-blue-600 px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg"
            >
              <Settings className="w-5 h-5" />
              Manage Methods
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PaymentDashboard;
