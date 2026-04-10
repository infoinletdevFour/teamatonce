import { IsString, IsEmail, IsOptional, IsBoolean, IsNumber, IsEnum, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * DTO for creating a Stripe Connect account
 */
export class CreateConnectAccountDto {
  @ApiProperty({
    description: 'User ID of the developer',
    example: 'user_123456789',
  })
  @IsString()
  userId: string;

  @ApiProperty({
    description: 'Email address of the developer',
    example: 'developer@example.com',
  })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({
    description: 'Country code (ISO 3166-1 alpha-2)',
    example: 'US',
    default: 'US',
  })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiPropertyOptional({
    description: 'Business type (individual or company)',
    example: 'individual',
    enum: ['individual', 'company'],
    default: 'individual',
  })
  @IsString()
  @IsOptional()
  businessType?: 'individual' | 'company';
}

/**
 * DTO for updating a Stripe Connect account
 */
export class UpdateConnectAccountDto {
  @ApiPropertyOptional({
    description: 'Stripe Connect account ID',
    example: 'acct_1234567890',
  })
  @IsString()
  @IsOptional()
  stripeAccountId?: string;

  @ApiPropertyOptional({
    description: 'Whether the account is fully onboarded',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isOnboarded?: boolean;

  @ApiPropertyOptional({
    description: 'Whether charges are enabled',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  chargesEnabled?: boolean;

  @ApiPropertyOptional({
    description: 'Whether payouts are enabled',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  payoutsEnabled?: boolean;

  @ApiPropertyOptional({
    description: 'Additional metadata as JSON',
    example: { verified: true, tax_id_provided: true },
  })
  @IsOptional()
  metadata?: Record<string, any>;
}

/**
 * DTO for Connect account status response
 */
export class ConnectAccountStatusDto {
  @ApiProperty({
    description: 'Stripe Connect account ID',
    example: 'acct_1234567890',
  })
  @IsString()
  accountId: string;

  @ApiProperty({
    description: 'Whether the account is fully onboarded and can receive payments',
    example: true,
  })
  @IsBoolean()
  isOnboarded: boolean;

  @ApiProperty({
    description: 'Whether charges are enabled on this account',
    example: true,
  })
  @IsBoolean()
  chargesEnabled: boolean;

  @ApiProperty({
    description: 'Whether payouts are enabled on this account',
    example: true,
  })
  @IsBoolean()
  payoutsEnabled: boolean;

  @ApiPropertyOptional({
    description: 'List of currently due requirements for onboarding',
    example: ['individual.id_number', 'individual.verification.document'],
    type: [String],
  })
  @IsOptional()
  currentlyDue?: string[];

  @ApiPropertyOptional({
    description: 'List of eventually due requirements',
    example: ['external_account'],
    type: [String],
  })
  @IsOptional()
  eventuallyDue?: string[];

  @ApiPropertyOptional({
    description: 'List of past due requirements',
    example: [],
    type: [String],
  })
  @IsOptional()
  pastDue?: string[];

  @ApiPropertyOptional({
    description: 'List of pending verification requirements',
    example: ['individual.verification.document'],
    type: [String],
  })
  @IsOptional()
  pendingVerification?: string[];

  @ApiPropertyOptional({
    description: 'Disabled reason if account is disabled',
    example: null,
  })
  @IsString()
  @IsOptional()
  disabledReason?: string | null;

  @ApiPropertyOptional({
    description: 'Account email',
    example: 'developer@example.com',
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    description: 'Account country code',
    example: 'US',
  })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiPropertyOptional({
    description: 'Default currency for the account',
    example: 'usd',
  })
  @IsString()
  @IsOptional()
  defaultCurrency?: string;
}

/**
 * DTO for requesting an onboarding link
 */
export class OnboardingLinkDto {
  @ApiProperty({
    description: 'Stripe Connect account ID',
    example: 'acct_1234567890',
  })
  @IsString()
  accountId: string;

  @ApiProperty({
    description: 'URL to redirect to if the onboarding link expires',
    example: 'https://platform.com/developer/onboarding/refresh',
  })
  @IsString()
  refreshUrl: string;

  @ApiProperty({
    description: 'URL to redirect to after onboarding is complete',
    example: 'https://platform.com/developer/onboarding/complete',
  })
  @IsString()
  returnUrl: string;

  @ApiPropertyOptional({
    description: 'Type of account link',
    example: 'account_onboarding',
    enum: ['account_onboarding', 'account_update'],
    default: 'account_onboarding',
  })
  @IsString()
  @IsOptional()
  type?: 'account_onboarding' | 'account_update';
}

/**
 * DTO for onboarding link response
 */
export class OnboardingLinkResponseDto {
  @ApiProperty({
    description: 'Onboarding URL for the developer to complete setup',
    example: 'https://connect.stripe.com/setup/s/xxxxx',
  })
  @IsString()
  url: string;

  @ApiProperty({
    description: 'When the link expires (Unix timestamp)',
    example: 1640995200,
  })
  @IsNumber()
  expiresAt: number;
}

/**
 * DTO for Connect account creation response
 */
export class ConnectAccountResponseDto {
  @ApiProperty({
    description: 'Stripe Connect account ID',
    example: 'acct_1234567890',
  })
  @IsString()
  accountId: string;

  @ApiProperty({
    description: 'User ID this account belongs to',
    example: 'user_123456789',
  })
  @IsString()
  userId: string;

  @ApiProperty({
    description: 'Account email',
    example: 'developer@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Account country',
    example: 'US',
  })
  @IsString()
  country: string;

  @ApiProperty({
    description: 'Whether charges are enabled',
    example: false,
  })
  @IsBoolean()
  chargesEnabled: boolean;

  @ApiProperty({
    description: 'Whether payouts are enabled',
    example: false,
  })
  @IsBoolean()
  payoutsEnabled: boolean;

  @ApiProperty({
    description: 'Whether account onboarding is complete',
    example: false,
  })
  @IsBoolean()
  isOnboarded: boolean;

  @ApiProperty({
    description: 'When the account was created',
    example: '2024-01-15T10:30:00Z',
  })
  @IsString()
  createdAt: string;
}

/**
 * DTO for webhook account update
 */
export class WebhookAccountUpdateDto {
  @ApiProperty({
    description: 'Stripe Connect account ID from webhook',
    example: 'acct_1234567890',
  })
  @IsString()
  stripeAccountId: string;

  @ApiPropertyOptional({
    description: 'Event type from Stripe webhook',
    example: 'account.updated',
  })
  @IsString()
  @IsOptional()
  eventType?: string;
}
