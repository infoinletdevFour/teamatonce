/**
 * Workspace Service - Complete API wrapper for Workspace Management
 * Handles all workspace-related API calls to backend
 * Base Path: /api/v1/workspace
 */

import { apiClient } from '@/lib/api-client';
import {
  Workspace,
  WorkspaceMember,
  WorkspaceStats,
  WorkspaceInvitation,
  CreateWorkspaceData,
  UpdateWorkspaceData,
  InviteMemberData,
  UpdateMemberRoleData,
  WorkspaceFilters,
  MemberFilters,
} from '../types/workspace';

// ============================================================================
// Workspace CRUD Operations
// ============================================================================

/**
 * Get all workspaces for current user
 * GET /api/v1/workspace
 */
export const getUserWorkspaces = async (filters?: WorkspaceFilters): Promise<Workspace[]> => {
  try {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.visibility) params.append('visibility', filters.visibility);
    if (filters?.search) params.append('search', filters.search);

    const queryString = params.toString();
    const url = queryString ? `/workspace?${queryString}` : '/workspace';

    const response = await apiClient.get<Workspace[]>(url);
    return response.data || [];
  } catch (error: any) {
    console.error('[WorkspaceService] Error fetching workspaces:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch workspaces');
  }
};

/**
 * Get workspace by ID
 * GET /api/v1/workspace/:workspaceId
 */
export const getWorkspaceById = async (workspaceId: string): Promise<Workspace> => {
  try {
    const response = await apiClient.get<Workspace>(`/workspace/${workspaceId}`);
    return response.data;
  } catch (error: any) {
    console.error('[WorkspaceService] Error fetching workspace:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch workspace');
  }
};

/**
 * Create a new workspace
 * POST /api/v1/workspace
 */
export const createWorkspace = async (data: CreateWorkspaceData): Promise<Workspace> => {
  try {
    const response = await apiClient.post<Workspace>('/workspace', data);
    return response.data;
  } catch (error: any) {
    console.error('[WorkspaceService] Error creating workspace:', error);
    const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to create workspace';
    throw new Error(errorMessage);
  }
};

/**
 * Update workspace
 * PATCH /api/v1/workspace/:workspaceId
 */
export const updateWorkspace = async (
  workspaceId: string,
  data: UpdateWorkspaceData
): Promise<Workspace> => {
  try {
    const response = await apiClient.patch<Workspace>(`/workspace/${workspaceId}`, data);
    return response.data;
  } catch (error: any) {
    console.error('[WorkspaceService] Error updating workspace:', error);
    throw new Error(error.response?.data?.message || 'Failed to update workspace');
  }
};

/**
 * Delete workspace
 * DELETE /api/v1/workspace/:workspaceId
 */
export const deleteWorkspace = async (workspaceId: string): Promise<void> => {
  try {
    await apiClient.delete(`/workspace/${workspaceId}`);
  } catch (error: any) {
    console.error('[WorkspaceService] Error deleting workspace:', error);
    throw new Error(error.response?.data?.message || 'Failed to delete workspace');
  }
};

// ============================================================================
// Workspace Stats
// ============================================================================

/**
 * Get workspace statistics
 * GET /api/v1/workspace/:workspaceId/stats
 */
export const getWorkspaceStats = async (workspaceId: string): Promise<WorkspaceStats> => {
  try {
    const response = await apiClient.get<WorkspaceStats>(`/workspace/${workspaceId}/stats`);
    return response.data;
  } catch (error: any) {
    console.error('[WorkspaceService] Error fetching workspace stats:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch workspace stats');
  }
};

// ============================================================================
// Member Management
// ============================================================================

/**
 * Get workspace members
 * GET /api/v1/workspace/:workspaceId/members
 */
export const getWorkspaceMembers = async (
  workspaceId: string,
  filters?: MemberFilters
): Promise<WorkspaceMember[]> => {
  try {
    const params = new URLSearchParams();
    if (filters?.role) params.append('role', filters.role);
    if (filters?.search) params.append('search', filters.search);

    const queryString = params.toString();
    const url = queryString
      ? `/workspace/${workspaceId}/members?${queryString}`
      : `/workspace/${workspaceId}/members`;

    const response = await apiClient.get<WorkspaceMember[]>(url);
    return response.data || [];
  } catch (error: any) {
    console.error('[WorkspaceService] Error fetching members:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch members');
  }
};

/**
 * Get current user's membership in workspace
 * GET /api/v1/workspace/:workspaceId/members/me
 */
export const getCurrentUserMembership = async (workspaceId: string): Promise<WorkspaceMember> => {
  try {
    const response = await apiClient.get<WorkspaceMember>(
      `/workspace/${workspaceId}/members/me`
    );
    return response.data;
  } catch (error: any) {
    console.error('[WorkspaceService] Error fetching membership:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch membership');
  }
};

/**
 * Update member role
 * PATCH /api/v1/workspace/:workspaceId/members/:memberId
 */
export const updateMemberRole = async (
  workspaceId: string,
  memberId: string,
  data: UpdateMemberRoleData
): Promise<WorkspaceMember> => {
  try {
    const response = await apiClient.patch<WorkspaceMember>(
      `/workspace/${workspaceId}/members/${memberId}`,
      data
    );
    return response.data;
  } catch (error: any) {
    console.error('[WorkspaceService] Error updating member role:', error);
    throw new Error(error.response?.data?.message || 'Failed to update member role');
  }
};

/**
 * Remove member from workspace
 * DELETE /api/v1/workspace/:workspaceId/members/:memberId
 */
export const removeMember = async (workspaceId: string, memberId: string): Promise<void> => {
  try {
    await apiClient.delete(`/workspace/${workspaceId}/members/${memberId}`);
  } catch (error: any) {
    console.error('[WorkspaceService] Error removing member:', error);
    throw new Error(error.response?.data?.message || 'Failed to remove member');
  }
};

// ============================================================================
// Invitation Management
// ============================================================================

/**
 * Invite member to workspace
 * POST /api/v1/workspace/:workspaceId/invitations
 */
export const inviteMember = async (
  workspaceId: string,
  data: InviteMemberData
): Promise<WorkspaceInvitation> => {
  try {
    const response = await apiClient.post<WorkspaceInvitation>(
      `/workspace/${workspaceId}/invitations`,
      data
    );
    return response.data;
  } catch (error: any) {
    console.error('[WorkspaceService] Error inviting member:', error);
    throw new Error(error.response?.data?.message || 'Failed to invite member');
  }
};

/**
 * Get workspace invitations
 * GET /api/v1/workspace/:workspaceId/invitations
 */
export const getWorkspaceInvitations = async (
  workspaceId: string
): Promise<WorkspaceInvitation[]> => {
  try {
    const response = await apiClient.get<WorkspaceInvitation[]>(
      `/workspace/${workspaceId}/invitations`
    );
    return response.data || [];
  } catch (error: any) {
    console.error('[WorkspaceService] Error fetching invitations:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch invitations');
  }
};

/**
 * Cancel invitation
 * DELETE /api/v1/workspace/:workspaceId/invitations/:invitationId
 */
export const cancelInvitation = async (
  workspaceId: string,
  invitationId: string
): Promise<void> => {
  try {
    await apiClient.delete(`/workspace/${workspaceId}/invitations/${invitationId}`);
  } catch (error: any) {
    console.error('[WorkspaceService] Error canceling invitation:', error);
    throw new Error(error.response?.data?.message || 'Failed to cancel invitation');
  }
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get current workspace from localStorage
 */
export const getCurrentWorkspace = (): Workspace | null => {
  try {
    const stored = localStorage.getItem('currentWorkspace');
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('[WorkspaceService] Error getting current workspace:', error);
    return null;
  }
};

/**
 * Set current workspace in localStorage
 */
export const setCurrentWorkspace = (workspace: Workspace | null): void => {
  try {
    if (workspace) {
      localStorage.setItem('currentWorkspace', JSON.stringify(workspace));
      localStorage.setItem('selectedWorkspaceId', workspace.id);
    } else {
      localStorage.removeItem('currentWorkspace');
      localStorage.removeItem('selectedWorkspaceId');
    }
  } catch (error) {
    console.error('[WorkspaceService] Error setting current workspace:', error);
  }
};

/**
 * Switch to a different workspace
 */
export const switchWorkspace = async (workspaceId: string): Promise<Workspace> => {
  try {
    const workspace = await getWorkspaceById(workspaceId);
    setCurrentWorkspace(workspace);
    return workspace;
  } catch (error) {
    console.error('[WorkspaceService] Error switching workspace:', error);
    throw error;
  }
};

// ============================================================================
// Export as default object
// ============================================================================

const workspaceService = {
  getUserWorkspaces,
  getWorkspaceById,
  createWorkspace,
  updateWorkspace,
  deleteWorkspace,
  getWorkspaceStats,
  getWorkspaceMembers,
  getCurrentUserMembership,
  updateMemberRole,
  removeMember,
  inviteMember,
  getWorkspaceInvitations,
  cancelInvitation,
  getCurrentWorkspace,
  setCurrentWorkspace,
  switchWorkspace,
};

export default workspaceService;
