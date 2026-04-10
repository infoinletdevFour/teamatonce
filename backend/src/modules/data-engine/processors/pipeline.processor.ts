import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Job } from 'bullmq';
import { QueueService } from '../../queue/queue.service';
import { PipelineService } from '../services/pipeline.service';
import { EnrichmentProcessor } from './enrichment.processor';
import { CrawledDataService } from '../services/crawled-data.service';

export interface PipelineJobData {
  runId: string;
  url: string;
  urlType: 'github' | 'linkedin' | 'website' | 'blog';
  sourceEnrichedProfileId: string;
  autoEnrich: boolean;
}

export interface PipelineJobResult {
  success: boolean;
  url: string;
  error?: string;
}

@Injectable()
export class PipelineProcessor implements OnModuleInit {
  private readonly logger = new Logger(PipelineProcessor.name);
  static readonly QUEUE_NAME = 'pipeline-chain';

  constructor(
    private readonly queueService: QueueService,
    private readonly pipelineService: PipelineService,
    private readonly enrichmentProcessor: EnrichmentProcessor,
    private readonly crawledDataService: CrawledDataService,
  ) {}

  async onModuleInit() {
    await this.registerWorker();
  }

  /**
   * Register the pipeline chain worker
   */
  private async registerWorker(): Promise<void> {
    if (!this.queueService.isConfigured()) {
      this.logger.warn('Queue service not configured. Pipeline processor disabled.');
      return;
    }

    const worker = this.queueService.registerWorker<PipelineJobData, PipelineJobResult>(
      PipelineProcessor.QUEUE_NAME,
      async (job: Job<PipelineJobData>) => this.processJob(job),
      { concurrency: 3 },
    );

    if (worker) {
      this.logger.log('Pipeline processor registered and ready');
    }
  }

  /**
   * Process a single pipeline chain job (crawl a discovered URL)
   */
  private async processJob(job: Job<PipelineJobData>): Promise<PipelineJobResult> {
    const { runId, url, urlType, autoEnrich } = job.data;

    this.logger.log(`Processing pipeline job ${job.id}: ${urlType} - ${url}`);

    try {
      // Execute crawl for this URL
      const crawlResult = await this.pipelineService.executeCrawlForUrl(url, urlType, runId);

      // Always increment exactly one counter per job (atomic to avoid race conditions)
      if (crawlResult.success) {
        await this.pipelineService.incrementRunCounter(runId, 'items_crawled');
      } else {
        await this.pipelineService.incrementRunCounter(runId, 'items_failed');
        this.logger.warn(`Pipeline crawl failed for ${url}: ${crawlResult.error}`);
      }

      // If auto-enrich is enabled and crawl succeeded, queue enrichment
      if (autoEnrich && crawlResult.success) {
        try {
          const crawledItems = await this.crawledDataService.findBySourceUrl(url);
          if (crawledItems) {
            await this.enrichmentProcessor.queueEnrichment(
              crawledItems.id,
              crawledItems.source,
              crawledItems.type,
              runId,
            );
            this.logger.debug(`Queued enrichment for ${url}`);
          }
        } catch (error) {
          this.logger.warn(`Failed to queue enrichment for ${url}: ${error.message}`);
        }
      }

      await job.updateProgress(100);

      // Check if all jobs for this run are done
      await this.checkRunCompletion(runId);

      return { success: crawlResult.success, url, error: crawlResult.error };
    } catch (error) {
      this.logger.error(`Pipeline job ${job.id} failed: ${error.message}`, error.stack);

      // Count unexpected errors as failed items
      await this.pipelineService.incrementRunCounter(runId, 'items_failed');

      // Still check completion even on failure
      await this.checkRunCompletion(runId).catch(() => {});

      return { success: false, url, error: error.message };
    }
  }

  /**
   * Check if all jobs for a pipeline run have completed using BullMQ job tracking.
   * This avoids relying on DB counters which can lose increments under concurrency.
   */
  private async checkRunCompletion(runId: string): Promise<void> {
    try {
      const run = await this.pipelineService.getRunById(runId);
      if (!run || run.status !== 'running') return;

      const totalExpected = run.urlsNew || 0;
      if (totalExpected === 0) return;

      // Check actual BullMQ job states for this run (source of truth)
      const jobCounts = await this.queueService.getJobsForRun(
        PipelineProcessor.QUEUE_NAME,
        runId,
      );

      const totalDone = jobCounts.completed + jobCounts.failed;
      const totalPending = jobCounts.active + jobCounts.waiting;

      this.logger.debug(
        `Run ${runId} progress: ${totalDone}/${totalExpected} done (${jobCounts.completed} ok, ${jobCounts.failed} fail, ${totalPending} pending)`,
      );

      if (totalDone >= totalExpected || (totalPending === 0 && totalDone > 0)) {
        // Sync DB counters from BullMQ actual counts
        await this.pipelineService.updateRunStatus(runId, 'completed', {
          items_crawled: jobCounts.completed,
          items_failed: jobCounts.failed,
        });
        this.logger.log(
          `Pipeline run ${runId} completed: ${jobCounts.completed} crawled, ${jobCounts.failed} failed`,
        );
      }
    } catch (error) {
      this.logger.warn(`Failed to check run completion for ${runId}: ${error.message}`);
    }
  }

  /**
   * Queue all discovered URLs from a pipeline run for processing
   */
  async queueChainRun(
    runId: string,
    urls: Array<{ url: string; type: string; sourceProfileId: string }>,
    autoEnrich: boolean,
  ): Promise<number> {
    if (!this.queueService.isConfigured()) {
      this.logger.warn('Queue service not configured. Cannot queue pipeline jobs.');
      return 0;
    }

    // Update run status to running
    await this.pipelineService.updateRunStatus(runId, 'running');

    const jobs = urls.map((item) => ({
      name: 'chain-crawl',
      data: {
        runId,
        url: item.url,
        urlType: item.type as PipelineJobData['urlType'],
        sourceEnrichedProfileId: item.sourceProfileId,
        autoEnrich,
      } as PipelineJobData,
      opts: {
        jobId: `pipeline-${runId}-${Buffer.from(item.url).toString('base64url').slice(0, 32)}`,
      },
    }));

    const addedJobs = await this.queueService.addBulk(PipelineProcessor.QUEUE_NAME, jobs);
    this.logger.log(`Queued ${addedJobs.length} pipeline chain jobs for run ${runId}`);

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
    return this.queueService.getQueueStats(PipelineProcessor.QUEUE_NAME);
  }
}
