/**
 * Team Member Service
 *
 * Service layer for team member management API calls
 * Provides wrapper functions for all team member endpoints
 */

import { apiClient } from '@/lib/api-client';
import type {
  TeamMember,
  CreateTeamMemberData,
  UpdateTeamMemberData,
  TeamMemberAssignment,
} from '@/types/teamMember';

/**
 * Base path for team member API endpoints
 */
const getTeamMemberBasePath = (companyId: string) => `/company/${companyId}/members`;
const getInvitationBasePath = (companyId: string) => `/company/${companyId}/invitations`;

/**
 * Get all team members for a company
 * Backend returns array directly, not wrapped in { data: [...] }
 */
export const getTeamMembers = async (companyId: string): Promise<TeamMember[]> => {
  try {
    const response = await apiClient.get<TeamMember[]>(
      getTeamMemberBasePath(companyId)
    );
    // Backend returns array directly
    return response.data;
  } catch (error: any) {
    console.error('Error fetching team members:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch team members');
  }
};

/**
 * Get a single team member by ID
 * Backend returns member directly, not wrapped
 */
export const getTeamMember = async (
  companyId: string,
  memberId: string
): Promise<TeamMember> => {
  try {
    const response = await apiClient.get<TeamMember>(
      `${getTeamMemberBasePath(companyId)}/${memberId}`
    );
    return response.data;
  } catch (error: any) {
    console.error('Error fetching team member:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch team member');
  }
};

/**
 * Add a new team member (send invitation)
 * Backend returns invitation directly, not wrapped
 */
export const addTeamMember = async (
  companyId: string,
  data: CreateTeamMemberData
): Promise<TeamMember> => {
  try {
    const response = await apiClient.post<TeamMember>(
      getInvitationBasePath(companyId),
      data
    );
    return response.data;
  } catch (error: any) {
    console.error('Error adding team member:', error);
    throw new Error(error.response?.data?.message || 'Failed to add team member');
  }
};

/**
 * Update an existing team member
 * Backend returns member directly, not wrapped
 */
export const updateTeamMember = async (
  companyId: string,
  memberId: string,
  data: UpdateTeamMemberData
): Promise<TeamMember> => {
  try {
    const response = await apiClient.put<TeamMember>(
      `${getTeamMemberBasePath(companyId)}/${memberId}`,
      data
    );
    return response.data;
  } catch (error: any) {
    console.error('Error updating team member:', error);
    throw new Error(error.response?.data?.message || 'Failed to update team member');
  }
};

/**
 * Remove a team member
 */
export const removeTeamMember = async (
  companyId: string,
  memberId: string
): Promise<void> => {
  try {
    await apiClient.delete(`${getTeamMemberBasePath(companyId)}/${memberId}`);
  } catch (error: any) {
    console.error('Error removing team member:', error);
    throw new Error(error.response?.data?.message || 'Failed to remove team member');
  }
};

/**
 * Update team member role
 * Backend returns member directly, not wrapped
 */
export const updateTeamMemberRole = async (
  companyId: string,
  memberId: string,
  role: string
): Promise<TeamMember> => {
  try {
    const response = await apiClient.put<TeamMember>(
      `${getTeamMemberBasePath(companyId)}/${memberId}/role`,
      { role }
    );
    return response.data;
  } catch (error: any) {
    console.error('Error updating team member role:', error);
    throw new Error(error.response?.data?.message || 'Failed to update team member role');
  }
};

/**
 * Get team member assignments (projects)
 * Backend returns array directly, not wrapped
 */
export const getTeamMemberAssignments = async (
  companyId: string,
  memberId: string
): Promise<TeamMemberAssignment[]> => {
  try {
    const response = await apiClient.get<TeamMemberAssignment[]>(
      `${getTeamMemberBasePath(companyId)}/${memberId}/assignments`
    );
    return response.data;
  } catch (error: any) {
    console.error('Error fetching team member assignments:', error);
    throw new Error(
      error.response?.data?.message || 'Failed to fetch team member assignments'
    );
  }
};

/**
 * Assign team member to a project
 * Backend returns assignment directly, not wrapped
 */
export const assignTeamMemberToProject = async (
  companyId: string,
  memberId: string,
  projectId: string,
  hoursAllocated?: number
): Promise<TeamMemberAssignment> => {
  try {
    const response = await apiClient.post<TeamMemberAssignment>(
      `${getTeamMemberBasePath(companyId)}/${memberId}/assignments`,
      {
        project_id: projectId,
        hours_allocated: hoursAllocated,
      }
    );
    return response.data;
  } catch (error: any) {
    console.error('Error assigning team member to project:', error);
    throw new Error(
      error.response?.data?.message || 'Failed to assign team member to project'
    );
  }
};

/**
 * Unassign team member from a project
 */
export const unassignTeamMemberFromProject = async (
  companyId: string,
  memberId: string,
  projectId: string
): Promise<void> => {
  try {
    await apiClient.delete(
      `${getTeamMemberBasePath(companyId)}/${memberId}/assignments/${projectId}`
    );
  } catch (error: any) {
    console.error('Error unassigning team member from project:', error);
    throw new Error(
      error.response?.data?.message || 'Failed to unassign team member from project'
    );
  }
};

/**
 * Batch update team member workloads
 * Backend returns array directly, not wrapped
 */
export const updateTeamMemberWorkloads = async (
  companyId: string,
  updates: Array<{ memberId: string; workloadPercentage: number }>
): Promise<TeamMember[]> => {
  try {
    const response = await apiClient.put<TeamMember[]>(
      `${getTeamMemberBasePath(companyId)}/workloads`,
      { updates }
    );
    return response.data;
  } catch (error: any) {
    console.error('Error updating team member workloads:', error);
    throw new Error(
      error.response?.data?.message || 'Failed to update team member workloads'
    );
  }
};

/**
 * Get team statistics
 */
export const getTeamStatistics = async (companyId: string) => {
  try {
    const members = await getTeamMembers(companyId);

    return {
      total_members: members.length,
      online_members: members.filter(m => m.online_status).length,
      available_members: members.filter(m => m.availability === 'available').length,
      active_projects: members.reduce((acc, m) => acc + m.current_projects, 0),
      average_utilization: Math.round(
        members.reduce((acc, m) => acc + m.workload_percentage, 0) / members.length
      ),
    };
  } catch (error: any) {
    console.error('Error fetching team statistics:', error);
    throw new Error(error.response?.data?.message || 'Failed to fetch team statistics');
  }
};

/**
 * Get project team (all team members assigned to a specific project)
 * Uses GET /api/v1/projects/{id}/members endpoint
 * Fetches from project_members table
 */
export const getProjectTeam = async (projectId: string): Promise<TeamMember[]> => {
  try {
    const response = await apiClient.get<{
      members: any[];
      total?: number;
      projectId?: string;
    } | { data: any[] }>(
      `/projects/${projectId}/members`
    );

    // Get the raw members data
    const rawMembers = 'members' in response.data ? response.data.members : response.data.data;

    if (!rawMembers || !Array.isArray(rawMembers)) {
      return [];
    }

    // Transform API response to match TeamMember interface
    // Backend response structure: { id, userId, memberType, companyId, role, permissions, joinedAt, isActive, user: { id, name, email, avatar } }
    const transformedMembers: TeamMember[] = rawMembers.map((member: any) => ({
      id: member.id,
      company_id: member.companyId || member.company_id || '',
      user_id: member.userId || member.user_id || '',
      name: member.user?.name || member.name || 'Unknown User',
      email: member.user?.email || member.email || '',
      avatar: member.user?.avatar || member.avatar,
      role: (member.role || member.memberType || 'developer') as TeamMember['role'],
      title: member.title,
      permissions: member.permissions || {},
      skills: member.skills || [],
      specializations: member.specializations || [],
      workload_percentage: member.workload_percentage || 0,
      availability: member.availability || 'available',
      online_status: member.online_status || false,
      current_projects: member.current_projects || 0,
      current_project_names: member.current_project_names || [],
      hourly_rate: member.hourly_rate,
      location: member.location,
      timezone: member.timezone,
      rating: member.rating,
      projects_completed: member.completed_projects || 0,
      hours_worked: member.hours_worked || 0,
      expertise: member.expertise || [],
      social_links: member.social_links,
      joined_date: member.joinedAt || member.joined_at || member.joined_date,
      created_at: member.createdAt || member.created_at || member.joinedAt || member.joined_at || new Date().toISOString(),
      updated_at: member.updatedAt || member.updated_at || new Date().toISOString(),
      is_owner: member.is_owner || false,
    }));

    return transformedMembers;
  } catch (error: any) {
    console.error('Error fetching project team:', error);
    // Return empty array if no team assigned yet
    if (error.response?.status === 404) {
      return [];
    }
    throw new Error(error.response?.data?.message || 'Failed to fetch project team');
  }
};

/**
 * Assign team member to project (using project-based endpoint)
 * Backend returns assignment directly, not wrapped
 */
export const assignMemberToProject = async (
  projectId: string,
  data: {
    team_member_id: string;
    project_role?: string;
    allocation_percentage?: number;
    hourly_rate?: number;
  }
): Promise<TeamMemberAssignment> => {
  try {
    const response = await apiClient.post<TeamMemberAssignment>(
      `/teamatonce/team/assignments/project/${projectId}`,
      data
    );
    return response.data;
  } catch (error: any) {
    console.error('Error assigning team member to project:', error);
    throw new Error(
      error.response?.data?.message || 'Failed to assign team member to project'
    );
  }
};

/**
 * Remove team member from project (by assignment ID - deprecated)
 * @deprecated Use removeProjectMember instead
 */
export const removeMemberFromProject = async (assignmentId: string): Promise<void> => {
  try {
    await apiClient.delete(`/teamatonce/team/assignments/${assignmentId}`);
  } catch (error: any) {
    console.error('Error removing team member from project:', error);
    throw new Error(
      error.response?.data?.message || 'Failed to remove team member from project'
    );
  }
};

/**
 * Remove a member from a project
 * Uses DELETE /projects/:projectId/members/:userId endpoint
 * @param projectId Project ID
 * @param userId User ID of the member to remove
 */
export const removeProjectMember = async (projectId: string, userId: string): Promise<void> => {
  try {
    await apiClient.delete(`/projects/${projectId}/members/${userId}`);
  } catch (error: any) {
    console.error('Error removing project member:', error);
    throw new Error(
      error.response?.data?.message || 'Failed to remove member from project'
    );
  }
};

/**
 * Export all service functions
 */
export const teamMemberService = {
  getTeamMembers,
  getTeamMember,
  addTeamMember,
  updateTeamMember,
  removeTeamMember,
  updateTeamMemberRole,
  getTeamMemberAssignments,
  assignTeamMemberToProject,
  unassignTeamMemberFromProject,
  updateTeamMemberWorkloads,
  getTeamStatistics,
  getProjectTeam,
  assignMemberToProject,
  removeMemberFromProject,
  removeProjectMember,
};

export default teamMemberService;
