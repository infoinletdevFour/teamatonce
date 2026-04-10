import { Injectable, NotFoundException, BadRequestException, ConflictException, Inject, forwardRef } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { CreateTeamAssignmentDto, UpdateTeamAssignmentDto, AssignTeamMemberDto } from './dto/team-assignment.dto';
import { NotificationsService } from '../../notifications/notifications.service';
import { NotificationType, NotificationPriority } from '../../notifications/dto';

@Injectable()
export class TeamAssignmentService {
  constructor(
    private readonly db: DatabaseService,
    @Inject(forwardRef(() => NotificationsService))
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Get all team members assigned to a project
   */
  async getProjectTeam(projectId: string) {
    try {
      // Verify project exists
      const projectQuery = this.db.table('projects')
        .where('id', '=', projectId)
        .limit(1);

      const projectResult = await projectQuery.execute();
      const project = projectResult.data?.[0];

      if (!project) {
        throw new NotFoundException(`Project with ID ${projectId} not found`);
      }

      // Get all active assignments for this project
      const assignmentsQuery = this.db.table('project_team_assignments')
        .where('project_id', '=', projectId)
        .where('is_active', '=', true)
        .orderBy('assigned_at', 'asc');

      const assignmentsResult = await assignmentsQuery.execute();
      const assignments = assignmentsResult.data || [];

      if (assignments.length === 0) {
        return [];
      }

      // Get team member details
      const memberIds = assignments.map(a => a.team_member_id);
      const membersQuery = this.db.table('team_members')
        .whereIn('id', memberIds);

      const membersResult = await membersQuery.execute();
      const members = membersResult.data || [];

      // Combine assignments with member details
      return assignments.map(assignment => {
        const member = members.find(m => m.id === assignment.team_member_id);
        return {
          ...assignment,
          team_member: member ? {
            id: member.id,
            user_id: member.user_id,
            display_name: member.display_name,
            role: member.role,
            profile_image: member.profile_image,
            hourly_rate: member.hourly_rate,
            currency: member.currency,
            availability_status: member.availability_status,
            skills: this.safeJsonParse(member.skills, []),
            technologies: this.safeJsonParse(member.technologies, [])
          } : null
        };
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('[TeamAssignmentService] Error fetching project team:', error);
      throw new BadRequestException('Failed to fetch project team');
    }
  }

  /**
   * Assign a team member to a project
   */
  async assignTeamMember(projectId: string, data: AssignTeamMemberDto) {
    try {
      // Verify project exists
      const projectQuery = this.db.table('projects')
        .where('id', '=', projectId)
        .limit(1);

      const projectResult = await projectQuery.execute();
      const project = projectResult.data?.[0];

      if (!project) {
        throw new NotFoundException(`Project with ID ${projectId} not found`);
      }

      // Verify team member exists
      const memberQuery = this.db.table('team_members')
        .where('id', '=', data.team_member_id)
        .where('is_active', '=', true)
        .limit(1);

      const memberResult = await memberQuery.execute();
      const member = memberResult.data?.[0];

      if (!member) {
        throw new NotFoundException(`Team member with ID ${data.team_member_id} not found`);
      }

      // Check if assignment already exists (including inactive ones)
      const existingQuery = this.db.table('project_team_assignments')
        .where('project_id', '=', projectId)
        .where('team_member_id', '=', data.team_member_id)
        .limit(1);

      const existingResult = await existingQuery.execute();
      const existing = existingResult.data?.[0];

      if (existing && existing.is_active) {
        throw new ConflictException(
          `Team member ${member.display_name} is already assigned to this project`
        );
      }

      // If there's an inactive assignment, reactivate it
      if (existing && !existing.is_active) {
        const updateQuery = /* TODO: replace client call */ this.db.client.table('project_team_assignments')
          .where('id', '=', existing.id);

        await updateQuery.update({
          project_role: data.project_role,
          allocation_percentage: data.allocation_percentage || 100,
          is_active: true,
          removed_at: null,
          assigned_at: new Date().toISOString()
        });

        // Return updated assignment with member details
        return this.getAssignmentById(existing.id);
      }

      // Create new assignment
      const assignmentData = {
        project_id: projectId,
        team_member_id: data.team_member_id,
        project_role: data.project_role,
        allocation_percentage: data.allocation_percentage || 100,
        is_active: true,
        assigned_at: new Date().toISOString()
      };

      const result = await this.db.insert('project_team_assignments', assignmentData);

      // Update member's current_projects array
      await this.updateMemberProjectsList(data.team_member_id, projectId, 'add');

      // Send notification to the assigned team member
      try {
        if (member.user_id) {
          await this.notificationsService.sendNotification({
            user_id: member.user_id,
            type: NotificationType.UPDATE,
            title: '🎯 New Project Assignment',
            message: `You've been assigned to "${project.name}" as ${data.project_role}.`,
            priority: NotificationPriority.NORMAL,
            action_url: `/projects/${projectId}`,
            data: { projectId, role: data.project_role, assignmentId: result.id },
            send_push: true,
          });
        }
      } catch (notifError) {
        console.error('[TeamAssignmentService] Error sending assignment notification:', notifError);
      }

      // Return assignment with member details
      return this.getAssignmentById(result.id);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      console.error('[TeamAssignmentService] Error assigning team member:', error);
      throw new BadRequestException('Failed to assign team member');
    }
  }

  /**
   * Remove a team member from a project (soft delete)
   */
  async removeTeamMember(assignmentId: string) {
    try {
      // Get assignment details
      const assignment = await this.getAssignmentById(assignmentId);

      if (!assignment.is_active) {
        throw new BadRequestException('Assignment is already inactive');
      }

      // Soft delete the assignment
      const updateQuery = /* TODO: replace client call */ this.db.client.table('project_team_assignments')
        .where('id', '=', assignmentId);

      await updateQuery.update({
        is_active: false,
        removed_at: new Date().toISOString()
      });

      // Update member's current_projects array
      await this.updateMemberProjectsList(assignment.team_member_id, assignment.project_id, 'remove');

      // Send notification to the removed team member
      try {
        if (assignment.team_member?.user_id) {
          // Get project details for the notification
          const projectQuery = this.db.table('projects')
            .where('id', '=', assignment.project_id)
            .limit(1);
          const projectResult = await projectQuery.execute();
          const project = projectResult.data?.[0];

          await this.notificationsService.sendNotification({
            user_id: assignment.team_member.user_id,
            type: NotificationType.UPDATE,
            title: '📋 Project Assignment Update',
            message: `You have been removed from the project "${project?.name || 'Unknown'}".`,
            priority: NotificationPriority.NORMAL,
            action_url: '/projects',
            data: { projectId: assignment.project_id, action: 'removed' },
            send_push: true,
          });
        }
      } catch (notifError) {
        console.error('[TeamAssignmentService] Error sending removal notification:', notifError);
      }

      return {
        message: 'Team member removed from project successfully',
        assignment_id: assignmentId
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      console.error('[TeamAssignmentService] Error removing team member:', error);
      throw new BadRequestException('Failed to remove team member');
    }
  }

  /**
   * Update an assignment (role, allocation, etc.)
   */
  async updateAssignment(assignmentId: string, data: UpdateTeamAssignmentDto) {
    try {
      // Verify assignment exists
      await this.getAssignmentById(assignmentId);

      const updateData: any = {};

      if (data.project_role !== undefined) {
        updateData.project_role = data.project_role;
      }

      if (data.allocation_percentage !== undefined) {
        updateData.allocation_percentage = data.allocation_percentage;
      }

      if (data.removed_at !== undefined) {
        updateData.removed_at = data.removed_at;
        updateData.is_active = false;
      }

      if (Object.keys(updateData).length === 0) {
        throw new BadRequestException('No valid fields to update');
      }

      const updateQuery = /* TODO: replace client call */ this.db.client.table('project_team_assignments')
        .where('id', '=', assignmentId);

      await updateQuery.update(updateData);

      // Return updated assignment
      return this.getAssignmentById(assignmentId);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      console.error('[TeamAssignmentService] Error updating assignment:', error);
      throw new BadRequestException('Failed to update assignment');
    }
  }

  /**
   * Get assignments for a specific team member
   */
  async getTeamMemberAssignments(teamMemberId: string, activeOnly: boolean = true) {
    try {
      const query = this.db.table('project_team_assignments')
        .where('team_member_id', '=', teamMemberId);

      if (activeOnly) {
        query.where('is_active', '=', true);
      }

      query.orderBy('assigned_at', 'desc');

      const result = await query.execute();
      const assignments = result.data || [];

      if (assignments.length === 0) {
        return [];
      }

      // Get project details
      const projectIds = assignments.map(a => a.project_id);
      const projectsQuery = this.db.table('projects')
        .whereIn('id', projectIds);

      const projectsResult = await projectsQuery.execute();
      const projects = projectsResult.data || [];

      // Combine assignments with project details
      return assignments.map(assignment => {
        const project = projects.find(p => p.id === assignment.project_id);
        return {
          ...assignment,
          project: project ? {
            id: project.id,
            name: project.name,
            status: project.status,
            project_type: project.project_type,
            start_date: project.start_date,
            expected_completion_date: project.expected_completion_date
          } : null
        };
      });
    } catch (error) {
      console.error('[TeamAssignmentService] Error fetching member assignments:', error);
      throw new BadRequestException('Failed to fetch team member assignments');
    }
  }

  /**
   * Get assignment by ID with details
   */
  private async getAssignmentById(assignmentId: string) {
    const query = this.db.table('project_team_assignments')
      .where('id', '=', assignmentId)
      .limit(1);

    const result = await query.execute();
    const assignment = result.data?.[0];

    if (!assignment) {
      throw new NotFoundException(`Assignment with ID ${assignmentId} not found`);
    }

    // Get team member details
    const memberQuery = this.db.table('team_members')
      .where('id', '=', assignment.team_member_id)
      .limit(1);

    const memberResult = await memberQuery.execute();
    const member = memberResult.data?.[0];

    return {
      ...assignment,
      team_member: member ? {
        id: member.id,
        user_id: member.user_id,
        display_name: member.display_name,
        role: member.role,
        profile_image: member.profile_image
      } : null
    };
  }

  /**
   * Update team member's current_projects JSON array
   */
  private async updateMemberProjectsList(memberId: string, projectId: string, action: 'add' | 'remove') {
    try {
      const memberQuery = this.db.table('team_members')
        .where('id', '=', memberId)
        .limit(1);

      const memberResult = await memberQuery.execute();
      const member = memberResult.data?.[0];

      if (!member) return;

      let currentProjects = this.safeJsonParse(member.current_projects, []);

      if (action === 'add' && !currentProjects.includes(projectId)) {
        currentProjects.push(projectId);
      } else if (action === 'remove') {
        currentProjects = currentProjects.filter((id: string) => id !== projectId);
      }

      const updateQuery = /* TODO: replace client call */ this.db.client.table('team_members')
        .where('id', '=', memberId);

      await updateQuery.update({
        current_projects: JSON.stringify(currentProjects),
        updated_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('[TeamAssignmentService] Error updating member projects list:', error);
      // Non-critical error, don't throw
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
