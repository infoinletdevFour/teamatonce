import { SocialProvider } from '../dto/social-auth.dto';

export interface OAuthTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  scope?: string;
  id_token?: string;
}

export interface OAuthUserProfile {
  id: string;
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  provider: SocialProvider;
  raw?: any;
}

export interface OAuthStrategyConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes?: string[];
  additionalParams?: Record<string, any>;
}

export interface IOAuthStrategy {
  /**
   * Get the provider name
   */
  getProvider(): SocialProvider;

  /**
   * Generate OAuth authorization URL
   * @param state CSRF state token
   * @param additionalParams Optional additional parameters
   */
  getAuthorizationUrl(state: string, additionalParams?: Record<string, any>): string;

  /**
   * Exchange authorization code for access token
   * @param code Authorization code from OAuth callback
   */
  exchangeCodeForToken(code: string): Promise<OAuthTokenResponse>;

  /**
   * Get user profile from OAuth provider
   * @param accessToken OAuth access token
   */
  getUserProfile(accessToken: string): Promise<OAuthUserProfile>;

  /**
   * Refresh OAuth access token
   * @param refreshToken Refresh token
   */
  refreshAccessToken(refreshToken: string): Promise<OAuthTokenResponse>;

  /**
   * Validate OAuth state token
   * @param state State token to validate
   */
  validateState(state: string): boolean;

  /**
   * Generate OAuth state token
   */
  generateState(): string;
}
