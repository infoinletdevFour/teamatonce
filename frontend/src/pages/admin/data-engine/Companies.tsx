import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Building2,
  Briefcase,
  TrendingUp,
  RefreshCw,
  Search,
} from 'lucide-react';
import { toast } from 'sonner';
import StatsCard from '@/components/data-engine/StatsCard';
import DataTable, { Column } from '@/components/data-engine/DataTable';
import JobProgressModal from '@/components/data-engine/JobProgressModal';
import { useJobProgress } from '@/hooks/useJobProgress';
import * as api from '@/services/dataEngineService';
import type { CompanyEntity } from '@/types/data-engine';

function getCompanyLogoUrl(merged: Record<string, any> | undefined): string | null {
  if (!merged) return null;
  if (merged.logoUrl) return merged.logoUrl;
  if (merged.website) {
    try {
      const url = merged.website.startsWith('http') ? merged.website : `https://${merged.website}`;
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
    } catch {
      return null;
    }
  }
  return null;
}

const CompanyLogoSmall: React.FC<{ name: string; logoUrl: string | null }> = ({ name, logoUrl }) => {
  const [imgError, setImgError] = React.useState(false);

  if (logoUrl && !imgError) {
    return (
      <img
        src={logoUrl}
        alt={name}
        className="w-7 h-7 rounded object-contain bg-white border border-gray-100 flex-shrink-0"
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div className="w-7 h-7 rounded bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
      {name?.charAt(0)?.toUpperCase() || '?'}
    </div>
  );
};

const Companies: React.FC = () => {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState<CompanyEntity[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [hiringFilter, setHiringFilter] = useState<string>('');

  // Backfill modal state
  const [showBackfillModal, setShowBackfillModal] = useState(false);
  const [backfillLimit, setBackfillLimit] = useState(100);
  const [backfillSource, setBackfillSource] = useState('');
  const [backfillForce, setBackfillForce] = useState(false);
  const [backfillLoading, setBackfillLoading] = useState(false);

  // Job progress
  const backfillJob = useJobProgress();
  const [showProgressModal, setShowProgressModal] = useState(false);

  const fetchCompanies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params: Record<string, unknown> = { limit: 20, offset };
      if (search) params.search = search;
      if (hiringFilter === 'active') params.hiringActive = true;
      if (hiringFilter === 'inactive') params.hiringActive = false;
      const result = await api.getCompanies(params as any);
      setCompanies(result.data || []);
      setTotal(result.meta?.total ?? result.data?.length ?? 0);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load companies');
    } finally {
      setLoading(false);
    }
  }, [offset, search, hiringFilter]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  useEffect(() => {
    const handler = () => fetchCompanies();
    window.addEventListener('data-engine-refresh', handler);
    return () => window.removeEventListener('data-engine-refresh', handler);
  }, [fetchCompanies]);

  const handleSearch = () => {
    setSearch(searchInput);
    setOffset(0);
  };

  const handleBackfill = async () => {
    if (backfillLoading) return;
    try {
      setBackfillLoading(true);
      const { jobId } = await api.triggerBackfillCompanies({
        limit: backfillLimit,
        source: backfillSource || undefined,
        force: backfillForce || undefined,
      });
      setShowBackfillModal(false);
      setShowProgressModal(true);
      backfillJob.startJob(jobId);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to start backfill');
    } finally {
      setBackfillLoading(false);
    }
  };

  const handleSelectCompany = (company: CompanyEntity) => {
    navigate(company.id);
  };

  // Compute stats
  const totalCompanies = total;
  const activelyHiring = companies.filter(c => c.mergedData?.hiringActive).length;
  const avgJobs = companies.length > 0
    ? Math.round(companies.reduce((sum, c) => sum + (c.mergedData?.hiringVolume || 0), 0) / companies.length)
    : 0;

  const columns: Column<CompanyEntity>[] = [
    {
      key: 'name',
      header: 'Company',
      render: (c) => (
        <div className="flex items-center gap-2.5">
          <CompanyLogoSmall name={c.name} logoUrl={getCompanyLogoUrl(c.mergedData)} />
          <div>
            <span className="font-medium text-gray-900">{c.name}</span>
            {c.mergedData?.website && (
              <div className="text-xs text-gray-400">{c.mergedData.website}</div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'industry',
      header: 'Industry',
      render: (c) => c.mergedData?.industry || <span className="text-gray-400">-</span>,
    },
    {
      key: 'technologies',
      header: 'Tech Stack',
      render: (c) => {
        const techs = c.mergedData?.technologies || [];
        if (techs.length === 0) return <span className="text-gray-400">-</span>;
        return (
          <div className="flex flex-wrap gap-1">
            {techs.slice(0, 3).map((t) => (
              <span key={t} className="px-1.5 py-0.5 text-xs bg-blue-50 text-blue-700 rounded">
                {t}
              </span>
            ))}
            {techs.length > 3 && (
              <span className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-500 rounded">
                +{techs.length - 3}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'hiringVolume',
      header: 'Jobs',
      render: (c) => c.mergedData?.hiringVolume || 0,
    },
    {
      key: 'hiringActive',
      header: 'Status',
      render: (c) => (
        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
          c.mergedData?.hiringActive
            ? 'bg-green-100 text-green-700'
            : 'bg-gray-100 text-gray-500'
        }`}>
          {c.mergedData?.hiringActive ? 'Hiring' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'location',
      header: 'Location',
      render: (c) => {
        const locations = c.mergedData?.locations || [];
        if (c.location) return c.location;
        if (locations.length > 0) return locations[0];
        return <span className="text-gray-400">-</span>;
      },
    },
    {
      key: 'sourceCount',
      header: 'Sources',
      render: (c) => c.sourceCount || 0,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard icon={Building2} label="Total Companies" value={totalCompanies} gradient="from-blue-500 to-cyan-500" delay={0} />
        <StatsCard icon={Briefcase} label="Actively Hiring" value={activelyHiring} gradient="from-green-500 to-emerald-500" delay={0.05} />
        <StatsCard icon={TrendingUp} label="Avg Jobs/Company" value={avgJobs} gradient="from-purple-500 to-pink-500" delay={0.1} />
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search companies..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 w-64"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Search
          </button>
        </div>
        <select
          value={hiringFilter}
          onChange={(e) => { setHiringFilter(e.target.value); setOffset(0); }}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Status</option>
          <option value="active">Actively Hiring</option>
          <option value="inactive">Inactive</option>
        </select>
        <div className="ml-auto">
          <button
            onClick={() => setShowBackfillModal(true)}
            className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
          >
            Backfill Companies
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <DataTable
          columns={columns}
          data={companies}
          loading={loading}
          error={error || undefined}
          total={total}
          limit={20}
          offset={offset}
          onPageChange={setOffset}
          onRowClick={handleSelectCompany}
          onRetry={fetchCompanies}
          emptyMessage="No companies found. Run backfill to extract companies from job posts."
        />
      </div>

      {/* Backfill Modal */}
      <AnimatePresence>
        {showBackfillModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowBackfillModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Backfill Companies</h3>
              <p className="text-sm text-gray-500 mb-4">
                Extract company entities from existing enriched job posts that don&apos;t have a linked company yet.
              </p>
              <div className="space-y-3 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Limit</label>
                  <input
                    type="number"
                    value={backfillLimit}
                    onChange={(e) => setBackfillLimit(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                    min={1}
                    max={1000}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Source Filter (optional)</label>
                  <select
                    value={backfillSource}
                    onChange={(e) => setBackfillSource(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Sources</option>
                    <option value="hackernews">Hacker News</option>
                    <option value="remoteok">RemoteOK</option>
                    <option value="tokyodev">TokyoDev</option>
                    <option value="arbeitnow">Arbeitnow</option>
                    <option value="weworkremotely">WeWorkRemotely</option>
                    <option value="wantedly">Wantedly</option>
                    <option value="greenjapan">Green Japan</option>
                    <option value="japandev">Japan Dev</option>
                    <option value="generic">Generic</option>
                  </select>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={backfillForce}
                    onChange={(e) => setBackfillForce(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Force re-process already linked jobs</span>
                </label>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowBackfillModal(false)}
                  disabled={backfillLoading}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBackfill}
                  disabled={backfillLoading}
                  className="flex-1 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {backfillLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
                  {backfillLoading ? 'Processing...' : 'Backfill'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress Modal */}
      <JobProgressModal
        open={showProgressModal}
        onClose={() => { setShowProgressModal(false); backfillJob.reset(); }}
        title="Backfill Companies"
        job={backfillJob}
        onRetry={() => { backfillJob.reset(); setShowBackfillModal(true); setShowProgressModal(false); }}
        onSuccess={fetchCompanies}
      />
    </div>
  );
};

export default Companies;
