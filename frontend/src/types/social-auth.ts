/**
 * Social Authentication Type Definitions
 * TypeScript types for OAuth authentication flow
 */

// ============================================================================
// Provider Types
// ============================================================================

/**
 * Supported social authentication providers
 */
export type SocialProvider = 'google' | 'github';

/**
 * Authentication mode - login or signup
 */
export type AuthMode = 'login' | 'signup';

/**
 * User type for signup flow
 */
export type UserType = 'client' | 'developer';

// ============================================================================
// API Request/Response Types
// ============================================================================

/**
 * Request to initiate OAuth flow
 */
export interface SocialAuthInitiateRequest {
  provider: SocialProvider;
  mode: AuthMode;
  userType?: UserType;
  state: string;
  redirectUri?: string;
}

/**
 * Response from OAuth initiation
 */
export interface SocialAuthInitiateResponse {
  authUrl: string;
  state: string;
}

/**
 * Request to handle OAuth callback
 */
export interface SocialAuthCallbackRequest {
  provider: SocialProvider;
  code: string;
  state: string;
  mode?: AuthMode;
  userType?: UserType;
}

/**
 * Response from OAuth callback
 */
export interface SocialAuthCallbackResponse {
  user: {
    id: string;
    email: string;
    name: string;
    avatar?: string;
    role: 'client' | 'developer' | 'designer' | 'project-manager' | 'admin';
    companyId?: string;
    timezone?: string;
    createdAt: string;
    updatedAt: string;
  };
  accessToken: string;
  refreshToken: string;
  isNewUser: boolean;
}

/**
 * Account linking request when email already exists
 */
export interface LinkAccountRequest {
  email: string;
  password: string;
  provider: SocialProvider;
  socialToken: string;
}

/**
 * Account linking response
 */
export interface LinkAccountResponse {
  success: boolean;
  user: {
    id: string;
    email: string;
    name: string;
    avatar?: string;
    role: 'client' | 'developer' | 'designer' | 'project-manager' | 'admin';
  };
  accessToken: string;
  refreshToken: string;
}

/**
 * Unlink social account request
 */
export interface UnlinkAccountRequest {
  provider: SocialProvider;
}

// ============================================================================
// Component Props Types
// ============================================================================

/**
 * Social authentication button props
 */
export interface SocialAuthButtonProps {
  provider: SocialProvider;
  mode?: AuthMode;
  userType?: UserType;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  disabled?: boolean;
  showIcon?: boolean;
  showText?: boolean;
  className?: string;
  onSuccess?: (user: SocialAuthCallbackResponse['user']) => void;
  onError?: (error: Error) => void;
}

/**
 * Social authentication group props
 */
export interface SocialAuthGroupProps {
  mode: AuthMode;
  userType?: UserType;
  providers?: SocialProvider[];
  orientation?: 'horizontal' | 'vertical';
  dividerText?: string;
  showDivider?: boolean;
  className?: string;
  onSuccess?: (user: SocialAuthCallbackResponse['user']) => void;
  onError?: (error: Error) => void;
}

/**
 * Account linking modal props
 */
export interface AccountLinkingModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  provider: SocialProvider;
  socialToken: string;
  onSuccess?: (user: SocialAuthCallbackResponse['user']) => void;
  onError?: (error: Error) => void;
}

// ============================================================================
// Error Types
// ============================================================================

/**
 * Social auth error codes
 */
export enum SocialAuthErrorCode {
  ACCESS_DENIED = 'access_denied',
  INVALID_STATE = 'invalid_state',
  EMAIL_ALREADY_EXISTS = 'EMAIL_ALREADY_EXISTS',
  NETWORK_ERROR = 'network_error',
  INVALID_CODE = 'invalid_code',
  PROVIDER_ERROR = 'provider_error',
  UNKNOWN_ERROR = 'unknown_error',
}

/**
 * Social auth error
 */
export interface SocialAuthError {
  code: SocialAuthErrorCode;
  message: string;
  provider?: SocialProvider;
  details?: any;
}

// ============================================================================
// State Management Types
// ============================================================================

/**
 * OAuth state stored in session
 */
export interface OAuthState {
  state: string;
  provider: SocialProvider;
  mode: AuthMode;
  userType?: UserType;
  timestamp: number;
  redirectUri?: string;
}

/**
 * Social auth hook return type
 */
export interface UseSocialAuthReturn {
  initiateOAuth: (
    provider: SocialProvider,
    mode: AuthMode,
    userType?: UserType
  ) => Promise<void>;
  handleCallback: (
    provider: SocialProvider,
    code: string,
    state: string
  ) => Promise<SocialAuthCallbackResponse>;
  isLoading: boolean;
  error: SocialAuthError | null;
  clearError: () => void;
}

/**
 * OAuth state hook return type
 */
export interface UseOAuthStateReturn {
  generateState: (
    provider: SocialProvider,
    mode: AuthMode,
    userType?: UserType
  ) => string;
  validateState: (state: string) => OAuthState | null;
  clearState: (state: string) => void;
  clearAllStates: () => void;
}
