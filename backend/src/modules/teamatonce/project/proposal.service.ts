import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { NotificationType, NotificationPriority } from '../../notifications/dto';
import {
  CreateProposalDto,
  UpdateProposalDto,
  ReviewProposalDto,
  ProposalResponseDto,
  ProposalsListResponseDto,
  BrowseableProjectResponseDto,
  BrowseableProjectsResponseDto,
  ProposalStatus,
} from './dto/proposal.dto';
import { ProjectMemberService } from './project-member.service';

@Injectable()
export class ProposalService {
  constructor(
    private readonly db: DatabaseService,
    @Inject(forwardRef(() => ProjectMemberService))
    private readonly projectMemberService: ProjectMemberService,
    @Inject(forwardRef(() => NotificationsService))
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Submit a proposal for a project
   */
  async submitProposal(
    userId: string,
    companyId: string,
    dto: CreateProposalDto,
  ): Promise<ProposalResponseDto> {
    // Check if project exists and is open for proposals
    const project = await this.db.findOne('projects', {
      id: dto.projectId,
      deleted_at: null,
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Check if project is already assigned to a developer company
    if (project.assigned_company_id) {
      throw new BadRequestException('This project has already been assigned to a developer company');
    }

    // Check if project is still open
    if (project.status !== 'planning') {
      throw new BadRequestException('This project is no longer open for proposals');
    }

    // Check if company already submitted a proposal
    const existingProposal = await this.db.findOne('project_proposals', {
      project_id: dto.projectId,
      company_id: companyId,
    });

    if (existingProposal) {
      throw new BadRequestException('Your company has already submitted a proposal for this project');
    }

    // Create proposal
    const proposalData = {
      project_id: dto.projectId,
      company_id: companyId,
      submitted_by: userId,
      cover_letter: dto.coverLetter || null,
      proposed_cost: dto.proposedCost,
      currency: dto.currency || 'USD',
      proposed_duration_days: dto.proposedDurationDays,
      proposed_start_date: dto.proposedStartDate || null,
      proposed_milestones: JSON.stringify(dto.proposedMilestones || []),
      team_composition: JSON.stringify(dto.teamComposition || []),
      similar_projects: JSON.stringify(dto.similarProjects || []),
      status: 'pending',
    };

    const proposal = await this.db.insert('project_proposals', proposalData);

    // Notify the project client about the new proposal
    try {
      const company = await this.db.findOne('developer_companies', { id: companyId });
      await this.notificationsService.sendNotification({
        user_id: project.client_id,
        type: NotificationType.UPDATE,
        title: 'New Proposal Received',
        message: `${company?.display_name || company?.company_name || 'A developer company'} has submitted a proposal for your project "${project.name}" with a budget of $${dto.proposedCost}.`,
        priority: NotificationPriority.HIGH,
        action_url: `/project/${dto.projectId}/proposals`,
        data: {
          projectId: dto.projectId,
          proposalId: proposal.id,
          companyId,
          proposedCost: dto.proposedCost,
        },
        send_push: true,
        send_email: true,
      });
    } catch (error) {
      console.error('[ProposalService] Failed to send proposal submission notification:', error);
    }

    return this.mapProposalToDto(proposal);
  }

  /**
   * Get all proposals for a project (Client only)
   */
  async getProjectProposals(
    userId: string,
    projectId: string,
  ): Promise<ProposalsListResponseDto> {
    // Verify user owns the project
    const project = await this.db.findOne('projects', {
      id: projectId,
      deleted_at: null,
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.client_id !== userId) {
      throw new ForbiddenException('You do not have access to this project');
    }

    // Get project required skills
    const projectTechStack = typeof project.tech_stack === 'string'
      ? JSON.parse(project.tech_stack)
      : (project.tech_stack || []);

    const requirements = typeof project.requirements === 'string'
      ? JSON.parse(project.requirements)
      : (project.requirements || {});

    const requiredSkills = [
      ...projectTechStack,
      ...(requirements.skills || []),
    ];

    // Get all proposals for this project
    const proposals = await this.db.findMany('project_proposals', {
      project_id: projectId,
    });

    // Get company details and calculate match score for each proposal
    const enrichedProposals = await Promise.all(
      proposals.map(async (proposal) => {
        const company = await this.db.findOne('developer_companies', { id: proposal.company_id });

        // Get seller's skills from company_team_members (the person who submitted the proposal)
        const sellerMember = await this.db.findOne('company_team_members', {
          company_id: proposal.company_id,
          user_id: proposal.submitted_by,
        });

        let sellerSkills: string[] = [];
        if (sellerMember?.skills) {
          sellerSkills = typeof sellerMember.skills === 'string'
            ? JSON.parse(sellerMember.skills)
            : sellerMember.skills;
        }

        // Calculate match score
        const matchResult = await this.calculateAIMatchScore(sellerSkills, requiredSkills);

        return {
          ...this.mapProposalToDto(proposal),
          company_name: company?.display_name || company?.company_name || 'Unknown Company',
          matchScore: matchResult.score,
          matchedSkills: matchResult.matchedSkills,
          missingSkills: matchResult.missingSkills,
          sellerSkills: sellerSkills,
        };
      })
    );

    return {
      proposals: enrichedProposals,
      total: enrichedProposals.length,
    };
  }

  /**
   * Get company's submitted proposals (Developer view)
   */
  async getCompanyProposals(
    companyId: string,
  ): Promise<ProposalsListResponseDto> {
    const proposals = await this.db.findMany('project_proposals', {
      company_id: companyId,
    });

    // Enrich proposals with project information
    const enrichedProposals = await Promise.all(
      proposals.map(async (proposal) => {
        // Fetch project details
        const project = await this.db.findOne('projects', {
          id: proposal.project_id,
        });

        return {
          ...this.mapProposalToDto(proposal),
          project: project
            ? {
                id: project.id,
                name: project.name,
                description: project.description,
                budget: project.budget,
                status: project.status,
              }
            : null,
        };
      })
    );

    return {
      proposals: enrichedProposals,
      total: enrichedProposals.length,
    };
  }

  /**
   * Get single proposal
   */
  async getProposal(proposalId: string): Promise<ProposalResponseDto> {
    const proposal = await this.db.findOne('project_proposals', {
      id: proposalId,
    });

    if (!proposal) {
      throw new NotFoundException('Proposal not found');
    }

    // Get company details
    const company = await this.db.findOne('developer_companies', { id: proposal.company_id });

    return {
      ...this.mapProposalToDto(proposal),
      company: company
        ? {
            id: company.id,
            name: company.company_name || company.display_name,
            logo: company.logo_url,
          }
        : undefined,
    };
  }

  /**
   * Update proposal (before review)
   */
  async updateProposal(
    userId: string,
    companyId: string,
    proposalId: string,
    dto: UpdateProposalDto,
  ): Promise<ProposalResponseDto> {
    // Get proposal
    const proposal = await this.db.findOne('project_proposals', {
      id: proposalId,
    });

    if (!proposal) {
      throw new NotFoundException('Proposal not found');
    }

    // Check ownership
    if (proposal.company_id !== companyId) {
      throw new ForbiddenException('You do not have permission to update this proposal');
    }

    // Check if proposal is still pending
    if (proposal.status !== 'pending') {
      throw new BadRequestException('Cannot update a proposal that has been reviewed');
    }

    // Build update data
    const updateData: any = { updated_at: new Date().toISOString() };

    if (dto.coverLetter !== undefined) updateData.cover_letter = dto.coverLetter;
    if (dto.proposedCost !== undefined) updateData.proposed_cost = dto.proposedCost;
    if (dto.proposedDurationDays !== undefined) updateData.proposed_duration_days = dto.proposedDurationDays;
    if (dto.proposedStartDate !== undefined) updateData.proposed_start_date = dto.proposedStartDate;
    if (dto.proposedMilestones !== undefined) updateData.proposed_milestones = JSON.stringify(dto.proposedMilestones);
    if (dto.teamComposition !== undefined) updateData.team_composition = JSON.stringify(dto.teamComposition);

    await this.db.update('project_proposals', proposalId, updateData);

    return this.getProposal(proposalId);
  }

  /**
   * Review proposal (Client only - accept or reject)
   */
  async reviewProposal(
    userId: string,
    proposalId: string,
    dto: ReviewProposalDto,
  ): Promise<ProposalResponseDto> {
    // Get proposal
    const proposal = await this.db.findOne('project_proposals', {
      id: proposalId,
    });

    if (!proposal) {
      throw new NotFoundException('Proposal not found');
    }

    // Get project
    const project = await this.db.findOne('projects', {
      id: proposal.project_id,
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Check if user is the project owner
    if (project.client_id !== userId) {
      throw new ForbiddenException('Only the project owner can review proposals');
    }

    // Check if proposal is pending
    if (proposal.status !== 'pending') {
      throw new BadRequestException('This proposal has already been reviewed');
    }

    // Update proposal status
    await this.db.update('project_proposals', proposalId, {
      status: dto.status,
      reviewed_by: userId,
      reviewed_at: new Date().toISOString(),
      review_notes: dto.reviewNotes || null,
      updated_at: new Date().toISOString(),
    });

    // If accepted, assign project to company and reject other proposals
    if (dto.status === ProposalStatus.ACCEPTED) {
      // Assign project to the developer company (keep original company_id as creator)
      // Set status to 'awarded' - project enters "awarded" phase waiting for milestone plan
      await this.db.update('projects', project.id, {
        assigned_company_id: proposal.company_id, // Assign to developer company
        status: 'awarded', // Change status to awarded
        awarded_at: new Date().toISOString(), // Mark as awarded
        updated_at: new Date().toISOString(),
      });

      // Add the developer who submitted the proposal as a project member
      try {
        await this.projectMemberService.addDeveloperToProject(
          project.id,
          proposal.submitted_by,
          proposal.company_id,
        );
        console.log(
          `[ProposalService] Developer ${proposal.submitted_by} added as member to project ${project.id}`,
        );
      } catch (error) {
        console.error('[ProposalService] Failed to add developer as project member:', error);
        // Don't fail proposal acceptance if member addition fails
      }

      // Reject all other pending proposals for this project
      const otherProposals = await this.db.findMany('project_proposals', {
        project_id: proposal.project_id,
        status: 'pending',
      });

      await Promise.all(
        otherProposals
          .filter(p => p.id !== proposalId)
          .map(p =>
            this.db.update('project_proposals', p.id, {
              status: 'rejected',
              reviewed_by: userId,
              reviewed_at: new Date().toISOString(),
              review_notes: 'Another proposal was accepted',
              updated_at: new Date().toISOString(),
            })
          )
      );

      // Notify rejected proposals' submitters
      for (const rejectedProposal of otherProposals.filter(p => p.id !== proposalId)) {
        try {
          await this.notificationsService.sendNotification({
            user_id: rejectedProposal.submitted_by,
            type: NotificationType.UPDATE,
            title: 'Proposal Not Selected',
            message: `Your proposal for project "${project.name}" was not selected. The client has chosen another developer.`,
            priority: NotificationPriority.NORMAL,
            action_url: `/proposals`,
            data: {
              projectId: project.id,
              proposalId: rejectedProposal.id,
              status: 'rejected',
            },
          });
        } catch (error) {
          console.error('[ProposalService] Failed to send rejection notification:', error);
        }
      }
    }

    // Notify the proposal submitter about the review decision
    try {
      const isAccepted = dto.status === ProposalStatus.ACCEPTED;
      await this.notificationsService.sendNotification({
        user_id: proposal.submitted_by,
        type: isAccepted ? NotificationType.ACHIEVEMENT : NotificationType.UPDATE,
        title: isAccepted ? 'Proposal Accepted!' : 'Proposal Update',
        message: isAccepted
          ? `Congratulations! Your proposal for project "${project.name}" has been accepted. Please create a detailed milestone plan for client approval before starting work.`
          : `Your proposal for project "${project.name}" was not selected.${dto.reviewNotes ? ` Feedback: ${dto.reviewNotes}` : ''}`,
        priority: NotificationPriority.HIGH,
        action_url: isAccepted ? `/projects/${project.id}/milestone-planning` : `/proposals`,
        data: {
          projectId: project.id,
          proposalId,
          status: dto.status,
          reviewNotes: dto.reviewNotes,
        },
        send_push: true,
        send_email: true,
      });
    } catch (error) {
      console.error('[ProposalService] Failed to send proposal review notification:', error);
    }

    return this.getProposal(proposalId);
  }

  /**
   * Withdraw proposal (Developer)
   */
  async withdrawProposal(
    userId: string,
    companyId: string,
    proposalId: string,
  ): Promise<ProposalResponseDto> {
    const proposal = await this.db.findOne('project_proposals', {
      id: proposalId,
    });

    if (!proposal) {
      throw new NotFoundException('Proposal not found');
    }

    if (proposal.company_id !== companyId) {
      throw new ForbiddenException('You do not have permission to withdraw this proposal');
    }

    if (proposal.status !== 'pending') {
      throw new BadRequestException('Can only withdraw pending proposals');
    }

    await this.db.update('project_proposals', proposalId, {
      status: 'withdrawn',
      updated_at: new Date().toISOString(),
    });

    return this.getProposal(proposalId);
  }

  /**
   * Get browseable projects (open for proposals, not assigned)
   * Projects are first sorted by date (most recent), then paginated,
   * then each page is re-sorted by AI match score (highest first)
   */
  async getBrowseableProjects(
    companyId: string,
    userId: string,
    filters?: {
      projectType?: string;
      techStack?: string[];
      minBudget?: number;
      maxBudget?: number;
    },
    page: number = 1,
    limit: number = 20
  ): Promise<BrowseableProjectsResponseDto> {
    // Get seller's skills from company_team_members
    const sellerMember = await this.db.findOne('company_team_members', {
      company_id: companyId,
      user_id: userId,
    });

    let sellerSkills: string[] = [];
    if (sellerMember?.skills) {
      sellerSkills = typeof sellerMember.skills === 'string'
        ? JSON.parse(sellerMember.skills)
        : sellerMember.skills;
    }

    // Build conditions
    const conditions: any = {
      assigned_company_id: null, // Not assigned to any developer company
      status: 'planning', // Still in planning phase
      deleted_at: null,
    };

    if (filters?.projectType) {
      conditions.project_type = filters.projectType;
    }

    // Get projects
    let projects = await this.db.findMany('projects', conditions);

    // Apply additional filters
    if (filters?.minBudget) {
      projects = projects.filter(p => p.estimated_cost >= filters.minBudget);
    }

    if (filters?.maxBudget) {
      projects = projects.filter(p => p.estimated_cost <= filters.maxBudget);
    }

    if (filters?.techStack && filters.techStack.length > 0) {
      projects = projects.filter(p => {
        const projectTechStack = typeof p.tech_stack === 'string'
          ? JSON.parse(p.tech_stack)
          : p.tech_stack;
        return filters.techStack.some(tech =>
          projectTechStack?.some((pTech: string) =>
            pTech.toLowerCase().includes(tech.toLowerCase())
          )
        );
      });
    }

    // STEP 1: Sort all projects by date (most recent first)
    projects.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return dateB - dateA; // Descending (most recent first)
    });

    // Calculate pagination
    const total = projects.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const hasMore = page < totalPages;

    // STEP 2: Get the page slice (e.g., 20 projects for this page)
    const paginatedProjects = projects.slice(offset, offset + limit);

    // STEP 3: Enrich with proposal counts, hasProposal flag, AI match score, and client info
    const enrichedProjects = await Promise.all(
      paginatedProjects.map(async (project) => {
        const proposals = await this.db.findMany('project_proposals', {
          project_id: project.id,
        });

        const hasProposal = proposals.some(p => p.company_id === companyId);

        // Get project required skills from tech_stack and requirements
        const projectTechStack = typeof project.tech_stack === 'string'
          ? JSON.parse(project.tech_stack)
          : (project.tech_stack || []);

        const requirements = typeof project.requirements === 'string'
          ? JSON.parse(project.requirements)
          : (project.requirements || {});

        const requiredSkills = [
          ...projectTechStack,
          ...(requirements.skills || []),
        ];

        // Calculate AI match score
        const matchResult = await this.calculateAIMatchScore(sellerSkills, requiredSkills);

        // Get client info using auth service service
        let clientInfo: { id: string; name?: string; avatar?: string } | undefined;
        if (project.client_id) {
          const client = await this.db.getUserById(project.client_id);
          if (client) {
            clientInfo = {
              id: project.client_id, // Use the client_id we already have
              name: client.name || client.email?.split('@')[0],
              avatar: client.avatar_url,
            };
          } else {
            // Fallback: show client info with just the ID if user lookup fails
            clientInfo = {
              id: project.client_id,
              name: 'Client',
            };
          }
        }

        return this.mapProjectToDto(
          project,
          proposals.length,
          hasProposal,
          matchResult.score,
          matchResult.matchedSkills,
          matchResult.missingSkills,
          clientInfo,
        );
      })
    );

    // STEP 4: Re-sort this page's projects by AI match score (highest first)
    enrichedProjects.sort((a, b) => b.matchScore - a.matchScore);

    return {
      projects: enrichedProjects,
      total,
      page,
      limit,
      totalPages,
      hasMore,
    };
  }

  /**
   * Calculate AI match score between seller skills and project required skills
   */
  private async calculateAIMatchScore(
    sellerSkills: string[],
    requiredSkills: string[],
  ): Promise<{ score: number; matchedSkills: string[]; missingSkills: string[] }> {
    // If no required skills, return high match
    if (!requiredSkills || requiredSkills.length === 0) {
      return { score: 85, matchedSkills: [], missingSkills: [] };
    }

    // If seller has no skills, return low match
    if (!sellerSkills || sellerSkills.length === 0) {
      return { score: 20, matchedSkills: [], missingSkills: requiredSkills };
    }

    try {
      // Use database AI to calculate match score
      const prompt = `You are an AI assistant that calculates skill match scores for freelance projects.

Given:
- Seller's Skills: ${JSON.stringify(sellerSkills)}
- Project Required Skills: ${JSON.stringify(requiredSkills)}

Analyze the match between the seller's skills and the project requirements. Consider:
1. Exact skill matches (highest weight)
2. Related/similar skills (e.g., "React" relates to "React Native", "JavaScript" relates to "TypeScript")
3. Transferable skills (e.g., "Frontend Development" covers "React", "Vue", "Angular")
4. Skill categories (e.g., "Web Development" covers many web-related skills)

Return ONLY a valid JSON object in this exact format (no markdown, no explanation):
{"score": <number 0-100>, "matchedSkills": [<list of matched skills>], "missingSkills": [<list of skills seller is missing>]}

The score should be:
- 90-100: Perfect or near-perfect match
- 70-89: Strong match with most required skills
- 50-69: Moderate match with some required skills
- 30-49: Weak match with few required skills
- 0-29: Poor match with almost no relevant skills`;

      const aiResponse: any = await /* TODO: use OpenAI directly */ this.db.generateText(prompt);

      // Parse AI response
      let result: { score: number; matchedSkills: string[]; missingSkills: string[] };
      let responseText: string;

      // Extract text from response (could be string or object with text property)
      if (typeof aiResponse === 'string') {
        responseText = aiResponse;
      } else if (aiResponse?.text) {
        responseText = aiResponse.text;
      } else if (aiResponse?.content) {
        responseText = aiResponse.content;
      } else {
        throw new Error('Invalid AI response format');
      }

      // Clean up the response - remove markdown code blocks if present
      let cleanResponse = responseText.trim();
      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/```json\n?/, '').replace(/\n?```$/, '');
      } else if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/```\n?/, '').replace(/\n?```$/, '');
      }
      result = JSON.parse(cleanResponse);

      // Ensure score is within bounds
      result.score = Math.max(0, Math.min(100, result.score));

      return {
        score: result.score,
        matchedSkills: result.matchedSkills || [],
        missingSkills: result.missingSkills || [],
      };
    } catch (error) {
      console.error('[ProposalService] AI match score calculation failed:', error);
      // Fallback to simple matching if AI fails
      return this.calculateSimpleMatchScore(sellerSkills, requiredSkills);
    }
  }

  /**
   * Fallback simple match score calculation
   */
  private calculateSimpleMatchScore(
    sellerSkills: string[],
    requiredSkills: string[],
  ): { score: number; matchedSkills: string[]; missingSkills: string[] } {
    const normalizedSellerSkills = sellerSkills.map(s => s.toLowerCase().trim());
    const normalizedRequiredSkills = requiredSkills.map(s => s.toLowerCase().trim());

    const matchedSkills: string[] = [];
    const missingSkills: string[] = [];

    for (const required of requiredSkills) {
      const normalizedRequired = required.toLowerCase().trim();
      const isMatched = normalizedSellerSkills.some(skill =>
        skill.includes(normalizedRequired) || normalizedRequired.includes(skill)
      );

      if (isMatched) {
        matchedSkills.push(required);
      } else {
        missingSkills.push(required);
      }
    }

    // Calculate score
    const matchRatio = requiredSkills.length > 0
      ? matchedSkills.length / requiredSkills.length
      : 0;

    // Score ranges from 20 (no match) to 95 (perfect match)
    const score = Math.round(20 + (matchRatio * 75));

    return { score, matchedSkills, missingSkills };
  }

  /**
   * Map database row to ProposalResponseDto
   */
  private mapProposalToDto(row: any): ProposalResponseDto {
    return {
      id: row.id,
      projectId: row.project_id,
      companyId: row.company_id,
      submittedBy: row.submitted_by,
      coverLetter: row.cover_letter,
      proposedCost: parseFloat(row.proposed_cost),
      currency: row.currency,
      proposedDurationDays: row.proposed_duration_days,
      proposedStartDate: row.proposed_start_date,
      status: row.status,
      reviewedBy: row.reviewed_by,
      reviewedAt: row.reviewed_at,
      reviewNotes: row.review_notes,
      proposedMilestones: typeof row.proposed_milestones === 'string'
        ? JSON.parse(row.proposed_milestones)
        : row.proposed_milestones,
      teamComposition: typeof row.team_composition === 'string'
        ? JSON.parse(row.team_composition)
        : row.team_composition,
      similarProjects: typeof row.similar_projects === 'string'
        ? JSON.parse(row.similar_projects)
        : row.similar_projects,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  /**
   * Map project to BrowseableProjectResponseDto
   */
  private mapProjectToDto(
    row: any,
    proposalsCount: number,
    hasProposal: boolean,
    matchScore: number = 0,
    matchedSkills: string[] = [],
    missingSkills: string[] = [],
    client?: { id: string; name?: string; avatar?: string },
  ): BrowseableProjectResponseDto {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      projectType: row.project_type,
      status: row.status,
      estimatedCost: row.estimated_cost ? parseFloat(row.estimated_cost) : 0,
      currency: row.currency,
      estimatedDurationDays: row.estimated_duration_days,
      startDate: row.start_date,
      expectedCompletionDate: row.expected_completion_date,
      techStack: typeof row.tech_stack === 'string' ? JSON.parse(row.tech_stack) : row.tech_stack,
      frameworks: typeof row.frameworks === 'string' ? JSON.parse(row.frameworks) : row.frameworks,
      features: typeof row.features === 'string' ? JSON.parse(row.features) : row.features,
      requirements: typeof row.requirements === 'string' ? JSON.parse(row.requirements) : row.requirements,
      clientId: row.client_id,
      proposalsCount,
      hasProposal,
      matchScore,
      matchedSkills,
      missingSkills,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      client,
    };
  }
}
