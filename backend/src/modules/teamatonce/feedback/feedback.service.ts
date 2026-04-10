import { Injectable, NotFoundException, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { NotificationType, NotificationPriority } from '../../notifications/dto';
import { CreateFeedbackDto, UpdateFeedbackDto, RespondToFeedbackDto, FeedbackQueryDto } from './dto/feedback.dto';

@Injectable()
export class FeedbackService {
  constructor(
    private readonly db: DatabaseService,
    @Inject(forwardRef(() => NotificationsService))
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Get all feedbacks for a project
   * @param projectId - Project ID
   * @param queryDto - Optional filters
   */
  async getProjectFeedbacks(projectId: string, queryDto?: FeedbackQueryDto) {
    const conditions: any = {
      project_id: projectId,
      deleted_at: null,
    };

    // Apply filters if provided
    if (queryDto?.milestoneId) {
      conditions.milestone_id = queryDto.milestoneId;
    }

    if (queryDto?.feedbackType) {
      conditions.feedback_type = queryDto.feedbackType;
    }

    const feedbacks = await this.db.findMany(
      'project_feedback',
      conditions,
      { orderBy: 'created_at', order: 'desc' }
    );

    // Filter by minimum rating if provided
    let filteredFeedbacks = feedbacks;
    if (queryDto?.minRating) {
      filteredFeedbacks = feedbacks.filter(f => f.rating >= queryDto.minRating);
    }

    // Parse JSON fields and enrich with user data
    return Promise.all(
      filteredFeedbacks.map(async (feedback) => {
        const user = await this.db.getUserById(feedback.client_id);
        return this.parseFeedbackJson(feedback, user);
      })
    );
  }

  /**
   * Get all feedbacks for a milestone
   * @param milestoneId - Milestone ID
   */
  async getMilestoneFeedbacks(milestoneId: string) {
    const feedbacks = await this.db.findMany(
      'project_feedback',
      {
        milestone_id: milestoneId,
        deleted_at: null,
      },
      { orderBy: 'created_at', order: 'desc' }
    );

    // Parse JSON fields and enrich with user data
    return Promise.all(
      feedbacks.map(async (feedback) => {
        const user = await this.db.getUserById(feedback.client_id);
        return this.parseFeedbackJson(feedback, user);
      })
    );
  }

  /**
   * Create new feedback
   * @param clientId - User ID creating the feedback
   * @param dto - Feedback data
   */
  async createFeedback(clientId: string, dto: CreateFeedbackDto) {
    // Verify project exists
    const project = await this.db.findOne('projects', {
      id: dto.projectId,
      deleted_at: null,
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Verify milestone exists if provided
    if (dto.milestoneId) {
      const milestone = await this.db.findOne('project_milestones', {
        id: dto.milestoneId,
      });

      if (!milestone) {
        throw new NotFoundException('Milestone not found');
      }
    }

    const feedbackData = {
      project_id: dto.projectId,
      milestone_id: dto.milestoneId || null,
      client_id: clientId,
      feedback_type: dto.feedbackType,
      rating: dto.rating,
      title: dto.title || null,
      content: dto.content,
      areas_of_improvement: JSON.stringify(dto.areasOfImprovement || []),
      positive_aspects: JSON.stringify(dto.positiveAspects || []),
      attachments: JSON.stringify(dto.attachments || []),
      is_public: dto.isPublic || false,
      response: null,
      responded_at: null,
    };

    const feedback = await this.db.insert('project_feedback', feedbackData);
    const user = await this.db.getUserById(clientId);

    // Send notification to project team about new feedback
    try {
      // Notify the developer/team lead
      const notifyUserIds: string[] = [];
      if (project.team_lead_id) {
        notifyUserIds.push(project.team_lead_id);
      }
      if (project.assigned_company_id) {
        // Get developer company members
        const companyMembers = await this.db.findMany('company_team_members', {
          company_id: project.assigned_company_id,
          status: 'active',
        });
        companyMembers.forEach((member: any) => {
          if (member.user_id && !notifyUserIds.includes(member.user_id) && member.user_id !== clientId) {
            notifyUserIds.push(member.user_id);
          }
        });
      }

      if (notifyUserIds.length > 0) {
        const ratingEmoji = dto.rating >= 4 ? '⭐' : dto.rating >= 3 ? '📝' : '⚠️';
        await this.notificationsService.sendNotification({
          user_ids: notifyUserIds,
          type: NotificationType.UPDATE,
          title: `${ratingEmoji} New Feedback Received`,
          message: `${user?.name || 'A client'} left ${dto.rating}-star feedback on project "${project.name}"${dto.milestoneId ? ' (milestone)' : ''}: "${dto.content.substring(0, 100)}${dto.content.length > 100 ? '...' : ''}"`,
          priority: dto.rating <= 2 ? NotificationPriority.HIGH : NotificationPriority.NORMAL,
          action_url: `/project/${dto.projectId}/feedback`,
          data: {
            projectId: dto.projectId,
            feedbackId: feedback.id,
            milestoneId: dto.milestoneId,
            rating: dto.rating,
            feedbackType: dto.feedbackType,
          },
          send_push: dto.rating <= 2, // Push for low ratings
        });
      }
    } catch (error) {
      console.error('[FeedbackService] Failed to send feedback notification:', error);
    }

    return this.parseFeedbackJson(feedback, user);
  }

  /**
   * Get feedback by ID
   * @param feedbackId - Feedback ID
   */
  async getFeedbackById(feedbackId: string) {
    const feedback = await this.db.findOne('project_feedback', {
      id: feedbackId,
      deleted_at: null,
    });

    if (!feedback) {
      throw new NotFoundException('Feedback not found');
    }

    const user = await this.db.getUserById(feedback.client_id);
    return this.parseFeedbackJson(feedback, user);
  }

  /**
   * Update feedback
   * @param feedbackId - Feedback ID
   * @param clientId - User ID updating the feedback (must be owner)
   * @param dto - Updated feedback data
   */
  async updateFeedback(feedbackId: string, clientId: string, dto: UpdateFeedbackDto) {
    const feedback = await this.getFeedbackById(feedbackId);

    // Verify ownership
    if (feedback.client_id !== clientId) {
      throw new ForbiddenException('You can only update your own feedback');
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (dto.rating !== undefined) updateData.rating = dto.rating;
    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.content !== undefined) updateData.content = dto.content;
    if (dto.areasOfImprovement !== undefined) {
      updateData.areas_of_improvement = JSON.stringify(dto.areasOfImprovement);
    }
    if (dto.positiveAspects !== undefined) {
      updateData.positive_aspects = JSON.stringify(dto.positiveAspects);
    }
    if (dto.isPublic !== undefined) updateData.is_public = dto.isPublic;

    await this.db.update('project_feedback', feedbackId, updateData);
    return this.getFeedbackById(feedbackId);
  }

  /**
   * Delete feedback (soft delete)
   * @param feedbackId - Feedback ID
   * @param clientId - User ID deleting the feedback (must be owner)
   */
  async deleteFeedback(feedbackId: string, clientId: string) {
    const feedback = await this.getFeedbackById(feedbackId);

    // Verify ownership
    if (feedback.client_id !== clientId) {
      throw new ForbiddenException('You can only delete your own feedback');
    }

    await this.db.update('project_feedback', feedbackId, {
      deleted_at: new Date().toISOString(),
    });

    return { success: true, message: 'Feedback deleted successfully' };
  }

  /**
   * Respond to feedback (team/admin only)
   * @param feedbackId - Feedback ID
   * @param responderId - User ID responding to feedback
   * @param dto - Response data
   */
  async respondToFeedback(feedbackId: string, responderId: string, dto: RespondToFeedbackDto) {
    const feedback = await this.getFeedbackById(feedbackId);

    await this.db.update('project_feedback', feedbackId, {
      response: dto.response,
      responded_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // Notify the feedback creator about the response
    try {
      const project = await this.db.findOne('projects', { id: feedback.project_id });
      const responder = await this.db.getUserById(responderId);

      await this.notificationsService.sendNotification({
        user_id: feedback.client_id,
        type: NotificationType.UPDATE,
        title: 'Response to Your Feedback',
        message: `${responder?.name || 'The team'} responded to your feedback on project "${project?.name || 'Unknown'}": "${dto.response.substring(0, 100)}${dto.response.length > 100 ? '...' : ''}"`,
        priority: NotificationPriority.NORMAL,
        action_url: `/project/${feedback.project_id}/feedback`,
        data: {
          projectId: feedback.project_id,
          feedbackId,
          response: dto.response,
        },
        send_push: true,
      });
    } catch (error) {
      console.error('[FeedbackService] Failed to send feedback response notification:', error);
    }

    return this.getFeedbackById(feedbackId);
  }

  /**
   * Get average rating for a project
   * @param projectId - Project ID
   */
  async getAverageProjectRating(projectId: string) {
    const feedbacks = await this.db.findMany('project_feedback', {
      project_id: projectId,
      deleted_at: null,
    });

    if (feedbacks.length === 0) {
      return {
        averageRating: null,
        totalFeedbacks: 0,
        ratingDistribution: {
          1: 0,
          2: 0,
          3: 0,
          4: 0,
          5: 0,
        },
      };
    }

    const totalRating = feedbacks.reduce((sum, feedback) => sum + feedback.rating, 0);
    const averageRating = totalRating / feedbacks.length;

    // Calculate rating distribution
    const ratingDistribution = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    feedbacks.forEach((feedback) => {
      ratingDistribution[feedback.rating]++;
    });

    return {
      averageRating: Number(averageRating.toFixed(2)),
      totalFeedbacks: feedbacks.length,
      ratingDistribution,
    };
  }

  /**
   * Get average rating for a milestone
   * @param milestoneId - Milestone ID
   */
  async getAverageMilestoneRating(milestoneId: string) {
    const feedbacks = await this.db.findMany('project_feedback', {
      milestone_id: milestoneId,
      deleted_at: null,
    });

    if (feedbacks.length === 0) {
      return {
        averageRating: null,
        totalFeedbacks: 0,
      };
    }

    const totalRating = feedbacks.reduce((sum, feedback) => sum + feedback.rating, 0);
    const averageRating = totalRating / feedbacks.length;

    return {
      averageRating: Number(averageRating.toFixed(2)),
      totalFeedbacks: feedbacks.length,
    };
  }

  /**
   * Get feedback statistics for a project
   * @param projectId - Project ID
   */
  async getFeedbackStatistics(projectId: string) {
    const feedbacks = await this.db.findMany('project_feedback', {
      project_id: projectId,
      deleted_at: null,
    });

    const totalFeedbacks = feedbacks.length;
    const publicFeedbacks = feedbacks.filter(f => f.is_public).length;
    const respondedFeedbacks = feedbacks.filter(f => f.response).length;

    // Group by feedback type
    const byType = {
      project: feedbacks.filter(f => f.feedback_type === 'project').length,
      milestone: feedbacks.filter(f => f.feedback_type === 'milestone').length,
      'team-member': feedbacks.filter(f => f.feedback_type === 'team-member').length,
    };

    const ratingStats = await this.getAverageProjectRating(projectId);

    return {
      totalFeedbacks,
      publicFeedbacks,
      respondedFeedbacks,
      responseRate: totalFeedbacks > 0 ? (respondedFeedbacks / totalFeedbacks) * 100 : 0,
      byType,
      ...ratingStats,
    };
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private parseFeedbackJson(feedback: any, user?: any) {
    if (!feedback) return null;

    return {
      ...feedback,
      areas_of_improvement: this.safeJsonParse(feedback.areas_of_improvement),
      positive_aspects: this.safeJsonParse(feedback.positive_aspects),
      attachments: this.safeJsonParse(feedback.attachments),
      user: user ? {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      } : null,
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
}
