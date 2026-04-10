import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  IsDateString,
  IsBoolean,
  IsArray,
  IsUUID,
  Min,
} from 'class-validator';

// Support Package Types
export enum SupportPackageType {
  BASIC = 'basic',
  STANDARD = 'standard',
  PREMIUM = 'premium',
  ENTERPRISE = 'enterprise',
}

// Support Status
export enum SupportStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

// Enhancement Proposal Status
export enum EnhancementProposalStatus {
  PROPOSED = 'proposed',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

// ============================================
// SUPPORT PACKAGE DTOS
// ============================================
export class CreateSupportPackageDto {
  @ApiProperty({ description: 'Package name' })
  @IsString()
  @IsNotEmpty()
  packageName: string;

  @ApiProperty({ enum: SupportPackageType, description: 'Type of support package' })
  @IsEnum(SupportPackageType)
  @IsNotEmpty()
  packageType: SupportPackageType;

  @ApiProperty({ description: 'Monthly support hours included' })
  @IsNumber()
  @Min(0)
  monthlyHours: number;

  @ApiPropertyOptional({ description: 'Response time SLA in hours' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  responseTimeSla?: number;

  @ApiPropertyOptional({ description: 'Included features' })
  @IsArray()
  @IsOptional()
  includesFeatures?: string[];

  @ApiProperty({ description: 'Monthly cost' })
  @IsNumber()
  @Min(0)
  monthlyCost: number;

  @ApiPropertyOptional({ description: 'Currency code', default: 'USD' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({ description: 'Auto-renewal setting', default: true })
  @IsBoolean()
  @IsOptional()
  autoRenew?: boolean;
}

export class UpdateSupportPackageDto {
  @ApiPropertyOptional({ description: 'Package name' })
  @IsString()
  @IsOptional()
  packageName?: string;

  @ApiPropertyOptional({ enum: SupportPackageType, description: 'Package type' })
  @IsEnum(SupportPackageType)
  @IsOptional()
  packageType?: SupportPackageType;

  @ApiPropertyOptional({ description: 'Monthly hours' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  monthlyHours?: number;

  @ApiPropertyOptional({ description: 'Response time SLA' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  responseTimeSla?: number;

  @ApiPropertyOptional({ description: 'Included features' })
  @IsArray()
  @IsOptional()
  includesFeatures?: string[];

  @ApiPropertyOptional({ description: 'Monthly cost' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  monthlyCost?: number;

  @ApiPropertyOptional({ description: 'Auto-renewal' })
  @IsBoolean()
  @IsOptional()
  autoRenew?: boolean;

  @ApiPropertyOptional({ enum: SupportStatus, description: 'Status' })
  @IsEnum(SupportStatus)
  @IsOptional()
  status?: SupportStatus;
}

// ============================================
// PROJECT SUPPORT DTOS
// ============================================
export class CreateProjectSupportDto {
  @ApiProperty({ description: 'Support package ID to subscribe to' })
  @IsUUID()
  @IsNotEmpty()
  packageId: string;

  @ApiProperty({ description: 'Support start date', example: '2024-01-01' })
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @ApiPropertyOptional({ description: 'Support end date', example: '2024-12-31' })
  @IsDateString()
  @IsOptional()
  endDate?: string;
}

export class UpdateProjectSupportDto {
  @ApiPropertyOptional({ description: 'Used hours' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  usedHours?: number;

  @ApiPropertyOptional({ description: 'Support end date' })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Renewal date' })
  @IsDateString()
  @IsOptional()
  renewalDate?: string;

  @ApiPropertyOptional({ description: 'Auto-renewal setting' })
  @IsBoolean()
  @IsOptional()
  autoRenew?: boolean;

  @ApiPropertyOptional({ enum: SupportStatus, description: 'Status' })
  @IsEnum(SupportStatus)
  @IsOptional()
  status?: SupportStatus;
}

// ============================================
// ENHANCEMENT PROPOSAL DTOS
// ============================================
export class CreateEnhancementProposalDto {
  @ApiProperty({ description: 'Enhancement title' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Detailed description of the enhancement' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ description: 'Estimated effort in hours' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  estimatedEffort?: number;

  @ApiPropertyOptional({ description: 'Estimated cost' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  estimatedCost?: number;

  @ApiPropertyOptional({ description: 'Potential business impact' })
  @IsString()
  @IsOptional()
  potentialImpact?: string;

  @ApiPropertyOptional({ description: 'Priority level' })
  @IsString()
  @IsOptional()
  priority?: string;

  @ApiPropertyOptional({ description: 'Tags for categorization' })
  @IsArray()
  @IsOptional()
  tags?: string[];
}

export class UpdateEnhancementProposalDto {
  @ApiPropertyOptional({ description: 'Enhancement title' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ description: 'Description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ enum: EnhancementProposalStatus, description: 'Proposal status' })
  @IsEnum(EnhancementProposalStatus)
  @IsOptional()
  status?: EnhancementProposalStatus;

  @ApiPropertyOptional({ description: 'Estimated effort' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  estimatedEffort?: number;

  @ApiPropertyOptional({ description: 'Estimated cost' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  estimatedCost?: number;

  @ApiPropertyOptional({ description: 'Potential impact' })
  @IsString()
  @IsOptional()
  potentialImpact?: string;

  @ApiPropertyOptional({ description: 'Priority' })
  @IsString()
  @IsOptional()
  priority?: string;

  @ApiPropertyOptional({ description: 'Review notes' })
  @IsString()
  @IsOptional()
  reviewNotes?: string;

  @ApiPropertyOptional({ description: 'Approved by user ID' })
  @IsString()
  @IsOptional()
  approvedBy?: string;

  @ApiPropertyOptional({ description: 'Approval date' })
  @IsDateString()
  @IsOptional()
  approvedAt?: string;
}

// ============================================
// REPORT DTOS (uses reports table)
// ============================================
export enum ReportType {
  USER = 'user',
  JOB = 'job',
  PROJECT = 'project',
  GIG = 'gig',
  MESSAGE = 'message',
}

export enum ReportReason {
  SPAM = 'spam',
  INAPPROPRIATE = 'inappropriate',
  FRAUD = 'fraud',
  HARASSMENT = 'harassment',
  OTHER = 'other',
}

export enum ReportStatus {
  PENDING = 'pending',
  REVIEWING = 'reviewing',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed',
}

export enum ReportResolution {
  CONTENT_REMOVED = 'content_removed',
  USER_WARNED = 'user_warned',
  USER_BANNED = 'user_banned',
  NO_ACTION = 'no_action',
}

export class CreateReportDto {
  @ApiProperty({ enum: ReportType, description: 'Type of content being reported' })
  @IsEnum(ReportType)
  @IsNotEmpty()
  reportType: ReportType;

  @ApiProperty({ description: 'ID of the entity being reported' })
  @IsString()
  @IsNotEmpty()
  targetId: string;

  @ApiPropertyOptional({ description: 'User ID who owns the reported content' })
  @IsString()
  @IsOptional()
  targetUserId?: string;

  @ApiProperty({ enum: ReportReason, description: 'Reason for reporting' })
  @IsEnum(ReportReason)
  @IsNotEmpty()
  reason: ReportReason;

  @ApiPropertyOptional({ description: 'Detailed description of the issue' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Evidence URLs (screenshots, links)' })
  @IsArray()
  @IsOptional()
  evidenceUrls?: string[];

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class UpdateReportDto {
  @ApiPropertyOptional({ enum: ReportStatus, description: 'Report status' })
  @IsEnum(ReportStatus)
  @IsOptional()
  status?: ReportStatus;

  @ApiPropertyOptional({ enum: ReportResolution, description: 'Resolution action taken' })
  @IsEnum(ReportResolution)
  @IsOptional()
  resolution?: ReportResolution;

  @ApiPropertyOptional({ description: 'Resolution notes' })
  @IsString()
  @IsOptional()
  resolutionNotes?: string;
}

export class ReportResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  reporter_id: string;

  @ApiProperty({ enum: ReportType })
  report_type: ReportType;

  @ApiProperty()
  target_id: string;

  @ApiPropertyOptional()
  target_user_id?: string;

  @ApiProperty({ enum: ReportReason })
  reason: ReportReason;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  evidence_urls?: string[];

  @ApiProperty({ enum: ReportStatus })
  status: ReportStatus;

  @ApiPropertyOptional({ enum: ReportResolution })
  resolution?: ReportResolution;

  @ApiPropertyOptional()
  resolution_notes?: string;

  @ApiPropertyOptional()
  reviewed_by?: string;

  @ApiPropertyOptional()
  reviewed_at?: string;

  @ApiPropertyOptional()
  metadata?: Record<string, any>;

  @ApiProperty()
  created_at: string;

  @ApiProperty()
  updated_at: string;
}

// ============================================
// RESPONSE DTOS
// ============================================
export class SupportPackageResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  project_id: string;

  @ApiProperty()
  client_id: string;

  @ApiProperty()
  package_name: string;

  @ApiProperty({ enum: SupportPackageType })
  package_type: SupportPackageType;

  @ApiProperty({ enum: SupportStatus })
  status: SupportStatus;

  @ApiProperty()
  monthly_hours: number;

  @ApiProperty()
  used_hours: number;

  @ApiPropertyOptional()
  response_time_sla?: number;

  @ApiPropertyOptional()
  includes_features?: string[];

  @ApiProperty()
  monthly_cost: number;

  @ApiProperty()
  currency: string;

  @ApiProperty()
  start_date: string;

  @ApiPropertyOptional()
  end_date?: string;

  @ApiPropertyOptional()
  renewal_date?: string;

  @ApiProperty()
  auto_renew: boolean;

  @ApiProperty()
  created_at: string;

  @ApiProperty()
  updated_at: string;
}

export class EnhancementProposalResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  project_id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;

  @ApiProperty({ enum: EnhancementProposalStatus })
  status: EnhancementProposalStatus;

  @ApiPropertyOptional()
  estimated_effort?: number;

  @ApiPropertyOptional()
  estimated_cost?: number;

  @ApiPropertyOptional()
  potential_impact?: string;

  @ApiPropertyOptional()
  priority?: string;

  @ApiPropertyOptional()
  tags?: string[];

  @ApiPropertyOptional()
  review_notes?: string;

  @ApiPropertyOptional()
  approved_by?: string;

  @ApiPropertyOptional()
  approved_at?: string;

  @ApiProperty()
  created_at: string;

  @ApiProperty()
  updated_at: string;
}
