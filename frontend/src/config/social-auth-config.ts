/**
 * Social Authentication Configuration
 * Provider details, icons, colors, and enabled state
 */

import { Chrome, Github } from 'lucide-react';
import { SocialProvider } from '../types/social-auth';

// ============================================================================
// Provider Configuration
// ============================================================================

export interface ProviderConfig {
  id: SocialProvider;
  name: string;
  displayName: string;
  icon: typeof Chrome | typeof Github;
  color: string;
  hoverColor: string;
  bgColor: string;
  borderColor: string;
  hoverBorderColor: string;
  textColor: string;
  enabled: boolean;
  clientId?: string;
}

export const socialAuthConfig: Record<SocialProvider, ProviderConfig> = {
  google: {
    id: 'google',
    name: 'google',
    displayName: 'Google',
    icon: Chrome,
    color: '#4285F4',
    hoverColor: '#3367D6',
    bgColor: 'bg-white',
    borderColor: 'border-gray-300',
    hoverBorderColor: 'hover:border-blue-500',
    textColor: 'text-gray-700 hover:text-blue-600',
    // OAuth is handled by database SDK on backend - always enabled
    enabled: true,
  },
  github: {
    id: 'github',
    name: 'github',
    displayName: 'GitHub',
    icon: Github,
    color: '#24292E',
    hoverColor: '#1B1F23',
    bgColor: 'bg-white',
    borderColor: 'border-gray-300',
    hoverBorderColor: 'hover:border-purple-500',
    textColor: 'text-gray-700 hover:text-purple-600',
    // OAuth is handled by database SDK on backend - always enabled
    enabled: true,
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get configuration for a specific provider
 */
export function getProviderConfig(provider: SocialProvider): ProviderConfig {
  return socialAuthConfig[provider];
}

/**
 * Get all enabled providers
 */
export function getEnabledProviders(): ProviderConfig[] {
  return Object.values(socialAuthConfig).filter((config) => config.enabled);
}

/**
 * Check if a provider is enabled
 */
export function isProviderEnabled(provider: SocialProvider): boolean {
  return socialAuthConfig[provider]?.enabled || false;
}

/**
 * Get provider display name
 */
export function getProviderDisplayName(provider: SocialProvider): string {
  return socialAuthConfig[provider]?.displayName || provider;
}

/**
 * Get OAuth redirect URI for provider
 */
export function getOAuthRedirectUri(): string {
  const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
  return `${baseUrl}/auth/callback`;
}

// ============================================================================
// OAuth Configuration
// ============================================================================

export const oauthConfig = {
  /**
   * State token expiration time (5 minutes)
   */
  stateTokenExpirationMs: 5 * 60 * 1000,

  /**
   * Session storage key for OAuth state
   */
  stateStorageKey: 'teamatonce_oauth_state',

  /**
   * Redirect URI for OAuth callback
   */
  redirectUri: getOAuthRedirectUri(),

  /**
   * Default scopes for each provider
   */
  scopes: {
    google: ['email', 'profile'],
    github: ['user:email', 'read:user'],
  },
};

// ============================================================================
// Error Messages
// ============================================================================

export const socialAuthErrorMessages: Record<string, string> = {
  access_denied: "You cancelled the sign-in process. Please try again if you'd like to continue.",
  invalid_state: 'Invalid or expired authentication request. Please try signing in again.',
  EMAIL_ALREADY_EXISTS:
    'An account with this email already exists. Please link your account or sign in with email.',
  network_error: 'Connection issue. Please check your internet and try again.',
  invalid_code: 'Authentication code is invalid or expired. Please try again.',
  provider_error: 'There was an issue with the authentication provider. Please try again later.',
  unknown_error: 'An unexpected error occurred. Please try again.',
};

/**
 * Get user-friendly error message
 */
export function getSocialAuthErrorMessage(errorCode: string): string {
  return socialAuthErrorMessages[errorCode] || socialAuthErrorMessages.unknown_error;
}
