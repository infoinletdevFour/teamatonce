# Team@Once - Routing Documentation

## Overview

This document describes the complete routing structure for the Team@Once application. The application uses React Router v6 with nested routes and protected routes for authentication and role-based access control.

## Architecture

### Layout Components

1. **DashboardLayout** (`src/layouts/DashboardLayout.tsx`)
   - Main layout for authenticated users
   - Responsive sidebar navigation
   - Top header with search, notifications, and user menu
   - Role-based navigation (client vs developer)
   - Collapsible sidebar for mobile

2. **ProjectLayout** (`src/layouts/ProjectLayout.tsx`)
   - Layout for project-specific pages
   - Project sidebar with contextual navigation
   - Breadcrumb navigation
   - Team members quick view
   - Project status and progress display

### Authentication

**ProtectedRoute** (`src/components/auth/ProtectedRoute.tsx`)
- Wraps routes that require authentication
- Checks authentication status via localStorage
- Supports role-based access control (client, developer, admin)
- Redirects to login with return URL if not authenticated
- Shows loading state while checking authentication

## Route Structure

### Public Routes

```
/                          Landing Page
/auth/login                Login Page
/auth/signup               Signup Page
/auth/forgot-password      Password Recovery
/help                      Help & Support (placeholder)
```

### Client Routes

All client routes are protected and require `client` role.

```
/client                    → Redirects to /client/dashboard
/client/dashboard          Client Dashboard (main stats and overview)
/client/projects           Projects List (placeholder)
/client/projects/new       Create New Project (placeholder)
/client/messages           Messages (placeholder)
/client/contracts          Contracts (placeholder)
/client/payments           Payments (placeholder)
/client/settings           Settings (placeholder)
/client/profile            Profile (placeholder)
```

### Developer Routes

All developer routes are protected and require `developer` role.

```
/developer                 → Redirects to /developer/dashboard
/developer/dashboard       Developer Dashboard (tasks and performance)
/developer/projects        Projects List (placeholder)
/developer/team            Team Collaboration (placeholder)
/developer/messages        Messages (placeholder)
/developer/calendar        Calendar & Schedule (placeholder)
/developer/performance     Performance Metrics (placeholder)
/developer/settings        Settings (placeholder)
/developer/profile         Profile (placeholder)
```

### Project-Specific Routes

Project routes are protected but accessible to both clients and developers.

```
/project/:projectId                    → Redirects to dashboard
/project/:projectId/dashboard          Project Overview (placeholder)
/project/:projectId/communication-hub  Real-time Communication (placeholder)
/project/:projectId/files              Files & Documents (placeholder)
/project/:projectId/team               Team Members (placeholder)
/project/:projectId/milestone-approval Milestone Approval (placeholder)
/project/:projectId/contract-payment   Contract & Payment (placeholder)
/project/:projectId/payments           Payments (placeholder)
/project/:projectId/project-definition Project Definition (placeholder)
```

### Payment Routes

Protected routes for payment processing.

```
/payment/checkout/:invoiceId   Payment Checkout (placeholder)
/payment/success               Payment Success (placeholder)
/payment/failed                Payment Failed (placeholder)
```

### Contract Routes

Protected routes for contract management.

```
/contract/:contractId/view     View Contract (placeholder)
/contract/:contractId/sign     Sign Contract (placeholder)
```

### Error Routes

```
/404                           404 Not Found Page
/*                             Catch-all → 404 Page
```

## Authentication Flow

### Login Process

1. User visits protected route (e.g., `/client/dashboard`)
2. `ProtectedRoute` checks for `authToken` in localStorage
3. If not authenticated:
   - Saves attempted URL to state
   - Redirects to `/auth/login`
4. After successful login:
   - Sets `authToken` and `userRole` in localStorage
   - Redirects to originally attempted URL or default dashboard

### Role-Based Access

The application supports three user roles:

- **Client**: Access to `/client/*` routes
- **Developer**: Access to `/developer/*` routes
- **Admin**: Access to admin routes (future implementation)

If a user tries to access a route that requires a different role, they are redirected to their appropriate dashboard.

## Mock Authentication

For development purposes, authentication is mocked using localStorage:

```typescript
// Login
localStorage.setItem('authToken', 'mock-token');
localStorage.setItem('userRole', 'client'); // or 'developer'

// Logout
localStorage.removeItem('authToken');
localStorage.removeItem('userRole');
```

In production, replace this with actual JWT token validation and API calls.

## Navigation Structure

### Client Navigation

- Dashboard
- My Projects (with badge showing count)
- Messages (with unread count badge)
- Contracts
- Payments
- Settings

### Developer Navigation

- Dashboard
- My Projects (with assigned projects count)
- Team
- Messages (with unread count badge)
- Calendar
- Performance
- Settings

### Project Navigation

- Overview
- Communication Hub (with unread messages badge)
- Files
- Team
- Milestones
- Contract
- Payments
- Definition

## Implementation Details

### Nested Routes

The application uses nested routes for better organization:

```tsx
<Route path="/client/*" element={
  <ProtectedRoute requiredRole="client">
    <DashboardLayout role="client">
      <Routes>
        <Route path="dashboard" element={<ClientDashboard />} />
        {/* More routes... */}
      </Routes>
    </DashboardLayout>
  </ProtectedRoute>
} />
```

### Placeholder Pages

Most routes currently use the `PlaceholderPage` component for pages under development. This component:

- Shows a gradient background matching the design system
- Displays the page title and description
- Includes a "Go Back" button
- Uses custom icons for each page type

To implement a new page:

1. Create the page component in the appropriate directory
2. Replace the `PlaceholderPage` in `App.tsx` with the new component

### Adding New Routes

To add a new route:

1. **Create the page component**:
   ```tsx
   // src/pages/client/NewPage.tsx
   export const NewPage: React.FC = () => {
     return <div>New Page Content</div>;
   };
   ```

2. **Add the route in App.tsx**:
   ```tsx
   <Route path="new-page" element={<NewPage />} />
   ```

3. **Add navigation link** (if needed):
   - For dashboard navigation: Update `navItems` in `DashboardLayout.tsx`
   - For project navigation: Update `projectNavItems` in `ProjectLayout.tsx`

## Responsive Design

All layouts are fully responsive:

- **Desktop**: Full sidebar visible
- **Tablet**: Collapsible sidebar
- **Mobile**: Hamburger menu with slide-out sidebar

Breakpoints:
- `lg`: 1024px and above (full desktop layout)
- `md`: 768px - 1023px (tablet)
- `sm`: 640px - 767px (mobile)

## Future Enhancements

1. **Admin Routes**: Add `/admin/*` routes for administrative functions
2. **Onboarding**: Add `/onboarding/*` routes for new user setup
3. **API Integration**: Replace mock data with actual API calls
4. **Real Authentication**: Implement JWT-based authentication
5. **Role Permissions**: Add granular permissions within roles
6. **Dynamic Routing**: Load routes based on user permissions from API
7. **Route Guards**: Add additional guards for feature flags
8. **Analytics**: Add route change tracking for analytics

## Testing Routes

To test routes in development:

```bash
# Set mock authentication in browser console
localStorage.setItem('authToken', 'mock-token');
localStorage.setItem('userRole', 'client');

# Navigate to protected routes
# Visit http://localhost:3000/client/dashboard

# Test developer routes
localStorage.setItem('userRole', 'developer');
# Visit http://localhost:3000/developer/dashboard

# Test logout
localStorage.removeItem('authToken');
localStorage.removeItem('userRole');
# Try accessing protected routes - should redirect to login
```

## Troubleshooting

### Route not found
- Check that the route is defined in `App.tsx`
- Verify the path matches exactly (case-sensitive)
- Ensure parent routes use `/*` wildcard for nested routes

### Infinite redirect loop
- Check `ProtectedRoute` logic
- Verify localStorage keys are set correctly
- Ensure redirect paths are valid

### Layout not applied
- Check that route is wrapped in appropriate layout component
- Verify layout component is imported correctly

### Role-based access not working
- Check `requiredRole` prop on `ProtectedRoute`
- Verify `userRole` in localStorage matches required role
- Check redirect logic in `ProtectedRoute.tsx`

## Related Files

- `src/App.tsx` - Main routing configuration
- `src/layouts/DashboardLayout.tsx` - Main dashboard layout
- `src/layouts/ProjectLayout.tsx` - Project-specific layout
- `src/components/auth/ProtectedRoute.tsx` - Authentication wrapper
- `src/pages/NotFound.tsx` - 404 error page
- `src/pages/PlaceholderPage.tsx` - Generic placeholder component
