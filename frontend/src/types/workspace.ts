/**
 * Workspace Management Types for Deskive
 * Workspace = Team/Organization context for projects and collaboration
 */

// ============================================================================
// Enums
// ============================================================================

export enum WorkspaceRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
  GUEST = 'guest',
}

export enum WorkspaceStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ARCHIVED = 'archived',
}

export enum WorkspaceVisibility {
  PRIVATE = 'private',
  PUBLIC = 'public',
}

// ============================================================================
// Core Workspace Types
// ============================================================================

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  color?: string;

  // Workspace settings
  visibility: WorkspaceVisibility;
  status: WorkspaceStatus;

  // Ownership
  owner_id: string;

  // Metadata
  created_at: string;
  updated_at: string;

  // Counts (from relations)
  member_count?: number;
  project_count?: number;

  // User's role in this workspace
  user_role?: WorkspaceRole;
}

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: WorkspaceRole;

  // User details (from join)
  user?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };

  // Permissions
  permissions?: string[];

  // Metadata
  joined_at: string;
  invited_by?: string;
  last_active_at?: string;
}

export interface WorkspaceStats {
  total_projects: number;
  active_projects: number;
  completed_projects: number;
  total_members: number;
  total_tasks: number;
  completed_tasks: number;
  storage_used_mb: number;
  storage_limit_mb: number;
}

export interface WorkspaceInvitation {
  id: string;
  workspace_id: string;
  email: string;
  role: WorkspaceRole;
  invited_by: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  token?: string;
  expires_at: string;
  created_at: string;
}

// ============================================================================
// Request/Response Types
// ============================================================================

export interface CreateWorkspaceData {
  name: string;
  slug?: string;
  description?: string;
  logo?: string;
  color?: string;
  visibility?: WorkspaceVisibility;
}

export interface UpdateWorkspaceData {
  name?: string;
  slug?: string;
  description?: string;
  logo?: string;
  color?: string;
  visibility?: WorkspaceVisibility;
  status?: WorkspaceStatus;
}

export interface InviteMemberData {
  email: string;
  role: WorkspaceRole;
  message?: string;
}

export interface UpdateMemberRoleData {
  role: WorkspaceRole;
}

// ============================================================================
// Filter Types
// ============================================================================

export interface WorkspaceFilters {
  status?: WorkspaceStatus;
  visibility?: WorkspaceVisibility;
  search?: string;
}

export interface MemberFilters {
  role?: WorkspaceRole;
  search?: string;
}
