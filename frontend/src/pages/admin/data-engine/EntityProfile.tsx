import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import * as Tabs from '@radix-ui/react-tabs';
import {
  ArrowLeft,
  MapPin,
  Building,
  Mail,
  Globe,
  Copy,
  Check,
  ExternalLink,
  ChevronDown,
  RefreshCw,
  Github,
  Twitter,
  Linkedin,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import DataTable, { Column } from '@/components/data-engine/DataTable';
import ScoreBar from '@/components/data-engine/ScoreBar';
import JsonViewer from '@/components/data-engine/JsonViewer';
import * as api from '@/services/dataEngineService';
import type { EntityDetail, EntityScore, Match } from '@/types/data-engine';

// ============================================
// Source icon color map
// ============================================
const sourceColors: Record<string, string> = {
  github: 'text-gray-900 bg-gray-100',
  hackernews: 'text-orange-600 bg-orange-50',
  stackoverflow: 'text-orange-700 bg-orange-50',
  remoteok: 'text-green-600 bg-green-50',
  tokyodev: 'text-red-500 bg-red-50',
  arbeitnow: 'text-blue-600 bg-blue-50',
  weworkremotely: 'text-indigo-600 bg-indigo-50',
  wantedly: 'text-pink-500 bg-pink-50',
  generic: 'text-gray-500 bg-gray-50',
};

// Score dimension colors for circular gauges
const dimensionConfig = [
  { key: 'quality', label: 'Quality', color: '#3b82f6', bg: 'bg-blue-50' },
  { key: 'activity', label: 'Activity', color: '#22c55e', bg: 'bg-green-50' },
  { key: 'completeness', label: 'Completeness', color: '#a855f7', bg: 'bg-purple-50' },
  { key: 'availability', label: 'Availability', color: '#f97316', bg: 'bg-orange-50' },
] as const;

// ============================================
// Circular Score Gauge
// ============================================
const CircularGauge: React.FC<{ value: number; label: string; color: string; bg: string }> = ({
  value,
  label,
  color,
  bg,
}) => {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(100, Math.max(0, value));
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className={`${bg} rounded-xl p-4 flex flex-col items-center`}>
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="8" />
        <motion.circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
          transform="rotate(-90 50 50)"
        />
        <text x="50" y="50" textAnchor="middle" dominantBaseline="central" className="text-lg font-bold" fill={color}>
          {Math.round(value)}
        </text>
      </svg>
      <span className="text-sm font-medium text-gray-700 mt-1">{label}</span>
    </div>
  );
};

// ============================================
// Copy Button
// ============================================
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

// ============================================
// Social Link Pill
// ============================================
const SocialPill: React.FC<{
  icon: React.ReactNode;
  value: string;
  href?: string;
}> = ({ icon, value, href }) => (
  <div className="inline-flex items-center gap-1.5 bg-gray-100 rounded-full px-3 py-1.5 text-sm text-gray-700">
    {icon}
    <span className="max-w-[200px] truncate">{value}</span>
    <CopyButton text={value} />
    {href && (
      <a href={href} target="_blank" rel="noopener noreferrer" className="p-0.5 hover:text-blue-600">
        <ExternalLink className="w-3.5 h-3.5" />
      </a>
    )}
  </div>
);

// ============================================
// Expandable Source Card
// ============================================
const SourceCard: React.FC<{
  source: EntityDetail['sources'][number];
  index: number;
}> = ({ source, index }) => {
  const [expanded, setExpanded] = useState(false);
  const srcKey = source.profile.source.toLowerCase();
  const colorClass = sourceColors[srcKey] || sourceColors.generic;

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
        <span className={`px-2.5 py-1 text-xs font-semibold rounded-lg capitalize ${colorClass}`}>
          {source.profile.source}
        </span>
        <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">{source.matchType}</span>
        <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full font-medium">
          {(source.confidenceScore * 100).toFixed(0)}%
        </span>
        {source.profile.enrichedAt && (
          <span className="text-xs text-gray-400 ml-auto mr-2">
            {new Date(source.profile.enrichedAt).toLocaleDateString()}
          </span>
        )}
        {source.profile.summary && (
          <span className="text-xs text-gray-500 truncate max-w-[200px] hidden sm:inline">
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

// ============================================
// Score Breakdown fields per dimension
// ============================================
const breakdownFields: Record<string, Array<{ key: string; label: string; max: number }>> = {
  completeness: [
    { key: 'hasEmail', label: 'Has Email', max: 15 },
    { key: 'hasLocation', label: 'Has Location', max: 10 },
    { key: 'hasGithub', label: 'Has GitHub', max: 15 },
    { key: 'hasTwitter', label: 'Has Twitter', max: 10 },
    { key: 'hasLinkedin', label: 'Has LinkedIn', max: 10 },
    { key: 'hasSkills', label: 'Has Skills', max: 15 },
    { key: 'hasSummary', label: 'Has Summary', max: 10 },
    { key: 'sourceCountBonus', label: 'Source Count Bonus', max: 15 },
  ],
  activity: [
    { key: 'publicRepos', label: 'Public Repos', max: 40 },
    { key: 'followers', label: 'Followers', max: 30 },
    { key: 'influence', label: 'Influence', max: 30 },
  ],
  availability: [
    { key: 'hireable', label: 'Hireable', max: 40 },
    { key: 'keywords', label: 'Keywords', max: 40 },
    { key: 'freelancePlatform', label: 'Freelance Platform', max: 20 },
  ],
};

// ============================================
// Main Page Component
// ============================================
const EntityProfile: React.FC = () => {
  const { entityId } = useParams<{ entityId: string }>();
  const navigate = useNavigate();

  const [detail, setDetail] = useState<EntityDetail | null>(null);
  const [score, setScore] = useState<EntityScore | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [matchTotal, setMatchTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [summaryExpanded, setSummaryExpanded] = useState(false);
  const [rescoring, setRescoring] = useState(false);

  const fetchData = useCallback(async () => {
    if (!entityId) return;
    try {
      setLoading(true);
      setError(null);

      const [detailResult, scoreResult, matchResult] = await Promise.allSettled([
        api.getEntityDetail(entityId),
        api.getEntityScore(entityId),
        api.getMatchesByEntity(entityId, { limit: 20 }),
      ]);

      if (detailResult.status === 'fulfilled') {
        setDetail(detailResult.value);
      } else {
        setError('Failed to load entity details');
        return;
      }

      if (scoreResult.status === 'fulfilled') {
        setScore(scoreResult.value);
      }

      if (matchResult.status === 'fulfilled') {
        setMatches(matchResult.value.data || []);
        setMatchTotal(matchResult.value.meta?.total ?? matchResult.value.data?.length ?? 0);
      }
    } catch {
      setError('Failed to load entity profile');
    } finally {
      setLoading(false);
    }
  }, [entityId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleReScore = async () => {
    if (!entityId || rescoring) return;
    try {
      setRescoring(true);
      await api.scoreEntity(entityId);
      const newScore = await api.getEntityScore(entityId);
      setScore(newScore);
      toast.success('Entity re-scored successfully');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Scoring failed');
    } finally {
      setRescoring(false);
    }
  };

  // ============================================
  // Loading State
  // ============================================
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
          <div className="flex gap-4">
            <div className="w-16 h-16 bg-gray-200 rounded-full animate-pulse" />
            <div className="space-y-2 flex-1">
              <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-100 rounded-xl p-4 h-36 animate-pulse" />
          ))}
        </div>
        <div className="h-10 bg-gray-200 rounded animate-pulse" />
        <div className="bg-white rounded-xl border border-gray-100 p-6 h-64 animate-pulse" />
      </div>
    );
  }

  // ============================================
  // Error / Not Found
  // ============================================
  if (error || !detail) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            {error || 'Entity not found'}
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            The entity profile could not be loaded. It may have been removed or the ID is invalid.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={fetchData}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
            <button
              onClick={() => navigate('/admin/data-engine/entities')}
              className="px-4 py-2 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Back to Entities
            </button>
          </div>
        </div>
      </div>
    );
  }

  const entity = detail.entity;
  const merged = entity.mergedData;
  const summary = merged.summary;

  // Build social links
  const socialLinks: Array<{ key: string; icon: React.ReactNode; value: string; href?: string }> = [];
  if (entity.github) {
    socialLinks.push({
      key: 'github',
      icon: <Github className="w-4 h-4" />,
      value: entity.github,
      href: entity.github.startsWith('http') ? entity.github : `https://github.com/${entity.github}`,
    });
  }
  if (entity.email) {
    socialLinks.push({
      key: 'email',
      icon: <Mail className="w-4 h-4" />,
      value: entity.email,
      href: `mailto:${entity.email}`,
    });
  }
  if (entity.twitter) {
    socialLinks.push({
      key: 'twitter',
      icon: <Twitter className="w-4 h-4" />,
      value: entity.twitter,
      href: entity.twitter.startsWith('http') ? entity.twitter : `https://twitter.com/${entity.twitter}`,
    });
  }
  if (entity.linkedin) {
    socialLinks.push({
      key: 'linkedin',
      icon: <Linkedin className="w-4 h-4" />,
      value: entity.linkedin,
      href: entity.linkedin.startsWith('http') ? entity.linkedin : `https://linkedin.com/in/${entity.linkedin}`,
    });
  }
  if (entity.website) {
    socialLinks.push({
      key: 'website',
      icon: <Globe className="w-4 h-4" />,
      value: entity.website,
      href: entity.website.startsWith('http') ? entity.website : `https://${entity.website}`,
    });
  }

  // Scores
  const qualityScore = score?.qualityScore ?? entity.qualityScore ?? 0;
  const activityScore = score?.activityScore ?? entity.activityScore ?? 0;
  const completenessScore = score?.completenessScore ?? entity.completenessScore ?? 0;
  const availabilityScore = score?.availabilityScore ?? entity.availabilityScore ?? 0;
  const scoreValues: Record<string, number> = {
    quality: qualityScore,
    activity: activityScore,
    completeness: completenessScore,
    availability: availabilityScore,
  };

  // Languages chart data
  const languageData = merged.languages
    ? Object.entries(merged.languages)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([name, value]) => ({ name, value }))
    : [];

  const langColors = ['#3b82f6', '#22c55e', '#a855f7', '#f97316', '#ef4444', '#06b6d4', '#ec4899', '#8b5cf6', '#14b8a6', '#f59e0b'];

  // Match columns
  const matchColumns: Column<Match>[] = [
    {
      key: 'jobTitle',
      header: 'Job Title',
      render: (m) => <span className="font-medium">{m.jobTitle || m.enrichedProfileId || '-'}</span>,
    },
    {
      key: 'compositeScore',
      header: 'Composite Score',
      render: (m) => (
        <span
          className={`px-2 py-0.5 text-xs font-bold rounded-full ${
            m.compositeScore >= 0.8
              ? 'bg-green-100 text-green-700'
              : m.compositeScore >= 0.5
                ? 'bg-yellow-100 text-yellow-700'
                : 'bg-red-100 text-red-700'
          }`}
        >
          {(m.compositeScore * 100).toFixed(0)}%
        </span>
      ),
    },
    {
      key: 'vectorSimilarity',
      header: 'Vector Similarity',
      render: (m) => <span className="font-mono text-sm">{(m.vectorSimilarity * 100).toFixed(1)}%</span>,
    },
    {
      key: 'ruleScore',
      header: 'Rule Score',
      render: (m) => <span className="font-mono text-sm">{(m.ruleScore * 100).toFixed(1)}%</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (m) => {
        const statusColors: Record<string, string> = {
          active: 'bg-green-100 text-green-700',
          dismissed: 'bg-gray-100 text-gray-600',
          contacted: 'bg-blue-100 text-blue-700',
        };
        return (
          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[m.status] || 'bg-gray-100 text-gray-700'}`}>
            {m.status}
          </span>
        );
      },
    },
    {
      key: 'createdAt',
      header: 'Date',
      render: (m) => <span className="text-sm text-gray-500">{new Date(m.createdAt).toLocaleDateString()}</span>,
    },
  ];

  // Avatar: prefer mergedData.avatarUrl, then check source rawData (GitHub avatarUrl, SO profileImage)
  const avatarUrl =
    merged.avatarUrl ||
    detail.sources.find((s) => s.profile.source === 'github')?.rawData?.avatarUrl as string | undefined ||
    detail.sources.find((s) => s.profile.source === 'stackoverflow')?.rawData?.profileImage as string | undefined;
  const initial = entity.name?.charAt(0)?.toUpperCase() || '?';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* A) Breadcrumb + Back Button */}
      <div className="flex items-center gap-3 text-sm">
        <button
          onClick={() => navigate('/admin/data-engine/entities')}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <nav className="flex items-center gap-1.5 text-gray-500">
          <button onClick={() => navigate('/admin/data-engine')} className="hover:text-gray-700">
            Data Engine
          </button>
          <span>/</span>
          <button onClick={() => navigate('/admin/data-engine/entities')} className="hover:text-gray-700">
            Entities
          </button>
          <span>/</span>
          <span className="text-gray-900 font-medium">{entity.name}</span>
        </nav>
      </div>

      {/* B) Hero Header Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          {avatarUrl ? (
            <img src={avatarUrl} alt={entity.name} className="w-16 h-16 rounded-full object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
              {initial}
            </div>
          )}
          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900">{entity.name}</h1>
              <span
                className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${
                  entity.entityType === 'person' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                }`}
              >
                {entity.entityType}
              </span>
              {merged.seniorityLevel && (
                <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-700">
                  {merged.seniorityLevel}
                </span>
              )}
              {merged.influenceScore && (
                <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-indigo-100 text-indigo-700">
                  Influence: {merged.influenceScore}
                </span>
              )}
            </div>

            {/* Location & Company */}
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
              {entity.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{entity.location}</span>
                </div>
              )}
              {entity.company && (
                <div className="flex items-center gap-1">
                  <Building className="w-4 h-4" />
                  <span>{entity.company}</span>
                </div>
              )}
            </div>

            {/* Social Links */}
            {socialLinks.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {socialLinks.map((link) => (
                  <SocialPill key={link.key} icon={link.icon} value={link.value} href={link.href} />
                ))}
              </div>
            )}

            {/* Summary */}
            {summary && (
              <div className="mt-3">
                <p className={`text-sm text-gray-600 ${!summaryExpanded ? 'line-clamp-3' : ''}`}>{summary}</p>
                {summary.length > 200 && (
                  <button
                    onClick={() => setSummaryExpanded(!summaryExpanded)}
                    className="text-xs text-blue-600 hover:underline mt-1"
                  >
                    {summaryExpanded ? 'Show less' : 'Show more'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* C) Score Overview — 4 Circular Gauges */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-900">Score Overview</h2>
          <button
            onClick={handleReScore}
            disabled={rescoring}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${rescoring ? 'animate-spin' : ''}`} />
            {rescoring ? 'Scoring...' : 'Re-Score'}
          </button>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {dimensionConfig.map((dim) => (
            <CircularGauge
              key={dim.key}
              value={scoreValues[dim.key]}
              label={dim.label}
              color={dim.color}
              bg={dim.bg}
            />
          ))}
        </div>
      </div>

      {/* D) Tab Bar */}
      <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
        <Tabs.List className="flex border-b border-gray-200 mb-6">
          {[
            { value: 'overview', label: 'Overview' },
            { value: 'sources', label: `Sources (${detail.sources.length})` },
            { value: 'skills', label: 'Skills' },
            { value: 'matches', label: `Matches (${matchTotal})` },
            { value: 'rawdata', label: 'Raw Data' },
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

        {/* Tab: Overview */}
        <Tabs.Content value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Score Breakdown */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Score Breakdown</h3>
              {score?.breakdown ? (
                <div className="space-y-5">
                  {Object.entries(breakdownFields).map(([dimension, fields]) => {
                    const dimBreakdown = (score.breakdown as Record<string, Record<string, number>>)?.[dimension] || {};
                    return (
                      <div key={dimension}>
                        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2 capitalize">{dimension}</h4>
                        <div className="space-y-2">
                          {fields.map((field) => {
                            const val = dimBreakdown[field.key] ?? 0;
                            return (
                              <div key={field.key}>
                                <div className="flex items-center justify-between mb-0.5">
                                  <span className="text-xs text-gray-600">{field.label}</span>
                                  <span className="text-xs font-mono text-gray-500">
                                    {val}/{field.max}
                                  </span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-1.5">
                                  <div
                                    className="bg-blue-500 rounded-full h-1.5 transition-all duration-500"
                                    style={{ width: `${Math.min(100, (val / field.max) * 100)}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                  {/* Quality is a weighted formula — show as overall bar */}
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Quality (Weighted)</h4>
                    <ScoreBar
                      scores={{ quality: qualityScore }}
                      compact
                    />
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-400">No score breakdown available. Try re-scoring.</p>
              )}
            </div>

            {/* Right column */}
            <div className="space-y-6">
              {/* Quick Facts */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Quick Facts</h3>
                <dl className="space-y-2 text-sm">
                  {[
                    { label: 'Entity Type', value: entity.entityType },
                    { label: 'Seniority', value: merged.seniorityLevel || '-' },
                    { label: 'Influence', value: merged.influenceScore || '-' },
                    { label: 'Sources', value: String(entity.sourceCount) },
                    { label: 'Public Repos', value: merged.publicRepos != null ? String(merged.publicRepos) : '-' },
                    { label: 'Followers', value: merged.followers != null ? String(merged.followers) : '-' },
                    { label: 'Created', value: new Date(entity.createdAt).toLocaleDateString() },
                    { label: 'Updated', value: new Date(entity.updatedAt).toLocaleDateString() },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between">
                      <dt className="text-gray-500">{item.label}</dt>
                      <dd className="font-medium text-gray-900">{item.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              {/* Languages Chart */}
              {languageData.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Languages</h3>
                  <ResponsiveContainer width="100%" height={languageData.length * 32 + 20}>
                    <BarChart data={languageData} layout="vertical" margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
                      <XAxis type="number" hide />
                      <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12 }} />
                      <Tooltip
                        formatter={(value: number) => [value.toLocaleString(), 'Usage']}
                        contentStyle={{ fontSize: 12 }}
                      />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {languageData.map((_, idx) => (
                          <Cell key={idx} fill={langColors[idx % langColors.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        </Tabs.Content>

        {/* Tab: Sources */}
        <Tabs.Content value="sources">
          {detail.sources.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">No linked sources</div>
          ) : (
            <div className="space-y-3">
              {detail.sources.map((source, i) => (
                <SourceCard key={i} source={source} index={i} />
              ))}
            </div>
          )}
        </Tabs.Content>

        {/* Tab: Skills */}
        <Tabs.Content value="skills">
          <div className="space-y-6">
            {/* Skills */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Skills</h3>
              {merged.skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {merged.skills.map((skill) => (
                    <span key={skill} className="px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded-full">
                      {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">No skills data</p>
              )}
            </div>

            {/* Specializations */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Specializations</h3>
              {merged.specializations.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {merged.specializations.map((spec) => (
                    <span key={spec} className="px-3 py-1 text-sm bg-purple-50 text-purple-700 rounded-full">
                      {spec}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">No specialization data</p>
              )}
            </div>

            {/* Roles */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Roles</h3>
              {merged.roles.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {merged.roles.map((role) => (
                    <span key={role} className="px-3 py-1 text-sm bg-green-50 text-green-700 rounded-full">
                      {role}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">No role data</p>
              )}
            </div>
          </div>
        </Tabs.Content>

        {/* Tab: Matches */}
        <Tabs.Content value="matches">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <DataTable
              columns={matchColumns}
              data={matches}
              total={matchTotal}
              limit={20}
              emptyMessage="No job matches found"
            />
          </div>
        </Tabs.Content>

        {/* Tab: Raw Data */}
        <Tabs.Content value="rawdata">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Merged Data</h3>
              <JsonViewer data={entity.mergedData} initialExpanded={false} />
            </div>
            {detail.sources.map((source, i) => (
              <div key={i}>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">
                  Source: <span className="capitalize">{source.profile.source}</span>
                </h3>
                <JsonViewer data={source.rawData} initialExpanded={false} />
              </div>
            ))}
          </div>
        </Tabs.Content>
      </Tabs.Root>
    </motion.div>
  );
};

export default EntityProfile;
