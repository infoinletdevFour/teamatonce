import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Job } from 'bullmq';
import { QueueService } from '../../queue/queue.service';
import { DatabaseService } from '../../database/database.service';
import { PipelineService } from '../services/pipeline.service';
import { EnrichmentProcessor } from './enrichment.processor';
import { CrawlerDispatcher } from '../services/crawler-dispatcher.service';
import { CrawledDataService } from '../services/crawled-data.service';
import { EnrichmentService } from '../services/enrichment.service';
import { GenericCrawler } from '../crawlers/generic.crawler';

export interface AutomationPipelineJobData {
  runId: string;
  action:
    | 'start_enrich'
    | 'start_chain_crawl'
    | 'start_chain_enrich'
    | 'check_completion';
}

@Injectable()
export class AutomationPipelineProcessor implements OnModuleInit {
  private readonly logger = new Logger(AutomationPipelineProcessor.name);
  static readonly QUEUE_NAME = 'pipeline-automation';

  constructor(
    private readonly queueService: QueueService,
    private readonly db: DatabaseService,
    private readonly pipelineService: PipelineService,
    private readonly enrichmentProcessor: EnrichmentProcessor,
    private readonly crawlerDispatcher: CrawlerDispatcher,
    private readonly crawledDataService: CrawledDataService,
    private readonly enrichmentService: EnrichmentService,
    private readonly genericCrawler: GenericCrawler,
  ) {}

  async onModuleInit() {
    await this.registerWorker();
  }

  private async registerWorker(): Promise<void> {
    if (!this.queueService.isConfigured()) {
      this.logger.warn('Queue service not configured. Automation pipeline processor disabled.');
      return;
    }

    const worker = this.queueService.registerWorker<AutomationPipelineJobData, any>(
      AutomationPipelineProcessor.QUEUE_NAME,
      async (job: Job<AutomationPipelineJobData>) => this.processJob(job),
      { concurrency: 1 },
    );

    if (worker) {
      this.logger.log('Automation pipeline processor registered and ready');
    }
  }

  /**
   * Queue an automation pipeline action
   */
  async queueAction(runId: string, action: AutomationPipelineJobData['action']): Promise<void> {
    if (!this.queueService.isConfigured()) {
      this.logger.warn('Queue not configured, cannot queue automation action');
      return;
    }

    await this.queueService.addJob<AutomationPipelineJobData>(
      AutomationPipelineProcessor.QUEUE_NAME,
      'automation',
      { runId, action },
      { jobId: `automation-${runId}-${action}-${Date.now()}` },
    );
  }

  private async processJob(job: Job<AutomationPipelineJobData>): Promise<any> {
    const { runId, action } = job.data;

    this.logger.log(`Processing automation action: ${action} for run ${runId}`);

    try {
      const runs = await this.db.select('pipeline_runs', {
        where: { id: runId },
        limit: 1,
      });

      if (!runs || runs.length === 0) {
        throw new Error(`Pipeline run not found: ${runId}`);
      }

      const run = runs[0];

      switch (action) {
        case 'start_enrich':
          return this.handleStartEnrich(run);
        case 'start_chain_crawl':
          return this.handleStartChainCrawl(run);
        case 'start_chain_enrich':
          return this.handleStartChainEnrich(run);
        case 'check_completion':
          return this.handleCheckCompletion(run);
        default:
          throw new Error(`Unknown action: ${action}`);
      }
    } catch (error) {
      this.logger.error(`Automation action ${action} failed for run ${runId}: ${error.message}`, error.stack);
      await this.db.update('pipeline_runs', runId, {
        status: 'failed',
        error_message: error.message,
        completed_at: new Date().toISOString(),
      });
      throw error;
    }
  }

  /**
   * ENRICH stage: Find newly-crawled items and queue them for enrichment
   */
  private async handleStartEnrich(run: any): Promise<void> {
    const runId = run.id;
    const pipelineType = run.pipeline_type;

    this.logger.log(`Starting ENRICH stage for run ${runId} (type: ${pipelineType})`);

    // Find unenriched items from this run's source
    const source = run.config?.source;
    const unenrichedData = await this.enrichmentService.getUnenrichedData({
      source,
      limit: 500,
    });

    if (unenrichedData.length === 0) {
      this.logger.log(`No items to enrich for run ${runId}, skipping to next stage`);
      await this.advanceToNextStage(run, 'ENRICH');
      return;
    }

    // Queue enrichment with pipelineRunId
    const items = unenrichedData.map((d: any) => ({
      id: d.id,
      source: d.source,
      type: d.type,
    }));

    const queued = await this.enrichmentProcessor.queueBulkEnrichmentForPipeline(items, runId);

    // Update run with items_to_enrich count and stage
    await this.db.update('pipeline_runs', runId, {
      current_stage: 'ENRICH',
      items_to_enrich: queued,
      stage_data: {
        ...(run.stage_data || {}),
        enrichStartedAt: new Date().toISOString(),
        enrichItemsQueued: queued,
      },
    });

    this.logger.log(`ENRICH stage: queued ${queued} items for run ${runId}`);

    // If no items were queued, advance immediately
    if (queued === 0) {
      await this.advanceToNextStage(run, 'ENRICH');
    }
    // Otherwise, enrichment completion hook will trigger check_completion
  }

  /**
   * CHAIN_CRAWL stage: Crawl company websites (jobs) or linked URLs (profiles)
   */
  private async handleStartChainCrawl(run: any): Promise<void> {
    const runId = run.id;
    const pipelineType = run.pipeline_type;

    this.logger.log(`Starting CHAIN_CRAWL stage for run ${runId} (type: ${pipelineType})`);

    await this.db.update('pipeline_runs', runId, {
      current_stage: 'CHAIN_CRAWL',
      stage_data: {
        ...(run.stage_data || {}),
        chainCrawlStartedAt: new Date().toISOString(),
      },
    });

    let chainItemsCrawled = 0;

    if (pipelineType === 'jobs') {
      // Jobs pipeline: crawl company websites
      const crawlCompanyWebsites = run.config?.crawlCompanyWebsites !== false;
      if (!crawlCompanyWebsites) {
        this.logger.log(`Company website crawl disabled for run ${runId}, skipping chain`);
        await this.advanceToNextStage(run, 'CHAIN_CRAWL');
        return;
      }

      chainItemsCrawled = await this.crawlCompanyWebsites(runId);
    } else if (pipelineType === 'profiles') {
      // Profiles pipeline: discover linked URLs and crawl them
      chainItemsCrawled = await this.crawlLinkedUrls(run);
    }

    // Update stage data
    await this.db.update('pipeline_runs', runId, {
      stage_data: {
        ...(run.stage_data || {}),
        chainCrawlStartedAt: (run.stage_data || {}).chainCrawlStartedAt,
        chainItemsCrawled: chainItemsCrawled,
      },
    });

    if (chainItemsCrawled > 0) {
      // Advance to CHAIN_ENRICH
      await this.queueAction(runId, 'start_chain_enrich');
    } else {
      this.logger.log(`No chain items found for run ${runId}, completing`);
      await this.completePipeline(runId, run);
    }
  }

  /**
   * CHAIN_ENRICH stage: Enrich chain-crawled items
   */
  private async handleStartChainEnrich(run: any): Promise<void> {
    const runId = run.id;

    this.logger.log(`Starting CHAIN_ENRICH stage for run ${runId}`);

    // Find unenriched items (the chain-crawled ones)
    const unenrichedData = await this.enrichmentService.getUnenrichedData({
      source: 'generic', // Chain crawls use generic crawler
      limit: 500,
    });

    if (unenrichedData.length === 0) {
      this.logger.log(`No chain items to enrich for run ${runId}, completing`);
      await this.completePipeline(runId, run);
      return;
    }

    const items = unenrichedData.map((d: any) => ({
      id: d.id,
      source: d.source,
      type: d.type,
    }));

    const queued = await this.enrichmentProcessor.queueBulkEnrichmentForPipeline(items, runId);

    await this.db.update('pipeline_runs', runId, {
      current_stage: 'CHAIN_ENRICH',
      items_to_enrich: queued,
      stage_data: {
        ...(run.stage_data || {}),
        chainEnrichStartedAt: new Date().toISOString(),
        chainEnrichItemsQueued: queued,
      },
    });

    this.logger.log(`CHAIN_ENRICH stage: queued ${queued} items for run ${runId}`);

    if (queued === 0) {
      await this.completePipeline(runId, run);
    }
    // Otherwise, enrichment completion hook will trigger check_completion
  }

  /**
   * Check if enrichment is complete and advance to next stage.
   * Called both by the counter-triggered completion and the delayed safety-check.
   */
  private async handleCheckCompletion(run: any): Promise<void> {
    const runId = run.id;
    const currentStage = run.current_stage;

    this.logger.log(`Checking completion for run ${runId}, stage: ${currentStage}`);

    // If not in an enrichment stage, nothing to do (already advanced)
    if (currentStage !== 'ENRICH' && currentStage !== 'CHAIN_ENRICH') {
      this.logger.log(`Run ${runId} not in enrichment stage (${currentStage}), skipping check`);
      return;
    }

    // Re-read the run to get latest counters
    const freshRuns = await this.db.select('pipeline_runs', {
      where: { id: runId },
      limit: 1,
    });
    if (!freshRuns || freshRuns.length === 0) return;
    const freshRun = freshRuns[0];

    const enriched = freshRun.items_enriched || 0;
    const failed = freshRun.items_failed || 0;
    const toEnrich = freshRun.items_to_enrich || 0;

    if (toEnrich > 0 && (enriched + failed) >= toEnrich) {
      // Counters confirm enrichment is done
      this.logger.log(
        `Run ${runId}: counters confirm completion (${enriched}+${failed}>=${toEnrich}). Advancing stage.`,
      );
      await this.advanceToNextStage(freshRun, currentStage);
      return;
    }

    // Counters don't add up — check if the enrichment queue is actually empty
    const queueStats = await this.enrichmentProcessor.getQueueStats();
    if (queueStats && queueStats.waiting === 0 && queueStats.active === 0) {
      // Queue is empty but counters are off (race condition). Advance anyway.
      this.logger.warn(
        `Run ${runId}: enrichment queue empty but counters don't match ` +
          `(${enriched}+${failed}=${enriched + failed} vs ${toEnrich}). ` +
          `Race condition detected — advancing stage anyway.`,
      );
      await this.advanceToNextStage(freshRun, currentStage);
      return;
    }

    this.logger.log(
      `Run ${runId}: enrichment still in progress ` +
        `(${enriched}+${failed}=${enriched + failed} of ${toEnrich}, ` +
        `queue: ${queueStats?.waiting || '?'} waiting, ${queueStats?.active || '?'} active). ` +
        `Will check again when next job completes.`,
    );
  }

  /**
   * Advance to the next pipeline stage based on current stage
   */
  private async advanceToNextStage(run: any, completedStage: string): Promise<void> {
    const runId = run.id;
    const pipelineType = run.pipeline_type;

    this.logger.log(`Advancing run ${runId} past stage ${completedStage}`);

    switch (completedStage) {
      case 'CRAWL':
        // Move to ENRICH
        await this.queueAction(runId, 'start_enrich');
        break;

      case 'ENRICH':
        // RESOLVE is implicit (entity resolution runs during enrichment)
        // Move to CHAIN_CRAWL
        await this.db.update('pipeline_runs', runId, {
          current_stage: 'RESOLVE',
        });
        // Short delay then chain crawl
        await this.queueAction(runId, 'start_chain_crawl');
        break;

      case 'CHAIN_CRAWL':
        // Move to CHAIN_ENRICH
        await this.queueAction(runId, 'start_chain_enrich');
        break;

      case 'CHAIN_ENRICH':
        // CHAIN_RESOLVE is implicit, complete the pipeline
        await this.completePipeline(runId, run);
        break;

      default:
        this.logger.warn(`Unknown stage to advance from: ${completedStage}`);
        await this.completePipeline(runId, run);
    }
  }

  /**
   * Mark pipeline as completed
   */
  private async completePipeline(runId: string, run: any): Promise<void> {
    await this.db.update('pipeline_runs', runId, {
      status: 'completed',
      current_stage: 'COMPLETED',
      completed_at: new Date().toISOString(),
    });
    this.logger.log(`Pipeline run ${runId} COMPLETED`);
  }

  /**
   * For jobs pipeline: crawl company websites (homepage + /contact + /about)
   */
  private async crawlCompanyWebsites(runId: string): Promise<number> {
    // Find company entities that have a website
    const companies = await this.db.select('unified_entities', {
      where: { entity_type: 'company' },
      orderBy: 'created_at',
      order: 'DESC',
      limit: 200,
    });

    let totalCrawled = 0;

    for (const company of companies || []) {
      const mergedData = company.merged_data || {};
      const website = mergedData.website;
      if (!website) continue;

      // Build URL list: homepage, /contact, /about
      const urlsToCrawl: string[] = [];
      const baseUrl = website.replace(/\/$/, '');

      for (const path of ['', '/contact', '/about']) {
        const fullUrl = baseUrl + path;
        const exists = await this.crawledDataService.existsBySourceUrl(fullUrl);
        if (!exists) {
          urlsToCrawl.push(fullUrl);
        }
      }

      if (urlsToCrawl.length === 0) continue;

      try {
        const result = await this.genericCrawler.crawl({
          urls: urlsToCrawl,
          mode: 'single',
          contentType: 'company',
          fetchMethod: 'cheerio',
        });
        totalCrawled += result.itemsNew || 0;
      } catch (error) {
        this.logger.warn(`Failed to crawl company website ${website}: ${error.message}`);
      }
    }

    this.logger.log(`Company website crawl complete: ${totalCrawled} new pages crawled`);
    return totalCrawled;
  }

  /**
   * For profiles pipeline: discover linked URLs and crawl them
   */
  private async crawlLinkedUrls(run: any): Promise<number> {
    const chainUrlTypes = run.config?.chainUrlTypes || ['github', 'linkedin', 'website'];

    const scanResult = await this.pipelineService.scanForChainableUrls({
      source: run.config?.source,
      type: 'profile',
      urlTypes: chainUrlTypes,
      limit: 200,
    });

    if (scanResult.newUrls.length === 0) {
      this.logger.log(`No chainable URLs found for profiles pipeline run ${run.id}`);
      return 0;
    }

    let totalCrawled = 0;

    for (const urlItem of scanResult.newUrls) {
      try {
        const result = await this.pipelineService.executeCrawlForUrl(
          urlItem.url,
          urlItem.type,
          run.id,
        );
        if (result.success) totalCrawled++;
      } catch (error) {
        this.logger.warn(`Failed to crawl ${urlItem.url}: ${error.message}`);
      }
    }

    this.logger.log(`Linked URL crawl complete: ${totalCrawled} new items crawled`);
    return totalCrawled;
  }
}
