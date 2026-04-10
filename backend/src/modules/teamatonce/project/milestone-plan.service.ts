import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { TeamAtOnceGateway } from '../../../websocket/teamatonce.gateway';
import { NotificationsService } from '../../notifications/notifications.service';
import { NotificationType, NotificationPriority } from '../../notifications/dto';
import {
  CreateMilestonePlanDto,
  UpdateMilestonePlanDto,
  SubmitMilestonePlanDto,
  ApproveMilestonePlanDto,
  RequestMilestonePlanChangesDto,
  RejectMilestonePlanDto,
  MilestonePlanStatus,
  MilestonePlanResponseDto,
  ProposedMilestoneDto,
} from './dto/milestone-plan.dto';
import { MilestoneStatus } from './dto/project.dto';

@Injectable()
export class MilestonePlanService {
  constructor(
    private readonly db: DatabaseService,
    private readonly gateway: TeamAtOnceGateway,
    private readonly notificationService: NotificationsService,
  ) {}

  /**
   * Create a new milestone plan (Developer)
   */
  async createMilestonePlan(
    dto: CreateMilestonePlanDto,
    userId: string,
  ): Promise<MilestonePlanResponseDto> {
    // Verify project exists
    const project = await this.db.findOne('projects', {
      id: dto.projectId,
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Verify proposal exists and was accepted
    const proposal = await this.db.findOne('project_proposals', {
      id: dto.proposalId,
      project_id: dto.projectId,
    });

    if (!proposal) {
      throw new NotFoundException('Proposal not found');
    }

    if (proposal.status !== 'accepted') {
      throw new BadRequestException('Proposal must be accepted before creating milestone plan');
    }

    // Verify user is the proposal submitter or part of the company
    if (proposal.submitted_by !== userId) {
      // Check if user is part of the company
      const companyMembership = await this.verifyCompanyMembership(userId, proposal.company_id);
      if (!companyMembership) {
        throw new ForbiddenException('Only the proposal submitter or company members can create milestone plan');
      }
    }

    // Check if plan already exists
    const existingPlan = await this.db.findOne('milestone_plans', {
      project_id: dto.projectId,
      proposal_id: dto.proposalId,
      status: ['draft', 'pending_review', 'changes_requested'],
    });

    if (existingPlan) {
      throw new BadRequestException('A milestone plan already exists for this project. Update the existing plan instead.');
    }

    // Validate milestones
    this.validateMilestones(dto.milestones);

    // Create milestone plan
    const planData = {
      project_id: dto.projectId,
      proposal_id: dto.proposalId,
      submitted_by: userId,
      status: MilestonePlanStatus.DRAFT,
      milestones: JSON.stringify(dto.milestones),
      revision_count: 0,
      version: 1,
      metadata: JSON.stringify({
        projectOverview: dto.projectOverview || '',
        technicalApproach: dto.technicalApproach || '',
        toolsAndTechnologies: dto.toolsAndTechnologies || [],
        communicationPlan: dto.communicationPlan || '',
        assumptions: dto.assumptions || [],
        risks: dto.risks || [],
        testingStrategy: dto.testingStrategy || '',
      }),
    };

    const plan = await this.db.insert('milestone_plans', planData);

    // Emit WebSocket event
    this.emitMilestonePlanEvent(dto.projectId, 'milestone-plan-created', plan, userId);

    return this.mapToResponseDto(plan);
  }

  /**
   * Update existing milestone plan (Developer)
   */
  async updateMilestonePlan(
    planId: string,
    dto: UpdateMilestonePlanDto,
    userId: string,
  ): Promise<MilestonePlanResponseDto> {
    const plan = await this.getMilestonePlanRaw(planId);

    // Verify user is the submitter
    if (plan.submitted_by !== userId) {
      throw new ForbiddenException('Only the plan creator can update it');
    }

    // Can only update if in draft or changes_requested status
    if (plan.status !== MilestonePlanStatus.DRAFT && plan.status !== MilestonePlanStatus.CHANGES_REQUESTED) {
      throw new BadRequestException('Can only update plans in draft or changes_requested status');
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (dto.milestones) {
      this.validateMilestones(dto.milestones);
      updateData.milestones = JSON.stringify(dto.milestones);
    }

    if (dto.status) {
      updateData.status = dto.status;
    }

    // Update project-level details if provided
    const currentMetadata = typeof plan.metadata === 'string' ? JSON.parse(plan.metadata) : (plan.metadata || {});
    const updatedMetadata = {
      ...currentMetadata,
      ...(dto.projectOverview !== undefined && { projectOverview: dto.projectOverview }),
      ...(dto.technicalApproach !== undefined && { technicalApproach: dto.technicalApproach }),
      ...(dto.toolsAndTechnologies !== undefined && { toolsAndTechnologies: dto.toolsAndTechnologies }),
      ...(dto.communicationPlan !== undefined && { communicationPlan: dto.communicationPlan }),
      ...(dto.assumptions !== undefined && { assumptions: dto.assumptions }),
      ...(dto.risks !== undefined && { risks: dto.risks }),
      ...(dto.testingStrategy !== undefined && { testingStrategy: dto.testingStrategy }),
    };

    updateData.metadata = JSON.stringify(updatedMetadata);

    await this.db.update('milestone_plans', planId, updateData);

    // Refetch to ensure we have the latest data
    const updated = await this.db.findOne('milestone_plans', { id: planId });

    // Emit WebSocket event
    this.emitMilestonePlanEvent(plan.project_id, 'milestone-plan-updated', updated, userId);

    return this.mapToResponseDto(updated);
  }

  /**
   * Submit milestone plan for client review (Developer)
   */
  async submitMilestonePlan(
    planId: string,
    dto: SubmitMilestonePlanDto,
    userId: string,
  ): Promise<MilestonePlanResponseDto> {
    const plan = await this.getMilestonePlanRaw(planId);

    // Verify user is the submitter
    if (plan.submitted_by !== userId) {
      throw new ForbiddenException('Only the plan creator can submit it');
    }

    // Can only submit if in draft or changes_requested status
    if (plan.status !== MilestonePlanStatus.DRAFT && plan.status !== MilestonePlanStatus.CHANGES_REQUESTED) {
      throw new BadRequestException('Can only submit plans in draft or changes_requested status');
    }

    // Validate milestones before submission
    const milestones = typeof plan.milestones === 'string' ? JSON.parse(plan.milestones) : (plan.milestones || []);
    this.validateMilestones(milestones);

    const updateData = {
      status: MilestonePlanStatus.PENDING_REVIEW,
      submitted_at: new Date().toISOString(),
      revision_count: plan.status === MilestonePlanStatus.CHANGES_REQUESTED ? plan.revision_count + 1 : plan.revision_count,
      client_feedback: null, // Clear previous feedback
      updated_at: new Date().toISOString(),
    };

    await this.db.update('milestone_plans', planId, updateData);

    // Refetch to ensure we have the latest data
    const updated = await this.db.findOne('milestone_plans', { id: planId });

    // Get project for client info
    const project = await this.db.findOne('projects', { id: plan.project_id });

    // Notify client
    await this.notificationService.sendNotification({
      user_id: project.client_id,
      title: 'Milestone Plan Submitted',
      message: `Developer has submitted a milestone plan for "${project.name}". Please review and approve.`,
      type: NotificationType.UPDATE,
      priority: NotificationPriority.HIGH,
      data: {
        projectId: plan.project_id,
        milestonePlanId: planId,
      },
      action_url: `/projects/${plan.project_id}/milestone-plan-review`,
    });

    // Emit WebSocket event
    this.emitMilestonePlanEvent(plan.project_id, 'milestone-plan-submitted', updated, userId);

    return this.mapToResponseDto(updated);
  }

  /**
   * Approve milestone plan (Client)
   */
  async approveMilestonePlan(
    planId: string,
    dto: ApproveMilestonePlanDto,
    userId: string,
  ): Promise<MilestonePlanResponseDto> {
    const plan = await this.getMilestonePlanRaw(planId);

    // Verify user is the project client
    const project = await this.db.findOne('projects', { id: plan.project_id });
    if (project.client_id !== userId) {
      throw new ForbiddenException('Only the project client can approve milestone plan');
    }

    // Can only approve if pending review
    if (plan.status !== MilestonePlanStatus.PENDING_REVIEW) {
      throw new BadRequestException('Can only approve plans in pending_review status');
    }

    // Update plan to approved
    const updateData = {
      status: MilestonePlanStatus.APPROVED,
      reviewed_by: userId,
      reviewed_at: new Date().toISOString(),
      client_feedback: dto.notes || null,
      updated_at: new Date().toISOString(),
    };

    await this.db.update('milestone_plans', planId, updateData);

    // Refetch to ensure we have the latest data
    const updated = await this.db.findOne('milestone_plans', { id: planId });

    // Update project status
    await this.db.update('projects', plan.project_id, {
      milestone_plan_approved_at: new Date().toISOString(),
      status: 'in_progress',
      updated_at: new Date().toISOString(),
    });

    // Create actual milestones from the plan (use refetched data)
    console.log('🚀 Creating milestones from approved plan:', planId);
    try {
      await this.createMilestonesFromPlan(updated);
      console.log('✅ Milestones created successfully');
    } catch (error) {
      console.error('❌ Failed to create milestones:', error);
      throw error;
    }

    // Notify developer
    await this.notificationService.sendNotification({
      user_id: plan.submitted_by,
      title: 'Milestone Plan Approved!',
      message: `Client approved your milestone plan for "${project.name}". You can now start working on the project.`,
      type: NotificationType.ACHIEVEMENT,
      priority: NotificationPriority.HIGH,
      data: {
        projectId: plan.project_id,
        milestonePlanId: planId,
      },
      action_url: `/projects/${plan.project_id}`,
    });

    // Emit WebSocket event
    this.emitMilestonePlanEvent(plan.project_id, 'milestone-plan-approved', updated, userId);

    return this.mapToResponseDto(updated);
  }

  /**
   * Request changes to milestone plan (Client)
   */
  async requestMilestonePlanChanges(
    planId: string,
    dto: RequestMilestonePlanChangesDto,
    userId: string,
  ): Promise<MilestonePlanResponseDto> {
    const plan = await this.getMilestonePlanRaw(planId);

    // Verify user is the project client
    const project = await this.db.findOne('projects', { id: plan.project_id });
    if (project.client_id !== userId) {
      throw new ForbiddenException('Only the project client can request changes');
    }

    // Can only request changes if pending review
    if (plan.status !== MilestonePlanStatus.PENDING_REVIEW) {
      throw new BadRequestException('Can only request changes for plans in pending_review status');
    }

    const updateData = {
      status: MilestonePlanStatus.CHANGES_REQUESTED,
      reviewed_by: userId,
      reviewed_at: new Date().toISOString(),
      client_feedback: dto.feedback,
      updated_at: new Date().toISOString(),
    };

    await this.db.update('milestone_plans', planId, updateData);

    // Refetch to ensure we have the latest data
    const updated = await this.db.findOne('milestone_plans', { id: planId });

    // Notify developer
    await this.notificationService.sendNotification({
      user_id: plan.submitted_by,
      title: 'Milestone Plan Changes Requested',
      message: `Client requested changes to your milestone plan for "${project.name}". Feedback: ${dto.feedback.substring(0, 100)}...`,
      type: NotificationType.REMINDER,
      priority: NotificationPriority.HIGH,
      data: {
        projectId: plan.project_id,
        milestonePlanId: planId,
        feedback: dto.feedback,
      },
      action_url: `/projects/${plan.project_id}/milestone-planning`,
    });

    // Emit WebSocket event
    this.emitMilestonePlanEvent(plan.project_id, 'milestone-plan-changes-requested', updated, userId);

    return this.mapToResponseDto(updated);
  }

  /**
   * Reject milestone plan (Client)
   */
  async rejectMilestonePlan(
    planId: string,
    dto: RejectMilestonePlanDto,
    userId: string,
  ): Promise<MilestonePlanResponseDto> {
    const plan = await this.getMilestonePlanRaw(planId);

    // Verify user is the project client
    const project = await this.db.findOne('projects', { id: plan.project_id });
    if (project.client_id !== userId) {
      throw new ForbiddenException('Only the project client can reject milestone plan');
    }

    // Can only reject if pending review
    if (plan.status !== MilestonePlanStatus.PENDING_REVIEW) {
      throw new BadRequestException('Can only reject plans in pending_review status');
    }

    const updateData = {
      status: MilestonePlanStatus.REJECTED,
      reviewed_by: userId,
      reviewed_at: new Date().toISOString(),
      client_feedback: dto.reason,
      updated_at: new Date().toISOString(),
    };

    await this.db.update('milestone_plans', planId, updateData);

    // Refetch to ensure we have the latest data
    const updated = await this.db.findOne('milestone_plans', { id: planId });

    // Notify developer
    await this.notificationService.sendNotification({
      user_id: plan.submitted_by,
      title: 'Milestone Plan Rejected',
      message: `Client rejected your milestone plan for "${project.name}". Reason: ${dto.reason.substring(0, 100)}...`,
      type: NotificationType.UPDATE,
      priority: NotificationPriority.HIGH,
      data: {
        projectId: plan.project_id,
        milestonePlanId: planId,
        reason: dto.reason,
      },
      action_url: `/projects/${plan.project_id}/milestone-planning`,
    });

    // Emit WebSocket event
    this.emitMilestonePlanEvent(plan.project_id, 'milestone-plan-rejected', updated, userId);

    return this.mapToResponseDto(updated);
  }

  /**
   * Get milestone plan by ID
   */
  async getMilestonePlan(planId: string, userId: string): Promise<MilestonePlanResponseDto> {
    const plan = await this.getMilestonePlanRaw(planId);

    // Verify user has access (project client or plan submitter or company member)
    const project = await this.db.findOne('projects', { id: plan.project_id });
    const isClient = project.client_id === userId;
    const isSubmitter = plan.submitted_by === userId;

    if (!isClient && !isSubmitter) {
      // Check if user is part of the proposal company
      const proposal = await this.db.findOne('project_proposals', { id: plan.proposal_id });
      const companyMembership = await this.verifyCompanyMembership(userId, proposal.company_id);

      if (!companyMembership) {
        throw new ForbiddenException('You do not have access to this milestone plan');
      }
    }

    return this.mapToResponseDto(plan);
  }

  /**
   * Get milestone plan by project ID
   */
  async getMilestonePlanByProject(projectId: string, userId: string): Promise<MilestonePlanResponseDto | null> {
    // Verify user has access to project
    const project = await this.db.findOne('projects', { id: projectId });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const isClient = project.client_id === userId;
    const isProjectMember = await this.isProjectMember(userId, projectId);

    if (!isClient && !isProjectMember) {
      throw new ForbiddenException('You do not have access to this project');
    }

    const plan = await this.db.findOne('milestone_plans', {
      project_id: projectId,
    });

    if (!plan) {
      return null;
    }

    return this.mapToResponseDto(plan);
  }

  /**
   * Get milestone plan history for a project
   */
  async getMilestonePlanHistory(projectId: string, userId: string): Promise<MilestonePlanResponseDto[]> {
    // Verify user has access to project
    const project = await this.db.findOne('projects', { id: projectId });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const isClient = project.client_id === userId;
    const isProjectMember = await this.isProjectMember(userId, projectId);

    if (!isClient && !isProjectMember) {
      throw new ForbiddenException('You do not have access to this project');
    }

    const plans = await this.db.findMany('milestone_plans', {
      project_id: projectId,
    });

    return plans.map(plan => this.mapToResponseDto(plan));
  }

  // ============================================
  // PRIVATE HELPER METHODS
  // ============================================

  private async getMilestonePlanRaw(planId: string): Promise<any> {
    const plan = await this.db.findOne('milestone_plans', { id: planId });
    if (!plan) {
      throw new NotFoundException('Milestone plan not found');
    }
    return plan;
  }

  private validateMilestones(milestones: ProposedMilestoneDto[]): void {
    if (!milestones || milestones.length === 0) {
      throw new BadRequestException('At least one milestone is required');
    }

    // Validate each milestone has required fields
    for (const milestone of milestones) {
      if (!milestone.name || !milestone.description) {
        throw new BadRequestException('Each milestone must have a name and description');
      }

      if (!milestone.milestoneAmount || milestone.milestoneAmount <= 0) {
        throw new BadRequestException('Each milestone must have a valid payment amount');
      }

      if (!milestone.estimatedHours || milestone.estimatedHours <= 0) {
        throw new BadRequestException('Each milestone must have valid estimated hours');
      }

      if (!Array.isArray(milestone.deliverables) || milestone.deliverables.length === 0) {
        throw new BadRequestException('Each milestone must have at least one deliverable');
      }
    }

    // Validate order indexes are sequential
    const orderIndexes = milestones.map(m => m.orderIndex).sort((a, b) => a - b);
    for (let i = 0; i < orderIndexes.length; i++) {
      if (orderIndexes[i] !== i) {
        throw new BadRequestException('Milestone order indexes must be sequential starting from 0');
      }
    }
  }

  private async createMilestonesFromPlan(plan: any): Promise<void> {
    const milestones: ProposedMilestoneDto[] = typeof plan.milestones === 'string' ? JSON.parse(plan.milestones) : (plan.milestones || []);

    console.log(`📋 Creating ${milestones.length} milestones for project ${plan.project_id}`);

    if (!milestones || milestones.length === 0) {
      console.warn('⚠️ No milestones to create!');
      return;
    }

    for (const milestone of milestones) {
      console.log(`  ➕ Creating milestone: ${milestone.name}`);

      const milestoneData = {
        project_id: plan.project_id,
        name: milestone.name,
        description: milestone.description,
        milestone_type: milestone.milestoneType,
        order_index: milestone.orderIndex,
        status: MilestoneStatus.IN_PROGRESS, // Already approved by client when they approved the plan
        deliverables: JSON.stringify(milestone.deliverables),
        acceptance_criteria: JSON.stringify(milestone.acceptanceCriteria),
        estimated_hours: milestone.estimatedHours,
        actual_hours: 0,
        due_date: milestone.dueDate || null,
        milestone_amount: milestone.milestoneAmount,
        payment_status: 'pending',
        requires_approval: true,
        // Store enhanced fields in metadata
        metadata: JSON.stringify({
          dependencies: milestone.dependencies || [],
          resourcesRequired: milestone.resourcesRequired || [],
          reviewProcess: milestone.reviewProcess || '',
          qualityMetrics: milestone.qualityMetrics || [],
          technicalDetails: milestone.technicalDetails || '',
        }),
      };

      const created = await this.db.insert('project_milestones', milestoneData);
      console.log(`  ✅ Milestone created with ID: ${created.id || 'unknown'}`);
    }

    console.log(`✅ Successfully created ${milestones.length} milestones`);
  }

  private async verifyCompanyMembership(userId: string, companyId: string): Promise<boolean> {
    const membership = await this.db.findOne('company_users', {
      user_id: userId,
      company_id: companyId,
    });
    return !!membership;
  }

  private async isProjectMember(userId: string, projectId: string): Promise<boolean> {
    const membership = await this.db.findOne('project_members', {
      user_id: userId,
      project_id: projectId,
    });
    return !!membership;
  }

  private emitMilestonePlanEvent(projectId: string, eventType: string, planData: any, userId?: string): void {
    this.gateway.sendToProject(projectId, eventType, {
      plan: this.mapToResponseDto(planData),
      userId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * AI-generate milestone plan suggestions based on project details
   */
  async aiGenerateMilestonePlan(projectId: string, userId: string): Promise<any> {
    // Get project details
    const project = await this.db.findOne('projects', { id: projectId });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Get accepted proposal
    const proposal = await this.db.findOne('project_proposals', {
      project_id: projectId,
      status: 'accepted',
    });

    if (!proposal) {
      throw new NotFoundException('No accepted proposal found for this project');
    }

    // Verify user is the developer
    if (proposal.submitted_by !== userId) {
      throw new ForbiddenException('Only the developer who submitted the proposal can generate milestones');
    }

    // Build AI prompt with project details
    const prompt = `You are a professional project manager helping a developer create a detailed milestone plan for a software project.

Project Details:
- Name: ${project.name}
- Description: ${project.description || 'Not provided'}
- Type: ${project.project_type || 'Software Development'}
- Budget: $${project.budget_max || project.estimated_cost || 'Not specified'}
- Timeline: ${project.estimated_duration_days ? project.estimated_duration_days + ' days' : 'Not specified'}
- Start Date: ${project.start_date || 'Not specified'}
- Expected Completion: ${project.expected_completion_date || 'Not specified'}
- Tech Stack: ${JSON.stringify(project.tech_stack || [])}
- Frameworks: ${JSON.stringify(project.frameworks || [])}
- Features Required: ${JSON.stringify(project.features || [])}
- Requirements: ${JSON.stringify(project.requirements || {})}

Proposal Details:
- Proposed Budget: $${proposal.proposed_budget || 'Not specified'}
- Estimated Duration: ${proposal.estimated_duration || 'Not specified'}
- Approach: ${proposal.approach || 'Not provided'}

Please create a comprehensive milestone plan with both PROJECT-LEVEL DETAILS and 4-6 MILESTONES.

Return ONLY a valid JSON object (NOT an array) with this structure:

{
  "projectOverview": "2-3 paragraph executive summary of the project, its goals, and expected outcomes",
  "technicalApproach": "2-3 paragraph description of the technical methodology, architecture, and implementation strategy",
  "toolsAndTechnologies": ["React", "Node.js", "PostgreSQL", "AWS", "Docker"],
  "communicationPlan": "1-2 paragraph description of how progress will be communicated, frequency of updates, preferred channels, meeting schedules",
  "assumptions": ["Client will provide timely feedback", "Required APIs will be accessible", "Design assets will be ready by milestone 2"],
  "risks": ["Third-party API downtime - mitigation: implement caching and fallback", "Scope creep - mitigation: strict change request process"],
  "testingStrategy": "1-2 paragraph description of testing approach, QA process, and quality metrics",
  "milestones": [
    {
      "name": "Project Setup & Architecture",
      "description": "Set up development environment, establish project architecture, and configure essential tools.",
      "deliverables": ["Repository setup with CI/CD", "Database schema design", "API documentation"],
      "acceptanceCriteria": ["All developers can run locally", "CI/CD is functional", "Schema approved"],
      "estimatedHours": 40,
      "budgetAllocation": 2000,
      "dependencies": [],
      "riskLevel": "low",
      "riskMitigation": "Well-established patterns reduce risks",
      "technicalNotes": "Using modern stack with containerization",
      "order": 1,
      "duration": "1 week"
    }
  ]
}

Important guidelines:
- Project-level details should be professional and comprehensive
- Milestones should be sequential and logical
- Budget allocation should sum to the total proposed budget
- First milestone should be setup/planning, last should be deployment/handoff
- Include testing and quality assurance milestones
- Be specific and realistic with estimates
- Tools should match the project's tech stack
- Assumptions should be realistic and based on project requirements
- Risks should include mitigation strategies`;

    try {
      // Use database AI to generate milestone suggestions
      const response = await /* TODO: use OpenAI */ this.db.client.ai.generateText(prompt, {
        systemMessage: 'You are a professional project manager creating detailed milestone plans.',
      });

      console.log('AI Response:', response);

      // Parse the AI response with error recovery
      let aiPlan;
      try {
        // Try to extract JSON from response
        const text = typeof response === 'string' ? response : (response.text || '');
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        let jsonText = jsonMatch ? jsonMatch[0] : text;

        // Try to fix truncated JSON by closing incomplete arrays/objects
        try {
          aiPlan = JSON.parse(jsonText);
        } catch (parseError) {
          console.warn('First parse attempt failed, trying to repair JSON...');

          // Count opening/closing braces and brackets to fix truncation
          const openBraces = (jsonText.match(/\{/g) || []).length;
          const closeBraces = (jsonText.match(/\}/g) || []).length;
          const openBrackets = (jsonText.match(/\[/g) || []).length;
          const closeBrackets = (jsonText.match(/\]/g) || []).length;

          // Add missing closing characters
          let repairedJson = jsonText;

          // Close incomplete strings (if any)
          const lastQuote = repairedJson.lastIndexOf('"');
          const lastComma = repairedJson.lastIndexOf(',');
          const lastBrace = repairedJson.lastIndexOf('}');
          const lastBracket = repairedJson.lastIndexOf(']');

          // If truncated in the middle of a string, close it
          if (lastQuote > Math.max(lastComma, lastBrace, lastBracket)) {
            repairedJson += '"';
          }

          // Add missing closing brackets for arrays
          for (let i = 0; i < openBrackets - closeBrackets; i++) {
            repairedJson += ']';
          }

          // Add missing closing braces for objects
          for (let i = 0; i < openBraces - closeBraces; i++) {
            repairedJson += '}';
          }

          console.log('Repaired JSON length:', repairedJson.length);
          aiPlan = JSON.parse(repairedJson);
        }
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError);
        const responseText = typeof response === 'string' ? response : (response.text || '');
        console.error('Response text preview:', responseText.substring(0, 500));
        throw new BadRequestException('Failed to parse AI-generated plan. Please try again.');
      }

      // Validate and ensure all required fields are present for milestones
      const milestones = aiPlan.milestones || [];
      const validatedMilestones = milestones.map((milestone: any, index: number) => ({
        name: milestone.name || `Milestone ${index + 1}`,
        description: milestone.description || '',
        deliverables: Array.isArray(milestone.deliverables) ? milestone.deliverables : [],
        acceptanceCriteria: Array.isArray(milestone.acceptanceCriteria) ? milestone.acceptanceCriteria : [],
        estimatedHours: milestone.estimatedHours || 0,
        budgetAllocation: milestone.budgetAllocation || 0,
        dependencies: Array.isArray(milestone.dependencies) ? milestone.dependencies : [],
        riskLevel: milestone.riskLevel || 'medium',
        riskMitigation: milestone.riskMitigation || '',
        technicalNotes: milestone.technicalNotes || '',
        order: milestone.order || index + 1,
        duration: milestone.duration || '',
      }));

      return {
        milestones: validatedMilestones,
        projectId,
        proposalId: proposal.id,
        // Project-level details
        projectOverview: aiPlan.projectOverview || '',
        technicalApproach: aiPlan.technicalApproach || '',
        toolsAndTechnologies: Array.isArray(aiPlan.toolsAndTechnologies) ? aiPlan.toolsAndTechnologies : [],
        communicationPlan: aiPlan.communicationPlan || '',
        assumptions: Array.isArray(aiPlan.assumptions) ? aiPlan.assumptions : [],
        risks: Array.isArray(aiPlan.risks) ? aiPlan.risks : [],
        testingStrategy: aiPlan.testingStrategy || '',
      };
    } catch (error) {
      console.error('AI generation error:', error);
      throw new BadRequestException('Failed to generate AI milestones: ' + error.message);
    }
  }

  /**
   * Get accepted proposal ID for a project
   */
  async getAcceptedProposalId(projectId: string, userId: string): Promise<string> {
    // Get project
    const project = await this.db.findOne('projects', { id: projectId });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    console.log(`🔍 Looking for accepted proposal for project: ${projectId}`);

    // Find accepted proposal
    const acceptedProposal = await this.db.findOne('project_proposals', {
      project_id: projectId,
      status: 'accepted',
    });

    if (!acceptedProposal) {
      console.error('❌ No accepted proposal found!');
      console.log('Project status:', project.status);
      console.log('Assigned company:', project.assigned_company_id);
      throw new NotFoundException('No accepted proposal found for this project. A proposal must be accepted before creating milestones.');
    }

    console.log(`✅ Found accepted proposal: ${acceptedProposal.id}`);

    // Verify user has access to this project
    const isClient = project.client_id === userId;
    const isDeveloper = acceptedProposal.submitted_by === userId;

    // Check if user is a project member
    const isProjectMember = await this.isProjectMember(userId, projectId);

    if (!isClient && !isDeveloper && !isProjectMember) {
      throw new ForbiddenException('You do not have access to this project');
    }

    return acceptedProposal.id;
  }

  private mapToResponseDto(plan: any): MilestonePlanResponseDto {
    // Parse metadata to get project-level details
    const metadata = typeof plan.metadata === 'string' ? JSON.parse(plan.metadata) : (plan.metadata || {});

    return {
      id: plan.id,
      projectId: plan.project_id,
      proposalId: plan.proposal_id,
      submittedBy: plan.submitted_by,
      status: plan.status,
      milestones: typeof plan.milestones === 'string' ? JSON.parse(plan.milestones) : (plan.milestones || []),
      submittedAt: plan.submitted_at,
      reviewedBy: plan.reviewed_by,
      reviewedAt: plan.reviewed_at,
      clientFeedback: plan.client_feedback,
      revisionCount: plan.revision_count,
      version: plan.version,
      createdAt: plan.created_at,
      updatedAt: plan.updated_at,
      // Project-level details from metadata
      projectOverview: metadata.projectOverview || undefined,
      technicalApproach: metadata.technicalApproach || undefined,
      toolsAndTechnologies: metadata.toolsAndTechnologies || undefined,
      communicationPlan: metadata.communicationPlan || undefined,
      assumptions: metadata.assumptions || undefined,
      risks: metadata.risks || undefined,
      testingStrategy: metadata.testingStrategy || undefined,
    };
  }
}
