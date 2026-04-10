import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
  Inject,
  forwardRef
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType, NotificationPriority } from '../notifications/dto';

// DTOs would be imported here
// import { CreateCompanyDto, UpdateCompanyDto, UpdateCompanySettingsDto } from './dto/company.dto';

/**
 * Company Management Service
 * Handles all operations related to developer companies, including:
 * - CRUD operations for companies
 * - Team member management within companies
 * - Company settings and configuration
 * - Permission and access control
 * - Company statistics and analytics
 */
@Injectable()
export class CompanyService {
  constructor(
    private readonly db: DatabaseService,
    @Inject(forwardRef(() => NotificationsService))
    private readonly notificationsService: NotificationsService,
  ) {}

  // ============================================
  // COMPANY CRUD OPERATIONS
  // ============================================

  /**
   * Create a new developer company
   * Automatically adds the creator as the owner
   *
   * @param userId - User ID from req.user.sub || req.user.userId
   * @param dto - Company creation data
   * @returns Newly created company with owner membership
   */
  async createCompany(userId: string, dto: any) {
    try {

      // Prepare company data with JSON field serialization
      const companyData = {
        owner_id: userId,
        account_type: dto.account_type || 'solo',
        company_name: dto.company_name || null,
        display_name: dto.display_name,
        business_type: dto.business_type || null,
        tax_id: dto.tax_id || null,
        company_size: dto.company_size || '1',
        website: dto.website || null,
        description: dto.description || null,
        logo_url: dto.logo_url || null,
        business_email: dto.business_email || null,
        business_phone: dto.business_phone || null,
        business_address: JSON.stringify(dto.business_address || {}),
        timezone: dto.timezone || 'UTC',
        currency: dto.currency || 'USD',
        language: dto.language || 'en',
        settings: JSON.stringify(dto.settings || {}),
        subscription_tier: dto.subscription_tier || 'free',
        subscription_status: 'active',
        stripe_customer_id: dto.stripe_customer_id || null,
        is_active: true,
        is_verified: false,
        metadata: JSON.stringify(dto.metadata || {})
      };

      // Create the company
      const company = await this.db.insert('developer_companies', companyData);

      // Automatically add the creator as owner to team members
      const ownerMemberData = {
        company_id: company.id,
        user_id: userId,
        name: dto.owner_name || 'Company Owner',
        email: dto.owner_email || dto.business_email || '',
        role: 'owner',
        is_owner: true,
        permissions: JSON.stringify(['all']), // Owner has all permissions
        skills: JSON.stringify(dto.owner_skills || []),
        specializations: JSON.stringify([]),
        technologies: JSON.stringify([]),
        expertise: JSON.stringify([]),
        status: 'active',
        availability: 'available',
        hourly_rate: dto.owner_hourly_rate || null,
        currency: dto.currency || 'USD',
        capacity_hours_per_week: 40,
        joined_date: new Date().toISOString().split('T')[0],
        activated_at: new Date().toISOString(),
        metadata: JSON.stringify({})
      };

      await this.db.insert('company_team_members', ownerMemberData);

      // Send notification about company creation
      try {
        await this.notificationsService.sendNotification({
          user_id: userId,
          type: NotificationType.UPDATE,
          title: '🏢 Company Created Successfully!',
          message: `Your company "${dto.display_name}" has been created. You can now invite team members and start accepting projects.`,
          priority: NotificationPriority.NORMAL,
          action_url: `/company/${company.id}`,
          data: {
            companyId: company.id,
            companyName: dto.display_name,
            accountType: dto.account_type,
          },
          send_push: true,
        });
      } catch (error) {
        console.error('[CompanyService] Failed to send company creation notification:', error);
      }

      // Return company with parsed JSON fields
      return this.parseCompanyJsonFields(company);
    } catch (error) {
      throw new BadRequestException('Failed to create company');
    }
  }

  /**
   * Get all companies for a user (companies they own or are a member of)
   *
   * @param userId - User ID from req.user.sub || req.user.userId
   * @returns Array of companies with user's role information
   */
  async getUserCompanies(userId: string) {
    try {
      // Get all team memberships for this user
      const membershipQuery = this.db.table('company_team_members')
        .where('user_id', '=', userId)
        .where('deleted_at', '=', null);

      const membershipResult = await membershipQuery.execute();
      const memberships = membershipResult.data || [];

      if (memberships.length === 0) {
        return [];
      }

      // Get company IDs from memberships
      const companyIds = memberships.map(m => m.company_id);

      // Fetch all companies
      const companiesQuery = this.db.table('developer_companies')
        .whereIn('id', companyIds)
        .where('deleted_at', '=', null)
        .orderBy('created_at', 'desc');

      const companiesResult = await companiesQuery.execute();
      const companies = companiesResult.data || [];

      // Enrich companies with user's role and membership info
      return companies.map(company => {
        const membership = memberships.find(m => m.company_id === company.id);
        return {
          ...this.parseCompanyJsonFields(company),
          user_role: membership?.role || 'member',
          user_is_owner: membership?.is_owner || false,
          user_status: membership?.status || 'active',
          user_permissions: this.safeJsonParse(membership?.permissions, [])
        };
      });
    } catch (error) {
      throw new BadRequestException('Failed to fetch user companies');
    }
  }

  /**
   * Get company by ID with optional user context
   *
   * @param companyId - Company UUID
   * @param userId - Optional user ID to include permission context
   * @returns Company details with user permissions if userId provided
   */
  async getCompanyById(companyId: string, userId?: string) {
    try {
      const query = this.db.table('developer_companies')
        .where('id', '=', companyId)
        .where('deleted_at', '=', null)
        .limit(1);

      const result = await query.execute();
      const company = result.data?.[0];

      if (!company) {
        throw new NotFoundException(`Company with ID ${companyId} not found`);
      }

      const parsedCompany = this.parseCompanyJsonFields(company);

      // If userId provided, add user context
      if (userId) {
        const membershipQuery = this.db.table('company_team_members')
          .where('company_id', '=', companyId)
          .where('user_id', '=', userId)
          .where('deleted_at', '=', null)
          .limit(1);

        const membershipResult = await membershipQuery.execute();
        const membership = membershipResult.data?.[0];

        if (membership) {
          parsedCompany.user_role = membership.role;
          parsedCompany.user_is_owner = membership.is_owner;
          parsedCompany.user_permissions = this.safeJsonParse(membership.permissions, []);
          parsedCompany.user_status = membership.status;
        }
      }

      return parsedCompany;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to fetch company');
    }
  }

  /**
   * Update company information
   * Only owners and admins can update
   *
   * @param companyId - Company UUID
   * @param userId - User ID from req.user.sub || req.user.userId
   * @param dto - Update data
   * @returns Updated company
   */
  async updateCompany(companyId: string, userId: string, dto: any) {
    try {
      // Verify user has permission (owner or admin)
      await this.verifyCompanyAccess(companyId, userId, ['owner', 'admin']);

      // Prepare update data with JSON serialization where needed
      const updateData: any = {};

      if (dto.company_name !== undefined) updateData.company_name = dto.company_name;
      if (dto.display_name !== undefined) updateData.display_name = dto.display_name;
      if (dto.business_type !== undefined) updateData.business_type = dto.business_type;
      if (dto.tax_id !== undefined) updateData.tax_id = dto.tax_id;
      if (dto.company_size !== undefined) updateData.company_size = dto.company_size;
      if (dto.website !== undefined) updateData.website = dto.website;
      if (dto.description !== undefined) updateData.description = dto.description;
      if (dto.logo_url !== undefined) updateData.logo_url = dto.logo_url;
      if (dto.business_email !== undefined) updateData.business_email = dto.business_email;
      if (dto.business_phone !== undefined) updateData.business_phone = dto.business_phone;
      if (dto.business_address !== undefined) {
        updateData.business_address = JSON.stringify(dto.business_address);
      }
      if (dto.timezone !== undefined) updateData.timezone = dto.timezone;
      if (dto.currency !== undefined) updateData.currency = dto.currency;
      if (dto.language !== undefined) updateData.language = dto.language;
      if (dto.subscription_tier !== undefined) updateData.subscription_tier = dto.subscription_tier;
      if (dto.is_active !== undefined) updateData.is_active = dto.is_active;
      if (dto.is_verified !== undefined) updateData.is_verified = dto.is_verified;
      if (dto.metadata !== undefined) updateData.metadata = JSON.stringify(dto.metadata);

      // Always update timestamp
      updateData.updated_at = new Date().toISOString();

      // Perform update
      const query = /* TODO: replace client call */ this.db.client.table('developer_companies')
        .where('id', '=', companyId);

      await query.update(updateData);

      // Return updated company
      return await this.getCompanyById(companyId, userId);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new BadRequestException('Failed to update company');
    }
  }

  /**
   * Delete company (soft delete)
   * Only owner can delete
   * Checks for active projects before deletion
   *
   * @param companyId - Company UUID
   * @param userId - User ID from req.user.sub || req.user.userId
   * @returns Success message
   */
  async deleteCompany(companyId: string, userId: string) {
    try {
      // Verify user is owner
      await this.verifyCompanyAccess(companyId, userId, ['owner']);

      // Check for active projects
      const projectsQuery = this.db.table('projects')
        .where('company_id', '=', companyId)
        .where('deleted_at', '=', null)
        .where('status', '!=', 'completed');

      const projectsResult = await projectsQuery.execute();
      const activeProjects = projectsResult.data || [];

      if (activeProjects.length > 0) {
        throw new BadRequestException(
          `Cannot delete company. There are ${activeProjects.length} active project(s). Please complete or transfer them first.`
        );
      }

      // Soft delete company
      const updateQuery = /* TODO: replace client call */ this.db.client.table('developer_companies')
        .where('id', '=', companyId);

      await updateQuery.update({
        is_active: false,
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      // Also soft delete all team members
      const membersQuery = /* TODO: replace client call */ this.db.client.table('company_team_members')
        .where('company_id', '=', companyId);

      await membersQuery.update({
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      return {
        success: true,
        message: 'Company deleted successfully',
        companyId
      };
    } catch (error) {
      if (error instanceof NotFoundException ||
          error instanceof ForbiddenException ||
          error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to delete company');
    }
  }

  // ============================================
  // SETTINGS & CONFIGURATION
  // ============================================

  /**
   * Update company settings
   * Only owners and admins can update settings
   *
   * @param companyId - Company UUID
   * @param userId - User ID from req.user.sub || req.user.userId
   * @param dto - Settings update data
   * @returns Updated company with new settings
   */
  async updateCompanySettings(companyId: string, userId: string, dto: any) {
    try {
      // Verify user has permission
      await this.verifyCompanyAccess(companyId, userId, ['owner', 'admin']);

      // Get current company to merge settings
      const company = await this.getCompanyById(companyId, userId);
      const currentSettings = company.settings || {};

      // Merge new settings with existing
      const updatedSettings = {
        ...currentSettings,
        ...dto.settings,
        updated_by: userId,
        updated_at: new Date().toISOString()
      };

      // Update company
      const query = /* TODO: replace client call */ this.db.client.table('developer_companies')
        .where('id', '=', companyId);

      await query.update({
        settings: JSON.stringify(updatedSettings),
        updated_at: new Date().toISOString()
      });

      return await this.getCompanyById(companyId, userId);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new BadRequestException('Failed to update company settings');
    }
  }

  // ============================================
  // STATISTICS & ANALYTICS
  // ============================================

  /**
   * Get company statistics
   * Includes: team member count, active projects, total spending, etc.
   * Supports both client companies (own projects) and seller companies (assigned projects)
   *
   * @param companyId - Company UUID
   * @param userId - User ID from req.user.sub || req.user.userId
   * @returns Company statistics object
   */
  async getCompanyStats(companyId: string, userId: string) {
    try {
      // Verify user has access to this company
      await this.verifyCompanyAccess(companyId, userId);

      // Get company details
      const company = await this.getCompanyById(companyId, userId);

      // Get team member statistics
      const membersQuery = this.db.table('company_team_members')
        .where('company_id', '=', companyId)
        .where('deleted_at', '=', null);

      const membersResult = await membersQuery.execute();
      const members = membersResult.data || [];

      const activeMembers = members.filter(m => m.status === 'active').length;
      const totalMembers = members.length;

      // Get projects owned by this company (client projects)
      const ownedProjectsQuery = this.db.table('projects')
        .where('company_id', '=', companyId)
        .where('deleted_at', '=', null);

      const ownedProjectsResult = await ownedProjectsQuery.execute();
      const ownedProjects = ownedProjectsResult.data || [];

      // Get projects assigned to this company (seller projects)
      const assignedProjectsQuery = this.db.table('projects')
        .where('assigned_company_id', '=', companyId)
        .where('deleted_at', '=', null);

      const assignedProjectsResult = await assignedProjectsQuery.execute();
      const assignedProjects = assignedProjectsResult.data || [];

      // Combine both for total project stats (avoid duplicates)
      const allProjectIds = new Set([
        ...ownedProjects.map(p => p.id),
        ...assignedProjects.map(p => p.id)
      ]);
      const allProjects = [...ownedProjects, ...assignedProjects.filter(p => !ownedProjects.find(op => op.id === p.id))];

      // Active projects = projects that are not completed or cancelled
      const activeProjects = allProjects.filter(p =>
        p.status !== 'completed' && p.status !== 'cancelled'
      ).length;
      const completedProjects = allProjects.filter(p => p.status === 'completed').length;

      // Calculate revenue from completed/approved milestones
      let totalRevenue = 0;
      let monthlyRevenue = 0;
      const currentMonth = new Date();
      currentMonth.setDate(1);
      currentMonth.setHours(0, 0, 0, 0);

      // Get milestones for projects (prefer assigned projects for sellers, owned for clients)
      const projectsForRevenue = assignedProjects.length > 0 ? assignedProjects : ownedProjects;

      for (const project of projectsForRevenue) {
        const milestonesQuery = this.db.table('project_milestones')
          .where('project_id', '=', project.id);

        const milestonesResult = await milestonesQuery.execute();
        const milestones = milestonesResult.data || [];

        for (const milestone of milestones) {
          // Count completed or approved milestones for total revenue
          if (milestone.status === 'completed' || milestone.status === 'approved' || milestone.payment_status === 'paid') {
            const amount = parseFloat(milestone.milestone_amount) || 0;
            totalRevenue += amount;

            // Check if completed this month for monthly revenue
            const completedAt = milestone.completed_at || milestone.updated_at;
            if (completedAt && new Date(completedAt) >= currentMonth) {
              monthlyRevenue += amount;
            }
          }
        }
      }

      // Get team workload statistics
      const totalHoursThisMonth = members.reduce((sum, m) => {
        return sum + (parseFloat(m.hours_this_month) || 0);
      }, 0);

      // Get pending invitations count
      const invitationsQuery = this.db.table('team_invitations')
        .where('company_id', '=', companyId)
        .where('status', '=', 'pending');

      const invitationsResult = await invitationsQuery.execute();
      const pendingInvitations = invitationsResult.data?.length || 0;

      // Calculate on-time delivery rate
      const onTimeProjects = allProjects.filter(p =>
        p.status === 'completed' && p.completed_at && p.deadline &&
        new Date(p.completed_at) <= new Date(p.deadline)
      ).length;
      const onTimeDeliveryRate = completedProjects > 0
        ? Math.round((onTimeProjects / completedProjects) * 100)
        : 0;

      // Calculate average rating from project feedbacks for assigned projects
      // For seller companies: only count feedback FROM clients (not from company team members)
      // This matches the approach used in developer profile page
      let averageRating = 0;
      const projectsToCheckForRating = assignedProjects.length > 0 ? assignedProjects : ownedProjects;

      if (projectsToCheckForRating.length > 0) {
        // Get all team member user IDs to exclude their feedback
        const teamMemberUserIds = new Set(members.map(m => m.user_id).filter(Boolean));

        let totalRating = 0;
        let ratingCount = 0;

        for (const project of projectsToCheckForRating) {
          const feedbacksQuery = this.db.table('project_feedback')
            .where('project_id', '=', project.id)
            .where('deleted_at', '=', null);

          const feedbacksResult = await feedbacksQuery.execute();
          const feedbacks = feedbacksResult.data || [];

          for (const feedback of feedbacks) {
            // Only count feedback from clients (not from company team members)
            // client_id in project_feedback is the reviewer's user ID
            if (feedback.rating && !teamMemberUserIds.has(feedback.client_id)) {
              totalRating += parseFloat(feedback.rating);
              ratingCount++;
            }
          }
        }

        if (ratingCount > 0) {
          averageRating = Math.round((totalRating / ratingCount) * 10) / 10; // Round to 1 decimal
        }
      }

      // Return flat structure matching frontend CompanyStats interface
      return {
        total_members: totalMembers,
        active_members: activeMembers,
        pending_invitations: pendingInvitations,
        active_projects: activeProjects,
        completed_projects: completedProjects,
        total_revenue: totalRevenue,
        monthly_revenue: monthlyRevenue,
        average_rating: averageRating,
        total_hours_worked: totalHoursThisMonth,
        on_time_delivery_rate: onTimeDeliveryRate
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new BadRequestException('Failed to fetch company statistics');
    }
  }

  /**
   * Get company performance metrics
   * Returns metrics calculated from real project and feedback data
   */
  async getPerformanceMetrics(companyId: string, userId: string) {
    try {
      await this.verifyCompanyAccess(companyId, userId);

      // Get all projects assigned to this company
      const assignedProjectsQuery = this.db.table('projects')
        .where('assigned_company_id', '=', companyId)
        .where('deleted_at', '=', null);

      const assignedProjectsResult = await assignedProjectsQuery.execute();
      const projects = assignedProjectsResult.data || [];

      if (projects.length === 0) {
        // Return zeros if no projects yet
        return {
          totalTasks: 0,
          completedTasks: 0,
          inProgressTasks: 0,
          overdueTasks: 0,
          onTimeDelivery: 0,
          codeQuality: 0,
          clientSatisfaction: 0,
          averageRating: 0,
        };
      }

      // Calculate on-time delivery
      const completedProjects = projects.filter(p => p.status === 'completed').length;
      const onTimeProjects = projects.filter(p =>
        p.status === 'completed' && p.completed_at && p.deadline &&
        new Date(p.completed_at) <= new Date(p.deadline)
      ).length;
      const onTimeDelivery = completedProjects > 0
        ? Math.round((onTimeProjects / completedProjects) * 100)
        : 0;

      // Get all tasks for these projects
      const projectIds = projects.map(p => p.id);
      let allTasks = [];
      for (const projectId of projectIds) {
        const tasksQuery = this.db.table('project_tasks')
          .where('project_id', '=', projectId);
        const tasksResult = await tasksQuery.execute();
        allTasks = allTasks.concat(tasksResult.data || []);
      }

      const totalTasks = allTasks.length;
      const completedTasks = allTasks.filter(t => t.status === 'completed' || t.status === 'done').length;
      const inProgressTasks = allTasks.filter(t => t.status === 'in_progress' || t.status === 'in-progress').length;
      const overdueTasks = allTasks.filter(t => {
        if (t.status === 'completed' || t.status === 'done') return false;
        if (!t.due_date) return false;
        return new Date(t.due_date) < new Date();
      }).length;

      // Calculate code quality from task completion rate and bug/issue ratio
      // Higher completion rate = better quality, fewer overdue = better quality
      let codeQuality = 0;
      if (totalTasks > 0) {
        const completionRate = (completedTasks / totalTasks) * 100;
        const onTimeTaskRate = totalTasks > 0 ? ((totalTasks - overdueTasks) / totalTasks) * 100 : 100;
        // Average of completion rate and on-time rate
        codeQuality = Math.round((completionRate * 0.6 + onTimeTaskRate * 0.4));
      }

      // Get feedback/ratings from clients
      let totalRating = 0;
      let ratingCount = 0;

      for (const project of projects) {
        const feedbackQuery = this.db.table('project_feedback')
          .where('project_id', '=', project.id)
          .where('deleted_at', '=', null);

        const feedbackResult = await feedbackQuery.execute();
        const feedbacks = feedbackResult.data || [];

        for (const feedback of feedbacks) {
          if (feedback.rating) {
            const rating = parseFloat(feedback.rating);
            totalRating += rating;
            ratingCount++;
          }
        }
      }

      // Calculate average rating (out of 5) and client satisfaction (as percentage)
      const averageRating = ratingCount > 0 ? Math.round((totalRating / ratingCount) * 10) / 10 : 0;
      const clientSatisfaction = ratingCount > 0 ? Math.round((totalRating / (ratingCount * 5)) * 100) : 0;

      return {
        totalTasks,
        completedTasks,
        inProgressTasks,
        overdueTasks,
        onTimeDelivery,
        codeQuality,
        clientSatisfaction,
        averageRating,
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      console.error('Error fetching performance metrics:', error);
      throw new BadRequestException('Failed to fetch performance metrics');
    }
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  /**
   * Verify user has access to company and optionally check for specific roles
   *
   * @param companyId - Company UUID
   * @param userId - User ID from req.user.sub || req.user.userId
   * @param allowedRoles - Optional array of allowed roles (e.g., ['owner', 'admin'])
   * @throws NotFoundException if company not found
   * @throws ForbiddenException if user doesn't have access or required role
   */
  async verifyCompanyAccess(
    companyId: string,
    userId: string,
    allowedRoles?: string[]
  ): Promise<void> {
    try {
      // Check if company exists
      const companyQuery = this.db.table('developer_companies')
        .where('id', '=', companyId)
        .where('deleted_at', '=', null)
        .limit(1);

      const companyResult = await companyQuery.execute();
      const company = companyResult.data?.[0];

      if (!company) {
        throw new NotFoundException(`Company with ID ${companyId} not found`);
      }

      // Check if user is a member of this company
      const membershipQuery = this.db.table('company_team_members')
        .where('company_id', '=', companyId)
        .where('user_id', '=', userId)
        .where('deleted_at', '=', null)
        .limit(1);

      const membershipResult = await membershipQuery.execute();
      const membership = membershipResult.data?.[0];

      if (!membership) {
        throw new ForbiddenException('You do not have access to this company');
      }

      // Check if user's membership is active
      if (membership.status !== 'active') {
        throw new ForbiddenException(
          `Your membership is ${membership.status}. Contact company administrator.`
        );
      }

      // If specific roles are required, verify user has one of them
      if (allowedRoles && allowedRoles.length > 0) {
        if (!allowedRoles.includes(membership.role)) {
          throw new ForbiddenException(
            `This action requires one of these roles: ${allowedRoles.join(', ')}. Your role: ${membership.role}`
          );
        }
      }
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new BadRequestException('Failed to verify company access');
    }
  }

  /**
   * Get recent activities for a company
   * Returns recent project updates, milestone completions, and team activities
   *
   * @param companyId - Company UUID
   * @param userId - User ID for access control
   * @param limit - Maximum number of activities to return (default: 10)
   * @returns Array of recent activities
   */
  async getRecentActivities(companyId: string, userId: string, limit: number = 10) {
    try {
      // Verify user has access to this company
      await this.verifyCompanyAccess(companyId, userId);

      // Get recent activity logs for this user in company projects
      // Note: activity_logs table doesn't have company_id, so we query by user_id
      const activitiesQuery = this.db.table('activity_logs')
        .where('user_id', '=', userId)
        .orderBy('created_at', 'DESC')
        .limit(limit);

      const activitiesResult = await activitiesQuery.execute();
      let activities = activitiesResult.data || [];

      // If no activity logs exist, create some based on recent milestones and projects
      if (activities.length === 0) {
        activities = await this.generateActivitiesFromData(companyId, limit);
      }

      // Transform activities to camelCase for frontend
      return activities.map(activity => ({
        id: activity.id,
        type: activity.activity_type || activity.type || 'general',
        message: activity.message || activity.description || 'Activity occurred',
        description: activity.description || activity.message,
        timestamp: activity.created_at || activity.timestamp || new Date().toISOString(),
        userId: activity.user_id,
        projectId: activity.project_id,
        metadata: this.safeJsonParse(activity.metadata, {})
      }));
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      console.error('Error fetching recent activities:', error);
      return [];
    }
  }

  /**
   * Generate activities from recent project and milestone data
   * Used when activity_logs table is empty
   *
   * @param companyId - Company UUID
   * @param limit - Maximum number of activities to generate
   * @returns Array of generated activities
   */
  private async generateActivitiesFromData(companyId: string, limit: number) {
    const activities = [];

    // Get recent projects
    const projectsQuery = this.db.table('projects')
      .where('assigned_company_id', '=', companyId)
      .orderBy('created_at', 'DESC')
      .limit(limit);

    const projectsResult = await projectsQuery.execute();
    const projects = projectsResult.data || [];

    for (const project of projects) {
      activities.push({
        id: `project-${project.id}`,
        activity_type: 'project_created',
        message: `Project "${project.name}" was assigned to your company`,
        timestamp: project.created_at,
        user_id: project.client_id,
        project_id: project.id,
        metadata: {}
      });

      // Get recent milestones for this project
      const milestonesQuery = this.db.table('project_milestones')
        .where('project_id', '=', project.id)
        .where('status', '=', 'completed')
        .orderBy('completed_date', 'DESC')
        .limit(2);

      const milestonesResult = await milestonesQuery.execute();
      const milestones = milestonesResult.data || [];

      for (const milestone of milestones) {
        activities.push({
          id: `milestone-${milestone.id}`,
          activity_type: 'milestone_completed',
          message: `Milestone "${milestone.name}" completed in project "${project.name}"`,
          timestamp: milestone.completed_date || milestone.updated_at,
          user_id: milestone.submitted_by,
          project_id: project.id,
          metadata: {}
        });
      }
    }

    // Sort by timestamp and limit
    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  /**
   * Parse JSONB fields from database company record
   * Converts stringified JSON to objects
   *
   * @param company - Raw company record from database
   * @returns Company with parsed JSON fields
   */
  parseCompanyJsonFields(company: any) {
    if (!company) return company;

    return {
      ...company,
      business_address: this.safeJsonParse(company.business_address, {}),
      settings: this.safeJsonParse(company.settings, {}),
      metadata: this.safeJsonParse(company.metadata, {})
    };
  }

  /**
   * Safely parse JSON with fallback
   * Handles already-parsed objects and invalid JSON
   *
   * @param value - Value to parse (string, object, or other)
   * @param fallback - Fallback value if parsing fails
   * @returns Parsed value or fallback
   */
  safeJsonParse(value: any, fallback: any = null) {
    if (!value) return fallback;
    if (typeof value === 'object') return value;

    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }

  // ============================================
  // PROFESSIONAL PROFILE METHODS
  // ============================================

  /**
   * Get company professional profile
   * Returns company data formatted for professional profile display
   */
  async getCompanyProfile(companyId: string): Promise<any> {
    const company = await this.getCompanyById(companyId);

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    // Return company with profile data (all in one table)
    return {
      id: company.id,
      name: company.display_name || company.company_name,
      email: company.business_email,
      phone: company.business_phone,
      title: company.professional_title,
      tagline: company.tagline,
      bio: company.description,
      avatar: company.logo_url,
      coverImage: company.cover_image,
      hourlyRate: company.hourly_rate || 50,
      availability: company.availability || 'available',
      responseTime: company.response_time || 'within 24 hours',
      location: this.formatLocation(company.business_address),
      timezone: company.timezone,
      rating: company.profile_rating || 0,
      totalReviews: company.total_reviews || 0,
      totalEarnings: company.total_earnings || 0,
      completedProjects: company.completed_projects || 0,
      successRate: company.success_rate || 100,
      onTimeDelivery: company.on_time_delivery || 100,
      skills: this.safeJsonParse(company.profile_skills, []),
      languages: this.safeJsonParse(company.profile_languages, []),
      education: this.safeJsonParse(company.profile_education, []),
      certifications: this.safeJsonParse(company.profile_certifications, []),
      experience: this.safeJsonParse(company.profile_experience, []),
      portfolioItems: this.safeJsonParse(company.profile_portfolio, []),
      socialLinks: {
        ...this.safeJsonParse(company.profile_social_links, {}),
        website: company.website
      },
      joinedDate: company.created_at,
      verified: company.profile_verified || company.is_verified || false,
      topRated: company.profile_top_rated || false,
    };
  }

  /**
   * Helper to format location from business_address
   */
  private formatLocation(businessAddress: any): string {
    if (!businessAddress) return '';

    const address = typeof businessAddress === 'string'
      ? this.safeJsonParse(businessAddress, {})
      : businessAddress;

    const parts = [
      address.city,
      address.state,
      address.country
    ].filter(Boolean);

    return parts.join(', ');
  }

  /**
   * Update company professional profile
   * Maps profile fields to company table fields
   */
  async updateCompanyProfile(companyId: string, updateData: any): Promise<any> {
    const company = await this.getCompanyById(companyId);

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    // Map frontend fields to database fields
    const updateFields: any = {};

    if (updateData.name !== undefined) updateFields.display_name = updateData.name;
    if (updateData.email !== undefined) updateFields.business_email = updateData.email;
    if (updateData.phone !== undefined) updateFields.business_phone = updateData.phone;
    if (updateData.title !== undefined) updateFields.professional_title = updateData.title;
    if (updateData.tagline !== undefined) updateFields.tagline = updateData.tagline;
    if (updateData.bio !== undefined) updateFields.description = updateData.bio;
    if (updateData.avatar !== undefined) updateFields.logo_url = updateData.avatar;
    if (updateData.coverImage !== undefined) updateFields.cover_image = updateData.coverImage;
    if (updateData.hourlyRate !== undefined) updateFields.hourly_rate = updateData.hourlyRate;
    if (updateData.availability !== undefined) updateFields.availability = updateData.availability;
    if (updateData.responseTime !== undefined) updateFields.response_time = updateData.responseTime;
    if (updateData.timezone !== undefined) updateFields.timezone = updateData.timezone;

    // Update location (business_address)
    if (updateData.location !== undefined) {
      const currentAddress = this.safeJsonParse(company.business_address, {});
      // Parse location string back to business_address object
      // For simplicity, store as city
      updateFields.business_address = {
        ...currentAddress,
        city: updateData.location
      };
    }

    // Update profile content (JSONB fields) - need to serialize
    if (updateData.skills !== undefined) updateFields.profile_skills = JSON.stringify(updateData.skills);
    if (updateData.languages !== undefined) updateFields.profile_languages = JSON.stringify(updateData.languages);
    if (updateData.education !== undefined) updateFields.profile_education = JSON.stringify(updateData.education);
    if (updateData.certifications !== undefined) updateFields.profile_certifications = JSON.stringify(updateData.certifications);
    if (updateData.experience !== undefined) updateFields.profile_experience = JSON.stringify(updateData.experience);
    if (updateData.portfolioItems !== undefined) updateFields.profile_portfolio = JSON.stringify(updateData.portfolioItems);
    if (updateData.socialLinks !== undefined) updateFields.profile_social_links = JSON.stringify(updateData.socialLinks);

    // Also serialize business_address if it was set
    if (updateFields.business_address !== undefined) {
      updateFields.business_address = JSON.stringify(updateFields.business_address);
    }

    // Update timestamp
    updateFields.updated_at = new Date().toISOString();

    // Update the company using database client
    const query = /* TODO: replace client call */ this.db.client.table('developer_companies')
      .where('id', '=', companyId);

    await query.update(updateFields);

    // Return updated profile
    return this.getCompanyProfile(companyId);
  }

  /**
   * Upload image for company profile
   */
  async uploadProfileImage(
    companyId: string,
    file: Express.Multer.File,
    type: 'cover' | 'avatar' | 'portfolio'
  ): Promise<string> {
    try {
      console.log('[uploadProfileImage] Starting upload:', { companyId, type, fileSize: file.size, mimeType: file.mimetype });

      // Verify company exists
      const company = await this.getCompanyById(companyId);
      if (!company) {
        throw new NotFoundException('Company not found');
      }

      // Validate file type
      const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
      if (!allowedMimeTypes.includes(file.mimetype)) {
        throw new BadRequestException('Invalid file type. Only JPEG, PNG, and WebP are allowed');
      }

      // Validate file size (5MB for cover, 2MB for avatar, 3MB for portfolio)
      const maxSizes = {
        cover: 5 * 1024 * 1024,      // 5MB
        avatar: 2 * 1024 * 1024,     // 2MB
        portfolio: 3 * 1024 * 1024   // 3MB
      };

      if (file.size > maxSizes[type]) {
        throw new BadRequestException(`File size exceeds ${maxSizes[type] / (1024 * 1024)}MB limit for ${type} images`);
      }

      // Upload to storage service
      const bucket = 'company-profiles';
      const fileName = `${companyId}/${type}/${Date.now()}-${file.originalname}`;

      console.log('[uploadProfileImage] Uploading to storage:', { bucket, fileName });

      const uploadResult = await /* TODO: use StorageService */ this.db.uploadFile(
        bucket,
        file.buffer,
        fileName,
        {
          contentType: file.mimetype,
          metadata: {
            companyId,
            type,
            uploadedAt: new Date().toISOString()
          }
        }
      );

      console.log('[uploadProfileImage] Upload result:', uploadResult);

      // The SDK returns a StorageFile object with a url property
      const publicUrl = uploadResult.url;

      if (!publicUrl) {
        throw new BadRequestException('No URL returned from storage upload');
      }

      console.log('[uploadProfileImage] Success! URL:', publicUrl);

      return publicUrl;
    } catch (error) {
      console.error('[uploadProfileImage] Error:', error);
      throw error;
    }
  }

  /**
   * Update profile stats
   * Called when projects complete, payments received, etc.
   */
  async updateProfileStats(companyId: string, stats: {
    totalEarnings?: number;
    completedProjects?: number;
    totalReviews?: number;
    rating?: number;
    successRate?: number;
    onTimeDelivery?: number;
  }): Promise<void> {
    const updateFields: any = {};

    if (stats.totalEarnings !== undefined) updateFields.total_earnings = stats.totalEarnings;
    if (stats.completedProjects !== undefined) updateFields.completed_projects = stats.completedProjects;
    if (stats.totalReviews !== undefined) updateFields.total_reviews = stats.totalReviews;
    if (stats.rating !== undefined) updateFields.profile_rating = stats.rating;
    if (stats.successRate !== undefined) updateFields.success_rate = stats.successRate;
    if (stats.onTimeDelivery !== undefined) updateFields.on_time_delivery = stats.onTimeDelivery;

    if (Object.keys(updateFields).length > 0) {
      updateFields.updated_at = new Date().toISOString();

      const query = /* TODO: replace client call */ this.db.client.table('developer_companies')
        .where('id', '=', companyId);

      await query.update(updateFields);
    }
  }
}
