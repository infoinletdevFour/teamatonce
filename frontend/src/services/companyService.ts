/**
 * Company Service - Complete API wrapper for Company Management
 * Handles all company-related API calls to backend
 * Base Path: /api/v1/company
 */

import { apiClient } from '@/lib/api-client';
import {
  Company,
  CreateCompanyData,
  UpdateCompanyData,
  UpdateCompanySettingsData,
  CompanyStats,
  CompanyMember,
  UpdateMemberData,
  MemberWorkload,
  TeamWorkload,
  Invitation,
  CreateInvitationData,
  AcceptInvitationData,
  MemberFilters,
  InvitationFilters,
  RevenueData,
  ActiveProject,
  Activity,
  PerformanceMetrics,
  TeamMember,
} from '../types/company';

// Re-export types for consumers
export type {
  CompanyStats,
  RevenueData,
  ActiveProject,
  Activity as Activity,
  PerformanceMetrics,
  TeamMember,
};

// ============================================================================
// Company CRUD Operations
// ============================================================================

/**
 * Create a new company
 * POST /api/v1/company
 */
export const createCompany = async (data: CreateCompanyData): Promise<Company> => {
  try {
    const response = await apiClient.post<Company>('/company', data);
    return response.data;
  } catch (error: any) {
    console.error('[CompanyService] Error creating company:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      fullError: error
    });
    const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to create company';
    throw new Error(errorMessage);
  }
};

/**
 * Get all companies for current user
 * GET /api/v1/company
 */
export const getUserCompanies = async (): Promise<Company[]> => {
  try {
    const response = await apiClient.get('/company');
    // Handle both wrapped { data: [...] } and direct array responses
    const data = response.data?.data || response.data;
    return Array.isArray(data) ? data : [];
  } catch (error: any) {
    console.error('Error fetching user companies:', error);
    // Return empty array for 401/403 errors (user has no companies yet)
    if (error.response?.status === 401 || error.response?.status === 403) {
      return [];
    }
    throw new Error(error.response?.data?.message || 'Failed to fetch companies');
  }
};

/**
 * Get company by ID
 * GET /api/v1/company/:companyId
 */
export const getCompanyById = async (companyId: string): Promise<Company> => {
  try {
    const response = await apiClient.get<Company>(`/company/${companyId}`);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching company:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch company');
  }
};

/**
 * Update company details
 * PUT /api/v1/company/:companyId
 */
export const updateCompany = async (
  companyId: string,
  data: UpdateCompanyData
): Promise<Company> => {
  try {
    const response = await apiClient.put<Company>(`/company/${companyId}`, data);
    return response.data;
  } catch (error: any) {
    console.error('Error updating company:', error);
    throw new Error(error.response?.data?.message || 'Failed to update company');
  }
};

/**
 * Delete company
 * DELETE /api/v1/company/:companyId
 */
export const deleteCompany = async (companyId: string): Promise<{ message: string }> => {
  try {
    const response = await apiClient.delete<{ message: string }>(`/company/${companyId}`);
    return response.data;
  } catch (error: any) {
    console.error('Error deleting company:', error);
    throw new Error(error.response?.data?.message || 'Failed to delete company');
  }
};

// ============================================================================
// Company Settings & Stats
// ============================================================================

/**
 * Update company settings
 * PUT /api/v1/company/:companyId/settings
 */
export const updateCompanySettings = async (
  companyId: string,
  data: UpdateCompanySettingsData
): Promise<Company> => {
  try {
    const response = await apiClient.put<Company>(`/company/${companyId}/settings`, data);
    return response.data;
  } catch (error: any) {
    console.error('Error updating company settings:', error);
    throw new Error(error.response?.data?.message || 'Failed to update settings');
  }
};

/**
 * Get company statistics
 * GET /api/v1/company/:companyId/stats
 */
export const getCompanyStats = async (companyId: string): Promise<CompanyStats> => {
  try {
    const response = await apiClient.get<CompanyStats>(`/company/${companyId}/stats`);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching company stats:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch company stats');
  }
};

// ============================================================================
// Company Members Management
// ============================================================================

/**
 * Get all company members
 * GET /api/v1/company/:companyId/members
 */
export const getCompanyMembers = async (
  companyId: string,
  filters?: MemberFilters
): Promise<CompanyMember[]> => {
  try {
    const params = new URLSearchParams();
    if (filters?.role) params.append('role', filters.role);
    if (filters?.status) params.append('status', filters.status);

    const url = `/company/${companyId}/members${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await apiClient.get<CompanyMember[]>(url);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching company members:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch members');
  }
};

/**
 * Get current user's membership in company
 * GET /api/v1/company/:companyId/members/me
 */
export const getCurrentUserMembership = async (companyId: string): Promise<CompanyMember> => {
  try {
    const response = await apiClient.get<CompanyMember>(`/company/${companyId}/members/me`);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching current user membership:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch membership');
  }
};

/**
 * Get company member by ID
 * GET /api/v1/company/:companyId/members/:memberId
 */
export const getCompanyMember = async (
  companyId: string,
  memberId: string
): Promise<CompanyMember> => {
  try {
    const response = await apiClient.get<CompanyMember>(
      `/company/${companyId}/members/${memberId}`
    );
    return response.data;
  } catch (error: any) {
    console.error('Error fetching company member:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch member');
  }
};

/**
 * Update company member
 * PUT /api/v1/company/:companyId/members/:memberId
 */
export const updateMember = async (
  companyId: string,
  memberId: string,
  data: UpdateMemberData
): Promise<CompanyMember> => {
  try {
    const response = await apiClient.put<CompanyMember>(
      `/company/${companyId}/members/${memberId}`,
      data
    );
    return response.data;
  } catch (error: any) {
    console.error('Error updating member:', error);
    throw new Error(error.response?.data?.message || 'Failed to update member');
  }
};

/**
 * Remove member from company
 * DELETE /api/v1/company/:companyId/members/:memberId
 */
export const removeMember = async (
  companyId: string,
  memberId: string
): Promise<{ message: string }> => {
  try {
    const response = await apiClient.delete<{ message: string }>(
      `/company/${companyId}/members/${memberId}`
    );
    return response.data;
  } catch (error: any) {
    console.error('Error removing member:', error);
    throw new Error(error.response?.data?.message || 'Failed to remove member');
  }
};

// ============================================================================
// Workload Management
// ============================================================================

/**
 * Get member workload
 * GET /api/v1/company/:companyId/members/:memberId/workload
 */
export const getMemberWorkload = async (
  companyId: string,
  memberId: string
): Promise<MemberWorkload> => {
  try {
    const response = await apiClient.get<MemberWorkload>(
      `/company/${companyId}/members/${memberId}/workload`
    );
    return response.data;
  } catch (error: any) {
    console.error('Error fetching member workload:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch workload');
  }
};

/**
 * Get team workload overview
 * GET /api/v1/company/:companyId/workload
 */
export const getTeamWorkload = async (companyId: string): Promise<TeamWorkload> => {
  try {
    const response = await apiClient.get<TeamWorkload>(`/company/${companyId}/workload`);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching team workload:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch team workload');
  }
};

// ============================================================================
// Invitation Management (Company-Scoped)
// ============================================================================

/**
 * Create invitation to join company
 * POST /api/v1/company/:companyId/invitations
 */
export const createInvitation = async (
  companyId: string,
  data: CreateInvitationData
): Promise<Invitation> => {
  try {
    const response = await apiClient.post<Invitation>(
      `/company/${companyId}/invitations`,
      data
    );
    return response.data;
  } catch (error: any) {
    console.error('Error creating invitation:', error);
    throw new Error(error.response?.data?.message || 'Failed to create invitation');
  }
};

/**
 * Get company invitations
 * GET /api/v1/company/:companyId/invitations
 */
export const getCompanyInvitations = async (
  companyId: string,
  filters?: InvitationFilters
): Promise<Invitation[]> => {
  try {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);

    const url = `/company/${companyId}/invitations${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await apiClient.get<Invitation[]>(url);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching company invitations:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch invitations');
  }
};

/**
 * Cancel invitation
 * DELETE /api/v1/company/:companyId/invitations/:invitationId
 */
export const cancelInvitation = async (
  companyId: string,
  invitationId: string
): Promise<{ message: string }> => {
  try {
    const response = await apiClient.delete<{ message: string }>(
      `/company/${companyId}/invitations/${invitationId}`
    );
    return response.data;
  } catch (error: any) {
    console.error('Error cancelling invitation:', error);
    throw new Error(error.response?.data?.message || 'Failed to cancel invitation');
  }
};

/**
 * Resend invitation
 * POST /api/v1/company/:companyId/invitations/:invitationId/resend
 */
export const resendInvitation = async (
  companyId: string,
  invitationId: string
): Promise<Invitation> => {
  try {
    const response = await apiClient.post<Invitation>(
      `/company/${companyId}/invitations/${invitationId}/resend`
    );
    return response.data;
  } catch (error: any) {
    console.error('Error resending invitation:', error);
    throw new Error(error.response?.data?.message || 'Failed to resend invitation');
  }
};

// ============================================================================
// Public Invitation Endpoints (Token-Based)
// ============================================================================

/**
 * Get invitation by token
 * GET /api/v1/company/invitations/:token
 */
export const getInvitationByToken = async (token: string): Promise<Invitation> => {
  try {
    const response = await apiClient.get<Invitation>(`/company/invitations/${token}`);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching invitation by token:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch invitation');
  }
};

/**
 * Accept invitation
 * POST /api/v1/company/invitations/accept/:token
 */
export const acceptInvitation = async (
  token: string,
  data: AcceptInvitationData
): Promise<CompanyMember> => {
  try {
    const response = await apiClient.post<CompanyMember>(
      `/company/invitations/accept/${token}`,
      data
    );
    return response.data;
  } catch (error: any) {
    console.error('Error accepting invitation:', error);
    throw new Error(error.response?.data?.message || 'Failed to accept invitation');
  }
};

/**
 * Decline invitation
 * POST /api/v1/company/invitations/decline/:token
 */
export const declineInvitation = async (token: string): Promise<{ message: string }> => {
  try {
    const response = await apiClient.post<{ message: string }>(
      `/company/invitations/decline/${token}`
    );
    return response.data;
  } catch (error: any) {
    console.error('Error declining invitation:', error);
    throw new Error(error.response?.data?.message || 'Failed to decline invitation');
  }
};

/**
 * Get team member ID for current user in a company
 * Finds the team_member record where user_id matches current user
 * @param companyId - The company ID
 * @param userId - The user ID to search for
 * @returns team_member_id or null if not found
 */
export const getMyTeamMemberId = async (companyId: string, userId: string): Promise<string | null> => {
  try {
    const members = await getCompanyMembers(companyId);
    const myMember = members.find((member: CompanyMember) => member.user_id === userId);
    return myMember?.id || null;
  } catch (error: any) {
    console.error('Error getting team member ID:', error);
    return null;
  }
};

// ============================================================================
// Revenue & Analytics for Developer Dashboard
// ============================================================================

/**
 * Get revenue statistics by period
 * GET /api/v1/analytics/company/:companyId/revenue
 */
export const getRevenueStats = async (
  companyId: string,
  period: 'monthly' | 'quarterly' | 'yearly' = 'monthly'
): Promise<{ total: number; data: RevenueData[] }> => {
  try {
    const response = await apiClient.get(`/analytics/company/${companyId}/revenue`, {
      params: { period }
    });
    return response.data;
  } catch (error: any) {
    console.error('Error fetching revenue stats:', error);
    // Return empty data on error
    return { total: 0, data: [] };
  }
};

/**
 * Get active projects for dashboard
 * GET /api/v1/company/:companyId/projects/active
 */
export const getActiveProjects = async (companyId: string): Promise<ActiveProject[]> => {
  try {
    const response = await apiClient.get(`/company/${companyId}/projects`, {
      params: { status: 'active', limit: 5 }
    });
    // Map response to ActiveProject format
    const projects = response.data.projects || response.data || [];
    return projects.map((p: any) => ({
      id: p.id,
      name: p.title || p.name,
      client: p.client_name || p.client?.name || 'Unknown Client',
      status: p.status || 'active',
      budget: p.budget || 0,
      spent: p.amount_paid || 0,
      progress: p.progress || 0,
      teamMembers: p.team_members || [],
      dueDate: p.expected_completion_date || p.end_date || new Date().toISOString(),
    }));
  } catch (error: any) {
    console.error('Error fetching active projects:', error);
    return [];
  }
};

/**
 * Get recent activities for dashboard
 * GET /api/v1/company/:companyId/activities
 */
export const getRecentActivities = async (companyId: string, limit: number = 5): Promise<Activity[]> => {
  try {
    const response = await apiClient.get(`/company/${companyId}/activities`, {
      params: { limit }
    });
    const activities = response.data?.data?.activities || response.data?.activities || response.data || [];
    return activities.map((a: any) => ({
      id: a.id,
      type: a.type || 'project',
      message: a.message || a.description || '',
      timestamp: a.timestamp || a.created_at || new Date().toISOString(),
      userId: a.userId || a.user_id,
      projectId: a.projectId || a.project_id,
    }));
  } catch (error: any) {
    console.error('Error fetching recent activities:', error);
    return [];
  }
};

/**
 * Get team performance metrics
 * GET /api/v1/analytics/company/:companyId/team-utilization
 */
export const getTeamPerformanceMetrics = async (companyId: string): Promise<PerformanceMetrics> => {
  try {
    const response = await apiClient.get(`/company/${companyId}/performance-metrics`);
    // Extract data from response (handle both { data: ... } and direct response)
    const data = response.data?.data || response.data;
    return {
      totalTasks: data.totalTasks ?? 0,
      completedTasks: data.completedTasks ?? 0,
      inProgressTasks: data.inProgressTasks ?? 0,
      overdueTasks: data.overdueTasks ?? 0,
      onTimeDelivery: data.onTimeDelivery ?? 0,
      codeQuality: data.codeQuality ?? 0,
      clientSatisfaction: data.clientSatisfaction ?? 0,
      averageRating: data.averageRating ?? 0,
    };
  } catch (error: any) {
    console.error('Error fetching team performance metrics:', error);
    // Return zeros on error - no dummy data
    return {
      totalTasks: 0,
      completedTasks: 0,
      inProgressTasks: 0,
      overdueTasks: 0,
      onTimeDelivery: 0,
      codeQuality: 0,
      clientSatisfaction: 0,
      averageRating: 0,
    };
  }
};

// ============================================================================
// Professional Profile Management
// ============================================================================

/**
 * Get company professional profile
 * GET /api/v1/company/:companyId/profile
 */
export const getCompanyProfile = async (companyId: string): Promise<any> => {
  try {
    const response = await apiClient.get(`/company/${companyId}/profile`);
    return response.data?.data || response.data;
  } catch (error: any) {
    console.error('Error fetching company profile:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch profile');
  }
};

/**
 * Update company professional profile
 * PUT /api/v1/company/:companyId/profile
 */
export const updateCompanyProfile = async (
  companyId: string,
  profileData: any
): Promise<any> => {
  try {
    const response = await apiClient.put(`/company/${companyId}/profile`, profileData);
    return response.data?.data || response.data;
  } catch (error: any) {
    console.error('Error updating company profile:', error);
    throw new Error(error.response?.data?.message || 'Failed to update profile');
  }
};

/**
 * Upload profile image (cover, avatar, or portfolio)
 * POST /api/v1/company/:companyId/upload-image
 */
export const uploadProfileImage = async (
  companyId: string,
  file: File,
  type: 'cover' | 'avatar' | 'portfolio'
): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    const response = await apiClient.post(`/company/${companyId}/upload-image`, formData);
    const imageUrl = response.data?.data?.url || response.data?.url;

    if (!imageUrl) {
      throw new Error('No image URL returned from server');
    }

    return imageUrl;
  } catch (error: any) {
    console.error('Error uploading profile image:', error);
    throw new Error(error.response?.data?.message || 'Failed to upload image');
  }
};

// ============================================================================
// Export all functions as default object
// ============================================================================

const companyService = {
  // Company CRUD
  createCompany,
  getUserCompanies,
  getCompanyById,
  updateCompany,
  deleteCompany,

  // Settings & Stats
  updateCompanySettings,
  getCompanyStats,

  // Members
  getCompanyMembers,
  getCurrentUserMembership,
  getCompanyMember,
  updateMember,
  removeMember,

  // Workload
  getMemberWorkload,
  getTeamWorkload,

  // Invitations (Company-scoped)
  createInvitation,
  getCompanyInvitations,
  cancelInvitation,
  resendInvitation,

  // Invitations (Public/Token-based)
  getInvitationByToken,
  acceptInvitation,
  declineInvitation,

  // Helper Functions
  getMyTeamMemberId,

  // Dashboard Analytics
  getRevenueStats,
  getActiveProjects,
  getRecentActivities,
  getTeamPerformanceMetrics,

  // Professional Profile
  getCompanyProfile,
  updateCompanyProfile,
  uploadProfileImage,
};

export default companyService;
