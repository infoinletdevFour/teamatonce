import {
  IsString,
  IsEmail,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsUrl,
  IsObject,
  IsNumber,
  ValidateNested,
  ValidateIf,
  MinLength,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * Account type enum for developer companies
 */
export enum AccountType {
  SOLO = 'solo',
  TEAM = 'team',
  COMPANY = 'company',
}

/**
 * Business type enum for companies
 */
export enum BusinessType {
  INDIVIDUAL = 'individual',
  LLC = 'llc',
  CORPORATION = 'corporation',
  PARTNERSHIP = 'partnership',
}

/**
 * Company size enum
 */
export enum CompanySize {
  SOLO = '1',
  SMALL = '2-10',
  MEDIUM = '11-50',
  LARGE = '51-200',
  ENTERPRISE = '201+',
}

/**
 * Subscription tier enum
 */
export enum SubscriptionTier {
  FREE = 'free',
  BASIC = 'basic',
  PRO = 'pro',
  ENTERPRISE = 'enterprise',
}

/**
 * Subscription status enum
 */
export enum SubscriptionStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  TRIAL = 'trial',
  CANCELLED = 'cancelled',
  PAST_DUE = 'past_due',
}

/**
 * Business address object
 */
export class BusinessAddressDto {
  @ApiPropertyOptional({ description: 'Street address', example: '123 Main St' })
  @IsOptional()
  @IsString()
  street?: string;

  @ApiPropertyOptional({ description: 'City', example: 'San Francisco' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'State or province', example: 'CA' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ description: 'Postal code', example: '94102' })
  @IsOptional()
  @IsString()
  postal_code?: string;

  @ApiPropertyOptional({ description: 'Country', example: 'United States' })
  @IsOptional()
  @IsString()
  country?: string;
}

/**
 * DTO for creating a new developer company
 */
export class CreateCompanyDto {
  @ApiProperty({
    description: 'Account type',
    enum: AccountType,
    example: AccountType.SOLO,
  })
  @IsEnum(AccountType)
  account_type: AccountType;

  @ApiProperty({
    description: 'Display name for the account/company',
    example: 'John Doe Development',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  display_name: string;

  @ApiPropertyOptional({
    description: 'Official company name (required for team/company)',
    example: 'Acme Development LLC',
    minLength: 2,
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  company_name?: string;

  @ApiPropertyOptional({
    description: 'Business type',
    enum: BusinessType,
    example: BusinessType.LLC,
  })
  @IsOptional()
  @IsEnum(BusinessType)
  business_type?: BusinessType;

  @ApiPropertyOptional({
    description: 'Tax ID or EIN',
    example: '12-3456789',
  })
  @IsOptional()
  @IsString()
  tax_id?: string;

  @ApiPropertyOptional({
    description: 'Company size',
    enum: CompanySize,
    example: CompanySize.SMALL,
  })
  @IsOptional()
  @IsEnum(CompanySize)
  company_size?: CompanySize;

  @ApiPropertyOptional({
    description: 'Company website URL',
    example: 'https://acmedev.com',
  })
  @IsOptional()
  @ValidateIf((o) => o.website && o.website.length > 0)
  @IsUrl()
  website?: string;

  @ApiPropertyOptional({
    description: 'Company description',
    example: 'Full-stack development agency specializing in React and Node.js',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({
    description: 'Business email',
    example: 'contact@acmedev.com',
  })
  @IsOptional()
  @IsEmail()
  business_email?: string;

  @ApiPropertyOptional({
    description: 'Business phone number',
    example: '+1-555-123-4567',
  })
  @IsOptional()
  @IsString()
  business_phone?: string;

  @ApiPropertyOptional({
    description: 'Business address',
    type: BusinessAddressDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => BusinessAddressDto)
  business_address?: BusinessAddressDto;

  @ApiPropertyOptional({
    description: 'Timezone',
    example: 'America/New_York',
    default: 'UTC',
  })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({
    description: 'Currency code',
    example: 'USD',
    default: 'USD',
  })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({
    description: 'Language code',
    example: 'en',
    default: 'en',
  })
  @IsOptional()
  @IsString()
  language?: string;
}

/**
 * DTO for updating company details
 */
export class UpdateCompanyDto {
  @ApiPropertyOptional({
    description: 'Account type',
    enum: AccountType,
    example: AccountType.TEAM,
  })
  @IsOptional()
  @IsEnum(AccountType)
  account_type?: AccountType;

  @ApiPropertyOptional({
    description: 'Display name',
    example: 'John Doe Development',
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  display_name?: string;

  @ApiPropertyOptional({
    description: 'Company name',
    example: 'Acme Development LLC',
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  company_name?: string;

  @ApiPropertyOptional({
    description: 'Business type',
    enum: BusinessType,
  })
  @IsOptional()
  @IsEnum(BusinessType)
  business_type?: BusinessType;

  @ApiPropertyOptional({
    description: 'Tax ID or EIN',
  })
  @IsOptional()
  @IsString()
  tax_id?: string;

  @ApiPropertyOptional({
    description: 'Company size',
    enum: CompanySize,
  })
  @IsOptional()
  @IsEnum(CompanySize)
  company_size?: CompanySize;

  @ApiPropertyOptional({
    description: 'Company website URL',
  })
  @IsOptional()
  @ValidateIf((o) => o.website && o.website.length > 0)
  @IsUrl()
  website?: string;

  @ApiPropertyOptional({
    description: 'Company description',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({
    description: 'Logo URL',
  })
  @IsOptional()
  @ValidateIf((o) => o.logo_url && o.logo_url.length > 0)
  @IsUrl()
  logo_url?: string;

  @ApiPropertyOptional({
    description: 'Business email',
  })
  @IsOptional()
  @IsEmail()
  business_email?: string;

  @ApiPropertyOptional({
    description: 'Business phone number',
  })
  @IsOptional()
  @IsString()
  business_phone?: string;

  @ApiPropertyOptional({
    description: 'Business address',
    type: BusinessAddressDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => BusinessAddressDto)
  business_address?: BusinessAddressDto;

  @ApiPropertyOptional({
    description: 'Is company active',
  })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional({
    description: 'Timezone',
    example: 'America/New_York',
  })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({
    description: 'Currency code',
    example: 'USD',
  })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({
    description: 'Language code',
    example: 'en',
  })
  @IsOptional()
  @IsString()
  language?: string;
}

/**
 * DTO for updating company settings
 */
export class UpdateCompanySettingsDto {
  @ApiPropertyOptional({
    description: 'Timezone',
    example: 'America/New_York',
  })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({
    description: 'Currency code',
    example: 'USD',
  })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({
    description: 'Language code',
    example: 'en',
  })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({
    description: 'Company settings object',
    example: {
      notifications: { email: true, push: true },
      work_hours: { start: '09:00', end: '17:00' },
    },
  })
  @IsOptional()
  @IsObject()
  settings?: Record<string, any>;
}

/**
 * Response DTO for company details
 */
export class CompanyResponseDto {
  @ApiProperty({ description: 'Company ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ description: 'Owner user ID', example: 'usr_123abc' })
  owner_id: string;

  @ApiProperty({ description: 'Account type', enum: AccountType })
  account_type: AccountType;

  @ApiProperty({ description: 'Company name', example: 'Acme Development LLC' })
  company_name: string;

  @ApiProperty({ description: 'Display name', example: 'Acme Dev' })
  display_name: string;

  @ApiProperty({ description: 'Business type', enum: BusinessType })
  business_type: BusinessType;

  @ApiPropertyOptional({ description: 'Tax ID', example: '12-3456789' })
  tax_id?: string;

  @ApiProperty({ description: 'Company size', enum: CompanySize })
  company_size: CompanySize;

  @ApiPropertyOptional({ description: 'Website URL', example: 'https://acmedev.com' })
  website?: string;

  @ApiPropertyOptional({ description: 'Company description' })
  description?: string;

  @ApiPropertyOptional({ description: 'Logo URL' })
  logo_url?: string;

  @ApiPropertyOptional({ description: 'Business email' })
  business_email?: string;

  @ApiPropertyOptional({ description: 'Business phone' })
  business_phone?: string;

  @ApiProperty({ description: 'Business address' })
  business_address: BusinessAddressDto;

  @ApiProperty({ description: 'Timezone', example: 'UTC' })
  timezone: string;

  @ApiProperty({ description: 'Currency', example: 'USD' })
  currency: string;

  @ApiProperty({ description: 'Language', example: 'en' })
  language: string;

  @ApiProperty({ description: 'Company settings' })
  settings: Record<string, any>;

  @ApiProperty({ description: 'Subscription tier', enum: SubscriptionTier })
  subscription_tier: SubscriptionTier;

  @ApiProperty({ description: 'Subscription status', enum: SubscriptionStatus })
  subscription_status: SubscriptionStatus;

  @ApiPropertyOptional({ description: 'Stripe customer ID' })
  stripe_customer_id?: string;

  @ApiProperty({ description: 'Is company active' })
  is_active: boolean;

  @ApiProperty({ description: 'Is company verified' })
  is_verified: boolean;

  @ApiPropertyOptional({ description: 'Verification date' })
  verified_at?: string;

  @ApiProperty({ description: 'Additional metadata' })
  metadata: Record<string, any>;

  @ApiProperty({ description: 'Created date' })
  created_at: string;

  @ApiProperty({ description: 'Updated date' })
  updated_at: string;

  @ApiPropertyOptional({ description: 'Deleted date (soft delete)' })
  deleted_at?: string;
}

/**
 * Response DTO for company statistics
 */
export class CompanyStatsDto {
  @ApiProperty({ description: 'Total number of team members', example: 12 })
  @IsNumber()
  @Min(0)
  total_members: number;

  @ApiProperty({ description: 'Number of active team members', example: 10 })
  @IsNumber()
  @Min(0)
  active_members: number;

  @ApiProperty({ description: 'Number of pending invitations', example: 2 })
  @IsNumber()
  @Min(0)
  pending_invitations: number;

  @ApiProperty({ description: 'Total active projects', example: 5 })
  @IsNumber()
  @Min(0)
  active_projects: number;

  @ApiProperty({ description: 'Total completed projects', example: 23 })
  @IsNumber()
  @Min(0)
  completed_projects: number;

  @ApiProperty({ description: 'Total revenue', example: 156780.50 })
  @IsNumber()
  @Min(0)
  total_revenue: number;

  @ApiProperty({ description: 'This month revenue', example: 12500.00 })
  @IsNumber()
  @Min(0)
  monthly_revenue: number;

  @ApiProperty({ description: 'Average team rating', example: 4.8 })
  @IsNumber()
  @Min(0)
  average_rating: number;

  @ApiProperty({ description: 'Total hours worked', example: 3456.5 })
  @IsNumber()
  @Min(0)
  total_hours_worked: number;

  @ApiProperty({ description: 'On-time delivery rate percentage', example: 95.5 })
  @IsNumber()
  @Min(0)
  on_time_delivery_rate: number;
}

/**
 * Response DTO for company overview (includes stats)
 */
export class CompanyOverviewDto extends CompanyResponseDto {
  @ApiProperty({ description: 'Company statistics', type: CompanyStatsDto })
  @ValidateNested()
  @Type(() => CompanyStatsDto)
  stats: CompanyStatsDto;
}
