import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DatabaseService } from '../database/database.service';
import { EscrowService } from './escrow.service';
import { DisputeService } from './dispute.service';

/**
 * Automated Timeline Management for Escrow System
 *
 * This service handles all automated processes in the escrow workflow:
 * - Auto-approval of milestones after 14-day review period
 * - Escalation of disputes to mediation
 * - Execution of mediation decisions after deadline
 * - Reminder notifications for clients and developers
 *
 * REFACTORED: Now uses DatabaseService QueryBuilder instead of raw SQL
 */
@Injectable()
export class EscrowAutomationService {
  private readonly logger = new Logger(EscrowAutomationService.name);

  constructor(
    private readonly db: DatabaseService,
    private readonly escrowService: EscrowService,
    private readonly disputeService: DisputeService,
  ) {}

  /**
   * AUTO-APPROVE MILESTONES
   *
   * Automatically approve milestones after 14 days of client inactivity.
   * This ensures developers get paid even if clients don't review deliverables.
   *
   * Runs: Every hour
   */
  @Cron(CronExpression.EVERY_HOUR)
  async processAutoApprovals() {
    this.logger.log('Starting auto-approval process...');

    try {
      // Find deliverables that are past their auto-approval deadline
      const now = new Date().toISOString();

      // Get submitted deliverables that are past auto-approval deadline
      const overdueDeliverables = await this.db.findMany(
        'milestone_deliverables',
        {
          review_status: 'submitted',
        },
        {
          orderBy: 'auto_approve_at',
          order: 'asc',
        }
      );

      // Filter to only those past their auto_approve_at date
      const toProcess = (overdueDeliverables || []).filter((d: any) => {
        return d.auto_approve_at && new Date(d.auto_approve_at) <= new Date(now);
      });

      this.logger.log(`Found ${toProcess.length} deliverables to auto-approve`);

      let successCount = 0;
      let failureCount = 0;

      for (const deliverable of toProcess) {
        try {
          // Get milestone and project info
          const milestone = await this.db.findOne('project_milestones', {
            id: deliverable.milestone_id,
          });

          if (!milestone) {
            this.logger.warn(`Milestone not found for deliverable ${deliverable.id}`);
            continue;
          }

          const project = await this.db.findOne('projects', {
            id: milestone.project_id,
          });

          if (!project) {
            this.logger.warn(`Project not found for milestone ${milestone.id}`);
            continue;
          }

          // Get payment if exists
          const payments = await this.db.findMany('payments', {
            milestone_id: deliverable.milestone_id,
            status: 'completed',
          });
          const payment = payments?.[0];

          // Auto-approve and release payment
          await this.escrowService.approveMilestoneAndRelease(
            deliverable.milestone_id,
            project.client_id,
            true, // isAutoApproved
            'Automatically approved after 14-day review period', // reviewNotes
          );

          // Log timeline event
          await this.logTimelineEvent({
            paymentId: payment?.id,
            milestoneId: deliverable.milestone_id,
            eventType: 'auto_approved',
            eventDescription: `Milestone "${milestone.name}" automatically approved after review period`,
            triggeredBy: 'system',
            triggeredByRole: 'system',
            eventData: {
              deliverableId: deliverable.id,
              projectId: project.id,
              autoApproveAt: deliverable.auto_approve_at,
            },
          });

          this.logger.log(
            `Successfully auto-approved deliverable ${deliverable.id} for milestone ${milestone.name}`
          );

          successCount++;
        } catch (error) {
          this.logger.error(
            `Failed to auto-approve deliverable ${deliverable.id}: ${error.message}`,
            error.stack
          );
          failureCount++;
        }
      }

      this.logger.log(
        `Auto-approval process completed: ${successCount} successful, ${failureCount} failed`
      );

      return {
        processed: toProcess.length,
        successful: successCount,
        failed: failureCount,
      };
    } catch (error) {
      this.logger.error(
        `Error in auto-approval process: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * ESCALATE DISPUTES TO MEDIATION
   *
   * Move disputes from negotiation phase to mediation after deadline.
   * This ensures disputes don't remain unresolved indefinitely.
   *
   * Runs: Every 6 hours
   */
  @Cron('0 */6 * * *')
  async escalateDisputesToMediation() {
    this.logger.log('Starting dispute escalation process...');

    try {
      const now = new Date().toISOString();

      // Find disputes past negotiation deadline
      const openDisputes = await this.db.findMany(
        'payment_disputes',
        {
          status: 'open',
        },
        {
          orderBy: 'negotiation_deadline',
          order: 'asc',
        }
      );

      // Filter to only those past their negotiation_deadline
      const overdueDisputes = (openDisputes || []).filter((d: any) => {
        return d.negotiation_deadline && new Date(d.negotiation_deadline) <= new Date(now);
      });

      this.logger.log(`Found ${overdueDisputes.length} disputes to escalate to mediation`);

      let successCount = 0;
      let failureCount = 0;

      for (const dispute of overdueDisputes) {
        try {
          // Get project info
          const project = await this.db.findOne('projects', {
            id: dispute.project_id,
          });

          // Update dispute status to mediation
          const responseDeadline = new Date();
          responseDeadline.setDate(responseDeadline.getDate() + 7);

          await this.db.update('payment_disputes', { id: dispute.id }, {
            status: 'mediation',
            mediation_started_at: new Date().toISOString(),
            response_deadline: responseDeadline.toISOString(),
            updated_at: new Date().toISOString(),
          });

          // Log timeline event
          await this.logTimelineEvent({
            paymentId: dispute.payment_id,
            milestoneId: dispute.milestone_id,
            disputeId: dispute.id,
            eventType: 'dispute_escalated_to_mediation',
            eventDescription: `Dispute escalated to mediation after negotiation period ended`,
            triggeredBy: 'system',
            triggeredByRole: 'system',
            eventData: {
              disputeId: dispute.id,
              disputeReason: dispute.dispute_reason,
              negotiationDeadline: dispute.negotiation_deadline,
            },
          });

          // Notify admins
          await this.notifyAdminsOfMediation(dispute, project);

          this.logger.log(
            `Successfully escalated dispute ${dispute.id} to mediation`
          );

          successCount++;
        } catch (error) {
          this.logger.error(
            `Failed to escalate dispute ${dispute.id}: ${error.message}`,
            error.stack
          );
          failureCount++;
        }
      }

      this.logger.log(
        `Dispute escalation completed: ${successCount} successful, ${failureCount} failed`
      );

      return {
        processed: overdueDisputes.length,
        successful: successCount,
        failed: failureCount,
      };
    } catch (error) {
      this.logger.error(
        `Error in dispute escalation process: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * AUTO-EXECUTE MEDIATION DECISIONS
   *
   * Execute mediation decisions after response deadline has passed.
   * This ensures final decisions are enforced automatically.
   *
   * Runs: Every 6 hours
   */
  @Cron('0 */6 * * *')
  async executeOverdueMediation() {
    this.logger.log('Starting mediation execution process...');

    try {
      const now = new Date().toISOString();

      // Find mediation cases past response deadline with admin decisions
      const mediationDisputes = await this.db.findMany(
        'payment_disputes',
        {
          status: 'mediation',
        },
        {
          orderBy: 'response_deadline',
          order: 'asc',
        }
      );

      // Filter to those past deadline with resolution percentage set
      const overdueMediations = (mediationDisputes || []).filter((d: any) => {
        return (
          d.response_deadline &&
          new Date(d.response_deadline) <= new Date(now) &&
          d.resolution_percentage !== null &&
          d.resolution_percentage !== undefined
        );
      });

      this.logger.log(`Found ${overdueMediations.length} mediations to execute`);

      let successCount = 0;
      let failureCount = 0;

      for (const mediation of overdueMediations) {
        try {
          // Get payment info
          const payment = mediation.payment_id
            ? await this.db.findOne('payments', { id: mediation.payment_id })
            : null;

          // Execute the mediation decision
          await this.disputeService.executeDisputeResolution(mediation.id);

          // Log timeline event
          await this.logTimelineEvent({
            paymentId: mediation.payment_id,
            milestoneId: mediation.milestone_id,
            disputeId: mediation.id,
            eventType: 'mediation_executed',
            eventDescription: `Mediation decision executed: ${mediation.resolution_percentage}% to developer`,
            triggeredBy: 'system',
            triggeredByRole: 'system',
            eventData: {
              disputeId: mediation.id,
              resolutionPercentage: mediation.resolution_percentage,
              responseDeadline: mediation.response_deadline,
              paymentAmount: payment?.amount,
            },
          });

          this.logger.log(
            `Successfully executed mediation ${mediation.id} with ${mediation.resolution_percentage}% resolution`
          );

          successCount++;
        } catch (error) {
          this.logger.error(
            `Failed to execute mediation ${mediation.id}: ${error.message}`,
            error.stack
          );
          failureCount++;
        }
      }

      this.logger.log(
        `Mediation execution completed: ${successCount} successful, ${failureCount} failed`
      );

      return {
        processed: overdueMediations.length,
        successful: successCount,
        failed: failureCount,
      };
    } catch (error) {
      this.logger.error(
        `Error in mediation execution process: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * SEND REMINDER NOTIFICATIONS
   *
   * Proactive reminders to keep workflow moving forward.
   *
   * Runs: Daily at 9 AM
   */
  @Cron('0 9 * * *')
  async sendReminders() {
    this.logger.log('Starting reminder notification process...');

    try {
      let totalReminders = 0;

      // 1. Remind clients about pending reviews (7 days before auto-approval)
      totalReminders += await this.sendPendingReviewReminders();

      // 2. Remind parties about disputes needing response
      totalReminders += await this.sendDisputeReminders();

      // 3. Remind admins about mediation cases
      totalReminders += await this.sendMediationReminders();

      this.logger.log(`Reminder process completed: ${totalReminders} total reminders sent`);

      return { totalReminders };
    } catch (error) {
      this.logger.error(
        `Error in reminder process: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * HELPER: Send pending review reminders
   * Reminds clients 7 days before auto-approval
   */
  private async sendPendingReviewReminders(): Promise<number> {
    try {
      const now = new Date();
      const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const sixDaysFromNow = new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000);

      // Get submitted deliverables
      const deliverables = await this.db.findMany(
        'milestone_deliverables',
        {
          review_status: 'submitted',
        },
        {
          orderBy: 'auto_approve_at',
          order: 'asc',
        }
      );

      // Filter to those auto-approving in 6-7 days
      const pendingReviews = (deliverables || []).filter((d: any) => {
        if (!d.auto_approve_at) return false;
        const approveDate = new Date(d.auto_approve_at);
        return approveDate <= sevenDaysFromNow && approveDate >= sixDaysFromNow;
      });

      let remindersSent = 0;

      for (const review of pendingReviews) {
        const milestone = await this.db.findOne('project_milestones', {
          id: review.milestone_id,
        });

        if (!milestone) continue;

        const project = await this.db.findOne('projects', {
          id: milestone.project_id,
        });

        if (!project) continue;

        await this.sendNotification({
          userId: project.client_id,
          type: 'pending_review_reminder',
          title: 'Milestone Review Needed',
          message: `Your review for milestone "${milestone.name}" in project "${project.name}" will auto-approve in 7 days.`,
          actionUrl: `/company/${project.company_id}/project/${project.id}/milestone-approval`,
          priority: 'HIGH',
        });

        remindersSent++;
      }

      this.logger.log(`Sent ${remindersSent} pending review reminders`);
      return remindersSent;
    } catch (error) {
      this.logger.error(`Error sending pending review reminders: ${error.message}`);
      return 0;
    }
  }

  /**
   * HELPER: Send dispute reminders
   * Reminds parties about disputes approaching deadline
   */
  private async sendDisputeReminders(): Promise<number> {
    try {
      const now = new Date();
      const twoDaysFromNow = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
      const oneDayFromNow = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);

      // Get open disputes
      const disputes = await this.db.findMany(
        'payment_disputes',
        {
          status: 'open',
        },
        {
          orderBy: 'negotiation_deadline',
          order: 'asc',
        }
      );

      // Filter to those with deadline in 1-2 days
      const upcomingDisputes = (disputes || []).filter((d: any) => {
        if (!d.negotiation_deadline) return false;
        const deadline = new Date(d.negotiation_deadline);
        return deadline <= twoDaysFromNow && deadline >= oneDayFromNow;
      });

      let remindersSent = 0;

      for (const dispute of upcomingDisputes) {
        const project = await this.db.findOne('projects', {
          id: dispute.project_id,
        });

        if (!project) continue;

        // Notify client
        await this.sendNotification({
          userId: project.client_id,
          type: 'dispute_reminder',
          title: 'Dispute Needs Resolution',
          message: `Dispute for project "${project.name}" will escalate to mediation in 2 days.`,
          actionUrl: `/company/${project.company_id}/project/${project.id}/payment/dashboard`,
          priority: 'HIGH',
        });

        remindersSent++;
      }

      this.logger.log(`Sent ${remindersSent} dispute reminders`);
      return remindersSent;
    } catch (error) {
      this.logger.error(`Error sending dispute reminders: ${error.message}`);
      return 0;
    }
  }

  /**
   * HELPER: Send mediation reminders to admins
   */
  private async sendMediationReminders(): Promise<number> {
    try {
      // Get mediation cases without assigned admin
      const mediations = await this.db.findMany(
        'payment_disputes',
        {
          status: 'mediation',
        },
        {
          orderBy: 'created_at',
          order: 'desc',
          limit: 10,
        }
      );

      // Filter to unassigned
      const unassignedMediations = (mediations || []).filter(
        (m: any) => !m.mediation_assigned_to
      );

      for (const mediation of unassignedMediations) {
        const project = await this.db.findOne('projects', {
          id: mediation.project_id,
        });

        await this.notifyAdminsOfMediation(mediation, project);
      }

      this.logger.log(`Sent ${unassignedMediations.length} mediation reminders to admins`);
      return unassignedMediations.length;
    } catch (error) {
      this.logger.error(`Error sending mediation reminders: ${error.message}`);
      return 0;
    }
  }

  /**
   * HELPER: Log timeline event for transparency
   */
  private async logTimelineEvent(data: {
    paymentId?: string;
    milestoneId?: string;
    disputeId?: string;
    eventType: string;
    eventDescription: string;
    triggeredBy?: string;
    triggeredByRole?: string;
    eventData?: any;
  }) {
    try {
      await this.db.insert('escrow_timeline_events', {
        payment_id: data.paymentId || null,
        milestone_id: data.milestoneId || null,
        dispute_id: data.disputeId || null,
        event_type: data.eventType,
        event_description: data.eventDescription,
        triggered_by: data.triggeredBy || null,
        triggered_by_role: data.triggeredByRole || 'system',
        event_data: data.eventData || {},
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error(`Failed to log timeline event: ${error.message}`);
      // Don't throw - logging failure shouldn't break the main process
    }
  }

  /**
   * HELPER: Send notification to user
   */
  private async sendNotification(data: {
    userId: string;
    type: string;
    title: string;
    message: string;
    actionUrl?: string;
    priority?: string;
  }) {
    try {
      await this.db.insert('notifications', {
        user_id: data.userId,
        notification_type: data.type,
        title: data.title,
        message: data.message,
        action_url: data.actionUrl || null,
        priority: data.priority || 'NORMAL',
        is_read: false,
        created_at: new Date().toISOString(),
      });

      this.logger.debug(`Notification sent to user ${data.userId}: ${data.title}`);
    } catch (error) {
      this.logger.error(`Failed to send notification: ${error.message}`);
      // Don't throw - notification failure shouldn't break the main process
    }
  }

  /**
   * HELPER: Notify admins about mediation
   */
  private async notifyAdminsOfMediation(dispute: any, project?: any) {
    try {
      this.logger.log(
        `Mediation needed for dispute ${dispute.id} in project ${project?.name || dispute.project_id}`
      );

      // TODO: Implement actual admin notification here
      // This would fetch admin users and send notifications/emails
      // For now, just log it
    } catch (error) {
      this.logger.error(`Failed to notify admins: ${error.message}`);
    }
  }
}
