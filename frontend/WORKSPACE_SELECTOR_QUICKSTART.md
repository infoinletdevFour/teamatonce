# Workspace Selector - Quick Start Guide

## 5-Minute Setup

### Step 1: Wrap Your App (1 minute)

```tsx
// src/App.tsx or src/main.tsx
import { WorkspaceProvider } from '@/contexts/WorkspaceContext';

function App() {
  return (
    <AuthProvider>
      <WorkspaceProvider>
        <YourRoutes />
      </WorkspaceProvider>
    </AuthProvider>
  );
}
```

### Step 2: Add to Header (2 minutes)

**Option A - Use Complete Header:**
```tsx
import { DeskiveHeader } from '@/components/workspace';

function Layout() {
  return (
    <>
      <DeskiveHeader showWorkspaceSelector={true} />
      <main>{children}</main>
    </>
  );
}
```

**Option B - Add Selector Only:**
```tsx
import { WorkspaceSelector } from '@/components/workspace';

function YourHeader() {
  return (
    <header>
      <Logo />
      <WorkspaceSelector />
      <UserMenu />
    </header>
  );
}
```

### Step 3: Use in Components (2 minutes)

```tsx
import { useWorkspace } from '@/contexts/WorkspaceContext';

function Dashboard() {
  const { currentWorkspace, workspaces, isLoading } = useWorkspace();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Welcome to {currentWorkspace?.name}</h1>
      <p>You have {workspaces.length} workspaces</p>
    </div>
  );
}
```

## Done!

Your workspace selector is now fully functional.

## Common Patterns

### Pattern 1: Protected Workspace Route

```tsx
function WorkspaceDashboard() {
  const { currentWorkspace } = useWorkspace();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentWorkspace) {
      navigate('/workspace/select');
    }
  }, [currentWorkspace]);

  return <div>Dashboard for {currentWorkspace?.name}</div>;
}
```

### Pattern 2: Switch Workspace Programmatically

```tsx
function SwitchButton() {
  const { switchWorkspace } = useWorkspace();

  const handleSwitch = async () => {
    try {
      await switchWorkspace('workspace-id-123');
      toast.success('Workspace switched!');
    } catch (error) {
      toast.error('Failed to switch workspace');
    }
  };

  return <button onClick={handleSwitch}>Switch</button>;
}
```

### Pattern 3: Create Workspace Form

```tsx
import { useWorkspaceStore } from '@/stores/workspaceStore';

function CreateWorkspaceForm() {
  const { createWorkspace } = useWorkspaceStore();
  const [name, setName] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const workspace = await createWorkspace({
        name,
        description: 'My workspace',
        visibility: 'private'
      });
      navigate(`/workspace/${workspace.id}/dashboard`);
    } catch (error) {
      console.error('Failed to create workspace:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Workspace name"
      />
      <button type="submit">Create</button>
    </form>
  );
}
```

### Pattern 4: Workspace Selector with Custom Action

```tsx
import { WorkspaceSelector } from '@/components/workspace';

function CustomWorkspaceSelector() {
  const handleChange = (workspace) => {
    // Custom logic
    console.log('Switched to:', workspace.name);

    // Track analytics
    analytics.track('workspace_switched', {
      workspaceId: workspace.id,
      workspaceName: workspace.name
    });
  };

  return (
    <WorkspaceSelector
      onWorkspaceChange={handleChange}
      showCreateOption={true}
    />
  );
}
```

## Styling Examples

### Custom Colors

```tsx
// Workspace with custom brand color
const workspace = {
  name: 'Marketing Team',
  color: '#FF6B6B',  // Custom red
  logo: '/logo.png',
  // ...
};
```

### Custom Dropdown Width

```tsx
<WorkspaceSelector className="w-96" />  // Wider dropdown
```

### Hide on Mobile

```tsx
<div className="hidden lg:block">
  <WorkspaceSelector />
</div>
```

## API Setup (Backend)

Minimal backend implementation:

```typescript
// Example NestJS controller
@Controller('workspace')
export class WorkspaceController {
  @Get()
  async getUserWorkspaces(@CurrentUser() user) {
    return this.workspaceService.findByUserId(user.id);
  }

  @Get(':workspaceId')
  async getWorkspace(@Param('workspaceId') id: string) {
    return this.workspaceService.findById(id);
  }

  @Post()
  async createWorkspace(@Body() data: CreateWorkspaceDto) {
    return this.workspaceService.create(data);
  }
}
```

## Testing Quick Check

```tsx
import { render, screen } from '@testing-library/react';
import { WorkspaceSelector } from '@/components/workspace';

test('renders workspace selector', () => {
  render(<WorkspaceSelector />);
  expect(screen.getByText(/Select Workspace/i)).toBeInTheDocument();
});
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "useWorkspace must be used within WorkspaceProvider" | Wrap app with `<WorkspaceProvider>` |
| Dropdown not opening | Check z-index and click handlers |
| Workspace not persisting | Check localStorage is enabled |
| API errors | Verify API_URL in config |
| Dark mode issues | Add `dark` class to root element |

## Next Steps

1. ✅ Set up API endpoints
2. ✅ Customize colors/branding
3. ✅ Add workspace creation flow
4. ✅ Implement member management
5. ✅ Add workspace analytics
6. ✅ Set up workspace permissions

## Resources

- 📖 Full documentation: `WORKSPACE_SELECTOR_INTEGRATION.md`
- 🎨 Figma designs: (link to designs)
- 🔧 API reference: `/api/v1/workspace`
- 💬 Support: (your support channel)

---

**Need help?** Check the full integration guide or inspect the TeamAtOnce SimpleMegaMenu implementation.
