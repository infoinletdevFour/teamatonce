/**
 * Contract Service
 * Handles all contract-related API calls for Team@Once platform
 */

import { apiClient } from '@/lib/api-client';
import {
  Contract,
  ContractStatus,
  ContractParty,
  Signature
} from '@/types/payment';

/**
 * DTOs matching backend contract DTOs
 */
export interface CreateContractDto {
  title: string;
  description?: string;
  contractType: 'fixed_price' | 'hourly' | 'milestone_based';
  terms: string;
  scopeOfWork: string;
  totalAmount: number;
  currency?: string;
  paymentTerms?: Record<string, any>;
  hourlyRate?: number;
  startDate: string;
  endDate: string;
  renewalTerms?: Record<string, any>;
  attachments?: any[];
}

export interface UpdateContractDto {
  title?: string;
  description?: string;
  status?: ContractStatus;
  terms?: string;
  scopeOfWork?: string;
  totalAmount?: number;
  paymentTerms?: Record<string, any>;
  hourlyRate?: number;
  startDate?: string;
  endDate?: string;
  renewalTerms?: Record<string, any>;
  attachments?: any[];
}

export interface SignatureDto {
  signatureData: string;
  signerName?: string;
  signerEmail?: string;
  metadata?: Record<string, any>;
}

export interface ContractResponseDto {
  id: string;
  project_id: string;
  client_id: string;
  developer_id?: string;
  contract_type: 'fixed_price' | 'hourly' | 'milestone_based';
  status: ContractStatus;
  title: string;
  description?: string;
  terms: string;
  scope_of_work: string;
  total_amount: number;
  currency: string;
  payment_terms?: Record<string, any>;
  hourly_rate?: number;
  start_date: string;
  end_date: string;
  renewal_terms?: Record<string, any>;
  client_signature?: Record<string, any>;
  provider_signature?: Record<string, any>;
  signed_at?: string;
  contract_document_url?: string;
  attachments?: any[];
  created_at: string;
  updated_at: string;
  // Party details (if populated by backend)
  client?: {
    id: string;
    name: string;
    email: string;
    company_name?: string;
    address?: string;
    phone?: string;
  };
  developer?: {
    id: string;
    name: string;
    email: string;
    company_name?: string;
    address?: string;
    phone?: string;
  };
}

/**
 * Contract Service Class
 */
class ContractService {
  /**
   * Get all contracts for a company
   */
  async getCompanyContracts(companyId: string): Promise<ContractResponseDto[]> {
    try {
      const response = await apiClient.get(`/company/${companyId}/contracts`);
      return response.data || [];
    } catch (error) {
      console.error('Error fetching company contracts:', error);
      return [];
    }
  }

  /**
   * Get contract for a specific project
   */
  async getProjectContract(companyId: string, projectId: string): Promise<ContractResponseDto> {
    const response = await apiClient.get(`/company/${companyId}/contract/project/${projectId}`);
    return response.data;
  }

  /**
   * Get all contracts for a project (history)
   */
  async getContractHistory(companyId: string, projectId: string): Promise<ContractResponseDto[]> {
    const response = await apiClient.get(`/company/${companyId}/contract/project/${projectId}/history`);
    return response.data;
  }

  /**
   * Get contract by ID
   */
  async getContractById(companyId: string, contractId: string): Promise<ContractResponseDto> {
    const response = await apiClient.get(`/company/${companyId}/contract/details/${contractId}`);
    return response.data;
  }

  /**
   * Create a new contract for a project
   */
  async createContract(
    companyId: string,
    projectId: string,
    contractData: CreateContractDto
  ): Promise<ContractResponseDto> {
    const response = await apiClient.post(
      `/company/${companyId}/contract/project/${projectId}`,
      contractData
    );
    return response.data;
  }

  /**
   * Update contract details
   */
  async updateContract(
    companyId: string,
    contractId: string,
    updates: UpdateContractDto
  ): Promise<ContractResponseDto> {
    const response = await apiClient.put(`/company/${companyId}/contract/${contractId}`, updates);
    return response.data;
  }

  /**
   * Sign contract as client
   */
  async signContractByClient(
    companyId: string,
    contractId: string,
    signature: SignatureDto
  ): Promise<ContractResponseDto> {
    const response = await apiClient.post(
      `/company/${companyId}/contract/${contractId}/sign/client`,
      signature
    );
    return response.data;
  }

  /**
   * Sign contract as company
   */
  async signContractByCompany(
    companyId: string,
    contractId: string,
    signature: SignatureDto
  ): Promise<ContractResponseDto> {
    const response = await apiClient.post(
      `/company/${companyId}/contract/${contractId}/sign/company`,
      signature
    );
    return response.data;
  }

  /**
   * Cancel/Terminate a contract
   */
  async cancelContract(companyId: string, contractId: string, reason?: string): Promise<ContractResponseDto> {
    const response = await apiClient.put(`/company/${companyId}/contract/${contractId}/cancel`, {
      reason,
    });
    return response.data;
  }

  /**
   * Mark contract as completed
   */
  async completeContract(companyId: string, contractId: string): Promise<ContractResponseDto> {
    const response = await apiClient.put(`/company/${companyId}/contract/${contractId}/complete`);
    return response.data;
  }

  /**
   * Helper method to convert backend response to frontend Contract type
   */
  convertToContract(dto: ContractResponseDto): Contract {
    // Convert party info if available
    const client: ContractParty | undefined = dto.client ? {
      id: dto.client.id,
      name: dto.client.name,
      email: dto.client.email,
      company: dto.client.company_name,
      address: dto.client.address,
      phone: dto.client.phone,
    } : undefined;

    const developer: ContractParty | undefined = dto.developer ? {
      id: dto.developer.id,
      name: dto.developer.name,
      email: dto.developer.email,
      company: dto.developer.company_name,
      address: dto.developer.address,
      phone: dto.developer.phone,
    } : undefined;

    return {
      id: dto.id,
      projectId: dto.project_id,
      title: dto.title,
      description: dto.description || '',
      status: dto.status,
      clientId: dto.client_id,
      developerId: dto.developer_id || '',
      client,
      developer,
      startDate: new Date(dto.start_date),
      endDate: new Date(dto.end_date),
      totalAmount: dto.total_amount,
      currency: dto.currency as any,
      milestones: [], // Milestones should be fetched separately
      terms: this.convertTermsToArray(dto.terms),
      signatures: this.convertSignatures(dto.client_signature, dto.provider_signature),
      amendments: [],
      createdAt: new Date(dto.created_at),
      updatedAt: new Date(dto.updated_at),
    };
  }

  /**
   * Convert string terms to ContractTerm array
   */
  private convertTermsToArray(terms: string) {
    // Parse terms string or return default terms structure
    try {
      const parsed = JSON.parse(terms);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch (e) {
      // If not JSON, create a single term
    }

    return [
      {
        id: '1',
        category: 'other' as const,
        title: 'Contract Terms',
        description: terms,
        order: 1,
      },
    ];
  }

  /**
   * Convert signature data to Signature array
   */
  private convertSignatures(
    clientSignature?: Record<string, any>,
    providerSignature?: Record<string, any>
  ): Signature[] {
    const signatures: Signature[] = [];

    if (clientSignature) {
      signatures.push({
        id: clientSignature.id || 'client-sig',
        contractId: '',
        signedBy: '',
        signedByName: clientSignature.signerName || '',
        signedByRole: 'client',
        signatureData: clientSignature.signatureData || '',
        signedAt: new Date(clientSignature.signedAt || Date.now()),
        ipAddress: clientSignature.ipAddress || '',
      });
    }

    if (providerSignature) {
      signatures.push({
        id: providerSignature.id || 'provider-sig',
        contractId: '',
        signedBy: '',
        signedByName: providerSignature.signerName || '',
        signedByRole: 'developer',
        signatureData: providerSignature.signatureData || '',
        signedAt: new Date(providerSignature.signedAt || Date.now()),
        ipAddress: providerSignature.ipAddress || '',
      });
    }

    return signatures;
  }
}

// Export singleton instance
export const contractService = new ContractService();
export default contractService;
