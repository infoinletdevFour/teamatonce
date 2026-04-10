/**
 * Milestone Plan Service for Team@Once
 *
 * Handles all API calls related to milestone planning workflow
 */

import { apiClient } from '@/lib/api-client';

export interface ProposedMilestone {
  name: string;
  description: string;
  milestoneType: string;
  orderIndex: number;
  deliverables: string[];
  acceptanceCriteria: string[];
  estimatedHours: number;
  milestoneAmount: number;
  dueDate?: string;

  // Enhanced professional details
  dependencies?: string[]; // What needs to be completed first
  resourcesRequired?: string[]; // Tools, assets, or resources needed
  reviewProcess?: string; // How client will review this milestone
  qualityMetrics?: string[]; // How success will be measured
  technicalDetails?: string; // Technical implementation details
}

export interface MilestonePlan {
  id: string;
  projectId: string;
  proposalId: string;
  submittedBy: string;
  status: 'draft' | 'pending_review' | 'changes_requested' | 'approved' | 'rejected';
  milestones: ProposedMilestone[];
  submittedAt?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  clientFeedback?: string;
  revisionCount: number;
  version: number;
  createdAt: string;
  updatedAt: string;

  // Enhanced plan-level details
  projectOverview?: string; // Executive summary of the plan
  technicalApproach?: string; // How the work will be executed
  toolsAndTechnologies?: string[]; // Technologies that will be used
  communicationPlan?: string; // How updates will be shared
  assumptions?: string[]; // Assumptions being made
  risks?: string[]; // Potential risks and mitigation strategies
  testingStrategy?: string; // How quality will be ensured
}

export interface CreateMilestonePlanData {
  projectId: string;
  proposalId: string;
  milestones: ProposedMilestone[];
}

export interface UpdateMilestonePlanData {
  milestones?: ProposedMilestone[];
  status?: string;
}

/**
 * Create a new milestone plan (Developer)
 */
export const createMilestonePlan = async (
  projectId: string,
  data: CreateMilestonePlanData
): Promise<MilestonePlan> => {
  const response = await apiClient.post(`/projects/${projectId}/milestone-plans`, data);
  return response.data.data;
};

/**
 * Update existing milestone plan (Developer)
 */
export const updateMilestonePlan = async (
  projectId: string,
  planId: string,
  data: UpdateMilestonePlanData
): Promise<MilestonePlan> => {
  const response = await apiClient.put(`/projects/${projectId}/milestone-plans/${planId}`, data);
  return response.data.data;
};

/**
 * Submit milestone plan for client review (Developer)
 */
export const submitMilestonePlan = async (
  planId: string,
  note: string
): Promise<MilestonePlan> => {
  const response = await apiClient.post(`/milestone-plans/${planId}/submit`, { note });
  return response.data.data;
};

/**
 * Approve milestone plan (Client)
 */
export const approveMilestonePlan = async (
  planId: string,
  notes: string
): Promise<MilestonePlan> => {
  const response = await apiClient.post(`/milestone-plans/${planId}/approve`, { notes });
  return response.data.data;
};

/**
 * Request changes to milestone plan (Client)
 */
export const requestMilestonePlanChanges = async (
  planId: string,
  feedback: string
): Promise<MilestonePlan> => {
  const response = await apiClient.post(`/milestone-plans/${planId}/request-changes`, { feedback });
  return response.data.data;
};

/**
 * Reject milestone plan (Client)
 */
export const rejectMilestonePlan = async (
  planId: string,
  reason: string
): Promise<MilestonePlan> => {
  const response = await apiClient.post(`/milestone-plans/${planId}/reject`, { reason });
  return response.data.data;
};

/**
 * Get milestone plan by ID
 */
export const getMilestonePlan = async (planId: string): Promise<MilestonePlan> => {
  const response = await apiClient.get(`/milestone-plans/${planId}`);
  return response.data.data;
};

/**
 * Get latest milestone plan for a project
 */
export const getLatestMilestonePlan = async (projectId: string): Promise<MilestonePlan | null> => {
  const response = await apiClient.get(`/projects/${projectId}/milestone-plans/latest`);
  return response.data.data;
};

/**
 * Get milestone plan history for a project
 */
export const getMilestonePlanHistory = async (projectId: string): Promise<MilestonePlan[]> => {
  const response = await apiClient.get(`/projects/${projectId}/milestone-plans/history`);
  return response.data.data;
};

/**
 * AI-generate milestone plan suggestions based on project details
 */
export const aiGenerateMilestonePlan = async (projectId: string): Promise<{
  milestones: any[];
  projectId: string;
  proposalId: string;
  projectOverview?: string;
  technicalApproach?: string;
  toolsAndTechnologies?: string[];
  communicationPlan?: string;
  assumptions?: string[];
  risks?: string[];
  testingStrategy?: string;
}> => {
  const response = await apiClient.post(`/projects/${projectId}/milestone-plans/ai-generate`, {});
  return response.data.data;
};

export default {
  createMilestonePlan,
  updateMilestonePlan,
  submitMilestonePlan,
  approveMilestonePlan,
  requestMilestonePlanChanges,
  rejectMilestonePlan,
  getMilestonePlan,
  getLatestMilestonePlan,
  getMilestonePlanHistory,
  aiGenerateMilestonePlan,
};
