# ProtectedRoute Component - Usage Guide

## Overview

The `ProtectedRoute` component is a production-ready route wrapper that provides authentication and role-based access control (RBAC) for the Team@Once application.

**Location**: `/Users/islamnymul/DEVELOP/INFOINLET-PROD/teamatonce/frontend/src/components/auth/ProtectedRoute.tsx`

## Features

✅ **AuthContext Integration**: Uses centralized authentication state from `useAuth()` hook
✅ **Loading States**: Smooth animated loading screen while verifying authentication
✅ **Role-Based Access Control**: Optional role restrictions for specific routes
✅ **Smart Redirects**: Automatically redirects to login with return URL preservation
✅ **Access Denied UI**: Beautiful error page when role requirements aren't met
✅ **TypeScript Support**: Full type safety with comprehensive interfaces
✅ **Framer Motion Animations**: Smooth transitions and loading animations
✅ **Responsive Design**: Mobile-first design matching Team@Once design system

## Props Interface

```typescript
interface ProtectedRouteProps {
  /** Content to render when authenticated and authorized */
  children: React.ReactNode;

  /** Optional role requirement for accessing this route */
  requiredRole?: 'client' | 'developer' | 'designer' | 'project-manager' | 'admin';

  /** Custom redirect path when not authenticated (default: '/auth/login') */
  redirectTo?: string;
}
```

## Basic Usage

### 1. Simple Authentication Check

Protect a route without role restrictions:

```tsx
import { Route } from 'react-router-dom';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Dashboard from './pages/Dashboard';

<Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  }
/>
```

### 2. With Role-Based Access Control

Restrict route to specific user roles:

```tsx
// Client-only route
<Route
  path="/client/dashboard"
  element={
    <ProtectedRoute requiredRole="client">
      <ClientDashboard />
    </ProtectedRoute>
  }
/>

// Developer-only route
<Route
  path="/developer/projects"
  element={
    <ProtectedRoute requiredRole="developer">
      <DeveloperProjects />
    </ProtectedRoute>
  }
/>

// Admin-only route
<Route
  path="/admin/settings"
  element={
    <ProtectedRoute requiredRole="admin">
      <AdminSettings />
    </ProtectedRoute>
  }
/>
```

### 3. Custom Redirect Path

Override the default login redirect:

```tsx
<Route
  path="/special-area"
  element={
    <ProtectedRoute redirectTo="/custom-login">
      <SpecialPage />
    </ProtectedRoute>
  }
/>
```

### 4. Nested Routes with Protection

Protect an entire section with nested routes:

```tsx
<Route
  path="/client/*"
  element={
    <ProtectedRoute requiredRole="client">
      <DashboardLayout role="client">
        <Routes>
          <Route path="dashboard" element={<ClientDashboard />} />
          <Route path="projects" element={<MyProjects />} />
          <Route path="messages" element={<Messages />} />
          <Route path="settings" element={<Settings />} />
        </Routes>
      </DashboardLayout>
    </ProtectedRoute>
  }
/>
```

## Complete Examples

### Example 1: Client Portal Routes

```tsx
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/auth/ProtectedRoute';
import ClientDashboard from './pages/client/Dashboard';
import MyProjects from './pages/client/MyProjects';
import PostProject from './pages/client/PostProject';

function ClientRoutes() {
  return (
    <Routes>
      {/* All client routes protected with client role */}
      <Route
        path="/client/dashboard"
        element={
          <ProtectedRoute requiredRole="client">
            <ClientDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/client/projects"
        element={
          <ProtectedRoute requiredRole="client">
            <MyProjects />
          </ProtectedRoute>
        }
      />
      <Route
        path="/client/post-project"
        element={
          <ProtectedRoute requiredRole="client">
            <PostProject />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
```

### Example 2: Developer Portal Routes

```tsx
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/auth/ProtectedRoute';
import DeveloperDashboard from './pages/developer/Dashboard';
import DeveloperProjects from './pages/developer/Projects';
import DeveloperTeam from './pages/developer/Team';

function DeveloperRoutes() {
  return (
    <Routes>
      {/* All developer routes protected with developer role */}
      <Route
        path="/developer/dashboard"
        element={
          <ProtectedRoute requiredRole="developer">
            <DeveloperDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/developer/projects"
        element={
          <ProtectedRoute requiredRole="developer">
            <DeveloperProjects />
          </ProtectedRoute>
        }
      />
      <Route
        path="/developer/team"
        element={
          <ProtectedRoute requiredRole="developer">
            <DeveloperTeam />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
```

### Example 3: Mixed Role Routes

```tsx
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/auth/ProtectedRoute';
import ProjectDashboard from './pages/project/Dashboard';
import AdminPanel from './pages/admin/Panel';

function AppRoutes() {
  return (
    <Routes>
      {/* Route accessible by any authenticated user */}
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <UserProfile />
          </ProtectedRoute>
        }
      />

      {/* Project routes - any authenticated user */}
      <Route
        path="/project/:projectId/*"
        element={
          <ProtectedRoute>
            <ProjectLayout>
              <Routes>
                <Route path="dashboard" element={<ProjectDashboard />} />
                <Route path="team" element={<ProjectTeam />} />
              </Routes>
            </ProjectLayout>
          </ProtectedRoute>
        }
      />

      {/* Admin-only route */}
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminPanel />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
```

## Component Behavior

### Authentication States

#### 1. Loading State (`isLoading: true`)
- Shows animated loading screen with spinner
- Displays "Verifying Authentication" message
- Gradient background with Shield icon
- Animated progress dots

#### 2. Not Authenticated (`isAuthenticated: false`)
- Redirects to login page (default: `/auth/login`)
- Preserves attempted URL in location state as `from`
- Can be used to redirect back after successful login

#### 3. Wrong Role (`requiredRole` mismatch)
- Shows "Access Denied" page with clear messaging
- Displays both required role and user's actual role
- Redirects to appropriate dashboard based on user's role:
  - Client → `/client/dashboard`
  - Developer → `/developer/dashboard`
  - Designer → `/designer/dashboard`
  - Project Manager → `/project-manager/dashboard`
  - Admin → `/admin/dashboard`

#### 4. Authenticated & Authorized
- Renders children components
- User has full access to protected content

## Using Return URL After Login

The ProtectedRoute preserves the attempted URL. Use it in your Login component:

```tsx
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function Login() {
  const { login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Get the return URL from location state
  const from = location.state?.from || '/dashboard';

  const handleLogin = async (email: string, password: string) => {
    try {
      await login(email, password);

      // Redirect to the originally requested page
      navigate(from, { replace: true });
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      handleLogin(email, password);
    }}>
      {/* Login form fields */}
    </form>
  );
}
```

## Integration with AuthContext

The component uses the `useAuth()` hook which provides:

```typescript
interface AuthContextValue {
  user: User | null;              // Current authenticated user
  isAuthenticated: boolean;       // Quick auth check
  isLoading: boolean;             // Loading state
  login: (email, password) => Promise<void>;
  logout: () => Promise<void>;
  // ... other methods
}

interface User {
  id: string;
  email: string;
  name: string;
  role: 'client' | 'developer' | 'designer' | 'project-manager' | 'admin';
  avatar?: string;
  // ... other properties
}
```

## Styling & Design

The component uses:
- **Tailwind CSS**: Utility-first styling
- **Framer Motion**: Smooth animations and transitions
- **Lucide Icons**: Modern, consistent icons
- **Gradient Backgrounds**: Blue-purple theme matching Team@Once branding
- **Responsive Design**: Mobile-first approach with proper spacing

## Best Practices

### ✅ DO

```tsx
// Wrap entire route sections
<ProtectedRoute requiredRole="client">
  <ClientLayout>
    <Outlet />
  </ClientLayout>
</ProtectedRoute>

// Use for sensitive data routes
<ProtectedRoute requiredRole="admin">
  <UserManagement />
</ProtectedRoute>

// Allow any authenticated user (no role restriction)
<ProtectedRoute>
  <SharedResource />
</ProtectedRoute>
```

### ❌ DON'T

```tsx
// Don't wrap public routes
<ProtectedRoute>
  <LandingPage />  {/* ❌ Should be public */}
</ProtectedRoute>

// Don't nest ProtectedRoutes unnecessarily
<ProtectedRoute>
  <Layout>
    <ProtectedRoute>  {/* ❌ Redundant */}
      <Content />
    </ProtectedRoute>
  </Layout>
</ProtectedRoute>

// Don't use wrong role names
<ProtectedRoute requiredRole="superadmin">  {/* ❌ Invalid role */}
  <Page />
</ProtectedRoute>
```

## Troubleshooting

### Issue: Component not redirecting
**Solution**: Ensure `AuthProvider` wraps your app in `App.tsx`:
```tsx
<AuthProvider>
  <Router>
    <Routes>
      {/* Your routes */}
    </Routes>
  </Router>
</AuthProvider>
```

### Issue: Loading screen shows indefinitely
**Solution**: Check AuthContext initialization. Verify token validation completes.

### Issue: Access denied but user has correct role
**Solution**: Ensure role values match exactly (case-sensitive). Check User type definition.

## Testing

### Unit Test Example

```tsx
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import ProtectedRoute from './ProtectedRoute';

describe('ProtectedRoute', () => {
  it('shows loading screen initially', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <ProtectedRoute>
            <div>Protected Content</div>
          </ProtectedRoute>
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByText(/verifying authentication/i)).toBeInTheDocument();
  });

  it('redirects to login when not authenticated', async () => {
    // Mock unauthenticated state
    // Assert redirect behavior
  });

  it('renders children when authenticated', async () => {
    // Mock authenticated state
    // Assert children are rendered
  });
});
```

## Migration Guide

If you're migrating from the old ProtectedRoute:

### Before (localStorage-based)
```tsx
// Old implementation checked localStorage directly
const token = localStorage.getItem('authToken');
```

### After (AuthContext-based)
```tsx
// New implementation uses centralized AuthContext
const { user, isAuthenticated, isLoading } = useAuth();
```

**No changes needed in route definitions** - the component API remains the same!

## Support

For issues or questions:
1. Check AuthContext implementation at `src/contexts/AuthContext.tsx`
2. Verify API client at `src/lib/api.ts`
3. Review route configuration in `src/App.tsx`

---

**Team@Once** - Production-ready authentication and authorization
