import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { TeamAtOnceGateway } from '../../../websocket/teamatonce.gateway';
import { NotificationsService } from '../../notifications/notifications.service';
import { NotificationType, NotificationPriority } from '../../notifications/dto';
import {
  CreateMilestoneAdjustmentDto,
  ApproveAdjustmentDto,
  RejectAdjustmentDto,
  MilestoneAdjustmentStatus,
  MilestoneAdjustmentResponseDto,
} from './dto/milestone-adjustment.dto';

@Injectable()
export class MilestoneAdjustmentService {
  constructor(
    private readonly db: DatabaseService,
    private readonly gateway: TeamAtOnceGateway,
    private readonly notificationService: NotificationsService,
  ) {}

  /**
   * Create milestone adjustment request (Developer)
   */
  async createAdjustmentRequest(
    dto: CreateMilestoneAdjustmentDto,
    userId: string,
  ): Promise<MilestoneAdjustmentResponseDto> {
    // Verify milestone exists
    const milestone = await this.db.findOne('project_milestones', {
      id: dto.milestoneId,
    });

    if (!milestone) {
      throw new NotFoundException('Milestone not found');
    }

    // Verify user is either project member OR project client
    const project = await this.db.findOne('projects', { id: milestone.project_id });
    const isProjectMember = await this.isProjectMember(userId, milestone.project_id);
    const isProjectClient = project.client_id === userId;

    if (!isProjectMember && !isProjectClient) {
      throw new ForbiddenException('Only project members or project client can request milestone adjustments');
    }

    // Cannot adjust completed or approved milestones
    if (milestone.status === 'completed' || milestone.status === 'approved') {
      throw new BadRequestException('Cannot adjust completed or approved milestones');
    }

    // Check for pending adjustment requests
    const pendingRequest = await this.db.findOne('milestone_adjustment_requests', {
      milestone_id: dto.milestoneId,
      status: MilestoneAdjustmentStatus.PENDING,
    });

    if (pendingRequest) {
      throw new BadRequestException('There is already a pending adjustment request for this milestone');
    }

    // Create adjustment request
    const requestData = {
      milestone_id: dto.milestoneId,
      project_id: milestone.project_id,
      requested_by: userId,
      status: MilestoneAdjustmentStatus.PENDING,
      changes: dto.changes,
      reason: dto.reason,
    };

    const request = await this.db.insert('milestone_adjustment_requests', requestData);

    // Determine who to notify (the OTHER party, not the requester)
    // If client requested, notify project team members
    // If team member requested, notify client
    const isClientRequesting = project.client_id === userId;

    if (isClientRequesting) {
      // Client is requesting - notify all project team members
      const teamMembers = await this.db.findMany('project_members', {
        project_id: milestone.project_id,
      });

      for (const member of teamMembers) {
        await this.notificationService.sendNotification({
          user_id: member.user_id,
          title: 'Client Requested Milestone Adjustment',
          message: `Client requested changes to milestone "${milestone.name}" in project "${project.name}". Reason: ${dto.reason.substring(0, 100)}...`,
          type: NotificationType.UPDATE,
          priority: NotificationPriority.HIGH,
          data: {
            projectId: milestone.project_id,
            milestoneId: dto.milestoneId,
            adjustmentRequestId: request.id,
          },
          action_url: `/projects/${milestone.project_id}/milestones/${dto.milestoneId}`,
        });
      }
    } else {
      // Team member is requesting - notify client
      await this.notificationService.sendNotification({
        user_id: project.client_id,
        title: 'Milestone Adjustment Requested',
        message: `Developer requested changes to milestone "${milestone.name}" in project "${project.name}". Reason: ${dto.reason.substring(0, 100)}...`,
        type: NotificationType.UPDATE,
        priority: NotificationPriority.HIGH,
        data: {
          projectId: milestone.project_id,
          milestoneId: dto.milestoneId,
          adjustmentRequestId: request.id,
        },
        action_url: `/projects/${milestone.project_id}/milestones/${dto.milestoneId}`,
      });
    }

    // Emit WebSocket event
    this.emitAdjustmentEvent(milestone.project_id, 'milestone-adjustment-requested', request, userId);

    return this.mapToResponseDto(request);
  }

  /**
   * Approve adjustment request (Client OR Developer - whoever didn't request)
   */
  async approveAdjustmentRequest(
    requestId: string,
    dto: ApproveAdjustmentDto,
    userId: string,
  ): Promise<MilestoneAdjustmentResponseDto> {
    const request = await this.getAdjustmentRequestRaw(requestId);

    // Verify user is NOT the requester
    if (request.requested_by === userId) {
      throw new ForbiddenException('You cannot approve your own adjustment request');
    }

    // Verify user is either the project client or a team member
    const project = await this.db.findOne('projects', { id: request.project_id });
    const isProjectClient = project.client_id === userId;
    const isProjectMember = await this.isProjectMember(userId, request.project_id);

    if (!isProjectClient && !isProjectMember) {
      throw new ForbiddenException('Only project client or team members can approve adjustment requests');
    }

    // Can only approve pending requests
    if (request.status !== MilestoneAdjustmentStatus.PENDING) {
      throw new BadRequestException('Can only approve pending adjustment requests');
    }

    // Update request status
    const updateData = {
      status: MilestoneAdjustmentStatus.APPROVED,
      reviewed_by: userId,
      reviewed_at: new Date().toISOString(),
      client_response: dto.notes || 'Approved',
      updated_at: new Date().toISOString(),
    };

    const updatedRequest = await this.db.update('milestone_adjustment_requests', requestId, updateData);

    // Apply changes to milestone
    await this.applyChangesToMilestone(request.milestone_id, request.changes);

    // Get milestone for notification
    const milestone = await this.db.findOne('project_milestones', { id: request.milestone_id });

    // Notify requester (whoever requested the adjustment)
    const approverIsClient = project.client_id === userId;
    await this.notificationService.sendNotification({
      user_id: request.requested_by,
      title: 'Milestone Adjustment Approved',
      message: `${approverIsClient ? 'Client' : 'Team member'} approved your adjustment request for milestone "${milestone.name}" in project "${project.name}".`,
      type: NotificationType.ACHIEVEMENT,
      priority: NotificationPriority.HIGH,
      data: {
        projectId: request.project_id,
        milestoneId: request.milestone_id,
        adjustmentRequestId: requestId,
      },
      action_url: `/projects/${request.project_id}/milestones/${request.milestone_id}`,
    });

    // Emit WebSocket event
    this.emitAdjustmentEvent(request.project_id, 'milestone-adjustment-approved', updatedRequest, userId);

    return this.mapToResponseDto(updatedRequest);
  }

  /**
   * Reject adjustment request (Client OR Developer - whoever didn't request)
   */
  async rejectAdjustmentRequest(
    requestId: string,
    dto: RejectAdjustmentDto,
    userId: string,
  ): Promise<MilestoneAdjustmentResponseDto> {
    const request = await this.getAdjustmentRequestRaw(requestId);

    // Verify user is NOT the requester
    if (request.requested_by === userId) {
      throw new ForbiddenException('You cannot reject your own adjustment request');
    }

    // Verify user is either the project client or a team member
    const project = await this.db.findOne('projects', { id: request.project_id });
    const isProjectClient = project.client_id === userId;
    const isProjectMember = await this.isProjectMember(userId, request.project_id);

    if (!isProjectClient && !isProjectMember) {
      throw new ForbiddenException('Only project client or team members can reject adjustment requests');
    }

    // Can only reject pending requests
    if (request.status !== MilestoneAdjustmentStatus.PENDING) {
      throw new BadRequestException('Can only reject pending adjustment requests');
    }

    // Update request status
    const updateData = {
      status: MilestoneAdjustmentStatus.REJECTED,
      reviewed_by: userId,
      reviewed_at: new Date().toISOString(),
      client_response: dto.response,
      updated_at: new Date().toISOString(),
    };

    const updatedRequest = await this.db.update('milestone_adjustment_requests', requestId, updateData);

    // Get milestone for notification
    const milestone = await this.db.findOne('project_milestones', { id: request.milestone_id });

    // Notify requester (whoever requested the adjustment)
    const rejecterIsClient = project.client_id === userId;
    await this.notificationService.sendNotification({
      user_id: request.requested_by,
      title: 'Milestone Adjustment Rejected',
      message: `${rejecterIsClient ? 'Client' : 'Team member'} rejected your adjustment request for milestone "${milestone.name}". Response: ${dto.response.substring(0, 100)}...`,
      type: NotificationType.UPDATE,
      priority: NotificationPriority.HIGH,
      data: {
        projectId: request.project_id,
        milestoneId: request.milestone_id,
        adjustmentRequestId: requestId,
        response: dto.response,
      },
      action_url: `/projects/${request.project_id}/milestones/${request.milestone_id}`,
    });

    // Emit WebSocket event
    this.emitAdjustmentEvent(request.project_id, 'milestone-adjustment-rejected', updatedRequest, userId);

    return this.mapToResponseDto(updatedRequest);
  }

  /**
   * Get adjustment request by ID
   */
  async getAdjustmentRequest(requestId: string, userId: string): Promise<MilestoneAdjustmentResponseDto> {
    const request = await this.getAdjustmentRequestRaw(requestId);

    // Verify user has access
    const project = await this.db.findOne('projects', { id: request.project_id });
    const isClient = project.client_id === userId;
    const isRequester = request.requested_by === userId;
    const isProjectMember = await this.isProjectMember(userId, request.project_id);

    if (!isClient && !isRequester && !isProjectMember) {
      throw new ForbiddenException('You do not have access to this adjustment request');
    }

    return this.mapToResponseDto(request);
  }

  /**
   * Get all adjustment requests for a milestone
   */
  async getAdjustmentRequestsByMilestone(
    milestoneId: string,
    userId: string,
  ): Promise<MilestoneAdjustmentResponseDto[]> {
    // Verify milestone exists
    const milestone = await this.db.findOne('project_milestones', { id: milestoneId });
    if (!milestone) {
      throw new NotFoundException('Milestone not found');
    }

    // Verify user has access
    const project = await this.db.findOne('projects', { id: milestone.project_id });
    const isClient = project.client_id === userId;
    const isProjectMember = await this.isProjectMember(userId, milestone.project_id);

    if (!isClient && !isProjectMember) {
      throw new ForbiddenException('You do not have access to this milestone');
    }

    const requests = await this.db.findMany('milestone_adjustment_requests', {
      milestone_id: milestoneId,
    });

    return requests.map(request => this.mapToResponseDto(request));
  }

  /**
   * Get all adjustment requests for a project
   */
  async getAdjustmentRequestsByProject(
    projectId: string,
    userId: string,
  ): Promise<MilestoneAdjustmentResponseDto[]> {
    // Verify project exists
    const project = await this.db.findOne('projects', { id: projectId });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Verify user has access
    const isClient = project.client_id === userId;
    const isProjectMember = await this.isProjectMember(userId, projectId);

    if (!isClient && !isProjectMember) {
      throw new ForbiddenException('You do not have access to this project');
    }

    const requests = await this.db.findMany('milestone_adjustment_requests', {
      project_id: projectId,
    });

    return requests.map(request => this.mapToResponseDto(request));
  }

  // ============================================
  // PRIVATE HELPER METHODS
  // ============================================

  /**
   * Withdraw adjustment request (Developer)
   */
  async withdrawAdjustmentRequest(requestId: string, userId: string): Promise<void> {
    const request = await this.getAdjustmentRequestRaw(requestId);

    // Verify user is the one who requested
    if (request.requested_by !== userId) {
      throw new ForbiddenException('Only the requester can withdraw this adjustment request');
    }

    // Can only withdraw pending requests
    if (request.status !== MilestoneAdjustmentStatus.PENDING) {
      throw new BadRequestException('Can only withdraw pending adjustment requests');
    }

    // Delete the request
    await this.db.delete('milestone_adjustment_requests', requestId);

    // Emit WebSocket event
    this.gateway.sendToProject(request.project_id, 'milestone-adjustment-withdrawn', {
      adjustmentRequestId: requestId,
      milestoneId: request.milestone_id,
      userId,
      timestamp: new Date().toISOString(),
    });
  }

  // ============================================
  // PRIVATE HELPER METHODS
  // ============================================

  private async getAdjustmentRequestRaw(requestId: string): Promise<any> {
    const request = await this.db.findOne('milestone_adjustment_requests', { id: requestId });
    if (!request) {
      throw new NotFoundException('Adjustment request not found');
    }
    return request;
  }

  private async applyChangesToMilestone(milestoneId: string, changes: any): Promise<void> {
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (changes.name) updateData.name = changes.name;
    if (changes.description) updateData.description = changes.description;
    if (changes.estimatedHours) updateData.estimated_hours = changes.estimatedHours;
    if (changes.milestoneAmount) updateData.milestone_amount = changes.milestoneAmount;
    if (changes.dueDate) updateData.due_date = changes.dueDate;
    if (changes.deliverables) updateData.deliverables = JSON.stringify(changes.deliverables);
    if (changes.acceptanceCriteria) updateData.acceptance_criteria = JSON.stringify(changes.acceptanceCriteria);

    await this.db.update('project_milestones', milestoneId, updateData);
  }

  private async isProjectMember(userId: string, projectId: string): Promise<boolean> {
    const membership = await this.db.findOne('project_members', {
      user_id: userId,
      project_id: projectId,
    });
    return !!membership;
  }

  private emitAdjustmentEvent(projectId: string, eventType: string, requestData: any, userId?: string): void {
    this.gateway.sendToProject(projectId, eventType, {
      request: this.mapToResponseDto(requestData),
      userId,
      timestamp: new Date().toISOString(),
    });
  }



  private mapToResponseDto(request: any): MilestoneAdjustmentResponseDto {
    return {
      id: request.id,
      milestoneId: request.milestone_id,
      projectId: request.project_id,
      requestedBy: request.requested_by,
      status: request.status,
      changes: request.changes,
      reason: request.reason,
      reviewedBy: request.reviewed_by,
      reviewedAt: request.reviewed_at,
      clientResponse: request.client_response,
      createdAt: request.created_at,
      updatedAt: request.updated_at,
    };
  }
}
