import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Job } from 'bullmq';
import { QueueService } from '../../queue/queue.service';
import { OutreachService } from '../services/outreach.service';
import { SesEmailService } from '../services/ses-email.service';

export interface OutreachJobData {
  campaignId: string;
  recipientId: string;
}

export interface OutreachJobResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

@Injectable()
export class OutreachProcessor implements OnModuleInit {
  private readonly logger = new Logger(OutreachProcessor.name);
  static readonly QUEUE_NAME = 'outreach';

  constructor(
    private readonly queueService: QueueService,
    private readonly outreachService: OutreachService,
    private readonly sesEmailService: SesEmailService,
  ) {}

  async onModuleInit() {
    await this.registerWorker();
  }

  private async registerWorker(): Promise<void> {
    if (!this.queueService.isConfigured()) {
      this.logger.warn('Queue service not configured. Outreach processor disabled.');
      return;
    }

    const worker = this.queueService.registerWorker<OutreachJobData, OutreachJobResult>(
      OutreachProcessor.QUEUE_NAME,
      async (job: Job<OutreachJobData>) => this.processJob(job),
      { concurrency: 1 }, // SES rate limiting - send one at a time
    );

    if (worker) {
      this.logger.log('Outreach processor registered and ready');
    }
  }

  private async processJob(job: Job<OutreachJobData>): Promise<OutreachJobResult> {
    const { campaignId, recipientId } = job.data;

    this.logger.debug(`Processing outreach job ${job.id}: campaign=${campaignId}, recipient=${recipientId}`);

    try {
      // Fetch recipient
      const recipients = await this.outreachService.listRecipients(campaignId, { limit: 1000 });
      const recipient = recipients.data.find(r => r.id === recipientId);

      if (!recipient) {
        throw new Error(`Recipient not found: ${recipientId}`);
      }

      // Fetch campaign
      const campaign = await this.outreachService.getCampaign(campaignId);
      if (!campaign) {
        throw new Error(`Campaign not found: ${campaignId}`);
      }

      await job.updateProgress(10);

      // Check blocklist
      if (await this.outreachService.isBlocked(recipient.email)) {
        this.logger.debug(`Recipient ${recipient.email} is blocked, skipping`);
        return { success: true, error: 'Blocked' };
      }

      await job.updateProgress(20);

      // Render personalized email
      // Need raw records for rendering - convert back
      const campaignRaw = {
        template_subject: campaign.templateSubject,
        template_html: campaign.templateHtml,
        template_text: campaign.templateText,
        from_address: campaign.fromAddress,
        from_name: campaign.fromName,
        reply_to: campaign.replyTo,
      };
      const recipientRaw = {
        personalization_data: recipient.personalizationData,
        tracking_token: recipient.trackingToken,
      };

      const rendered = this.outreachService.renderEmailForRecipient(campaignRaw, recipientRaw);

      await job.updateProgress(50);

      // Send via SES
      const result = await this.sesEmailService.sendEmail({
        to: recipient.email,
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text || undefined,
        from: campaign.fromAddress || undefined,
        fromName: campaign.fromName || undefined,
        replyTo: campaign.replyTo || undefined,
        tags: {
          campaign: campaignId,
          recipient: recipientId,
        },
      });

      await job.updateProgress(80);

      if (result.success) {
        // Record sent event
        await this.outreachService.recordEvent(recipient.trackingToken, 'sent', {
          messageId: result.messageId,
        });

        // Increment sent count
        await this.outreachService.incrementCampaignCounter(campaignId, 'sent_count');

        await job.updateProgress(100);

        this.logger.debug(`Email sent to ${recipient.email} (messageId: ${result.messageId})`);

        // Delay for SES rate compliance (100ms)
        await new Promise(resolve => setTimeout(resolve, 100));

        return { success: true, messageId: result.messageId };
      } else {
        // Mark recipient error
        await this.outreachService.markRecipientError(recipientId, result.error || 'Send failed');

        return { success: false, error: result.error };
      }
    } catch (error) {
      this.logger.error(`Outreach job ${job.id} failed: ${error.message}`, error.stack);

      // Mark recipient error
      try {
        await this.outreachService.markRecipientError(recipientId, error.message);
      } catch {
        // Ignore error tracking failure
      }

      return { success: false, error: error.message };
    }
  }

  /**
   * Queue a campaign send batch
   */
  async queueCampaignSend(campaignId: string, limit: number = 100): Promise<number> {
    if (!this.queueService.isConfigured()) {
      this.logger.warn('Queue service not configured. Cannot queue outreach jobs.');
      return 0;
    }

    // Get pending recipients
    const pendingRecipients = await this.outreachService.getPendingRecipients(campaignId, limit);

    if (pendingRecipients.length === 0) {
      this.logger.log(`No pending recipients for campaign ${campaignId}`);
      return 0;
    }

    // Mark recipients as queued
    const recipientIds = pendingRecipients.map((r: any) => r.id);
    await this.outreachService.markRecipientsQueued(recipientIds);

    // Build jobs
    const jobs = pendingRecipients.map((recipient: any) => ({
      name: 'send-email',
      data: {
        campaignId,
        recipientId: recipient.id,
      } as OutreachJobData,
      opts: {
        jobId: `outreach-${campaignId}-${recipient.id}`,
      },
    }));

    const addedJobs = await this.queueService.addBulk(OutreachProcessor.QUEUE_NAME, jobs);

    // Update campaign status to active
    await this.outreachService.updateCampaignStatus(campaignId, 'active');

    this.logger.log(`Queued ${addedJobs.length} outreach jobs for campaign ${campaignId}`);
    return addedJobs.length;
  }

  /**
   * Pause outreach queue
   */
  async pauseQueue(): Promise<void> {
    await this.queueService.pauseQueue(OutreachProcessor.QUEUE_NAME);
  }

  /**
   * Resume outreach queue
   */
  async resumeQueue(): Promise<void> {
    await this.queueService.resumeQueue(OutreachProcessor.QUEUE_NAME);
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
    return this.queueService.getQueueStats(OutreachProcessor.QUEUE_NAME);
  }
}
