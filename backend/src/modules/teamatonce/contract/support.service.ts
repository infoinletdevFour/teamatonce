import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { NotificationType, NotificationPriority } from '../../notifications/dto';
import {
  CreateSupportPackageDto,
  UpdateSupportPackageDto,
  CreateProjectSupportDto,
  UpdateProjectSupportDto,
  CreateEnhancementProposalDto,
  UpdateEnhancementProposalDto,
  CreateReportDto,
  UpdateReportDto,
  SupportStatus,
  EnhancementProposalStatus,
  ReportStatus,
} from './dto/support.dto';

@Injectable()
export class SupportService {
  constructor(
    private readonly db: DatabaseService,
    @Inject(forwardRef(() => NotificationsService))
    private readonly notificationsService: NotificationsService,
  ) {}

  // ============================================
  // SUPPORT PACKAGE MANAGEMENT (Global Templates)
  // ============================================

  /**
   * Get all available support packages (templates)
   * These are global package definitions that clients can subscribe to
   */
  async getSupportPackages() {
    // Note: In the schema, support_packages table is project-specific
    // For global templates, you might want a separate table (e.g., support_package_templates)
    // For now, we'll return all active packages as examples
    const packages = await this.db.findMany(
      'support_packages',
      { status: SupportStatus.ACTIVE },
      { orderBy: 'monthly_cost', order: 'asc' }
    );

    return packages.map(p => this.parseSupportPackageJson(p));
  }

  /**
   * Get support package by ID
   */
  async getSupportPackageById(packageId: string) {
    const supportPackage = await this.db.findOne('support_packages', {
      id: packageId,
    });

    if (!supportPackage) {
      throw new NotFoundException('Support package not found');
    }

    return this.parseSupportPackageJson(supportPackage);
  }

  /**
   * Create a support package template (admin only)
   */
  async createSupportPackage(projectId: string, clientId: string, dto: CreateSupportPackageDto) {
    const packageData = {
      project_id: projectId,
      client_id: clientId,
      package_name: dto.packageName,
      package_type: dto.packageType,
      status: SupportStatus.ACTIVE,
      monthly_hours: dto.monthlyHours,
      used_hours: 0,
      response_time_sla: dto.responseTimeSla || null,
      includes_features: dto.includesFeatures ? JSON.stringify(dto.includesFeatures) : JSON.stringify([]),
      monthly_cost: dto.monthlyCost,
      currency: dto.currency || 'USD',
      start_date: new Date().toISOString().split('T')[0], // Current date
      end_date: null,
      renewal_date: null,
      auto_renew: dto.autoRenew !== undefined ? dto.autoRenew : true,
    };

    const supportPackage = await this.db.insert('support_packages', packageData);
    return this.parseSupportPackageJson(supportPackage);
  }

  /**
   * Update support package template
   */
  async updateSupportPackage(packageId: string, dto: UpdateSupportPackageDto) {
    const supportPackage = await this.db.findOne('support_packages', {
      id: packageId,
    });

    if (!supportPackage) {
      throw new NotFoundException('Support package not found');
    }

    const updateData: any = {};

    if (dto.packageName) updateData.package_name = dto.packageName;
    if (dto.packageType) updateData.package_type = dto.packageType;
    if (dto.monthlyHours !== undefined) updateData.monthly_hours = dto.monthlyHours;
    if (dto.responseTimeSla !== undefined) updateData.response_time_sla = dto.responseTimeSla;
    if (dto.includesFeatures) updateData.includes_features = JSON.stringify(dto.includesFeatures);
    if (dto.monthlyCost !== undefined) updateData.monthly_cost = dto.monthlyCost;
    if (dto.autoRenew !== undefined) updateData.auto_renew = dto.autoRenew;
    if (dto.status) updateData.status = dto.status;

    updateData.updated_at = new Date().toISOString();

    await this.db.update('support_packages', packageId, updateData);

    const updatedPackage = await this.db.findOne('support_packages', {
      id: packageId,
    });
    return this.parseSupportPackageJson(updatedPackage);
  }

  /**
   * Delete (soft delete) support package
   */
  async deleteSupportPackage(packageId: string) {
    const supportPackage = await this.db.findOne('support_packages', {
      id: packageId,
    });

    if (!supportPackage) {
      throw new NotFoundException('Support package not found');
    }

    await this.db.update('support_packages', packageId, {
      status: SupportStatus.CANCELLED,
      updated_at: new Date().toISOString(),
    });

    return { success: true, message: 'Support package deleted successfully' };
  }

  // ============================================
  // PROJECT SUPPORT SUBSCRIPTION
  // ============================================

  /**
   * Get active support subscription for a project
   */
  async getProjectSupport(projectId: string) {
    const projectSupport = await this.db.findOne('support_packages', {
      project_id: projectId,
      status: SupportStatus.ACTIVE,
    });

    if (!projectSupport) {
      return null; // No active support for this project
    }

    return this.parseSupportPackageJson(projectSupport);
  }

  /**
   * Subscribe project to a support package
   */
  async createProjectSupport(projectId: string, clientId: string, dto: CreateProjectSupportDto) {
    // Check if project already has active support
    const existingSupport = await this.db.findOne('support_packages', {
      project_id: projectId,
      status: SupportStatus.ACTIVE,
    });

    if (existingSupport) {
      throw new BadRequestException('This project already has an active support plan');
    }

    // Get the package template details
    const packageTemplate = await this.getSupportPackageById(dto.packageId);

    // Calculate renewal date (1 month from start)
    const startDate = new Date(dto.startDate);
    const renewalDate = new Date(startDate);
    renewalDate.setMonth(renewalDate.getMonth() + 1);

    const projectSupportData = {
      project_id: projectId,
      client_id: clientId,
      package_name: packageTemplate.package_name,
      package_type: packageTemplate.package_type,
      status: SupportStatus.ACTIVE,
      monthly_hours: packageTemplate.monthly_hours,
      used_hours: 0,
      response_time_sla: packageTemplate.response_time_sla,
      includes_features: JSON.stringify(packageTemplate.includes_features || []),
      monthly_cost: packageTemplate.monthly_cost,
      currency: packageTemplate.currency,
      start_date: dto.startDate,
      end_date: dto.endDate || null,
      renewal_date: renewalDate.toISOString().split('T')[0],
      auto_renew: true,
    };

    const projectSupport = await this.db.insert('support_packages', projectSupportData);

    // Send notification about new support subscription
    try {
      const project = await this.db.findOne('projects', { id: projectId });
      const notifyUserIds: string[] = [clientId];

      // Also notify team lead
      if (project?.team_lead_id && project.team_lead_id !== clientId) {
        notifyUserIds.push(project.team_lead_id);
      }

      await this.notificationsService.sendNotification({
        user_ids: notifyUserIds,
        type: NotificationType.UPDATE,
        title: '🛡️ Support Plan Activated',
        message: `${packageTemplate.package_name} support plan has been activated for project "${project?.name || 'Unknown'}". Monthly hours: ${packageTemplate.monthly_hours}, Response SLA: ${packageTemplate.response_time_sla || 'Standard'}`,
        priority: NotificationPriority.NORMAL,
        action_url: `/project/${projectId}/support`,
        data: {
          projectId,
          supportId: projectSupport.id,
          packageName: packageTemplate.package_name,
          monthlyHours: packageTemplate.monthly_hours,
          monthlyCost: packageTemplate.monthly_cost,
        },
        send_push: true,
      });
    } catch (error) {
      console.error('[SupportService] Failed to send support activation notification:', error);
    }

    return this.parseSupportPackageJson(projectSupport);
  }

  /**
   * Update project support subscription
   */
  async updateProjectSupport(supportId: string, dto: UpdateProjectSupportDto) {
    const projectSupport = await this.db.findOne('support_packages', {
      id: supportId,
    });

    if (!projectSupport) {
      throw new NotFoundException('Project support subscription not found');
    }

    const updateData: any = {};

    if (dto.usedHours !== undefined) updateData.used_hours = dto.usedHours;
    if (dto.endDate) updateData.end_date = dto.endDate;
    if (dto.renewalDate) updateData.renewal_date = dto.renewalDate;
    if (dto.autoRenew !== undefined) updateData.auto_renew = dto.autoRenew;
    if (dto.status) updateData.status = dto.status;

    updateData.updated_at = new Date().toISOString();

    await this.db.update('support_packages', supportId, updateData);

    const updatedSupport = await this.db.findOne('support_packages', {
      id: supportId,
    });
    return this.parseSupportPackageJson(updatedSupport);
  }

  /**
   * Cancel project support subscription
   */
  async cancelProjectSupport(supportId: string) {
    const projectSupport = await this.db.findOne('support_packages', {
      id: supportId,
    });

    if (!projectSupport) {
      throw new NotFoundException('Project support subscription not found');
    }

    if (projectSupport.status === SupportStatus.CANCELLED) {
      throw new BadRequestException('Support subscription is already cancelled');
    }

    await this.db.update('support_packages', supportId, {
      status: SupportStatus.CANCELLED,
      end_date: new Date().toISOString().split('T')[0],
      auto_renew: false,
      updated_at: new Date().toISOString(),
    });

    // Send notification about support cancellation
    try {
      const project = await this.db.findOne('projects', { id: projectSupport.project_id });
      const notifyUserIds: string[] = [];

      if (projectSupport.client_id) {
        notifyUserIds.push(projectSupport.client_id);
      }
      if (project?.team_lead_id && !notifyUserIds.includes(project.team_lead_id)) {
        notifyUserIds.push(project.team_lead_id);
      }

      if (notifyUserIds.length > 0) {
        await this.notificationsService.sendNotification({
          user_ids: notifyUserIds,
          type: NotificationType.UPDATE,
          title: '⚠️ Support Plan Cancelled',
          message: `The ${projectSupport.package_name} support plan for project "${project?.name || 'Unknown'}" has been cancelled.`,
          priority: NotificationPriority.NORMAL,
          action_url: `/project/${projectSupport.project_id}/support`,
          data: {
            projectId: projectSupport.project_id,
            supportId,
            packageName: projectSupport.package_name,
          },
          send_push: true,
        });
      }
    } catch (error) {
      console.error('[SupportService] Failed to send support cancellation notification:', error);
    }

    const updatedSupport = await this.db.findOne('support_packages', {
      id: supportId,
    });
    return this.parseSupportPackageJson(updatedSupport);
  }

  /**
   * Increment used hours for support package
   */
  async incrementSupportHours(supportId: string, hours: number) {
    const projectSupport = await this.db.findOne('support_packages', {
      id: supportId,
    });

    if (!projectSupport) {
      throw new NotFoundException('Project support subscription not found');
    }

    const currentUsedHours = parseFloat(projectSupport.used_hours || 0);
    const newUsedHours = currentUsedHours + hours;
    const monthlyHours = parseFloat(projectSupport.monthly_hours);

    if (newUsedHours > monthlyHours) {
      console.warn(
        `Support package ${supportId} exceeded monthly hours limit: ${newUsedHours}/${monthlyHours}`,
      );
    }

    await this.db.update('support_packages', supportId, {
      used_hours: newUsedHours,
      updated_at: new Date().toISOString(),
    });

    // Send notification when approaching or exceeding limit
    try {
      const usagePercentage = (newUsedHours / monthlyHours) * 100;

      if (usagePercentage >= 80) {
        const project = await this.db.findOne('projects', { id: projectSupport.project_id });
        const notifyUserIds: string[] = [];

        if (projectSupport.client_id) {
          notifyUserIds.push(projectSupport.client_id);
        }

        if (notifyUserIds.length > 0) {
          const isExceeded = newUsedHours > monthlyHours;
          await this.notificationsService.sendNotification({
            user_ids: notifyUserIds,
            type: NotificationType.REMINDER,
            title: isExceeded ? '🚨 Support Hours Exceeded' : '⏰ Support Hours Running Low',
            message: isExceeded
              ? `You have exceeded your monthly support hours (${newUsedHours.toFixed(1)}/${monthlyHours}h) for project "${project?.name || 'Unknown'}". Additional hours may be charged.`
              : `You have used ${usagePercentage.toFixed(0)}% of your monthly support hours (${newUsedHours.toFixed(1)}/${monthlyHours}h) for project "${project?.name || 'Unknown'}".`,
            priority: isExceeded ? NotificationPriority.HIGH : NotificationPriority.NORMAL,
            action_url: `/project/${projectSupport.project_id}/support`,
            data: {
              projectId: projectSupport.project_id,
              supportId,
              usedHours: newUsedHours,
              monthlyHours,
              usagePercentage,
            },
            send_push: isExceeded,
          });
        }
      }
    } catch (error) {
      console.error('[SupportService] Failed to send support hours notification:', error);
    }

    const updatedSupport = await this.db.findOne('support_packages', {
      id: supportId,
    });
    return this.parseSupportPackageJson(updatedSupport);
  }

  // ============================================
  // ENHANCEMENT PROPOSALS
  // ============================================

  /**
   * Create enhancement proposal for post-project improvements
   */
  async createEnhancementProposal(projectId: string, dto: CreateEnhancementProposalDto) {
    // Note: Schema doesn't have enhancement_proposals table
    // Using support_tickets table with ticket_type: 'enhancement'
    // Or we need to add this to activity logs or a separate table

    const proposalData = {
      project_id: projectId,
      package_id: null, // Not associated with a specific package
      client_id: '', // To be set by controller
      assigned_to: null,
      title: dto.title,
      description: dto.description,
      ticket_type: 'feature_request', // Using existing enum
      priority: dto.priority || 'medium',
      status: 'open', // Will represent PROPOSED status
      estimated_hours: dto.estimatedEffort || null,
      actual_hours: 0,
      tags: dto.tags ? JSON.stringify(dto.tags) : JSON.stringify([]),
      attachments: JSON.stringify([]),
      resolution_notes: dto.potentialImpact || null,
      reported_at: new Date().toISOString(),
      responded_at: null,
      resolved_at: null,
      closed_at: null,
      response_time_minutes: null,
      resolution_time_minutes: null,
    };

    // Store estimated cost and potential impact in tags as workaround
    const tags = dto.tags || [];
    if (dto.estimatedCost) {
      tags.push(`cost:${dto.estimatedCost}`);
    }
    proposalData.tags = JSON.stringify(tags);

    const proposal = await this.db.insert('support_tickets', proposalData);
    return this.parseEnhancementProposalJson(proposal);
  }

  /**
   * Get all enhancement proposals for a project
   */
  async getProjectEnhancementProposals(projectId: string) {
    const proposals = await this.db.findMany(
      'support_tickets',
      {
        project_id: projectId,
        ticket_type: 'feature_request',
      },
      { orderBy: 'created_at', order: 'desc' }
    );

    return proposals.map(p => this.parseEnhancementProposalJson(p));
  }

  /**
   * Update enhancement proposal
   */
  async updateEnhancementProposal(proposalId: string, dto: UpdateEnhancementProposalDto) {
    const proposal = await this.db.findOne('support_tickets', {
      id: proposalId,
    });

    if (!proposal) {
      throw new NotFoundException('Enhancement proposal not found');
    }

    const updateData: any = {};

    if (dto.title) updateData.title = dto.title;
    if (dto.description) updateData.description = dto.description;
    if (dto.estimatedEffort !== undefined) updateData.estimated_hours = dto.estimatedEffort;
    if (dto.priority) updateData.priority = dto.priority;
    if (dto.reviewNotes) updateData.resolution_notes = dto.reviewNotes;

    // Map enhancement status to ticket status
    if (dto.status) {
      const statusMap: Record<string, string> = {
        [EnhancementProposalStatus.PROPOSED]: 'open',
        [EnhancementProposalStatus.UNDER_REVIEW]: 'in_progress',
        [EnhancementProposalStatus.APPROVED]: 'in_progress',
        [EnhancementProposalStatus.REJECTED]: 'closed',
        [EnhancementProposalStatus.IN_PROGRESS]: 'in_progress',
        [EnhancementProposalStatus.COMPLETED]: 'resolved',
      };
      updateData.status = statusMap[dto.status] || 'open';

      if (dto.status === EnhancementProposalStatus.COMPLETED) {
        updateData.resolved_at = new Date().toISOString();
        updateData.closed_at = new Date().toISOString();
      }
    }

    if (dto.approvedBy) {
      updateData.assigned_to = dto.approvedBy;
      updateData.responded_at = new Date().toISOString();
    }

    updateData.updated_at = new Date().toISOString();

    await this.db.update('support_tickets', proposalId, updateData);

    const updatedProposal = await this.db.findOne('support_tickets', {
      id: proposalId,
    });
    return this.parseEnhancementProposalJson(updatedProposal);
  }

  /**
   * Get enhancement proposal by ID
   */
  async getEnhancementProposalById(proposalId: string) {
    const proposal = await this.db.findOne('support_tickets', {
      id: proposalId,
    });

    if (!proposal) {
      throw new NotFoundException('Enhancement proposal not found');
    }

    return this.parseEnhancementProposalJson(proposal);
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private parseSupportPackageJson(supportPackage: any) {
    if (!supportPackage) return null;

    return {
      ...supportPackage,
      includes_features: this.safeJsonParse(supportPackage.includes_features),
    };
  }

  private parseEnhancementProposalJson(proposal: any) {
    if (!proposal) return null;

    // Extract estimated cost from tags
    const tags = this.safeJsonParse(proposal.tags) || [];
    let estimatedCost = null;
    const cleanTags = tags.filter((tag: string) => {
      if (tag.startsWith('cost:')) {
        estimatedCost = parseFloat(tag.split(':')[1]);
        return false;
      }
      return true;
    });

    // Map ticket status back to enhancement status
    const statusMap: Record<string, string> = {
      'open': EnhancementProposalStatus.PROPOSED,
      'in_progress': EnhancementProposalStatus.IN_PROGRESS,
      'resolved': EnhancementProposalStatus.COMPLETED,
      'closed': EnhancementProposalStatus.REJECTED,
    };

    return {
      id: proposal.id,
      project_id: proposal.project_id,
      title: proposal.title,
      description: proposal.description,
      status: statusMap[proposal.status] || EnhancementProposalStatus.PROPOSED,
      estimated_effort: proposal.estimated_hours,
      estimated_cost: estimatedCost,
      potential_impact: proposal.resolution_notes,
      priority: proposal.priority,
      tags: cleanTags,
      review_notes: proposal.resolution_notes,
      approved_by: proposal.assigned_to,
      approved_at: proposal.responded_at,
      created_at: proposal.created_at,
      updated_at: proposal.updated_at,
    };
  }

  private safeJsonParse(value: any) {
    if (!value) return null;
    if (typeof value === 'object') return value;

    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  // ============================================
  // REPORT MANAGEMENT (uses reports table)
  // ============================================

  /**
   * Create a new report for a project
   */
  async createReport(reporterId: string, dto: CreateReportDto) {
    // Determine target_id and target_user_id
    let targetId = dto.targetId;
    let targetUserId = dto.targetUserId || null;
    let metadata = dto.metadata || {};

    // If reporting a project, set both target_id and target_user_id to project owner (client_id)
    if (dto.reportType === 'project') {
      try {
        const project = await this.db.findOne('projects', { id: dto.targetId });
        if (project && project.client_id) {
          // Store original project ID in metadata for reference
          metadata = {
            ...metadata,
            projectId: dto.targetId,
            projectName: project.name,
          };
          // Set both target_id and target_user_id to project creator
          targetId = project.client_id;
          targetUserId = project.client_id;
          console.log(`[SupportService] Project report - set target_id and target_user_id to project client_id: ${targetUserId}`);
        }
      } catch (error) {
        console.error('[SupportService] Failed to get project owner:', error);
      }
    }

    const reportData = {
      reporter_id: reporterId,
      report_type: dto.reportType,
      target_id: targetId,
      target_user_id: targetUserId,
      reason: dto.reason,
      description: dto.description || null,
      evidence_urls: dto.evidenceUrls ? JSON.stringify(dto.evidenceUrls) : JSON.stringify([]),
      status: ReportStatus.PENDING,
      resolution: null,
      resolution_notes: null,
      reviewed_by: null,
      reviewed_at: null,
      metadata: JSON.stringify(metadata),
    };

    const report = await this.db.insert('reports', reportData);

    // Log report creation for admin review
    console.log(`[SupportService] New report created: ${report.id} - Type: ${dto.reportType}, Reason: ${dto.reason}`);

    // Notify all admin users about the new report
    try {
      const allUsers = await this.db.listUsers({ limit: 10000 });
      const adminUsers = (allUsers.users || []).filter(
        (u: any) => u.metadata?.role === 'admin' || u.app_metadata?.role === 'admin'
      );

      if (adminUsers.length > 0) {
        const adminIds = adminUsers.map((u: any) => u.id);
        const reasonLabel = this.getReasonLabel(dto.reason);

        await this.notificationsService.sendNotification({
          user_ids: adminIds,
          type: NotificationType.SYSTEM,
          title: '🚨 New Report Submitted',
          message: `A new ${dto.reportType} report has been submitted. Reason: ${reasonLabel}. Please review it in the admin panel.`,
          priority: NotificationPriority.HIGH,
          action_url: `/admin/reports/${report.id}`,
          data: {
            reportId: report.id,
            reportType: dto.reportType,
            reason: dto.reason,
          },
        });

        console.log(`[SupportService] Notified ${adminIds.length} admin(s) about new report`);
      }
    } catch (notifyError) {
      console.error('[SupportService] Failed to notify admins about new report:', notifyError);
      // Don't fail the report creation if notification fails
    }

    return this.parseReportJson(report);
  }

  /**
   * Get all reports for a target (project, user, etc.)
   */
  async getReportsByTarget(targetId: string, filters?: { status?: string; reason?: string }) {
    const whereClause: any = { target_id: targetId };

    if (filters?.status) {
      whereClause.status = filters.status;
    }
    if (filters?.reason) {
      whereClause.reason = filters.reason;
    }

    const reports = await this.db.findMany(
      'reports',
      whereClause,
      { orderBy: 'created_at', order: 'desc' }
    );

    return reports.map((r: any) => this.parseReportJson(r));
  }

  /**
   * Get all reports (for admin)
   */
  async getAllReports(filters?: { status?: string; reportType?: string; reason?: string }) {
    const whereClause: any = {};

    if (filters?.status) {
      whereClause.status = filters.status;
    }
    if (filters?.reportType) {
      whereClause.report_type = filters.reportType;
    }
    if (filters?.reason) {
      whereClause.reason = filters.reason;
    }

    const reports = await this.db.findMany(
      'reports',
      whereClause,
      { orderBy: 'created_at', order: 'desc' }
    );

    return reports.map((r: any) => this.parseReportJson(r));
  }

  /**
   * Get report by ID
   */
  async getReportById(reportId: string) {
    const report = await this.db.findOne('reports', { id: reportId });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    return this.parseReportJson(report);
  }

  /**
   * Update report (admin review)
   */
  async updateReport(reportId: string, reviewerId: string, dto: UpdateReportDto) {
    const report = await this.db.findOne('reports', { id: reportId });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    const updateData: any = {};

    if (dto.status) {
      updateData.status = dto.status;
      updateData.reviewed_by = reviewerId;
      updateData.reviewed_at = new Date().toISOString();
    }
    if (dto.resolution) updateData.resolution = dto.resolution;
    if (dto.resolutionNotes) updateData.resolution_notes = dto.resolutionNotes;

    updateData.updated_at = new Date().toISOString();

    await this.db.update('reports', reportId, updateData);

    // Send notification to reporter
    try {
      if (dto.status && dto.status !== report.status) {
        await this.notificationsService.sendNotification({
          user_ids: [report.reporter_id],
          type: NotificationType.UPDATE,
          title: '📋 Report Updated',
          message: `Your report has been reviewed. Status: ${dto.status}${dto.resolution ? `, Resolution: ${dto.resolution}` : ''}`,
          priority: NotificationPriority.NORMAL,
          action_url: `/admin/reports/${reportId}`,
          data: {
            reportId,
            oldStatus: report.status,
            newStatus: dto.status,
            resolution: dto.resolution,
          },
          send_push: dto.status === ReportStatus.RESOLVED,
        });
      }
    } catch (error) {
      console.error('[SupportService] Failed to send report update notification:', error);
    }

    const updatedReport = await this.db.findOne('reports', { id: reportId });
    return this.parseReportJson(updatedReport);
  }

  /**
   * Delete report
   */
  async deleteReport(reportId: string) {
    const report = await this.db.findOne('reports', { id: reportId });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    await this.db.delete('reports', reportId);

    return { success: true, message: 'Report deleted successfully' };
  }

  /**
   * Get reports submitted by a user
   */
  async getUserReports(userId: string) {
    const reports = await this.db.findMany(
      'reports',
      { reporter_id: userId },
      { orderBy: 'created_at', order: 'desc' }
    );

    return reports.map((r: any) => this.parseReportJson(r));
  }

  /**
   * Get reports filed against a user (where they are the target)
   * Only returns resolved reports so users can see warnings/actions taken
   */
  async getReportsAgainstUser(userId: string) {
    const reports = await this.db.findMany(
      'reports',
      { target_user_id: userId, status: 'resolved' },
      { orderBy: 'created_at', order: 'desc' }
    );

    // Filter to only show reports with user_warned or user_banned resolution
    // Users shouldn't see reports that were dismissed or had no action
    const relevantReports = reports.filter((r: any) =>
      r.resolution === 'user_warned' || r.resolution === 'user_banned'
    );

    return relevantReports.map((r: any) => this.parseReportJson(r));
  }

  private parseReportJson(report: any) {
    if (!report) return null;

    return {
      ...report,
      evidence_urls: this.safeJsonParse(report.evidence_urls) || [],
      metadata: this.safeJsonParse(report.metadata) || {},
    };
  }

  private getReasonLabel(reason: string): string {
    const labels: Record<string, string> = {
      spam: 'Spam',
      inappropriate: 'Inappropriate Content',
      fraud: 'Fraudulent Activity',
      harassment: 'Harassment',
      other: 'Policy Violation',
    };
    return labels[reason] || reason;
  }
}
