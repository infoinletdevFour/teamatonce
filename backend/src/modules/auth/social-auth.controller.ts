/**
 * database Social Auth Controller
 * Simple endpoints that return database OAuth URLs
 */

import { Controller, Get, Post, Param, Query, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { SocialAuthService } from './social-auth.service';
import { ConfigService } from '@nestjs/config';

// Social provider type (google, github, facebook, apple)
type SocialProvider = 'google' | 'github' | 'facebook' | 'apple';

@ApiTags('Authentication - Social (database)')
@Controller('auth/social')
export class SocialAuthController {
  constructor(
    private socialAuthService: SocialAuthService,
    private configService: ConfigService,
  ) {}

  /**
   * Get database OAuth URL for a provider
   * Frontend redirects user to this URL
   */
  @Get(':provider/url')
  @ApiOperation({
    summary: 'Get database OAuth URL',
    description: 'Returns the database-hosted OAuth URL to redirect the user to',
  })
  @ApiParam({
    name: 'provider',
    enum: ['google', 'github'],
    description: 'OAuth provider (google or github)',
  })
  @ApiQuery({
    name: 'redirect_url',
    required: false,
    description: 'URL to redirect to after OAuth completion',
  })
  async getOAuthUrl(
    @Param('provider') provider: SocialProvider,
    @Query('redirect_url') redirectUrl?: string,
  ) {
    // Use provided redirect URL or construct default
    const callbackUrl =
      redirectUrl || `${this.configService.get('FRONTEND_URL')}/auth/callback`;

    const oauthUrl = await this.socialAuthService.getOAuthUrl(
      provider,
      callbackUrl,
    );

    return {
      success: true,
      oauthUrl,
      provider,
    };
  }

  /**
   * Handle OAuth callback
   * Frontend calls this after being redirected from database with code and state
   */
  @Post(':provider/callback')
  @ApiOperation({
    summary: 'Complete OAuth flow',
    description: 'Exchange OAuth code for user tokens',
  })
  @ApiParam({
    name: 'provider',
    enum: ['google', 'github'],
    description: 'OAuth provider (google or github)',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['code', 'state'],
      properties: {
        code: { type: 'string', description: 'OAuth authorization code' },
        state: { type: 'string', description: 'OAuth state parameter' },
      },
    },
  })
  async handleOAuthCallback(
    @Param('provider') provider: SocialProvider,
    @Body('code') code: string,
    @Body('state') state: string,
  ) {
    const result = await this.socialAuthService.handleOAuthCallback(
      provider,
      code,
      state,
    );

    return {
      success: true,
      ...result,
    };
  }

  /**
   * Get available providers from database
   */
  @Get('providers')
  @ApiOperation({
    summary: 'Get available OAuth providers',
    description: 'Returns list of OAuth providers configured in database',
  })
  async getProviders() {
    const providers = await this.socialAuthService.getProviders();

    return {
      success: true,
      providers,
    };
  }
}
