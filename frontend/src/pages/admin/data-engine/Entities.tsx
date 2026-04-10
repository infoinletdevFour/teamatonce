import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Users,
  Mail,
  RefreshCw,
  Award,
} from 'lucide-react';
import { toast } from 'sonner';
import StatsCard from '@/components/data-engine/StatsCard';
import DataTable, { Column } from '@/components/data-engine/DataTable';
import JobProgressModal from '@/components/data-engine/JobProgressModal';
import { useJobProgress } from '@/hooks/useJobProgress';
import * as api from '@/services/dataEngineService';
import type { UnifiedEntity, EntityStats } from '@/types/data-engine';

const Entities: React.FC = () => {
  const navigate = useNavigate();
  const [entities, setEntities] = useState<UnifiedEntity[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<EntityStats | null>(null);
  const [typeFilter, setTypeFilter] = useState('');
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [batchLimit, setBatchLimit] = useState(100);
  const [batchResolveLoading, setBatchResolveLoading] = useState(false);
  const [batchScoreLoading, setBatchScoreLoading] = useState(false);

  // Job progress
  const resolveJob = useJobProgress();
  const scoreJob = useJobProgress();
  const [showResolveProgress, setShowResolveProgress] = useState(false);
  const [showScoreProgress, setShowScoreProgress] = useState(false);

  // Leaderboard state
  const [topEntities, setTopEntities] = useState<UnifiedEntity[]>([]);
  const [topSortBy, setTopSortBy] = useState('qualityScore');
  const [topMinScore, setTopMinScore] = useState(0);
  const [topLoading, setTopLoading] = useState(false);

  const fetchEntities = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params: Record<string, unknown> = { limit: 20, offset };
      if (typeFilter) params.entityType = typeFilter;
      const result = await api.getEntities(params as any);
      setEntities(result.data || []);
      setTotal(result.meta?.total ?? result.data?.length ?? 0);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load entities');
    } finally {
      setLoading(false);
    }
  }, [offset, typeFilter]);

  const fetchStats = useCallback(async () => {
    try {
      const s = await api.getEntityStats();
      setStats(s);
    } catch { /* non-critical */ }
  }, []);

  const fetchTop = useCallback(async () => {
    try {
      setTopLoading(true);
      const columnToApiField: Record<string, string> = {
        qualityScore: 'quality_score',
        activityScore: 'activity_score',
        completenessScore: 'completeness_score',
        availabilityScore: 'availability_score',
      };
      const result = await api.getTopScored({
        sortBy: columnToApiField[topSortBy] || topSortBy,
        minScore: topMinScore || undefined,
        limit: 10,
      });
      setTopEntities(result.data || []);
    } catch { /* non-critical */ }
    finally { setTopLoading(false); }
  }, [topSortBy, topMinScore]);

  useEffect(() => { fetchEntities(); fetchStats(); }, [fetchEntities, fetchStats]);
  useEffect(() => { fetchTop(); }, [fetchTop]);

  useEffect(() => {
    const handler = () => { fetchEntities(); fetchStats(); fetchTop(); };
    window.addEventListener('data-engine-refresh', handler);
    return () => window.removeEventListener('data-engine-refresh', handler);
  }, [fetchEntities, fetchStats, fetchTop]);

  const handleSelectEntity = (entity: UnifiedEntity) => {
    navigate(entity.id);
  };

  const handleBatchResolve = async () => {
    if (batchResolveLoading) return;
    try {
      setBatchResolveLoading(true);
      const { jobId } = await api.triggerBatchResolve({ limit: batchLimit });
      setShowResolveModal(false);
      setShowResolveProgress(true);
      resolveJob.startJob(jobId);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to start batch resolve');
    } finally {
      setBatchResolveLoading(false);
    }
  };

  const handleBatchScore = async () => {
    if (batchScoreLoading) return;
    try {
      setBatchScoreLoading(true);
      const { jobId } = await api.triggerBatchScore({ limit: batchLimit });
      setShowScoreModal(false);
      setShowScoreProgress(true);
      scoreJob.startJob(jobId);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to start batch score');
    } finally {
      setBatchScoreLoading(false);
    }
  };

  const entityColumns: Column<UnifiedEntity>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (e) => <span className="font-medium">{e.name}</span>,
    },
    {
      key: 'entityType',
      header: 'Type',
      render: (e) => (
        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
          e.entityType === 'person' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
        }`}>
          {e.entityType}
        </span>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      render: (e) => e.email || <span className="text-gray-400">-</span>,
    },
    {
      key: 'github',
      header: 'GitHub',
      render: (e) => e.github || <span className="text-gray-400">-</span>,
    },
    {
      key: 'sources',
      header: 'Sources',
      render: (e) => e.sources?.length ?? 0,
    },
    {
      key: 'qualityScore',
      header: 'Quality',
      render: (e) => e.qualityScore != null ? Math.round(e.qualityScore) : '-',
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (e) => new Date(e.createdAt).toLocaleDateString(),
    },
  ];

  const topColumns: Column<UnifiedEntity>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (e) => <span className="font-medium">{e.name}</span>,
    },
    {
      key: 'qualityScore',
      header: 'Quality',
      render: (e) => <span className="font-mono">{e.qualityScore != null ? Math.round(e.qualityScore) : '-'}</span>,
    },
    {
      key: 'activityScore',
      header: 'Activity',
      render: (e) => <span className="font-mono">{e.activityScore != null ? Math.round(e.activityScore) : '-'}</span>,
    },
    {
      key: 'completenessScore',
      header: 'Completeness',
      render: (e) => <span className="font-mono">{e.completenessScore != null ? Math.round(e.completenessScore) : '-'}</span>,
    },
    {
      key: 'availabilityScore',
      header: 'Availability',
      render: (e) => <span className="font-mono">{e.availabilityScore != null ? Math.round(e.availabilityScore) : '-'}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard icon={Users} label="Total Entities" value={stats.total} gradient="from-blue-500 to-cyan-500" delay={0} />
          <StatsCard
            icon={Users}
            label="Persons"
            value={stats.byType?.person ?? 0}
            gradient="from-purple-500 to-pink-500"
            delay={0.05}
          />
          <StatsCard
            icon={Users}
            label="Companies"
            value={stats.byType?.company ?? 0}
            gradient="from-green-500 to-emerald-500"
            delay={0.1}
          />
          <StatsCard icon={Mail} label="With Email" value={stats.withEmail} gradient="from-orange-500 to-red-500" delay={0.15} />
        </div>
      )}

      {/* Action Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setOffset(0); }}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Types</option>
          <option value="person">Person</option>
          <option value="company">Company</option>
        </select>
        <div className="ml-auto flex gap-2">
          <button
            onClick={() => setShowResolveModal(true)}
            className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
          >
            Batch Resolve
          </button>
          <button
            onClick={() => setShowScoreModal(true)}
            className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
          >
            Batch Score
          </button>
        </div>
      </div>

      {/* Entity Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <DataTable
          columns={entityColumns}
          data={entities}
          loading={loading}
          error={error || undefined}
          total={total}
          limit={20}
          offset={offset}
          onPageChange={setOffset}
          onRowClick={handleSelectEntity}
          onRetry={fetchEntities}
          emptyMessage="No entities found"
        />
      </div>

      {/* Score Leaderboard */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-500" />
            <h2 className="text-sm font-semibold text-gray-900">Score Leaderboard</h2>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={topSortBy}
              onChange={(e) => setTopSortBy(e.target.value)}
              className="px-2 py-1 text-xs border border-gray-200 rounded-lg outline-none"
            >
              <option value="qualityScore">Quality</option>
              <option value="activityScore">Activity</option>
              <option value="completenessScore">Completeness</option>
              <option value="availabilityScore">Availability</option>
            </select>
            <input
              type="number"
              value={topMinScore}
              onChange={(e) => setTopMinScore(Number(e.target.value))}
              placeholder="Min score"
              className="w-24 px-2 py-1 text-xs border border-gray-200 rounded-lg outline-none"
              min={0}
              max={100}
            />
          </div>
        </div>
        <DataTable
          columns={topColumns}
          data={topEntities}
          loading={topLoading}
          onRowClick={handleSelectEntity}
          emptyMessage="No scored entities yet"
        />
      </div>

      {/* Batch Resolve Modal */}
      <AnimatePresence>
        {showResolveModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowResolveModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Batch Resolve Entities</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Limit</label>
                <input
                  type="number"
                  value={batchLimit}
                  onChange={(e) => setBatchLimit(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowResolveModal(false)} disabled={batchResolveLoading} className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-50 disabled:opacity-50">
                  Cancel
                </button>
                <button onClick={handleBatchResolve} disabled={batchResolveLoading} className="flex-1 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2">
                  {batchResolveLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
                  {batchResolveLoading ? 'Resolving...' : 'Resolve'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Batch Score Modal */}
      <AnimatePresence>
        {showScoreModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowScoreModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Batch Score Entities</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Limit</label>
                <input
                  type="number"
                  value={batchLimit}
                  onChange={(e) => setBatchLimit(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowScoreModal(false)} disabled={batchScoreLoading} className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-50 disabled:opacity-50">
                  Cancel
                </button>
                <button onClick={handleBatchScore} disabled={batchScoreLoading} className="flex-1 px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2">
                  {batchScoreLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
                  {batchScoreLoading ? 'Scoring...' : 'Score'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Resolve Progress Modal */}
      <JobProgressModal
        open={showResolveProgress}
        onClose={() => { setShowResolveProgress(false); resolveJob.reset(); }}
        title="Batch Resolve Entities"
        job={resolveJob}
        onRetry={() => { resolveJob.reset(); setShowResolveModal(true); setShowResolveProgress(false); }}
        onSuccess={() => { fetchEntities(); fetchStats(); }}
      />

      {/* Score Progress Modal */}
      <JobProgressModal
        open={showScoreProgress}
        onClose={() => { setShowScoreProgress(false); scoreJob.reset(); }}
        title="Batch Score Entities"
        job={scoreJob}
        onRetry={() => { scoreJob.reset(); setShowScoreModal(true); setShowScoreProgress(false); }}
        onSuccess={fetchTop}
      />
    </div>
  );
};

export default Entities;
