// Data Engine Types

// ============================================
// CRAWLING
// ============================================

export interface CrawlJob {
  id: string;
  source: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  itemsFound: number;
  itemsNew: number;
  itemsSkipped: number;
  error?: string;
  config?: Record<string, unknown>;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

export interface CrawledData {
  id: string;
  source: string;
  sourceId: string;
  type: 'profile' | 'job_post';
  rawData: Record<string, unknown>;
  crawledAt: string;
  crawlJobId?: string;
}

export interface CrawlStats {
  totalCrawled: number;
  bySource: Record<string, { total: number; today: number; thisWeek: number; lastCrawl?: string }>;
  byType: Record<string, number>;
}

// ============================================
// ENRICHMENT
// ============================================

export interface EnrichedProfile {
  id: string;
  crawledDataId: string;
  source: string;
  type: 'profile' | 'job_post';
  structuredData: Record<string, unknown>;
  summary?: string;
  skills?: string[];
  enrichedAt: string;
}

export interface EnrichmentStats {
  totalEnriched: number;
  totalCrawled: number;
  bySource: Record<string, number>;
  byType: Record<string, number>;
  vectorCounts?: { profiles: number; jobPosts: number };
  // Raw backend fields (alternate shape)
  enriched?: Record<string, Record<string, number>>;
  total?: number;
  vectors?: { profiles: number; jobs: number };
}

export interface EnrichmentQueue {
  pending: number;
  processing: number;
  failed: number;
  completed: number;
}

export interface EnrichRequest {
  crawledDataId?: string;
  source?: string;
  type?: string;
  limit?: number;
}

export interface SearchRequest {
  query: string;
  type?: 'profile' | 'job_post';
  limit?: number;
}

export interface SearchResult {
  id: string;
  score: number;
  source: string;
  type: string;
  summary?: string;
  structuredData: Record<string, unknown>;
}

// ============================================
// ENTITIES
// ============================================

export interface UnifiedEntity {
  id: string;
  entityType: 'person' | 'company';
  name: string;
  email?: string;
  github?: string;
  twitter?: string;
  linkedin?: string;
  website?: string;
  sources: EntitySource[];
  qualityScore?: number;
  activityScore?: number;
  completenessScore?: number;
  availabilityScore?: number;
  createdAt: string;
  updatedAt: string;
}

export interface EntitySource {
  id: string;
  enrichedProfileId: string;
  matchType: string;
  confidence: number;
  source: string;
  summary?: string;
}

export interface EntityStats {
  total: number;
  byType: Record<string, number>;
  withEmail: number;
  avgSources: number;
  newThisWeek: number;
}

export interface EntitySourceDetail {
  matchType: string;
  confidenceScore: number;
  linkedAt: string;
  profile: {
    source: string;
    type: string;
    structuredData: Record<string, unknown>;
    summary?: string;
    enrichedAt: string;
  };
  rawData: Record<string, unknown>;
}

export interface EntityDetail {
  entity: UnifiedEntity & {
    location?: string;
    company?: string;
    mergedData: {
      sources: Array<{ source: string; type: string; crawledDataId: string; enrichedAt: string }>;
      skills: string[];
      specializations: string[];
      roles: string[];
      socialAccounts: Record<string, string>;
      seniorityLevel?: string;
      summary?: string;
      publicRepos?: number;
      followers?: number;
      languages?: Record<string, number>;
      influenceScore?: string;
      avatarUrl?: string;
    };
    sourceCount: number;
  };
  sources: EntitySourceDetail[];
}

// ============================================
// SCORING
// ============================================

export interface EntityScore {
  entityId: string;
  qualityScore: number;
  activityScore: number;
  completenessScore: number;
  availabilityScore: number;
  breakdown?: Record<string, unknown>;
  scoredAt: string;
}

export interface ScoreDistribution {
  dimension: string;
  buckets: { range: string; count: number }[];
}

// ============================================
// MATCHING
// ============================================

export interface Match {
  id: string;
  entityId?: string;
  enrichedProfileId?: string;
  entityName?: string;
  jobTitle?: string;
  vectorSimilarity: number;
  ruleScore: number;
  compositeScore: number;
  status: 'active' | 'dismissed' | 'contacted';
  breakdown?: Record<string, unknown>;
  createdAt: string;
}

export interface MatchDevelopersRequest {
  jobEnrichedProfileId: string;
  limit?: number;
  minScore?: number;
}

export interface MatchJobsRequest {
  entityId: string;
  limit?: number;
  minScore?: number;
}

// ============================================
// OUTREACH
// ============================================

export interface OutreachCampaign {
  id: string;
  name: string;
  description?: string;
  templateSubject: string;
  templateHtml: string;
  templateText?: string;
  fromAddress?: string;
  fromName?: string;
  replyTo?: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  totalRecipients: number;
  sentCount: number;
  openedCount: number;
  clickedCount: number;
  bouncedCount: number;
  unsubscribedCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface OutreachRecipient {
  id: string;
  campaignId: string;
  email: string;
  name?: string;
  entityId?: string;
  status: 'pending' | 'sent' | 'opened' | 'clicked' | 'bounced' | 'unsubscribed' | 'failed';
  sentAt?: string;
  openedAt?: string;
  clickedAt?: string;
  error?: string;
}

export interface OutreachStats {
  totalCampaigns: number;
  totalSent: number;
  totalOpened: number;
  totalClicked: number;
  totalBounced: number;
  totalUnsubscribed: number;
  openRate: number;
  clickRate: number;
  byStatus: Record<string, number>;
}

export interface OutreachQueue {
  pending: number;
  processing: number;
  failed: number;
  completed: number;
}

export interface CreateCampaignRequest {
  name: string;
  description?: string;
  templateSubject: string;
  templateHtml: string;
  templateText?: string;
  fromAddress?: string;
  fromName?: string;
  replyTo?: string;
}

export interface AddRecipientsRequest {
  entityFilter?: Record<string, unknown>;
  manualRecipients?: { email: string; name?: string }[];
}

// ============================================
// BLOCKLIST
// ============================================

export interface BlocklistEntry {
  id: string;
  email: string;
  reason: 'unsubscribed' | 'bounced' | 'manual' | 'complaint';
  sourceCampaignId?: string;
  createdAt: string;
}

// ============================================
// SES
// ============================================

export interface SesConfig {
  host: string;
  port: number;
  configured: boolean;
  fromAddress?: string;
}

export interface SendEmailRequest {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  fromName?: string;
  replyTo?: string;
}

// ============================================
// DASHBOARD
// ============================================

export interface DashboardData {
  crawl: CrawlStats;
  enrichment: EnrichmentStats;
  enrichmentQueue: EnrichmentQueue;
  entities: EntityStats;
  outreach: OutreachStats;
  outreachQueue: OutreachQueue;
  scoring?: {
    distribution: ScoreDistribution[];
  };
}

// ============================================
// PIPELINE
// ============================================

export type PipelineType = 'chain' | 'jobs' | 'profiles';
export type PipelineStage = 'pending' | 'CRAWL' | 'ENRICH' | 'RESOLVE' | 'CHAIN_CRAWL' | 'CHAIN_ENRICH' | 'CHAIN_RESOLVE' | 'COMPLETED';

export interface PipelineRun {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  pipelineType: PipelineType;
  currentStage: PipelineStage;
  stageData: Record<string, unknown>;
  config: Record<string, unknown>;
  profilesScanned: number;
  urlsDiscovered: number;
  urlsAlreadyCrawled: number;
  urlsNew: number;
  itemsCrawled: number;
  itemsEnriched: number;
  itemsFailed: number;
  itemsToEnrich: number;
  discoveredUrls: Array<{ url: string; type: string; sourceProfileId: string }>;
  autoEnrich: boolean;
  errorMessage?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
}

export interface PipelineScanResult {
  totalProfilesScanned: number;
  urlsDiscovered: number;
  alreadyCrawled: number;
  newUrls: Array<{ url: string; type: string; sourceProfileId: string; sourceName: string }>;
  urlsByType: Record<string, number>;
}

export interface PipelineStats {
  totalRuns: number;
  totalUrlsDiscovered: number;
  totalItemsCrawled: number;
  totalItemsEnriched: number;
  urlsByType: Record<string, number>;
  lastRunAt?: string;
}

export interface PipelineQueue {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}

// ============================================
// COMPANIES (extracted from job posts)
// ============================================

export interface CompanyEntity extends UnifiedEntity {
  mergedData?: {
    technologies?: string[];
    locations?: string[];
    hiringVolume?: number;
    hiringActive?: boolean;
    lastJobPostedAt?: string;
    website?: string;
    industry?: string;
    size?: string;
    contactEmail?: string;
    logoUrl?: string;
  };
  location?: string;
  sourceCount?: number;
}

export interface CompanyDetail {
  entity: CompanyEntity;
  sources: EntitySourceDetail[];
}

export interface BackfillCompaniesRequest {
  limit?: number;
  source?: string;
}

export interface BackfillCompaniesResult {
  processed: number;
  newCompanies: number;
  linkedToExisting: number;
  skipped: number;
  errors: number;
  message: string;
}

// ============================================
// ASYNC OPERATIONS (SSE progress)
// ============================================

export interface TriggerOperationResult {
  jobId: string;
}

export interface JobProgressEvent {
  status: string;
  percent: number;
  processed: number;
  total: number;
  result?: any;
  error?: string | null;
}

// ============================================
// GENERIC
// ============================================

export interface PaginatedParams {
  limit?: number;
  offset?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    limit: number;
    offset: number;
  };
}
