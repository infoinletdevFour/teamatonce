import { Injectable, Logger } from '@nestjs/common';

/**
 * SchedulerService - Central service for managing scheduled tasks
 *
 * This service provides a foundation for registering and managing
 * cron jobs throughout the application. Individual jobs are implemented
 * as separate classes that use @Cron decorators.
 *
 * Usage:
 * - Add new job classes to the scheduler module
 * - Use @Cron decorator from @nestjs/schedule for scheduling
 * - This service can be extended to add dynamic job management if needed
 */
@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor() {
    this.logger.log('SchedulerService initialized - Cron jobs are active');
  }

  /**
   * Log when a job starts
   */
  logJobStart(jobName: string): void {
    this.logger.log(`[${jobName}] Job started at ${new Date().toISOString()}`);
  }

  /**
   * Log when a job completes
   */
  logJobComplete(jobName: string, processedCount?: number): void {
    const message = processedCount !== undefined
      ? `[${jobName}] Job completed - Processed ${processedCount} items`
      : `[${jobName}] Job completed`;
    this.logger.log(message);
  }

  /**
   * Log job errors
   */
  logJobError(jobName: string, error: Error): void {
    this.logger.error(`[${jobName}] Job failed: ${error.message}`, error.stack);
  }
}
