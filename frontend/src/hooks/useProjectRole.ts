/**
 * useProjectRole Hook
 *
 * Determines the user's role and permissions in a project by checking
 * the project_members table via the backend API.
 *
 * @example
 * ```tsx
 * const { role, isClient, canApproveMilestone, loading } = useProjectRole(projectId);
 *
 * if (loading) return <Spinner />;
 *
 * if (canApproveMilestone) {
 *   return <ApproveMilestoneButton />;
 * }
 * ```
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { checkProjectAccess, getProject, type ProjectAccessResponse } from '@/services/projectService';
import type { Project } from '@/types/project';

// ============================================================================
// Types
// ============================================================================

/**
 * User role in the project
 */
export type ProjectRole = 'client' | 'developer' | 'team_lead' | 'owner' | 'admin' | 'viewer' | 'none';

/**
 * Return type for the useProjectRole hook
 */
export interface UseProjectRoleResult {
  // Role Information
  role: ProjectRole;
  isClient: boolean;
  isDeveloper: boolean;
  isTeamLead: boolean;
  hasAccess: boolean;

  // Milestone Permissions
  canCreateMilestone: boolean;
  canEditMilestone: boolean;
  canDeleteMilestone: boolean;
  canApproveMilestone: boolean;
  canSubmitMilestone: boolean;
  canRequestFeedback: boolean;
  canUpdateMilestoneStatus: boolean;

  // Raw permissions from backend
  permissions: string[];

  // State
  loading: boolean;
  error: Error | null;

  // Project Data (optional, for convenience)
  project: Project | null;

  // Refresh function
  refetch: () => Promise<void>;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Custom hook to determine user role and permissions in a project
 * Uses the backend API to check project_members table for accurate access control
 *
 * @param projectId - The ID of the project to check permissions for
 * @returns Object containing role, permissions, and state
 */
export function useProjectRole(projectId: string | undefined): UseProjectRoleResult {
  const { user, isAuthenticated } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [accessData, setAccessData] = useState<ProjectAccessResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // ============================================================================
  // Fetch Access Data from Backend
  // ============================================================================

  const fetchAccessData = useCallback(async () => {
    // Early return if no projectId or user
    if (!projectId || !isAuthenticated || !user) {
      setAccessData(null);
      setProject(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch access data from backend API (checks project_members table)
      const [access, projectData] = await Promise.all([
        checkProjectAccess(projectId),
        getProject(projectId).catch(() => null), // Project data is optional
      ]);

      setAccessData(access);
      setProject(projectData);
    } catch (err) {
      console.error('Error checking project access:', err);
      setError(err instanceof Error ? err : new Error('Failed to check project access'));
      setAccessData(null);
      setProject(null);
    } finally {
      setLoading(false);
    }
  }, [projectId, isAuthenticated, user]);

  // Fetch on mount and when dependencies change
  useEffect(() => {
    fetchAccessData();
  }, [fetchAccessData]);

  // ============================================================================
  // Determine Role from Backend Response
  // ============================================================================

  const determineRole = useCallback((): ProjectRole => {
    if (!accessData || !accessData.hasAccess) return 'none';

    const backendRole = accessData.role;
    const memberType = accessData.memberType;

    // Map backend role to frontend role
    if (backendRole === 'owner' || memberType === 'client') {
      return 'client';
    }

    if (backendRole === 'admin') {
      return 'team_lead';
    }

    if (backendRole === 'developer' || memberType === 'developer') {
      return 'developer';
    }

    if (backendRole === 'viewer') {
      return 'developer'; // Viewers have limited developer access
    }

    // Fallback: if they have access but unknown role, treat as developer
    return 'developer';
  }, [accessData]);

  const role = determineRole();

  // ============================================================================
  // Access and Role Flags
  // ============================================================================

  const hasAccess = accessData?.hasAccess ?? false;
  const isClient = role === 'client';
  const isTeamLead = role === 'team_lead';
  const isDeveloper = role === 'developer' || role === 'team_lead';

  // ============================================================================
  // Permission Calculations
  // ============================================================================

  const permissions = accessData?.permissions ?? [];

  /**
   * Client Permissions:
   * - Create, edit, delete milestones
   * - Approve milestones
   * - Request feedback
   *
   * Developer Permissions (includes team leads):
   * - Submit milestones
   * - Update milestone status
   */

  const canCreateMilestone = isClient || permissions.includes('edit_milestones');
  const canEditMilestone = isClient || permissions.includes('edit_milestones');
  const canDeleteMilestone = isClient;
  const canApproveMilestone = isClient || permissions.includes('approve_milestones');
  const canRequestFeedback = isClient;

  const canSubmitMilestone = isDeveloper || permissions.includes('update_milestones');
  const canUpdateMilestoneStatus = isDeveloper || permissions.includes('update_milestones');

  // ============================================================================
  // Return Hook Result
  // ============================================================================

  return {
    // Role Information
    role,
    isClient,
    isDeveloper,
    isTeamLead,
    hasAccess,

    // Milestone Permissions
    canCreateMilestone,
    canEditMilestone,
    canDeleteMilestone,
    canApproveMilestone,
    canSubmitMilestone,
    canRequestFeedback,
    canUpdateMilestoneStatus,

    // Raw permissions
    permissions,

    // State
    loading,
    error,

    // Project Data
    project,

    // Refresh function
    refetch: fetchAccessData,
  };
}

// ============================================================================
// Export Default
// ============================================================================

export default useProjectRole;
