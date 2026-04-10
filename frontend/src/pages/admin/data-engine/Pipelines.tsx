import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Workflow,
  Scan,
  Play,
  Clock,
  Link,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  X,
  Briefcase,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import StatsCard from '@/components/data-engine/StatsCard';
import DataTable, { Column } from '@/components/data-engine/DataTable';
import * as api from '@/services/dataEngineService';
import type {
  PipelineRun,
  PipelineScanResult,
  PipelineStats,
  PipelineStage,
} from '@/types/data-engine';

// Source options by pipeline type
const jobSourceOptions = ['remoteok', 'tokyodev', 'arbeitnow', 'weworkremotely', 'greenjapan', 'japandev', 'hackernews', 'wantedly', 'generic'];
const profileSourceOptions = ['github', 'hackernews', 'stackoverflow', 'wantedly', 'generic'];
const chainSourceOptions = ['github', 'hackernews', 'remoteok', 'tokyodev', 'arbeitnow', 'weworkremotely', 'stackoverflow', 'wantedly', 'generic', 'greenjapan', 'japandev'];
const typeOptions = ['profile', 'job_post', 'company'];
const urlTypeOptions = ['github', 'linkedin', 'website', 'blog'];

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  running: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
};

const pipelineTypeColors: Record<string, string> = {
  jobs: 'bg-amber-100 text-amber-700',
  profiles: 'bg-cyan-100 text-cyan-700',
  chain: 'bg-gray-100 text-gray-600',
};

const STAGE_ORDER: PipelineStage[] = ['CRAWL', 'ENRICH', 'RESOLVE', 'CHAIN_CRAWL', 'CHAIN_ENRICH', 'CHAIN_RESOLVE', 'COMPLETED'];
const STAGE_SHORT: Record<string, string> = {
  CRAWL: 'Crawl',
  ENRICH: 'Enrich',
  RESOLVE: 'Resolve',
  CHAIN_CRAWL: 'Chain',
  CHAIN_ENRICH: 'C.Enrich',
  CHAIN_RESOLVE: 'C.Resolve',
  COMPLETED: 'Done',
};

type PipelineTab = 'jobs' | 'profiles' | 'chain';

// Generic crawler config panel (shown when source='generic')
const GenericCrawlerConfig: React.FC<{
  urls: string; onUrlsChange: (v: string) => void;
  mode: string; onModeChange: (v: string) => void;
  contentType: string; onContentTypeChange: (v: string) => void;
  fetchMethod: string; onFetchMethodChange: (v: string) => void;
  customPrompt: string; onCustomPromptChange: (v: string) => void;
  autoPaginate: boolean; onAutoPaginateChange: (v: boolean) => void;
  maxPages: number; onMaxPagesChange: (v: number) => void;
  startPage: number; onStartPageChange: (v: number) => void;
}> = ({
  urls, onUrlsChange, mode, onModeChange, contentType, onContentTypeChange,
  fetchMethod, onFetchMethodChange, customPrompt, onCustomPromptChange,
  autoPaginate, onAutoPaginateChange, maxPages, onMaxPagesChange,
  startPage, onStartPageChange,
}) => (
  <div className="mb-5 p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-4">
    <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">Generic Crawler Configuration</h4>
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">URLs (one per line or comma-separated)</label>
      <textarea
        value={urls}
        onChange={(e) => onUrlsChange(e.target.value)}
        rows={3}
        placeholder="https://example.com/jobs/123&#10;https://example.com/careers"
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-y"
      />
    </div>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Mode</label>
        <select value={mode} onChange={(e) => onModeChange(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none">
          <option value="single">Single URL</option>
          <option value="listing">Listing Page</option>
          <option value="batch">Batch URLs</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Content Type</label>
        <select value={contentType} onChange={(e) => onContentTypeChange(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none">
          <option value="auto">Auto-detect</option>
          <option value="job_post">Job Post</option>
          <option value="profile">Profile</option>
          <option value="company">Company</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Fetch Method</label>
        <select value={fetchMethod} onChange={(e) => onFetchMethodChange(e.target.value)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none">
          <option value="cheerio">Cheerio (static)</option>
          <option value="puppeteer">Puppeteer (JS-rendered)</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Auto-Paginate</label>
        <button
          onClick={() => onAutoPaginateChange(!autoPaginate)}
          className={`w-full px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
            autoPaginate ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'bg-gray-50 border-gray-200 text-gray-500'
          }`}
        >
          {autoPaginate ? 'Enabled' : 'Disabled'}
        </button>
      </div>
    </div>
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Max Pages</label>
        <input type="number" min={1} max={50} value={maxPages} onChange={(e) => onMaxPagesChange(Number(e.target.value) || 3)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Start Page</label>
        <input type="number" min={1} value={startPage} onChange={(e) => onStartPageChange(Number(e.target.value) || 1)} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Custom Prompt</label>
        <input type="text" value={customPrompt} onChange={(e) => onCustomPromptChange(e.target.value)} placeholder="Optional extraction hint" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
      </div>
    </div>
  </div>
);

// Source-specific config panel (shown for non-generic sources with extra options)
const SourceCrawlerConfig: React.FC<{
  source: string;
  githubQuery: string; onGithubQueryChange: (v: string) => void;
  soMinReputation: number; onSoMinReputationChange: (v: number) => void;
  soSort: string; onSoSortChange: (v: string) => void;
  wantedlyLocation: string; onWantedlyLocationChange: (v: string) => void;
  remoteokTag: string; onRemoteokTagChange: (v: string) => void;
  wwrCategory: string; onWwrCategoryChange: (v: string) => void;
  hnMonth: number | ''; onHnMonthChange: (v: number | '') => void;
  hnYear: number; onHnYearChange: (v: number) => void;
  gjMaxUrls: number; onGjMaxUrlsChange: (v: number) => void;
  autoPaginate: boolean; onAutoPaginateChange: (v: boolean) => void;
  maxPages: number; onMaxPagesChange: (v: number) => void;
  startPage: number; onStartPageChange: (v: number) => void;
}> = (props) => {
  const { source } = props;
  const inputCls = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none';
  const labelCls = 'block text-xs font-medium text-gray-600 mb-1';

  const paginationFields = (
    <div className="grid grid-cols-3 gap-3">
      <div>
        <label className={labelCls}>Auto-Paginate</label>
        <button
          onClick={() => props.onAutoPaginateChange(!props.autoPaginate)}
          className={`w-full px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
            props.autoPaginate ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'bg-gray-50 border-gray-200 text-gray-500'
          }`}
        >
          {props.autoPaginate ? 'Enabled' : 'Disabled'}
        </button>
      </div>
      <div>
        <label className={labelCls}>Max Pages</label>
        <input type="number" min={1} max={50} value={props.maxPages} onChange={(e) => props.onMaxPagesChange(Number(e.target.value) || 5)} className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>Start Page</label>
        <input type="number" min={1} value={props.startPage} onChange={(e) => props.onStartPageChange(Number(e.target.value) || 1)} className={inputCls} />
      </div>
    </div>
  );

  let fields: React.ReactNode = null;

  if (source === 'github') {
    fields = (
      <>
        <div>
          <label className={labelCls}>Search Query</label>
          <input type="text" value={props.githubQuery} onChange={(e) => props.onGithubQueryChange(e.target.value)} placeholder="location:Japan language:TypeScript" className={inputCls} />
          <p className="text-[10px] text-gray-400 mt-1">GitHub user search syntax: location:Japan, language:TypeScript, followers:&gt;100, etc.</p>
        </div>
        {paginationFields}
      </>
    );
  } else if (source === 'stackoverflow') {
    fields = (
      <>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Min Reputation</label>
            <input type="number" min={1} value={props.soMinReputation} onChange={(e) => props.onSoMinReputationChange(Number(e.target.value) || 1000)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Sort By</label>
            <select value={props.soSort} onChange={(e) => props.onSoSortChange(e.target.value)} className={inputCls}>
              <option value="reputation">Reputation</option>
              <option value="creation">Creation Date</option>
              <option value="name">Name</option>
            </select>
          </div>
        </div>
        {paginationFields}
      </>
    );
  } else if (source === 'wantedly') {
    fields = (
      <>
        <div>
          <label className={labelCls}>Location</label>
          <input type="text" value={props.wantedlyLocation} onChange={(e) => props.onWantedlyLocationChange(e.target.value)} placeholder="Tokyo" className={inputCls} />
        </div>
        {paginationFields}
      </>
    );
  } else if (source === 'remoteok') {
    fields = (
      <div>
        <label className={labelCls}>Tag Filter</label>
        <input type="text" value={props.remoteokTag} onChange={(e) => props.onRemoteokTagChange(e.target.value)} placeholder="javascript, python, devops, etc." className={inputCls} />
      </div>
    );
  } else if (source === 'weworkremotely') {
    fields = (
      <div>
        <label className={labelCls}>Category</label>
        <input type="text" value={props.wwrCategory} onChange={(e) => props.onWwrCategoryChange(e.target.value)} placeholder="programming, design, etc." className={inputCls} />
      </div>
    );
  } else if (source === 'hackernews') {
    fields = (
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Month</label>
          <input type="number" min={1} max={12} value={props.hnMonth} onChange={(e) => props.onHnMonthChange(Number(e.target.value) || '')} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Year</label>
          <input type="number" min={2020} value={props.hnYear} onChange={(e) => props.onHnYearChange(Number(e.target.value) || new Date().getFullYear())} className={inputCls} />
        </div>
      </div>
    );
  } else if (source === 'tokyodev') {
    fields = paginationFields;
  } else if (source === 'greenjapan') {
    fields = (
      <>
        <div>
          <label className={labelCls}>Max URLs per Page</label>
          <input type="number" min={1} max={200} value={props.gjMaxUrls} onChange={(e) => props.onGjMaxUrlsChange(Number(e.target.value) || 50)} className={inputCls} />
        </div>
        <div className="grid grid-cols-1 gap-3">
          <div>
            <label className={labelCls}>Auto-Paginate</label>
            <button
              onClick={() => props.onAutoPaginateChange(!props.autoPaginate)}
              className={`w-full px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                props.autoPaginate ? 'bg-indigo-50 border-indigo-300 text-indigo-700' : 'bg-gray-50 border-gray-200 text-gray-500'
              }`}
            >
              {props.autoPaginate ? 'Enabled' : 'Disabled'}
            </button>
          </div>
        </div>
      </>
    );
  }

  if (!fields) return null;

  return (
    <div className="mb-5 p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
      <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">{source} Configuration</h4>
      {fields}
    </div>
  );
};

const Pipelines: React.FC = () => {
  // Active pipeline tab
  const [activeTab, setActiveTab] = useState<PipelineTab>('jobs');

  // Stats
  const [stats, setStats] = useState<PipelineStats | null>(null);

  // Jobs pipeline config
  const [jobsSource, setJobsSource] = useState('japandev');
  const [jobsLimit, setJobsLimit] = useState(50);
  const [crawlCompanyWebsites, setCrawlCompanyWebsites] = useState(true);

  // Profiles pipeline config
  const [profilesSource, setProfilesSource] = useState('github');
  const [profilesLimit, setProfilesLimit] = useState(50);
  const [chainUrlTypes, setChainUrlTypes] = useState<string[]>(['github', 'linkedin', 'website']);

  // Generic crawler config (shared between jobs + profiles when source='generic')
  const [genericUrls, setGenericUrls] = useState('');
  const [genericMode, setGenericMode] = useState('single');
  const [genericContentType, setGenericContentType] = useState('auto');
  const [genericFetchMethod, setGenericFetchMethod] = useState('cheerio');
  const [genericCustomPrompt, setGenericCustomPrompt] = useState('');
  const [genericAutoPaginate, setGenericAutoPaginate] = useState(true);
  const [genericMaxPages, setGenericMaxPages] = useState(3);
  const [genericStartPage, setGenericStartPage] = useState(1);

  // Source-specific config
  const [githubQuery, setGithubQuery] = useState('location:Japan language:TypeScript');
  const [soMinReputation, setSoMinReputation] = useState(1000);
  const [soSort, setSoSort] = useState('reputation');
  const [wantedlyLocation, setWantedlyLocation] = useState('');
  const [remoteokTag, setRemoteokTag] = useState('');
  const [wwrCategory, setWwrCategory] = useState('');
  const [hnMonth, setHnMonth] = useState<number | ''>(new Date().getMonth() + 1);
  const [hnYear, setHnYear] = useState(new Date().getFullYear());
  const [gjMaxUrls, setGjMaxUrls] = useState(50);
  const [srcAutoPaginate, setSrcAutoPaginate] = useState(true);
  const [srcMaxPages, setSrcMaxPages] = useState(5);
  const [srcStartPage, setSrcStartPage] = useState(1);

  // Chain (legacy) config
  const [source, setSource] = useState('');
  const [type, setType] = useState('');
  const [urlTypes, setUrlTypes] = useState<string[]>([...urlTypeOptions]);
  const [limit, setLimit] = useState(100);
  const [autoEnrich, setAutoEnrich] = useState(true);

  // Scan results
  const [scanResult, setScanResult] = useState<PipelineScanResult | null>(null);
  const [scanExpanded, setScanExpanded] = useState(true);

  // Run history
  const [runs, setRuns] = useState<PipelineRun[]>([]);
  const [runsTotal, setRunsTotal] = useState(0);
  const [runsOffset, setRunsOffset] = useState(0);
  const [runsLoading, setRunsLoading] = useState(false);

  // Detail modal
  const [selectedRun, setSelectedRun] = useState<PipelineRun | null>(null);

  // Loading
  const [scanning, setScanning] = useState(false);
  const [running, setRunning] = useState(false);

  // Polling
  const [hasRunningRun, setHasRunningRun] = useState(false);

  // Real-time duration ticker
  const [tick, setTick] = useState(0);

  const fetchStats = useCallback(async () => {
    try {
      const data = await api.getPipelineStats();
      setStats(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load stats';
      toast.error(msg);
    }
  }, []);

  const fetchRuns = useCallback(async () => {
    setRunsLoading(true);
    try {
      const result = await api.getPipelineRuns({ limit: 20, offset: runsOffset });
      setRuns(result.data);
      setRunsTotal(result.meta.total);
      setHasRunningRun(result.data.some(r => r.status === 'running'));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load runs';
      toast.error(msg);
    } finally {
      setRunsLoading(false);
    }
  }, [runsOffset]);

  useEffect(() => {
    fetchStats();
    fetchRuns();
  }, [fetchStats, fetchRuns]);

  useEffect(() => {
    const handler = () => { fetchStats(); fetchRuns(); };
    window.addEventListener('data-engine-refresh', handler);
    return () => window.removeEventListener('data-engine-refresh', handler);
  }, [fetchStats, fetchRuns]);

  useEffect(() => {
    if (!hasRunningRun) return;
    const interval = setInterval(() => { fetchRuns(); fetchStats(); }, 5000);
    return () => clearInterval(interval);
  }, [hasRunningRun, fetchRuns, fetchStats]);

  useEffect(() => {
    if (!hasRunningRun) return;
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [hasRunningRun]);

  // --- Jobs Pipeline ---
  const parseGenericUrls = (): string[] =>
    genericUrls.split(/[\n,]+/).map(u => u.trim()).filter(Boolean);

  const handleRunJobsPipeline = async () => {
    if (jobsSource === 'generic' && parseGenericUrls().length === 0) {
      toast.error('Please enter at least one URL for the generic crawler');
      return;
    }
    setRunning(true);
    try {
      const jobsParams: Record<string, any> = {
        source: jobsSource,
        limit: jobsLimit,
        crawlCompanyWebsites,
      };
      if (jobsSource === 'generic') {
        Object.assign(jobsParams, {
          urls: parseGenericUrls(),
          mode: genericMode, contentType: genericContentType, fetchMethod: genericFetchMethod,
          customPrompt: genericCustomPrompt || undefined,
          autoPaginate: genericAutoPaginate, maxPages: genericMaxPages, page: genericStartPage,
        });
      } else {
        // Source-specific options
        if (jobsSource === 'remoteok' && remoteokTag) jobsParams.tag = remoteokTag;
        if (jobsSource === 'weworkremotely' && wwrCategory) jobsParams.category = wwrCategory;
        if (jobsSource === 'wantedly') {
          if (wantedlyLocation) jobsParams.location = wantedlyLocation;
          jobsParams.autoPaginate = srcAutoPaginate;
          jobsParams.maxPages = srcMaxPages;
          jobsParams.page = srcStartPage;
        }
        if (jobsSource === 'hackernews') {
          if (hnMonth) jobsParams.month = hnMonth;
          jobsParams.year = hnYear;
        }
        if (jobsSource === 'tokyodev') {
          jobsParams.autoPaginate = srcAutoPaginate;
          jobsParams.maxPages = srcMaxPages;
          jobsParams.page = srcStartPage;
        }
        if (jobsSource === 'greenjapan') {
          jobsParams.maxUrls = gjMaxUrls;
          jobsParams.autoPaginate = srcAutoPaginate;
        }
      }
      await api.runJobsPipeline(jobsParams as any);
      toast.success('Jobs pipeline started');
      fetchRuns();
      fetchStats();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Pipeline failed';
      toast.error(msg);
    } finally {
      setRunning(false);
    }
  };

  // --- Profiles Pipeline ---
  const handleRunProfilesPipeline = async () => {
    if (profilesSource === 'generic' && parseGenericUrls().length === 0) {
      toast.error('Please enter at least one URL for the generic crawler');
      return;
    }
    setRunning(true);
    try {
      const profilesParams: Record<string, any> = {
        source: profilesSource,
        limit: profilesLimit,
        chainUrlTypes,
      };
      if (profilesSource === 'generic') {
        Object.assign(profilesParams, {
          urls: parseGenericUrls(),
          mode: genericMode, contentType: genericContentType, fetchMethod: genericFetchMethod,
          customPrompt: genericCustomPrompt || undefined,
          autoPaginate: genericAutoPaginate, maxPages: genericMaxPages, page: genericStartPage,
        });
      } else {
        // Source-specific options
        if (profilesSource === 'github') {
          profilesParams.query = githubQuery;
          profilesParams.autoPaginate = srcAutoPaginate;
          profilesParams.maxPages = srcMaxPages;
          profilesParams.page = srcStartPage;
        }
        if (profilesSource === 'stackoverflow') {
          profilesParams.minReputation = soMinReputation;
          profilesParams.sort = soSort;
          profilesParams.autoPaginate = srcAutoPaginate;
          profilesParams.maxPages = srcMaxPages;
          profilesParams.page = srcStartPage;
        }
        if (profilesSource === 'wantedly') {
          if (wantedlyLocation) profilesParams.location = wantedlyLocation;
          profilesParams.autoPaginate = srcAutoPaginate;
          profilesParams.maxPages = srcMaxPages;
          profilesParams.page = srcStartPage;
        }
        if (profilesSource === 'hackernews') {
          if (hnMonth) profilesParams.month = hnMonth;
          profilesParams.year = hnYear;
        }
      }
      await api.runProfilesPipeline(profilesParams as any);
      toast.success('Profiles pipeline started');
      fetchRuns();
      fetchStats();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Pipeline failed';
      toast.error(msg);
    } finally {
      setRunning(false);
    }
  };

  // --- Chain (Legacy) ---
  const buildChainParams = () => {
    const params: Record<string, unknown> = {};
    if (source) params.source = source;
    if (type) params.type = type;
    if (urlTypes.length > 0 && urlTypes.length < urlTypeOptions.length) {
      params.urlTypes = urlTypes;
    }
    params.limit = limit;
    return params;
  };

  const handleScan = async () => {
    setScanning(true);
    setScanResult(null);
    try {
      const result = await api.scanPipeline(buildChainParams());
      setScanResult(result);
      toast.success(`Scan complete: ${result.newUrls.length} new URLs found`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Scan failed';
      toast.error(msg);
    } finally {
      setScanning(false);
    }
  };

  const handleChainRun = async () => {
    setRunning(true);
    try {
      const params = { ...buildChainParams(), autoEnrich };
      const result = await api.runPipeline(params);
      const jobsQueued = (result as any).jobsQueued || 0;
      toast.success(`Chain pipeline started: ${jobsQueued} jobs queued`);
      setScanResult(null);
      fetchRuns();
      fetchStats();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Pipeline run failed';
      toast.error(msg);
    } finally {
      setRunning(false);
    }
  };

  const toggleUrlType = (t: string) => {
    setUrlTypes(prev =>
      prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t],
    );
  };

  const toggleChainUrlType = (t: string) => {
    setChainUrlTypes(prev =>
      prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t],
    );
  };

  const formatDuration = (run: PipelineRun) => {
    void tick;
    if (!run.startedAt) return '-';
    const start = new Date(run.startedAt).getTime();
    const end = run.completedAt ? new Date(run.completedAt).getTime() : Date.now();
    const seconds = Math.floor((end - start) / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ${seconds % 60}s`;
  };

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString();
  };

  // Stage progress indicator
  const StageProgress: React.FC<{ run: PipelineRun }> = ({ run }) => {
    const pType = run.pipelineType || 'chain';
    if (pType === 'chain') return <span className="text-xs text-gray-400">-</span>;

    const currentIdx = STAGE_ORDER.indexOf(run.currentStage as PipelineStage);

    return (
      <div className="flex items-center gap-0.5">
        {STAGE_ORDER.map((stage, idx) => {
          const isActive = stage === run.currentStage;
          const isDone = idx < currentIdx || run.currentStage === 'COMPLETED';
          return (
            <div
              key={stage}
              title={STAGE_SHORT[stage]}
              className={`w-2.5 h-2.5 rounded-full transition-colors ${
                isActive && run.status === 'running'
                  ? 'bg-blue-500 animate-pulse'
                  : isDone
                    ? 'bg-green-400'
                    : 'bg-gray-200'
              }`}
            />
          );
        })}
        <span className="ml-1.5 text-[10px] text-gray-500">
          {STAGE_SHORT[run.currentStage] || run.currentStage}
        </span>
      </div>
    );
  };

  // Run history columns
  const runColumns: Column<PipelineRun>[] = [
    {
      key: 'status',
      header: 'Status',
      render: (run) => (
        <span className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-full ${statusColors[run.status] || 'bg-gray-100 text-gray-700'}`}>
          {run.status === 'running' && <RefreshCw className="w-3 h-3 animate-spin" />}
          {run.status}
        </span>
      ),
    },
    {
      key: 'pipelineType',
      header: 'Type',
      render: (run) => {
        const pType = run.pipelineType || 'chain';
        return (
          <span className={`px-2 py-0.5 text-[10px] font-medium rounded ${pipelineTypeColors[pType] || 'bg-gray-100 text-gray-600'}`}>
            {pType === 'jobs' ? 'Jobs' : pType === 'profiles' ? 'Profiles' : 'Chain'}
          </span>
        );
      },
    },
    {
      key: 'currentStage',
      header: 'Stage',
      render: (run) => <StageProgress run={run} />,
    },
    {
      key: 'startedAt',
      header: 'Started',
      render: (run) => <span className="text-xs text-gray-600">{formatTime(run.startedAt || run.createdAt)}</span>,
    },
    {
      key: 'itemsCrawled',
      header: 'Crawled',
      render: (run) => <span className="text-sm text-green-600">{run.itemsCrawled}</span>,
    },
    {
      key: 'itemsEnriched',
      header: 'Enriched',
      render: (run) => <span className="text-sm text-purple-600">{run.itemsEnriched}</span>,
    },
    {
      key: 'itemsFailed',
      header: 'Failed',
      render: (run) => (
        <span className={`text-sm ${run.itemsFailed > 0 ? 'text-red-600 font-medium' : 'text-gray-400'}`}>
          {run.itemsFailed}
        </span>
      ),
    },
    {
      key: 'duration',
      header: 'Duration',
      render: (run) => <span className="text-xs text-gray-500">{formatDuration(run)}</span>,
    },
  ];

  const tabs: { key: PipelineTab; label: string; icon: React.ElementType; description: string }[] = [
    { key: 'jobs', label: 'Jobs + Companies', icon: Briefcase, description: 'Crawl job posts, enrich, extract companies, crawl company websites' },
    { key: 'profiles', label: 'Profiles', icon: Users, description: 'Crawl profiles, enrich, discover linked URLs, chain crawl' },
    { key: 'chain', label: 'Chain (Legacy)', icon: Link, description: 'Scan enriched data for discoverable URLs and auto-crawl them' },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard icon={Workflow} label="Total Runs" value={stats?.totalRuns ?? 0} gradient="from-indigo-500 to-purple-500" delay={0} />
        <StatsCard icon={Link} label="URLs Discovered" value={stats?.totalUrlsDiscovered ?? 0} gradient="from-indigo-400 to-blue-500" delay={0.05} />
        <StatsCard icon={Scan} label="Items Crawled" value={stats?.totalItemsCrawled ?? 0} gradient="from-blue-500 to-cyan-500" delay={0.1} />
        <StatsCard icon={Play} label="Items Enriched" value={stats?.totalItemsEnriched ?? 0} gradient="from-purple-500 to-pink-500" delay={0.15} />
      </div>

      {/* Pipeline Type Tabs + Configuration */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl shadow-sm border border-gray-100"
      >
        {/* Tab Bar */}
        <div className="flex border-b border-gray-100">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-colors border-b-2 ${
                activeTab === tab.key
                  ? 'border-indigo-500 text-indigo-700 bg-indigo-50/50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          <p className="text-xs text-gray-500 mb-5">
            {tabs.find(t => t.key === activeTab)?.description}
          </p>

          {/* Jobs + Companies Config */}
          {activeTab === 'jobs' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Job Source</label>
                  <select
                    value={jobsSource}
                    onChange={(e) => setJobsSource(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  >
                    {jobSourceOptions.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Limit</label>
                  <input
                    type="number"
                    min={1}
                    max={500}
                    value={jobsLimit}
                    onChange={(e) => setJobsLimit(Number(e.target.value) || 50)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Crawl Company Websites</label>
                  <button
                    onClick={() => setCrawlCompanyWebsites(!crawlCompanyWebsites)}
                    className={`w-full px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                      crawlCompanyWebsites
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                        : 'bg-gray-50 border-gray-200 text-gray-500'
                    }`}
                  >
                    {crawlCompanyWebsites ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
              </div>
              {jobsSource === 'generic' ? (
                <GenericCrawlerConfig
                  urls={genericUrls} onUrlsChange={setGenericUrls}
                  mode={genericMode} onModeChange={setGenericMode}
                  contentType={genericContentType} onContentTypeChange={setGenericContentType}
                  fetchMethod={genericFetchMethod} onFetchMethodChange={setGenericFetchMethod}
                  customPrompt={genericCustomPrompt} onCustomPromptChange={setGenericCustomPrompt}
                  autoPaginate={genericAutoPaginate} onAutoPaginateChange={setGenericAutoPaginate}
                  maxPages={genericMaxPages} onMaxPagesChange={setGenericMaxPages}
                  startPage={genericStartPage} onStartPageChange={setGenericStartPage}
                />
              ) : (
                <SourceCrawlerConfig
                  source={jobsSource}
                  githubQuery={githubQuery} onGithubQueryChange={setGithubQuery}
                  soMinReputation={soMinReputation} onSoMinReputationChange={setSoMinReputation}
                  soSort={soSort} onSoSortChange={setSoSort}
                  wantedlyLocation={wantedlyLocation} onWantedlyLocationChange={setWantedlyLocation}
                  remoteokTag={remoteokTag} onRemoteokTagChange={setRemoteokTag}
                  wwrCategory={wwrCategory} onWwrCategoryChange={setWwrCategory}
                  hnMonth={hnMonth} onHnMonthChange={setHnMonth}
                  hnYear={hnYear} onHnYearChange={setHnYear}
                  gjMaxUrls={gjMaxUrls} onGjMaxUrlsChange={setGjMaxUrls}
                  autoPaginate={srcAutoPaginate} onAutoPaginateChange={setSrcAutoPaginate}
                  maxPages={srcMaxPages} onMaxPagesChange={setSrcMaxPages}
                  startPage={srcStartPage} onStartPageChange={setSrcStartPage}
                />
              )}
              <button
                onClick={handleRunJobsPipeline}
                disabled={running}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50"
              >
                {running ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                Run Jobs Pipeline
              </button>
            </>
          )}

          {/* Profiles Config */}
          {activeTab === 'profiles' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Profile Source</label>
                  <select
                    value={profilesSource}
                    onChange={(e) => setProfilesSource(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  >
                    {profileSourceOptions.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Limit</label>
                  <input
                    type="number"
                    min={1}
                    max={500}
                    value={profilesLimit}
                    onChange={(e) => setProfilesLimit(Number(e.target.value) || 50)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>
              <div className="mb-5">
                <label className="block text-xs font-medium text-gray-600 mb-2">Chain URL Types</label>
                <div className="flex flex-wrap gap-2">
                  {urlTypeOptions.map((t) => (
                    <button
                      key={t}
                      onClick={() => toggleChainUrlType(t)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                        chainUrlTypes.includes(t)
                          ? 'bg-cyan-50 border-cyan-300 text-cyan-700'
                          : 'bg-gray-50 border-gray-200 text-gray-400'
                      }`}
                    >
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              {profilesSource === 'generic' ? (
                <GenericCrawlerConfig
                  urls={genericUrls} onUrlsChange={setGenericUrls}
                  mode={genericMode} onModeChange={setGenericMode}
                  contentType={genericContentType} onContentTypeChange={setGenericContentType}
                  fetchMethod={genericFetchMethod} onFetchMethodChange={setGenericFetchMethod}
                  customPrompt={genericCustomPrompt} onCustomPromptChange={setGenericCustomPrompt}
                  autoPaginate={genericAutoPaginate} onAutoPaginateChange={setGenericAutoPaginate}
                  maxPages={genericMaxPages} onMaxPagesChange={setGenericMaxPages}
                  startPage={genericStartPage} onStartPageChange={setGenericStartPage}
                />
              ) : (
                <SourceCrawlerConfig
                  source={profilesSource}
                  githubQuery={githubQuery} onGithubQueryChange={setGithubQuery}
                  soMinReputation={soMinReputation} onSoMinReputationChange={setSoMinReputation}
                  soSort={soSort} onSoSortChange={setSoSort}
                  wantedlyLocation={wantedlyLocation} onWantedlyLocationChange={setWantedlyLocation}
                  remoteokTag={remoteokTag} onRemoteokTagChange={setRemoteokTag}
                  wwrCategory={wwrCategory} onWwrCategoryChange={setWwrCategory}
                  hnMonth={hnMonth} onHnMonthChange={setHnMonth}
                  hnYear={hnYear} onHnYearChange={setHnYear}
                  gjMaxUrls={gjMaxUrls} onGjMaxUrlsChange={setGjMaxUrls}
                  autoPaginate={srcAutoPaginate} onAutoPaginateChange={setSrcAutoPaginate}
                  maxPages={srcMaxPages} onMaxPagesChange={setSrcMaxPages}
                  startPage={srcStartPage} onStartPageChange={setSrcStartPage}
                />
              )}
              <button
                onClick={handleRunProfilesPipeline}
                disabled={running}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-cyan-600 rounded-lg hover:bg-cyan-700 transition-colors disabled:opacity-50"
              >
                {running ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                Run Profiles Pipeline
              </button>
            </>
          )}

          {/* Chain (Legacy) Config */}
          {activeTab === 'chain' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Source Filter</label>
                  <select
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  >
                    <option value="">All Sources</option>
                    {chainSourceOptions.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Type Filter</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  >
                    <option value="">All Types</option>
                    {typeOptions.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Limit</label>
                  <input
                    type="number"
                    min={1}
                    max={500}
                    value={limit}
                    onChange={(e) => setLimit(Number(e.target.value) || 100)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Auto-Enrich</label>
                  <button
                    onClick={() => setAutoEnrich(!autoEnrich)}
                    className={`w-full px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                      autoEnrich
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                        : 'bg-gray-50 border-gray-200 text-gray-500'
                    }`}
                  >
                    {autoEnrich ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
              </div>
              <div className="mb-5">
                <label className="block text-xs font-medium text-gray-600 mb-2">URL Types to Extract</label>
                <div className="flex flex-wrap gap-2">
                  {urlTypeOptions.map((t) => (
                    <button
                      key={t}
                      onClick={() => toggleUrlType(t)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                        urlTypes.includes(t)
                          ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                          : 'bg-gray-50 border-gray-200 text-gray-400'
                      }`}
                    >
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleScan}
                  disabled={scanning || running}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors disabled:opacity-50"
                >
                  {scanning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Scan className="w-4 h-4" />}
                  Scan
                </button>
                <button
                  onClick={handleChainRun}
                  disabled={scanning || running}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {running ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  Run Chain Pipeline
                </button>
              </div>
            </>
          )}
        </div>
      </motion.div>

      {/* Scan Results Preview (Chain only) */}
      <AnimatePresence>
        {scanResult && activeTab === 'chain' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
          >
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Scan className="w-5 h-5 text-indigo-600" />
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">Scan Results</h3>
                    <p className="text-xs text-gray-500">
                      Scanned {scanResult.totalProfilesScanned} profiles &rarr; Found {scanResult.newUrls.length} new URLs ({scanResult.alreadyCrawled} already crawled)
                    </p>
                  </div>
                </div>
                <button onClick={() => setScanResult(null)} className="p-1 hover:bg-gray-100 rounded">
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              <div className="flex flex-wrap gap-3 mb-4">
                {Object.entries(scanResult.urlsByType).map(([urlType, count]) => (
                  <div key={urlType} className="px-3 py-1.5 bg-indigo-50 rounded-lg">
                    <span className="text-xs font-medium text-indigo-700 capitalize">{urlType}: {count}</span>
                  </div>
                ))}
                {Object.keys(scanResult.urlsByType).length === 0 && (
                  <span className="text-xs text-gray-400">No new URLs found</span>
                )}
              </div>

              {scanResult.newUrls.length > 0 && (
                <>
                  <button
                    onClick={() => setScanExpanded(!scanExpanded)}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 mb-2"
                  >
                    {scanExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    {scanExpanded ? 'Hide' : 'Show'} discovered URLs ({scanResult.newUrls.length})
                  </button>
                  {scanExpanded && (
                    <div className="max-h-64 overflow-y-auto space-y-1.5">
                      {scanResult.newUrls.map((item, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.02 }}
                          className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                              item.type === 'github' ? 'bg-gray-900 text-white' :
                              item.type === 'linkedin' ? 'bg-blue-600 text-white' :
                              item.type === 'website' ? 'bg-green-100 text-green-700' :
                              'bg-orange-100 text-orange-700'
                            }`}>
                              {item.type}
                            </span>
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 hover:underline truncate"
                            >
                              {item.url}
                            </a>
                            <ExternalLink className="w-3 h-3 text-gray-400 flex-shrink-0" />
                          </div>
                          <span className="text-gray-400 ml-2 flex-shrink-0 truncate max-w-[200px]">
                            {item.sourceName}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Run History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-xl shadow-sm border border-gray-100"
      >
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-indigo-600" />
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Run History</h3>
              <p className="text-xs text-gray-500">All pipeline executions across types</p>
            </div>
          </div>
        </div>
        <DataTable
          columns={runColumns}
          data={runs}
          loading={runsLoading}
          total={runsTotal}
          limit={20}
          offset={runsOffset}
          onPageChange={setRunsOffset}
          onRowClick={setSelectedRun}
          emptyMessage="No pipeline runs yet"
          emptyIcon={<Workflow className="w-8 h-8 text-gray-300" />}
        />
      </motion.div>

      {/* Run Detail Modal */}
      <AnimatePresence>
        {selectedRun && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedRun(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Pipeline Run Details</h3>
                  <p className="text-xs text-gray-500 mt-1">ID: {selectedRun.id}</p>
                </div>
                <button onClick={() => setSelectedRun(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {/* Status + Type + Stage */}
                <div className="flex items-center gap-3 flex-wrap">
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${statusColors[selectedRun.status]}`}>
                    {selectedRun.status}
                  </span>
                  <span className={`px-2 py-0.5 text-[10px] font-medium rounded ${pipelineTypeColors[selectedRun.pipelineType || 'chain']}`}>
                    {selectedRun.pipelineType === 'jobs' ? 'Jobs + Companies' : selectedRun.pipelineType === 'profiles' ? 'Profiles' : 'Chain'}
                  </span>
                  <span className="text-xs text-gray-500">Duration: {formatDuration(selectedRun)}</span>
                </div>

                {/* Stage Progression */}
                {selectedRun.pipelineType && selectedRun.pipelineType !== 'chain' && (
                  <div>
                    <h4 className="text-xs font-medium text-gray-600 mb-2">Stage Progression</h4>
                    <div className="flex items-center gap-1">
                      {STAGE_ORDER.map((stage, idx) => {
                        const currentIdx = STAGE_ORDER.indexOf(selectedRun.currentStage as PipelineStage);
                        const isActive = stage === selectedRun.currentStage;
                        const isDone = idx < currentIdx || selectedRun.currentStage === 'COMPLETED';
                        return (
                          <React.Fragment key={stage}>
                            {idx > 0 && <div className={`h-0.5 w-4 ${isDone ? 'bg-green-300' : 'bg-gray-200'}`} />}
                            <div
                              className={`px-2 py-1 text-[10px] font-medium rounded ${
                                isActive && selectedRun.status === 'running'
                                  ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-300'
                                  : isDone
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-gray-100 text-gray-400'
                              }`}
                            >
                              {STAGE_SHORT[stage]}
                            </div>
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>
                )}

                {selectedRun.errorMessage && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    {selectedRun.errorMessage}
                  </div>
                )}

                {/* Counters */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: 'Items Crawled', value: selectedRun.itemsCrawled, color: 'text-green-600' },
                    { label: 'Items Enriched', value: selectedRun.itemsEnriched, color: 'text-purple-600' },
                    { label: 'To Enrich', value: selectedRun.itemsToEnrich, color: 'text-indigo-600' },
                    { label: 'Items Failed', value: selectedRun.itemsFailed, color: selectedRun.itemsFailed > 0 ? 'text-red-600' : 'text-gray-400' },
                    ...(selectedRun.pipelineType === 'chain' ? [
                      { label: 'Profiles Scanned', value: selectedRun.profilesScanned, color: 'text-gray-900' },
                      { label: 'URLs Discovered', value: selectedRun.urlsDiscovered, color: 'text-indigo-600' },
                      { label: 'Already Crawled', value: selectedRun.urlsAlreadyCrawled, color: 'text-gray-500' },
                      { label: 'New URLs', value: selectedRun.urlsNew, color: 'text-indigo-700 font-semibold' },
                    ] : []),
                  ].map((item) => (
                    <div key={item.label} className="bg-gray-50 rounded-lg p-3">
                      <div className="text-[11px] text-gray-500">{item.label}</div>
                      <div className={`text-lg font-semibold ${item.color}`}>{item.value}</div>
                    </div>
                  ))}
                </div>

                {/* Config */}
                {selectedRun.config && Object.keys(selectedRun.config).length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-gray-600 mb-2">Configuration</h4>
                    <div className="bg-gray-50 rounded-lg p-3 text-xs font-mono whitespace-pre-wrap">
                      {JSON.stringify(selectedRun.config, null, 2)}
                    </div>
                  </div>
                )}

                {/* Discovered URLs (Chain only) */}
                {selectedRun.discoveredUrls && selectedRun.discoveredUrls.length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-gray-600 mb-2">
                      Discovered URLs ({selectedRun.discoveredUrls.length})
                    </h4>
                    <div className="max-h-48 overflow-y-auto space-y-1">
                      {selectedRun.discoveredUrls.map((item, i) => (
                        <div key={i} className="flex items-center gap-2 px-2 py-1 bg-gray-50 rounded text-xs">
                          <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded text-[10px] font-medium">
                            {item.type}
                          </span>
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:underline truncate"
                          >
                            {item.url}
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Timestamps */}
                <div className="text-xs text-gray-400 space-y-1 pt-2 border-t border-gray-100">
                  <div>Created: {formatTime(selectedRun.createdAt)}</div>
                  {selectedRun.startedAt && <div>Started: {formatTime(selectedRun.startedAt)}</div>}
                  {selectedRun.completedAt && <div>Completed: {formatTime(selectedRun.completedAt)}</div>}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Pipelines;
