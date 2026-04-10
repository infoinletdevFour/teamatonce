/**
 * Workspace Context - Provides workspace state management across the application
 * Similar to CompanyContext but for workspace management
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Workspace } from '@/types/workspace';
import workspaceService from '@/services/workspaceService';
import { useParams } from 'react-router-dom';

// ============================================================================
// Context Types
// ============================================================================

interface WorkspaceContextType {
  // Current workspace state
  currentWorkspace: Workspace | null;
  workspaces: Workspace[];

  // Loading states
  isLoading: boolean;
  isLoadingWorkspaces: boolean;

  // Error state
  error: string | null;

  // Actions
  setCurrentWorkspace: (workspace: Workspace | null) => void;
  switchWorkspace: (workspaceId: string) => Promise<void>;
  refreshWorkspaces: () => Promise<void>;
  refreshCurrentWorkspace: () => Promise<void>;
  clearError: () => void;

  // Derived values
  workspaceId: string | undefined;
}

// ============================================================================
// Context Creation
// ============================================================================

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

// ============================================================================
// Provider Component
// ============================================================================

interface WorkspaceProviderProps {
  children: React.ReactNode;
}

export const WorkspaceProvider: React.FC<WorkspaceProviderProps> = ({ children }) => {
  // Get workspaceId from URL params
  const params = useParams();
  const workspaceId = params.workspaceId;

  // State
  const [currentWorkspace, setCurrentWorkspaceState] = useState<Workspace | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // =========================================================================
  // Initialize workspace from localStorage or URL
  // =========================================================================

  useEffect(() => {
    const initializeWorkspace = async () => {
      try {
        // First, try to get workspace from localStorage
        const storedWorkspace = workspaceService.getCurrentWorkspace();

        // If we have a workspaceId in the URL, fetch that workspace
        if (workspaceId) {
          setIsLoading(true);
          try {
            const workspace = await workspaceService.getWorkspaceById(workspaceId);
            setCurrentWorkspaceState(workspace);
            workspaceService.setCurrentWorkspace(workspace);
          } catch (err: any) {
            console.error('Failed to fetch workspace from URL:', err);
            setError(err.message);
            // Fallback to stored workspace
            if (storedWorkspace) {
              setCurrentWorkspaceState(storedWorkspace);
            }
          } finally {
            setIsLoading(false);
          }
        } else if (storedWorkspace) {
          // No URL param, but we have stored workspace
          setCurrentWorkspaceState(storedWorkspace);
        }
      } catch (err: any) {
        console.error('Error initializing workspace:', err);
        setError(err.message);
      }
    };

    initializeWorkspace();
  }, [workspaceId]);

  // =========================================================================
  // Fetch all user workspaces on mount
  // =========================================================================

  useEffect(() => {
    refreshWorkspaces();
  }, []);

  // =========================================================================
  // Actions
  // =========================================================================

  const setCurrentWorkspace = useCallback((workspace: Workspace | null) => {
    setCurrentWorkspaceState(workspace);
    workspaceService.setCurrentWorkspace(workspace);
  }, []);

  const switchWorkspace = useCallback(async (newWorkspaceId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const workspace = await workspaceService.switchWorkspace(newWorkspaceId);
      setCurrentWorkspaceState(workspace);
    } catch (err: any) {
      console.error('Failed to switch workspace:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshWorkspaces = useCallback(async () => {
    setIsLoadingWorkspaces(true);
    setError(null);
    try {
      const fetchedWorkspaces = await workspaceService.getUserWorkspaces();
      setWorkspaces(fetchedWorkspaces);

      // If we don't have a current workspace but we have workspaces, set the first one
      if (!currentWorkspace && fetchedWorkspaces.length > 0) {
        const firstWorkspace = fetchedWorkspaces[0];
        setCurrentWorkspace(firstWorkspace);
      }
    } catch (err: any) {
      console.error('Failed to fetch workspaces:', err);
      setError(err.message);
    } finally {
      setIsLoadingWorkspaces(false);
    }
  }, [currentWorkspace, setCurrentWorkspace]);

  const refreshCurrentWorkspace = useCallback(async () => {
    if (!currentWorkspace) return;

    setIsLoading(true);
    setError(null);
    try {
      const workspace = await workspaceService.getWorkspaceById(currentWorkspace.id);
      setCurrentWorkspaceState(workspace);
      workspaceService.setCurrentWorkspace(workspace);
    } catch (err: any) {
      console.error('Failed to refresh current workspace:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [currentWorkspace]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // =========================================================================
  // Context Value
  // =========================================================================

  const value: WorkspaceContextType = {
    currentWorkspace,
    workspaces,
    isLoading,
    isLoadingWorkspaces,
    error,
    setCurrentWorkspace,
    switchWorkspace,
    refreshWorkspaces,
    refreshCurrentWorkspace,
    clearError,
    workspaceId,
  };

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
};

// ============================================================================
// Custom Hook
// ============================================================================

export const useWorkspace = (): WorkspaceContextType => {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};

export default WorkspaceContext;
