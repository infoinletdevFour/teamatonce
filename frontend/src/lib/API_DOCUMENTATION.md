# Team@Once API Client Documentation

## Overview

The centralized API client (`api.ts`) provides a production-ready, type-safe interface for all backend API interactions in the Team@Once frontend application.

## Features

- **TypeScript Support**: Fully typed interfaces for all API requests and responses
- **Automatic Token Management**: JWT tokens stored and managed automatically
- **Token Refresh**: Automatic token refresh on expiration with request queuing
- **Error Handling**: Comprehensive error handling with detailed error messages
- **Request Interceptors**: Automatic Authorization header attachment
- **Response Interceptors**: Automatic error handling and 401 retry logic
- **Environment Configuration**: Configurable via environment variables
- **SSR Safe**: Works with server-side rendering (window checks)

## Installation

The API client is already set up and ready to use. Simply import it:

```typescript
import api from '@/lib/api';
```

## Configuration

Create a `.env.local` file (or `.env.production` for production) based on `.env.example`:

```bash
# Copy the example file
cp .env.example .env.local

# Edit and add your configuration
VITE_API_URL=http://localhost:3001
```

### Environment Variables

- `VITE_API_URL`: Backend API base URL (default: `http://localhost:3001`)
  - The `/api/v1` prefix is automatically added
  - Example: `http://localhost:3001` becomes `http://localhost:3001/api/v1`

## Quick Start

### 1. Authentication

```typescript
import api from '@/lib/api';

// Login
const response = await api.login({
  email: 'user@example.com',
  password: 'password123',
});
// Token is automatically stored

// Get current user
const user = await api.getCurrentUser();

// Logout
await api.logout();
// Token is automatically cleared
```

### 2. Company Management

```typescript
// Create company
const company = await api.createCompany({
  name: 'My Company',
  description: 'A great company',
  industry: 'Technology',
  size: 'medium',
});

// Get company
const company = await api.getCompany(companyId);

// Update company
const updated = await api.updateCompany(companyId, {
  description: 'Updated description',
});

// Get company stats
const stats = await api.getCompanyStats(companyId);
```

### 3. Team Members

```typescript
// Get team members
const members = await api.getTeamMembers(companyId);

// Add team member
const member = await api.addTeamMember(companyId, {
  email: 'new@example.com',
  role: 'member',
});

// Update team member
const updated = await api.updateTeamMember(memberId, {
  role: 'admin',
});

// Remove team member
await api.removeTeamMember(memberId);
```

### 4. Invitations

```typescript
// Send invitation
const invitation = await api.sendInvitation(companyId, {
  email: 'invite@example.com',
  role: 'member',
  message: 'Welcome to our team!',
});

// Get invitations
const invitations = await api.getInvitations(companyId);

// Accept invitation
const response = await api.acceptInvitation({
  token: 'invitation-token',
  name: 'New User',
  password: 'password123',
});

// Revoke invitation
await api.revokeInvitation(invitationId);
```

## API Methods

### Authentication Endpoints

| Method | Description | Parameters | Returns |
|--------|-------------|------------|---------|
| `login()` | Login user | `LoginCredentials` | `AuthResponse` |
| `signup()` | Register new user | `SignupCredentials` | `AuthResponse` |
| `logout()` | Logout user | - | `void` |
| `resetPassword()` | Request password reset | `ResetPasswordRequest` | `{ message: string }` |
| `getCurrentUser()` | Get current user | - | `User` |
| `refreshToken()` | Refresh access token | - | `RefreshTokenResponse` |

### Company Management Endpoints

| Method | Description | Parameters | Returns |
|--------|-------------|------------|---------|
| `createCompany()` | Create new company | `CreateCompanyData` | `Company` |
| `getCompany()` | Get company by ID | `companyId: string` | `Company` |
| `updateCompany()` | Update company | `companyId, UpdateCompanyData` | `Company` |
| `getCompanyStats()` | Get company statistics | `companyId: string` | `CompanyStats` |
| `deleteCompany()` | Delete company | `companyId: string` | `{ message: string }` |

### Team Member Endpoints

| Method | Description | Parameters | Returns |
|--------|-------------|------------|---------|
| `getTeamMembers()` | Get all team members | `companyId: string` | `TeamMember[]` |
| `addTeamMember()` | Add team member | `companyId, AddTeamMemberData` | `TeamMember` |
| `updateTeamMember()` | Update team member | `memberId, UpdateTeamMemberData` | `TeamMember` |
| `removeTeamMember()` | Remove team member | `memberId: string` | `{ message: string }` |
| `getTeamMember()` | Get team member by ID | `memberId: string` | `TeamMember` |

### Invitation Endpoints

| Method | Description | Parameters | Returns |
|--------|-------------|------------|---------|
| `sendInvitation()` | Send invitation | `companyId, SendInvitationData` | `Invitation` |
| `getInvitations()` | Get all invitations | `companyId: string` | `Invitation[]` |
| `acceptInvitation()` | Accept invitation | `AcceptInvitationData` | `AuthResponse` |
| `revokeInvitation()` | Revoke invitation | `invitationId: string` | `{ message: string }` |
| `resendInvitation()` | Resend invitation | `invitationId: string` | `Invitation` |
| `getInvitationByToken()` | Get invitation by token | `token: string` | `Invitation` |

### Utility Methods

| Method | Description | Returns |
|--------|-------------|---------|
| `isAuthenticated()` | Check if user is authenticated | `boolean` |
| `getAuthToken()` | Get current auth token | `string \| null` |
| `setAuthToken()` | Set auth token manually | `void` |
| `clearAuth()` | Clear authentication | `void` |
| `getClient()` | Get axios instance | `AxiosInstance` |

## Error Handling

The API client automatically formats errors into a consistent structure:

```typescript
interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
  statusCode?: number;
}
```

### Error Handling Example

```typescript
try {
  const user = await api.getCurrentUser();
} catch (error: any) {
  console.error('Error:', error.message);

  // Check specific error codes
  if (error.statusCode === 401) {
    // Unauthorized - redirect to login
    console.log('User not authenticated');
  } else if (error.statusCode === 403) {
    // Forbidden - insufficient permissions
    console.log('Access denied');
  } else if (error.statusCode === 404) {
    // Not found
    console.log('Resource not found');
  } else if (error.statusCode === 0) {
    // Network error
    console.log('Network connection error');
  }

  // Access validation errors (if any)
  if (error.errors) {
    console.log('Validation errors:', error.errors);
  }
}
```

## Automatic Token Refresh

The API client automatically handles token refresh when a 401 error occurs:

1. Detects 401 error
2. Queues the failed request
3. Attempts to refresh the token using the refresh token
4. Retries all queued requests with the new token
5. If refresh fails, clears tokens and redirects to login

This happens transparently - you don't need to handle it manually.

## TypeScript Interfaces

All interfaces are exported from `api.ts`. Common interfaces include:

### Authentication Types
- `LoginCredentials`
- `SignupCredentials`
- `AuthResponse`
- `User`
- `ResetPasswordRequest`
- `RefreshTokenResponse`

### Company Types
- `Company`
- `CreateCompanyData`
- `UpdateCompanyData`
- `CompanyStats`

### Team Member Types
- `TeamMember`
- `AddTeamMemberData`
- `UpdateTeamMemberData`

### Invitation Types
- `Invitation`
- `SendInvitationData`
- `AcceptInvitationData`

### Response Types
- `ApiResponse<T>`
- `ApiError`
- `PaginatedResponse<T>`

## Advanced Usage

### Custom Requests

If you need to make custom API requests not covered by the existing methods:

```typescript
import api from '@/lib/api';

// Get the axios instance
const client = api.getClient();

// Make custom request
const response = await client.get('/custom/endpoint');
```

### Token Management

```typescript
import api, { TokenManager } from '@/lib/api';

// Manual token operations (advanced use cases)
const token = TokenManager.getToken();
TokenManager.setToken('new-token');
TokenManager.clearAll();
```

## React Hook Example

Create a custom hook for authentication:

```typescript
// hooks/useAuth.ts
import { useState, useEffect } from 'react';
import api, { User } from '@/lib/api';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      if (api.isAuthenticated()) {
        try {
          const currentUser = await api.getCurrentUser();
          setUser(currentUser);
        } catch (error) {
          console.error('Failed to load user:', error);
          setUser(null);
        }
      }
      setLoading(false);
    }

    loadUser();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await api.login({ email, password });
    setUser(response.user);
    return response.user;
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
  };

  return {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
  };
}
```

## Testing

The `ApiClient` class is exported for testing purposes:

```typescript
import { ApiClient } from '@/lib/api';

// Create a test instance with custom configuration
const testApi = new ApiClient();
```

## Best Practices

1. **Always use try-catch**: Wrap API calls in try-catch blocks
2. **Handle errors gracefully**: Show user-friendly error messages
3. **Check authentication**: Use `api.isAuthenticated()` before protected operations
4. **Type everything**: Use the provided TypeScript interfaces
5. **Don't store tokens manually**: Let the API client handle token management
6. **Use environment variables**: Configure API URL via environment variables
7. **Monitor network errors**: Handle `statusCode === 0` for offline scenarios

## Troubleshooting

### Issue: "No response from server"
- **Cause**: Network connectivity issue or backend is down
- **Solution**: Check `VITE_API_URL` and ensure backend is running

### Issue: "401 Unauthorized" errors
- **Cause**: Token expired or invalid
- **Solution**: The API client should handle this automatically. If not, check token storage

### Issue: "CORS errors"
- **Cause**: Backend CORS configuration
- **Solution**: Ensure backend allows requests from your frontend origin

### Issue: Token not persisting
- **Cause**: localStorage is blocked or cleared
- **Solution**: Check browser privacy settings and localStorage availability

## Support

For issues or questions:
1. Check this documentation
2. Review `api-usage-example.ts` for code examples
3. Consult the Team@Once development team

---

**Last Updated**: October 2025
**Version**: 1.0.0
**Maintainer**: Team@Once Development Team
