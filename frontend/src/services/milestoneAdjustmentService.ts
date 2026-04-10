/**
 * Milestone Adjustment Service
 *
 * Handles API calls for requesting and managing milestone adjustments
 * after a milestone plan has been approved.
 */

import { apiClient } from '@/lib/api-client';

export enum MilestoneAdjustmentStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export interface MilestoneChanges {
  name?: string;
  description?: string;
  estimatedHours?: number;
  milestoneAmount?: number;
  dueDate?: string;
  deliverables?: string[];
  acceptanceCriteria?: string[];
}

export interface MilestoneAdjustmentRequest {
  id: string;
  milestoneId: string;
  projectId: string;
  requestedBy: string;
  status: MilestoneAdjustmentStatus;
  changes: MilestoneChanges;
  reason: string;
  reviewedBy?: string;
  reviewedAt?: string;
  clientResponse?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAdjustmentRequestData {
  milestoneId: string;
  changes: MilestoneChanges;
  reason: string;
}

/**
 * Create a milestone adjustment request (Developer)
 */
export const createAdjustmentRequest = async (
  milestoneId: string,
  data: CreateAdjustmentRequestData
): Promise<MilestoneAdjustmentRequest> => {
  const response = await apiClient.post(
    `/milestones/${milestoneId}/adjustment-requests`,
    data
  );
  return response.data.data;
};

/**
 * Approve adjustment request (Client)
 */
export const approveAdjustmentRequest = async (
  requestId: string,
  notes?: string
): Promise<MilestoneAdjustmentRequest> => {
  const response = await apiClient.post(
    `/adjustment-requests/${requestId}/approve`,
    { notes: notes || '' }
  );
  return response.data.data;
};

/**
 * Reject adjustment request (Client)
 */
export const rejectAdjustmentRequest = async (
  requestId: string,
  response: string
): Promise<MilestoneAdjustmentRequest> => {
  const result = await apiClient.post(
    `/adjustment-requests/${requestId}/reject`,
    { response }
  );
  return result.data.data;
};

/**
 * Get single adjustment request
 */
export const getAdjustmentRequest = async (
  requestId: string
): Promise<MilestoneAdjustmentRequest> => {
  const response = await apiClient.get(`/adjustment-requests/${requestId}`);
  return response.data.data;
};

/**
 * Get all adjustment requests for a milestone
 */
export const getAdjustmentRequestsByMilestone = async (
  milestoneId: string
): Promise<MilestoneAdjustmentRequest[]> => {
  const response = await apiClient.get(
    `/milestones/${milestoneId}/adjustment-requests`
  );
  return response.data.data;
};

/**
 * Get all adjustment requests for a project
 */
export const getAdjustmentRequestsByProject = async (
  projectId: string
): Promise<MilestoneAdjustmentRequest[]> => {
  const response = await apiClient.get(
    `/projects/${projectId}/adjustment-requests`
  );
  return response.data.data;
};
/**
 * Withdraw adjustment request (Developer)
 */
export const withdrawAdjustmentRequest = async (
  requestId: string
): Promise<void> => {
  await apiClient.post(`/adjustment-requests/${requestId}/withdraw`, {});
};
