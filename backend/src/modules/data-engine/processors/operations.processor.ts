import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Job } from 'bullmq';
import { QueueService } from '../../queue/queue.service';
import { EntityResolutionService } from '../services/entity-resolution.service';
import { EntityScoringService } from '../services/entity-scoring.service';

export type OperationType = 'backfill-companies' | 'batch-resolve' | 'batch-score';

export interface OperationJobData {
  type: OperationType;
  params: Record<string, any>;
}

export interface OperationJobResult {
  success: boolean;
  data?: any;
  error?: string;
}

@Injectable()
export class OperationsProcessor implements OnModuleInit {
  private readonly logger = new Logger(OperationsProcessor.name);
  static readonly QUEUE_NAME = 'operations';

  constructor(
    private readonly queueService: QueueService,
    private readonly entityResolutionService: EntityResolutionService,
    private readonly entityScoringService: EntityScoringService,
  ) {}

  async onModuleInit() {
    await this.registerWorker();
  }

  private async registerWorker(): Promise<void> {
    if (!this.queueService.isConfigured()) {
      this.logger.warn('Queue service not configured. Operations processor disabled.');
      return;
    }

    const worker = this.queueService.registerWorker<OperationJobData, OperationJobResult>(
      OperationsProcessor.QUEUE_NAME,
      async (job: Job<OperationJobData>) => this.processJob(job),
      { concurrency: 1 },
    );

    if (worker) {
      this.logger.log('Operations processor registered and ready');
    }
  }

  private async processJob(job: Job<OperationJobData>): Promise<OperationJobResult> {
    const { type, params } = job.data;
    this.logger.log(`Processing operation job ${job.id}: ${type}`);

    try {
      switch (type) {
        case 'backfill-companies':
          return await this.handleBackfillCompanies(job, params);
        case 'batch-resolve':
          return await this.handleBatchResolve(job, params);
        case 'batch-score':
          return await this.handleBatchScore(job, params);
        default:
          throw new Error(`Unknown operation type: ${type}`);
      }
    } catch (error) {
      this.logger.error(`Operation job ${job.id} failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  private async handleBackfillCompanies(
    job: Job<OperationJobData>,
    params: Record<string, any>,
  ): Promise<OperationJobResult> {
    const result = await this.entityResolutionService.backfillCompanies({
      limit: params.limit,
      source: params.source,
      force: params.force,
      onProgress: (p) => job.updateProgress(p),
    });
    return { success: true, data: result };
  }

  private async handleBatchResolve(
    job: Job<OperationJobData>,
    params: Record<string, any>,
  ): Promise<OperationJobResult> {
    const result = await this.entityResolutionService.batchResolve({
      limit: params.limit,
      onProgress: (p) => job.updateProgress(p),
    });
    return { success: true, data: result };
  }

  private async handleBatchScore(
    job: Job<OperationJobData>,
    params: Record<string, any>,
  ): Promise<OperationJobResult> {
    const result = await this.entityScoringService.batchScoreEntities({
      limit: params.limit,
      rescoreOlderThanHours: params.rescoreOlderThanHours,
      onProgress: (p) => job.updateProgress(p),
    });
    return { success: true, data: result };
  }

  async queueOperation(type: OperationType, params: Record<string, any>): Promise<string | null> {
    const job = await this.queueService.addJob<OperationJobData>(
      OperationsProcessor.QUEUE_NAME,
      type,
      { type, params },
    );
    return job?.id || null;
  }
}
