import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsEnum,
  IsObject,
  ValidateNested,
  IsArray
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Subscription plan types
 */
export enum PlanType {
  BASIC = 'basic',
  PRO = 'pro',
  ENTERPRISE = 'enterprise'
}

/**
 * Billing interval types
 */
export enum BillingInterval {
  MONTHLY = 'monthly',
  YEARLY = 'yearly'
}

/**
 * Subscription status
 */
export enum SubscriptionStatus {
  ACTIVE = 'active',
  PAST_DUE = 'past_due',
  CANCELED = 'canceled',
  INCOMPLETE = 'incomplete',
  TRIALING = 'trialing',
  UNPAID = 'unpaid'
}

/**
 * DTO for creating a new subscription
 */
export class CreateSubscriptionDto {
  @ApiProperty({
    description: 'Stripe price ID for the selected plan',
    example: 'price_1234567890'
  })
  @IsString()
  priceId: string;

  @ApiPropertyOptional({
    description: 'Stripe payment method ID',
    example: 'pm_1234567890'
  })
  @IsString()
  @IsOptional()
  paymentMethodId?: string;

  @ApiPropertyOptional({
    description: 'Customer email for Stripe',
    example: 'customer@example.com'
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    description: 'Company ID to associate with the subscription',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsString()
  @IsOptional()
  companyId?: string;

  @ApiPropertyOptional({
    description: 'Additional metadata',
    example: { source: 'web', campaign: 'summer_sale' }
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

/**
 * DTO for updating subscription
 */
export class UpdateSubscriptionDto {
  @ApiPropertyOptional({
    description: 'New price ID to upgrade/downgrade to',
    example: 'price_0987654321'
  })
  @IsString()
  @IsOptional()
  newPriceId?: string;

  @ApiPropertyOptional({
    description: 'Whether to prorate the subscription change',
    example: true,
    default: true
  })
  @IsBoolean()
  @IsOptional()
  prorate?: boolean;

  @ApiPropertyOptional({
    description: 'Additional metadata',
    example: { upgrade_reason: 'need_more_features' }
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

/**
 * DTO for canceling subscription
 */
export class CancelSubscriptionDto {
  @ApiPropertyOptional({
    description: 'Cancel immediately or at period end',
    example: false,
    default: false
  })
  @IsBoolean()
  @IsOptional()
  immediate?: boolean;

  @ApiPropertyOptional({
    description: 'Reason for cancellation',
    example: 'Too expensive'
  })
  @IsString()
  @IsOptional()
  reason?: string;

  @ApiPropertyOptional({
    description: 'Additional feedback',
    example: 'Great service but need to cut costs'
  })
  @IsString()
  @IsOptional()
  feedback?: string;
}

/**
 * DTO for adding payment method
 */
export class AddPaymentMethodDto {
  @ApiProperty({
    description: 'Stripe payment method ID',
    example: 'pm_1234567890'
  })
  @IsString()
  paymentMethodId: string;

  @ApiPropertyOptional({
    description: 'Set as default payment method',
    example: true,
    default: false
  })
  @IsBoolean()
  @IsOptional()
  setAsDefault?: boolean;

  @ApiPropertyOptional({
    description: 'Company ID to associate with',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsString()
  @IsOptional()
  companyId?: string;
}

/**
 * DTO for creating checkout session
 */
export class CreateCheckoutSessionDto {
  @ApiProperty({
    description: 'Stripe price ID',
    example: 'price_1234567890'
  })
  @IsString()
  priceId: string;

  @ApiPropertyOptional({
    description: 'Success URL after checkout',
    example: 'https://teamatonce.com/dashboard/success'
  })
  @IsString()
  @IsOptional()
  successUrl?: string;

  @ApiPropertyOptional({
    description: 'Cancel URL if checkout is canceled',
    example: 'https://teamatonce.com/pricing'
  })
  @IsString()
  @IsOptional()
  cancelUrl?: string;

  @ApiPropertyOptional({
    description: 'Company ID to associate with',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsString()
  @IsOptional()
  companyId?: string;

  @ApiPropertyOptional({
    description: 'Customer email',
    example: 'customer@example.com'
  })
  @IsEmail()
  @IsOptional()
  customerEmail?: string;

  @ApiPropertyOptional({
    description: 'Additional metadata',
    example: { source: 'pricing_page' }
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

/**
 * DTO for plan information
 */
export class PlanDto {
  @ApiProperty({ description: 'Plan identifier', example: 'basic' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Plan display name', example: 'Basic Plan' })
  @IsString()
  displayName: string;

  @ApiProperty({ description: 'Plan description' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Monthly price in cents', example: 1999 })
  @IsNumber()
  monthlyPrice: number;

  @ApiProperty({ description: 'Yearly price in cents', example: 19999 })
  @IsNumber()
  yearlyPrice: number;

  @ApiProperty({ description: 'Stripe monthly price ID' })
  @IsString()
  monthlyPriceId: string;

  @ApiProperty({ description: 'Stripe yearly price ID' })
  @IsString()
  yearlyPriceId: string;

  @ApiProperty({ description: 'Plan features', isArray: true })
  @IsArray()
  @IsString({ each: true })
  features: string[];

  @ApiProperty({ description: 'Maximum team members', example: 5 })
  @IsNumber()
  maxTeamMembers: number;

  @ApiProperty({ description: 'Maximum projects', example: 10 })
  @IsNumber()
  maxProjects: number;

  @ApiProperty({ description: 'Storage limit in GB', example: 50 })
  @IsNumber()
  storageLimit: number;

  @ApiPropertyOptional({ description: 'Is recommended plan', default: false })
  @IsBoolean()
  @IsOptional()
  recommended?: boolean;
}

/**
 * Response DTO for subscription
 */
export class SubscriptionResponseDto {
  @ApiProperty({ description: 'Subscription ID' })
  id: string;

  @ApiProperty({ description: 'Company ID' })
  companyId: string;

  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ description: 'Stripe customer ID' })
  stripeCustomerId: string;

  @ApiProperty({ description: 'Stripe subscription ID' })
  stripeSubscriptionId: string;

  @ApiProperty({ description: 'Stripe price ID' })
  priceId: string;

  @ApiProperty({ description: 'Plan name', enum: PlanType })
  planName: string;

  @ApiProperty({ description: 'Subscription status', enum: SubscriptionStatus })
  status: string;

  @ApiProperty({ description: 'Current period start' })
  currentPeriodStart: Date;

  @ApiProperty({ description: 'Current period end' })
  currentPeriodEnd: Date;

  @ApiProperty({ description: 'Cancel at period end' })
  cancelAtPeriodEnd: boolean;

  @ApiProperty({ description: 'Created timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated timestamp' })
  updatedAt: Date;
}

/**
 * Response DTO for payment method
 */
export class PaymentMethodResponseDto {
  @ApiProperty({ description: 'Payment method ID' })
  id: string;

  @ApiProperty({ description: 'Company ID' })
  companyId: string;

  @ApiProperty({ description: 'Stripe payment method ID' })
  stripePaymentMethodId: string;

  @ApiProperty({ description: 'Payment method type', example: 'card' })
  type: string;

  @ApiProperty({ description: 'Last 4 digits', example: '4242' })
  last4: string;

  @ApiProperty({ description: 'Card brand', example: 'visa' })
  brand: string;

  @ApiProperty({ description: 'Expiration month', example: 12 })
  expMonth: number;

  @ApiProperty({ description: 'Expiration year', example: 2025 })
  expYear: number;

  @ApiProperty({ description: 'Is default payment method' })
  isDefault: boolean;

  @ApiProperty({ description: 'Created timestamp' })
  createdAt: Date;
}
