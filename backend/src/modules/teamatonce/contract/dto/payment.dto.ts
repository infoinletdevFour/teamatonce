import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  IsDateString,
  IsUUID,
  Min,
} from 'class-validator';

// Payment Types
export enum PaymentType {
  MILESTONE = 'milestone',
  INVOICE = 'invoice',
  REFUND = 'refund',
  PARTIAL = 'partial',
}

// Payment Status
export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

// Payment Methods
export enum PaymentMethod {
  CREDIT_CARD = 'credit_card',
  BANK_TRANSFER = 'bank_transfer',
  PAYPAL = 'paypal',
  STRIPE = 'stripe',
}

// ============================================
// CREATE PAYMENT DTO
// ============================================
export class CreatePaymentDto {
  @ApiPropertyOptional({ description: 'Associated contract ID' })
  @IsUUID()
  @IsOptional()
  contractId?: string;

  @ApiPropertyOptional({ description: 'Associated milestone ID' })
  @IsUUID()
  @IsOptional()
  milestoneId?: string;

  @ApiProperty({ enum: PaymentType, description: 'Type of payment' })
  @IsEnum(PaymentType)
  @IsNotEmpty()
  paymentType: PaymentType;

  @ApiProperty({ description: 'Payment amount' })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional({ description: 'Currency code', default: 'USD' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({ enum: PaymentMethod, description: 'Payment method' })
  @IsEnum(PaymentMethod)
  @IsOptional()
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional({ description: 'Payment description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Invoice number' })
  @IsString()
  @IsOptional()
  invoiceNumber?: string;

  @ApiPropertyOptional({ description: 'Platform fee' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  platformFee?: number;
}

// ============================================
// UPDATE PAYMENT DTO
// ============================================
export class UpdatePaymentDto {
  @ApiPropertyOptional({ enum: PaymentStatus, description: 'Payment status' })
  @IsEnum(PaymentStatus)
  @IsOptional()
  status?: PaymentStatus;

  @ApiPropertyOptional({ description: 'Amount' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  amount?: number;

  @ApiPropertyOptional({ enum: PaymentMethod, description: 'Payment method' })
  @IsEnum(PaymentMethod)
  @IsOptional()
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional({ description: 'Description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Transaction ID' })
  @IsString()
  @IsOptional()
  transactionId?: string;

  @ApiPropertyOptional({ description: 'Invoice number' })
  @IsString()
  @IsOptional()
  invoiceNumber?: string;

  @ApiPropertyOptional({ description: 'Invoice URL' })
  @IsString()
  @IsOptional()
  invoiceUrl?: string;

  @ApiPropertyOptional({ description: 'Platform fee' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  platformFee?: number;
}

// ============================================
// PROCESS PAYMENT DTO
// ============================================
export class ProcessPaymentDto {
  @ApiProperty({ enum: PaymentMethod, description: 'Payment method used' })
  @IsEnum(PaymentMethod)
  @IsNotEmpty()
  paymentMethod: PaymentMethod;

  @ApiPropertyOptional({ description: 'Stripe payment intent ID' })
  @IsString()
  @IsOptional()
  stripePaymentIntentId?: string;

  @ApiPropertyOptional({ description: 'Stripe charge ID' })
  @IsString()
  @IsOptional()
  stripeChargeId?: string;

  @ApiPropertyOptional({ description: 'External transaction ID' })
  @IsString()
  @IsOptional()
  transactionId?: string;

  @ApiPropertyOptional({ description: 'Payment metadata' })
  @IsOptional()
  metadata?: Record<string, any>;
}

// ============================================
// MILESTONE PAYMENT DTO
// ============================================
export class CreateMilestonePaymentDto {
  @ApiProperty({ description: 'Payment amount for milestone' })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional({ description: 'Currency code', default: 'USD' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({ description: 'Additional description' })
  @IsString()
  @IsOptional()
  description?: string;
}

// ============================================
// RESPONSE DTOS
// ============================================
export class PaymentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  project_id: string;

  @ApiPropertyOptional()
  contract_id?: string;

  @ApiPropertyOptional()
  milestone_id?: string;

  @ApiProperty()
  client_id: string;

  @ApiProperty({ enum: PaymentType })
  payment_type: PaymentType;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  currency: string;

  @ApiProperty({ enum: PaymentStatus })
  status: PaymentStatus;

  @ApiPropertyOptional({ enum: PaymentMethod })
  payment_method?: PaymentMethod;

  @ApiPropertyOptional()
  stripe_payment_intent_id?: string;

  @ApiPropertyOptional()
  stripe_charge_id?: string;

  @ApiPropertyOptional()
  transaction_id?: string;

  @ApiPropertyOptional()
  transaction_date?: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  invoice_number?: string;

  @ApiPropertyOptional()
  invoice_url?: string;

  @ApiProperty()
  platform_fee: number;

  @ApiPropertyOptional()
  net_amount?: number;

  @ApiPropertyOptional()
  metadata?: Record<string, any>;

  @ApiProperty()
  created_at: string;

  @ApiProperty()
  updated_at: string;
}
