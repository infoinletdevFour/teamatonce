/**
 * Escrow Service
 * Handles all escrow-related API calls for Team@Once platform
 * Manages secure milestone-based payments with deliverable tracking
 */

import { apiClient } from '@/lib/api-client';
import {
  MilestoneStatusDto,
  ConnectAccountLinkDto,
  StripeConnectStatus,
  EscrowTimelineEvent,
  EscrowBalance,
  EscrowStats,
  MilestonePaymentSummary,
} from '@/types/escrow';

/**
 * Response DTOs
 */
export interface EscrowPaymentResponse {
  id: string;
  milestoneId: string;
  projectId: string;
  amount: number;
  currency: string;
  status: string;
  stripePaymentIntentId?: string;
  fundedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeliverableResponse {
  id: string;
  milestoneId: string;
  paymentId: string;
  developerId: string;
  files: string[];
  description: string;
  deliverableType: string;
  status: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApprovalResponse {
  payment: EscrowPaymentResponse;
  deliverable: DeliverableResponse;
  message: string;
}

export interface ChangesRequestResponse {
  deliverable: DeliverableResponse;
  newDeadline: string;
  message: string;
}

/**
 * Escrow Service Class
 */
class EscrowService {
  private readonly baseUrl = '/escrow';

  /**
   * Fund a milestone - Client deposits funds into escrow
   */
  async fundMilestone(
    milestoneId: string,
    amount: number,
    paymentMethodId: string,
    currency: string = 'usd'
  ): Promise<EscrowPaymentResponse> {
    const response = await apiClient.post(`${this.baseUrl}/fund-milestone`, {
      milestoneId,
      amount,
      paymentMethodId,
      currency,
    });
    // Backend wraps response in { success, message, data }
    return response.data.data;
  }

  /**
   * Submit deliverables - Developer submits completed work
   */
  async submitDeliverables(
    milestoneId: string,
    files: string[],
    description: string,
    deliverableType: string = 'code'
  ): Promise<DeliverableResponse> {
    const response = await apiClient.post(`${this.baseUrl}/submit-deliverables`, {
      milestoneId,
      files,
      description,
      deliverableType,
    });
    // Backend wraps response in { success, message, data }
    return response.data.data;
  }

  /**
   * Approve deliverable - Client approves submitted work
   */
  async approveDeliverable(
    milestoneId: string,
    reviewNotes?: string
  ): Promise<ApprovalResponse> {
    const response = await apiClient.post(`${this.baseUrl}/approve`, {
      milestoneId,
      reviewNotes,
    });
    // Backend wraps response in { success, message, data }
    return response.data.data;
  }

  /**
   * Request changes - Client requests modifications to deliverable
   */
  async requestChanges(
    milestoneId: string,
    changeNotes: string,
    extendDays: number = 7
  ): Promise<ChangesRequestResponse> {
    const response = await apiClient.post(`${this.baseUrl}/request-changes`, {
      milestoneId,
      changeNotes,
      extendDays,
    });
    // Backend wraps response in { success, message, data }
    return response.data.data;
  }

  /**
   * Get milestone escrow status - Get current status and details
   */
  async getMilestoneStatus(milestoneId: string): Promise<MilestoneStatusDto> {
    const response = await apiClient.get(`${this.baseUrl}/milestone/${milestoneId}/status`);
    // Backend wraps response in { success, data }
    return response.data.data;
  }

  /**
   * Get timeline events - Get history of escrow events for a payment
   */
  async getTimeline(paymentId: string): Promise<EscrowTimelineEvent[]> {
    const response = await apiClient.get(`${this.baseUrl}/timeline/${paymentId}`);
    // Backend wraps response in { success, data }
    return response.data.data;
  }

  /**
   * Get escrow balance - Get user's escrow balance summary
   */
  async getBalance(): Promise<EscrowBalance> {
    const response = await apiClient.get(`${this.baseUrl}/balance`);
    return response.data;
  }

  /**
   * Get escrow statistics - Get project or user escrow stats
   */
  async getStats(projectId?: string): Promise<EscrowStats> {
    const url = projectId
      ? `${this.baseUrl}/stats/${projectId}`
      : `${this.baseUrl}/stats`;
    const response = await apiClient.get(url);
    return response.data;
  }

  /**
   * Get milestone payment summaries - Get all milestones for a project
   */
  async getMilestoneSummaries(projectId: string): Promise<MilestonePaymentSummary[]> {
    // Note: Backend uses /project/:projectId/escrows endpoint
    const response = await apiClient.get(`${this.baseUrl}/project/${projectId}/escrows`);
    // Backend wraps response in { success, data }
    return response.data.data;
  }

  /**
   * Get deliverable details - Get specific deliverable information
   */
  async getDeliverable(deliverableId: string): Promise<DeliverableResponse> {
    const response = await apiClient.get(`${this.baseUrl}/deliverable/${deliverableId}`);
    return response.data;
  }

  /**
   * Get milestone deliverables - Get all deliverables for a milestone
   */
  async getMilestoneDeliverables(milestoneId: string): Promise<DeliverableResponse[]> {
    const response = await apiClient.get(`${this.baseUrl}/milestone/${milestoneId}/deliverables`);
    return response.data;
  }

  // ============================================
  // DISPUTE MANAGEMENT METHODS
  // ============================================

  /**
   * Open a dispute for a milestone
   */
  async openDispute(data: {
    milestoneId: string;
    reason: string;
    description: string;
    evidence?: string[];
    requestedResolution?: string;
  }): Promise<any> {
    const response = await apiClient.post(`${this.baseUrl}/dispute`, data);
    // Backend wraps response in { success, message, data }
    return response.data.data;
  }

  /**
   * Respond to a dispute
   */
  async respondToDispute(
    disputeId: string,
    data: {
      response: string;
      evidence?: string[];
      counterProposal?: string;
      agreeToResolution?: boolean;
    }
  ): Promise<any> {
    const response = await apiClient.post(`${this.baseUrl}/dispute/${disputeId}/respond`, data);
    // Backend wraps response in { success, message, data }
    return response.data.data;
  }

  /**
   * Escalate a dispute to mediation
   */
  async escalateDispute(disputeId: string, reason: string): Promise<any> {
    const response = await apiClient.post(`${this.baseUrl}/dispute/${disputeId}/escalate`, {
      reason,
    });
    // Backend wraps response in { success, message, data }
    return response.data.data;
  }

  /**
   * Withdraw a dispute
   */
  async withdrawDispute(disputeId: string, reason: string): Promise<any> {
    const response = await apiClient.post(`${this.baseUrl}/dispute/${disputeId}/withdraw`, {
      reason,
    });
    // Backend wraps response in { success, message, data }
    return response.data.data;
  }

  /**
   * Get dispute details
   */
  async getDispute(disputeId: string): Promise<any> {
    const response = await apiClient.get(`${this.baseUrl}/dispute/${disputeId}`);
    // Backend wraps response in { success, data }
    return response.data.data;
  }

  /**
   * Get all disputes for a milestone
   */
  async getMilestoneDisputes(milestoneId: string): Promise<any[]> {
    const response = await apiClient.get(`${this.baseUrl}/milestone/${milestoneId}/disputes`);
    // Backend wraps response in { success, data }
    return response.data.data;
  }

  /**
   * Accept mediation decision (for users)
   */
  async acceptMediation(disputeId: string, accepted: boolean, comments?: string): Promise<any> {
    const response = await apiClient.post(`${this.baseUrl}/dispute/${disputeId}/accept-mediation`, {
      accepted,
      comments,
    });
    // Backend wraps response in { success, message, data }
    return response.data.data;
  }

  /**
   * Mediate a dispute (admin only)
   */
  async mediateDispute(
    disputeId: string,
    data: {
      resolution: string;
      clientPercentage: number;
      developerPercentage: number;
      mediationNotes: string;
      additionalActions?: string;
      extendDays?: number;
    }
  ): Promise<any> {
    const response = await apiClient.post(`${this.baseUrl}/dispute/${disputeId}/mediate`, data);
    // Backend wraps response in { success, message, data }
    return response.data.data;
  }

  // ============================================
  // STRIPE CONNECT METHODS (Developer Payouts)
  // ============================================

  /**
   * Create Stripe Connect account - Developer creates payout account
   */
  async createConnectAccount(
    email: string,
    country: string = 'US'
  ): Promise<{ accountId: string; message: string }> {
    const response = await apiClient.post(`${this.baseUrl}/connect/create-account`, {
      email,
      country,
    });
    // Backend wraps response in { success, message, data }
    return response.data.data;
  }

  /**
   * Get onboarding link - Get Stripe Connect onboarding URL
   */
  async getOnboardingLink(): Promise<ConnectAccountLinkDto> {
    const response = await apiClient.get(`${this.baseUrl}/connect/account-link`);
    // Backend wraps response in { success, message, data }
    return response.data.data;
  }

  /**
   * Get Connect account status - Check developer's payout account status
   */
  async getConnectStatus(): Promise<StripeConnectStatus> {
    const response = await apiClient.get(`${this.baseUrl}/connect/status`);
    // Backend wraps response in { success, data }
    return response.data.data;
  }

  /**
   * Get Connect dashboard link - Get link to Stripe Express Dashboard
   */
  async getConnectDashboardLink(): Promise<{ url: string }> {
    const response = await apiClient.get(`${this.baseUrl}/connect/dashboard-link`);
    // Backend wraps response in { success, message, data }
    return response.data.data;
  }

  /**
   * Update Connect account - Update payout account details
   */
  async updateConnectAccount(updates: {
    businessType?: string;
    companyName?: string;
  }): Promise<{ message: string }> {
    const response = await apiClient.put(`${this.baseUrl}/connect/update-account`, updates);
    return response.data;
  }

  // ============================================
  // UTILITY METHODS
  // ============================================

  /**
   * Calculate platform fee
   */
  calculatePlatformFee(amount: number, feePercentage: number = 5): number {
    return Math.round(amount * (feePercentage / 100));
  }

  /**
   * Calculate net amount after platform fee
   */
  calculateNetAmount(amount: number, feePercentage: number = 5): number {
    return amount - this.calculatePlatformFee(amount, feePercentage);
  }

  /**
   * Format amount for display
   */
  formatAmount(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount); // Amounts are stored in dollars
  }

  /**
   * Check if milestone is overdue
   */
  isOverdue(dueDate: Date): boolean {
    return new Date() > new Date(dueDate);
  }

  /**
   * Calculate days until due
   */
  daysUntilDue(dueDate: Date): number {
    const now = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  /**
   * Get status color for UI
   */
  getStatusColor(status: string): string {
    const statusColors: Record<string, string> = {
      unfunded: 'gray',
      funded: 'blue',
      work_in_progress: 'yellow',
      submitted: 'purple',
      changes_requested: 'orange',
      approved: 'green',
      released: 'green',
      disputed: 'red',
      refunded: 'red',
      expired: 'gray',
    };
    return statusColors[status] || 'gray';
  }

  /**
   * Get status label for UI
   */
  getStatusLabel(status: string): string {
    const statusLabels: Record<string, string> = {
      unfunded: 'Awaiting Funding',
      funded: 'Funded',
      work_in_progress: 'In Progress',
      submitted: 'Under Review',
      changes_requested: 'Changes Requested',
      approved: 'Approved',
      released: 'Payment Released',
      disputed: 'Disputed',
      refunded: 'Refunded',
      expired: 'Expired',
    };
    return statusLabels[status] || status;
  }

  /**
   * Validate file upload
   */
  validateFile(file: File, maxSizeMB: number = 50): { valid: boolean; error?: string } {
    // Check file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return {
        valid: false,
        error: `File size exceeds ${maxSizeMB}MB limit`,
      };
    }

    // Check file type (you can customize allowed types)
    const allowedTypes = [
      'application/pdf',
      'application/zip',
      'application/x-zip-compressed',
      'image/png',
      'image/jpeg',
      'image/jpg',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'File type not supported',
      };
    }

    return { valid: true };
  }

  /**
   * Format timeline event for display
   */
  formatTimelineEvent(event: EscrowTimelineEvent): string {
    const eventMessages: Record<string, string> = {
      funded: 'Milestone funded',
      submitted: 'Deliverables submitted',
      approved: 'Deliverables approved',
      changes_requested: 'Changes requested',
      released: 'Payment released',
      disputed: 'Dispute opened',
      dispute_resolved: 'Dispute resolved',
      refunded: 'Payment refunded',
      deadline_extended: 'Deadline extended',
    };
    return eventMessages[event.eventType] || event.description;
  }
}

// Export singleton instance
export const escrowService = new EscrowService();
export default escrowService;
