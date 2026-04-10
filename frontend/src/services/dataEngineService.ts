import { apiClient } from '@/lib/api-client';
import {
  CrawlJob,
  CrawledData,
  CrawlStats,
  EnrichedProfile,
  EnrichmentStats,
  EnrichmentQueue,
  EnrichRequest,
  SearchRequest,
  SearchResult,
  UnifiedEntity,
  EntityStats,
  EntityScore,
  EntityDetail,
  ScoreDistribution,
  Match,
  MatchDevelopersRequest,
  MatchJobsRequest,
  OutreachCampaign,
  OutreachRecipient,
  OutreachStats,
  OutreachQueue,
  CreateCampaignRequest,
  AddRecipientsRequest,
  BlocklistEntry,
  SesConfig,
  SendEmailRequest,
  DashboardData,
  PaginatedResult,
  PipelineRun,
  PipelineScanResult,
  PipelineStats,
  PipelineQueue,
  CompanyEntity,
  CompanyDetail,
  BackfillCompaniesResult,
  TriggerOperationResult,
} from '@/types/data-engine';

const BASE = '/admin/data-engine';

function unwrap<T>(response: { data: { data?: T } & T }): T {
  return (response.data as any).data ?? response.data;
}

// For paginated endpoints that return { data: [...], meta: {...} }
// We need response.data directly (not response.data.data) since the
// backend wraps with { data: [...], meta: {...} } at the top level.
function unwrapPaginated<T>(response: { data: any }): PaginatedResult<T> {
  const body = response.data;
  // If the body has a nested data.data (double-wrapped), unwrap one level
  if (body.data && Array.isArray(body.data.data)) {
    return body.data;
  }
  // If body has data array + meta, return as-is
  if (Array.isArray(body.data) && body.meta) {
    return body;
  }
  // If body itself is the paginated result
  if (Array.isArray(body.data)) {
    return {
      data: body.data,
      meta: body.meta || { total: body.data.length, limit: 20, offset: 0 },
    };
  }
  // Fallback: wrap raw array
  if (Array.isArray(body)) {
    return { data: body, meta: { total: body.length, limit: 20, offset: 0 } };
  }
  return { data: [], meta: { total: 0, limit: 20, offset: 0 } };
}

// ============================================
// DASHBOARD
// ============================================

export const getDashboard = async (): Promise<DashboardData> => {
  const response = await apiClient.get(`${BASE}/dashboard`);
  const raw = unwrap<any>(response);
  // Normalize backend shape { crawl, enrichment, entity, outreach, scores }
  // into frontend shape { crawl: CrawlStats, enrichment: EnrichmentStats, ... }
  // Compute totalCrawled from bySource and merge lastCrawlTimestamps
  const bySource: Record<string, any> = {};
  let totalCrawled = 0;
  if (raw.crawl?.bySource) {
    for (const [src, stats] of Object.entries(raw.crawl.bySource as Record<string, any>)) {
      totalCrawled += stats.total || 0;
      bySource[src] = {
        today: stats.today || 0,
        thisWeek: stats.thisWeek ?? stats.week ?? 0,
        total: stats.total || 0,
        lastCrawl: raw.crawl?.lastCrawlTimestamps?.[src] || undefined,
      };
    }
  }

  return {
    crawl: {
      totalCrawled,
      bySource,
      byType: {},
      ...(raw.crawl || {}),
    },
    enrichment: {
      totalEnriched: raw.enrichment?.totalEnriched || 0,
      totalCrawled: raw.enrichment?.totalCrawled || 0,
      bySource: {},
      byType: {},
      vectorCounts: raw.enrichment?.qdrantCollections
        ? { profiles: raw.enrichment.qdrantCollections.profiles || 0, jobPosts: raw.enrichment.qdrantCollections.job_posts || 0 }
        : undefined,
      ...(raw.enrichment || {}),
    },
    enrichmentQueue: raw.enrichmentQueue || { pending: 0, processing: 0, failed: 0, completed: 0 },
    entities: {
      total: 0,
      byType: {},
      withEmail: 0,
      avgSources: 0,
      newThisWeek: 0,
      ...(raw.entity || raw.entities || {}),
    },
    outreach: {
      totalCampaigns: 0,
      totalSent: raw.outreach?.aggregateSent || 0,
      totalOpened: raw.outreach?.aggregateOpened || 0,
      totalClicked: raw.outreach?.aggregateClicked || 0,
      totalBounced: raw.outreach?.aggregateBounced || 0,
      totalUnsubscribed: 0,
      openRate: raw.outreach?.openRate || 0,
      clickRate: raw.outreach?.clickRate || 0,
      byStatus: raw.outreach?.campaignsByStatus || {},
      ...(raw.outreach || {}),
    },
    outreachQueue: raw.outreachQueue || { pending: 0, processing: 0, failed: 0, completed: 0 },
    scoring: raw.scores
      ? {
          distribution: Object.entries(raw.scores).map(([dimension, buckets]: [string, any]) => ({
            dimension,
            buckets: Object.entries(buckets).map(([range, count]) => ({ range, count: count as number })),
          })),
        }
      : undefined,
  };
};

// ============================================
// CRAWL TRIGGERS
// ============================================

// Long-running operations (crawls, pipelines, batch scoring, enrichment, matching)
// run synchronously on the backend. Use a 5-minute timeout so they don't get cut off.
const LONG_TIMEOUT = 300000;

export const crawlGitHub = async (params: { query?: string; limit?: number; page?: number; autoPaginate?: boolean; maxPages?: number }) => {
  const response = await apiClient.post(`${BASE}/crawl/github`, params, { timeout: LONG_TIMEOUT });
  return unwrap(response);
};

export const crawlHackerNews = async (params: { limit?: number }) => {
  const response = await apiClient.post(`${BASE}/crawl/hackernews`, params, { timeout: LONG_TIMEOUT });
  return unwrap(response);
};

export const crawlRemoteOK = async (params: { tag?: string; limit?: number }) => {
  const response = await apiClient.post(`${BASE}/crawl/remoteok`, params, { timeout: LONG_TIMEOUT });
  return unwrap(response);
};

export const crawlTokyoDev = async (params: { limit?: number; page?: number; autoPaginate?: boolean; maxPages?: number }) => {
  const response = await apiClient.post(`${BASE}/crawl/tokyodev`, params, { timeout: LONG_TIMEOUT });
  return unwrap(response);
};

export const crawlArbeitnow = async (params: { limit?: number }) => {
  const response = await apiClient.post(`${BASE}/crawl/arbeitnow`, params, { timeout: LONG_TIMEOUT });
  return unwrap(response);
};

export const crawlWeWorkRemotely = async (params: { category?: string; limit?: number }) => {
  const response = await apiClient.post(`${BASE}/crawl/weworkremotely`, params, { timeout: LONG_TIMEOUT });
  return unwrap(response);
};

export const crawlStackOverflow = async (params: { minReputation?: number; sort?: string; limit?: number; page?: number; autoPaginate?: boolean; maxPages?: number }) => {
  const response = await apiClient.post(`${BASE}/crawl/stackoverflow`, params, { timeout: LONG_TIMEOUT });
  return unwrap(response);
};

export const crawlWantedly = async (params: { location?: string; limit?: number; page?: number; autoPaginate?: boolean; maxPages?: number }) => {
  const response = await apiClient.post(`${BASE}/crawl/wantedly`, params, { timeout: LONG_TIMEOUT });
  return unwrap(response);
};

export const crawlGeneric = async (params: {
  urls: string[];
  mode?: string;
  contentType?: string;
  fetchMethod?: string;
  limit?: number;
  customPrompt?: string;
  page?: number;
  autoPaginate?: boolean;
  maxPages?: number;
}) => {
  const response = await apiClient.post(`${BASE}/crawl/generic`, params, { timeout: LONG_TIMEOUT });
  return unwrap(response);
};

export const crawlGreenJapan = async (params: { limit?: number; maxUrls?: number; autoPaginate?: boolean }) => {
  const response = await apiClient.post(`${BASE}/crawl/greenjapan`, params, { timeout: LONG_TIMEOUT });
  return unwrap(response);
};

export const crawlJapanDev = async (params: { limit?: number }) => {
  const response = await apiClient.post(`${BASE}/crawl/japandev`, params, { timeout: LONG_TIMEOUT });
  return unwrap(response);
};

// ============================================
// CRAWLED DATA
// ============================================

export const getCrawledData = async (params: {
  source?: string;
  type?: string;
  limit?: number;
  offset?: number;
}): Promise<PaginatedResult<CrawledData>> => {
  const response = await apiClient.get(`${BASE}/crawled`, { params });
  return unwrapPaginated(response);
};

export const getCrawledDataById = async (id: string): Promise<CrawledData> => {
  const response = await apiClient.get(`${BASE}/crawled/${id}`);
  return unwrap(response);
};

export const getCrawlStats = async (): Promise<CrawlStats> => {
  const response = await apiClient.get(`${BASE}/stats`);
  const raw = unwrap<any>(response);
  // Normalize backend shape { [source]: { [type]: count }, total }
  // into frontend shape { totalCrawled, bySource, byType }
  if (raw && !raw.totalCrawled && raw.total !== undefined) {
    const bySource: Record<string, { total: number; today: number; thisWeek: number }> = {};
    const byType: Record<string, number> = {};
    for (const [key, val] of Object.entries(raw)) {
      if (key === 'total') continue;
      if (val && typeof val === 'object') {
        let srcTotal = 0;
        for (const [t, count] of Object.entries(val as Record<string, number>)) {
          srcTotal += count;
          byType[t] = (byType[t] || 0) + count;
        }
        bySource[key] = { total: srcTotal, today: 0, thisWeek: 0 };
      }
    }
    return { totalCrawled: raw.total || 0, bySource, byType };
  }
  return raw;
};

// ============================================
// CRAWL JOBS
// ============================================

export const getCrawlJobs = async (params: {
  source?: string;
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<PaginatedResult<CrawlJob>> => {
  const response = await apiClient.get(`${BASE}/jobs`, { params });
  return unwrapPaginated(response);
};

export const getCrawlJobById = async (id: string): Promise<CrawlJob> => {
  const response = await apiClient.get(`${BASE}/jobs/${id}`);
  return unwrap(response);
};

// ============================================
// ENRICHMENT
// ============================================

export const triggerEnrich = async (params: EnrichRequest) => {
  const response = await apiClient.post(`${BASE}/enrich`, params, { timeout: LONG_TIMEOUT });
  return unwrap(response);
};

export const semanticSearch = async (params: SearchRequest): Promise<SearchResult[]> => {
  const response = await apiClient.post(`${BASE}/search`, params);
  const data = unwrap<any>(response);
  return Array.isArray(data) ? data : data.results || [];
};

export const getEnrichedProfiles = async (params: {
  source?: string;
  type?: string;
  limit?: number;
  offset?: number;
}): Promise<PaginatedResult<EnrichedProfile>> => {
  const response = await apiClient.get(`${BASE}/enriched`, { params });
  return unwrapPaginated(response);
};

export const getEnrichedProfileById = async (id: string): Promise<EnrichedProfile> => {
  const response = await apiClient.get(`${BASE}/enriched/${id}`);
  return unwrap(response);
};

export const getEnrichmentStats = async (): Promise<EnrichmentStats> => {
  const response = await apiClient.get(`${BASE}/enrichment-stats`);
  const raw = unwrap<any>(response);
  // Normalize backend shape { enriched: {src: {type: count}}, total, vectors }
  // into frontend shape { totalEnriched, totalCrawled, bySource, byType, vectorCounts }
  if (raw.enriched !== undefined) {
    const bySource: Record<string, number> = {};
    const byType: Record<string, number> = {};
    if (raw.enriched && typeof raw.enriched === 'object') {
      for (const [src, types] of Object.entries(raw.enriched)) {
        let srcTotal = 0;
        if (types && typeof types === 'object') {
          for (const [t, count] of Object.entries(types as Record<string, number>)) {
            srcTotal += count;
            byType[t] = (byType[t] || 0) + count;
          }
        }
        bySource[src] = srcTotal;
      }
    }
    return {
      totalEnriched: raw.total || 0,
      totalCrawled: raw.totalCrawled ?? raw.total ?? 0,
      bySource,
      byType,
      vectorCounts: raw.vectors ? { profiles: raw.vectors.profiles || 0, jobPosts: raw.vectors.jobs || 0 } : undefined,
      enriched: raw.enriched,
      total: raw.total,
      vectors: raw.vectors,
    };
  }
  return raw;
};

export const getEnrichmentQueue = async (): Promise<EnrichmentQueue> => {
  const response = await apiClient.get(`${BASE}/enrichment-queue`);
  return unwrap(response);
};

// ============================================
// ENTITIES
// ============================================

// Transform backend entity shape to frontend UnifiedEntity
const transformEntity = (raw: Record<string, unknown>): UnifiedEntity => {
  const mergedData = (raw.mergedData || {}) as Record<string, unknown>;
  const socialAccounts = (mergedData.socialAccounts || {}) as Record<string, string>;
  const sources = (mergedData.sources || []) as Array<Record<string, unknown>>;

  return {
    id: raw.id as string,
    entityType: raw.entityType as 'person' | 'company',
    name: (raw.canonicalName || raw.name || '') as string,
    email: (raw.normalizedEmail || socialAccounts.email || undefined) as string | undefined,
    github: (raw.normalizedGithub || socialAccounts.github || undefined) as string | undefined,
    twitter: (raw.normalizedTwitter || socialAccounts.twitter || undefined) as string | undefined,
    linkedin: (raw.normalizedLinkedin || socialAccounts.linkedin || undefined) as string | undefined,
    website: (raw.normalizedWebsite || socialAccounts.website || socialAccounts.blog || undefined) as string | undefined,
    sources: sources.map((s, i) => ({
      id: String(i),
      enrichedProfileId: (s.crawledDataId || '') as string,
      matchType: (s.matchType || s.source || '') as string,
      confidence: (s.confidenceScore || 1) as number,
      source: (s.source || '') as string,
      summary: (s.summary || undefined) as string | undefined,
    })),
    qualityScore: raw.qualityScore as number | undefined,
    activityScore: raw.activityScore as number | undefined,
    completenessScore: raw.completenessScore as number | undefined,
    availabilityScore: raw.availabilityScore as number | undefined,
    createdAt: raw.createdAt as string,
    updatedAt: raw.updatedAt as string,
  };
};

export const getEntities = async (params: {
  entityType?: string;
  limit?: number;
  offset?: number;
}): Promise<PaginatedResult<UnifiedEntity>> => {
  const response = await apiClient.get(`${BASE}/entities`, { params });
  const result = unwrapPaginated<Record<string, unknown>>(response);
  return {
    ...result,
    data: result.data.map(transformEntity),
  };
};

export const getEntityById = async (id: string): Promise<UnifiedEntity> => {
  const response = await apiClient.get(`${BASE}/entities/${id}`);
  const raw = unwrap<Record<string, unknown>>(response);
  // The endpoint returns { entity, sources } — transform the entity part
  const entity = (raw as Record<string, unknown>).entity || raw;
  return transformEntity(entity as Record<string, unknown>);
};

export const getEntityDetail = async (id: string): Promise<EntityDetail> => {
  const response = await apiClient.get(`${BASE}/entities/${id}`);
  const raw = unwrap<Record<string, unknown>>(response);
  const rawEntity = (raw.entity || raw) as Record<string, unknown>;
  const mergedData = (rawEntity.mergedData || {}) as Record<string, unknown>;
  const socialAccounts = (mergedData.socialAccounts || {}) as Record<string, string>;
  const sources = (mergedData.sources || []) as Array<Record<string, unknown>>;

  return {
    entity: {
      ...transformEntity(rawEntity),
      location: (rawEntity.location || mergedData.location || undefined) as string | undefined,
      company: (rawEntity.company || mergedData.company || undefined) as string | undefined,
      mergedData: {
        sources: sources.map((s) => ({
          source: (s.source || '') as string,
          type: (s.type || '') as string,
          crawledDataId: (s.crawledDataId || '') as string,
          enrichedAt: (s.enrichedAt || '') as string,
        })),
        skills: (mergedData.skills || []) as string[],
        specializations: (mergedData.specializations || []) as string[],
        roles: (mergedData.roles || []) as string[],
        socialAccounts,
        seniorityLevel: (mergedData.seniorityLevel || undefined) as string | undefined,
        summary: (mergedData.summary || undefined) as string | undefined,
        publicRepos: (mergedData.publicRepos || undefined) as number | undefined,
        followers: (mergedData.followers || undefined) as number | undefined,
        languages: (mergedData.languages || undefined) as Record<string, number> | undefined,
        influenceScore: (mergedData.influenceScore || undefined) as string | undefined,
        avatarUrl: (mergedData.avatarUrl || undefined) as string | undefined,
      },
      sourceCount: (rawEntity.sourceCount || sources.length || 0) as number,
    },
    sources: ((raw.sources || []) as Array<Record<string, unknown>>).map((s) => ({
      matchType: (s.matchType || '') as string,
      confidenceScore: (s.confidenceScore || s.confidence || 0) as number,
      linkedAt: (s.linkedAt || s.createdAt || '') as string,
      profile: {
        source: ((s.profile as Record<string, unknown>)?.source || s.source || '') as string,
        type: ((s.profile as Record<string, unknown>)?.type || s.type || '') as string,
        structuredData: ((s.profile as Record<string, unknown>)?.structuredData || {}) as Record<string, unknown>,
        summary: ((s.profile as Record<string, unknown>)?.summary || undefined) as string | undefined,
        enrichedAt: ((s.profile as Record<string, unknown>)?.enrichedAt || '') as string,
      },
      rawData: (s.rawData || {}) as Record<string, unknown>,
    })),
  };
};

export const getEntityStats = async (): Promise<EntityStats> => {
  const response = await apiClient.get(`${BASE}/entities/stats`);
  const raw = unwrap<Record<string, unknown>>(response);
  return {
    total: (raw.totalEntities || 0) as number,
    byType: (raw.entitiesByType || {}) as Record<string, number>,
    withEmail: (raw.entitiesWithEmail || 0) as number,
    avgSources: (raw.averageSourcesPerEntity || 0) as number,
    newThisWeek: (raw.newThisWeek || 0) as number,
  };
};

export const batchResolveEntities = async (params?: { source?: string; limit?: number }) => {
  const response = await apiClient.post(`${BASE}/entities/resolve`, params || {}, { timeout: LONG_TIMEOUT });
  return unwrap(response);
};

export const resolveEntityProfile = async (entityId: string, params: { enrichedProfileId: string }) => {
  const response = await apiClient.post(`${BASE}/entities/${entityId}/resolve`, params);
  return unwrap(response);
};

// ============================================
// SCORING
// ============================================

export const batchScoreEntities = async (params?: { entityType?: string; limit?: number }) => {
  const response = await apiClient.post(`${BASE}/scoring/batch`, params || {}, { timeout: LONG_TIMEOUT });
  return unwrap(response);
};

export const getTopScored = async (params: {
  sortBy?: string;
  minScore?: number;
  limit?: number;
  offset?: number;
}): Promise<PaginatedResult<UnifiedEntity>> => {
  const response = await apiClient.get(`${BASE}/scoring/top`, { params });
  const result = unwrapPaginated<Record<string, unknown>>(response);
  // Backend returns { score: {...}, entity: {...} } objects — merge into UnifiedEntity
  return {
    ...result,
    data: result.data.map((item: Record<string, unknown>) => {
      const score = (item.score || {}) as Record<string, unknown>;
      const entity = (item.entity || {}) as Record<string, unknown>;
      // If the item is already flat (no nested score/entity), use transformEntity directly
      if (!item.score && !item.entity) {
        return transformEntity(item);
      }
      return {
        ...transformEntity(entity),
        qualityScore: score.qualityScore as number | undefined,
        activityScore: score.activityScore as number | undefined,
        completenessScore: score.completenessScore as number | undefined,
        availabilityScore: score.availabilityScore as number | undefined,
      };
    }),
  };
};

export const getScoreDistribution = async (): Promise<ScoreDistribution[]> => {
  const response = await apiClient.get(`${BASE}/scoring/distribution`);
  const data = unwrap<any>(response);
  return Array.isArray(data) ? data : data.distribution || [];
};

export const getEntityScore = async (entityId: string): Promise<EntityScore> => {
  const response = await apiClient.get(`${BASE}/scoring/${entityId}`);
  return unwrap(response);
};

export const scoreEntity = async (entityId: string) => {
  const response = await apiClient.post(`${BASE}/scoring/${entityId}`, {});
  return unwrap(response);
};

// ============================================
// MATCHING
// ============================================

export const matchDevelopers = async (params: MatchDevelopersRequest): Promise<Match[]> => {
  const response = await apiClient.post(`${BASE}/matching/developers`, params, { timeout: LONG_TIMEOUT });
  const data = unwrap<any>(response);
  return Array.isArray(data) ? data : data.matches || [];
};

export const matchJobs = async (params: MatchJobsRequest): Promise<Match[]> => {
  const response = await apiClient.post(`${BASE}/matching/jobs`, params, { timeout: LONG_TIMEOUT });
  const data = unwrap<any>(response);
  return Array.isArray(data) ? data : data.matches || [];
};

export const getMatchesByJob = async (jobId: string, params?: {
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<PaginatedResult<Match>> => {
  const response = await apiClient.get(`${BASE}/matching/job/${jobId}`, { params });
  return unwrapPaginated(response);
};

export const getMatchesByEntity = async (entityId: string, params?: {
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<PaginatedResult<Match>> => {
  const response = await apiClient.get(`${BASE}/matching/entity/${entityId}`, { params });
  return unwrapPaginated(response);
};

export const updateMatchStatus = async (matchId: string, status: string) => {
  const response = await apiClient.put(`${BASE}/matching/${matchId}/status`, { status });
  return unwrap(response);
};

// ============================================
// OUTREACH CAMPAIGNS
// ============================================

export const createCampaign = async (data: CreateCampaignRequest): Promise<OutreachCampaign> => {
  const response = await apiClient.post(`${BASE}/outreach/campaigns`, data);
  return unwrap(response);
};

export const getCampaigns = async (params?: {
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<PaginatedResult<OutreachCampaign>> => {
  const response = await apiClient.get(`${BASE}/outreach/campaigns`, { params });
  return unwrapPaginated(response);
};

export const getCampaignById = async (id: string): Promise<OutreachCampaign> => {
  const response = await apiClient.get(`${BASE}/outreach/campaigns/${id}`);
  return unwrap(response);
};

export const updateCampaign = async (id: string, data: Partial<CreateCampaignRequest>): Promise<OutreachCampaign> => {
  const response = await apiClient.put(`${BASE}/outreach/campaigns/${id}`, data);
  return unwrap(response);
};

export const deleteCampaign = async (id: string) => {
  const response = await apiClient.delete(`${BASE}/outreach/campaigns/${id}`);
  return unwrap(response);
};

// ============================================
// OUTREACH RECIPIENTS
// ============================================

export const addRecipients = async (campaignId: string, data: AddRecipientsRequest) => {
  const response = await apiClient.post(`${BASE}/outreach/campaigns/${campaignId}/recipients`, data);
  return unwrap(response);
};

export const getRecipients = async (campaignId: string, params?: {
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<PaginatedResult<OutreachRecipient>> => {
  const response = await apiClient.get(`${BASE}/outreach/campaigns/${campaignId}/recipients`, { params });
  return unwrapPaginated(response);
};

// ============================================
// OUTREACH SEND / PAUSE / RESUME
// ============================================

export const sendCampaign = async (campaignId: string) => {
  const response = await apiClient.post(`${BASE}/outreach/campaigns/${campaignId}/send`, {});
  return unwrap(response);
};

export const pauseCampaign = async (campaignId: string) => {
  const response = await apiClient.post(`${BASE}/outreach/campaigns/${campaignId}/pause`, {});
  return unwrap(response);
};

export const resumeCampaign = async (campaignId: string) => {
  const response = await apiClient.post(`${BASE}/outreach/campaigns/${campaignId}/resume`, {});
  return unwrap(response);
};

// ============================================
// OUTREACH STATS
// ============================================

export const getCampaignStats = async (campaignId: string) => {
  const response = await apiClient.get(`${BASE}/outreach/campaigns/${campaignId}/stats`);
  return unwrap(response);
};

export const getOutreachStats = async (): Promise<OutreachStats> => {
  const response = await apiClient.get(`${BASE}/outreach/stats`);
  return unwrap(response);
};

export const getOutreachQueue = async (): Promise<OutreachQueue> => {
  const response = await apiClient.get(`${BASE}/outreach/queue`);
  return unwrap(response);
};

// ============================================
// BLOCKLIST
// ============================================

export const getBlocklist = async (params?: {
  reason?: string;
  limit?: number;
  offset?: number;
}): Promise<PaginatedResult<BlocklistEntry>> => {
  const response = await apiClient.get(`${BASE}/outreach/blocklist`, { params });
  return unwrapPaginated(response);
};

export const addToBlocklist = async (data: { email: string; reason: string }) => {
  const response = await apiClient.post(`${BASE}/outreach/blocklist`, data);
  return unwrap(response);
};

export const removeFromBlocklist = async (email: string) => {
  const response = await apiClient.delete(`${BASE}/outreach/blocklist/${encodeURIComponent(email)}`);
  return unwrap(response);
};

// ============================================
// SES
// ============================================

export const getSesConfig = async (): Promise<SesConfig> => {
  const response = await apiClient.get(`${BASE}/ses/config`);
  return unwrap(response);
};

export const sendTestEmail = async (params: { email: string }) => {
  const response = await apiClient.post(`${BASE}/ses/test`, params);
  return unwrap(response);
};

export const sendEmail = async (params: SendEmailRequest) => {
  const response = await apiClient.post(`${BASE}/ses/send`, params);
  return unwrap(response);
};

// ============================================
// PIPELINE
// ============================================

export const scanPipeline = async (params: {
  source?: string;
  type?: string;
  urlTypes?: string[];
  limit?: number;
}): Promise<PipelineScanResult> => {
  const response = await apiClient.post(`${BASE}/pipeline/scan`, params, { timeout: LONG_TIMEOUT });
  return unwrap(response);
};

export const runPipeline = async (params: {
  source?: string;
  type?: string;
  urlTypes?: string[];
  limit?: number;
  autoEnrich?: boolean;
}) => {
  const response = await apiClient.post(`${BASE}/pipeline/run`, params, { timeout: LONG_TIMEOUT });
  return unwrap(response);
};

export const getPipelineRuns = async (params?: {
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<PaginatedResult<PipelineRun>> => {
  const response = await apiClient.get(`${BASE}/pipeline/runs`, { params });
  return unwrapPaginated(response);
};

export const getPipelineRun = async (id: string): Promise<PipelineRun> => {
  const response = await apiClient.get(`${BASE}/pipeline/runs/${id}`);
  return unwrap(response);
};

export const getPipelineStats = async (): Promise<PipelineStats> => {
  const response = await apiClient.get(`${BASE}/pipeline/stats`);
  return unwrap(response);
};

export const getPipelineQueue = async (): Promise<PipelineQueue> => {
  const response = await apiClient.get(`${BASE}/pipeline/queue`);
  return unwrap(response);
};

export const runJobsPipeline = async (params: {
  source: string;
  limit?: number;
  crawlCompanyWebsites?: boolean;
  urls?: string[];
  mode?: string;
  contentType?: string;
  fetchMethod?: string;
  customPrompt?: string;
  autoPaginate?: boolean;
  maxPages?: number;
  page?: number;
  // Source-specific
  tag?: string;
  category?: string;
  location?: string;
  month?: number;
  year?: number;
  maxUrls?: number;
}) => {
  const response = await apiClient.post(`${BASE}/pipeline/jobs`, params, { timeout: LONG_TIMEOUT });
  return unwrap(response);
};

export const runProfilesPipeline = async (params: {
  source: string;
  limit?: number;
  chainUrlTypes?: string[];
  urls?: string[];
  mode?: string;
  contentType?: string;
  fetchMethod?: string;
  customPrompt?: string;
  autoPaginate?: boolean;
  maxPages?: number;
  page?: number;
  // Source-specific
  query?: string;
  minReputation?: number;
  sort?: string;
  location?: string;
  month?: number;
  year?: number;
}) => {
  const response = await apiClient.post(`${BASE}/pipeline/profiles`, params, { timeout: LONG_TIMEOUT });
  return unwrap(response);
};

// ============================================
// COMPANIES
// ============================================

export const getCompanies = async (params: {
  search?: string;
  industry?: string;
  hiringActive?: boolean;
  limit?: number;
  offset?: number;
}): Promise<PaginatedResult<CompanyEntity>> => {
  const response = await apiClient.get(`${BASE}/companies`, { params });
  const result = unwrapPaginated<Record<string, unknown>>(response);
  return {
    ...result,
    data: result.data.map((raw) => {
      const entity = transformEntity(raw);
      const mergedData = (raw.mergedData || {}) as Record<string, unknown>;
      return {
        ...entity,
        mergedData: {
          technologies: (mergedData.technologies || []) as string[],
          locations: (mergedData.locations || []) as string[],
          hiringVolume: (mergedData.hiringVolume || 0) as number,
          hiringActive: (mergedData.hiringActive || false) as boolean,
          lastJobPostedAt: (mergedData.lastJobPostedAt || undefined) as string | undefined,
          website: (mergedData.website || undefined) as string | undefined,
          industry: (mergedData.industry || undefined) as string | undefined,
          size: (mergedData.size || undefined) as string | undefined,
          contactEmail: (mergedData.contactEmail || undefined) as string | undefined,
        },
        location: (raw.location || undefined) as string | undefined,
        sourceCount: (raw.sourceCount || 0) as number,
      } as CompanyEntity;
    }),
  };
};

export const getCompanyDetail = async (id: string): Promise<CompanyDetail> => {
  const response = await apiClient.get(`${BASE}/companies/${id}`);
  const raw = unwrap<Record<string, unknown>>(response);
  const rawEntity = (raw.entity || raw) as Record<string, unknown>;
  const mergedData = (rawEntity.mergedData || {}) as Record<string, unknown>;
  const entity = transformEntity(rawEntity);

  return {
    entity: {
      ...entity,
      mergedData: {
        technologies: (mergedData.technologies || []) as string[],
        locations: (mergedData.locations || []) as string[],
        hiringVolume: (mergedData.hiringVolume || 0) as number,
        hiringActive: (mergedData.hiringActive || false) as boolean,
        lastJobPostedAt: (mergedData.lastJobPostedAt || undefined) as string | undefined,
        website: (mergedData.website || undefined) as string | undefined,
        industry: (mergedData.industry || undefined) as string | undefined,
        size: (mergedData.size || undefined) as string | undefined,
        contactEmail: (mergedData.contactEmail || undefined) as string | undefined,
      },
      location: (rawEntity.location || undefined) as string | undefined,
      sourceCount: (rawEntity.sourceCount || 0) as number,
    },
    sources: ((raw.sources || []) as Array<Record<string, unknown>>).map((s) => ({
      matchType: (s.matchType || '') as string,
      confidenceScore: (s.confidenceScore || s.confidence || 0) as number,
      linkedAt: (s.linkedAt || '') as string,
      profile: {
        source: ((s.profile as Record<string, unknown>)?.source || '') as string,
        type: ((s.profile as Record<string, unknown>)?.type || '') as string,
        structuredData: ((s.profile as Record<string, unknown>)?.structuredData || {}) as Record<string, unknown>,
        summary: ((s.profile as Record<string, unknown>)?.summary || undefined) as string | undefined,
        enrichedAt: ((s.profile as Record<string, unknown>)?.enrichedAt || '') as string,
      },
      rawData: (s.rawData || {}) as Record<string, unknown>,
    })),
  };
};

export const getCompanyJobs = async (id: string, params?: { limit?: number; offset?: number }): Promise<PaginatedResult<Record<string, unknown>>> => {
  const response = await apiClient.get(`${BASE}/companies/${id}/jobs`, { params });
  return unwrapPaginated(response);
};

export const backfillCompanies = async (params: { limit?: number; source?: string }): Promise<BackfillCompaniesResult> => {
  const response = await apiClient.post(`${BASE}/companies/backfill`, params, { timeout: LONG_TIMEOUT });
  return unwrap(response);
};

// ============================================
// ASYNC OPERATIONS (trigger + SSE progress)
// ============================================

export const triggerBackfillCompanies = async (params: { limit?: number; source?: string; force?: boolean }): Promise<TriggerOperationResult> => {
  const response = await apiClient.post(`${BASE}/operations/backfill-companies`, params);
  return unwrap(response);
};

export const triggerBatchResolve = async (params?: { limit?: number }): Promise<TriggerOperationResult> => {
  const response = await apiClient.post(`${BASE}/operations/batch-resolve`, params || {});
  return unwrap(response);
};

export const triggerBatchScore = async (params?: { limit?: number; rescoreOlderThanHours?: number }): Promise<TriggerOperationResult> => {
  const response = await apiClient.post(`${BASE}/operations/batch-score`, params || {});
  return unwrap(response);
};
