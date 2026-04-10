import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { NotificationType, NotificationPriority } from '../../notifications/dto';
import {
  CreateHireRequestDto,
  UpdateHireRequestDto,
  ReviewHireRequestDto,
  HireRequestResponseDto,
  HireRequestsListResponseDto,
  HireRequestStatus,
  PaymentType,
} from './dto/hire-request.dto';

@Injectable()
export class HireRequestService {
  constructor(
    private readonly db: DatabaseService,
    @Inject(forwardRef(() => NotificationsService))
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Create a hire request (Client sends offer to a seller/company)
   */
  async createHireRequest(
    clientId: string,
    dto: CreateHireRequestDto,
  ): Promise<HireRequestResponseDto> {
    // Verify the company exists and is active
    const company = await this.db.findOne('developer_companies', {
      id: dto.companyId,
      is_active: true,
      deleted_at: null,
    });

    if (!company) {
      throw new NotFoundException('Seller company not found');
    }

    // Calculate total budget
    const totalBudget =
      dto.paymentType === PaymentType.HOURLY
        ? (dto.hourlyRate || 0) * (dto.estimatedHours || 0)
        : dto.fixedBudget || 0;

    // Handle project creation or linking
    let projectId = dto.projectId;

    if (!projectId) {
      // No existing project provided - create a new one immediately
      const projectData = {
        client_id: clientId,
        name: dto.title,
        description: dto.description,
        project_type: dto.paymentType === PaymentType.HOURLY ? 'hourly' : 'fixed',
        status: 'planning', // Status is 'planning' until hire request is accepted
        estimated_cost: totalBudget,
        currency: 'USD',
        start_date: dto.startDate,
        tech_stack: JSON.stringify([]),
        frameworks: JSON.stringify([]),
        features: JSON.stringify([]),
        requirements: JSON.stringify({
          category: dto.category,
          duration: dto.duration,
          additionalDetails: dto.additionalDetails,
        }),
        metadata: JSON.stringify({
          source: 'hire_request_pending', // Mark as pending hire request
        }),
      };

      const project = await this.db.insert('projects', projectData);
      projectId = project.id;

      console.log(`[HireRequest] Created new project ${projectId} for hire request`);
    } else {
      // Verify client owns this project
      const existingProject = await this.db.findOne('projects', {
        id: projectId,
        client_id: clientId,
        deleted_at: null,
      });

      if (!existingProject) {
        throw new ForbiddenException('Project not found or you do not have access');
      }

      console.log(`[HireRequest] Linking to existing project ${projectId}`);
    }

    // Create hire request
    const hireRequestData = {
      client_id: clientId,
      company_id: dto.companyId,
      project_id: projectId, // Link to project immediately
      title: dto.title,
      description: dto.description,
      category: dto.category,
      payment_type: dto.paymentType,
      hourly_rate: dto.hourlyRate || null,
      estimated_hours: dto.estimatedHours || null,
      fixed_budget: dto.fixedBudget || null,
      total_budget: totalBudget,
      start_date: dto.startDate,
      duration: dto.duration,
      additional_details: dto.additionalDetails || null,
      attachment_urls: JSON.stringify(dto.attachmentUrls || []),
      status: HireRequestStatus.PENDING,
    };

    const hireRequest = await this.db.insert('hire_requests', hireRequestData);

    // Get company owner to notify
    const companyOwner = await this.db.findOne('company_team_members', {
      company_id: dto.companyId,
      is_owner: true,
    });

    // Notify the seller about the new hire request
    if (companyOwner) {
      try {
        const client = await this.db.getUserById(clientId);
        await this.notificationsService.sendNotification({
          user_id: companyOwner.user_id,
          type: NotificationType.UPDATE,
          title: 'New Hire Request!',
          message: `${client?.name || 'A client'} wants to hire you for "${dto.title}" with a budget of $${totalBudget.toLocaleString()}.`,
          priority: NotificationPriority.HIGH,
          action_url: `/seller/hire-requests/${hireRequest.id}`,
          data: {
            hireRequestId: hireRequest.id,
            clientId,
            companyId: dto.companyId,
            totalBudget,
          },
          send_push: true,
          send_email: true,
        });
      } catch (error) {
        console.error('[HireRequestService] Failed to send hire request notification:', error);
      }
    }

    return this.getHireRequest(hireRequest.id, clientId);
  }

  /**
   * Get a single hire request
   */
  async getHireRequest(
    hireRequestId: string,
    userId: string,
  ): Promise<HireRequestResponseDto> {
    const hireRequest = await this.db.findOne('hire_requests', {
      id: hireRequestId,
      deleted_at: null,
    });

    if (!hireRequest) {
      throw new NotFoundException('Hire request not found');
    }

    // Verify user has access (client or company member)
    const isClient = hireRequest.client_id === userId;
    const isSeller = await this.isCompanyMember(hireRequest.company_id, userId);

    if (!isClient && !isSeller) {
      throw new ForbiddenException('You do not have access to this hire request');
    }

    return this.enrichHireRequest(hireRequest);
  }

  /**
   * Get hire requests sent by a client
   */
  async getClientHireRequests(clientId: string): Promise<HireRequestsListResponseDto> {
    const hireRequests = await this.db.findMany('hire_requests', {
      client_id: clientId,
      deleted_at: null,
    });

    const enrichedRequests = await Promise.all(
      hireRequests.map((hr) => this.enrichHireRequest(hr)),
    );

    // Sort by newest first
    enrichedRequests.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    return {
      hireRequests: enrichedRequests,
      total: enrichedRequests.length,
    };
  }

  /**
   * Get hire requests for a company (Seller view)
   */
  async getCompanyHireRequests(
    companyId: string,
    userId: string,
  ): Promise<HireRequestsListResponseDto> {
    // Verify user is a member of the company
    const isMember = await this.isCompanyMember(companyId, userId);
    if (!isMember) {
      throw new ForbiddenException('You do not have access to this company');
    }

    const hireRequests = await this.db.findMany('hire_requests', {
      company_id: companyId,
      deleted_at: null,
    });

    const enrichedRequests = await Promise.all(
      hireRequests.map((hr) => this.enrichHireRequest(hr)),
    );

    // Sort by newest first
    enrichedRequests.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    return {
      hireRequests: enrichedRequests,
      total: enrichedRequests.length,
    };
  }

  /**
   * Update a hire request (Client only, before seller responds)
   */
  async updateHireRequest(
    hireRequestId: string,
    clientId: string,
    dto: UpdateHireRequestDto,
  ): Promise<HireRequestResponseDto> {
    const hireRequest = await this.db.findOne('hire_requests', {
      id: hireRequestId,
      deleted_at: null,
    });

    if (!hireRequest) {
      throw new NotFoundException('Hire request not found');
    }

    if (hireRequest.client_id !== clientId) {
      throw new ForbiddenException('Only the client can update this hire request');
    }

    if (hireRequest.status !== HireRequestStatus.PENDING) {
      throw new BadRequestException('Cannot update a hire request that has been responded to');
    }

    // Build update data
    const updateData: any = { updated_at: new Date().toISOString() };

    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.category !== undefined) updateData.category = dto.category;
    if (dto.paymentType !== undefined) updateData.payment_type = dto.paymentType;
    if (dto.hourlyRate !== undefined) updateData.hourly_rate = dto.hourlyRate;
    if (dto.estimatedHours !== undefined) updateData.estimated_hours = dto.estimatedHours;
    if (dto.fixedBudget !== undefined) updateData.fixed_budget = dto.fixedBudget;
    if (dto.startDate !== undefined) updateData.start_date = dto.startDate;
    if (dto.duration !== undefined) updateData.duration = dto.duration;
    if (dto.additionalDetails !== undefined) updateData.additional_details = dto.additionalDetails;
    if (dto.attachmentUrls !== undefined) updateData.attachment_urls = JSON.stringify(dto.attachmentUrls);

    // Recalculate total budget if payment details changed
    const paymentType = dto.paymentType || hireRequest.payment_type;
    const hourlyRate = dto.hourlyRate ?? hireRequest.hourly_rate;
    const estimatedHours = dto.estimatedHours ?? hireRequest.estimated_hours;
    const fixedBudget = dto.fixedBudget ?? hireRequest.fixed_budget;

    updateData.total_budget =
      paymentType === PaymentType.HOURLY
        ? (hourlyRate || 0) * (estimatedHours || 0)
        : fixedBudget || 0;

    await this.db.update('hire_requests', hireRequestId, updateData);

    return this.getHireRequest(hireRequestId, clientId);
  }

  /**
   * Review hire request (Seller accepts or rejects)
   */
  async reviewHireRequest(
    hireRequestId: string,
    userId: string,
    dto: ReviewHireRequestDto,
  ): Promise<HireRequestResponseDto> {
    const hireRequest = await this.db.findOne('hire_requests', {
      id: hireRequestId,
      deleted_at: null,
    });

    if (!hireRequest) {
      throw new NotFoundException('Hire request not found');
    }

    // Verify user is either:
    // 1. A member of the company (seller responding)
    // 2. OR the client who created the hire request (client negotiating)
    const isMember = await this.isCompanyMember(hireRequest.company_id, userId);
    const isClient = hireRequest.client_id === userId;

    if (!isMember && !isClient) {
      throw new ForbiddenException('Only company members or the client can respond to hire requests');
    }

    // Allow responses for:
    // - Sellers: when status is PENDING (first response) or NEGOTIATING (counter-offer)
    // - Clients: anytime during negotiation
    const allowedStatuses = [HireRequestStatus.PENDING, HireRequestStatus.NEGOTIATING];
    if (!allowedStatuses.includes(hireRequest.status as HireRequestStatus)) {
      throw new BadRequestException(`Cannot respond to hire request with status: ${hireRequest.status}`);
    }

    // Update status
    await this.db.update('hire_requests', hireRequestId, {
      status: dto.status,
      response_message: dto.responseMessage || null,
      responded_at: new Date().toISOString(),
      responded_by: userId,
      updated_at: new Date().toISOString(),
    });

    // If accepted, update the existing project status to 'awarded'
    if (dto.status === HireRequestStatus.ACCEPTED) {
      try {
        if (hireRequest.project_id) {
          await this.db.update('projects', hireRequest.project_id, {
            assigned_company_id: hireRequest.company_id,
            status: 'awarded', // Change from 'planning' to 'awarded'
            awarded_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            metadata: JSON.stringify({
              source: 'hire_request',
              hire_request_id: hireRequest.id,
            }),
          });

          // Add company team members to project
          await this.addCompanyMembersToProject(hireRequest.project_id, hireRequest.company_id);

          console.log(`[HireRequest] Project ${hireRequest.project_id} awarded to company ${hireRequest.company_id}`);
        }
      } catch (error) {
        console.error('[HireRequestService] Failed to update project status:', error);
      }
    }

    // Send notification to the other party
    try {
      const company = await this.db.findOne('developer_companies', { id: hireRequest.company_id });
      const isAccepted = dto.status === HireRequestStatus.ACCEPTED;

      if (isClient) {
        // Client responded - notify the seller/company
        // Get company members to notify
        const members = await this.db.findMany('company_members', {
          company_id: hireRequest.company_id,
          deleted_at: null,
        });

        // Notify all company members
        for (const member of members) {
          await this.notificationsService.sendNotification({
            user_id: member.user_id,
            type: NotificationType.UPDATE,
            title: 'Client Responded to Hire Request',
            message: isAccepted
              ? `Client has accepted your offer for "${hireRequest.title}".`
              : `Client has ${dto.status === HireRequestStatus.REJECTED ? 'rejected your offer' : 'sent a counter-offer'} for "${hireRequest.title}".${dto.responseMessage ? ` Message: ${dto.responseMessage}` : ''}`,
            priority: NotificationPriority.HIGH,
            action_url: `/company/${hireRequest.company_id}/seller/hire-requests`,
            data: {
              hireRequestId,
              status: dto.status,
              clientId: hireRequest.client_id,
            },
            send_push: true,
            send_email: true,
          });
        }
      } else {
        // Seller/company responded - notify the client (existing behavior)
        await this.notificationsService.sendNotification({
          user_id: hireRequest.client_id,
          type: isAccepted ? NotificationType.ACHIEVEMENT : NotificationType.UPDATE,
          title: isAccepted ? 'Hire Request Accepted!' : 'Hire Request Update',
          message: isAccepted
            ? `${company?.display_name || company?.company_name || 'The seller'} has accepted your hire request for "${hireRequest.title}". A project has been created.`
            : `${company?.display_name || company?.company_name || 'The seller'} has ${dto.status === HireRequestStatus.REJECTED ? 'declined' : 'sent a counter-offer for'} your hire request for "${hireRequest.title}".${dto.responseMessage ? ` Message: ${dto.responseMessage}` : ''}`,
          priority: NotificationPriority.HIGH,
          action_url: isAccepted ? `/projects` : `/client/hire-requests`,
          data: {
            hireRequestId,
            status: dto.status,
            companyId: hireRequest.company_id,
          },
          send_push: true,
          send_email: true,
        });
      }
    } catch (error) {
      console.error('[HireRequestService] Failed to send response notification:', error);
    }

    return this.getHireRequest(hireRequestId, userId);
  }

  /**
   * Withdraw hire request (Client only)
   */
  async withdrawHireRequest(
    hireRequestId: string,
    clientId: string,
  ): Promise<HireRequestResponseDto> {
    const hireRequest = await this.db.findOne('hire_requests', {
      id: hireRequestId,
      deleted_at: null,
    });

    if (!hireRequest) {
      throw new NotFoundException('Hire request not found');
    }

    if (hireRequest.client_id !== clientId) {
      throw new ForbiddenException('Only the client can withdraw this hire request');
    }

    if (hireRequest.status !== HireRequestStatus.PENDING) {
      throw new BadRequestException('Can only withdraw pending hire requests');
    }

    await this.db.update('hire_requests', hireRequestId, {
      status: HireRequestStatus.WITHDRAWN,
      updated_at: new Date().toISOString(),
    });

    return this.getHireRequest(hireRequestId, clientId);
  }

  // ============================================
  // Helper Methods
  // ============================================

  /**
   * Check if user is a member of the company
   */
  private async isCompanyMember(companyId: string, userId: string): Promise<boolean> {
    const member = await this.db.findOne('company_team_members', {
      company_id: companyId,
      user_id: userId,
      status: 'active',
      deleted_at: null,
    });
    return !!member;
  }

  /**
   * Enrich hire request with client and company details
   */
  private async enrichHireRequest(hireRequest: any): Promise<HireRequestResponseDto> {
    // Get client details
    const client = await this.db.getUserById(hireRequest.client_id);

    // Get company details
    const company = await this.db.findOne('developer_companies', {
      id: hireRequest.company_id,
    });

    return {
      id: hireRequest.id,
      clientId: hireRequest.client_id,
      companyId: hireRequest.company_id,
      projectId: hireRequest.project_id,
      title: hireRequest.title,
      description: hireRequest.description,
      category: hireRequest.category,
      paymentType: hireRequest.payment_type,
      hourlyRate: hireRequest.hourly_rate ? parseFloat(hireRequest.hourly_rate) : undefined,
      estimatedHours: hireRequest.estimated_hours,
      fixedBudget: hireRequest.fixed_budget ? parseFloat(hireRequest.fixed_budget) : undefined,
      totalBudget: parseFloat(hireRequest.total_budget) || 0,
      startDate: hireRequest.start_date,
      duration: hireRequest.duration,
      additionalDetails: hireRequest.additional_details,
      attachmentUrls: this.safeJsonParse(hireRequest.attachment_urls, []),
      status: hireRequest.status,
      responseMessage: hireRequest.response_message,
      respondedAt: hireRequest.responded_at,
      createdAt: hireRequest.created_at,
      updatedAt: hireRequest.updated_at,
      client: client
        ? {
            id: client.id,
            name: client.name || client.email,
            email: client.email,
            avatar: client.avatar_url,
          }
        : undefined,
      company: company
        ? {
            id: company.id,
            name: company.display_name || company.company_name,
            logo: company.logo_url,
          }
        : undefined,
    };
  }

  /**
   * Add company team members to project
   */
  private async addCompanyMembersToProject(projectId: string, companyId: string): Promise<void> {
    try {
      const companyMembers = await this.db.findMany('company_team_members', {
        company_id: companyId,
        status: 'active',
        deleted_at: null,
      });

      for (const member of companyMembers) {
        // Check if already a project member
        const existingMember = await this.db.findOne('project_members', {
          project_id: projectId,
          user_id: member.user_id,
        });

        if (existingMember) {
          continue;
        }

        // Determine role - owner becomes lead, others are members
        const memberRole = member.is_owner ? 'lead' : 'member';

        await this.db.insert('project_members', {
          project_id: projectId,
          user_id: member.user_id,
          company_id: companyId,
          member_type: 'developer',
          role: memberRole,
          permissions: JSON.stringify(['read', 'write', 'comment']),
          joined_at: new Date().toISOString(),
          is_active: true,
        });
      }

      console.log(`[HireRequest] Added ${companyMembers.length} team members to project ${projectId}`);
    } catch (error) {
      console.error('[HireRequestService] Failed to add company members to project:', error);
      throw error;
    }
  }

  /**
   * Safely parse JSON with fallback
   */
  private safeJsonParse(value: any, fallback: any = null): any {
    if (!value) return fallback;
    if (typeof value === 'object') return value;
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }
}
