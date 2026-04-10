import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import api, { User, TokenManager } from '../lib/api';
import { getUserCompanies } from '../services/companyService';
import { socketClient } from '../lib/websocket-client';

// ============================================================================
// Type Definitions
// ============================================================================

interface AuthContextValue {
  // State
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;

  // Methods
  login: (email: string, password: string) => Promise<User>;
  signup: (email: string, password: string, name: string, role?: 'client' | 'seller') => Promise<User>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  checkUserCompany: () => Promise<boolean>;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

// ============================================================================
// Create Context
// ============================================================================

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ============================================================================
// Auth Provider Component - Auth pattern
// ============================================================================

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Computed state
  const isAuthenticated = !!user;

  // ============================================================================
  // Check Auth on Mount - Standard auth pattern
  // ============================================================================

  const checkAuth = async () => {
    try {
      const token = TokenManager.getToken();
      console.log('[AuthContext] checkAuth called, hasToken:', !!token);

      if (!token) {
        // No token, user is not logged in
        console.log('[AuthContext] No token found, user not authenticated');
        setLoading(false);
        return;
      }

      // Try to get profile with the token
      try {
        console.log('[AuthContext] Calling /auth/me with token');
        const response = await api.getCurrentUser();
        console.log('[AuthContext] /auth/me success, user:', response);
        setUser(response);
      } catch (error: any) {
        // Token might be expired or invalid
        console.error('[AuthContext] Auth check failed:', error);
        console.error('[AuthContext] Error message:', error.message);
        console.error('[AuthContext] Error response:', error.response);

        // If we get a 401, token is invalid/expired
        if (error.message?.includes('Unauthorized') || error.message?.includes('401')) {
          // Clear everything if we can't authenticate
          console.warn('[AuthContext] 401 error, clearing tokens and user');
          TokenManager.clearAll();
          setUser(null);
        } else {
          console.warn('[AuthContext] Non-401 error, keeping token but user null');
          // For other errors, keep the token but set user to null
          // This allows tempToken to work even if user data is incomplete
          setUser(null);
        }
      }
    } catch (error) {
      console.error('[AuthContext] Outer auth check failed:', error);
      TokenManager.clearAll();
      setUser(null);
    } finally {
      console.log('[AuthContext] checkAuth finished, setting loading to false');
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  // Listen for auth token storage event (from OAuth callback)
  useEffect(() => {
    const handleAuthTokenStored = () => {
      checkAuth();
    };

    window.addEventListener('auth-token-stored', handleAuthTokenStored);
    return () => window.removeEventListener('auth-token-stored', handleAuthTokenStored);
  }, []);

  // ============================================================================
  // WebSocket Connection - Auto-connect when authenticated
  // ============================================================================

  useEffect(() => {
    if (user && !loading) {
      // Connect to WebSocket when user is authenticated
      socketClient.connect(user.id);

      // Cleanup on unmount or user change
      return () => {
        socketClient.disconnect();
      };
    }
  }, [user, loading]);

  // ============================================================================
  // Login Function - Standard auth pattern
  // ============================================================================

  const login = useCallback(async (email: string, password: string): Promise<User> => {
    try {
      // Set loading to true while logging in
      setLoading(true);

      // Clear any existing state first
      setUser(null);

      const response = await api.login({ email, password });
      setUser(response.user);

      // Small delay to ensure token is saved
      await new Promise(resolve => setTimeout(resolve, 100));

      // Set loading to false after everything is loaded
      setLoading(false);

      // Show success message
      toast.success('Login successful!', {
        description: `Welcome back, ${response.user.name}!`,
      });

      // Return the user for redirect logic
      return response.user;
    } catch (error: any) {
      console.error('Login error:', error);
      setLoading(false);

      // Show error toast
      const errorMessage = error?.message || 'Login failed. Please check your credentials.';
      toast.error('Login Failed', {
        description: errorMessage,
      });

      // Clear any stored tokens
      TokenManager.clearAll();
      setUser(null);

      throw error; // Re-throw to be handled by the login page
    }
  }, []);

  // ============================================================================
  // Signup Function
  // ============================================================================

  const signup = useCallback(async (
    email: string,
    password: string,
    name: string,
    role: 'client' | 'seller' = 'client'
  ): Promise<User> => {
    try {
      setLoading(true);

      // Validate inputs
      if (!email || !password || !name) {
        throw new Error('All fields are required');
      }

      if (password.length < 8) {
        throw new Error('Password must be at least 8 characters long');
      }

      // Call signup API
      const response = await api.signup({
        email,
        password,
        name,
        role,
      });

      // Update user state
      setUser(response.user);

      // Show success message
      toast.success('Account Created!', {
        description: `Welcome to Team@Once, ${response.user.name}!`,
      });

      setLoading(false);

      // Return the user object for immediate use
      return response.user;
    } catch (error: any) {
      console.error('Signup error:', error);
      setLoading(false);

      // Extract error message
      const errorMessage = error?.message || 'Account creation failed. Please try again.';

      // Show error toast
      toast.error('Signup Failed', {
        description: errorMessage,
      });

      // Clear any stored tokens
      TokenManager.clearAll();
      setUser(null);

      // Re-throw error for component handling
      throw error;
    }
  }, []);

  // ============================================================================
  // Logout Function
  // ============================================================================

  const logout = useCallback(async (): Promise<void> => {
    try {
      await api.logout();
    } catch (error: any) {
      console.error('Logout error:', error);
    }

    // Clear all auth state
    setUser(null);
    setLoading(false);

    // Clear tokens
    TokenManager.clearAll();

    // Show success message
    toast.success('Logged Out', {
      description: 'You have been successfully logged out.',
    });
  }, []);

  // ============================================================================
  // Reset Password Function
  // ============================================================================

  const resetPassword = useCallback(async (email: string): Promise<void> => {
    try {
      setLoading(true);

      // Validate input
      if (!email) {
        throw new Error('Email is required');
      }

      // Call reset password API
      const response = await api.resetPassword({ email });

      // Show success message
      toast.success('Reset Email Sent', {
        description: response.message || 'Check your email for password reset instructions.',
      });
    } catch (error: any) {
      console.error('Reset password error:', error);

      // Extract error message
      const errorMessage = error?.message || 'Failed to send reset email. Please try again.';

      // Show error toast
      toast.error('Reset Failed', {
        description: errorMessage,
      });

      // Re-throw error for component handling
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // ============================================================================
  // Refresh User Function - Standard auth pattern
  // ============================================================================

  const refreshUser = useCallback(async (): Promise<void> => {
    try {
      const response = await api.getCurrentUser();

      if (!response) {
        console.error('No profile data received');
        return;
      }

      setUser(response);
    } catch (error) {
      console.error('Failed to refresh user:', error);
      // If refresh fails, don't crash - just log the error
      // DON'T clear tokens here - database doesn't do that
    }
  }, []);

  // ============================================================================
  // Check User Company Function
  // ============================================================================

  const checkUserCompany = useCallback(async (): Promise<boolean> => {
    try {
      const companies = await getUserCompanies();
      return companies && companies.length > 0;
    } catch (error) {
      console.error('Failed to check user company:', error);
      // If check fails, assume no company to be safe
      return false;
    }
  }, []);

  // ============================================================================
  // Context Value
  // ============================================================================

  const value: AuthContextValue = {
    // State
    user,
    isAuthenticated,
    loading,

    // Methods
    login,
    signup,
    logout,
    resetPassword,
    refreshUser,
    checkUserCompany,
  };

  // ============================================================================
  // Render Provider
  // ============================================================================

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// ============================================================================
// useAuth Hook - Easy access to auth context
// ============================================================================

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};

// ============================================================================
// Export Context for Advanced Use Cases
// ============================================================================

export default AuthContext;
