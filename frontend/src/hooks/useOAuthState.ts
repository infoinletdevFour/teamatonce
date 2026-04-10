/**
 * useOAuthState Hook
 * Manages OAuth state tokens for CSRF protection
 * Uses sessionStorage for secure, one-time-use state tokens
 */

import { useCallback } from 'react';
import {
  SocialProvider,
  AuthMode,
  UserType,
  OAuthState,
  UseOAuthStateReturn,
} from '../types/social-auth';
import { oauthConfig } from '../config/social-auth-config';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate a cryptographically secure random state token
 */
function generateSecureToken(): string {
  // Use Web Crypto API for secure random generation
  if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }

  // Fallback for older browsers
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Get all stored OAuth states from sessionStorage
 */
function getStoredStates(): Record<string, OAuthState> {
  if (typeof window === 'undefined') return {};

  try {
    const stored = sessionStorage.getItem(oauthConfig.stateStorageKey);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('Failed to parse stored OAuth states:', error);
    return {};
  }
}

/**
 * Save OAuth states to sessionStorage
 */
function saveStates(states: Record<string, OAuthState>): void {
  if (typeof window === 'undefined') return;

  try {
    sessionStorage.setItem(oauthConfig.stateStorageKey, JSON.stringify(states));
  } catch (error) {
    console.error('Failed to save OAuth states:', error);
  }
}

/**
 * Clean up expired states
 */
function cleanupExpiredStates(): void {
  const states = getStoredStates();
  const now = Date.now();
  const validStates: Record<string, OAuthState> = {};

  Object.entries(states).forEach(([key, state]) => {
    // Keep state if not expired
    if (now - state.timestamp < oauthConfig.stateTokenExpirationMs) {
      validStates[key] = state;
    }
  });

  saveStates(validStates);
}

// ============================================================================
// useOAuthState Hook
// ============================================================================

/**
 * Hook for managing OAuth state tokens
 * Provides CSRF protection for OAuth flows
 */
export function useOAuthState(): UseOAuthStateReturn {
  /**
   * Generate a new state token and store it
   */
  const generateState = useCallback(
    (provider: SocialProvider, mode: AuthMode, userType?: UserType): string => {
      // Clean up expired states first
      cleanupExpiredStates();

      // Generate new secure token
      const state = generateSecureToken();

      // Create state object
      const oauthState: OAuthState = {
        state,
        provider,
        mode,
        userType,
        timestamp: Date.now(),
        redirectUri: oauthConfig.redirectUri,
      };

      // Store in sessionStorage
      const states = getStoredStates();
      states[state] = oauthState;
      saveStates(states);

      return state;
    },
    []
  );

  /**
   * Validate a state token and return its data
   */
  const validateState = useCallback((state: string): OAuthState | null => {
    // Clean up expired states
    cleanupExpiredStates();

    // Get stored states
    const states = getStoredStates();
    const oauthState = states[state];

    if (!oauthState) {
      console.warn('State token not found:', state);
      return null;
    }

    // Check if expired
    const now = Date.now();
    if (now - oauthState.timestamp > oauthConfig.stateTokenExpirationMs) {
      console.warn('State token expired:', state);
      return null;
    }

    return oauthState;
  }, []);

  /**
   * Clear a specific state token (one-time use)
   */
  const clearState = useCallback((state: string): void => {
    const states = getStoredStates();
    delete states[state];
    saveStates(states);
  }, []);

  /**
   * Clear all stored states
   */
  const clearAllStates = useCallback((): void => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(oauthConfig.stateStorageKey);
    }
  }, []);

  return {
    generateState,
    validateState,
    clearState,
    clearAllStates,
  };
}

export default useOAuthState;
