import { Injectable, NotFoundException, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import {
  SubmitProjectDefinitionDto,
  DefineProjectScopeDto,
} from './dto/project-definition.dto';
import {
  CreateRequirementDto,
  UpdateRequirementDto,
} from './dto/requirement.dto';
import {
  CreateStakeholderDto,
  UpdateStakeholderDto,
} from './dto/stakeholder.dto';
import {
  CreateConstraintDto,
  UpdateConstraintDto,
} from './dto/constraint.dto';
import { NotificationsService } from '../../notifications/notifications.service';
import { NotificationType, NotificationPriority } from '../../notifications/dto';

@Injectable()
export class ProjectDefinitionService {
  constructor(
    private readonly db: DatabaseService,
    @Inject(forwardRef(() => NotificationsService))
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Submit complete project definition (bulk operation)
   * Updates project scope and adds requirements, stakeholders, and constraints
   */
  async submitProjectDefinition(userId: string, dto: SubmitProjectDefinitionDto) {
    // Verify project exists and belongs to user
    const project = await this.db.findOne('projects', {
      id: dto.projectId,
      client_id: userId,
      deleted_at: null,
    });

    if (!project) {
      throw new NotFoundException('Project not found or access denied');
    }

    // Update project scope
    await this.db.update('projects', dto.projectId, {
      primary_objective: dto.scope.primaryObjective,
      key_performance_indicators: JSON.stringify(dto.scope.keyPerformanceIndicators || []),
      success_criteria: JSON.stringify(dto.scope.successCriteria || []),
      status: 'in_progress', // Move project to next phase
      updated_at: new Date().toISOString(),
    });

    // Add requirements if provided
    if (dto.requirements && dto.requirements.length > 0) {
      for (const req of dto.requirements) {
        await this.db.insert('project_requirements', {
          project_id: dto.projectId,
          title: req.title,
          description: req.description,
          type: req.type,
          priority: req.priority,
        });
      }
    }

    // Add stakeholders if provided
    if (dto.stakeholders && dto.stakeholders.length > 0) {
      for (const stakeholder of dto.stakeholders) {
        await this.db.insert('project_stakeholders', {
          project_id: dto.projectId,
          name: stakeholder.name,
          role: stakeholder.role,
          expected_outcome: stakeholder.expectedOutcome,
          contact_email: stakeholder.contactEmail || null,
          contact_phone: stakeholder.contactPhone || null,
        });
      }
    }

    // Add constraints if provided
    if (dto.constraints) {
      const constraints = dto.constraints;
      const allConstraints = [];

      // Technical constraints
      if (constraints.technicalConstraints && constraints.technicalConstraints.length > 0) {
        for (const desc of constraints.technicalConstraints) {
          allConstraints.push({
            project_id: dto.projectId,
            type: 'technical',
            description: desc,
          });
        }
      }

      // Business constraints
      if (constraints.businessConstraints && constraints.businessConstraints.length > 0) {
        for (const desc of constraints.businessConstraints) {
          allConstraints.push({
            project_id: dto.projectId,
            type: 'business',
            description: desc,
          });
        }
      }

      // Assumptions
      if (constraints.assumptions && constraints.assumptions.length > 0) {
        for (const desc of constraints.assumptions) {
          allConstraints.push({
            project_id: dto.projectId,
            type: 'assumption',
            description: desc,
          });
        }
      }

      // Insert all constraints
      for (const constraint of allConstraints) {
        await this.db.insert('project_constraints', constraint);
      }
    }

    // Send notification about project definition submission
    try {
      // Notify the client that their project definition was successfully submitted
      await this.notificationsService.sendNotification({
        user_id: userId,
        type: NotificationType.UPDATE,
        title: '📋 Project Definition Submitted',
        message: `Your project "${project.name}" definition has been submitted successfully and is now in progress.`,
        priority: NotificationPriority.NORMAL,
        action_url: `/projects/${dto.projectId}`,
        data: { projectId: dto.projectId, status: 'in_progress' },
        send_push: true,
      });

      // If project has an assigned developer, notify them about the updated definition
      if (project.developer_id) {
        await this.notificationsService.sendNotification({
          user_id: project.developer_id,
          type: NotificationType.UPDATE,
          title: '📋 Project Definition Updated',
          message: `The client has submitted a project definition for "${project.name}". Review the requirements and scope.`,
          priority: NotificationPriority.HIGH,
          action_url: `/projects/${dto.projectId}/definition`,
          data: { projectId: dto.projectId },
          send_push: true,
        });
      }
    } catch (notifError) {
      console.error('[ProjectDefinitionService] Error sending notification:', notifError);
    }

    return {
      success: true,
      message: 'Project definition submitted successfully',
    };
  }

  /**
   * Get complete project definition
   */
  async getProjectDefinition(projectId: string) {
    const project = await this.db.findOne('projects', {
      id: projectId,
      deleted_at: null,
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const requirements = await this.db.findMany('project_requirements', {
      project_id: projectId,
      deleted_at: null,
    });

    const stakeholders = await this.db.findMany('project_stakeholders', {
      project_id: projectId,
      deleted_at: null,
    });

    const constraints = await this.db.findMany('project_constraints', {
      project_id: projectId,
      deleted_at: null,
    });

    return {
      scope: {
        primaryObjective: project.primary_objective,
        keyPerformanceIndicators: this.safeJsonParse(project.key_performance_indicators),
        successCriteria: this.safeJsonParse(project.success_criteria),
      },
      requirements,
      stakeholders,
      constraints: {
        technical: constraints.filter(c => c.type === 'technical'),
        business: constraints.filter(c => c.type === 'business'),
        assumptions: constraints.filter(c => c.type === 'assumption'),
      },
    };
  }

  /**
   * Define or update project scope
   */
  async defineProjectScope(projectId: string, dto: DefineProjectScopeDto) {
    const project = await this.db.findOne('projects', {
      id: projectId,
      deleted_at: null,
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    await this.db.update('projects', projectId, {
      primary_objective: dto.primaryObjective,
      key_performance_indicators: JSON.stringify(dto.keyPerformanceIndicators || []),
      success_criteria: JSON.stringify(dto.successCriteria || []),
      updated_at: new Date().toISOString(),
    });

    return {
      primaryObjective: dto.primaryObjective,
      keyPerformanceIndicators: dto.keyPerformanceIndicators || [],
      successCriteria: dto.successCriteria || [],
    };
  }

  // ============================================
  // REQUIREMENTS MANAGEMENT
  // ============================================

  async addProjectRequirement(projectId: string, dto: CreateRequirementDto) {
    // Verify project exists
    const project = await this.db.findOne('projects', {
      id: projectId,
      deleted_at: null,
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return await this.db.insert('project_requirements', {
      project_id: projectId,
      title: dto.title,
      description: dto.description,
      type: dto.type,
      priority: dto.priority,
    });
  }

  async getProjectRequirements(projectId: string) {
    return await this.db.findMany('project_requirements', {
      project_id: projectId,
      deleted_at: null,
    });
  }

  async getRequirement(requirementId: string) {
    const requirement = await this.db.findOne('project_requirements', {
      id: requirementId,
      deleted_at: null,
    });

    if (!requirement) {
      throw new NotFoundException('Requirement not found');
    }

    return requirement;
  }

  async updateProjectRequirement(requirementId: string, dto: UpdateRequirementDto) {
    await this.getRequirement(requirementId);

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (dto.title) updateData.title = dto.title;
    if (dto.description) updateData.description = dto.description;
    if (dto.type) updateData.type = dto.type;
    if (dto.priority) updateData.priority = dto.priority;

    await this.db.update('project_requirements', requirementId, updateData);
    return this.getRequirement(requirementId);
  }

  async removeProjectRequirement(requirementId: string) {
    await this.getRequirement(requirementId);

    await this.db.update('project_requirements', requirementId, {
      deleted_at: new Date().toISOString(),
    });

    return { success: true, message: 'Requirement removed successfully' };
  }

  // ============================================
  // STAKEHOLDERS MANAGEMENT
  // ============================================

  async addProjectStakeholder(projectId: string, dto: CreateStakeholderDto) {
    // Verify project exists
    const project = await this.db.findOne('projects', {
      id: projectId,
      deleted_at: null,
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return await this.db.insert('project_stakeholders', {
      project_id: projectId,
      name: dto.name,
      role: dto.role,
      expected_outcome: dto.expectedOutcome,
      contact_email: dto.contactEmail || null,
      contact_phone: dto.contactPhone || null,
    });
  }

  async getProjectStakeholders(projectId: string) {
    return await this.db.findMany('project_stakeholders', {
      project_id: projectId,
      deleted_at: null,
    });
  }

  async getStakeholder(stakeholderId: string) {
    const stakeholder = await this.db.findOne('project_stakeholders', {
      id: stakeholderId,
      deleted_at: null,
    });

    if (!stakeholder) {
      throw new NotFoundException('Stakeholder not found');
    }

    return stakeholder;
  }

  async updateProjectStakeholder(stakeholderId: string, dto: UpdateStakeholderDto) {
    await this.getStakeholder(stakeholderId);

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (dto.name) updateData.name = dto.name;
    if (dto.role) updateData.role = dto.role;
    if (dto.expectedOutcome) updateData.expected_outcome = dto.expectedOutcome;
    if (dto.contactEmail !== undefined) updateData.contact_email = dto.contactEmail;
    if (dto.contactPhone !== undefined) updateData.contact_phone = dto.contactPhone;

    await this.db.update('project_stakeholders', stakeholderId, updateData);
    return this.getStakeholder(stakeholderId);
  }

  async removeProjectStakeholder(stakeholderId: string) {
    await this.getStakeholder(stakeholderId);

    await this.db.update('project_stakeholders', stakeholderId, {
      deleted_at: new Date().toISOString(),
    });

    return { success: true, message: 'Stakeholder removed successfully' };
  }

  // ============================================
  // CONSTRAINTS MANAGEMENT
  // ============================================

  async addProjectConstraint(projectId: string, dto: CreateConstraintDto) {
    // Verify project exists
    const project = await this.db.findOne('projects', {
      id: projectId,
      deleted_at: null,
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return await this.db.insert('project_constraints', {
      project_id: projectId,
      type: dto.type,
      description: dto.description,
      impact: dto.impact || null,
      mitigation_strategy: dto.mitigationStrategy || null,
    });
  }

  async getProjectConstraints(projectId: string) {
    return await this.db.findMany('project_constraints', {
      project_id: projectId,
      deleted_at: null,
    });
  }

  async getConstraint(constraintId: string) {
    const constraint = await this.db.findOne('project_constraints', {
      id: constraintId,
      deleted_at: null,
    });

    if (!constraint) {
      throw new NotFoundException('Constraint not found');
    }

    return constraint;
  }

  async updateProjectConstraint(constraintId: string, dto: UpdateConstraintDto) {
    await this.getConstraint(constraintId);

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (dto.type) updateData.type = dto.type;
    if (dto.description) updateData.description = dto.description;
    if (dto.impact !== undefined) updateData.impact = dto.impact;
    if (dto.mitigationStrategy !== undefined) updateData.mitigation_strategy = dto.mitigationStrategy;

    await this.db.update('project_constraints', constraintId, updateData);
    return this.getConstraint(constraintId);
  }

  async removeProjectConstraint(constraintId: string) {
    await this.getConstraint(constraintId);

    await this.db.update('project_constraints', constraintId, {
      deleted_at: new Date().toISOString(),
    });

    return { success: true, message: 'Constraint removed successfully' };
  }

  // ============================================
  // HELPER METHODS
  // ============================================

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
