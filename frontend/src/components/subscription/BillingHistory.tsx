/**
 * Billing History Component
 * Displays invoice history with download functionality
 */

import React, { useState, useEffect } from 'react';
import { Download, FileText, CheckCircle, Clock, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { paymentService } from '@/services/paymentService';

interface Invoice {
  id: string;
  invoiceNumber: string;
  date: Date;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'failed';
  description: string;
  pdfUrl?: string;
}

interface BillingHistoryProps {
  limit?: number;
  showLoadMore?: boolean;
}

export const BillingHistory: React.FC<BillingHistoryProps> = ({
  limit,
  showLoadMore = true,
}) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [displayLimit, setDisplayLimit] = useState(limit || 10);

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const data = await paymentService.getInvoices();

      // Map backend data to frontend structure
      const mappedInvoices: Invoice[] = data.map((inv: any) => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber || inv.id,
        date: new Date(inv.createdAt || inv.date),
        amount: inv.amount,
        currency: inv.currency || 'USD',
        status: inv.status === 'completed' ? 'paid' : inv.status === 'pending' ? 'pending' : 'failed',
        description: inv.description || 'Subscription Payment',
        pdfUrl: inv.pdfUrl || inv.invoiceUrl,
      }));

      setInvoices(mappedInvoices);
    } catch (error) {
      console.error('Failed to load invoices:', error);
      toast.error('Failed to load billing history');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (invoice: Invoice) => {
    try {
      setDownloadingId(invoice.id);

      if (invoice.pdfUrl) {
        // Open PDF in new tab
        window.open(invoice.pdfUrl, '_blank');
      } else {
        // Fetch invoice PDF from backend
        const invoiceData = await paymentService.getInvoice(invoice.id);

        if (invoiceData.pdfUrl) {
          window.open(invoiceData.pdfUrl, '_blank');
        } else {
          toast.error('Invoice PDF not available');
        }
      }

      toast.success('Invoice downloaded');
    } catch (error) {
      console.error('Failed to download invoice:', error);
      toast.error('Failed to download invoice');
    } finally {
      setDownloadingId(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <FileText className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount);
  };

  const displayedInvoices = limit ? invoices.slice(0, displayLimit) : invoices;

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Billing History</h3>
        <p className="text-gray-600">
          You don't have any invoices yet. Your billing history will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Billing History</h3>
          <p className="text-sm text-gray-600 mt-1">
            View and download your invoices
          </p>
        </div>
      </div>

      {/* Invoices List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Invoice
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {displayedInvoices.map((invoice, index) => (
                <motion.tr
                  key={invoice.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <FileText className="w-5 h-5 text-gray-400 mr-3" />
                      <span className="font-medium text-gray-900">
                        {invoice.invoiceNumber}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {formatDate(invoice.date)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {invoice.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatAmount(invoice.amount, invoice.currency)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                        invoice.status
                      )}`}
                    >
                      {getStatusIcon(invoice.status)}
                      <span className="capitalize">{invoice.status}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                      onClick={() => handleDownload(invoice)}
                      disabled={downloadingId === invoice.id}
                      className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {downloadingId === invoice.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      <span>Download</span>
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Load More Button */}
      {showLoadMore && limit && displayedInvoices.length < invoices.length && (
        <div className="text-center">
          <button
            onClick={() => setDisplayLimit(displayLimit + 10)}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
          >
            Load More Invoices
          </button>
        </div>
      )}

      {/* Summary */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Total Invoices</span>
          <span className="font-semibold text-gray-900">{invoices.length}</span>
        </div>
      </div>
    </div>
  );
};

export default BillingHistory;
