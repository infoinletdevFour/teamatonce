import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Database,
  Sparkles,
  Users,
  Send,
  RefreshCw,
  Clock,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { toast } from 'sonner';
import StatsCard from '@/components/data-engine/StatsCard';
import * as api from '@/services/dataEngineService';
import type { DashboardData, ScoreDistribution } from '@/types/data-engine';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [scoreDistribution, setScoreDistribution] = useState<ScoreDistribution[]>([]);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [dashboard, distribution] = await Promise.allSettled([
        api.getDashboard(),
        api.getScoreDistribution(),
      ]);

      if (dashboard.status === 'fulfilled') {
        setData(dashboard.value);
      } else {
        throw new Error('Failed to load dashboard data');
      }

      if (distribution.status === 'fulfilled') {
        setScoreDistribution(distribution.value);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load dashboard';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const handler = () => fetchData();
    window.addEventListener('data-engine-refresh', handler);
    return () => window.removeEventListener('data-engine-refresh', handler);
  }, [fetchData]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <AlertCircle className="w-12 h-12 text-red-400 mb-3" />
        <p className="text-red-600 text-sm">{error}</p>
        <button onClick={fetchData} className="text-blue-600 text-sm mt-2 hover:underline">
          Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  const freshness = (dateStr?: string) => {
    if (!dateStr) return 'text-gray-400';
    const diffHrs = (Date.now() - new Date(dateStr).getTime()) / 3600000;
    if (diffHrs < 24) return 'text-green-600';
    if (diffHrs < 72) return 'text-yellow-600';
    return 'text-red-600';
  };

  const sourceEntries = data.crawl?.bySource ? Object.entries(data.crawl.bySource) : [];
  const outreach = data.outreach || {} as any;
  const entities = data.entities || {} as any;
  const enrichment = data.enrichment || {} as any;
  const enrichmentQueue = data.enrichmentQueue || {} as any;
  const outreachQueue = data.outreachQueue || {} as any;

  const enrichedRatio = enrichment.totalCrawled
    ? Math.round((enrichment.totalEnriched / enrichment.totalCrawled) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Auto-refresh toggle */}
      <div className="flex justify-end">
        <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer">
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          Auto-refresh (30s)
        </label>
      </div>

      {/* Pipeline Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          icon={Database}
          label="Total Crawled"
          value={data.crawl?.totalCrawled ?? 0}
          gradient="from-blue-500 to-cyan-500"
          delay={0}
          onClick={() => navigate('crawling')}
        />
        <StatsCard
          icon={Sparkles}
          label="Total Enriched"
          value={enrichment.totalEnriched ?? 0}
          gradient="from-purple-500 to-pink-500"
          delay={0.05}
          onClick={() => navigate('data')}
        />
        <StatsCard
          icon={Users}
          label="Unified Entities"
          value={entities.total ?? 0}
          gradient="from-green-500 to-emerald-500"
          delay={0.1}
          onClick={() => navigate('entities')}
        />
        <StatsCard
          icon={Send}
          label="Outreach Sent"
          value={outreach.totalSent ?? 0}
          gradient="from-orange-500 to-red-500"
          delay={0.15}
          onClick={() => navigate('outreach')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Crawl Health */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm border border-gray-100"
        >
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Crawl Health</h2>
            <button
              onClick={() => navigate('crawling')}
              className="text-xs text-blue-600 hover:underline"
            >
              View All
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Today</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Week</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Last Crawl</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sourceEntries.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-sm text-gray-400">
                      No crawl data yet
                    </td>
                  </tr>
                ) : (
                  sourceEntries.map(([source, stats]) => (
                    <tr key={source} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm font-medium text-gray-900 capitalize">{source}</td>
                      <td className="px-4 py-2 text-sm text-gray-600 text-right">{stats.today}</td>
                      <td className="px-4 py-2 text-sm text-gray-600 text-right">{stats.thisWeek}</td>
                      <td className="px-4 py-2 text-sm text-gray-600 text-right">{stats.total}</td>
                      <td className={`px-4 py-2 text-sm text-right font-medium ${freshness(stats.lastCrawl)}`}>
                        {stats.lastCrawl ? new Date(stats.lastCrawl).toLocaleDateString() : 'Never'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Enrichment Pipeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Enrichment Pipeline</h2>
            <button
              onClick={() => navigate('data')}
              className="text-xs text-blue-600 hover:underline"
            >
              View All
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-500">Enriched / Crawled</span>
                <span className="text-xs font-medium text-gray-700">{enrichedRatio}%</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full">
                <div
                  className="h-2 bg-purple-500 rounded-full transition-all"
                  style={{ width: `${enrichedRatio}%` }}
                />
              </div>
            </div>

            {enrichment.vectorCounts && (
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Profile Vectors</p>
                  <p className="text-lg font-bold text-gray-900">
                    {(enrichment.vectorCounts.profiles ?? 0).toLocaleString()}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Job Post Vectors</p>
                  <p className="text-lg font-bold text-gray-900">
                    {(enrichment.vectorCounts.jobPosts ?? 0).toLocaleString()}
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-yellow-500" />
                  <span className="text-lg font-bold text-gray-900">{enrichmentQueue.pending ?? 0}</span>
                </div>
                <p className="text-xs text-gray-500">Pending</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <RefreshCw className="w-3.5 h-3.5 text-blue-500" />
                  <span className="text-lg font-bold text-gray-900">{enrichmentQueue.processing ?? 0}</span>
                </div>
                <p className="text-xs text-gray-500">Processing</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                  <span className="text-lg font-bold text-gray-900">{enrichmentQueue.failed ?? 0}</span>
                </div>
                <p className="text-xs text-gray-500">Failed</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Entity Resolution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Entity Resolution</h2>
            <button
              onClick={() => navigate('entities')}
              className="text-xs text-blue-600 hover:underline"
            >
              View All
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {entities.byType && Object.entries(entities.byType).map(([type, count]) => (
              <div key={type} className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 capitalize">{type}s</p>
                <p className="text-lg font-bold text-gray-900">{(count as number).toLocaleString()}</p>
              </div>
            ))}
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">With Email</p>
              <p className="text-lg font-bold text-gray-900">{(entities.withEmail ?? 0).toLocaleString()}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Avg Sources</p>
              <p className="text-lg font-bold text-gray-900">{entities.avgSources?.toFixed(1) ?? '0'}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">New This Week</p>
              <p className="text-lg font-bold text-green-600">{(entities.newThisWeek ?? 0).toLocaleString()}</p>
            </div>
          </div>
        </motion.div>

        {/* Outreach Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Outreach Overview</h2>
            <button
              onClick={() => navigate('outreach')}
              className="text-xs text-blue-600 hover:underline"
            >
              View All
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Open Rate</p>
              <p className="text-lg font-bold text-gray-900">{(outreach.openRate ?? 0).toFixed(1)}%</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Click Rate</p>
              <p className="text-lg font-bold text-gray-900">{(outreach.clickRate ?? 0).toFixed(1)}%</p>
            </div>
            {outreach.byStatus && Object.entries(outreach.byStatus).map(([status, count]) => (
              <div key={status} className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 capitalize">{status}</p>
                <p className="text-lg font-bold text-gray-900">{(count as number).toLocaleString()}</p>
              </div>
            ))}
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500">Bounced</p>
              <p className="text-lg font-bold text-red-600">{(outreach.totalBounced ?? 0).toLocaleString()}</p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <Clock className="w-3.5 h-3.5 text-yellow-500" />
                <span className="text-sm font-bold text-gray-900">{outreachQueue.pending ?? 0}</span>
              </div>
              <p className="text-xs text-gray-500">Queue Pending</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                <span className="text-sm font-bold text-gray-900">{outreachQueue.completed ?? 0}</span>
              </div>
              <p className="text-xs text-gray-500">Queue Done</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Score Distribution Charts */}
      {scoreDistribution.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
        >
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Score Distribution</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {scoreDistribution.map((dist) => (
              <div key={dist.dimension}>
                <h3 className="text-xs font-medium text-gray-500 uppercase mb-2 capitalize">
                  {dist.dimension}
                </h3>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={dist.buckets}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="range" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar
                      dataKey="count"
                      fill={
                        dist.dimension === 'quality'
                          ? '#3b82f6'
                          : dist.dimension === 'activity'
                          ? '#22c55e'
                          : dist.dimension === 'completeness'
                          ? '#a855f7'
                          : '#f97316'
                      }
                      radius={[2, 2, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Dashboard;
