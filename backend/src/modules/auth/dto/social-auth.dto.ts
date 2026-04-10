import { IsString, IsEnum, IsOptional, IsObject, IsBoolean, IsEmail } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum SocialProvider {
  GOOGLE = 'google',
  GITHUB = 'github',
  FACEBOOK = 'facebook',
  TWITTER = 'twitter',
  APPLE = 'apple',
}

export class SocialAuthInitDto {
  @ApiProperty({
    enum: SocialProvider,
    example: SocialProvider.GOOGLE,
    description: 'OAuth provider name'
  })
  @IsEnum(SocialProvider)
  provider: SocialProvider;

  @ApiPropertyOptional({
    example: 'http://localhost:3000/auth/callback',
    description: 'Custom redirect URI (optional, uses default if not provided)'
  })
  @IsOptional()
  @IsString()
  redirectUri?: string;

  @ApiPropertyOptional({
    example: { prompt: 'consent' },
    description: 'Additional OAuth parameters'
  })
  @IsOptional()
  @IsObject()
  params?: Record<string, any>;
}

export class SocialAuthCallbackDto {
  @ApiProperty({
    enum: SocialProvider,
    example: SocialProvider.GOOGLE,
    description: 'OAuth provider name'
  })
  @IsEnum(SocialProvider)
  provider: SocialProvider;

  @ApiProperty({
    example: 'authorization_code_from_provider',
    description: 'OAuth authorization code'
  })
  @IsString()
  code: string;

  @ApiProperty({
    example: 'csrf_state_token',
    description: 'CSRF state token for security validation'
  })
  @IsString()
  state: string;

  @ApiPropertyOptional({
    example: 'http://localhost:3000/auth/callback',
    description: 'Redirect URI used in the OAuth flow'
  })
  @IsOptional()
  @IsString()
  redirectUri?: string;
}

export class SocialAuthDto {
  @ApiProperty({
    enum: SocialProvider,
    example: SocialProvider.GOOGLE,
    description: 'OAuth provider name'
  })
  @IsEnum(SocialProvider)
  provider: SocialProvider;

  @ApiProperty({
    example: 'ya29.a0AfH6SMBx...',
    description: 'OAuth access token from provider'
  })
  @IsString()
  accessToken: string;

  @ApiPropertyOptional({
    example: '1//0gKxT2...',
    description: 'OAuth refresh token (if available)'
  })
  @IsOptional()
  @IsString()
  refreshToken?: string;

  @ApiPropertyOptional({
    example: { name: 'John Doe', avatar: 'https://...' },
    description: 'Additional user data from provider'
  })
  @IsOptional()
  @IsObject()
  userData?: Record<string, any>;

  @ApiPropertyOptional({
    example: 'client',
    description: 'User role (client or seller)',
    enum: ['client', 'seller']
  })
  @IsOptional()
  @IsString()
  role?: 'client' | 'seller';
}

export class LinkSocialAccountDto {
  @ApiProperty({
    enum: SocialProvider,
    example: SocialProvider.GOOGLE,
    description: 'OAuth provider to link'
  })
  @IsEnum(SocialProvider)
  provider: SocialProvider;

  @ApiProperty({
    example: 'ya29.a0AfH6SMBx...',
    description: 'OAuth access token from provider'
  })
  @IsString()
  accessToken: string;

  @ApiPropertyOptional({
    example: '1//0gKxT2...',
    description: 'OAuth refresh token (if available)'
  })
  @IsOptional()
  @IsString()
  refreshToken?: string;

  @ApiPropertyOptional({
    example: { primaryAccount: true },
    description: 'Additional metadata for linked account'
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class UnlinkSocialAccountDto {
  @ApiProperty({
    enum: SocialProvider,
    example: SocialProvider.GOOGLE,
    description: 'OAuth provider to unlink'
  })
  @IsEnum(SocialProvider)
  provider: SocialProvider;
}

export class ConfigureSocialProviderDto {
  @ApiProperty({
    enum: SocialProvider,
    example: SocialProvider.GOOGLE,
    description: 'OAuth provider to configure'
  })
  @IsEnum(SocialProvider)
  provider: SocialProvider;

  @ApiProperty({
    example: 'client_id_from_provider',
    description: 'OAuth client ID'
  })
  @IsString()
  clientId: string;

  @ApiProperty({
    example: 'client_secret_from_provider',
    description: 'OAuth client secret'
  })
  @IsString()
  clientSecret: string;

  @ApiProperty({
    example: 'http://localhost:3001/auth/social/google/callback',
    description: 'OAuth redirect URI'
  })
  @IsString()
  redirectUri: string;

  @ApiPropertyOptional({
    example: ['openid', 'profile', 'email'],
    description: 'OAuth scopes to request'
  })
  @IsOptional()
  scopes?: string[];

  @ApiPropertyOptional({
    example: true,
    description: 'Enable/disable this provider'
  })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({
    example: { prompt: 'consent' },
    description: 'Additional provider configuration'
  })
  @IsOptional()
  @IsObject()
  config?: Record<string, any>;
}

export class SocialAuthResponseDto {
  @ApiProperty({
    example: true,
    description: 'Whether authentication was successful'
  })
  success: boolean;

  @ApiPropertyOptional({
    example: {
      id: '123',
      email: 'user@example.com',
      name: 'John Doe',
      avatarUrl: 'https://...',
      provider: 'google'
    },
    description: 'Authenticated user data'
  })
  user?: {
    id: string;
    email: string;
    name: string;
    avatarUrl?: string;
    provider: string;
    role?: string;
    [key: string]: any;
  };

  @ApiPropertyOptional({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT access token for backend authentication'
  })
  access_token?: string;

  @ApiPropertyOptional({
    example: 'User authenticated successfully',
    description: 'Response message'
  })
  message?: string;

  @ApiPropertyOptional({
    example: { requiresProfile: true },
    description: 'Additional metadata or flags'
  })
  metadata?: Record<string, any>;
}

export class LinkedAccountDto {
  @ApiProperty({
    enum: SocialProvider,
    example: SocialProvider.GOOGLE,
    description: 'OAuth provider'
  })
  provider: SocialProvider;

  @ApiProperty({
    example: '123456789',
    description: 'User ID from the provider'
  })
  providerId: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'Email from the provider'
  })
  email: string;

  @ApiPropertyOptional({
    example: 'John Doe',
    description: 'Name from the provider'
  })
  name?: string;

  @ApiPropertyOptional({
    example: 'https://...',
    description: 'Avatar URL from the provider'
  })
  avatarUrl?: string;

  @ApiProperty({
    example: '2024-01-01T00:00:00Z',
    description: 'When the account was linked'
  })
  linkedAt: string;

  @ApiPropertyOptional({
    example: { primaryAccount: true },
    description: 'Additional metadata'
  })
  metadata?: Record<string, any>;
}

export class GetLinkedAccountsResponseDto {
  @ApiProperty({
    type: [LinkedAccountDto],
    description: 'List of linked social accounts'
  })
  accounts: LinkedAccountDto[];

  @ApiProperty({
    example: 2,
    description: 'Total number of linked accounts'
  })
  total: number;
}

export class SocialProviderConfigDto {
  @ApiProperty({
    enum: SocialProvider,
    description: 'OAuth provider name'
  })
  provider: SocialProvider;

  @ApiProperty({
    example: true,
    description: 'Whether this provider is enabled'
  })
  enabled: boolean;

  @ApiProperty({
    example: 'Sign in with Google',
    description: 'Display name for the provider'
  })
  displayName: string;

  @ApiPropertyOptional({
    example: 'https://...',
    description: 'Icon URL for the provider'
  })
  iconUrl?: string;

  @ApiPropertyOptional({
    example: ['openid', 'profile', 'email'],
    description: 'OAuth scopes'
  })
  scopes?: string[];
}

export class GetSocialProvidersResponseDto {
  @ApiProperty({
    type: [SocialProviderConfigDto],
    description: 'List of available OAuth providers'
  })
  providers: SocialProviderConfigDto[];

  @ApiProperty({
    example: 3,
    description: 'Total number of providers'
  })
  total: number;
}
