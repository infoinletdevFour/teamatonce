import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType, NotificationPriority } from '../notifications/dto';
import { UpdateMemberDto, WorkloadUpdateDto, MemberFilterDto, TeamMemberStatus } from './dto/company-member.dto';

@Injectable()
export class CompanyMemberService {
  constructor(
    private readonly db: DatabaseService,
    @Inject(forwardRef(() => NotificationsService))
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Get all company members with optional filtering
   * @param companyId - Company UUID
   * @param userId - Current user's database ID (for permission check)
   * @param filters - Optional filters
   */
  async getCompanyMembers(companyId: string, userId: string, filters?: MemberFilterDto) {
    try {
      // Verify user has access to this company
      await this.verifyMemberAccess(companyId, userId, 'view');

      const query = this.db.table('company_team_members')
        .where('company_id', '=', companyId)
        .where('deleted_at', '=', null);

      // Apply filters
      if (filters?.role) {
        query.where('role', '=', filters.role);
      }

      if (filters?.status) {
        query.where('status', '=', filters.status);
      }

      if (filters?.availability) {
        query.where('availability', '=', filters.availability);
      }

      if (filters?.is_online !== undefined) {
        query.where('is_online', '=', filters.is_online);
      }

      // Search across name, email, and title
      if (filters?.search) {
        const searchTerm = `%${filters.search}%`;
        // Note: This is a simplified search, ideally we'd use OR conditions
        // For now, search by name
        query.where('name', 'ILIKE', searchTerm);
      }

      // Order by name
      query.orderBy('name', 'asc');

      const result = await query.execute();
      const members = result.data || [];

      // Parse JSON fields and enrich with user data from database
      const enrichedMembers = await Promise.all(
        members.map(async (member) => {
          const parsedMember = this.parseMemberJsonFields(member);

          // Fetch fresh user data from database if user_id exists
          if (member.user_id) {
            try {
              const userResponse: any = await this.db.getUserById(member.user_id);
              const user = userResponse?.user || userResponse;

              if (user) {
                // Populate user object in response (matching frontend CompanyMember type)
                parsedMember.user = {
                  id: user.id,
                  name: user.name || user.fullName || parsedMember.name,
                  email: user.email || parsedMember.email,
                  avatar: user.avatar_url || user.avatarUrl || parsedMember.avatar_url,
                };

                // Also update root-level fields for backward compatibility
                parsedMember.name = parsedMember.user.name;
                parsedMember.email = parsedMember.user.email;
                if (parsedMember.user.avatar) {
                  parsedMember.avatar_url = parsedMember.user.avatar;
                }
              } else {
                // Fall back to stored data
                parsedMember.user = {
                  id: member.user_id,
                  name: parsedMember.name,
                  email: parsedMember.email,
                  avatar: parsedMember.avatar_url,
                };
              }
            } catch (error) {
              console.error(`[CompanyMemberService] Failed to fetch user ${member.user_id}:`, error);
              // Fall back to stored data
              parsedMember.user = {
                id: member.user_id,
                name: parsedMember.name,
                email: parsedMember.email,
                avatar: parsedMember.avatar_url,
              };
            }
          }

          return parsedMember;
        })
      );

      return enrichedMembers;
    } catch (error) {
      if (error instanceof ForbiddenException || error instanceof NotFoundException) {
        throw error;
      }
      console.error('[CompanyMemberService] Error fetching company members:', error);
      throw new BadRequestException('Failed to fetch company members');
    }
  }

  /**
   * Get a single company member by ID
   * @param companyId - Company UUID
   * @param memberId - Member UUID
   */
  async getCompanyMember(companyId: string, memberId: string) {
    try {
      const query = this.db.table('company_team_members')
        .where('id', '=', memberId)
        .where('company_id', '=', companyId)
        .where('deleted_at', '=', null)
        .limit(1);

      const result = await query.execute();
      const member = result.data?.[0];

      if (!member) {
        throw new NotFoundException(`Team member with ID ${memberId} not found in this company`);
      }

      // Get project assignments for this member
      const assignmentsQuery = this.db.table('team_member_project_assignments')
        .where('team_member_id', '=', memberId)
        .where('company_id', '=', companyId)
        .where('is_active', '=', true);

      const assignmentsResult = await assignmentsQuery.execute();
      const assignments = assignmentsResult.data || [];

      // Get project details for assignments
      const projectIds = assignments.map(a => a.project_id);
      let projects = [];

      if (projectIds.length > 0) {
        const projectsQuery = this.db.table('projects')
          .whereIn('id', projectIds);
        const projectsResult = await projectsQuery.execute();
        projects = projectsResult.data || [];
      }

      // Parse JSON fields
      const parsedMember = this.parseMemberJsonFields(member);

      // Fetch fresh user data from database if user_id exists
      if (member.user_id) {
        try {
          const userResponse: any = await this.db.getUserById(member.user_id);
          const user = userResponse?.user || userResponse;

          if (user) {
            // Populate user object in response (matching frontend CompanyMember type)
            parsedMember.user = {
              id: user.id,
              name: user.name || user.fullName || parsedMember.name,
              email: user.email || parsedMember.email,
              avatar: user.avatar_url || user.avatarUrl || parsedMember.avatar_url,
            };

            // Also update root-level fields for backward compatibility
            parsedMember.name = parsedMember.user.name;
            parsedMember.email = parsedMember.user.email;
            if (parsedMember.user.avatar) {
              parsedMember.avatar_url = parsedMember.user.avatar;
            }
          } else {
            // Fall back to stored data
            parsedMember.user = {
              id: member.user_id,
              name: parsedMember.name,
              email: parsedMember.email,
              avatar: parsedMember.avatar_url,
            };
          }
        } catch (error) {
          console.error(`[CompanyMemberService] Failed to fetch user ${member.user_id}:`, error);
          // Fall back to stored data
          parsedMember.user = {
            id: member.user_id,
            name: parsedMember.name,
            email: parsedMember.email,
            avatar: parsedMember.avatar_url,
          };
        }
      }

      // Enrich assignments with project info
      const enrichedAssignments = assignments.map(assignment => {
        const project = projects.find(p => p.id === assignment.project_id);
        return {
          ...assignment,
          project: project ? {
            id: project.id,
            name: project.name,
            status: project.status,
            project_type: project.project_type
          } : null
        };
      });

      return {
        ...parsedMember,
        assignments: enrichedAssignments,
        active_projects_count: assignments.length
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('[CompanyMemberService] Error fetching company member:', error);
      throw new BadRequestException('Failed to fetch company member');
    }
  }

  /**
   * Update a company team member
   * @param companyId - Company UUID
   * @param memberId - Member UUID
   * @param userId - Current user's database ID
   * @param data - Update data
   */
  async updateMember(companyId: string, memberId: string, userId: string, data: UpdateMemberDto) {
    try {
      // Verify user has permission to update members (owner or admin)
      await this.verifyMemberAccess(companyId, userId, 'manage');

      // Verify member exists
      const member = await this.getCompanyMember(companyId, memberId);

      // Prevent changing owner status
      if (member.is_owner && data.role && data.role !== 'owner') {
        throw new BadRequestException('Cannot change the role of the company owner');
      }

      // Prepare update data with JSON serialization
      const updateData: any = {};

      if (data.name !== undefined) updateData.name = data.name;
      if (data.email !== undefined) updateData.email = data.email;
      if (data.avatar_url !== undefined) updateData.avatar_url = data.avatar_url;
      if (data.title !== undefined) updateData.title = data.title;
      if (data.bio !== undefined) updateData.bio = data.bio;
      if (data.role !== undefined) updateData.role = data.role;
      if (data.permissions !== undefined) updateData.permissions = JSON.stringify(data.permissions);
      if (data.skills !== undefined) updateData.skills = JSON.stringify(data.skills);
      if (data.specializations !== undefined) updateData.specializations = JSON.stringify(data.specializations);
      if (data.technologies !== undefined) updateData.technologies = JSON.stringify(data.technologies);
      if (data.expertise !== undefined) updateData.expertise = JSON.stringify(data.expertise);
      if (data.experience_years !== undefined) updateData.experience_years = data.experience_years;
      if (data.hourly_rate !== undefined) updateData.hourly_rate = data.hourly_rate;
      if (data.currency !== undefined) updateData.currency = data.currency;
      if (data.availability !== undefined) updateData.availability = data.availability;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.capacity_hours_per_week !== undefined) updateData.capacity_hours_per_week = data.capacity_hours_per_week;
      if (data.phone !== undefined) updateData.phone = data.phone;
      if (data.location !== undefined) updateData.location = data.location;
      if (data.timezone !== undefined) updateData.timezone = data.timezone;
      if (data.social_links !== undefined) updateData.social_links = JSON.stringify(data.social_links);
      if (data.rating !== undefined) updateData.rating = data.rating;
      if (data.on_time_delivery_rate !== undefined) updateData.on_time_delivery_rate = data.on_time_delivery_rate;
      if (data.metadata !== undefined) updateData.metadata = JSON.stringify(data.metadata);

      // Add updated_at timestamp
      updateData.updated_at = new Date().toISOString();

      const query = /* TODO: replace client call */ this.db.client.table('company_team_members')
        .where('id', '=', memberId)
        .where('company_id', '=', companyId);

      await query.update(updateData);

      // Send notification if role changed
      try {
        if (data.role && data.role !== member.role && member.user_id) {
          const company = await this.db.findOne('companies', { id: companyId });
          await this.notificationsService.sendNotification({
            user_id: member.user_id,
            type: NotificationType.UPDATE,
            title: '👔 Role Updated',
            message: `Your role in "${company?.name || 'the company'}" has been changed from ${member.role} to ${data.role}.`,
            priority: NotificationPriority.NORMAL,
            action_url: `/company/${companyId}/team`,
            data: {
              companyId,
              memberId,
              oldRole: member.role,
              newRole: data.role,
            },
            send_push: true,
          });
        }

        // Send notification if status changed
        if (data.status && data.status !== member.status && member.user_id) {
          const company = await this.db.findOne('companies', { id: companyId });
          await this.notificationsService.sendNotification({
            user_id: member.user_id,
            type: NotificationType.UPDATE,
            title: data.status === 'active' ? '✅ Account Activated' : '⚠️ Status Changed',
            message: `Your status in "${company?.name || 'the company'}" has been changed to ${data.status}.`,
            priority: NotificationPriority.NORMAL,
            action_url: `/company/${companyId}/team`,
            data: {
              companyId,
              memberId,
              oldStatus: member.status,
              newStatus: data.status,
            },
            send_push: true,
          });
        }
      } catch (error) {
        console.error('[CompanyMemberService] Failed to send member update notification:', error);
      }

      // Return updated member
      return await this.getCompanyMember(companyId, memberId);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException || error instanceof BadRequestException) {
        throw error;
      }
      console.error('[CompanyMemberService] Error updating member:', error);
      throw new BadRequestException('Failed to update team member');
    }
  }

  /**
   * Remove a member from the company (soft delete)
   * @param companyId - Company UUID
   * @param memberId - Member UUID
   * @param userId - Current user's database ID
   */
  async removeMember(companyId: string, memberId: string, userId: string) {
    try {
      // Verify user has permission to remove members (owner or admin)
      await this.verifyMemberAccess(companyId, userId, 'manage');

      // Verify member exists
      const member = await this.getCompanyMember(companyId, memberId);

      // Cannot remove the owner
      if (member.is_owner) {
        throw new BadRequestException('Cannot remove the company owner');
      }

      // Check if member has active project assignments
      const assignmentsQuery = this.db.table('team_member_project_assignments')
        .where('team_member_id', '=', memberId)
        .where('company_id', '=', companyId)
        .where('is_active', '=', true);

      const assignmentsResult = await assignmentsQuery.execute();
      const activeAssignments = assignmentsResult.data || [];

      if (activeAssignments.length > 0) {
        throw new BadRequestException(
          `Cannot remove team member. They have ${activeAssignments.length} active project assignment(s). Please remove them from projects first.`
        );
      }

      // Soft delete by setting deleted_at and deactivated_at
      const query = /* TODO: replace client call */ this.db.client.table('company_team_members')
        .where('id', '=', memberId)
        .where('company_id', '=', companyId);

      await query.update({
        deleted_at: new Date().toISOString(),
        deactivated_at: new Date().toISOString(),
        status: 'inactive',
        updated_at: new Date().toISOString()
      });

      // Send notification to removed member
      try {
        if (member.user_id) {
          const company = await this.db.findOne('companies', { id: companyId });
          await this.notificationsService.sendNotification({
            user_id: member.user_id,
            type: NotificationType.UPDATE,
            title: '🚪 Removed from Company',
            message: `You have been removed from "${company?.name || 'the company'}". If you believe this was a mistake, please contact the company administrator.`,
            priority: NotificationPriority.HIGH,
            action_url: '/dashboard',
            data: {
              companyId,
              memberId,
              companyName: company?.name,
            },
            send_push: true,
            send_email: true,
          });
        }
      } catch (error) {
        console.error('[CompanyMemberService] Failed to send member removal notification:', error);
      }

      return { message: 'Team member removed successfully', id: memberId };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException || error instanceof BadRequestException) {
        throw error;
      }
      console.error('[CompanyMemberService] Error removing member:', error);
      throw new BadRequestException('Failed to remove team member');
    }
  }

  /**
   * Get current user's membership in a company
   * @param companyId - Company UUID
   * @param userId - Current user's database ID
   */
  async getCurrentUserMembership(companyId: string, userId: string) {
    try {
      const query = this.db.table('company_team_members')
        .where('company_id', '=', companyId)
        .where('user_id', '=', userId)
        .where('deleted_at', '=', null)
        .limit(1);

      const result = await query.execute();
      const member = result.data?.[0];

      if (!member) {
        throw new NotFoundException(`You are not a member of this company`);
      }

      const parsedMember = this.parseMemberJsonFields(member);

      // Fetch fresh user data from database if user_id exists
      if (member.user_id) {
        try {
          const userResponse: any = await this.db.getUserById(member.user_id);
          const user = userResponse?.user || userResponse;

          if (user) {
            // Populate user object in response (matching frontend CompanyMember type)
            parsedMember.user = {
              id: user.id,
              name: user.name || user.fullName || parsedMember.name,
              email: user.email || parsedMember.email,
              avatar: user.avatar_url || user.avatarUrl || parsedMember.avatar_url,
            };

            // Also update root-level fields for backward compatibility
            parsedMember.name = parsedMember.user.name;
            parsedMember.email = parsedMember.user.email;
            if (parsedMember.user.avatar) {
              parsedMember.avatar_url = parsedMember.user.avatar;
            }
          } else {
            // Fall back to stored data
            parsedMember.user = {
              id: member.user_id,
              name: parsedMember.name,
              email: parsedMember.email,
              avatar: parsedMember.avatar_url,
            };
          }
        } catch (error) {
          console.error(`[CompanyMemberService] Failed to fetch user ${member.user_id}:`, error);
          // Fall back to stored data
          parsedMember.user = {
            id: member.user_id,
            name: parsedMember.name,
            email: parsedMember.email,
            avatar: parsedMember.avatar_url,
          };
        }
      }

      return parsedMember;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('[CompanyMemberService] Error fetching user membership:', error);
      throw new BadRequestException('Failed to fetch user membership');
    }
  }

  /**
   * Get a member's workload information
   * @param companyId - Company UUID
   * @param memberId - Member UUID
   */
  async getMemberWorkload(companyId: string, memberId: string) {
    try {
      const member = await this.getCompanyMember(companyId, memberId);

      // Calculate workload from project assignments
      const workloadPercentage = await this.calculateWorkloadPercentage(memberId);

      return {
        member_id: memberId,
        member_name: member.name,
        workload_percentage: member.workload_percentage || workloadPercentage,
        current_projects: member.current_projects || 0,
        current_project_ids: member.current_project_ids || [],
        hours_this_week: member.hours_this_week || 0,
        hours_this_month: member.hours_this_month || 0,
        capacity_hours_per_week: member.capacity_hours_per_week || 40,
        availability: member.availability,
        status: member.status,
        assignments: member.assignments || []
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('[CompanyMemberService] Error fetching member workload:', error);
      throw new BadRequestException('Failed to fetch member workload');
    }
  }

  /**
   * Get workload information for entire team
   * @param companyId - Company UUID
   * @param userId - Current user's database ID
   */
  async getTeamWorkload(companyId: string, userId: string) {
    try {
      // Verify user has access to this company
      await this.verifyMemberAccess(companyId, userId, 'view');

      const members = await this.getCompanyMembers(companyId, userId, { status: TeamMemberStatus.ACTIVE });

      const workloadData = await Promise.all(
        members.map(async (member) => {
          const workload = await this.getMemberWorkload(companyId, member.id);
          return {
            member_id: member.id,
            member_name: member.name,
            role: member.role,
            workload_percentage: workload.workload_percentage,
            current_projects: workload.current_projects,
            availability: member.availability,
            capacity_hours_per_week: member.capacity_hours_per_week
          };
        })
      );

      // Calculate team statistics
      const totalCapacity = workloadData.reduce((sum, m) => sum + (m.capacity_hours_per_week || 40), 0);
      const averageWorkload = workloadData.length > 0
        ? workloadData.reduce((sum, m) => sum + m.workload_percentage, 0) / workloadData.length
        : 0;
      const totalProjects = workloadData.reduce((sum, m) => sum + m.current_projects, 0);
      const availableMembers = workloadData.filter(m => m.availability === 'available').length;

      return {
        team_workload: workloadData,
        statistics: {
          total_members: workloadData.length,
          available_members: availableMembers,
          total_capacity_hours: totalCapacity,
          average_workload_percentage: Math.round(averageWorkload),
          total_active_projects: totalProjects
        }
      };
    } catch (error) {
      if (error instanceof ForbiddenException || error instanceof NotFoundException) {
        throw error;
      }
      console.error('[CompanyMemberService] Error fetching team workload:', error);
      throw new BadRequestException('Failed to fetch team workload');
    }
  }

  /**
   * Update member workload statistics
   * @param memberId - Member UUID
   * @param workloadData - Workload data to update
   */
  async updateMemberWorkload(memberId: string, workloadData: WorkloadUpdateDto) {
    try {
      const updateData: any = {};

      if (workloadData.workload_percentage !== undefined) {
        updateData.workload_percentage = workloadData.workload_percentage;
      }
      if (workloadData.current_projects !== undefined) {
        updateData.current_projects = workloadData.current_projects;
      }
      if (workloadData.current_project_ids !== undefined) {
        updateData.current_project_ids = JSON.stringify(workloadData.current_project_ids);
      }
      if (workloadData.hours_this_week !== undefined) {
        updateData.hours_this_week = workloadData.hours_this_week;
      }
      if (workloadData.hours_this_month !== undefined) {
        updateData.hours_this_month = workloadData.hours_this_month;
      }

      updateData.updated_at = new Date().toISOString();

      const query = /* TODO: replace client call */ this.db.client.table('company_team_members')
        .where('id', '=', memberId);

      await query.update(updateData);

      return { message: 'Workload updated successfully', member_id: memberId };
    } catch (error) {
      console.error('[CompanyMemberService] Error updating workload:', error);
      throw new BadRequestException('Failed to update workload');
    }
  }

  /**
   * Calculate workload percentage based on project assignments
   * @param memberId - Member UUID
   */
  async calculateWorkloadPercentage(memberId: string): Promise<number> {
    try {
      const assignmentsQuery = this.db.table('team_member_project_assignments')
        .where('team_member_id', '=', memberId)
        .where('is_active', '=', true)
        .where('status', '=', 'active');

      const assignmentsResult = await assignmentsQuery.execute();
      const assignments = assignmentsResult.data || [];

      // Sum up all allocation percentages
      const totalAllocation = assignments.reduce((sum, assignment) => {
        return sum + (parseFloat(assignment.allocation_percentage) || 0);
      }, 0);

      // Cap at 100%
      return Math.min(100, Math.round(totalAllocation));
    } catch (error) {
      console.error('[CompanyMemberService] Error calculating workload:', error);
      return 0;
    }
  }

  /**
   * Parse JSON fields from database record
   * @param member - Raw member record from database
   */
  parseMemberJsonFields(member: any) {
    if (!member) return member;

    return {
      ...member,
      permissions: this.safeJsonParse(member.permissions, []),
      skills: this.safeJsonParse(member.skills, []),
      specializations: this.safeJsonParse(member.specializations, []),
      technologies: this.safeJsonParse(member.technologies, []),
      expertise: this.safeJsonParse(member.expertise, []),
      current_project_ids: this.safeJsonParse(member.current_project_ids, []),
      social_links: this.safeJsonParse(member.social_links, {}),
      metadata: this.safeJsonParse(member.metadata, {})
    };
  }

  /**
   * Verify that a user has access to perform actions in a company
   * @param companyId - Company UUID
   * @param userId - Current user's database ID
   * @param action - Action to perform ('view', 'manage')
   */
  async verifyMemberAccess(companyId: string, userId: string, action: 'view' | 'manage'): Promise<void> {
    try {
      const membership = await this.getCurrentUserMembership(companyId, userId);

      // Check if member is active
      if (membership.status !== 'active') {
        throw new ForbiddenException('Your membership is not active');
      }

      // For 'view' action, any active member can view
      if (action === 'view') {
        return;
      }

      // For 'manage' action, must be owner or admin
      if (action === 'manage') {
        if (membership.role !== 'owner' && membership.role !== 'admin') {
          throw new ForbiddenException('Only company owners and admins can manage team members');
        }
        return;
      }

      throw new ForbiddenException('Invalid action');
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new ForbiddenException('You do not have access to this company');
      }
      if (error instanceof ForbiddenException) {
        throw error;
      }
      console.error('[CompanyMemberService] Error verifying access:', error);
      throw new ForbiddenException('Access verification failed');
    }
  }

  /**
   * Helper: Safe JSON parse with fallback
   */
  private safeJsonParse(value: any, fallback: any = null) {
    if (!value) return fallback;
    if (typeof value === 'object') return value;

    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }
}
