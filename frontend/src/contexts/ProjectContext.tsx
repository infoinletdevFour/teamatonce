import { createContext, useContext, useEffect, ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { setProjectId as setApiProjectId } from '@/lib/api-client';

interface ProjectContextValue {
  projectId: string | null;
}

const ProjectContext = createContext<ProjectContextValue | undefined>(undefined);

interface ProjectProviderProps {
  children: ReactNode;
}

/**
 * ProjectProvider - Manages project context and sets project ID in API client
 * This ensures all API requests include the x-project-id header when in a project context
 */
export function ProjectProvider({ children }: ProjectProviderProps) {
  const { projectId } = useParams<{ projectId: string }>();

  // Set project ID in API client whenever it changes
  useEffect(() => {
    if (projectId) {
      setApiProjectId(projectId);
    } else {
      // Clear project ID when not in project context
      setApiProjectId(null);
    }

    // Cleanup on unmount
    return () => {
      setApiProjectId(null);
    };
  }, [projectId]);

  const value: ProjectContextValue = {
    projectId: projectId || null,
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
}

/**
 * Hook to access project context
 */
export function useProject() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
}
