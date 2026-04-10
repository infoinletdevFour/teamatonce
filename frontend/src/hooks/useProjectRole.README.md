# useProjectRole Hook

A comprehensive React hook for determining user roles and permissions in Team@Once projects.

## Overview

The `useProjectRole` hook provides a simple, type-safe way to check if the current user has specific permissions in a project. It automatically fetches project data, determines the user's role, and returns appropriate permission flags.

## Features

- ✅ **Automatic Role Detection**: Determines if user is client, team lead, or developer
- ✅ **Permission Flags**: Pre-calculated boolean flags for common actions
- ✅ **Loading States**: Built-in loading and error handling
- ✅ **Auto-Refresh**: Includes `refetch()` function to update permissions
- ✅ **Type Safety**: Full TypeScript support with proper types
- ✅ **Project Data**: Returns project data for convenience

## Installation

The hook is already included in the project at `/frontend/src/hooks/useProjectRole.ts`.

## Usage

### Basic Example

```tsx
import { useProjectRole } from '@/hooks/useProjectRole';

function MilestoneActions({ projectId }: { projectId: string }) {
  const {
    canApproveMilestone,
    canSubmitMilestone,
    loading
  } = useProjectRole(projectId);

  if (loading) return <Spinner />;

  return (
    <div>
      {canApproveMilestone && (
        <button>Approve Milestone</button>
      )}
      {canSubmitMilestone && (
        <button>Submit Milestone</button>
      )}
    </div>
  );
}
```

### All Available Properties

```tsx
const {
  // Role Information
  role,              // 'client' | 'developer' | 'team_lead' | 'none'
  isClient,          // boolean
  isDeveloper,       // boolean (includes team lead)
  isTeamLead,        // boolean

  // Milestone Permissions
  canCreateMilestone,        // boolean
  canEditMilestone,          // boolean
  canDeleteMilestone,        // boolean
  canApproveMilestone,       // boolean
  canSubmitMilestone,        // boolean
  canRequestFeedback,        // boolean
  canUpdateMilestoneStatus,  // boolean

  // State
  loading,           // boolean
  error,             // Error | null

  // Data
  project,           // Project | null

  // Functions
  refetch,           // () => Promise<void>
} = useProjectRole(projectId);
```

## Permission Rules

### Client Permissions
- ✅ Create milestones
- ✅ Edit milestones
- ✅ Delete milestones
- ✅ Approve milestones
- ✅ Request feedback
- ❌ Submit milestones
- ❌ Update milestone status

### Team Lead Permissions
- ❌ Create milestones
- ❌ Edit milestones
- ❌ Delete milestones
- ❌ Approve milestones
- ❌ Request feedback
- ✅ Submit milestones
- ✅ Update milestone status

### Developer Permissions (includes Team Leads)
- ❌ Create milestones
- ❌ Edit milestones
- ❌ Delete milestones
- ❌ Approve milestones
- ❌ Request feedback
- ✅ Submit milestones
- ✅ Update milestone status

## Role Determination Logic

The hook determines the user's role by checking:

1. **Client**: `project.client_id === user.id`
2. **Team Lead**: `project.team_lead_id === user.id`
3. **Developer**: User is in `project.assigned_team` array
4. **None**: User has no role in the project

## Advanced Examples

### Protected Route

```tsx
function ApproveMilestonePage({ projectId }: { projectId: string }) {
  const { canApproveMilestone, loading } = useProjectRole(projectId);

  if (loading) return <LoadingSpinner />;

  if (!canApproveMilestone) {
    return <AccessDenied message="Only clients can approve milestones" />;
  }

  return <MilestoneApprovalForm projectId={projectId} />;
}
```

### Role-Based UI

```tsx
function ProjectDashboard({ projectId }: { projectId: string }) {
  const { role, isClient, isTeamLead, project } = useProjectRole(projectId);

  return (
    <div>
      <h1>{project?.name}</h1>
      <p>Your role: {role}</p>

      {isClient && (
        <ClientDashboard project={project} />
      )}

      {isTeamLead && (
        <TeamLeadDashboard project={project} />
      )}

      {role === 'developer' && (
        <DeveloperDashboard project={project} />
      )}

      {role === 'none' && (
        <p>You don't have access to this project</p>
      )}
    </div>
  );
}
```

### Multiple Permission Checks

```tsx
function MilestoneItem({ milestone, projectId }: Props) {
  const {
    canEditMilestone,
    canDeleteMilestone,
    canApproveMilestone,
    canSubmitMilestone,
  } = useProjectRole(projectId);

  return (
    <div className="milestone-card">
      <h3>{milestone.name}</h3>

      <div className="actions">
        {canEditMilestone && (
          <button onClick={handleEdit}>Edit</button>
        )}

        {canDeleteMilestone && (
          <button onClick={handleDelete}>Delete</button>
        )}

        {canApproveMilestone && milestone.status === 'completed' && (
          <button onClick={handleApprove}>Approve</button>
        )}

        {canSubmitMilestone && milestone.status === 'in_progress' && (
          <button onClick={handleSubmit}>Submit</button>
        )}
      </div>
    </div>
  );
}
```

### Refresh Permissions After Update

```tsx
function TeamAssignmentForm({ projectId }: { projectId: string }) {
  const { refetch, loading } = useProjectRole(projectId);

  const handleAssignTeam = async (teamMembers: string[]) => {
    // Assign team members via API
    await assignTeamToProject(projectId, { teamMemberIds: teamMembers });

    // Refresh permissions since team changed
    await refetch();

    toast.success('Team updated and permissions refreshed!');
  };

  return (
    <form onSubmit={handleAssignTeam}>
      {/* Form fields */}
    </form>
  );
}
```

### Error Handling

```tsx
function MilestoneManager({ projectId }: { projectId: string }) {
  const { canCreateMilestone, loading, error } = useProjectRole(projectId);

  if (loading) {
    return <Spinner message="Loading permissions..." />;
  }

  if (error) {
    return (
      <ErrorMessage>
        Failed to load permissions: {error.message}
        <button onClick={() => window.location.reload()}>
          Retry
        </button>
      </ErrorMessage>
    );
  }

  if (!canCreateMilestone) {
    return <p>You don't have permission to create milestones</p>;
  }

  return <CreateMilestoneForm />;
}
```

## Integration with Existing Components

### MilestoneList Component

```tsx
// Before: Hard-coded role checks
function MilestoneList({ projectId, isClient }: Props) {
  return (
    <div>
      {isClient && <button>Create Milestone</button>}
    </div>
  );
}

// After: Using useProjectRole
function MilestoneList({ projectId }: Props) {
  const { canCreateMilestone, loading } = useProjectRole(projectId);

  if (loading) return <Spinner />;

  return (
    <div>
      {canCreateMilestone && <button>Create Milestone</button>}
    </div>
  );
}
```

### MilestoneFormModal Component

```tsx
function MilestoneFormModal({ projectId, milestoneId }: Props) {
  const { canEditMilestone, canDeleteMilestone } = useProjectRole(projectId);

  return (
    <Modal>
      <h2>{milestoneId ? 'Edit' : 'Create'} Milestone</h2>

      {/* Form fields */}

      <div className="actions">
        <button type="submit" disabled={!canEditMilestone}>
          Save
        </button>

        {milestoneId && canDeleteMilestone && (
          <button onClick={handleDelete}>Delete</button>
        )}
      </div>
    </Modal>
  );
}
```

## Performance Considerations

### Caching

The hook fetches project data on every mount. If you need to use it in multiple components:

```tsx
// Option 1: Lift the hook to a parent component
function ProjectPage({ projectId }: Props) {
  const permissions = useProjectRole(projectId);

  return (
    <div>
      <MilestoneList permissions={permissions} />
      <TaskList permissions={permissions} />
    </div>
  );
}

// Option 2: Use React Query for caching (future enhancement)
// The hook could be refactored to use React Query for automatic caching
```

### Conditional Fetching

```tsx
// Only fetch if projectId is available
const permissions = useProjectRole(projectId); // undefined projectId = no fetch

// Conditional rendering based on loading state
if (permissions.loading) return <Spinner />;
```

## Dependencies

- `react`: useState, useEffect, useCallback hooks
- `@/contexts/AuthContext`: For user authentication data
- `@/services/projectService`: For fetching project data
- `@/types/project`: TypeScript types for Project model

## API Endpoints Used

- `GET /api/v1/teamatonce/projects/:projectId` - Fetches project details including:
  - `client_id` - Project owner
  - `team_lead_id` - Team lead user ID
  - `assigned_team` - Array of assigned developer IDs

## Type Definitions

```typescript
type ProjectRole = 'client' | 'developer' | 'team_lead' | 'none';

interface UseProjectRoleResult {
  role: ProjectRole;
  isClient: boolean;
  isDeveloper: boolean;
  isTeamLead: boolean;
  canCreateMilestone: boolean;
  canEditMilestone: boolean;
  canDeleteMilestone: boolean;
  canApproveMilestone: boolean;
  canSubmitMilestone: boolean;
  canRequestFeedback: boolean;
  canUpdateMilestoneStatus: boolean;
  loading: boolean;
  error: Error | null;
  project: Project | null;
  refetch: () => Promise<void>;
}
```

## Testing

### Unit Test Example

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useProjectRole } from './useProjectRole';

describe('useProjectRole', () => {
  it('should identify client correctly', async () => {
    const { result } = renderHook(() => useProjectRole('project-123'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.role).toBe('client');
    expect(result.current.canApproveMilestone).toBe(true);
  });
});
```

## Troubleshooting

### Hook returns 'none' role for all users
- Verify user is authenticated
- Check that project has correct `client_id`, `team_lead_id`, or `assigned_team`
- Verify API endpoint is returning correct data

### Loading state never completes
- Check API endpoint is accessible
- Verify authentication token is valid
- Check browser console for errors

### Permissions not updating after team changes
- Call `refetch()` after updating team assignments
- Verify backend is returning updated team data

## Future Enhancements

Potential improvements for future versions:

1. **React Query Integration**: Add caching and automatic refetching
2. **Task Permissions**: Add task-specific permissions
3. **Custom Permissions**: Support for custom permission rules
4. **Permission Caching**: Cache permissions in context to avoid refetches
5. **Optimistic Updates**: Update permissions optimistically before API call
6. **Admin Override**: Support for admin users who can do everything

## Related Files

- `/frontend/src/hooks/useProjectRole.ts` - Main hook implementation
- `/frontend/src/hooks/useProjectRole.example.tsx` - Usage examples
- `/frontend/src/contexts/AuthContext.tsx` - Authentication context
- `/frontend/src/services/projectService.ts` - Project API service
- `/frontend/src/types/project.ts` - Project type definitions

## License

Part of Team@Once platform - Internal use only

---

For more examples, see `useProjectRole.example.tsx` in the same directory.
