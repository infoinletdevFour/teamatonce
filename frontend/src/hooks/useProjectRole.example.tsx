/**
 * useProjectRole Hook - Usage Examples
 *
 * This file demonstrates how to use the useProjectRole hook in various scenarios.
 * These examples show best practices for implementing role-based permissions.
 */

import { useProjectRole } from './useProjectRole';

// ============================================================================
// Example 1: Basic Usage - Conditional Rendering Based on Role
// ============================================================================

export function MilestoneActionsExample({ projectId }: { projectId: string }) {
  const {
    role,
    isClient,
    isTeamLead,
    canApproveMilestone,
    canSubmitMilestone,
    loading,
    error,
  } = useProjectRole(projectId);

  if (loading) {
    return <div>Loading permissions...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div className="milestone-actions">
      <h3>Available Actions</h3>
      <p>Your role: {role}</p>

      {/* Client-only actions */}
      {canApproveMilestone && (
        <button className="btn-primary">Approve Milestone</button>
      )}

      {/* Developer actions (includes team leads and regular developers) */}
      {canSubmitMilestone && (
        <button className="btn-success">Submit Milestone</button>
      )}

      {/* Show different UI based on role */}
      {isClient ? (
        <div>
          <h4>Client Dashboard</h4>
          <p>Review and approve milestones</p>
        </div>
      ) : isTeamLead ? (
        <div>
          <h4>Team Lead Dashboard</h4>
          <p>Submit completed milestones for approval</p>
        </div>
      ) : (
        <div>
          <h4>Developer Dashboard</h4>
          <p>Submit completed milestones for approval</p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Example 2: Milestone Management Component
// ============================================================================

export function MilestoneManagementExample({ projectId }: { projectId: string }) {
  const {
    canCreateMilestone,
    canEditMilestone,
    canDeleteMilestone,
    canApproveMilestone,
    loading,
  } = useProjectRole(projectId);

  if (loading) return null;

  return (
    <div className="milestone-management">
      {canCreateMilestone && (
        <button onClick={() => console.log('Create milestone')}>
          + Create Milestone
        </button>
      )}

      <div className="milestone-list">
        {/* Milestone items would be mapped here */}
        <div className="milestone-item">
          <h4>Milestone 1</h4>

          {canEditMilestone && (
            <button onClick={() => console.log('Edit milestone')}>Edit</button>
          )}

          {canDeleteMilestone && (
            <button onClick={() => console.log('Delete milestone')}>Delete</button>
          )}

          {canApproveMilestone && (
            <button onClick={() => console.log('Approve milestone')}>Approve</button>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Example 3: Using with React Router - Protected Routes
// ============================================================================

export function ProtectedMilestoneRouteExample({ projectId }: { projectId: string }) {
  const { canApproveMilestone, loading } = useProjectRole(projectId);

  if (loading) {
    return <div>Checking permissions...</div>;
  }

  if (!canApproveMilestone) {
    return (
      <div>
        <h2>Access Denied</h2>
        <p>You don't have permission to approve milestones for this project.</p>
      </div>
    );
  }

  return (
    <div>
      <h2>Approve Milestone</h2>
      {/* Milestone approval form */}
    </div>
  );
}

// ============================================================================
// Example 4: Multiple Permission Checks
// ============================================================================

export function MilestoneFormExample({ projectId }: { projectId: string }) {
  const {
    canEditMilestone,
    canRequestFeedback,
    isTeamLead,
    project,
    loading,
    error,
  } = useProjectRole(projectId);

  if (loading) {
    return <div className="spinner">Loading...</div>;
  }

  if (error) {
    return <div className="error">Failed to load permissions: {error.message}</div>;
  }

  if (!project) {
    return <div>Project not found</div>;
  }

  const handleSave = () => {
    if (!canEditMilestone) {
      alert('You do not have permission to edit milestones');
      return;
    }
    // Save logic
  };

  const handleRequestFeedback = () => {
    if (!canRequestFeedback) {
      alert('Only clients can request feedback');
      return;
    }
    // Request feedback logic
  };

  return (
    <form>
      <h2>Milestone Form - {project.name}</h2>

      {/* Show different fields based on permissions */}
      {canEditMilestone ? (
        <>
          <input type="text" placeholder="Milestone name" />
          <textarea placeholder="Description" />
          <button type="button" onClick={handleSave}>
            Save Changes
          </button>
        </>
      ) : (
        <div>
          <p>You can only view this milestone.</p>
        </div>
      )}

      {canRequestFeedback && (
        <button type="button" onClick={handleRequestFeedback}>
          Request Feedback
        </button>
      )}

      {isTeamLead && (
        <div className="team-lead-section">
          <h3>Team Lead Options</h3>
          <button>Assign Tasks</button>
          <button>Update Status</button>
        </div>
      )}
    </form>
  );
}

// ============================================================================
// Example 5: Using refetch to Update Permissions
// ============================================================================

export function RefetchPermissionsExample({ projectId }: { projectId: string }) {
  const { role, loading, refetch } = useProjectRole(projectId);

  const handleTeamChange = async () => {
    // After team assignment changes
    console.log('Team updated, refreshing permissions...');
    await refetch();
    console.log('Permissions updated!');
  };

  return (
    <div>
      <p>Current role: {role}</p>
      <button onClick={handleTeamChange} disabled={loading}>
        Update Team & Refresh Permissions
      </button>
    </div>
  );
}

// ============================================================================
// Example 6: Combining Multiple Permission Flags
// ============================================================================

export function ComprehensivePermissionsExample({ projectId }: { projectId: string }) {
  const permissions = useProjectRole(projectId);

  const {
    role,
    isClient,
    isDeveloper,
    isTeamLead,
    canCreateMilestone,
    canEditMilestone,
    canDeleteMilestone,
    canApproveMilestone,
    canSubmitMilestone,
    canRequestFeedback,
    canUpdateMilestoneStatus,
    loading,
    error,
    project,
  } = permissions;

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!project) return <div>Project not found</div>;

  const renderPermissionsList = () => (
    <div className="permissions-list">
      <h3>Your Permissions</h3>
      <ul>
        <li>Create Milestone: {canCreateMilestone ? '✓' : '✗'}</li>
        <li>Edit Milestone: {canEditMilestone ? '✓' : '✗'}</li>
        <li>Delete Milestone: {canDeleteMilestone ? '✓' : '✗'}</li>
        <li>Approve Milestone: {canApproveMilestone ? '✓' : '✗'}</li>
        <li>Submit Milestone: {canSubmitMilestone ? '✓' : '✗'}</li>
        <li>Request Feedback: {canRequestFeedback ? '✓' : '✗'}</li>
        <li>Update Milestone Status: {canUpdateMilestoneStatus ? '✓' : '✗'}</li>
      </ul>
    </div>
  );

  return (
    <div>
      <h2>Project: {project.name}</h2>
      <div className="role-badge">
        {isClient && <span className="badge badge-primary">Client</span>}
        {isTeamLead && <span className="badge badge-success">Team Lead</span>}
        {isDeveloper && !isTeamLead && (
          <span className="badge badge-info">Developer</span>
        )}
        {role === 'none' && <span className="badge badge-secondary">Observer</span>}
      </div>

      {renderPermissionsList()}

      {/* Role-specific content */}
      {isClient && (
        <div className="client-section">
          <h3>Client Controls</h3>
          <button>Create New Milestone</button>
          <button>Request Project Update</button>
        </div>
      )}

      {isDeveloper && (
        <div className="developer-section">
          <h3>{isTeamLead ? 'Team Lead Controls' : 'Developer Controls'}</h3>
          <button>Submit Milestone</button>
          <button>Update Task Status</button>
          {isTeamLead && <button>Assign Tasks</button>}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Example 7: Custom Hook Wrapper for Specific Permissions
// ============================================================================

/**
 * Custom wrapper hook that only returns if user can manage milestones
 */
export function useMilestoneManagement(projectId: string | undefined) {
  const permissions = useProjectRole(projectId);

  return {
    ...permissions,
    canManageMilestones:
      permissions.canCreateMilestone ||
      permissions.canEditMilestone ||
      permissions.canDeleteMilestone,
  };
}

/**
 * Usage example of the wrapper hook
 */
export function MilestoneManagementWrapperExample({ projectId }: { projectId: string }) {
  const { canManageMilestones, loading } = useMilestoneManagement(projectId);

  if (loading) return <div>Loading...</div>;

  if (!canManageMilestones) {
    return <div>You don't have permission to manage milestones</div>;
  }

  return (
    <div>
      <h2>Milestone Management</h2>
      {/* Management UI */}
    </div>
  );
}
