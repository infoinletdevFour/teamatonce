import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Flag, RefreshCw, Eye, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { getReports, reviewReport } from '@/services/adminService';
import { Report, PaginatedResponse } from '@/types/admin';
import { toast } from 'sonner';

const AdminReports: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response: PaginatedResponse<Report> = await getReports({ page, limit: 20, status: statusFilter || undefined });
      setReports(response.data || []);
      setTotalPages(response.totalPages || 1);
      setTotal(response.total || 0);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReports(); }, [page, statusFilter]);

  const handleQuickResolve = async (reportId: string, resolution: 'no_action' | 'content_removed') => {
    try {
      await reviewReport(reportId, { resolution, notes: 'Quick resolved by admin' });
      toast.success('Report resolved');
      fetchReports();
    } catch {
      toast.error('Failed to resolve report');
    }
  };

  const getReasonColor = (reason: string) => {
    const colors: Record<string, string> = {
      spam: 'bg-yellow-100 text-yellow-700',
      inappropriate: 'bg-orange-100 text-orange-700',
      fraud: 'bg-red-100 text-red-700',
      harassment: 'bg-purple-100 text-purple-700',
      other: 'bg-gray-100 text-gray-700',
    };
    return colors[reason] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Content Reports</h1>
        <p className="text-gray-500 mt-1">Review and moderate reported content</p>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex gap-4">
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="px-4 py-2 border border-gray-200 rounded-lg">
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="reviewing">Reviewing</option>
          <option value="resolved">Resolved</option>
          <option value="dismissed">Dismissed</option>
        </select>
        <button onClick={fetchReports} className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12"><RefreshCw className="w-8 h-8 animate-spin text-blue-600" /></div>
        ) : error ? (
          <div className="text-center py-12"><p className="text-red-600 mb-4">{error}</p><button onClick={fetchReports} className="text-blue-600">Retry</button></div>
        ) : reports.length === 0 ? (
          <div className="text-center py-12"><Flag className="w-12 h-12 text-gray-300 mx-auto mb-4" /><p className="text-gray-500">No reports found</p></div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reported By</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {reports.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4"><span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">{report.reportType}</span></td>
                  <td className="px-6 py-4"><span className={`px-2 py-1 text-xs font-medium rounded-full ${getReasonColor(report.reason)}`}>{report.reason}</span></td>
                  <td className="px-6 py-4 text-sm text-gray-500">{report.reporterName || report.reporterId}</td>
                  <td className="px-6 py-4"><span className={`px-2 py-1 text-xs font-medium rounded-full ${report.status === 'resolved' ? 'bg-green-100 text-green-700' : report.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>{report.status}</span></td>
                  <td className="px-6 py-4 text-sm text-gray-500">{new Date(report.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link to={`/admin/reports/${report.id}`} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Eye className="w-4 h-4" /></Link>
                      {report.status === 'pending' && (
                        <button onClick={() => handleQuickResolve(report.id, 'no_action')} className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg" title="Dismiss"><CheckCircle className="w-4 h-4" /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && !error && reports.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-500">Showing {reports.length} of {total}</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"><ChevronLeft className="w-5 h-5" /></button>
              <span className="text-sm">Page {page} of {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"><ChevronRight className="w-5 h-5" /></button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default AdminReports;
