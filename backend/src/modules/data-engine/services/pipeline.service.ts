import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { QueueService } from '../../queue/queue.service';
import { CrawledDataService } from './crawled-data.service';
import { EnrichmentService } from './enrichment.service';
import { CrawlerDispatcher } from './crawler-dispatcher.service';
import { GithubCrawler } from '../crawlers/github.crawler';
import { GenericCrawler } from '../crawlers/generic.crawler';
import { EnrichmentProcessor } from '../processors/enrichment.processor';
import { extractIdentifiers } from '../utils/normalization';

const URL_ROUTING: Record<string, { crawler: string; contentType: string }> = {
  github: { crawler: 'github', contentType: 'profile' },
  linkedin: { crawler: 'generic', contentType: 'profile' },
  website: { crawler: 'generic', contentType: 'auto' },
  blog: { crawler: 'generic', contentType: 'auto' },
};

export interface DiscoveredUrl {
  url: string;
  type: string;
  sourceProfileId: string;
  sourceName: string;
}

export interface ScanResult {
  totalProfilesScanned: number;
  urlsDiscovered: number;
  alreadyCrawled: number;
  newUrls: DiscoveredUrl[];
  urlsByType: Record<string, number>;
}

@Injectable()
export class PipelineService {
  private readonly logger = new Logger(PipelineService.name);

  private static readonly PIPELINE_QUEUE = 'pipeline-chain';

  constructor(
    private readonly db: DatabaseService,
    private readonly queueService: QueueService,
    private readonly crawledDataService: CrawledDataService,
    private readonly enrichmentService: EnrichmentService,
    private readonly crawlerDispatcher: CrawlerDispatcher,
    private readonly githubCrawler: GithubCrawler,
    private readonly genericCrawler: GenericCrawler,
    private readonly enrichmentProcessor: EnrichmentProcessor,
  ) {}

  /**
   * Scan enriched profiles for chainable URLs that haven't been crawled yet
   */
  async scanForChainableUrls(filters: {
    source?: string;
    type?: string;
    urlTypes?: string[];
    limit?: number;
  }): Promise<ScanResult> {
    const limit = filters.limit || 100;
    const urlTypesToExtract = filters.urlTypes || ['github', 'linkedin', 'website', 'blog'];

    // Build query conditions for enriched_profiles
    const where: Record<string, any> = {};
    if (filters.source) where.source = filters.source;
    if (filters.type) where.type = filters.type;

    const profiles = await this.db.select('enriched_profiles', {
      where,
      limit,
      orderBy: 'enriched_at',
      order: 'DESC',
    });

    const allDiscoveredUrls: DiscoveredUrl[] = [];
    let alreadyCrawledCount = 0;
    const urlsByType: Record<string, number> = {};

    for (const profile of profiles || []) {
      const structuredData = profile.structured_data || {};
      const socialAccounts = structuredData.socialAccounts || {};

      // Also extract identifiers from raw data if we have the crawled_data_id
      let rawData: Record<string, any> = {};
      if (profile.crawled_data_id) {
        const crawledItem = await this.crawledDataService.findById(profile.crawled_data_id);
        if (crawledItem) {
          rawData = crawledItem.rawData || {};
        }
      }

      const identifiers = extractIdentifiers(structuredData, rawData);

      // Build URL candidates based on requested types
      const urlCandidates: { url: string; type: string }[] = [];

      for (const urlType of urlTypesToExtract) {
        let url: string | null = null;

        switch (urlType) {
          case 'github': {
            const githubUser = socialAccounts.github || identifiers.github;
            if (githubUser) {
              // normalizeGithubUrl returns just the username
              const username = githubUser.replace(/^https?:\/\/(www\.)?github\.com\//, '').split('/')[0];
              if (username && username.length > 0) {
                url = `https://github.com/${username}`;
              }
            }
            break;
          }
          case 'linkedin': {
            const linkedinUrl = socialAccounts.linkedin || identifiers.linkedin;
            if (linkedinUrl) {
              url = linkedinUrl.startsWith('http') ? linkedinUrl : `https://www.linkedin.com/in/${linkedinUrl}`;
            }
            break;
          }
          case 'website': {
            const websiteUrl = socialAccounts.website || rawData?.blog;
            if (websiteUrl && websiteUrl.startsWith('http')) {
              url = websiteUrl;
            }
            break;
          }
          case 'blog': {
            const blogUrl = socialAccounts.blog;
            if (blogUrl && blogUrl.startsWith('http')) {
              url = blogUrl;
            }
            break;
          }
        }

        if (url) {
          urlCandidates.push({ url, type: urlType });
        }
      }

      // Check each URL against crawled_data
      for (const candidate of urlCandidates) {
        const exists = await this.crawledDataService.existsBySourceUrl(candidate.url);
        if (exists) {
          alreadyCrawledCount++;
          continue;
        }

        allDiscoveredUrls.push({
          url: candidate.url,
          type: candidate.type,
          sourceProfileId: profile.id,
          sourceName: structuredData.summary?.slice(0, 60) || profile.source || 'Unknown',
        });

        urlsByType[candidate.type] = (urlsByType[candidate.type] || 0) + 1;
      }
    }

    return {
      totalProfilesScanned: profiles?.length || 0,
      urlsDiscovered: allDiscoveredUrls.length + alreadyCrawledCount,
      alreadyCrawled: alreadyCrawledCount,
      newUrls: allDiscoveredUrls,
      urlsByType,
    };
  }

  /**
   * Create a pipeline run record with discovered URLs
   */
  async createRun(options: {
    source?: string;
    type?: string;
    urlTypes?: string[];
    limit?: number;
    autoEnrich?: boolean;
  }): Promise<{ run: any; scanResult: ScanResult }> {
    const autoEnrich = options.autoEnrich !== false;
    const scanResult = await this.scanForChainableUrls(options);

    const run = await this.db.insert('pipeline_runs', {
      status: 'pending',
      config: {
        source: options.source,
        type: options.type,
        urlTypes: options.urlTypes,
        limit: options.limit,
      },
      profiles_scanned: scanResult.totalProfilesScanned,
      urls_discovered: scanResult.urlsDiscovered,
      urls_already_crawled: scanResult.alreadyCrawled,
      urls_new: scanResult.newUrls.length,
      items_crawled: 0,
      items_enriched: 0,
      items_failed: 0,
      discovered_urls: scanResult.newUrls,
      auto_enrich: autoEnrich,
      created_at: new Date().toISOString(),
    });

    return { run: this.transformRun(run), scanResult };
  }

  /**
   * Get pipeline runs with pagination.
   * Also auto-completes any stale "running" runs where all jobs have finished.
   */
  async getRuns(filters: {
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ data: any[]; total: number }> {
    const where: Record<string, any> = {};
    if (filters.status) where.status = filters.status;

    const allRuns = await this.db.select('pipeline_runs', {
      where,
      orderBy: 'created_at',
      order: 'DESC',
    });

    // Auto-complete any stale "running" runs by checking BullMQ actual job states
    for (const run of allRuns || []) {
      if (run.status === 'running') {
        const totalExpected = run.urls_new || 0;
        if (totalExpected === 0) continue;

        // Check BullMQ for actual job completion (source of truth)
        const jobCounts = await this.queueService.getJobsForRun(
          PipelineService.PIPELINE_QUEUE,
          run.id,
        );
        const totalDone = jobCounts.completed + jobCounts.failed;
        const totalPending = jobCounts.active + jobCounts.waiting;

        if (totalDone >= totalExpected || (totalPending === 0 && totalDone > 0)) {
          await this.updateRunStatus(run.id, 'completed', {
            items_crawled: jobCounts.completed,
            items_failed: jobCounts.failed,
          });
          run.status = 'completed';
          run.items_crawled = jobCounts.completed;
          run.items_failed = jobCounts.failed;
          run.completed_at = new Date().toISOString();
          this.logger.log(`Auto-completed stale pipeline run ${run.id}: ${jobCounts.completed} crawled, ${jobCounts.failed} failed`);
        }
      }
    }

    const total = allRuns?.length || 0;
    const limit = filters.limit || 20;
    const offset = filters.offset || 0;
    const data = (allRuns || []).slice(offset, offset + limit).map(this.transformRun);

    return { data, total };
  }

  /**
   * Get a single run by ID. Auto-completes stale "running" runs via BullMQ check.
   */
  async getRunById(id: string): Promise<any | null> {
    const results = await this.db.select('pipeline_runs', {
      where: { id },
      limit: 1,
    });

    if (!results || results.length === 0) return null;
    const run = results[0];

    // Auto-complete stale "running" runs by checking BullMQ
    if (run.status === 'running' && (run.urls_new || 0) > 0) {
      const jobCounts = await this.queueService.getJobsForRun(
        PipelineService.PIPELINE_QUEUE,
        run.id,
      );
      const totalDone = jobCounts.completed + jobCounts.failed;
      const totalPending = jobCounts.active + jobCounts.waiting;

      if (totalDone >= (run.urls_new || 0) || (totalPending === 0 && totalDone > 0)) {
        await this.updateRunStatus(run.id, 'completed', {
          items_crawled: jobCounts.completed,
          items_failed: jobCounts.failed,
        });
        run.status = 'completed';
        run.items_crawled = jobCounts.completed;
        run.items_failed = jobCounts.failed;
        run.completed_at = new Date().toISOString();
        this.logger.log(`Auto-completed pipeline run ${run.id}: ${jobCounts.completed} crawled, ${jobCounts.failed} failed`);
      }
    }

    return this.transformRun(run);
  }

  /**
   * Cancel a stuck or running pipeline run
   */
  async cancelRun(id: string): Promise<any> {
    const results = await this.db.select('pipeline_runs', {
      where: { id },
      limit: 1,
    });
    if (!results || results.length === 0) {
      return { success: false, message: 'Pipeline run not found' };
    }

    const run = results[0];
    if (run.status === 'completed' || run.status === 'failed') {
      return { success: false, message: `Run already ${run.status}` };
    }

    await this.db.update('pipeline_runs', id, {
      status: 'failed',
      error_message: 'Manually cancelled',
      completed_at: new Date().toISOString(),
    });

    this.logger.log(`Pipeline run ${id} cancelled (was stage: ${run.current_stage})`);
    return { success: true, message: 'Pipeline run cancelled' };
  }

  /**
   * Get aggregated pipeline statistics
   */
  async getChainStats(): Promise<{
    totalRuns: number;
    totalUrlsDiscovered: number;
    totalItemsCrawled: number;
    totalItemsEnriched: number;
    urlsByType: Record<string, number>;
    lastRunAt?: string;
  }> {
    const allRuns = await this.db.select('pipeline_runs', {
      orderBy: 'created_at',
      order: 'DESC',
    });

    const runs = allRuns || [];

    let totalUrlsDiscovered = 0;
    let totalItemsCrawled = 0;
    let totalItemsEnriched = 0;
    const urlsByType: Record<string, number> = {};

    for (const run of runs) {
      totalUrlsDiscovered += run.urls_discovered || 0;
      totalItemsCrawled += run.items_crawled || 0;
      totalItemsEnriched += run.items_enriched || 0;

      const discoveredUrls = run.discovered_urls || [];
      for (const u of discoveredUrls) {
        if (u.type) {
          urlsByType[u.type] = (urlsByType[u.type] || 0) + 1;
        }
      }
    }

    return {
      totalRuns: runs.length,
      totalUrlsDiscovered,
      totalItemsCrawled,
      totalItemsEnriched,
      urlsByType,
      lastRunAt: runs.length > 0 ? runs[0].created_at : undefined,
    };
  }

  /**
   * Execute crawl for a single discovered URL
   * Note: Counter increments are handled by the PipelineProcessor, not here.
   */
  async executeCrawlForUrl(
    url: string,
    urlType: string,
    runId: string,
  ): Promise<{ success: boolean; crawledDataId?: string; error?: string }> {
    const routing = URL_ROUTING[urlType];
    if (!routing) {
      return { success: false, error: `Unknown URL type: ${urlType}` };
    }

    try {
      let result: any;

      if (routing.crawler === 'github') {
        // Extract username from GitHub URL
        const username = url.replace(/^https?:\/\/(www\.)?github\.com\//, '').split('/')[0];
        if (!username) {
          return { success: false, error: 'Could not extract GitHub username from URL' };
        }

        result = await this.githubCrawler.crawlByQuery({
          query: `user:${username}`,
          limit: 1,
        });
      } else {
        // generic crawler
        result = await this.genericCrawler.crawl({
          urls: [url],
          mode: 'single',
          contentType: routing.contentType as any,
          fetchMethod: 'cheerio',
        });
      }

      if (result.status === 'completed') {
        return { success: true };
      } else {
        return { success: false, error: result.errorMessage || 'Crawl returned no new items' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Update run status
   */
  async updateRunStatus(runId: string, status: string, extra?: Record<string, any>): Promise<void> {
    const updateData: Record<string, any> = { status };
    if (status === 'running') {
      updateData.started_at = new Date().toISOString();
    }
    if (status === 'completed' || status === 'failed') {
      updateData.completed_at = new Date().toISOString();
    }
    if (extra) {
      Object.assign(updateData, extra);
    }
    await this.db.update('pipeline_runs', runId, updateData);
  }

  /**
   * Atomically increment a counter on a pipeline run.
   * Uses raw SQL to avoid race conditions with concurrent jobs.
   */
  async incrementRunCounter(runId: string, field: string): Promise<void> {
    const allowedFields = ['items_crawled', 'items_enriched', 'items_failed'];
    if (!allowedFields.includes(field)) {
      this.logger.warn(`Invalid counter field: ${field}`);
      return;
    }
    try {
      // Atomic increment via raw SQL — PostgreSQL row-level locking prevents race conditions
      await /* TODO: replace client call */ this.db.client.raw(
        `UPDATE pipeline_runs SET ${field} = COALESCE(${field}, 0) + 1 WHERE id = ?`,
        [runId],
      );
    } catch (error) {
      // Fallback: read-then-write if raw SQL is not supported
      this.logger.warn(`Raw SQL increment failed, using fallback: ${error.message}`);
      try {
        const run = await this.db.select('pipeline_runs', {
          where: { id: runId },
          limit: 1,
        });
        if (run && run.length > 0) {
          const currentValue = run[0][field] || 0;
          await this.db.update('pipeline_runs', runId, {
            [field]: currentValue + 1,
          });
        }
      } catch (fallbackError) {
        this.logger.warn(`Failed to increment ${field} for run ${runId}: ${fallbackError.message}`);
      }
    }
  }

  // ==========================================
  // AUTOMATION PIPELINE METHODS
  // ==========================================

  /**
   * Create and start a Jobs + Company automation pipeline.
   * Crawls job posts → enrich → resolve companies → (optional) crawl company websites → enrich → resolve
   */
  async createJobsPipelineRun(dto: {
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
    tag?: string;
    category?: string;
    location?: string;
    month?: number;
    year?: number;
    maxUrls?: number;
  }): Promise<{ run: any; crawlResult: any }> {
    const limit = dto.limit || 50;

    this.logger.log(`Creating Jobs pipeline: source=${dto.source}, limit=${limit}`);

    // Build source-specific config for storage
    const { source, crawlCompanyWebsites, ...crawlerOpts } = dto;
    const config: Record<string, any> = {
      source,
      limit,
      crawlCompanyWebsites: crawlCompanyWebsites !== false,
    };
    // Store all non-undefined crawler options
    for (const [k, v] of Object.entries(crawlerOpts)) {
      if (v !== undefined) config[k] = v;
    }

    // Create the pipeline run record
    const run = await this.db.insert('pipeline_runs', {
      status: 'running',
      pipeline_type: 'jobs',
      current_stage: 'CRAWL',
      config,
      profiles_scanned: 0,
      urls_discovered: 0,
      urls_already_crawled: 0,
      urls_new: 0,
      items_crawled: 0,
      items_enriched: 0,
      items_failed: 0,
      items_to_enrich: 0,
      discovered_urls: [],
      auto_enrich: true,
      stage_data: { crawlStartedAt: new Date().toISOString() },
      started_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    });

    // Dispatch the crawl with all options
    const crawlResult = await this.crawlerDispatcher.dispatch(source, { limit, ...crawlerOpts });

    // Update run with crawl results
    await this.db.update('pipeline_runs', run.id, {
      items_crawled: crawlResult.itemsNew,
      stage_data: {
        crawlStartedAt: new Date().toISOString(),
        crawlResult: crawlResult,
      },
    });

    this.logger.log(
      `Jobs pipeline CRAWL complete: found=${crawlResult.itemsFound}, new=${crawlResult.itemsNew}`,
    );

    // Queue the ENRICH stage via automation processor
    await this.queueService.addJob(
      'pipeline-automation',
      'automation',
      { runId: run.id, action: 'start_enrich' },
      { jobId: `automation-${run.id}-start-enrich` },
    );

    return { run: this.transformRun(run), crawlResult };
  }

  /**
   * Create and start a Profiles automation pipeline.
   * Crawls profiles → enrich → entity resolution → chain crawl linked URLs → enrich → resolve
   */
  async createProfilesPipelineRun(dto: {
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
    query?: string;
    minReputation?: number;
    sort?: string;
    location?: string;
    month?: number;
    year?: number;
  }): Promise<{ run: any; crawlResult: any }> {
    const limit = dto.limit || 50;

    this.logger.log(`Creating Profiles pipeline: source=${dto.source}, limit=${limit}`);

    // Build source-specific config for storage
    const { source, chainUrlTypes, ...crawlerOpts } = dto;
    const config: Record<string, any> = {
      source,
      limit,
      chainUrlTypes: chainUrlTypes || ['github', 'linkedin', 'website'],
    };
    for (const [k, v] of Object.entries(crawlerOpts)) {
      if (v !== undefined) config[k] = v;
    }

    // Create the pipeline run record
    const run = await this.db.insert('pipeline_runs', {
      status: 'running',
      pipeline_type: 'profiles',
      current_stage: 'CRAWL',
      config,
      profiles_scanned: 0,
      urls_discovered: 0,
      urls_already_crawled: 0,
      urls_new: 0,
      items_crawled: 0,
      items_enriched: 0,
      items_failed: 0,
      items_to_enrich: 0,
      discovered_urls: [],
      auto_enrich: true,
      stage_data: { crawlStartedAt: new Date().toISOString() },
      started_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    });

    // Dispatch the crawl with all options
    const crawlResult = await this.crawlerDispatcher.dispatch(source, { limit, ...crawlerOpts });

    // Update run with crawl results
    await this.db.update('pipeline_runs', run.id, {
      items_crawled: crawlResult.itemsNew,
      stage_data: {
        crawlStartedAt: new Date().toISOString(),
        crawlResult: crawlResult,
      },
    });

    this.logger.log(
      `Profiles pipeline CRAWL complete: found=${crawlResult.itemsFound}, new=${crawlResult.itemsNew}`,
    );

    // Queue the ENRICH stage via automation processor
    await this.queueService.addJob(
      'pipeline-automation',
      'automation',
      { runId: run.id, action: 'start_enrich' },
      { jobId: `automation-${run.id}-start-enrich` },
    );

    return { run: this.transformRun(run), crawlResult };
  }

  /**
   * Transform DB record to camelCase API response
   */
  private transformRun(run: any): any {
    return {
      id: run.id,
      status: run.status,
      pipelineType: run.pipeline_type || 'chain',
      currentStage: run.current_stage || 'pending',
      stageData: run.stage_data || {},
      config: run.config || {},
      profilesScanned: run.profiles_scanned || 0,
      urlsDiscovered: run.urls_discovered || 0,
      urlsAlreadyCrawled: run.urls_already_crawled || 0,
      urlsNew: run.urls_new || 0,
      itemsCrawled: run.items_crawled || 0,
      itemsEnriched: run.items_enriched || 0,
      itemsFailed: run.items_failed || 0,
      itemsToEnrich: run.items_to_enrich || 0,
      discoveredUrls: run.discovered_urls || [],
      autoEnrich: run.auto_enrich ?? true,
      errorMessage: run.error_message || undefined,
      startedAt: run.started_at || undefined,
      completedAt: run.completed_at || undefined,
      createdAt: run.created_at,
    };
  }
}
