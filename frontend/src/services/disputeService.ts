/**
 * Dispute Service
 * Handles all dispute-related API calls for Team@Once platform
 * Manages payment disputes, mediation, and resolution processes
 */

import { apiClient } from '@/lib/api-client';
import {
  DisputeEvidence,
  DisputeStatus,
} from '@/types/escrow';

/**
 * DTOs for dispute operations
 */
export interface OpenDisputeDto {
  milestoneId: string;
  reason: string;
  description: string;
  evidence?: File[];
}

export interface RespondToDisputeDto {
  disputeId: string;
  response: string;
  evidence?: File[];
}

export interface AcceptMediationDto {
  disputeId: string;
  termsAccepted: boolean;
}

export interface ResolveDisputeDto {
  disputeId: string;
  resolution: string;
  action: 'release' | 'refund' | 'partial_release' | 'hold';
  partialAmount?: number;
}

export interface UploadEvidenceDto {
  disputeId: string;
  files: File[];
  description?: string;
}

/**
 * Response DTOs
 */
export interface DisputeResponse {
  id: string;
  paymentId: string;
  milestoneId: string;
  projectId: string;
  raisedBy: string;
  raisedByRole: 'client' | 'developer';
  reason: string;
  description: string;
  status: DisputeStatus;
  resolution?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  resolutionAction?: string;
  partialAmount?: number;
  mediationStartedAt?: string;
  mediationAcceptedBy?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface DisputeDetailsResponse extends DisputeResponse {
  evidence: DisputeEvidence[];
  payment: {
    id: string;
    amount: number;
    currency: string;
    status: string;
  };
  milestone: {
    id: string;
    title: string;
    description: string;
    dueDate: string;
  };
  participants: {
    clientId: string;
    clientName: string;
    developerId: string;
    developerName: string;
  };
  timeline: Array<{
    action: string;
    performedBy: string;
    performedAt: string;
    description: string;
  }>;
}

export interface DisputeStatsResponse {
  totalDisputes: number;
  openDisputes: number;
  inMediationDisputes: number;
  resolvedDisputes: number;
  averageResolutionTime: number; // in hours
  resolutionRate: number; // percentage
  disputesByReason: Record<string, number>;
}

export interface MediationResponse {
  disputeId: string;
  mediationStartedAt: string;
  acceptedBy: string[];
  pendingAcceptance: string[];
  status: 'pending' | 'active' | 'completed';
  message: string;
}

/**
 * Dispute Service Class
 */
class DisputeService {
  private readonly baseUrl = '/disputes';

  /**
   * Open a dispute - Initiate dispute resolution process
   */
  async openDispute(
    milestoneId: string,
    reason: string,
    description: string,
    evidenceFiles?: File[]
  ): Promise<DisputeResponse> {
    const formData = new FormData();
    formData.append('milestoneId', milestoneId);
    formData.append('reason', reason);
    formData.append('description', description);

    if (evidenceFiles && evidenceFiles.length > 0) {
      evidenceFiles.forEach((file, index) => {
        formData.append(`evidence[${index}]`, file);
      });
    }

    // Don't set Content-Type header - browser will auto-set with boundary for FormData
    const response = await apiClient.post(`${this.baseUrl}/open`, formData);
    return response.data;
  }

  /**
   * Respond to dispute - Add response to existing dispute
   */
  async respondToDispute(
    disputeId: string,
    responseText: string,
    evidenceFiles?: File[]
  ): Promise<DisputeResponse> {
    const formData = new FormData();
    formData.append('response', responseText);

    if (evidenceFiles && evidenceFiles.length > 0) {
      evidenceFiles.forEach((file, index) => {
        formData.append(`evidence[${index}]`, file);
      });
    }

    // Don't set Content-Type header - browser will auto-set with boundary for FormData
    const response = await apiClient.post(
      `${this.baseUrl}/${disputeId}/respond`,
      formData
    );
    return response.data;
  }

  /**
   * Accept mediation - Accept mediation for dispute resolution
   */
  async acceptMediation(
    disputeId: string,
    termsAccepted: boolean = true
  ): Promise<MediationResponse> {
    const response = await apiClient.post(`${this.baseUrl}/${disputeId}/accept-mediation`, {
      termsAccepted,
    });
    return response.data;
  }

  /**
   * Decline mediation - Decline mediation offer
   */
  async declineMediation(disputeId: string, reason?: string): Promise<DisputeResponse> {
    const response = await apiClient.post(`${this.baseUrl}/${disputeId}/decline-mediation`, {
      reason,
    });
    return response.data;
  }

  /**
   * Get dispute details - Get full dispute information
   */
  async getDispute(disputeId: string): Promise<DisputeDetailsResponse> {
    const response = await apiClient.get(`${this.baseUrl}/${disputeId}`);
    return response.data;
  }

  /**
   * Get disputes by user - Get all disputes for current user
   */
  async getDisputesByUser(
    filters?: {
      status?: DisputeStatus;
      projectId?: string;
      role?: 'client' | 'developer';
    }
  ): Promise<DisputeResponse[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.projectId) params.append('projectId', filters.projectId);
    if (filters?.role) params.append('role', filters.role);

    const response = await apiClient.get(`${this.baseUrl}/user?${params.toString()}`);
    return response.data;
  }

  /**
   * Get disputes by project - Get all disputes for a project
   */
  async getDisputesByProject(projectId: string): Promise<DisputeResponse[]> {
    const response = await apiClient.get(`${this.baseUrl}/project/${projectId}`);
    return response.data;
  }

  /**
   * Get dispute statistics - Get dispute analytics
   */
  async getDisputeStats(projectId?: string): Promise<DisputeStatsResponse> {
    const url = projectId
      ? `${this.baseUrl}/stats?projectId=${projectId}`
      : `${this.baseUrl}/stats`;
    const response = await apiClient.get(url);
    return response.data;
  }

  /**
   * Upload additional evidence - Add evidence to existing dispute
   */
  async uploadEvidence(
    disputeId: string,
    files: File[],
    description?: string
  ): Promise<DisputeEvidence[]> {
    const formData = new FormData();
    if (description) {
      formData.append('description', description);
    }

    files.forEach((file, index) => {
      formData.append(`files[${index}]`, file);
    });

    // Don't set Content-Type header - browser will auto-set with boundary for FormData
    const response = await apiClient.post(
      `${this.baseUrl}/${disputeId}/evidence`,
      formData
    );
    return response.data;
  }

  /**
   * Get dispute evidence - Get all evidence for a dispute
   */
  async getEvidence(disputeId: string): Promise<DisputeEvidence[]> {
    const response = await apiClient.get(`${this.baseUrl}/${disputeId}/evidence`);
    return response.data;
  }

  /**
   * Delete evidence - Remove evidence file (only by uploader)
   */
  async deleteEvidence(evidenceId: string): Promise<{ message: string }> {
    const response = await apiClient.delete(`${this.baseUrl}/evidence/${evidenceId}`);
    return response.data;
  }

  /**
   * Withdraw dispute - Cancel/close dispute (before resolution)
   */
  async withdrawDispute(disputeId: string, reason?: string): Promise<DisputeResponse> {
    const response = await apiClient.post(`${this.baseUrl}/${disputeId}/withdraw`, {
      reason,
    });
    return response.data;
  }

  /**
   * Escalate to admin - Request admin intervention
   */
  async escalateToAdmin(disputeId: string, reason: string): Promise<DisputeResponse> {
    const response = await apiClient.post(`${this.baseUrl}/${disputeId}/escalate`, {
      reason,
    });
    return response.data;
  }

  // ============================================
  // ADMIN METHODS (Mediation & Resolution)
  // ============================================

  /**
   * Resolve dispute (Admin only) - Final dispute resolution
   */
  async resolveDispute(
    disputeId: string,
    resolution: string,
    action: 'release' | 'refund' | 'partial_release' | 'hold',
    partialAmount?: number
  ): Promise<DisputeResponse> {
    const response = await apiClient.post(`${this.baseUrl}/${disputeId}/resolve`, {
      resolution,
      action,
      partialAmount,
    });
    return response.data;
  }

  /**
   * Start mediation (Admin only) - Initiate formal mediation
   */
  async startMediation(disputeId: string): Promise<MediationResponse> {
    const response = await apiClient.post(`${this.baseUrl}/${disputeId}/start-mediation`);
    return response.data;
  }

  /**
   * Get all disputes (Admin only) - Get all disputes in system
   */
  async getAllDisputes(filters?: {
    status?: DisputeStatus;
    fromDate?: string;
    toDate?: string;
  }): Promise<DisputeResponse[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.fromDate) params.append('fromDate', filters.fromDate);
    if (filters?.toDate) params.append('toDate', filters.toDate);

    const response = await apiClient.get(`${this.baseUrl}/admin/all?${params.toString()}`);
    return response.data;
  }

  /**
   * Assign mediator (Admin only) - Assign specific mediator to dispute
   */
  async assignMediator(disputeId: string, mediatorId: string): Promise<DisputeResponse> {
    const response = await apiClient.post(`${this.baseUrl}/${disputeId}/assign-mediator`, {
      mediatorId,
    });
    return response.data;
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  /**
   * Get dispute status color for UI
   */
  getStatusColor(status: DisputeStatus): string {
    const statusColors: Record<DisputeStatus, string> = {
      open: 'orange',
      investigating: 'yellow',
      mediation: 'blue',
      resolved: 'green',
      closed: 'gray',
    };
    return statusColors[status] || 'gray';
  }

  /**
   * Get dispute status label for UI
   */
  getStatusLabel(status: DisputeStatus): string {
    const statusLabels: Record<DisputeStatus, string> = {
      open: 'Open',
      investigating: 'Under Investigation',
      mediation: 'In Mediation',
      resolved: 'Resolved',
      closed: 'Closed',
    };
    return statusLabels[status] || status;
  }

  /**
   * Get dispute reason label
   */
  getReasonLabel(reason: string): string {
    const reasonLabels: Record<string, string> = {
      quality_issue: 'Quality Issues',
      incomplete_work: 'Incomplete Work',
      missed_deadline: 'Missed Deadline',
      wrong_requirements: 'Wrong Requirements',
      communication_issue: 'Communication Issues',
      payment_issue: 'Payment Issues',
      other: 'Other',
    };
    return reasonLabels[reason] || reason;
  }

  /**
   * Validate evidence file
   */
  validateEvidenceFile(file: File): { valid: boolean; error?: string } {
    // Max file size: 10MB
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return {
        valid: false,
        error: 'File size exceeds 10MB limit',
      };
    }

    // Allowed file types
    const allowedTypes = [
      'image/png',
      'image/jpeg',
      'image/jpg',
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'video/mp4',
      'video/quicktime',
    ];

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'File type not supported. Please upload images, PDFs, documents, or videos.',
      };
    }

    return { valid: true };
  }

  /**
   * Calculate dispute resolution time in hours
   */
  calculateResolutionTime(createdAt: string, resolvedAt: string): number {
    const created = new Date(createdAt);
    const resolved = new Date(resolvedAt);
    const diffMs = resolved.getTime() - created.getTime();
    return Math.round(diffMs / (1000 * 60 * 60));
  }

  /**
   * Format dispute timeline for display
   */
  formatTimelineAction(action: string): string {
    const actionLabels: Record<string, string> = {
      opened: 'Dispute opened',
      responded: 'Response added',
      evidence_added: 'Evidence uploaded',
      mediation_requested: 'Mediation requested',
      mediation_accepted: 'Mediation accepted',
      mediation_declined: 'Mediation declined',
      escalated: 'Escalated to admin',
      resolved: 'Dispute resolved',
      withdrawn: 'Dispute withdrawn',
      closed: 'Dispute closed',
    };
    return actionLabels[action] || action;
  }

  /**
   * Check if user can respond to dispute
   */
  canRespond(dispute: DisputeResponse): boolean {
    return (
      dispute.status === 'open' ||
      dispute.status === 'investigating' ||
      dispute.status === 'mediation'
    );
  }

  /**
   * Check if user can escalate dispute
   */
  canEscalate(dispute: DisputeResponse): boolean {
    return dispute.status === 'open' || dispute.status === 'investigating';
  }

  /**
   * Check if user can withdraw dispute
   */
  canWithdraw(dispute: DisputeResponse): boolean {
    return dispute.status === 'open';
  }

  /**
   * Get recommended action based on dispute details
   */
  getRecommendedAction(dispute: DisputeResponse): string {
    const daysSinceCreated = Math.floor(
      (Date.now() - new Date(dispute.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (dispute.status === 'open' && daysSinceCreated > 3) {
      return 'Consider requesting mediation to expedite resolution';
    }

    if (dispute.status === 'investigating' && daysSinceCreated > 7) {
      return 'Consider escalating to admin for faster resolution';
    }

    if (dispute.status === 'mediation') {
      return 'Please accept mediation terms to proceed with resolution';
    }

    return 'Continue communication with the other party';
  }
}

// Export singleton instance
export const disputeService = new DisputeService();
export default disputeService;
