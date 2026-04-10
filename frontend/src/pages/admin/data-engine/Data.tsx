import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as Tabs from '@radix-ui/react-tabs';
import {
  Eye,
  Sparkles,
  Search,
  X,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { toast } from 'sonner';
import DataTable, { Column } from '@/components/data-engine/DataTable';
import JsonViewer from '@/components/data-engine/JsonViewer';
import * as api from '@/services/dataEngineService';
import type {
  CrawledData,
  EnrichedProfile,
  SearchResult,
  EnrichmentStats,
} from '@/types/data-engine';

const sourceOptions = ['github', 'hackernews', 'remoteok', 'tokyodev', 'arbeitnow', 'weworkremotely', 'stackoverflow', 'wantedly', 'generic', 'greenjapan', 'japandev'];

const Data: React.FC = () => {
  const [activeTab, setActiveTab] = useState('crawled');

  return (
    <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
      <Tabs.List className="flex border-b border-gray-200 mb-6">
        {[
          { value: 'crawled', label: 'Crawled Data' },
          { value: 'enriched', label: 'Enriched Profiles' },
          { value: 'search', label: 'Semantic Search' },
        ].map((tab) => (
          <Tabs.Trigger
            key={tab.value}
            value={tab.value}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.value
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </Tabs.Trigger>
        ))}
      </Tabs.List>

      <Tabs.Content value="crawled">
        <CrawledDataTab />
      </Tabs.Content>
      <Tabs.Content value="enriched">
        <EnrichedProfilesTab />
      </Tabs.Content>
      <Tabs.Content value="search">
        <SemanticSearchTab />
      </Tabs.Content>
    </Tabs.Root>
  );
};

// ============================================
// Crawled Data Tab
// ============================================

const CrawledDataTab: React.FC = () => {
  const [data, setData] = useState<CrawledData[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState('');
  const [type, setType] = useState('');
  const [viewItem, setViewItem] = useState<CrawledData | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params: Record<string, unknown> = { limit: 20, offset };
      if (source) params.source = source;
      if (type) params.type = type;
      const result = await api.getCrawledData(params as any);
      setData(result.data || []);
      setTotal(result.meta?.total ?? result.data?.length ?? 0);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [offset, source, type]);

  useEffect(() => { fetch(); }, [fetch]);

  useEffect(() => {
    const handler = () => fetch();
    window.addEventListener('data-engine-refresh', handler);
    return () => window.removeEventListener('data-engine-refresh', handler);
  }, [fetch]);

  const handleEnrich = async (id: string) => {
    try {
      await api.triggerEnrich({ crawledDataId: id });
      toast.success('Enrichment queued');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Enrichment failed');
    }
  };

  const columns: Column<CrawledData>[] = [
    {
      key: 'source',
      header: 'Source',
      render: (item) => <span className="font-medium capitalize">{item.source}</span>,
    },
    {
      key: 'type',
      header: 'Type',
      render: (item) => (
        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
          item.type === 'profile' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
        }`}>
          {item.type}
        </span>
      ),
    },
    { key: 'sourceId', header: 'Source ID' },
    {
      key: 'crawledAt',
      header: 'Crawled At',
      render: (item) => new Date(item.crawledAt).toLocaleString(),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (item) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); setViewItem(item); }}
            className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-700"
            title="View JSON"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleEnrich(item.id); }}
            className="p-1 hover:bg-blue-50 rounded text-blue-500 hover:text-blue-700"
            title="Enrich"
          >
            <Sparkles className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <select
          value={source}
          onChange={(e) => { setSource(e.target.value); setOffset(0); }}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Sources</option>
          {sourceOptions.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          value={type}
          onChange={(e) => { setType(e.target.value); setOffset(0); }}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Types</option>
          <option value="profile">Profile</option>
          <option value="job_post">Job Post</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <DataTable
          columns={columns}
          data={data}
          loading={loading}
          error={error || undefined}
          total={total}
          limit={20}
          offset={offset}
          onPageChange={setOffset}
          onRetry={fetch}
          emptyMessage="No crawled data found"
        />
      </div>

      {/* View JSON Modal */}
      <AnimatePresence>
        {viewItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setViewItem(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-auto p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Raw Data — {viewItem.source}/{viewItem.sourceId}
                </h3>
                <button onClick={() => setViewItem(null)} className="p-1 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <JsonViewer data={viewItem.rawData} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ============================================
// Enriched Profiles Tab
// ============================================

const EnrichedProfilesTab: React.FC = () => {
  const [data, setData] = useState<EnrichedProfile[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState('');
  const [type, setType] = useState('');
  const [enrichStats, setEnrichStats] = useState<EnrichmentStats | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<EnrichedProfile | null>(null);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchSource, setBatchSource] = useState('');
  const [batchType, setBatchType] = useState('');
  const [batchLimit, setBatchLimit] = useState(50);
  const [queueActive, setQueueActive] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isProcessing = queueActive;

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params: Record<string, unknown> = { limit: 20, offset };
      if (source) params.source = source;
      if (type) params.type = type;
      const [result, stats, queue] = await Promise.all([
        api.getEnrichedProfiles(params as any),
        api.getEnrichmentStats(),
        api.getEnrichmentQueue().catch(() => null),
      ]);
      setData(result.data || []);
      setTotal(result.meta?.total ?? result.data?.length ?? 0);
      setEnrichStats(stats);
      if (queue) setQueueActive(((queue as any).waiting || queue.pending || 0) + ((queue as any).active || queue.processing || 0) > 0);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load enriched profiles');
    } finally {
      setLoading(false);
    }
  }, [offset, source, type]);

  // Silent poll — updates stats + data without showing loading spinner
  const silentPoll = useCallback(async () => {
    try {
      const params: Record<string, unknown> = { limit: 20, offset };
      if (source) params.source = source;
      if (type) params.type = type;
      const [result, stats, queue] = await Promise.all([
        api.getEnrichedProfiles(params as any),
        api.getEnrichmentStats(),
        api.getEnrichmentQueue().catch(() => null),
      ]);
      setData(result.data || []);
      setTotal(result.meta?.total ?? result.data?.length ?? 0);
      setEnrichStats(stats);
      if (queue) setQueueActive(((queue as any).waiting || queue.pending || 0) + ((queue as any).active || queue.processing || 0) > 0);
    } catch {
      // Silent fail on poll — don't disrupt UI
    }
  }, [offset, source, type]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const handler = () => fetchData();
    window.addEventListener('data-engine-refresh', handler);
    return () => window.removeEventListener('data-engine-refresh', handler);
  }, [fetchData]);

  // Auto-poll every 3s when enrichment is in progress
  useEffect(() => {
    if (isProcessing) {
      pollRef.current = setInterval(silentPoll, 3000);
    } else if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [isProcessing, silentPoll]);

  const handleBatchEnrich = async () => {
    try {
      const params: Record<string, unknown> = { limit: batchLimit };
      if (batchSource) params.source = batchSource;
      if (batchType) params.type = batchType;
      await api.triggerEnrich(params as any);
      toast.success('Batch enrichment queued');
      setShowBatchModal(false);
      setQueueActive(true); // Immediately show processing state
      fetchData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Batch enrichment failed');
    }
  };

  const enrichedRatio = enrichStats && enrichStats.totalCrawled
    ? Math.round((enrichStats.totalEnriched / enrichStats.totalCrawled) * 100)
    : 0;

  const remaining = enrichStats
    ? enrichStats.totalCrawled - enrichStats.totalEnriched
    : 0;

  const hasFailed = !isProcessing && remaining > 0;

  const columns: Column<EnrichedProfile>[] = [
    {
      key: 'source',
      header: 'Source',
      render: (item) => <span className="font-medium capitalize">{item.source}</span>,
    },
    {
      key: 'type',
      header: 'Type',
      render: (item) => (
        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
          item.type === 'profile' ? 'bg-blue-100 text-blue-700'
            : item.type === 'company' ? 'bg-green-100 text-green-700'
            : 'bg-purple-100 text-purple-700'
        }`}>
          {item.type}
        </span>
      ),
    },
    {
      key: 'summary',
      header: 'Summary',
      render: (item) => (
        <span className="text-gray-600 truncate max-w-xs block">
          {item.summary ? (item.summary.length > 80 ? item.summary.slice(0, 80) + '...' : item.summary) : '-'}
        </span>
      ),
    },
    {
      key: 'enrichedAt',
      header: 'Enriched At',
      render: (item) => new Date(item.enrichedAt).toLocaleString(),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      {enrichStats && (
        <motion.div
          className={`rounded-xl shadow-sm border overflow-hidden transition-colors ${
            isProcessing
              ? 'bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200'
              : 'bg-white border-gray-100'
          }`}
          layout
        >
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {isProcessing && (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  >
                    <Zap className="w-4 h-4 text-purple-600" />
                  </motion.div>
                )}
                <span className={`text-sm font-medium ${isProcessing ? 'text-purple-700' : hasFailed ? 'text-amber-700' : 'text-gray-600'}`}>
                  {isProcessing ? 'Enriching...' : hasFailed ? 'Enrichment Idle' : 'Enrichment Complete'}
                  {' '}
                  <span className="font-normal">
                    {enrichStats.totalEnriched?.toLocaleString()} / {enrichStats.totalCrawled?.toLocaleString()}
                  </span>
                </span>
                {isProcessing && (
                  <span className="text-xs text-purple-500">
                    ({remaining.toLocaleString()} remaining)
                  </span>
                )}
                {hasFailed && (
                  <span className="text-xs text-amber-500">
                    ({remaining.toLocaleString()} skipped/failed)
                  </span>
                )}
              </div>
              <span className={`text-sm font-semibold ${isProcessing ? 'text-purple-700' : 'text-gray-900'}`}>
                {enrichedRatio}%
              </span>
            </div>

            <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full relative ${
                  isProcessing ? 'bg-purple-500' : 'bg-purple-500'
                }`}
                initial={false}
                animate={{ width: `${enrichedRatio}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              >
                {/* Shimmer animation when processing */}
                {isProcessing && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                  />
                )}
              </motion.div>
            </div>

            {/* Processing activity dots */}
            {isProcessing && (
              <div className="flex items-center gap-1.5 mt-2">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-1.5 h-1.5 bg-purple-400 rounded-full"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.3 }}
                    />
                  ))}
                </div>
                <span className="text-xs text-purple-500">
                  Processing with AI enrichment
                </span>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Filters + Batch Enrich */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={source}
          onChange={(e) => { setSource(e.target.value); setOffset(0); }}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Sources</option>
          {sourceOptions.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          value={type}
          onChange={(e) => { setType(e.target.value); setOffset(0); }}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Types</option>
          <option value="profile">Profile</option>
          <option value="job_post">Job Post</option>
          <option value="company">Company</option>
        </select>
        <button
          onClick={() => setShowBatchModal(true)}
          className={`ml-auto px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
            isProcessing
              ? 'bg-purple-500 hover:bg-purple-600'
              : 'bg-purple-600 hover:bg-purple-700'
          }`}
        >
          {isProcessing && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
          {isProcessing ? 'Enriching...' : 'Enrich Batch'}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <DataTable
          columns={columns}
          data={data}
          loading={loading}
          error={error || undefined}
          total={total}
          limit={20}
          offset={offset}
          onPageChange={setOffset}
          onRowClick={setSelectedProfile}
          onRetry={fetchData}
          emptyMessage="No enriched profiles found"
        />
      </div>

      {/* Profile Detail Modal */}
      <AnimatePresence>
        {selectedProfile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedProfile(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-auto p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Enriched Profile</h3>
                <button onClick={() => setSelectedProfile(null)} className="p-1 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
              {selectedProfile.summary && (
                <p className="text-sm text-gray-600 mb-4">{selectedProfile.summary}</p>
              )}
              {selectedProfile.skills && selectedProfile.skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {selectedProfile.skills.map((s) => (
                    <span key={s} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full">{s}</span>
                  ))}
                </div>
              )}
              <div className="space-y-3 mb-4">
                {selectedProfile.structuredData && Object.entries(selectedProfile.structuredData).map(([k, v]) => (
                  <div key={k} className="flex gap-3 text-sm">
                    <span className="text-gray-500 font-medium min-w-[120px]">{k}</span>
                    <span className="text-gray-900">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
                  </div>
                ))}
              </div>
              <JsonViewer data={selectedProfile.structuredData} initialExpanded={false} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Batch Enrich Modal */}
      <AnimatePresence>
        {showBatchModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowBatchModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Batch Enrich</h3>
                <button onClick={() => setShowBatchModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Source (optional)</label>
                  <select
                    value={batchSource}
                    onChange={(e) => setBatchSource(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Sources</option>
                    {sourceOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type (optional)</label>
                  <select
                    value={batchType}
                    onChange={(e) => setBatchType(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Types</option>
                    <option value="profile">Profile</option>
                    <option value="job_post">Job Post</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Limit</label>
                  <input
                    type="number"
                    value={batchLimit}
                    onChange={(e) => setBatchLimit(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  onClick={handleBatchEnrich}
                  className="w-full px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Start Batch Enrichment
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ============================================
// Semantic Search Tab
// ============================================

const SemanticSearchTab: React.FC = () => {
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState('');
  const [limit, setLimit] = useState(10);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    try {
      setLoading(true);
      setSearched(true);
      const params: Record<string, unknown> = { query: query.trim(), limit };
      if (searchType) params.type = searchType;
      const res = await api.semanticSearch(params as any);
      setResults(res);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Enter search query..."
            className="flex-1 min-w-[200px] px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={searchType}
            onChange={(e) => setSearchType(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Types</option>
            <option value="profile">Profile</option>
            <option value="job_post">Job Post</option>
          </select>
          <input
            type="number"
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="w-20 px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            min={1}
            max={100}
          />
          <button
            onClick={handleSearch}
            disabled={loading || !query.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Search
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      )}

      {!loading && searched && results.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16">
          <Search className="w-12 h-12 text-gray-300 mb-3" />
          <p className="text-gray-500 text-sm">No results found</p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="space-y-3">
          {results.map((result, i) => (
            <motion.div
              key={result.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-5"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                    {(result.score * 100).toFixed(0)}% match
                  </span>
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-full capitalize">
                    {result.source}
                  </span>
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                    {result.type}
                  </span>
                </div>
              </div>
              {result.summary && (
                <p className="text-sm text-gray-700 mb-3">{result.summary}</p>
              )}
              {result.structuredData && Object.keys(result.structuredData).length > 0 && (
                <JsonViewer data={result.structuredData} initialExpanded={false} maxDepth={2} />
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Data;
