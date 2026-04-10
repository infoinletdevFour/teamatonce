import { IsString, IsNumber, IsOptional, IsEnum, IsDateString, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export enum PaymentType {
  HOURLY = 'hourly',
  FIXED = 'fixed',
}

export enum HireRequestStatus {
  PENDING = 'pending',
  NEGOTIATING = 'negotiating',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  WITHDRAWN = 'withdrawn',
  EXPIRED = 'expired',
}

export class CreateHireRequestDto {
  @IsString()
  companyId: string; // The seller's company ID

  @IsOptional()
  @IsString()
  projectId?: string; // Optional: Link to existing project (if not provided, new project will be created)

  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsString()
  category: string;

  @IsEnum(PaymentType)
  paymentType: PaymentType;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  hourlyRate?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  estimatedHours?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  fixedBudget?: number;

  @IsDateString()
  startDate: string;

  @IsString()
  duration: string;

  @IsOptional()
  @IsString()
  additionalDetails?: string;

  @IsOptional()
  @IsArray()
  attachmentUrls?: string[];
}

export class UpdateHireRequestDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsEnum(PaymentType)
  paymentType?: PaymentType;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  hourlyRate?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  estimatedHours?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  fixedBudget?: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsString()
  duration?: string;

  @IsOptional()
  @IsString()
  additionalDetails?: string;

  @IsOptional()
  @IsArray()
  attachmentUrls?: string[];
}

export class ReviewHireRequestDto {
  @IsEnum(HireRequestStatus)
  status: HireRequestStatus.ACCEPTED | HireRequestStatus.REJECTED;

  @IsOptional()
  @IsString()
  responseMessage?: string;
}

export class HireRequestResponseDto {
  id: string;
  clientId: string;
  companyId: string;
  projectId?: string; // Linked project ID
  title: string;
  description: string;
  category: string;
  paymentType: PaymentType;
  hourlyRate?: number;
  estimatedHours?: number;
  fixedBudget?: number;
  totalBudget: number;
  startDate: string;
  duration: string;
  additionalDetails?: string;
  attachmentUrls?: string[];
  status: HireRequestStatus;
  responseMessage?: string;
  respondedAt?: string;
  createdAt: string;
  updatedAt: string;

  // Enriched fields
  client?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  company?: {
    id: string;
    name: string;
    logo?: string;
  };
}

export class HireRequestsListResponseDto {
  hireRequests: HireRequestResponseDto[];
  total: number;
}
