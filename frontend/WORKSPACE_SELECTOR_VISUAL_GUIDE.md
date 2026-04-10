# Workspace Selector - Visual Guide

## Component Tree

```
App
└── WorkspaceProvider (Context)
    └── DashboardLayout
        ├── DeskiveHeader
        │   ├── Logo
        │   ├── WorkspaceSelector ⭐
        │   │   └── Dropdown Menu
        │   │       ├── Workspace List
        │   │       ├── Quick Actions
        │   │       └── Create Button
        │   ├── Search
        │   ├── Notifications
        │   └── User Menu
        └── Main Content
            └── Your Pages
```

## Workspace Selector UI

```
┌─────────────────────────────────────────────────────┐
│  ┌──┐  My Workspace  ▼                             │ ← Trigger Button
│  │MW│                                               │
│  └──┘                                               │
└─────────────────────────────────────────────────────┘
          │
          │ (Click to open)
          ▼
┌─────────────────────────────────────────────────────┐
│  YOUR WORKSPACES (3)              + New Workspace   │
├─────────────────────────────────────────────────────┤
│  ┌──┐  Marketing Team                           ✓  │ ← Selected
│  │MT│  Pro Plan                                     │
│  └──┘  5 members • 12 projects                     │
├─────────────────────────────────────────────────────┤
│  ┌──┐  Development Team            👑               │ ← Owner
│  │DT│  Enterprise Plan                              │
│  └──┘  10 members • 25 projects                    │
├─────────────────────────────────────────────────────┤
│  ┌──┐  Design Studio                                │
│  │DS│  Free Plan                                    │
│  └──┘  3 members • 5 projects                      │
├─────────────────────────────────────────────────────┤
│  QUICK ACTIONS                                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ Settings │ │ Members  │ │ Analytics│           │
│  └──────────┘ └──────────┘ └──────────┘           │
├─────────────────────────────────────────────────────┤
│  [+] Create New Workspace                           │
└─────────────────────────────────────────────────────┘
```

## DeskiveHeader Layout

```
┌──────────────────────────────────────────────────────────────────────┐
│  [D]  Deskive  │  [🏢 My Workspace ▼]  ┈┈┈  🔍  ❓  🔔³  [JD ▼]  │
└──────────────────────────────────────────────────────────────────────┘
   ↑      ↑           ↑                        ↑  ↑  ↑     ↑
   │      │           │                        │  │  │     └─ User Menu
   │      │           │                        │  │  └─ Notifications (3 unread)
   │      │           │                        │  └─ Help
   │      │           │                        └─ Search
   │      │           └─ Workspace Selector
   │      └─ Logo Text
   └─ Logo Icon
```

## State Flow Diagram

```
User Action
    │
    ▼
┌────────────────┐
│ Click Workspace│
│   Selector     │
└───────┬────────┘
        │
        ▼
┌────────────────┐        ┌──────────────┐
│  Fetch         │───────▶│  API Call    │
│  Workspaces    │        │ /workspace   │
└───────┬────────┘        └──────┬───────┘
        │                        │
        │                        ▼
        │                 ┌──────────────┐
        │                 │   Response   │
        │                 └──────┬───────┘
        │                        │
        ▼                        ▼
┌────────────────┐        ┌──────────────┐
│  Update Store  │◀───────│ Process Data │
│   (Zustand)    │        └──────────────┘
└───────┬────────┘
        │
        ▼
┌────────────────┐
│ Update Context │
│   (Provider)   │
└───────┬────────┘
        │
        ▼
┌────────────────┐
│  Re-render UI  │
└────────────────┘
```

## Data Flow

```
localStorage ←→ Zustand Store ←→ React Context ←→ Components
     │              │                  │              │
     │              │                  │              └─ WorkspaceSelector
     │              │                  │              └─ DeskiveHeader
     │              │                  │              └─ Dashboard
     │              │                  │              └─ Settings
     │              │                  │
     │              │                  └─ useWorkspace() hook
     │              │
     │              └─ useWorkspaceStore() hook
     │
     └─ Persistent storage
```

## Workspace Structure

```
Workspace
├── id: string
├── name: string
├── slug: string
├── description?: string
├── logo?: string
├── color?: string
├── visibility: 'private' | 'public'
├── status: 'active' | 'inactive' | 'archived'
├── owner_id: string
├── created_at: string
├── updated_at: string
├── member_count?: number
├── project_count?: number
└── user_role?: 'owner' | 'admin' | 'member' | 'guest'
```

## Color Scheme

```
Primary Colors:
┌────────┐ ┌────────┐ ┌────────┐
│ Blue   │ │ Purple │ │ Pink   │
│ #3B82F6│ │ #9333EA│ │ #EC4899│
└────────┘ └────────┘ └────────┘

Status Colors:
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│ Success│ │ Warning│ │ Error  │ │ Info   │
│ #10B981│ │ #F59E0B│ │ #EF4444│ │ #3B82F6│
└────────┘ └────────┘ └────────┘ └────────┘

Gray Scale:
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│ Gray-50│ │ Gray   │ │ Gray   │ │ Gray   │
│ #F9FAFB│ │ #6B7280│ │ #374151│ │ #111827│
└────────┘ └────────┘ └────────┘ └────────┘
```

## Responsive Breakpoints

```
Mobile (< 640px)
┌─────────────┐
│  [☰]  Logo  │
│             │
│   Content   │
└─────────────┘

Tablet (640px - 1024px)
┌──────────────────────┐
│  Logo  │ Workspace ▼ │
│        │             │
│   Content            │
└──────────────────────┘

Desktop (> 1024px)
┌────────────────────────────────────┐
│  Logo │ Workspace ▼ │ Search │ User│
│                                    │
│   Content                          │
└────────────────────────────────────┘
```

## Animation Sequence

```
1. Closed State
   ┌──────────────┐
   │ Workspace ▼  │
   └──────────────┘

2. Opening (0-150ms)
   ┌──────────────┐
   │ Workspace ▲  │
   └──────────────┘
        ▼
   ┌──────────────┐
   │ Loading...   │  ← Fade in (opacity: 0 → 1)
   └──────────────┘  ← Slide down (y: -10 → 0)

3. Open State (150ms+)
   ┌──────────────┐
   │ Workspace ▲  │
   └──────────────┘
        ▼
   ┌──────────────┐
   │ Workspaces   │  ← Fully visible
   │ [List...]    │  ← All content shown
   └──────────────┘

4. Closing (0-150ms)
   ┌──────────────┐
   │ Workspace ▼  │
   └──────────────┘
        ▼
   ┌──────────────┐
   │ Workspaces   │  ← Fade out (opacity: 1 → 0)
   │ [List...]    │  ← Slide up (y: 0 → -10)
   └──────────────┘

5. Closed State
   ┌──────────────┐
   │ Workspace ▼  │
   └──────────────┘
```

## Click Flow

```
User Clicks Workspace Selector
        │
        ▼
    Is Open?
    ┌───┴───┐
    │  Yes  │  No
    │       │   │
    ▼       ▼   ▼
 Close   Fetch    Open
         Data   Dropdown
                   │
                   ▼
            Display List
                   │
    ┌──────────────┼──────────────┐
    ▼              ▼              ▼
Select     Quick Action    Create New
Workspace                  Workspace
    │              │              │
    ▼              ▼              ▼
Update        Navigate      Navigate to
Store         to Page       Create Form
    │
    ▼
Update URL
    │
    ▼
Close Dropdown
```

## File Organization

```
frontend/
├── src/
│   ├── types/
│   │   └── workspace.ts ...................... Type definitions
│   ├── services/
│   │   └── workspaceService.ts ............... API service
│   ├── stores/
│   │   └── workspaceStore.ts ................. Zustand store
│   ├── contexts/
│   │   └── WorkspaceContext.tsx .............. React context
│   ├── components/
│   │   └── workspace/
│   │       ├── WorkspaceSelector.tsx ......... Main dropdown
│   │       ├── DeskiveHeader.tsx ............. Header with selector
│   │       └── index.ts ...................... Exports
│   └── examples/
│       └── WorkspaceExample.tsx .............. Usage examples
└── docs/
    ├── WORKSPACE_SELECTOR_INTEGRATION.md ..... Full guide
    ├── WORKSPACE_SELECTOR_QUICKSTART.md ...... Quick start
    ├── WORKSPACE_SELECTOR_SUMMARY.md ......... Summary
    └── WORKSPACE_SELECTOR_VISUAL_GUIDE.md .... This file
```

## Icon Reference

| Icon | Component | Usage |
|------|-----------|-------|
| 🏢 | Building2 | Workspace/Company |
| 👥 | Users | Members/Team |
| 📁 | FolderKanban | Projects |
| ⚙️ | Settings | Settings/Config |
| ➕ | Plus | Create/Add |
| ✓ | Check | Selected/Confirmed |
| 👑 | Crown | Owner/Admin |
| 🔔 | Bell | Notifications |
| 👤 | User | User Profile |
| 🔍 | Search | Search function |
| ❓ | HelpCircle | Help/Support |
| 📊 | BarChart3 | Analytics |
| ▼ | ChevronDown | Dropdown open |
| ▲ | ChevronUp | Dropdown close |
| → | ArrowRight | Navigate/Next |

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `w` | Open workspace selector |
| `Esc` | Close dropdown |
| `↑/↓` | Navigate workspace list |
| `Enter` | Select highlighted workspace |
| `n` | Create new workspace |
| `s` | Open settings |
| `/` | Focus search |

## Best Practices

### ✅ DO
```tsx
// Use the hook
const { currentWorkspace } = useWorkspace();

// Check for workspace before rendering
if (!currentWorkspace) return <SelectWorkspace />;

// Handle loading states
if (isLoading) return <Spinner />;

// Handle errors gracefully
if (error) return <ErrorMessage error={error} />;
```

### ❌ DON'T
```tsx
// Don't access localStorage directly
const workspace = JSON.parse(localStorage.getItem('workspace'));

// Don't make API calls in components
const response = await fetch('/api/workspace');

// Don't ignore loading states
return <div>{currentWorkspace.name}</div>; // May crash!

// Don't hardcode workspace IDs
navigate(`/workspace/123/dashboard`); // Bad!
```

## Troubleshooting Flowchart

```
Issue: Workspace not loading
        │
        ▼
Is WorkspaceProvider wrapped?
    ┌───┴───┐
    │  No   │  Yes
    │       │   │
    ▼       ▼   ▼
  Add     Check API
Provider  response
            │
    ┌───────┴───────┐
    │  200 OK       │ Error
    │               │   │
    ▼               ▼   ▼
Check data      Check auth
format          token
    │               │
    ▼               ▼
 Verify         Refresh
 types          token
    │               │
    └───────┬───────┘
            │
            ▼
    Still broken?
            │
            ▼
    Check console
    for errors
```

## Performance Monitoring

```
Metrics to Track:
┌─────────────────────┐
│ Initial Load Time   │ ← Target: < 1s
├─────────────────────┤
│ Dropdown Open Time  │ ← Target: < 100ms
├─────────────────────┤
│ Workspace Switch    │ ← Target: < 500ms
├─────────────────────┤
│ API Response Time   │ ← Target: < 200ms
├─────────────────────┤
│ Component Re-renders│ ← Minimize
└─────────────────────┘
```

---

## Visual Summary

```
┌─────────────────────────────────────────────────────────────┐
│                    WORKSPACE SELECTOR                       │
│                                                             │
│  📦 Components         🔧 State           💾 Storage       │
│  ├─ Selector          ├─ Zustand         ├─ localStorage  │
│  ├─ Header            ├─ Context         └─ API Cache     │
│  └─ Dashboard         └─ Hooks                             │
│                                                             │
│  🎨 Styling           🚀 Performance      📡 API           │
│  ├─ Tailwind          ├─ Lazy Loading    ├─ REST          │
│  ├─ Framer Motion     ├─ Memoization     └─ WebSocket     │
│  └─ Dark Mode         └─ Code Splitting                    │
│                                                             │
│  ✅ Features          🧪 Testing          📚 Docs          │
│  ├─ Multi-workspace   ├─ Unit Tests      ├─ Integration   │
│  ├─ Quick Actions     ├─ Integration     ├─ Quick Start   │
│  ├─ Animations        └─ E2E             └─ Examples      │
│  └─ Responsive                                             │
└─────────────────────────────────────────────────────────────┘
```

---

**For more details, see:**
- 📖 [Integration Guide](../WORKSPACE_SELECTOR_INTEGRATION.md)
- 🚀 [Quick Start](./WORKSPACE_SELECTOR_QUICKSTART.md)
- 📊 [Summary](../WORKSPACE_SELECTOR_SUMMARY.md)
