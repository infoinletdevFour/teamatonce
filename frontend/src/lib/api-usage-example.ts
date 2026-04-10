/**
 * API Client Usage Examples
 * This file demonstrates how to use the centralized API client
 *
 * NOTE: This is an example file for documentation purposes.
 * You can delete this file if not needed.
 */

import api, { LoginCredentials, SignupCredentials, CreateCompanyData } from './api';

// ============================================================================
// Authentication Examples
// ============================================================================

/**
 * Login Example
 */
export async function loginExample() {
  try {
    const credentials: LoginCredentials = {
      email: 'user@example.com',
      password: 'securePassword123',
    };

    const response = await api.login(credentials);
    console.log('Logged in user:', response.user);
    console.log('Access token stored automatically');

    return response.user;
  } catch (error: any) {
    console.error('Login failed:', error.message);
    throw error;
  }
}

/**
 * Signup Example
 */
export async function signupExample() {
  try {
    const credentials: SignupCredentials = {
      email: 'newuser@example.com',
      password: 'securePassword123',
      name: 'John Doe',
      role: 'client',
    };

    const response = await api.signup(credentials);
    console.log('New user created:', response.user);

    return response.user;
  } catch (error: any) {
    console.error('Signup failed:', error.message);
    throw error;
  }
}

/**
 * Get Current User Example
 */
export async function getCurrentUserExample() {
  try {
    const user = await api.getCurrentUser();
    console.log('Current user:', user);

    return user;
  } catch (error: any) {
    console.error('Failed to get current user:', error.message);
    throw error;
  }
}

/**
 * Logout Example
 */
export async function logoutExample() {
  try {
    await api.logout();
    console.log('User logged out successfully');
  } catch (error: any) {
    console.error('Logout failed:', error.message);
  }
}

/**
 * Reset Password Example
 */
export async function resetPasswordExample() {
  try {
    const response = await api.resetPassword({
      email: 'user@example.com',
    });
    console.log(response.message);

    return response;
  } catch (error: any) {
    console.error('Password reset failed:', error.message);
    throw error;
  }
}

// ============================================================================
// Company Management Examples
// ============================================================================

/**
 * Create Company Example
 */
export async function createCompanyExample() {
  try {
    const companyData: CreateCompanyData = {
      name: 'Tech Innovations Inc.',
      description: 'A leading technology company',
      industry: 'Technology',
      size: 'medium',
      website: 'https://techinnovations.com',
      country: 'United States',
      timezone: 'America/New_York',
    };

    const company = await api.createCompany(companyData);
    console.log('Company created:', company);

    return company;
  } catch (error: any) {
    console.error('Company creation failed:', error.message);
    throw error;
  }
}

/**
 * Get Company Example
 */
export async function getCompanyExample(companyId: string) {
  try {
    const company = await api.getCompany(companyId);
    console.log('Company details:', company);

    return company;
  } catch (error: any) {
    console.error('Failed to get company:', error.message);
    throw error;
  }
}

/**
 * Update Company Example
 */
export async function updateCompanyExample(companyId: string) {
  try {
    const updates = {
      description: 'Updated company description',
      website: 'https://newwebsite.com',
    };

    const company = await api.updateCompany(companyId, updates);
    console.log('Company updated:', company);

    return company;
  } catch (error: any) {
    console.error('Company update failed:', error.message);
    throw error;
  }
}

/**
 * Get Company Stats Example
 */
export async function getCompanyStatsExample(companyId: string) {
  try {
    const stats = await api.getCompanyStats(companyId);
    console.log('Company statistics:', stats);
    console.log('Total projects:', stats.totalProjects);
    console.log('Active projects:', stats.activeProjects);
    console.log('Team members:', stats.totalTeamMembers);

    return stats;
  } catch (error: any) {
    console.error('Failed to get company stats:', error.message);
    throw error;
  }
}

// ============================================================================
// Team Member Management Examples
// ============================================================================

/**
 * Get Team Members Example
 */
export async function getTeamMembersExample(companyId: string) {
  try {
    const members = await api.getTeamMembers(companyId);
    console.log('Team members:', members);

    return members;
  } catch (error: any) {
    console.error('Failed to get team members:', error.message);
    throw error;
  }
}

/**
 * Add Team Member Example
 */
export async function addTeamMemberExample(companyId: string) {
  try {
    const memberData = {
      email: 'newmember@example.com',
      role: 'member' as const,
      permissions: ['read', 'write'],
    };

    const member = await api.addTeamMember(companyId, memberData);
    console.log('Team member added:', member);

    return member;
  } catch (error: any) {
    console.error('Failed to add team member:', error.message);
    throw error;
  }
}

/**
 * Update Team Member Example
 */
export async function updateTeamMemberExample(memberId: string) {
  try {
    const updates = {
      role: 'admin' as const,
      permissions: ['read', 'write', 'admin'],
    };

    const member = await api.updateTeamMember(memberId, updates);
    console.log('Team member updated:', member);

    return member;
  } catch (error: any) {
    console.error('Failed to update team member:', error.message);
    throw error;
  }
}

/**
 * Remove Team Member Example
 */
export async function removeTeamMemberExample(memberId: string) {
  try {
    const response = await api.removeTeamMember(memberId);
    console.log(response.message);

    return response;
  } catch (error: any) {
    console.error('Failed to remove team member:', error.message);
    throw error;
  }
}

// ============================================================================
// Invitation Management Examples
// ============================================================================

/**
 * Send Invitation Example
 */
export async function sendInvitationExample(companyId: string) {
  try {
    const invitationData = {
      email: 'invite@example.com',
      role: 'member' as const,
      message: 'Welcome to our team!',
    };

    const invitation = await api.sendInvitation(companyId, invitationData);
    console.log('Invitation sent:', invitation);

    return invitation;
  } catch (error: any) {
    console.error('Failed to send invitation:', error.message);
    throw error;
  }
}

/**
 * Get Invitations Example
 */
export async function getInvitationsExample(companyId: string) {
  try {
    const invitations = await api.getInvitations(companyId);
    console.log('Company invitations:', invitations);

    return invitations;
  } catch (error: any) {
    console.error('Failed to get invitations:', error.message);
    throw error;
  }
}

/**
 * Accept Invitation Example
 */
export async function acceptInvitationExample(token: string) {
  try {
    const response = await api.acceptInvitation({
      token,
      name: 'New Member',
      password: 'securePassword123',
    });

    console.log('Invitation accepted:', response.user);
    console.log('User is now logged in');

    return response.user;
  } catch (error: any) {
    console.error('Failed to accept invitation:', error.message);
    throw error;
  }
}

/**
 * Revoke Invitation Example
 */
export async function revokeInvitationExample(invitationId: string) {
  try {
    const response = await api.revokeInvitation(invitationId);
    console.log(response.message);

    return response;
  } catch (error: any) {
    console.error('Failed to revoke invitation:', error.message);
    throw error;
  }
}

// ============================================================================
// Utility Examples
// ============================================================================

/**
 * Check Authentication Status
 */
export function checkAuthStatus() {
  const isAuthenticated = api.isAuthenticated();
  console.log('User is authenticated:', isAuthenticated);

  if (isAuthenticated) {
    const token = api.getAuthToken();
    console.log('Current token exists:', !!token);
  }

  return isAuthenticated;
}

/**
 * Manual Token Management (Advanced)
 */
export function manualTokenManagement() {
  // Get current token
  const token = api.getAuthToken();
  console.log('Current token:', token);

  // Set custom token (use with caution)
  // api.setAuthToken('your-custom-token');

  // Clear authentication (logout without API call)
  // api.clearAuth();
}

// ============================================================================
// Error Handling Example
// ============================================================================

/**
 * Comprehensive Error Handling Example
 */
export async function errorHandlingExample() {
  try {
    const user = await api.getCurrentUser();
    return user;
  } catch (error: any) {
    // The error is already formatted by the API client
    if (error.statusCode === 401) {
      console.error('Unauthorized - user needs to login');
      // Redirect to login page
    } else if (error.statusCode === 403) {
      console.error('Forbidden - user lacks permissions');
    } else if (error.statusCode === 404) {
      console.error('Resource not found');
    } else if (error.statusCode === 500) {
      console.error('Server error');
    } else if (error.statusCode === 0) {
      console.error('Network error - no connection');
    } else {
      console.error('Unexpected error:', error.message);
    }

    // Access detailed error information
    if (error.errors) {
      console.error('Validation errors:', error.errors);
    }

    throw error;
  }
}

// ============================================================================
// React Hook Example (for use in components)
// ============================================================================

/**
 * Example React hook for authentication
 *
 * You can create similar hooks for other API operations
 */
export function useAuthExample() {
  // This is a conceptual example - implement with React hooks in your components

  const login = async (email: string, password: string) => {
    try {
      const response = await api.login({ email, password });
      return response.user;
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    await api.logout();
  };

  const getCurrentUser = async () => {
    try {
      const user = await api.getCurrentUser();
      return user;
    } catch (error) {
      return null;
    }
  };

  return {
    login,
    logout,
    getCurrentUser,
    isAuthenticated: api.isAuthenticated(),
  };
}

// ============================================================================
// Export all examples
// ============================================================================

export default {
  // Authentication
  loginExample,
  signupExample,
  getCurrentUserExample,
  logoutExample,
  resetPasswordExample,

  // Company Management
  createCompanyExample,
  getCompanyExample,
  updateCompanyExample,
  getCompanyStatsExample,

  // Team Members
  getTeamMembersExample,
  addTeamMemberExample,
  updateTeamMemberExample,
  removeTeamMemberExample,

  // Invitations
  sendInvitationExample,
  getInvitationsExample,
  acceptInvitationExample,
  revokeInvitationExample,

  // Utilities
  checkAuthStatus,
  manualTokenManagement,
  errorHandlingExample,
};
