import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { NotificationType, NotificationPriority } from '../../notifications/dto';
import {
  CreateContractDto,
  UpdateContractDto,
  SignatureDto,
  ContractStatus,
} from './dto/contract.dto';

@Injectable()
export class ContractService {
  constructor(
    private readonly db: DatabaseService,
    @Inject(forwardRef(() => NotificationsService))
    private readonly notificationsService: NotificationsService,
  ) {}

  // ============================================
  // CONTRACT MANAGEMENT
  // ============================================

  /**
   * Get contract for a specific project
   */
  async getProjectContract(projectId: string) {
    const contract = await this.db.findOne('contracts', {
      project_id: projectId,
    });

    if (!contract) {
      throw new NotFoundException('Contract not found for this project');
    }

    return this.parseContractJson(contract);
  }

  /**
   * Create a new contract for a project
   */
  async createContract(projectId: string, clientId: string, dto: CreateContractDto) {
    // Check if contract already exists for this project
    const existingContract = await this.db.findOne('contracts', {
      project_id: projectId,
    });

    if (existingContract) {
      throw new BadRequestException('A contract already exists for this project');
    }

    const contractData = {
      project_id: projectId,
      client_id: clientId,
      contract_type: dto.contractType,
      status: ContractStatus.DRAFT,
      title: dto.title,
      description: dto.description || null,
      terms: dto.terms,
      scope_of_work: dto.scopeOfWork,
      total_amount: dto.totalAmount,
      currency: dto.currency || 'USD',
      payment_terms: dto.paymentTerms ? JSON.stringify(dto.paymentTerms) : JSON.stringify({}),
      hourly_rate: dto.hourlyRate || null,
      start_date: dto.startDate,
      end_date: dto.endDate,
      renewal_terms: dto.renewalTerms ? JSON.stringify(dto.renewalTerms) : JSON.stringify({}),
      attachments: dto.attachments ? JSON.stringify(dto.attachments) : JSON.stringify([]),
      client_signature: null,
      provider_signature: null,
      signed_at: null,
      contract_document_url: null,
    };

    const contract = await this.db.insert('contracts', contractData);

    // Send notification about new contract
    try {
      const project = await this.db.findOne('projects', { id: projectId });
      const notifyUserIds: string[] = [];

      // Notify project team members
      if (project?.team_lead_id && project.team_lead_id !== clientId) {
        notifyUserIds.push(project.team_lead_id);
      }
      if (project?.assigned_company_id) {
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
        await this.notificationsService.sendNotification({
          user_ids: notifyUserIds,
          type: NotificationType.UPDATE,
          title: '📝 New Contract Created',
          message: `A new contract "${dto.title}" has been created for project "${project?.name || 'Unknown'}". Please review and sign.`,
          priority: NotificationPriority.HIGH,
          action_url: `/project/${projectId}/contract`,
          data: {
            projectId,
            contractId: contract.id,
            contractTitle: dto.title,
            totalAmount: dto.totalAmount,
          },
          send_push: true,
        });
      }
    } catch (error) {
      console.error('[ContractService] Failed to send contract creation notification:', error);
    }

    return this.parseContractJson(contract);
  }

  /**
   * Update an existing contract
   */
  async updateContract(contractId: string, dto: UpdateContractDto) {
    const contract = await this.db.findOne('contracts', { id: contractId });

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    // Prevent updates if contract is already signed
    if (contract.status === ContractStatus.ACTIVE || contract.signed_at) {
      throw new BadRequestException('Cannot update a signed contract');
    }

    const updateData: any = {};

    if (dto.title) updateData.title = dto.title;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.status) updateData.status = dto.status;
    if (dto.terms) updateData.terms = dto.terms;
    if (dto.scopeOfWork) updateData.scope_of_work = dto.scopeOfWork;
    if (dto.totalAmount !== undefined) updateData.total_amount = dto.totalAmount;
    if (dto.paymentTerms) updateData.payment_terms = JSON.stringify(dto.paymentTerms);
    if (dto.hourlyRate !== undefined) updateData.hourly_rate = dto.hourlyRate;
    if (dto.startDate) updateData.start_date = dto.startDate;
    if (dto.endDate) updateData.end_date = dto.endDate;
    if (dto.renewalTerms) updateData.renewal_terms = JSON.stringify(dto.renewalTerms);
    if (dto.attachments) updateData.attachments = JSON.stringify(dto.attachments);

    updateData.updated_at = new Date().toISOString();

    await this.db.update('contracts', contractId, updateData);

    const updatedContract = await this.db.findOne('contracts', { id: contractId });
    return this.parseContractJson(updatedContract);
  }

  /**
   * Client signs the contract
   */
  async signContractByClient(contractId: string, clientId: string, signatureDto: SignatureDto) {
    const contract = await this.db.findOne('contracts', { id: contractId });

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    // Verify the client owns this contract
    if (contract.client_id !== clientId) {
      throw new BadRequestException('You are not authorized to sign this contract');
    }

    // Check if already signed by client
    if (contract.client_signature) {
      throw new BadRequestException('Contract already signed by client');
    }

    const clientSignature = {
      signature_data: signatureDto.signatureData,
      signer_name: signatureDto.signerName,
      signer_email: signatureDto.signerEmail,
      signed_at: new Date().toISOString(),
      metadata: signatureDto.metadata || {},
    };

    // Determine new status based on provider signature
    let newStatus = contract.status;
    let signedAt = null;

    if (contract.provider_signature) {
      // Both parties signed
      newStatus = ContractStatus.ACTIVE;
      signedAt = new Date().toISOString();
    } else {
      // Waiting for provider signature
      newStatus = ContractStatus.PENDING_SIGNATURE;
    }

    await this.db.update('contracts', contractId, {
      client_signature: JSON.stringify(clientSignature),
      status: newStatus,
      signed_at: signedAt,
      updated_at: new Date().toISOString(),
    });

    // Send notification about client signature
    try {
      const project = await this.db.findOne('projects', { id: contract.project_id });
      const notifyUserIds: string[] = [];

      // Notify provider/company
      if (project?.team_lead_id) {
        notifyUserIds.push(project.team_lead_id);
      }
      if (project?.assigned_company_id) {
        const companyMembers = await this.db.findMany('company_team_members', {
          company_id: project.assigned_company_id,
          status: 'active',
        });
        companyMembers.forEach((member: any) => {
          if (member.user_id && !notifyUserIds.includes(member.user_id)) {
            notifyUserIds.push(member.user_id);
          }
        });
      }

      if (notifyUserIds.length > 0) {
        const isFullySigned = newStatus === ContractStatus.ACTIVE;
        await this.notificationsService.sendNotification({
          user_ids: notifyUserIds,
          type: NotificationType.UPDATE,
          title: isFullySigned ? '✅ Contract Fully Signed!' : '✍️ Contract Signed by Client',
          message: isFullySigned
            ? `The contract for project "${project?.name || 'Unknown'}" has been fully signed by all parties and is now active!`
            : `The client has signed the contract for project "${project?.name || 'Unknown'}". Awaiting your signature.`,
          priority: isFullySigned ? NotificationPriority.HIGH : NotificationPriority.NORMAL,
          action_url: `/project/${contract.project_id}/contract`,
          data: {
            projectId: contract.project_id,
            contractId,
            status: newStatus,
          },
          send_push: true,
        });
      }
    } catch (error) {
      console.error('[ContractService] Failed to send client signature notification:', error);
    }

    const updatedContract = await this.db.findOne('contracts', { id: contractId });
    return this.parseContractJson(updatedContract);
  }

  /**
   * Company/Provider signs the contract
   */
  async signContractByCompany(contractId: string, providerId: string, signatureDto: SignatureDto) {
    const contract = await this.db.findOne('contracts', { id: contractId });

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    // Check if already signed by company
    if (contract.provider_signature) {
      throw new BadRequestException('Contract already signed by company');
    }

    const providerSignature = {
      signature_data: signatureDto.signatureData,
      signer_name: signatureDto.signerName,
      signer_email: signatureDto.signerEmail,
      signed_at: new Date().toISOString(),
      signer_id: providerId,
      metadata: signatureDto.metadata || {},
    };

    // Determine new status based on client signature
    let newStatus = contract.status;
    let signedAt = null;

    if (contract.client_signature) {
      // Both parties signed
      newStatus = ContractStatus.ACTIVE;
      signedAt = new Date().toISOString();
    } else {
      // Waiting for client signature
      newStatus = ContractStatus.PENDING_SIGNATURE;
    }

    await this.db.update('contracts', contractId, {
      provider_signature: JSON.stringify(providerSignature),
      status: newStatus,
      signed_at: signedAt,
      updated_at: new Date().toISOString(),
    });

    // Send notification about company signature
    try {
      const project = await this.db.findOne('projects', { id: contract.project_id });
      const isFullySigned = newStatus === ContractStatus.ACTIVE;

      // Notify the client
      if (contract.client_id) {
        await this.notificationsService.sendNotification({
          user_id: contract.client_id,
          type: NotificationType.UPDATE,
          title: isFullySigned ? '✅ Contract Fully Signed!' : '✍️ Contract Signed by Provider',
          message: isFullySigned
            ? `The contract for project "${project?.name || 'Unknown'}" has been fully signed by all parties and is now active!`
            : `The provider has signed the contract for project "${project?.name || 'Unknown'}". Awaiting your signature.`,
          priority: isFullySigned ? NotificationPriority.HIGH : NotificationPriority.NORMAL,
          action_url: `/project/${contract.project_id}/contract`,
          data: {
            projectId: contract.project_id,
            contractId,
            status: newStatus,
          },
          send_push: true,
        });
      }
    } catch (error) {
      console.error('[ContractService] Failed to send company signature notification:', error);
    }

    const updatedContract = await this.db.findOne('contracts', { id: contractId });
    return this.parseContractJson(updatedContract);
  }

  /**
   * Cancel/Terminate a contract
   */
  async cancelContract(contractId: string, reason?: string) {
    const contract = await this.db.findOne('contracts', { id: contractId });

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    if (contract.status === ContractStatus.TERMINATED) {
      throw new BadRequestException('Contract is already terminated');
    }

    const updateData: any = {
      status: ContractStatus.TERMINATED,
      updated_at: new Date().toISOString(),
    };

    // Store cancellation reason in payment_terms as metadata
    if (reason) {
      const paymentTerms = this.safeJsonParse(contract.payment_terms) || {};
      paymentTerms.cancellation_reason = reason;
      paymentTerms.cancelled_at = new Date().toISOString();
      updateData.payment_terms = JSON.stringify(paymentTerms);
    }

    await this.db.update('contracts', contractId, updateData);

    // Send notification about contract termination
    try {
      const project = await this.db.findOne('projects', { id: contract.project_id });
      const notifyUserIds: string[] = [];

      // Notify all parties involved
      if (contract.client_id) {
        notifyUserIds.push(contract.client_id);
      }
      if (project?.team_lead_id && !notifyUserIds.includes(project.team_lead_id)) {
        notifyUserIds.push(project.team_lead_id);
      }

      if (notifyUserIds.length > 0) {
        await this.notificationsService.sendNotification({
          user_ids: notifyUserIds,
          type: NotificationType.UPDATE,
          title: '⚠️ Contract Terminated',
          message: `The contract for project "${project?.name || 'Unknown'}" has been terminated.${reason ? ` Reason: ${reason}` : ''}`,
          priority: NotificationPriority.HIGH,
          action_url: `/project/${contract.project_id}/contract`,
          data: {
            projectId: contract.project_id,
            contractId,
            status: ContractStatus.TERMINATED,
            reason,
          },
          send_push: true,
          send_email: true,
        });
      }
    } catch (error) {
      console.error('[ContractService] Failed to send contract termination notification:', error);
    }

    const updatedContract = await this.db.findOne('contracts', { id: contractId });
    return this.parseContractJson(updatedContract);
  }

  /**
   * Get contract history/versions for a project
   */
  async getContractHistory(projectId: string) {
    // Since we don't have a versions table, we'll return the current contract
    // In a production system, you'd want to implement contract versioning
    const contracts = await this.db.findMany(
      'contracts',
      { project_id: projectId },
      { orderBy: 'created_at', order: 'desc' }
    );

    return contracts.map(c => this.parseContractJson(c));
  }

  /**
   * Get contract by ID
   */
  async getContractById(contractId: string) {
    const contract = await this.db.findOne('contracts', { id: contractId });

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    return this.parseContractJson(contract);
  }

  /**
   * Mark contract as completed
   */
  async completeContract(contractId: string) {
    const contract = await this.db.findOne('contracts', { id: contractId });

    if (!contract) {
      throw new NotFoundException('Contract not found');
    }

    if (contract.status !== ContractStatus.ACTIVE) {
      throw new BadRequestException('Only active contracts can be marked as completed');
    }

    await this.db.update('contracts', contractId, {
      status: ContractStatus.COMPLETED,
      updated_at: new Date().toISOString(),
    });

    const updatedContract = await this.db.findOne('contracts', { id: contractId });
    return this.parseContractJson(updatedContract);
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private parseContractJson(contract: any) {
    if (!contract) return null;

    return {
      ...contract,
      payment_terms: this.safeJsonParse(contract.payment_terms),
      renewal_terms: this.safeJsonParse(contract.renewal_terms),
      client_signature: this.safeJsonParse(contract.client_signature),
      provider_signature: this.safeJsonParse(contract.provider_signature),
      attachments: this.safeJsonParse(contract.attachments),
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
