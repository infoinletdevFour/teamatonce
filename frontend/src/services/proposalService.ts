/**
 * Proposal Service
 *
 * Service layer for proposal/bidding API calls
 * Handles all proposal-related operations for the bidding system
 */

import { apiClient } from '@/lib/api-client';
import type {
  CreateProposalData,
  UpdateProposalData,
  ReviewProposalData,
  Proposal,
  ProposalsResponse,
  BrowseableProject,
  BrowseableProjectsResponse,
} from '@/types/proposal';

/**
 * Submit a proposal for a project (Developer)
 */
export const submitProposal = async (
  data: CreateProposalData
): Promise<Proposal> => {
  try {
    const response = await apiClient.post<{ data: Proposal }>('/proposals', data);
    return response.data.data;
  } catch (error: any) {
    console.error('Error submitting proposal:', error);
    throw new Error(error.response?.data?.message || 'Failed to submit proposal');
  }
};

/**
 * Get all proposals submitted by current company (Developer)
 */
export const getCompanyProposals = async (
  companyId: string
): Promise<Proposal[]> => {
  try {
    const response = await apiClient.get<ProposalsResponse>(
      `/proposals/company/${companyId}`
    );
    return response.data.proposals || [];
  } catch (error: any) {
    console.error('Error fetching company proposals:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch proposals');
  }
};

/**
 * Get all proposals for a project (Client)
 */
export const getProjectProposals = async (
  projectId: string
): Promise<Proposal[]> => {
  try {
    const response = await apiClient.get<any>(
      `/proposals/project/${projectId}`
    );
    console.log('Raw proposals response:', response.data);

    // Handle different response structures
    // Backend might return: { data: { proposals: [] } } or { proposals: [] } or { data: [] }
    const proposals = response.data?.data?.proposals || response.data?.proposals || response.data?.data || [];
    console.log('Parsed proposals:', proposals);

    return Array.isArray(proposals) ? proposals : [];
  } catch (error: any) {
    console.error('Error fetching project proposals:', error);
    console.error('Error response:', error.response?.data);
    throw new Error(error.response?.data?.message || 'Failed to fetch project proposals');
  }
};

/**
 * Get single proposal by ID
 */
export const getProposal = async (proposalId: string): Promise<Proposal> => {
  try {
    const response = await apiClient.get<{ data: Proposal }>(`/proposals/${proposalId}`);
    return response.data.data;
  } catch (error: any) {
    console.error('Error fetching proposal:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch proposal');
  }
};

/**
 * Update proposal before review (Developer)
 */
export const updateProposal = async (
  proposalId: string,
  data: UpdateProposalData
): Promise<Proposal> => {
  try {
    const response = await apiClient.put<{ data: Proposal }>(
      `/proposals/${proposalId}`,
      data
    );
    return response.data.data;
  } catch (error: any) {
    console.error('Error updating proposal:', error);
    throw new Error(error.response?.data?.message || 'Failed to update proposal');
  }
};

/**
 * Review proposal - accept or reject (Client)
 */
export const reviewProposal = async (
  proposalId: string,
  data: ReviewProposalData
): Promise<Proposal> => {
  try {
    const response = await apiClient.put<{ data: Proposal }>(
      `/proposals/${proposalId}/review`,
      data
    );
    return response.data.data;
  } catch (error: any) {
    console.error('Error reviewing proposal:', error);
    throw new Error(error.response?.data?.message || 'Failed to review proposal');
  }
};

/**
 * Withdraw proposal (Developer)
 */
export const withdrawProposal = async (proposalId: string): Promise<Proposal> => {
  try {
    const response = await apiClient.put<{ data: Proposal }>(
      `/proposals/${proposalId}/withdraw`,
      {}
    );
    return response.data.data;
  } catch (error: any) {
    console.error('Error withdrawing proposal:', error);
    throw new Error(error.response?.data?.message || 'Failed to withdraw proposal');
  }
};

/**
 * Get projects open for bidding (Developer)
 * Projects are sorted by date first, then by AI match score within each page
 */
export const getBrowseableProjects = async (
  filters?: {
    projectType?: string;
    techStack?: string[];
    minBudget?: number;
    maxBudget?: number;
  },
  page: number = 1,
  limit: number = 20
): Promise<BrowseableProjectsResponse> => {
  try {
    const params: any = { page, limit };

    if (filters?.projectType) params.projectType = filters.projectType;
    if (filters?.techStack) params.techStack = filters.techStack.join(',');
    if (filters?.minBudget) params.minBudget = filters.minBudget;
    if (filters?.maxBudget) params.maxBudget = filters.maxBudget;

    const response = await apiClient.get<BrowseableProjectsResponse>(
      '/proposals/browse/projects',
      { params }
    );
    return response.data;
  } catch (error: any) {
    console.error('Error fetching browseable projects:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch projects');
  }
};

/**
 * Browse projects (simplified interface)
 * Wrapper for getBrowseableProjects with simpler signature
 */
export const browseProjects = async (
  page: number = 1,
  limit: number = 20
): Promise<BrowseableProjectsResponse> => {
  return getBrowseableProjects({}, page, limit);
};

/**
 * Get project details with milestones for bidding
 */
export const getProjectForBidding = async (projectId: string): Promise<any> => {
  try {
    // Get project details
    const projectResponse = await apiClient.get(`/projects/${projectId}`);
    const project = projectResponse.data;

    // Get project milestones
    const milestonesResponse = await apiClient.get(`/projects/${projectId}/milestones`);
    const milestones = milestonesResponse.data.milestones || [];

    return {
      ...project,
      milestones,
    };
  } catch (error: any) {
    console.error('Error fetching project for bidding:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch project details');
  }
};

/**
 * Create proposal (alias for submitProposal)
 */
export const createProposal = async (
  data: CreateProposalData
): Promise<Proposal> => {
  return submitProposal(data);
};

/**
 * Export all service functions
 */
export const proposalService = {
  submitProposal,
  createProposal,
  getCompanyProposals,
  getProjectProposals,
  getProposal,
  updateProposal,
  reviewProposal,
  withdrawProposal,
  getBrowseableProjects,
  browseProjects,
  getProjectForBidding,
};

export default proposalService;
