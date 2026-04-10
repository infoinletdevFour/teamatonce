import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  IsDateString,
  IsObject,
  IsArray,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

// Contract Types
export enum ContractType {
  FIXED_PRICE = 'fixed_price',
  HOURLY = 'hourly',
  MILESTONE_BASED = 'milestone_based',
}

// Contract Status
export enum ContractStatus {
  DRAFT = 'draft',
  PENDING_SIGNATURE = 'pending_signature',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  TERMINATED = 'terminated',
}

// ============================================
// CREATE CONTRACT DTO
// ============================================
export class CreateContractDto {
  @ApiProperty({ description: 'Contract title' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ description: 'Contract description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: ContractType, description: 'Type of contract' })
  @IsEnum(ContractType)
  @IsNotEmpty()
  contractType: ContractType;

  @ApiProperty({ description: 'Terms and conditions of the contract' })
  @IsString()
  @IsNotEmpty()
  terms: string;

  @ApiProperty({ description: 'Scope of work' })
  @IsString()
  @IsNotEmpty()
  scopeOfWork: string;

  @ApiProperty({ description: 'Total contract amount' })
  @IsNumber()
  @Min(0)
  totalAmount: number;

  @ApiPropertyOptional({ description: 'Currency code', default: 'USD' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({ description: 'Payment terms as JSON object' })
  @IsObject()
  @IsOptional()
  paymentTerms?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Hourly rate (for hourly contracts)' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  hourlyRate?: number;

  @ApiProperty({ description: 'Contract start date', example: '2024-01-01' })
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @ApiProperty({ description: 'Contract end date', example: '2024-12-31' })
  @IsDateString()
  @IsNotEmpty()
  endDate: string;

  @ApiPropertyOptional({ description: 'Renewal terms as JSON object' })
  @IsObject()
  @IsOptional()
  renewalTerms?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Contract attachments' })
  @IsArray()
  @IsOptional()
  attachments?: any[];
}

// ============================================
// UPDATE CONTRACT DTO
// ============================================
export class UpdateContractDto {
  @ApiPropertyOptional({ description: 'Contract title' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ description: 'Contract description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ enum: ContractStatus, description: 'Contract status' })
  @IsEnum(ContractStatus)
  @IsOptional()
  status?: ContractStatus;

  @ApiPropertyOptional({ description: 'Terms and conditions' })
  @IsString()
  @IsOptional()
  terms?: string;

  @ApiPropertyOptional({ description: 'Scope of work' })
  @IsString()
  @IsOptional()
  scopeOfWork?: string;

  @ApiPropertyOptional({ description: 'Total amount' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  totalAmount?: number;

  @ApiPropertyOptional({ description: 'Payment terms' })
  @IsObject()
  @IsOptional()
  paymentTerms?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Hourly rate' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  hourlyRate?: number;

  @ApiPropertyOptional({ description: 'Start date' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date' })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Renewal terms' })
  @IsObject()
  @IsOptional()
  renewalTerms?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Contract attachments' })
  @IsArray()
  @IsOptional()
  attachments?: any[];
}

// ============================================
// SIGNATURE DTO
// ============================================
export class SignatureDto {
  @ApiProperty({ description: 'Signature data (base64 or digital signature)' })
  @IsString()
  @IsNotEmpty()
  signatureData: string;

  @ApiPropertyOptional({ description: 'Signer name' })
  @IsString()
  @IsOptional()
  signerName?: string;

  @ApiPropertyOptional({ description: 'Signer email' })
  @IsString()
  @IsOptional()
  signerEmail?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

// ============================================
// RESPONSE DTOS
// ============================================
export class ContractResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  project_id: string;

  @ApiProperty()
  client_id: string;

  @ApiProperty({ enum: ContractType })
  contract_type: ContractType;

  @ApiProperty({ enum: ContractStatus })
  status: ContractStatus;

  @ApiProperty()
  title: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  terms: string;

  @ApiProperty()
  scope_of_work: string;

  @ApiProperty()
  total_amount: number;

  @ApiProperty()
  currency: string;

  @ApiPropertyOptional()
  payment_terms?: Record<string, any>;

  @ApiPropertyOptional()
  hourly_rate?: number;

  @ApiProperty()
  start_date: string;

  @ApiProperty()
  end_date: string;

  @ApiPropertyOptional()
  renewal_terms?: Record<string, any>;

  @ApiPropertyOptional()
  client_signature?: Record<string, any>;

  @ApiPropertyOptional()
  provider_signature?: Record<string, any>;

  @ApiPropertyOptional()
  signed_at?: string;

  @ApiPropertyOptional()
  contract_document_url?: string;

  @ApiPropertyOptional()
  attachments?: any[];

  @ApiProperty()
  created_at: string;

  @ApiProperty()
  updated_at: string;
}
