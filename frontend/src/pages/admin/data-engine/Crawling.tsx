import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Github,
  Newspaper,
  Globe,
  Briefcase,
  Code,
  StackIcon,
  Sparkles,
  X,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import CrawlSourceCard from '@/components/data-engine/CrawlSourceCard';
import DataTable, { Column } from '@/components/data-engine/DataTable';
import * as api from '@/services/dataEngineService';
import type { CrawlJob, CrawlStats } from '@/types/data-engine';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  running: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
};

const crawlSources = [
  {
    name: 'GitHub',
    source: 'github',
    icon: <Github className="w-5 h-5 text-gray-700" />,
    crawlFn: (config: Record<string, unknown>) => {
      return api.crawlGitHub({
        query: config.query as string,
        limit: config.limit as number,
        page: config.page as number,
        autoPaginate: config.autoPaginate === 'true' || config.autoPaginate === true,
        maxPages: config.maxPages as number,
      });
    },
    configFields: [
      { name: 'query', label: 'Search Query', type: 'text' as const, placeholder: 'e.g. language:typescript location:japan' },
      { name: 'limit', label: 'New Profiles', type: 'number' as const, defaultValue: 50 },
      {
        name: 'autoPaginate',
        label: 'Auto-Paginate',
        type: 'select' as const,
        options: [
          { label: 'Yes (recommended)', value: 'true' },
          { label: 'No (single page)', value: 'false' },
        ],
      },
      { name: 'maxPages', label: 'Max Pages', type: 'number' as const, defaultValue: 5 },
      { name: 'page', label: 'Start Page', type: 'number' as const, defaultValue: 1 },
    ],
  },
  {
    name: 'Hacker News',
    source: 'hackernews',
    icon: <Newspaper className="w-5 h-5 text-orange-600" />,
    crawlFn: api.crawlHackerNews,
    configFields: [
      { name: 'limit', label: 'Limit', type: 'number' as const, defaultValue: 50 },
    ],
  },
  {
    name: 'RemoteOK',
    source: 'remoteok',
    icon: <Globe className="w-5 h-5 text-green-600" />,
    crawlFn: api.crawlRemoteOK,
    configFields: [
      { name: 'tag', label: 'Tag', type: 'text' as const, placeholder: 'e.g. javascript' },
      { name: 'limit', label: 'Limit', type: 'number' as const, defaultValue: 50 },
    ],
  },
  {
    name: 'TokyoDev',
    source: 'tokyodev',
    icon: <Briefcase className="w-5 h-5 text-red-600" />,
    crawlFn: (config: Record<string, unknown>) => {
      return api.crawlTokyoDev({
        limit: config.limit as number,
        autoPaginate: config.autoPaginate === 'true' || config.autoPaginate === true,
        maxPages: config.maxPages as number,
        page: config.page as number,
      });
    },
    configFields: [
      { name: 'limit', label: 'New Jobs', type: 'number' as const, defaultValue: 50 },
      { name: 'autoPaginate', label: 'Auto-Paginate', type: 'select' as const, options: [{ label: 'Yes (recommended)', value: 'true' }, { label: 'No (single page)', value: 'false' }] },
      { name: 'maxPages', label: 'Max Pages', type: 'number' as const, defaultValue: 5 },
      { name: 'page', label: 'Start Page', type: 'number' as const, defaultValue: 1 },
    ],
  },
  {
    name: 'Arbeitnow',
    source: 'arbeitnow',
    icon: <Briefcase className="w-5 h-5 text-blue-600" />,
    crawlFn: api.crawlArbeitnow,
    configFields: [
      { name: 'limit', label: 'Limit', type: 'number' as const, defaultValue: 50 },
    ],
  },
  {
    name: 'WeWorkRemotely',
    source: 'weworkremotely',
    icon: <Globe className="w-5 h-5 text-indigo-600" />,
    crawlFn: api.crawlWeWorkRemotely,
    configFields: [
      { name: 'category', label: 'Category', type: 'text' as const, placeholder: 'e.g. programming' },
      { name: 'limit', label: 'Limit', type: 'number' as const, defaultValue: 50 },
    ],
  },
  {
    name: 'Wantedly',
    source: 'wantedly',
    icon: <Briefcase className="w-5 h-5 text-teal-600" />,
    crawlFn: (config: Record<string, unknown>) => {
      return api.crawlWantedly({
        location: config.location as string,
        limit: config.limit as number,
        autoPaginate: config.autoPaginate === 'true' || config.autoPaginate === true,
        maxPages: config.maxPages as number,
        page: config.page as number,
      });
    },
    configFields: [
      { name: 'location', label: 'Location', type: 'text' as const, placeholder: 'e.g. Tokyo' },
      { name: 'limit', label: 'New Jobs', type: 'number' as const, defaultValue: 30 },
      { name: 'autoPaginate', label: 'Auto-Paginate', type: 'select' as const, options: [{ label: 'Yes (recommended)', value: 'true' }, { label: 'No (single page)', value: 'false' }] },
      { name: 'maxPages', label: 'Max Pages', type: 'number' as const, defaultValue: 5 },
      { name: 'page', label: 'Start Page', type: 'number' as const, defaultValue: 1 },
    ],
  },
  {
    name: 'Green Japan',
    source: 'greenjapan',
    icon: <Briefcase className="w-5 h-5 text-green-600" />,
    crawlFn: (config: Record<string, unknown>) => {
      return api.crawlGreenJapan({
        limit: config.limit as number,
        maxUrls: config.maxUrls as number,
        autoPaginate: config.autoPaginate === 'true' || config.autoPaginate === true,
      });
    },
    configFields: [
      { name: 'limit', label: 'New Jobs', type: 'number' as const, defaultValue: 30 },
      { name: 'maxUrls', label: 'Max URLs', type: 'number' as const, defaultValue: 100 },
      { name: 'autoPaginate', label: 'Auto-Paginate', type: 'select' as const, options: [{ label: 'Yes (recommended)', value: 'true' }, { label: 'No', value: 'false' }] },
    ],
  },
  {
    name: 'Japan Dev',
    source: 'japandev',
    icon: <Globe className="w-5 h-5 text-purple-600" />,
    crawlFn: api.crawlJapanDev,
    configFields: [
      { name: 'limit', label: 'Limit', type: 'number' as const, defaultValue: 300 },
    ],
  },
  {
    name: 'StackOverflow',
    source: 'stackoverflow',
    icon: <Code className="w-5 h-5 text-orange-500" />,
    crawlFn: (config: Record<string, unknown>) => {
      return api.crawlStackOverflow({
        minReputation: config.minReputation as number,
        sort: config.sort as string,
        limit: config.limit as number,
        autoPaginate: config.autoPaginate === 'true' || config.autoPaginate === true,
        maxPages: config.maxPages as number,
        page: config.page as number,
      });
    },
    configFields: [
      { name: 'minReputation', label: 'Min Reputation', type: 'number' as const, placeholder: 'e.g. 1000' },
      {
        name: 'sort',
        label: 'Sort By',
        type: 'select' as const,
        options: [
          { label: 'Reputation', value: 'reputation' },
          { label: 'Creation', value: 'creation' },
          { label: 'Name', value: 'name' },
        ],
      },
      { name: 'limit', label: 'New Profiles', type: 'number' as const, defaultValue: 50 },
      { name: 'autoPaginate', label: 'Auto-Paginate', type: 'select' as const, options: [{ label: 'Yes (recommended)', value: 'true' }, { label: 'No (single page)', value: 'false' }] },
      { name: 'maxPages', label: 'Max Pages', type: 'number' as const, defaultValue: 5 },
      { name: 'page', label: 'Start Page', type: 'number' as const, defaultValue: 1 },
    ],
  },
  {
    name: 'Generic AI Scraper',
    source: 'generic',
    icon: <Sparkles className="w-5 h-5 text-violet-600" />,
    crawlFn: (config: Record<string, unknown>) => {
      const urlsRaw = (config.urls as string) || '';
      const urls = urlsRaw
        .split(/[,\n]+/)
        .map((u: string) => u.trim())
        .filter(Boolean);
      return api.crawlGeneric({
        urls,
        mode: config.mode as string,
        contentType: config.contentType as string,
        fetchMethod: config.fetchMethod as string,
        limit: config.limit as number,
        customPrompt: config.customPrompt as string,
        autoPaginate: config.autoPaginate === 'true' || config.autoPaginate === true,
        maxPages: config.maxPages as number,
        page: config.page as number,
      });
    },
    configFields: [
      { name: 'urls', label: 'URLs', type: 'text' as const, placeholder: 'https://example.com/jobs/123' },
      {
        name: 'mode',
        label: 'Mode',
        type: 'select' as const,
        options: [
          { label: 'Single URL', value: 'single' },
          { label: 'Listing Page', value: 'listing' },
          { label: 'Batch URLs', value: 'batch' },
        ],
      },
      {
        name: 'contentType',
        label: 'Content Type',
        type: 'select' as const,
        options: [
          { label: 'Auto-detect', value: 'auto' },
          { label: 'Job Post', value: 'job_post' },
          { label: 'Profile', value: 'profile' },
          { label: 'Company', value: 'company' },
        ],
      },
      {
        name: 'fetchMethod',
        label: 'Fetch Method',
        type: 'select' as const,
        options: [
          { label: 'Cheerio (static)', value: 'cheerio' },
          { label: 'Puppeteer (JS-rendered)', value: 'puppeteer' },
        ],
      },
      { name: 'customPrompt', label: 'Custom Prompt', type: 'text' as const, placeholder: 'Optional extraction hint' },
      { name: 'limit', label: 'New Items', type: 'number' as const, defaultValue: 20 },
      { name: 'autoPaginate', label: 'Auto-Paginate (listing)', type: 'select' as const, options: [{ label: 'Yes (recommended)', value: 'true' }, { label: 'No (single page)', value: 'false' }] },
      { name: 'maxPages', label: 'Max Pages', type: 'number' as const, defaultValue: 3 },
      { name: 'page', label: 'Start Page', type: 'number' as const, defaultValue: 1 },
    ],
  },
];

const Crawling: React.FC = () => {
  const [jobs, setJobs] = useState<CrawlJob[]>([]);
  const [stats, setStats] = useState<CrawlStats | null>(null);
  const [jobsTotal, setJobsTotal] = useState(0);
  const [jobsOffset, setJobsOffset] = useState(0);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [jobsError, setJobsError] = useState<string | null>(null);
  const [sourceFilter, setSourceFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedJob, setSelectedJob] = useState<CrawlJob | null>(null);

  const fetchJobs = useCallback(async () => {
    try {
      setJobsLoading(true);
      setJobsError(null);
      const params: Record<string, unknown> = { limit: 20, offset: jobsOffset };
      if (sourceFilter) params.source = sourceFilter;
      if (statusFilter) params.status = statusFilter;
      const result = await api.getCrawlJobs(params as any);
      setJobs(result.data || []);
      setJobsTotal(result.meta?.total ?? result.data?.length ?? 0);
    } catch (err: unknown) {
      setJobsError(err instanceof Error ? err.message : 'Failed to load jobs');
    } finally {
      setJobsLoading(false);
    }
  }, [jobsOffset, sourceFilter, statusFilter]);

  const fetchStats = useCallback(async () => {
    try {
      const s = await api.getCrawlStats();
      setStats(s);
    } catch {
      // stats are non-critical
    }
  }, []);

  useEffect(() => {
    fetchJobs();
    fetchStats();
  }, [fetchJobs, fetchStats]);

  useEffect(() => {
    const handler = () => { fetchJobs(); fetchStats(); };
    window.addEventListener('data-engine-refresh', handler);
    return () => window.removeEventListener('data-engine-refresh', handler);
  }, [fetchJobs, fetchStats]);

  const handleCrawl = (crawlFn: (config: any) => Promise<any>) => async (config: Record<string, unknown>) => {
    try {
      const cleanConfig: Record<string, unknown> = {};
      Object.entries(config).forEach(([k, v]) => {
        if (v !== undefined && v !== '') cleanConfig[k] = v;
      });
      await crawlFn(cleanConfig);
      toast.success('Crawl job started');
      fetchJobs();
      fetchStats();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Crawl failed';
      toast.error(msg);
    }
  };

  const formatDuration = (job: CrawlJob) => {
    if (!job.startedAt || !job.completedAt) return '-';
    const ms = new Date(job.completedAt).getTime() - new Date(job.startedAt).getTime();
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const jobColumns: Column<CrawlJob>[] = [
    {
      key: 'source',
      header: 'Source',
      render: (job) => <span className="font-medium capitalize">{job.source}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (job) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full inline-flex items-center gap-1 ${statusColors[job.status] || 'bg-gray-100 text-gray-700'}`}>
          {job.status === 'running' && <RefreshCw className="w-3 h-3 animate-spin" />}
          {job.status}
        </span>
      ),
    },
    { key: 'itemsFound', header: 'Found' },
    { key: 'itemsNew', header: 'New' },
    { key: 'itemsSkipped', header: 'Skipped' },
    {
      key: 'startedAt',
      header: 'Started',
      render: (job) => job.startedAt ? new Date(job.startedAt).toLocaleString() : '-',
    },
    {
      key: 'duration',
      header: 'Duration',
      render: formatDuration,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Crawler Source Grid */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Crawler Sources</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {crawlSources.map((src, i) => (
            <CrawlSourceCard
              key={src.source}
              name={src.name}
              source={src.source}
              icon={src.icon}
              lastCrawl={stats?.bySource?.[src.source]?.lastCrawl}
              totalItems={stats?.bySource?.[src.source]?.total}
              configFields={src.configFields}
              onCrawl={handleCrawl(src.crawlFn)}
              delay={i * 0.05}
            />
          ))}
        </div>
      </div>

      {/* Crawl Jobs Table */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Crawl Jobs</h2>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4 flex flex-wrap gap-3">
          <select
            value={sourceFilter}
            onChange={(e) => { setSourceFilter(e.target.value); setJobsOffset(0); }}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value="">All Sources</option>
            {crawlSources.map((s) => (
              <option key={s.source} value={s.source}>{s.name}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setJobsOffset(0); }}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="running">Running</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <DataTable
            columns={jobColumns}
            data={jobs}
            loading={jobsLoading}
            error={jobsError || undefined}
            total={jobsTotal}
            limit={20}
            offset={jobsOffset}
            onPageChange={setJobsOffset}
            onRowClick={setSelectedJob}
            onRetry={fetchJobs}
            emptyMessage="No crawl jobs found"
          />
        </div>
      </div>

      {/* Job Detail Modal */}
      <AnimatePresence>
        {selectedJob && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedJob(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Job Details</h3>
                <button onClick={() => setSelectedJob(null)} className="p-1 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Source</span>
                  <span className="font-medium capitalize">{selectedJob.source}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Status</span>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[selectedJob.status]}`}>
                    {selectedJob.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Items Found</span>
                  <span>{selectedJob.itemsFound}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">New Items</span>
                  <span>{selectedJob.itemsNew}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Skipped</span>
                  <span>{selectedJob.itemsSkipped}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Duration</span>
                  <span>{formatDuration(selectedJob)}</span>
                </div>
                {selectedJob.error && (
                  <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-xs font-medium text-red-800">Error</p>
                    <p className="text-xs text-red-600 mt-1">{selectedJob.error}</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Crawling;
