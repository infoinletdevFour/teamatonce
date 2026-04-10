import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  MapPin,
  Globe,
  Mail,
  Building2,
  Briefcase,
  ChevronDown,
  AlertCircle,
  ExternalLink,
  Copy,
  Check,
  X,
  DollarSign,
  Monitor,
  Tag,
  Clock,
  BarChart3,
  Link2,
} from 'lucide-react';
import DataTable, { Column } from '@/components/data-engine/DataTable';
import JsonViewer from '@/components/data-engine/JsonViewer';
import * as api from '@/services/dataEngineService';
import type { CompanyDetail, EntitySourceDetail } from '@/types/data-engine';

const CopyButton: React.FC<{ text: string }> = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} className="p-1 hover:bg-gray-200 rounded transition-colors" title="Copy">
      {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-gray-400" />}
    </button>
  );
};

const SourceCard: React.FC<{
  source: EntitySourceDetail;
  index: number;
}> = ({ source, index }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white rounded-xl border border-gray-200 overflow-hidden"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="px-2.5 py-1 text-xs font-semibold rounded-lg capitalize bg-blue-50 text-blue-700">
          {source.profile.source}
        </span>
        <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">{source.matchType}</span>
        <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full font-medium">
          {(source.confidenceScore * 100).toFixed(0)}%
        </span>
        {source.profile.summary && (
          <span className="text-xs text-gray-500 truncate max-w-[300px] hidden sm:inline ml-auto mr-2">
            {source.profile.summary}
          </span>
        )}
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${expanded ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">
              {source.profile.summary && (
                <div>
                  <h5 className="text-xs font-semibold text-gray-500 uppercase mb-1">Summary</h5>
                  <p className="text-sm text-gray-700">{source.profile.summary}</p>
                </div>
              )}
              {Object.keys(source.profile.structuredData).length > 0 && (
                <div>
                  <h5 className="text-xs font-semibold text-gray-500 uppercase mb-1">Structured Data</h5>
                  <JsonViewer data={source.profile.structuredData} initialExpanded={false} />
                </div>
              )}
              {Object.keys(source.rawData).length > 0 && (
                <div>
                  <h5 className="text-xs font-semibold text-gray-500 uppercase mb-1">Raw Data</h5>
                  <JsonViewer data={source.rawData} initialExpanded={false} />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

/**
 * Derive a logo URL for a company. Priority:
 * 1. logoUrl from merged data (e.g. RemoteOK crawler)
 * 2. Google favicon from company website domain
 * 3. null (fallback to letter avatar)
 */
function getCompanyLogoUrl(merged: Record<string, any>): string | null {
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

const CompanyLogo: React.FC<{ name: string; logoUrl: string | null; size?: string }> = ({ name, logoUrl, size = 'w-14 h-14' }) => {
  const [imgError, setImgError] = useState(false);

  if (logoUrl && !imgError) {
    return (
      <img
        src={logoUrl}
        alt={name}
        className={`${size} rounded-xl object-contain bg-white border border-gray-100 flex-shrink-0`}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div className={`${size} rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-xl font-bold flex-shrink-0`}>
      {name?.charAt(0)?.toUpperCase() || '?'}
    </div>
  );
};

const JobDetailModal: React.FC<{
  source: EntitySourceDetail;
  onClose: () => void;
}> = ({ source, onClose }) => {
  const sd = source.profile.structuredData as Record<string, any>;
  const rd = source.rawData as Record<string, any>;

  const title = rd.title || sd.summary?.split('.')[0] || 'Job Post';
  const company = rd.company || sd.companyInfo?.name;
  const salary = rd.salary || rd.compensation;
  const budget = sd.budgetRange;
  const hasBudget = budget && (budget.min || budget.max);
  const sourceUrl = rd._sourceUrl || rd.sourceUrl;
  const applicationUrl = rd.applicationUrl;
  const description = rd.description || rd._originalText;
  const technologies = (sd.technologies || []) as string[];
  const tags = (rd.tags || []) as string[];
  const remotePolicy = sd.remotePolicy || rd.remotePolicy;
  const complexity = sd.complexity;
  const projectType = sd.projectType;
  const urgency = sd.urgency;
  const location = rd.location || sd.companyInfo?.location;
  const jobType = rd.jobType;

  const formatBudget = () => {
    if (!hasBudget) return null;
    const fmt = (n: number) => {
      if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
      if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
      return n.toLocaleString();
    };
    const parts: string[] = [];
    if (budget.min) parts.push(fmt(budget.min));
    if (budget.max) parts.push(fmt(budget.max));
    const range = parts.join(' - ');
    return `${budget.currency || ''} ${range}`.trim();
  };

  const policyColors: Record<string, string> = {
    remote: 'bg-green-100 text-green-700',
    hybrid: 'bg-blue-100 text-blue-700',
    onsite: 'bg-amber-100 text-amber-700',
  };

  const complexityColors: Record<string, string> = {
    junior: 'bg-green-100 text-green-700',
    mid: 'bg-blue-100 text-blue-700',
    senior: 'bg-purple-100 text-purple-700',
    expert: 'bg-red-100 text-red-700',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-start justify-between rounded-t-2xl z-10">
          <div className="flex-1 min-w-0 pr-4">
            <h2 className="text-lg font-bold text-gray-900 leading-tight">{title}</h2>
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              {company && (
                <span className="text-sm text-gray-600 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" />
                  {company}
                </span>
              )}
              {location && (
                <span className="text-sm text-gray-500 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {location}
                </span>
              )}
              {source.profile.source && (
                <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-50 text-blue-700 capitalize">
                  {source.profile.source}
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Badges Row */}
          <div className="flex flex-wrap gap-2">
            {remotePolicy && remotePolicy !== 'unknown' && (
              <span className={`px-2.5 py-1 text-xs font-medium rounded-full capitalize ${policyColors[remotePolicy] || 'bg-gray-100 text-gray-600'}`}>
                <Monitor className="w-3 h-3 inline mr-1" />
                {remotePolicy}
              </span>
            )}
            {complexity && complexity !== 'unknown' && (
              <span className={`px-2.5 py-1 text-xs font-medium rounded-full capitalize ${complexityColors[complexity] || 'bg-gray-100 text-gray-600'}`}>
                <BarChart3 className="w-3 h-3 inline mr-1" />
                {complexity}
              </span>
            )}
            {projectType && projectType !== 'other' && (
              <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600 capitalize">
                {projectType.replace('_', ' ')}
              </span>
            )}
            {jobType && (
              <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600 capitalize">
                {jobType}
              </span>
            )}
            {urgency && urgency !== 'unknown' && (
              <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-orange-50 text-orange-700 capitalize">
                <Clock className="w-3 h-3 inline mr-1" />
                {urgency}
              </span>
            )}
          </div>

          {/* Salary / Budget */}
          {(salary || hasBudget) && (
            <div className="bg-green-50 border border-green-100 rounded-xl p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-600" />
                <span className="text-sm font-semibold text-green-800">Compensation</span>
              </div>
              {salary && <p className="text-sm text-green-700 mt-1">{salary}</p>}
              {hasBudget && (
                <p className="text-sm text-green-700 mt-0.5 font-mono">{formatBudget()}</p>
              )}
            </div>
          )}

          {/* Summary */}
          {sd.summary && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1.5">Summary</h4>
              <p className="text-sm text-gray-700 leading-relaxed">{sd.summary}</p>
            </div>
          )}

          {/* Description */}
          {description && description !== sd.summary && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1.5">Description</h4>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line line-clamp-6">{description}</p>
            </div>
          )}

          {/* Technologies */}
          {technologies.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Technologies</h4>
              <div className="flex flex-wrap gap-1.5">
                {technologies.map(t => (
                  <span key={t} className="px-2.5 py-1 text-xs bg-blue-50 text-blue-700 rounded-full">{t}</span>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2 flex items-center gap-1">
                <Tag className="w-3 h-3" /> Tags
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {tags.map(t => (
                  <span key={t} className="px-2.5 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">{t}</span>
                ))}
              </div>
            </div>
          )}

          {/* Links */}
          {(sourceUrl || applicationUrl) && (
            <div className="border-t border-gray-100 pt-4 space-y-2">
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2 flex items-center gap-1">
                <Link2 className="w-3 h-3" /> Links
              </h4>
              {applicationUrl && (
                <a
                  href={applicationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors w-fit"
                >
                  Apply Now
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
              {sourceUrl && (
                <a
                  href={sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 hover:underline w-fit"
                >
                  View Original Posting
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          )}

          {/* Metadata footer */}
          <div className="border-t border-gray-100 pt-3 flex items-center gap-4 text-xs text-gray-400">
            {source.profile.enrichedAt && (
              <span>Enriched: {new Date(source.profile.enrichedAt).toLocaleDateString()}</span>
            )}
            <span>Confidence: {(source.confidenceScore * 100).toFixed(0)}%</span>
            <span className="capitalize">Match: {source.matchType}</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const CompanyProfile: React.FC = () => {
  const { companyId } = useParams<{ companyId: string }>();
  const navigate = useNavigate();

  const [detail, setDetail] = useState<CompanyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<EntitySourceDetail | null>(null);

  const fetchData = useCallback(async () => {
    if (!companyId) return;
    try {
      setLoading(true);
      setError(null);
      const result = await api.getCompanyDetail(companyId);
      setDetail(result);
    } catch {
      setError('Failed to load company profile');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
          <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            {error || 'Company not found'}
          </h2>
          <div className="flex gap-3 justify-center mt-6">
            <button
              onClick={fetchData}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
            <button
              onClick={() => navigate('/admin/data-engine/companies')}
              className="px-4 py-2 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Back to Companies
            </button>
          </div>
        </div>
      </div>
    );
  }

  const company = detail.entity;
  const merged = company.mergedData || {};
  const technologies = merged.technologies || [];
  const locations = merged.locations || [];
  const jobSources = detail.sources.filter(s => s.profile.type === 'job_post');

  const jobColumns: Column<EntitySourceDetail>[] = [
    {
      key: 'summary',
      header: 'Job Summary',
      render: (s) => (
        <div className="max-w-md">
          <span className="text-sm text-gray-700 line-clamp-2">
            {s.profile.summary || (s.profile.structuredData as Record<string, unknown>)?.summary as string || '-'}
          </span>
        </div>
      ),
    },
    {
      key: 'source',
      header: 'Source',
      render: (s) => (
        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-50 text-blue-700 capitalize">
          {s.profile.source}
        </span>
      ),
    },
    {
      key: 'technologies',
      header: 'Technologies',
      render: (s) => {
        const techs = ((s.profile.structuredData as Record<string, unknown>)?.technologies || []) as string[];
        return (
          <div className="flex flex-wrap gap-1">
            {techs.slice(0, 3).map(t => (
              <span key={t} className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">{t}</span>
            ))}
            {techs.length > 3 && <span className="text-xs text-gray-400">+{techs.length - 3}</span>}
          </div>
        );
      },
    },
    {
      key: 'confidence',
      header: 'Confidence',
      render: (s) => (
        <span className="text-sm font-mono">{(s.confidenceScore * 100).toFixed(0)}%</span>
      ),
    },
    {
      key: 'enrichedAt',
      header: 'Crawled',
      render: (s) => (
        <span className="text-xs text-gray-400" title="Date crawled by our system">
          {s.profile.enrichedAt ? new Date(s.profile.enrichedAt).toLocaleDateString() : '-'}
        </span>
      ),
    },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-3 text-sm">
        <button
          onClick={() => navigate('/admin/data-engine/companies')}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <nav className="flex items-center gap-1.5 text-gray-500">
          <button onClick={() => navigate('/admin/data-engine')} className="hover:text-gray-700">
            Data Engine
          </button>
          <span>/</span>
          <button onClick={() => navigate('/admin/data-engine/companies')} className="hover:text-gray-700">
            Companies
          </button>
          <span>/</span>
          <span className="text-gray-900 font-medium">{company.name}</span>
        </nav>
      </div>

      {/* Company Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-start gap-4">
          <CompanyLogo name={company.name} logoUrl={getCompanyLogoUrl(merged)} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900">{company.name}</h1>
              <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${
                merged.hiringActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
              }`}>
                {merged.hiringActive ? 'Actively Hiring' : 'Inactive'}
              </span>
              {merged.industry && (
                <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-purple-100 text-purple-700">
                  {merged.industry}
                </span>
              )}
              {merged.size && merged.size !== 'unknown' && (
                <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-700 capitalize">
                  {merged.size}
                </span>
              )}
            </div>

            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 flex-wrap">
              {company.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{company.location}</span>
                </div>
              )}
              {merged.website && (
                <div className="flex items-center gap-1">
                  <Globe className="w-4 h-4" />
                  <a
                    href={merged.website.startsWith('http') ? merged.website : `https://${merged.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline flex items-center gap-1"
                  >
                    {merged.website}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <CopyButton text={merged.website} />
                </div>
              )}
              {merged.contactEmail && (
                <div className="flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  <a href={`mailto:${merged.contactEmail}`} className="text-blue-600 hover:underline">
                    {merged.contactEmail}
                  </a>
                  <CopyButton text={merged.contactEmail} />
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="flex items-center gap-6 mt-3 text-sm">
              <div className="flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-gray-400" />
                <span className="font-medium text-gray-900">{merged.hiringVolume || 0}</span>
                <span className="text-gray-500">job posts</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-gray-400" />
                <span className="font-medium text-gray-900">{company.sourceCount || 0}</span>
                <span className="text-gray-500">linked sources</span>
              </div>
              {merged.lastJobPostedAt && (
                <div className="text-gray-500">
                  Last job: {new Date(merged.lastJobPostedAt).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tech Stack */}
      {technologies.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Technology Stack</h3>
          <div className="flex flex-wrap gap-2">
            {technologies.map((tech) => (
              <span key={tech} className="px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded-full">
                {tech}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Locations */}
      {locations.length > 1 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Locations</h3>
          <div className="flex flex-wrap gap-2">
            {locations.map((loc) => (
              <span key={loc} className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-gray-50 text-gray-700 rounded-full">
                <MapPin className="w-3 h-3" />
                {loc}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Job Posts Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900">Job Posts ({jobSources.length})</h3>
        </div>
        <DataTable
          columns={jobColumns}
          data={jobSources}
          total={jobSources.length}
          limit={20}
          onRowClick={(s) => setSelectedJob(s)}
          emptyMessage="No job posts linked to this company"
        />
      </div>

      {/* All Sources (expandable) */}
      {detail.sources.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">All Linked Sources ({detail.sources.length})</h3>
          <div className="space-y-3">
            {detail.sources.map((source, i) => (
              <SourceCard key={i} source={source} index={i} />
            ))}
          </div>
        </div>
      )}

      {/* Job Detail Modal */}
      <AnimatePresence>
        {selectedJob && (
          <JobDetailModal source={selectedJob} onClose={() => setSelectedJob(null)} />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default CompanyProfile;
