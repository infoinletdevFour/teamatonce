import { Injectable, NotFoundException, ConflictException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { NotificationType, NotificationPriority } from '../../notifications/dto';
import { CreateTeamMemberDto, UpdateTeamMemberDto, TeamMemberFilterDto } from './dto/team-member.dto';

@Injectable()
export class TeamMembersService {
  constructor(
    private readonly db: DatabaseService,
    @Inject(forwardRef(() => NotificationsService))
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Get all team members (not soft deleted)
   * Multi-tenant: Can filter by organization/company context if needed
   */
  async getAllTeamMembers(filters?: TeamMemberFilterDto) {
    try {
      const query = this.db.table('team_members');

      // Base condition: is_active = true
      if (filters?.is_active !== undefined) {
        query.where('is_active', '=', filters.is_active);
      } else {
        query.where('is_active', '=', true);
      }

      // Apply filters
      if (filters?.role) {
        query.where('role', '=', filters.role);
      }

      if (filters?.availability_status) {
        query.where('availability_status', '=', filters.availability_status);
      }

      // Handle experience filter
      if (filters?.min_experience !== undefined) {
        query.where('experience_years', '>=', filters.min_experience);
      }

      // Handle hourly rate filter
      if (filters?.max_hourly_rate !== undefined) {
        query.where('hourly_rate', '<=', filters.max_hourly_rate);
      }

      // Search across display_name and bio
      if (filters?.search) {
        const searchTerm = `%${filters.search}%`;
        query.where('display_name', 'ILIKE', searchTerm);
      }

      // Order by display_name
      query.orderBy('display_name', 'asc');

      const result = await query.execute();
      const members = result.data || [];

      // Parse JSON fields for each member
      return members.map(member => this.parseTeamMemberJsonFields(member));
    } catch (error) {
      console.error('[TeamMembersService] Error fetching team members:', error);
      throw new BadRequestException('Failed to fetch team members');
    }
  }

  /**
   * Get team member by ID with related data
   */
  async getTeamMemberById(id: string) {
    try {
      const query = this.db.table('team_members')
        .where('id', '=', id)
        .where('is_active', '=', true)
        .limit(1);

      const result = await query.execute();
      const member = result.data?.[0];

      if (!member) {
        throw new NotFoundException(`Team member with ID ${id} not found`);
      }

      // Get assignments for this member
      const assignmentsQuery = this.db.table('project_team_assignments')
        .where('team_member_id', '=', id)
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
      const parsedMember = this.parseTeamMemberJsonFields(member);

      // Attach assignments with project info
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
      console.error('[TeamMembersService] Error fetching team member:', error);
      throw new BadRequestException('Failed to fetch team member');
    }
  }

  /**
   * Create a new team member
   */
  async createTeamMember(data: CreateTeamMemberDto) {
    try {
      // Check if user_id already exists
      const existingQuery = this.db.table('team_members')
        .where('user_id', '=', data.user_id)
        .where('is_active', '=', true)
        .limit(1);

      const existingResult = await existingQuery.execute();
      const existing = existingResult.data?.[0];

      if (existing) {
        throw new ConflictException(`Team member with user_id ${data.user_id} already exists`);
      }

      // Prepare data with JSON field serialization
      const memberData = {
        user_id: data.user_id,
        display_name: data.display_name,
        role: data.role,
        specialization: JSON.stringify(data.specialization || []),
        skills: JSON.stringify(data.skills || []),
        technologies: JSON.stringify(data.technologies || []),
        experience_years: data.experience_years || 0,
        hourly_rate: data.hourly_rate || null,
        currency: data.currency || 'USD',
        availability_status: data.availability_status || 'available',
        current_projects: JSON.stringify(data.current_projects || []),
        capacity_hours_per_week: data.capacity_hours_per_week || 40,
        profile_image: data.profile_image || null,
        bio: data.bio || null,
        portfolio_url: data.portfolio_url || null,
        is_active: data.is_active !== undefined ? data.is_active : true
      };

      const result = await this.db.insert('team_members', memberData);

      // Send welcome notification to the new team member
      try {
        await this.notificationsService.sendNotification({
          user_id: data.user_id,
          type: NotificationType.UPDATE,
          title: '🎉 Welcome to the Team!',
          message: `You have been added to the team as ${data.role}. Your profile has been set up and you're ready to start collaborating!`,
          priority: NotificationPriority.NORMAL,
          action_url: '/team/profile',
          data: {
            teamMemberId: result.id,
            role: data.role,
            displayName: data.display_name,
          },
          send_push: true,
        });
      } catch (error) {
        console.error('[TeamMembersService] Failed to send team member welcome notification:', error);
      }

      return this.parseTeamMemberJsonFields(result);
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      console.error('[TeamMembersService] Error creating team member:', error);
      throw new BadRequestException('Failed to create team member');
    }
  }

  /**
   * Update team member
   */
  async updateTeamMember(id: string, data: UpdateTeamMemberDto) {
    try {
      // Verify member exists
      await this.getTeamMemberById(id);

      // Prepare update data with JSON serialization
      const updateData: any = {};

      if (data.display_name !== undefined) updateData.display_name = data.display_name;
      if (data.role !== undefined) updateData.role = data.role;
      if (data.specialization !== undefined) updateData.specialization = JSON.stringify(data.specialization);
      if (data.skills !== undefined) updateData.skills = JSON.stringify(data.skills);
      if (data.technologies !== undefined) updateData.technologies = JSON.stringify(data.technologies);
      if (data.experience_years !== undefined) updateData.experience_years = data.experience_years;
      if (data.hourly_rate !== undefined) updateData.hourly_rate = data.hourly_rate;
      if (data.currency !== undefined) updateData.currency = data.currency;
      if (data.availability_status !== undefined) updateData.availability_status = data.availability_status;
      if (data.current_projects !== undefined) updateData.current_projects = JSON.stringify(data.current_projects);
      if (data.capacity_hours_per_week !== undefined) updateData.capacity_hours_per_week = data.capacity_hours_per_week;
      if (data.profile_image !== undefined) updateData.profile_image = data.profile_image;
      if (data.bio !== undefined) updateData.bio = data.bio;
      if (data.portfolio_url !== undefined) updateData.portfolio_url = data.portfolio_url;
      if (data.is_active !== undefined) updateData.is_active = data.is_active;

      // Add updated_at timestamp
      updateData.updated_at = new Date().toISOString();

      const query = /* TODO: replace client call */ this.db.client.table('team_members')
        .where('id', '=', id);

      await query.update(updateData);

      // Return updated member
      return await this.getTeamMemberById(id);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('[TeamMembersService] Error updating team member:', error);
      throw new BadRequestException('Failed to update team member');
    }
  }

  /**
   * Delete team member (soft delete by setting is_active = false)
   */
  async deleteTeamMember(id: string) {
    try {
      // Verify member exists
      await this.getTeamMemberById(id);

      // Check if member has active assignments
      const assignmentsQuery = this.db.table('project_team_assignments')
        .where('team_member_id', '=', id)
        .where('is_active', '=', true);

      const assignmentsResult = await assignmentsQuery.execute();
      const activeAssignments = assignmentsResult.data || [];

      if (activeAssignments.length > 0) {
        throw new BadRequestException(
          `Cannot delete team member. They have ${activeAssignments.length} active project assignment(s). Please remove them from projects first.`
        );
      }

      // Soft delete by setting is_active = false
      const query = /* TODO: replace client call */ this.db.client.table('team_members')
        .where('id', '=', id);

      await query.update({
        is_active: false,
        updated_at: new Date().toISOString()
      });

      return { message: 'Team member deleted successfully', id };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      console.error('[TeamMembersService] Error deleting team member:', error);
      throw new BadRequestException('Failed to delete team member');
    }
  }

  /**
   * Search team members by name, bio, or role
   */
  async searchTeamMembers(searchTerm: string) {
    try {
      const searchPattern = `%${searchTerm}%`;

      const query = this.db.table('team_members')
        .where('is_active', '=', true);

      // PostgreSQL ILIKE for case-insensitive search
      // Search in display_name, role, or bio
      const result = await /* TODO: replace client call */ this.db.client.query
        .from('team_members')
        .select('*')
        .where('is_active', '=', true)
        .where('display_name', 'ILIKE', searchPattern)
        .orWhere('role', 'ILIKE', searchPattern)
        .orWhere('bio', 'ILIKE', searchPattern)
        .orderBy('display_name', 'asc')
        .execute();

      const members = result.data || [];
      return members.map(member => this.parseTeamMemberJsonFields(member));
    } catch (error) {
      console.error('[TeamMembersService] Error searching team members:', error);
      // Fallback to simpler search
      return this.getAllTeamMembers({ search: searchTerm });
    }
  }

  /**
   * Filter team members by skill
   */
  async filterTeamMembersBySkill(skill: string) {
    try {
      // Use PostgreSQL JSONB array contains operator
      const result = await /* TODO: replace client call */ this.db.client.query
        .from('team_members')
        .select('*')
        .where('is_active', '=', true)
        .whereRaw(`skills @> ?`, [JSON.stringify([skill])])
        .orderBy('display_name', 'asc')
        .execute();

      const members = result.data || [];
      return members.map(member => this.parseTeamMemberJsonFields(member));
    } catch (error) {
      console.error('[TeamMembersService] Error filtering by skill:', error);
      // Fallback: fetch all and filter in memory
      const allMembers = await this.getAllTeamMembers({ is_active: true });
      return allMembers.filter(member =>
        member.skills && member.skills.includes(skill)
      );
    }
  }

  /**
   * Get available team members (availability_status = 'available')
   */
  async getAvailableTeamMembers() {
    try {
      const query = this.db.table('team_members')
        .where('is_active', '=', true)
        .where('availability_status', '=', 'available')
        .orderBy('display_name', 'asc');

      const result = await query.execute();
      const members = result.data || [];

      return members.map(member => this.parseTeamMemberJsonFields(member));
    } catch (error) {
      console.error('[TeamMembersService] Error fetching available members:', error);
      throw new BadRequestException('Failed to fetch available team members');
    }
  }

  /**
   * Helper: Parse JSON fields from database
   */
  private parseTeamMemberJsonFields(member: any) {
    if (!member) return member;

    return {
      ...member,
      specialization: this.safeJsonParse(member.specialization, []),
      skills: this.safeJsonParse(member.skills, []),
      technologies: this.safeJsonParse(member.technologies, []),
      current_projects: this.safeJsonParse(member.current_projects, [])
    };
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
