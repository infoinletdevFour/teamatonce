/**
 * Workspace Store - Zustand state management for Workspace data
 * Similar to companyStore but for workspace management
 * Provides global state management with localStorage persistence
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
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
import workspaceService from '../services/workspaceService';

// ============================================================================
// State Interface
// ============================================================================

interface WorkspaceState {
  // Current workspace data
  currentWorkspace: Workspace | null;
  workspaces: Workspace[];
  workspaceStats: WorkspaceStats | null;

  // Members data
  members: WorkspaceMember[];
  currentMembership: WorkspaceMember | null;

  // Invitations data
  invitations: WorkspaceInvitation[];

  // Loading states
  isLoading: boolean;
  isLoadingStats: boolean;
  isLoadingMembers: boolean;
  isLoadingInvitations: boolean;

  // Error states
  error: string | null;

  // Actions - Workspace CRUD
  fetchUserWorkspaces: (filters?: WorkspaceFilters) => Promise<void>;
  fetchWorkspace: (workspaceId: string) => Promise<void>;
  createWorkspace: (data: CreateWorkspaceData) => Promise<Workspace>;
  updateWorkspace: (workspaceId: string, data: UpdateWorkspaceData) => Promise<void>;
  deleteWorkspace: (workspaceId: string) => Promise<void>;
  setCurrentWorkspace: (workspace: Workspace | null) => void;
  switchWorkspace: (workspaceId: string) => Promise<void>;

  // Actions - Stats
  fetchWorkspaceStats: (workspaceId: string) => Promise<void>;

  // Actions - Members
  fetchWorkspaceMembers: (workspaceId: string, filters?: MemberFilters) => Promise<void>;
  fetchCurrentUserMembership: (workspaceId: string) => Promise<void>;
  updateMemberRole: (workspaceId: string, memberId: string, data: UpdateMemberRoleData) => Promise<void>;
  removeMember: (workspaceId: string, memberId: string) => Promise<void>;

  // Actions - Invitations
  fetchWorkspaceInvitations: (workspaceId: string) => Promise<void>;
  inviteMember: (workspaceId: string, data: InviteMemberData) => Promise<WorkspaceInvitation>;
  cancelInvitation: (workspaceId: string, invitationId: string) => Promise<void>;

  // Utility actions
  clearError: () => void;
  reset: () => void;
}

// ============================================================================
// Initial State
// ============================================================================

const initialState = {
  currentWorkspace: null,
  workspaces: [],
  workspaceStats: null,
  members: [],
  currentMembership: null,
  invitations: [],
  isLoading: false,
  isLoadingStats: false,
  isLoadingMembers: false,
  isLoadingInvitations: false,
  error: null,
};

// ============================================================================
// Store Implementation
// ============================================================================

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      ...initialState,

      // ======================================================================
      // Workspace CRUD Operations
      // ======================================================================

      fetchUserWorkspaces: async (filters?: WorkspaceFilters) => {
        set({ isLoading: true, error: null });
        try {
          const workspaces = await workspaceService.getUserWorkspaces(filters);
          set({ workspaces, isLoading: false });
        } catch (error: any) {
          set({
            error: error.message || 'Failed to fetch workspaces',
            isLoading: false
          });
          throw error;
        }
      },

      fetchWorkspace: async (workspaceId: string) => {
        set({ isLoading: true, error: null });
        try {
          const workspace = await workspaceService.getWorkspaceById(workspaceId);
          set({ currentWorkspace: workspace, isLoading: false });
        } catch (error: any) {
          set({
            error: error.message || 'Failed to fetch workspace',
            isLoading: false
          });
          throw error;
        }
      },

      createWorkspace: async (data: CreateWorkspaceData) => {
        set({ isLoading: true, error: null });
        try {
          const workspace = await workspaceService.createWorkspace(data);
          set((state) => ({
            workspaces: [...state.workspaces, workspace],
            currentWorkspace: workspace,
            isLoading: false,
          }));
          return workspace;
        } catch (error: any) {
          set({
            error: error.message || 'Failed to create workspace',
            isLoading: false
          });
          throw error;
        }
      },

      updateWorkspace: async (workspaceId: string, data: UpdateWorkspaceData) => {
        set({ isLoading: true, error: null });
        try {
          const updatedWorkspace = await workspaceService.updateWorkspace(workspaceId, data);
          set((state) => ({
            workspaces: state.workspaces.map((w) =>
              w.id === workspaceId ? updatedWorkspace : w
            ),
            currentWorkspace: state.currentWorkspace?.id === workspaceId
              ? updatedWorkspace
              : state.currentWorkspace,
            isLoading: false,
          }));
        } catch (error: any) {
          set({
            error: error.message || 'Failed to update workspace',
            isLoading: false
          });
          throw error;
        }
      },

      deleteWorkspace: async (workspaceId: string) => {
        set({ isLoading: true, error: null });
        try {
          await workspaceService.deleteWorkspace(workspaceId);
          set((state) => ({
            workspaces: state.workspaces.filter((w) => w.id !== workspaceId),
            currentWorkspace: state.currentWorkspace?.id === workspaceId
              ? null
              : state.currentWorkspace,
            isLoading: false,
          }));
        } catch (error: any) {
          set({
            error: error.message || 'Failed to delete workspace',
            isLoading: false
          });
          throw error;
        }
      },

      setCurrentWorkspace: (workspace: Workspace | null) => {
        set({ currentWorkspace: workspace });
        workspaceService.setCurrentWorkspace(workspace);
      },

      switchWorkspace: async (workspaceId: string) => {
        set({ isLoading: true, error: null });
        try {
          const workspace = await workspaceService.switchWorkspace(workspaceId);
          set({ currentWorkspace: workspace, isLoading: false });
        } catch (error: any) {
          set({
            error: error.message || 'Failed to switch workspace',
            isLoading: false
          });
          throw error;
        }
      },

      // ======================================================================
      // Stats
      // ======================================================================

      fetchWorkspaceStats: async (workspaceId: string) => {
        set({ isLoadingStats: true, error: null });
        try {
          const stats = await workspaceService.getWorkspaceStats(workspaceId);
          set({ workspaceStats: stats, isLoadingStats: false });
        } catch (error: any) {
          set({
            error: error.message || 'Failed to fetch stats',
            isLoadingStats: false
          });
          throw error;
        }
      },

      // ======================================================================
      // Members Management
      // ======================================================================

      fetchWorkspaceMembers: async (workspaceId: string, filters?: MemberFilters) => {
        set({ isLoadingMembers: true, error: null });
        try {
          const members = await workspaceService.getWorkspaceMembers(workspaceId, filters);
          set({ members, isLoadingMembers: false });
        } catch (error: any) {
          set({
            error: error.message || 'Failed to fetch members',
            isLoadingMembers: false
          });
          throw error;
        }
      },

      fetchCurrentUserMembership: async (workspaceId: string) => {
        set({ isLoadingMembers: true, error: null });
        try {
          const membership = await workspaceService.getCurrentUserMembership(workspaceId);
          set({ currentMembership: membership, isLoadingMembers: false });
        } catch (error: any) {
          set({
            error: error.message || 'Failed to fetch membership',
            isLoadingMembers: false
          });
          throw error;
        }
      },

      updateMemberRole: async (workspaceId: string, memberId: string, data: UpdateMemberRoleData) => {
        set({ isLoadingMembers: true, error: null });
        try {
          const updatedMember = await workspaceService.updateMemberRole(workspaceId, memberId, data);
          set((state) => ({
            members: state.members.map((m) =>
              m.id === memberId ? updatedMember : m
            ),
            isLoadingMembers: false,
          }));
        } catch (error: any) {
          set({
            error: error.message || 'Failed to update member role',
            isLoadingMembers: false
          });
          throw error;
        }
      },

      removeMember: async (workspaceId: string, memberId: string) => {
        set({ isLoadingMembers: true, error: null });
        try {
          await workspaceService.removeMember(workspaceId, memberId);
          set((state) => ({
            members: state.members.filter((m) => m.id !== memberId),
            isLoadingMembers: false,
          }));
        } catch (error: any) {
          set({
            error: error.message || 'Failed to remove member',
            isLoadingMembers: false
          });
          throw error;
        }
      },

      // ======================================================================
      // Invitations Management
      // ======================================================================

      fetchWorkspaceInvitations: async (workspaceId: string) => {
        set({ isLoadingInvitations: true, error: null });
        try {
          const invitations = await workspaceService.getWorkspaceInvitations(workspaceId);
          set({ invitations, isLoadingInvitations: false });
        } catch (error: any) {
          set({
            error: error.message || 'Failed to fetch invitations',
            isLoadingInvitations: false
          });
          throw error;
        }
      },

      inviteMember: async (workspaceId: string, data: InviteMemberData) => {
        set({ isLoadingInvitations: true, error: null });
        try {
          const invitation = await workspaceService.inviteMember(workspaceId, data);
          set((state) => ({
            invitations: [...state.invitations, invitation],
            isLoadingInvitations: false,
          }));
          return invitation;
        } catch (error: any) {
          set({
            error: error.message || 'Failed to invite member',
            isLoadingInvitations: false
          });
          throw error;
        }
      },

      cancelInvitation: async (workspaceId: string, invitationId: string) => {
        set({ isLoadingInvitations: true, error: null });
        try {
          await workspaceService.cancelInvitation(workspaceId, invitationId);
          set((state) => ({
            invitations: state.invitations.filter((i) => i.id !== invitationId),
            isLoadingInvitations: false,
          }));
        } catch (error: any) {
          set({
            error: error.message || 'Failed to cancel invitation',
            isLoadingInvitations: false
          });
          throw error;
        }
      },

      // ======================================================================
      // Utility Actions
      // ======================================================================

      clearError: () => {
        set({ error: null });
      },

      reset: () => {
        set(initialState);
      },
    }),
    {
      name: 'workspace-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentWorkspace: state.currentWorkspace,
        workspaces: state.workspaces,
      }),
    }
  )
);

export default useWorkspaceStore;
