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
export class GoogleStrategy implements IOAuthStrategy {
  private readonly logger = new Logger(GoogleStrategy.name);
  private readonly config: OAuthStrategyConfig;
  private readonly authorizationEndpoint = 'https://accounts.google.com/o/oauth2/v2/auth';
  private readonly tokenEndpoint = 'https://oauth2.googleapis.com/token';
  private readonly userInfoEndpoint = 'https://www.googleapis.com/oauth2/v2/userinfo';
  private readonly stateSecret: string;
  private readonly stateCache = new Map<string, { createdAt: number }>();

  constructor(private configService: ConfigService) {
    this.config = {
      clientId: this.configService.get<string>('GOOGLE_CLIENT_ID') || '',
      clientSecret: this.configService.get<string>('GOOGLE_CLIENT_SECRET') || '',
      redirectUri: this.configService.get<string>('GOOGLE_REDIRECT_URI') ||
                   `${this.configService.get<string>('BACKEND_URL') || 'http://localhost:3001'}/auth/social/google/callback`,
      scopes: [
        'openid',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile'
      ],
    };

    this.stateSecret = this.configService.get<string>('OAUTH_STATE_SECRET') ||
                       this.configService.get<string>('JWT_SECRET') ||
                       'default-state-secret';

    // Clean up expired states every 5 minutes
    setInterval(() => this.cleanupExpiredStates(), 5 * 60 * 1000);

    this.logger.log('Google OAuth Strategy initialized');
  }

  getProvider(): SocialProvider {
    return SocialProvider.GOOGLE;
  }

  getAuthorizationUrl(state: string, additionalParams?: Record<string, any>): string {
    // Store state for validation
    this.stateCache.set(state, { createdAt: Date.now() });

    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: this.config.scopes?.join(' ') || '',
      state,
      access_type: 'offline',
      prompt: 'consent',
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
        new URLSearchParams({
          code,
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          redirect_uri: this.config.redirectUri,
          grant_type: 'authorization_code',
        }).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      this.logger.debug('Successfully exchanged code for token');

      return {
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token,
        expires_in: response.data.expires_in,
        token_type: response.data.token_type,
        scope: response.data.scope,
        id_token: response.data.id_token,
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
      this.logger.debug('Fetching user profile from Google');

      const response = await axios.get(this.userInfoEndpoint, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data = response.data;
      this.logger.debug(`Successfully fetched profile for user: ${data.email}`);

      return {
        id: data.id,
        email: data.email,
        name: data.name,
        firstName: data.given_name,
        lastName: data.family_name,
        avatarUrl: data.picture,
        provider: SocialProvider.GOOGLE,
        raw: data,
      };
    } catch (error) {
      this.logger.error('Failed to fetch user profile', error.response?.data || error.message);
      throw new BadRequestException(
        'Failed to fetch user profile: ' +
        (error.response?.data?.error?.message || error.message)
      );
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<OAuthTokenResponse> {
    try {
      this.logger.debug('Refreshing access token');

      const response = await axios.post(
        this.tokenEndpoint,
        new URLSearchParams({
          refresh_token: refreshToken,
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          grant_type: 'refresh_token',
        }).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      this.logger.debug('Successfully refreshed access token');

      return {
        access_token: response.data.access_token,
        expires_in: response.data.expires_in,
        token_type: response.data.token_type,
        scope: response.data.scope,
      };
    } catch (error) {
      this.logger.error('Failed to refresh token', error.response?.data || error.message);
      throw new BadRequestException(
        'Failed to refresh access token: ' +
        (error.response?.data?.error_description || error.message)
      );
    }
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
