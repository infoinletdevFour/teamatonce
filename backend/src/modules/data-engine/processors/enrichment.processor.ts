import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Job } from 'bullmq';
import { QueueService } from '../../queue/queue.service';
import { DatabaseService } from '../../database/database.service';
import { EnrichmentService, JobCompanyInfo } from '../services/enrichment.service';
import { CrawledDataService } from '../services/crawled-data.service';
import { EntityResolutionService } from '../services/entity-resolution.service';

export interface EnrichmentJobData {
  crawledDataId: string;
  source: string;
  type: string;
  pipelineRunId?: string;
}

export interface EnrichmentJobResult {
  success: boolean;
  enrichedProfileId?: string;
  unifiedEntityId?: string;
  error?: string;
}

@Injectable()
export class EnrichmentProcessor implements OnModuleInit {
  private readonly logger = new Logger(EnrichmentProcessor.name);
  static readonly QUEUE_NAME = 'enrichment';

  constructor(
    private readonly queueService: QueueService,
    private readonly db: DatabaseService,
    private readonly enrichmentService: EnrichmentService,
    private readonly crawledDataService: CrawledDataService,
    private readonly entityResolutionService: EntityResolutionService,
  ) {}

  async onModuleInit() {
    await this.registerWorker();
  }

  /**
   * Register the enrichment worker
   */
  private async registerWorker(): Promise<void> {
    if (!this.queueService.isConfigured()) {
      this.logger.warn('Queue service not configured. Enrichment processor disabled.');
      return;
    }

    if (!this.enrichmentService.isConfigured()) {
      this.logger.warn('Enrichment service not configured. Enrichment processor disabled.');
      return;
    }

    const worker = this.queueService.registerWorker<EnrichmentJobData, EnrichmentJobResult>(
      EnrichmentProcessor.QUEUE_NAME,
      async (job: Job<EnrichmentJobData>) => this.processJob(job),
      { concurrency: 2 },
    );

    if (worker) {
      // When a job permanently fails (all retries exhausted), update the pipeline's failed counter
      worker.on('failed', async (job, _error) => {
        if (job?.data?.pipelineRunId) {
          await this.updatePipelineFailureCounter(job.data.pipelineRunId);
        }
      });
      this.logger.log('Enrichment processor registered and ready');
    }
  }

  /**
   * Process a single enrichment job
   */
  private async processJob(job: Job<EnrichmentJobData>): Promise<EnrichmentJobResult> {
    const { crawledDataId, source, type } = job.data;

    this.logger.log(`Processing enrichment job ${job.id}: ${source}/${type} - ${crawledDataId}`);

    try {
      // Check if already enriched
      const alreadyEnriched = await this.enrichmentService.isAlreadyEnriched(crawledDataId);
      if (alreadyEnriched) {
        this.logger.debug(`Crawled data ${crawledDataId} already enriched, skipping`);
        // Still count it as enriched for pipeline completion tracking
        if (job.data.pipelineRunId) {
          await this.updatePipelineEnrichmentCounter(job.data.pipelineRunId);
        }
        return {
          success: true,
          error: 'Already enriched',
        };
      }

      // Fetch raw crawled data
      const crawledData = await this.crawledDataService.findById(crawledDataId);
      if (!crawledData) {
        throw new Error(`Crawled data not found: ${crawledDataId}`);
      }

      // Update job progress
      await job.updateProgress(10);

      // Raw content from generic crawler → single-pass enrichment
      if (EnrichmentService.isRawContent(crawledData.rawData)) {
        return this.processRawContent(job, crawledData);
      }

      // Extract structured data based on type
      let structuredData: any;
      let embeddingId: string;

      if (type === 'profile') {
        // Enrich profile (supports multiple sources)
        structuredData = await this.enrichmentService.enrichProfile(crawledData.rawData, source);
        await job.updateProgress(50);

        // Generate and store embedding
        const tempId = `temp-${crawledDataId}`;
        embeddingId = await this.enrichmentService.storeProfileEmbedding(
          tempId,
          structuredData,
          crawledData.rawData,
          source,
        );
        await job.updateProgress(80);
      } else if (type === 'job_post') {
        // Enrich job post (supports multiple sources)
        structuredData = await this.enrichmentService.enrichJobPost(crawledData.rawData, source);
        await job.updateProgress(50);

        // Generate and store embedding
        const tempId = `temp-${crawledDataId}`;
        embeddingId = await this.enrichmentService.storeJobEmbedding(
          tempId,
          structuredData,
          crawledData.rawData,
          source,
        );
        await job.updateProgress(75);

        // Extract company from raw data (deterministic) and merge with AI-extracted companyInfo
        const rawCompany = this.enrichmentService.extractCompanyFromJobRawData(crawledData.rawData, source);
        const aiCompany = structuredData.companyInfo || null;

        // Merge: raw data provides reliable name, AI fills gaps
        const sourceUrl = crawledData.rawData?._sourceUrl || crawledData.rawData?.sourceUrl;
        const mergedCompany: JobCompanyInfo | null = rawCompany || aiCompany
          ? {
              name: rawCompany?.name || aiCompany?.name || '',
              website: this.sanitizeCompanyWebsite(rawCompany?.website || aiCompany?.website, sourceUrl),
              contactEmail: aiCompany?.contactEmail,
              location: rawCompany?.location || aiCompany?.location,
              industry: aiCompany?.industry,
              size: aiCompany?.size,
              logoUrl: crawledData.rawData?.companyLogo || crawledData.rawData?.company_logo || crawledData.rawData?.logo || undefined,
            }
          : null;

        // Store merged companyInfo back into structuredData for persistence
        if (mergedCompany && mergedCompany.name) {
          structuredData.companyInfo = mergedCompany;
        }

        await job.updateProgress(80);
      } else if (type === 'company') {
        // Enrich company
        structuredData = await this.enrichmentService.enrichCompany(crawledData.rawData, source);
        await job.updateProgress(50);

        // Generate and store embedding
        const tempId = `temp-${crawledDataId}`;
        embeddingId = await this.enrichmentService.storeCompanyEmbedding(
          tempId,
          structuredData,
          crawledData.rawData,
          source,
        );
        await job.updateProgress(80);
      } else {
        throw new Error(`Unknown type: ${type}`);
      }

      // Save enriched profile to database
      const enrichedProfile = await this.enrichmentService.saveEnrichedProfile({
        crawledDataId,
        source,
        type,
        structuredData,
        summary: structuredData.summary,
        embeddingId,
      });

      await job.updateProgress(90);

      // Perform entity resolution for profiles and companies
      let unifiedEntityId: string | undefined;
      if (type === 'profile' || type === 'company') {
        try {
          const resolutionResult = await this.entityResolutionService.resolveEntity(enrichedProfile.id);
          if (resolutionResult) {
            unifiedEntityId = resolutionResult.unifiedEntity.id;
            this.logger.debug(
              `Entity resolution: ${resolutionResult.isNew ? 'Created new' : 'Linked to existing'} entity ${unifiedEntityId} (${resolutionResult.matchType}, ${resolutionResult.confidenceScore})`,
            );
          }
        } catch (error) {
          // Log but don't fail the enrichment job if entity resolution fails
          this.logger.warn(`Entity resolution failed for ${enrichedProfile.id}: ${error.message}`);
        }
      }

      // For job posts, resolve company entity
      if (type === 'job_post' && structuredData.companyInfo?.name) {
        try {
          const companyResult = await this.entityResolutionService.resolveCompanyFromJobPost(
            enrichedProfile.id,
            structuredData.companyInfo,
            structuredData,
          );
          if (companyResult) {
            unifiedEntityId = companyResult.unifiedEntity.id;
            this.logger.debug(
              `Company resolution: ${companyResult.isNew ? 'Created new' : 'Linked to existing'} company ${unifiedEntityId} (${companyResult.matchType})`,
            );
          }
        } catch (error) {
          this.logger.warn(`Company resolution failed for job ${enrichedProfile.id}: ${error.message}`);
        }
      }

      await job.updateProgress(100);

      // If triggered by a pipeline run, increment the enriched counter and check for completion
      if (job.data.pipelineRunId) {
        await this.updatePipelineEnrichmentCounter(job.data.pipelineRunId);
      }

      this.logger.log(`Successfully enriched ${source}/${type}: ${crawledDataId}`);

      return {
        success: true,
        enrichedProfileId: enrichedProfile.id,
        unifiedEntityId,
      };
    } catch (error) {
      this.logger.error(
        `Enrichment job ${job.id} failed (attempt ${job.attemptsMade + 1}/${(job.opts?.attempts || 3) + 1}): ${error.message}`,
        error.stack,
      );

      // Re-throw so BullMQ retries with exponential backoff
      throw error;
    }
  }

  /**
   * Process raw page content from the generic crawler via single-pass enrichment.
   * One AI call extracts fields AND classifies/enriches simultaneously.
   */
  private async processRawContent(
    job: Job<EnrichmentJobData>,
    crawledData: any,
  ): Promise<EnrichmentJobResult> {
    const { crawledDataId, source } = job.data;

    // Single AI call: extract + enrich
    const { detectedType, rawFields, structuredData } =
      await this.enrichmentService.enrichFromRawContent(crawledData.rawData, source);
    await job.updateProgress(50);

    // Update crawled_data with extracted fields so entity resolution + display work
    const finalType = detectedType || job.data.type;
    await this.crawledDataService.updateRawData(
      crawledDataId,
      rawFields,
      finalType !== crawledData.type ? finalType : undefined,
    );
    await job.updateProgress(60);

    // Generate and store embedding
    const tempId = `temp-${crawledDataId}`;
    let embeddingId: string;

    if (finalType === 'profile') {
      embeddingId = await this.enrichmentService.storeProfileEmbedding(
        tempId,
        structuredData as any,
        rawFields,
        source,
      );
    } else if (finalType === 'company') {
      embeddingId = await this.enrichmentService.storeCompanyEmbedding(
        tempId,
        structuredData as any,
        rawFields,
        source,
      );
    } else {
      // job_post (default)
      embeddingId = await this.enrichmentService.storeJobEmbedding(
        tempId,
        structuredData as any,
        rawFields,
        source,
      );
    }
    await job.updateProgress(75);

    // For job posts, merge company info from raw + AI
    if (finalType === 'job_post') {
      const rawCompany = this.enrichmentService.extractCompanyFromJobRawData(rawFields, source);
      const aiCompany = (structuredData as any).companyInfo || null;
      const rawSourceUrl = rawFields._sourceUrl || crawledData.rawData?._sourceUrl;

      const mergedCompany: JobCompanyInfo | null = rawCompany || aiCompany
        ? {
            name: rawCompany?.name || aiCompany?.name || '',
            website: this.sanitizeCompanyWebsite(rawCompany?.website || aiCompany?.website, rawSourceUrl),
            contactEmail: aiCompany?.contactEmail,
            location: rawCompany?.location || aiCompany?.location,
            industry: aiCompany?.industry,
            size: aiCompany?.size,
          }
        : null;

      if (mergedCompany && mergedCompany.name) {
        (structuredData as any).companyInfo = mergedCompany;
      }
    }

    // Save enriched profile
    const enrichedProfile = await this.enrichmentService.saveEnrichedProfile({
      crawledDataId,
      source,
      type: finalType,
      structuredData,
      summary: (structuredData as any).summary,
      embeddingId,
    });
    await job.updateProgress(85);

    // Entity resolution
    let unifiedEntityId: string | undefined;
    if (finalType === 'profile' || finalType === 'company') {
      try {
        const resolutionResult = await this.entityResolutionService.resolveEntity(enrichedProfile.id);
        if (resolutionResult) {
          unifiedEntityId = resolutionResult.unifiedEntity.id;
          this.logger.debug(
            `Entity resolution: ${resolutionResult.isNew ? 'Created new' : 'Linked to existing'} entity ${unifiedEntityId}`,
          );
        }
      } catch (error) {
        this.logger.warn(`Entity resolution failed for ${enrichedProfile.id}: ${error.message}`);
      }
    }

    // Company resolution for job posts
    if (finalType === 'job_post' && (structuredData as any).companyInfo?.name) {
      try {
        const companyResult = await this.entityResolutionService.resolveCompanyFromJobPost(
          enrichedProfile.id,
          (structuredData as any).companyInfo,
          structuredData as any,
        );
        if (companyResult) {
          unifiedEntityId = companyResult.unifiedEntity.id;
          this.logger.debug(
            `Company resolution: ${companyResult.isNew ? 'Created new' : 'Linked to existing'} company ${unifiedEntityId}`,
          );
        }
      } catch (error) {
        this.logger.warn(`Company resolution failed for job ${enrichedProfile.id}: ${error.message}`);
      }
    }

    await job.updateProgress(100);

    // Pipeline counter and completion check
    if (job.data.pipelineRunId) {
      await this.updatePipelineEnrichmentCounter(job.data.pipelineRunId);
    }

    this.logger.log(`Successfully enriched (single-pass) ${source}/${finalType}: ${crawledDataId}`);

    return {
      success: true,
      enrichedProfileId: enrichedProfile.id,
      unifiedEntityId,
    };
  }

  /**
   * Increment the enriched counter on a pipeline run and check if all enrichment is complete.
   * Also schedules a delayed safety-check job to handle race conditions where a counter
   * increment is lost due to concurrent read-modify-write.
   */
  private async updatePipelineEnrichmentCounter(pipelineRunId: string): Promise<void> {
    try {
      const run = await this.db.select('pipeline_runs', {
        where: { id: pipelineRunId },
        limit: 1,
      });
      if (!run || run.length === 0) return;

      const enriched = (run[0].items_enriched || 0) + 1;
      const toEnrich = run[0].items_to_enrich || 0;
      const failed = run[0].items_failed || 0;
      const pipelineType = run[0].pipeline_type;

      await this.db.update('pipeline_runs', pipelineRunId, {
        items_enriched: enriched,
      });

      this.logger.log(`Pipeline ${pipelineRunId}: enriched=${enriched}/${toEnrich}, failed=${failed}`);

      if (pipelineType && pipelineType !== 'chain' && toEnrich > 0 && (enriched + failed) >= toEnrich) {
        this.logger.log(
          `Pipeline ${pipelineRunId} enrichment complete: ${enriched}/${toEnrich} enriched, ${failed} failed. Triggering stage advance.`,
        );
        await this.queueService.addJob(
          'pipeline-automation',
          'automation',
          { runId: pipelineRunId, action: 'check_completion' },
          { jobId: `automation-${pipelineRunId}-completion-${Date.now()}` },
        );
      } else if (pipelineType && pipelineType !== 'chain' && toEnrich > 0) {
        // Schedule a delayed safety check to catch race-condition-lost counter increments.
        // If the enrichment queue empties but counters don't add up, this will unstick the pipeline.
        await this.queueService.addJob(
          'pipeline-automation',
          'automation',
          { runId: pipelineRunId, action: 'check_completion' },
          { jobId: `automation-${pipelineRunId}-safety-${enriched}`, delay: 30000 },
        );
      }
    } catch (err) {
      this.logger.warn(`Failed to update pipeline enriched counter: ${err.message}`);
    }
  }

  /**
   * Increment the failed counter on a pipeline run when an enrichment job permanently fails.
   * Also checks if all items are now processed to unblock the pipeline.
   */
  private async updatePipelineFailureCounter(pipelineRunId: string): Promise<void> {
    try {
      const run = await this.db.select('pipeline_runs', {
        where: { id: pipelineRunId },
        limit: 1,
      });
      if (!run || run.length === 0) return;

      const failed = (run[0].items_failed || 0) + 1;
      const enriched = run[0].items_enriched || 0;
      const toEnrich = run[0].items_to_enrich || 0;
      const pipelineType = run[0].pipeline_type;

      await this.db.update('pipeline_runs', pipelineRunId, {
        items_failed: failed,
      });

      this.logger.warn(
        `Pipeline ${pipelineRunId}: enrichment job failed permanently. Failed: ${failed}, Enriched: ${enriched}, ToEnrich: ${toEnrich}`,
      );

      if (pipelineType && pipelineType !== 'chain' && toEnrich > 0 && (enriched + failed) >= toEnrich) {
        this.logger.log(
          `Pipeline ${pipelineRunId} enrichment complete (with failures): ${enriched} enriched, ${failed} failed. Triggering stage advance.`,
        );
        await this.queueService.addJob(
          'pipeline-automation',
          'automation',
          { runId: pipelineRunId, action: 'check_completion' },
          { jobId: `automation-${pipelineRunId}-failure-completion-${Date.now()}` },
        );
      } else if (pipelineType && pipelineType !== 'chain' && toEnrich > 0) {
        // Safety check
        await this.queueService.addJob(
          'pipeline-automation',
          'automation',
          { runId: pipelineRunId, action: 'check_completion' },
          { jobId: `automation-${pipelineRunId}-fail-safety-${failed}`, delay: 30000 },
        );
      }
    } catch (err) {
      this.logger.warn(`Failed to update pipeline failure counter: ${err.message}`);
    }
  }

  /**
   * Add a single enrichment job to the queue
   */
  async queueEnrichment(
    crawledDataId: string,
    source: string,
    type: string,
    pipelineRunId?: string,
  ): Promise<Job<EnrichmentJobData> | null> {
    const jobId = `enrich-${crawledDataId}`;

    // Remove any previously failed job with the same ID so it can be re-queued
    await this.queueService.removeJob(EnrichmentProcessor.QUEUE_NAME, jobId);

    return this.queueService.addJob<EnrichmentJobData>(
      EnrichmentProcessor.QUEUE_NAME,
      'enrich',
      {
        crawledDataId,
        source,
        type,
        pipelineRunId,
      },
      {
        jobId,
      },
    );
  }

  /**
   * Queue multiple crawled data items for enrichment
   */
  async queueBulkEnrichment(
    items: Array<{ id: string; source: string; type: string }>,
  ): Promise<number> {
    if (!this.queueService.isConfigured()) {
      this.logger.warn('Queue service not configured. Cannot queue enrichment jobs.');
      return 0;
    }

    const jobs = items.map((item) => ({
      name: 'enrich',
      data: {
        crawledDataId: item.id,
        source: item.source,
        type: item.type,
      } as EnrichmentJobData,
      opts: {
        jobId: `enrich-${item.id}`,
      },
    }));

    const addedJobs = await this.queueService.addBulk(EnrichmentProcessor.QUEUE_NAME, jobs);
    this.logger.log(`Queued ${addedJobs.length} enrichment jobs`);

    return addedJobs.length;
  }

  /**
   * Queue multiple crawled data items for enrichment, tagged with a pipeline run ID.
   * Used by automation pipelines to track enrichment completion per-run.
   */
  async queueBulkEnrichmentForPipeline(
    items: Array<{ id: string; source: string; type: string }>,
    pipelineRunId: string,
  ): Promise<number> {
    if (!this.queueService.isConfigured()) {
      this.logger.warn('Queue service not configured. Cannot queue enrichment jobs.');
      return 0;
    }

    const jobs = items.map((item) => ({
      name: 'enrich',
      data: {
        crawledDataId: item.id,
        source: item.source,
        type: item.type,
        pipelineRunId,
      } as EnrichmentJobData,
      opts: {
        jobId: `enrich-${item.id}`,
      },
    }));

    const addedJobs = await this.queueService.addBulk(EnrichmentProcessor.QUEUE_NAME, jobs);
    this.logger.log(`Queued ${addedJobs.length} enrichment jobs for pipeline run ${pipelineRunId}`);

    return addedJobs.length;
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  } | null> {
    return this.queueService.getQueueStats(EnrichmentProcessor.QUEUE_NAME);
  }

  /** Known job board domains that should never be used as a company website. */
  private static readonly JOB_BOARD_DOMAINS = new Set([
    'japan-dev.com', 'tokyodev.com', 'remoteok.com', 'weworkremotely.com',
    'arbeitnow.com', 'stackoverflow.com', 'github.com', 'wantedly.com',
    'green-japan.com', 'linkedin.com', 'indeed.com', 'glassdoor.com',
  ]);

  /**
   * Strip company website if it's actually a job board / source domain.
   * Returns the website if valid, or undefined if it matches a known job board.
   */
  private sanitizeCompanyWebsite(website: string | undefined, sourceUrl?: string): string | undefined {
    if (!website) return undefined;
    try {
      const domain = new URL(website).hostname.replace(/^www\./, '');
      if (EnrichmentProcessor.JOB_BOARD_DOMAINS.has(domain)) return undefined;
      // Also check against the specific source URL domain
      if (sourceUrl) {
        const sourceDomain = new URL(sourceUrl).hostname.replace(/^www\./, '');
        if (domain === sourceDomain) return undefined;
      }
    } catch {
      // Invalid URL
      return undefined;
    }
    return website;
  }
}
