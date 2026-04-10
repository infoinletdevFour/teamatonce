import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as crypto from 'crypto';
import {
  IOAuthStrategy,
  OAuthTokenResponse,
  OAuthUserProfile,
  OAuthStrategyConfig
} from './oauth-strategy.interface';
import { SocialProvider } from '../dto/social-auth.dto';

@Injectable()
export class GithubStrategy implements IOAuthStrategy {
  private readonly logger = new Logger(GithubStrategy.name);
  private readonly config: OAuthStrategyConfig;
  private readonly authorizationEndpoint = 'https://github.com/login/oauth/authorize';
  private readonly tokenEndpoint = 'https://github.com/login/oauth/access_token';
  private readonly userInfoEndpoint = 'https://api.github.com/user';
  private readonly userEmailEndpoint = 'https://api.github.com/user/emails';
  private readonly stateSecret: string;
  private readonly stateCache = new Map<string, { createdAt: number }>();

  constructor(private configService: ConfigService) {
    this.config = {
      clientId: this.configService.get<string>('GITHUB_CLIENT_ID') || '',
      clientSecret: this.configService.get<string>('GITHUB_CLIENT_SECRET') || '',
      redirectUri: this.configService.get<string>('GITHUB_REDIRECT_URI') ||
                   `${this.configService.get<string>('BACKEND_URL') || 'http://localhost:3001'}/auth/social/github/callback`,
      scopes: ['read:user', 'user:email'],
    };

    this.stateSecret = this.configService.get<string>('OAUTH_STATE_SECRET') ||
                       this.configService.get<string>('JWT_SECRET') ||
                       'default-state-secret';

    // Clean up expired states every 5 minutes
    setInterval(() => this.cleanupExpiredStates(), 5 * 60 * 1000);

    this.logger.log('GitHub OAuth Strategy initialized');
  }

  getProvider(): SocialProvider {
    return SocialProvider.GITHUB;
  }

  getAuthorizationUrl(state: string, additionalParams?: Record<string, any>): string {
    // Store state for validation
    this.stateCache.set(state, { createdAt: Date.now() });

    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: this.config.scopes?.join(' ') || '',
      state,
      allow_signup: 'true',
      ...additionalParams,
    });

    const url = `${this.authorizationEndpoint}?${params.toString()}`;
    this.logger.debug(`Generated authorization URL for state: ${state}`);

    return url;
  }

  async exchangeCodeForToken(code: string): Promise<OAuthTokenResponse> {
    try {
      this.logger.debug('Exchanging authorization code for token');

      const response = await axios.post(
        this.tokenEndpoint,
        {
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          code,
          redirect_uri: this.config.redirectUri,
        },
        {
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        }
      );

      this.logger.debug('Successfully exchanged code for token');

      return {
        access_token: response.data.access_token,
        token_type: response.data.token_type,
        scope: response.data.scope,
      };
    } catch (error) {
      this.logger.error('Failed to exchange code for token', error.response?.data || error.message);
      throw new BadRequestException(
        'Failed to exchange authorization code: ' +
        (error.response?.data?.error_description || error.message)
      );
    }
  }

  async getUserProfile(accessToken: string): Promise<OAuthUserProfile> {
    try {
      this.logger.debug('Fetching user profile from GitHub');

      // Get user info
      const userResponse = await axios.get(this.userInfoEndpoint, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });

      const userData = userResponse.data;

      // Get user emails (GitHub may not return email in user profile)
      let email = userData.email;
      if (!email) {
        try {
          const emailResponse = await axios.get(this.userEmailEndpoint, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              Accept: 'application/vnd.github.v3+json',
            },
          });

          const emails = emailResponse.data;
          const primaryEmail = emails.find((e: any) => e.primary && e.verified);
          email = primaryEmail?.email || emails[0]?.email;
        } catch (emailError) {
          this.logger.warn('Failed to fetch user emails', emailError.message);
        }
      }

      if (!email) {
        throw new BadRequestException('Unable to retrieve email from GitHub profile');
      }

      this.logger.debug(`Successfully fetched profile for user: ${email}`);

      return {
        id: userData.id.toString(),
        email,
        name: userData.name || userData.login,
        firstName: userData.name?.split(' ')[0],
        lastName: userData.name?.split(' ').slice(1).join(' '),
        avatarUrl: userData.avatar_url,
        provider: SocialProvider.GITHUB,
        raw: userData,
      };
    } catch (error) {
      this.logger.error('Failed to fetch user profile', error.response?.data || error.message);
      throw new BadRequestException(
        'Failed to fetch user profile: ' +
        (error.response?.data?.message || error.message)
      );
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<OAuthTokenResponse> {
    // GitHub does not support refresh tokens for OAuth apps
    // Only GitHub Apps support refresh tokens
    this.logger.warn('GitHub OAuth does not support refresh tokens');
    throw new BadRequestException(
      'GitHub OAuth does not support refresh tokens. Please re-authenticate.'
    );
  }

  validateState(state: string): boolean {
    const stateData = this.stateCache.get(state);

    if (!stateData) {
      this.logger.warn(`Invalid state token: ${state} (not found)`);
      return false;
    }

    // State is valid for 10 minutes
    const isExpired = Date.now() - stateData.createdAt > 10 * 60 * 1000;

    if (isExpired) {
      this.logger.warn(`Invalid state token: ${state} (expired)`);
      this.stateCache.delete(state);
      return false;
    }

    // Remove state after successful validation (one-time use)
    this.stateCache.delete(state);
    this.logger.debug(`State validated successfully: ${state}`);

    return true;
  }

  generateState(): string {
    const randomBytes = crypto.randomBytes(32);
    const timestamp = Date.now().toString();
    const hash = crypto
      .createHmac('sha256', this.stateSecret)
      .update(randomBytes.toString('hex') + timestamp)
      .digest('hex');

    const state = `${hash}.${timestamp}`;
    this.logger.debug(`Generated new state token: ${state}`);

    return state;
  }

  private cleanupExpiredStates(): void {
    const now = Date.now();
    const expiredStates: string[] = [];

    this.stateCache.forEach((data, state) => {
      if (now - data.createdAt > 10 * 60 * 1000) {
        expiredStates.push(state);
      }
    });

    expiredStates.forEach(state => this.stateCache.delete(state));

    if (expiredStates.length > 0) {
      this.logger.debug(`Cleaned up ${expiredStates.length} expired state tokens`);
    }
  }
}
