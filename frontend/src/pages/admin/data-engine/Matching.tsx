import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import * as Tabs from '@radix-ui/react-tabs';
import {
  Search,
  RefreshCw,
  ThumbsDown,
  MessageCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import DataTable, { Column } from '@/components/data-engine/DataTable';
import JsonViewer from '@/components/data-engine/JsonViewer';
import * as api from '@/services/dataEngineService';
import type { Match } from '@/types/data-engine';

const statusColors: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  dismissed: 'bg-gray-100 text-gray-600',
  contacted: 'bg-blue-100 text-blue-700',
};

const Matching: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dev-to-job');

  return (
    <div className="space-y-6">
      <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
        <Tabs.List className="flex border-b border-gray-200 mb-6">
          <Tabs.Trigger
            value="dev-to-job"
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'dev-to-job' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Match Developers to Job
          </Tabs.Trigger>
          <Tabs.Trigger
            value="job-to-dev"
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'job-to-dev' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Match Jobs to Developer
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="dev-to-job">
          <MatchDevsToJobTab />
        </Tabs.Content>
        <Tabs.Content value="job-to-dev">
          <MatchJobsToDevTab />
        </Tabs.Content>
      </Tabs.Root>

      {/* Stored Matches Browser */}
      <StoredMatchesBrowser />
    </div>
  );
};

// ============================================
// Match Devs to Job
// ============================================

const MatchDevsToJobTab: React.FC = () => {
  const [jobProfileId, setJobProfileId] = useState('');
  const [limit, setLimit] = useState(20);
  const [minScore, setMinScore] = useState(0.5);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!jobProfileId.trim()) return;
    try {
      setLoading(true);
      setSearched(true);
      const result = await api.matchDevelopers({
        jobEnrichedProfileId: jobProfileId.trim(),
        limit,
        minScore,
      });
      setMatches(result);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Matching failed');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (matchId: string, status: string) => {
    try {
      await api.updateMatchStatus(matchId, status);
      toast.success(`Match ${status}`);
      setMatches((prev) => prev.map((m) => (m.id === matchId ? { ...m, status: status as Match['status'] } : m)));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Status update failed');
    }
  };

  const columns: Column<Match>[] = [
    {
      key: 'entityName',
      header: 'Developer',
      render: (m) => <span className="font-medium">{m.entityName || m.entityId || '-'}</span>,
    },
    {
      key: 'vectorSimilarity',
      header: 'Vector Sim',
      render: (m) => <span className="font-mono">{(m.vectorSimilarity * 100).toFixed(1)}%</span>,
    },
    {
      key: 'ruleScore',
      header: 'Rule Score',
      render: (m) => <span className="font-mono">{(m.ruleScore * 100).toFixed(1)}%</span>,
    },
    {
      key: 'compositeScore',
      header: 'Composite',
      render: (m) => (
        <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
          m.compositeScore >= 0.8 ? 'bg-green-100 text-green-700' :
          m.compositeScore >= 0.5 ? 'bg-yellow-100 text-yellow-700' :
          'bg-red-100 text-red-700'
        }`}>
          {(m.compositeScore * 100).toFixed(0)}%
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (m) => (
        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[m.status] || 'bg-gray-100 text-gray-700'}`}>
          {m.status}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (m) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); handleStatusUpdate(m.id, 'dismissed'); }}
            className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"
            title="Dismiss"
          >
            <ThumbsDown className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleStatusUpdate(m.id, 'contacted'); }}
            className="p-1 hover:bg-blue-50 rounded text-blue-400 hover:text-blue-600"
            title="Contact"
          >
            <MessageCircle className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-gray-600 mb-1">Job Enriched Profile ID</label>
            <input
              type="text"
              value={jobProfileId}
              onChange={(e) => setJobProfileId(e.target.value)}
              placeholder="Enter enriched profile ID..."
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="w-24">
            <label className="block text-xs font-medium text-gray-600 mb-1">Limit</label>
            <input
              type="number"
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="w-32">
            <label className="block text-xs font-medium text-gray-600 mb-1">Min Score ({(minScore * 100).toFixed(0)}%)</label>
            <input
              type="range"
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
              min={0}
              max={1}
              step={0.05}
              className="w-full"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading || !jobProfileId.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Find Matches
          </button>
        </div>
      </div>

      {(searched || matches.length > 0) && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <DataTable
            columns={columns}
            data={matches}
            loading={loading}
            emptyMessage="No matches found"
          />
        </div>
      )}
    </div>
  );
};

// ============================================
// Match Jobs to Dev
// ============================================

const MatchJobsToDevTab: React.FC = () => {
  const [entityId, setEntityId] = useState('');
  const [limit, setLimit] = useState(20);
  const [minScore, setMinScore] = useState(0.5);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!entityId.trim()) return;
    try {
      setLoading(true);
      setSearched(true);
      const result = await api.matchJobs({
        entityId: entityId.trim(),
        limit,
        minScore,
      });
      setMatches(result);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Matching failed');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (matchId: string, status: string) => {
    try {
      await api.updateMatchStatus(matchId, status);
      toast.success(`Match ${status}`);
      setMatches((prev) => prev.map((m) => (m.id === matchId ? { ...m, status: status as Match['status'] } : m)));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Status update failed');
    }
  };

  const columns: Column<Match>[] = [
    {
      key: 'jobTitle',
      header: 'Job',
      render: (m) => <span className="font-medium">{m.jobTitle || m.enrichedProfileId || '-'}</span>,
    },
    {
      key: 'vectorSimilarity',
      header: 'Vector Sim',
      render: (m) => <span className="font-mono">{(m.vectorSimilarity * 100).toFixed(1)}%</span>,
    },
    {
      key: 'ruleScore',
      header: 'Rule Score',
      render: (m) => <span className="font-mono">{(m.ruleScore * 100).toFixed(1)}%</span>,
    },
    {
      key: 'compositeScore',
      header: 'Composite',
      render: (m) => (
        <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
          m.compositeScore >= 0.8 ? 'bg-green-100 text-green-700' :
          m.compositeScore >= 0.5 ? 'bg-yellow-100 text-yellow-700' :
          'bg-red-100 text-red-700'
        }`}>
          {(m.compositeScore * 100).toFixed(0)}%
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (m) => (
        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[m.status] || 'bg-gray-100 text-gray-700'}`}>
          {m.status}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (m) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); handleStatusUpdate(m.id, 'dismissed'); }}
            className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"
            title="Dismiss"
          >
            <ThumbsDown className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleStatusUpdate(m.id, 'contacted'); }}
            className="p-1 hover:bg-blue-50 rounded text-blue-400 hover:text-blue-600"
            title="Contact"
          >
            <MessageCircle className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-gray-600 mb-1">Entity ID</label>
            <input
              type="text"
              value={entityId}
              onChange={(e) => setEntityId(e.target.value)}
              placeholder="Enter entity ID..."
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="w-24">
            <label className="block text-xs font-medium text-gray-600 mb-1">Limit</label>
            <input
              type="number"
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="w-32">
            <label className="block text-xs font-medium text-gray-600 mb-1">Min Score ({(minScore * 100).toFixed(0)}%)</label>
            <input
              type="range"
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
              min={0}
              max={1}
              step={0.05}
              className="w-full"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading || !entityId.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Find Matches
          </button>
        </div>
      </div>

      {(searched || matches.length > 0) && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <DataTable
            columns={columns}
            data={matches}
            loading={loading}
            emptyMessage="No matches found"
          />
        </div>
      )}
    </div>
  );
};

// ============================================
// Stored Matches Browser
// ============================================

const StoredMatchesBrowser: React.FC = () => {
  const [lookupType, setLookupType] = useState<'job' | 'entity'>('job');
  const [lookupId, setLookupId] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [matches, setMatches] = useState<Match[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleLookup = useCallback(async () => {
    if (!lookupId.trim()) return;
    try {
      setLoading(true);
      setSearched(true);
      const params: Record<string, unknown> = { limit: 20, offset };
      if (statusFilter) params.status = statusFilter;

      const result = lookupType === 'job'
        ? await api.getMatchesByJob(lookupId.trim(), params as any)
        : await api.getMatchesByEntity(lookupId.trim(), params as any);

      setMatches(result.data || []);
      setTotal(result.meta?.total ?? result.data?.length ?? 0);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Lookup failed');
    } finally {
      setLoading(false);
    }
  }, [lookupId, lookupType, statusFilter, offset]);

  const handleStatusUpdate = async (matchId: string, status: string) => {
    try {
      await api.updateMatchStatus(matchId, status);
      toast.success(`Match ${status}`);
      setMatches((prev) => prev.map((m) => (m.id === matchId ? { ...m, status: status as Match['status'] } : m)));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Status update failed');
    }
  };

  const columns: Column<Match>[] = [
    {
      key: 'name',
      header: lookupType === 'job' ? 'Developer' : 'Job',
      render: (m) => <span className="font-medium">{(lookupType === 'job' ? m.entityName : m.jobTitle) || m.id}</span>,
    },
    {
      key: 'compositeScore',
      header: 'Score',
      render: (m) => <span className="font-mono">{(m.compositeScore * 100).toFixed(0)}%</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (m) => (
        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[m.status] || 'bg-gray-100 text-gray-700'}`}>
          {m.status}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (m) => new Date(m.createdAt).toLocaleDateString(),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (m) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); handleStatusUpdate(m.id, 'dismissed'); }}
            className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"
          >
            <ThumbsDown className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleStatusUpdate(m.id, 'contacted'); }}
            className="p-1 hover:bg-blue-50 rounded text-blue-400 hover:text-blue-600"
          >
            <MessageCircle className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
    >
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-900">Stored Matches Browser</h2>
      </div>
      <div className="p-4 flex flex-wrap gap-3 items-end border-b border-gray-100">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Lookup By</label>
          <select
            value={lookupType}
            onChange={(e) => { setLookupType(e.target.value as 'job' | 'entity'); setMatches([]); setSearched(false); }}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="job">Job ID</option>
            <option value="entity">Entity ID</option>
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-gray-600 mb-1">
            {lookupType === 'job' ? 'Job ID' : 'Entity ID'}
          </label>
          <input
            type="text"
            value={lookupId}
            onChange={(e) => setLookupId(e.target.value)}
            placeholder={`Enter ${lookupType} ID...`}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All</option>
            <option value="active">Active</option>
            <option value="dismissed">Dismissed</option>
            <option value="contacted">Contacted</option>
          </select>
        </div>
        <button
          onClick={handleLookup}
          disabled={loading || !lookupId.trim()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          Lookup
        </button>
      </div>

      {searched && (
        <DataTable
          columns={columns}
          data={matches}
          loading={loading}
          total={total}
          limit={20}
          offset={offset}
          onPageChange={setOffset}
          emptyMessage="No stored matches found"
        />
      )}
    </motion.div>
  );
};

export default Matching;
