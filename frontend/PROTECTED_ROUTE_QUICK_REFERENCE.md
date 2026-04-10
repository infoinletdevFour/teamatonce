# ProtectedRoute - Quick Reference Card

## Import

```tsx
import ProtectedRoute from './components/auth/ProtectedRoute';
```

## Basic Syntax

```tsx
<ProtectedRoute [requiredRole="role"] [redirectTo="/path"]>
  <YourComponent />
</ProtectedRoute>
```

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `children` | `ReactNode` | ✅ Yes | - | Component(s) to render when authorized |
| `requiredRole` | `'client' \| 'developer' \| 'designer' \| 'project-manager' \| 'admin'` | ❌ No | `undefined` | Required user role (if any) |
| `redirectTo` | `string` | ❌ No | `'/auth/login'` | Where to redirect if not authenticated |

## Quick Examples

### Any Authenticated User
```tsx
<ProtectedRoute>
  <Dashboard />
</ProtectedRoute>
```

### Client Only
```tsx
<ProtectedRoute requiredRole="client">
  <ClientDashboard />
</ProtectedRoute>
```

### Developer Only
```tsx
<ProtectedRoute requiredRole="developer">
  <DeveloperProjects />
</ProtectedRoute>
```

### Admin Only
```tsx
<ProtectedRoute requiredRole="admin">
  <AdminPanel />
</ProtectedRoute>
```

### Custom Redirect
```tsx
<ProtectedRoute redirectTo="/custom-login">
  <SpecialPage />
</ProtectedRoute>
```

## Component States

| State | Condition | Behavior |
|-------|-----------|----------|
| **Loading** | `isLoading === true` | Shows animated loading screen |
| **Unauthenticated** | `!isAuthenticated` | Redirects to login with return URL |
| **Wrong Role** | Role mismatch | Shows access denied page, redirects to user's dashboard |
| **Authorized** | Authenticated + correct role | Renders children |

## Role-Based Redirects

When access is denied, user is redirected based on their actual role:

| User Role | Redirect To |
|-----------|-------------|
| `client` | `/client/dashboard` |
| `developer` | `/developer/dashboard` |
| `designer` | `/designer/dashboard` |
| `project-manager` | `/project-manager/dashboard` |
| `admin` | `/admin/dashboard` |
| Other | `/` |

## Common Patterns

### Protecting Route Sections
```tsx
<Route
  path="/client/*"
  element={
    <ProtectedRoute requiredRole="client">
      <ClientLayout>
        <Outlet />
      </ClientLayout>
    </ProtectedRoute>
  }
/>
```

### Mixed Access Levels
```tsx
// Public route - NO protection
<Route path="/" element={<LandingPage />} />

// Any authenticated user
<Route
  path="/profile"
  element={
    <ProtectedRoute>
      <Profile />
    </ProtectedRoute>
  }
/>

// Role-specific
<Route
  path="/admin"
  element={
    <ProtectedRoute requiredRole="admin">
      <AdminDashboard />
    </ProtectedRoute>
  }
/>
```

## Using Return URL

In your Login component:
```tsx
const location = useLocation();
const from = location.state?.from || '/dashboard';

// After successful login:
navigate(from, { replace: true });
```

## Dependencies

- ✅ `AuthContext` must wrap app
- ✅ `useAuth()` hook provides auth state
- ✅ `react-router-dom` for navigation
- ✅ `framer-motion` for animations
- ✅ `lucide-react` for icons

## Checklist

Before using ProtectedRoute, ensure:
- [ ] `AuthProvider` wraps your app in `App.tsx`
- [ ] Auth API endpoints are configured
- [ ] User type has `role` property
- [ ] Route paths match dashboard redirects
- [ ] Login page handles return URLs

## File Location

**Component**: `/Users/islamnymul/DEVELOP/INFOINLET-PROD/teamatonce/frontend/src/components/auth/ProtectedRoute.tsx`

**Full Documentation**: `PROTECTED_ROUTE_USAGE.md`

---

**Version**: 1.0.0 | **Last Updated**: 2025-10-18
