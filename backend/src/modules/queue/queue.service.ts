import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Queue, Worker, Job, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';

export interface JobData {
  type: string;
  payload: Record<string, any>;
}

export interface JobResult {
  success: boolean;
  data?: any;
  error?: string;
}

@Injectable()
export class QueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(QueueService.name);
  private connection: IORedis | null = null;
  private queues: Map<string, Queue> = new Map();
  private workers: Map<string, Worker> = new Map();
  private queueEvents: Map<string, QueueEvents> = new Map();

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    await this.initializeConnection();
  }

  async onModuleDestroy() {
    // Close all workers
    for (const [name, worker] of this.workers) {
      this.logger.log(`Closing worker: ${name}`);
      await worker.close();
    }

    // Close all queue events
    for (const [name, events] of this.queueEvents) {
      await events.close();
    }

    // Close all queues
    for (const [name, queue] of this.queues) {
      this.logger.log(`Closing queue: ${name}`);
      await queue.close();
    }

    // Close Redis connection
    if (this.connection) {
      this.connection.disconnect();
    }
  }

  private async initializeConnection(): Promise<void> {
    const host = this.configService.get<string>('REDIS_HOST');
    const port = this.configService.get<number>('REDIS_PORT') || 6379;
    const password = this.configService.get<string>('REDIS_PASSWORD');

    if (!host) {
      this.logger.warn('Redis not configured. Queue service will be disabled.');
      return;
    }

    try {
      this.connection = new IORedis({
        host,
        port,
        password: password || undefined,
        maxRetriesPerRequest: null, // Required for BullMQ
      });

      this.connection.on('connect', () => {
        this.logger.log('======================================');
        this.logger.log('====== REDIS CONNECTED =============');
        this.logger.log('======================================');
        this.logger.log(`Connected to Redis at ${host}:${port}`);
      });

      this.connection.on('error', (error) => {
        this.logger.error(`Redis error: ${error.message}`);
      });

      // Test connection
      await this.connection.ping();
      this.logger.log('Redis connection established for BullMQ');
    } catch (error) {
      this.logger.error('======================================');
      this.logger.error('====== REDIS CONNECTION FAILED ======');
      this.logger.error('======================================');
      this.logger.error(`Failed to connect to Redis: ${error.message}`);
      this.connection = null;
    }
  }

  /**
   * Get or create a queue
   */
  getQueue(name: string): Queue | null {
    if (!this.connection) {
      this.logger.warn('Redis not connected. Cannot get queue.');
      return null;
    }

    if (!this.queues.has(name)) {
      const queue = new Queue(name, {
        connection: this.connection,
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
          removeOnComplete: {
            count: 100, // Keep last 100 completed jobs
          },
          removeOnFail: {
            count: 50, // Keep last 50 failed jobs
          },
        },
      });
      this.queues.set(name, queue);
      this.logger.log(`Created queue: ${name}`);
    }

    return this.queues.get(name)!;
  }

  /**
   * Add a job to a queue
   */
  async addJob<T = any>(
    queueName: string,
    jobName: string,
    data: T,
    options?: {
      delay?: number;
      priority?: number;
      attempts?: number;
      jobId?: string;
    },
  ): Promise<Job<T> | null> {
    const queue = this.getQueue(queueName);
    if (!queue) {
      this.logger.warn(`Cannot add job to queue ${queueName}: Redis not connected`);
      return null;
    }

    try {
      const job = await queue.add(jobName, data, {
        delay: options?.delay,
        priority: options?.priority,
        attempts: options?.attempts,
        jobId: options?.jobId,
      });

      this.logger.debug(`Added job ${job.id} to queue ${queueName}`);
      return job;
    } catch (error) {
      this.logger.error(`Failed to add job to queue ${queueName}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Add a bulk of jobs to a queue
   */
  async addBulk<T = any>(
    queueName: string,
    jobs: Array<{ name: string; data: T; opts?: any }>,
  ): Promise<Job<T>[]> {
    const queue = this.getQueue(queueName);
    if (!queue) {
      this.logger.warn(`Cannot add bulk jobs to queue ${queueName}: Redis not connected`);
      return [];
    }

    try {
      const addedJobs = await queue.addBulk(jobs);
      this.logger.debug(`Added ${addedJobs.length} jobs to queue ${queueName}`);
      return addedJobs;
    } catch (error) {
      this.logger.error(`Failed to add bulk jobs to queue ${queueName}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Register a worker for a queue
   */
  registerWorker<T = any, R = any>(
    queueName: string,
    processor: (job: Job<T>) => Promise<R>,
    options?: {
      concurrency?: number;
    },
  ): Worker<T, R> | null {
    if (!this.connection) {
      this.logger.warn('Redis not connected. Cannot register worker.');
      return null;
    }

    if (this.workers.has(queueName)) {
      this.logger.warn(`Worker for queue ${queueName} already exists`);
      return this.workers.get(queueName) as Worker<T, R>;
    }

    const worker = new Worker<T, R>(queueName, processor, {
      connection: this.connection,
      concurrency: options?.concurrency || 1,
      lockDuration: 120_000, // 2 minutes — enough for OpenAI API calls
      stalledInterval: 60_000, // Check for stalled jobs every 60s
    });

    worker.on('completed', (job) => {
      this.logger.debug(`Job ${job.id} completed in queue ${queueName}`);
    });

    worker.on('failed', (job, error) => {
      this.logger.error(`Job ${job?.id} failed in queue ${queueName}: ${error.message}`);
    });

    worker.on('stalled', (jobId) => {
      this.logger.warn(`Job ${jobId} stalled in queue ${queueName} — will be retried`);
    });

    worker.on('error', (error) => {
      this.logger.error(`Worker error in queue ${queueName}: ${error.message}`);
    });

    this.workers.set(queueName, worker);
    this.logger.log(`Registered worker for queue: ${queueName}`);

    return worker;
  }

  /**
   * Get job status, progress, and result in one call
   */
  async getJobStatus(queueName: string, jobId: string): Promise<{
    status: string;
    progress: any;
    result: any;
    failedReason: string | null;
  } | null> {
    const job = await this.getJob(queueName, jobId);
    if (!job) return null;

    const state = await job.getState();
    return {
      status: state,
      progress: job.progress,
      result: job.returnvalue,
      failedReason: job.failedReason || null,
    };
  }

  /**
   * Get job by ID
   */
  async getJob<T = any>(queueName: string, jobId: string): Promise<Job<T> | null> {
    const queue = this.getQueue(queueName);
    if (!queue) return null;

    try {
      const job = await queue.getJob(jobId);
      return job || null;
    } catch (error) {
      this.logger.error(`Failed to get job ${jobId}: ${error.message}`);
      return null;
    }
  }

  /**
   * Remove a job by ID (e.g. to allow re-queuing a failed job)
   */
  async removeJob(queueName: string, jobId: string): Promise<boolean> {
    const queue = this.getQueue(queueName);
    if (!queue) return false;

    try {
      const job = await queue.getJob(jobId);
      if (job) {
        await job.remove();
        return true;
      }
      return false;
    } catch (error) {
      this.logger.debug(`Could not remove job ${jobId}: ${error.message}`);
      return false;
    }
  }

  /**
   * Get queue stats
   */
  async getQueueStats(queueName: string): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  } | null> {
    const queue = this.getQueue(queueName);
    if (!queue) return null;

    try {
      const [waiting, active, completed, failed, delayed] = await Promise.all([
        queue.getWaitingCount(),
        queue.getActiveCount(),
        queue.getCompletedCount(),
        queue.getFailedCount(),
        queue.getDelayedCount(),
      ]);

      return { waiting, active, completed, failed, delayed };
    } catch (error) {
      this.logger.error(`Failed to get queue stats: ${error.message}`);
      return null;
    }
  }

  /**
   * Pause a queue
   */
  async pauseQueue(queueName: string): Promise<void> {
    const queue = this.getQueue(queueName);
    if (!queue) return;

    await queue.pause();
    this.logger.log(`Paused queue: ${queueName}`);
  }

  /**
   * Resume a queue
   */
  async resumeQueue(queueName: string): Promise<void> {
    const queue = this.getQueue(queueName);
    if (!queue) return;

    await queue.resume();
    this.logger.log(`Resumed queue: ${queueName}`);
  }

  /**
   * Clean old jobs from queue
   */
  async cleanQueue(
    queueName: string,
    grace: number = 24 * 60 * 60 * 1000,
    status: 'completed' | 'failed' | 'delayed' | 'wait' | 'active' = 'completed',
  ): Promise<string[]> {
    const queue = this.getQueue(queueName);
    if (!queue) return [];

    try {
      const removed = await queue.clean(grace, 1000, status);
      this.logger.log(`Cleaned ${removed.length} ${status} jobs from queue ${queueName}`);
      return removed;
    } catch (error) {
      this.logger.error(`Failed to clean queue: ${error.message}`);
      return [];
    }
  }

  /**
   * Get jobs from a queue filtered by job data field
   */
  async getJobsForRun<T = any>(
    queueName: string,
    runId: string,
  ): Promise<{ completed: number; failed: number; active: number; waiting: number }> {
    const queue = this.getQueue(queueName);
    if (!queue) return { completed: 0, failed: 0, active: 0, waiting: 0 };

    try {
      const [completedJobs, failedJobs, activeJobs, waitingJobs] = await Promise.all([
        queue.getJobs(['completed'], 0, 200),
        queue.getJobs(['failed'], 0, 200),
        queue.getJobs(['active'], 0, 200),
        queue.getJobs(['wait'], 0, 200),
      ]);

      const matchRun = (job: Job) => job?.data?.runId === runId;

      return {
        completed: completedJobs.filter(matchRun).length,
        failed: failedJobs.filter(matchRun).length,
        active: activeJobs.filter(matchRun).length,
        waiting: waitingJobs.filter(matchRun).length,
      };
    } catch (error) {
      this.logger.error(`Failed to get jobs for run ${runId}: ${error.message}`);
      return { completed: 0, failed: 0, active: 0, waiting: 0 };
    }
  }

  /**
   * Check if Redis/BullMQ is configured
   */
  isConfigured(): boolean {
    return this.connection !== null;
  }

  /**
   * Get health status
   */
  async getHealthStatus(): Promise<{
    status: 'healthy' | 'unhealthy' | 'disabled';
    configured: boolean;
    queues?: string[];
    error?: string;
  }> {
    if (!this.connection) {
      return {
        status: 'disabled',
        configured: false,
        error: 'Redis not configured',
      };
    }

    try {
      await this.connection.ping();
      return {
        status: 'healthy',
        configured: true,
        queues: Array.from(this.queues.keys()),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        configured: true,
        error: error.message,
      };
    }
  }
}
