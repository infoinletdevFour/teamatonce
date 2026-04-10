import { IsString, IsOptional, IsNumber, IsArray, IsEnum, IsUUID, IsObject, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Status of milestone adjustment request
 */
export enum MilestoneAdjustmentStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

/**
 * Proposed changes to a milestone
 */
export class MilestoneChangesDto {
  @ApiPropertyOptional({ description: 'New milestone name' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'New milestone description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'New estimated hours' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  estimatedHours?: number;

  @ApiPropertyOptional({ description: 'New milestone amount' })
  @IsNumber()
  @Min(0.01)
  @IsOptional()
  milestoneAmount?: number;

  @ApiPropertyOptional({ description: 'New due date (ISO format)' })
  @IsString()
  @IsOptional()
  dueDate?: string;

  @ApiPropertyOptional({ description: 'Updated deliverables', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  deliverables?: string[];

  @ApiPropertyOptional({ description: 'Updated acceptance criteria', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  acceptanceCriteria?: string[];
}

/**
 * Create a milestone adjustment request (by developer)
 */
export class CreateMilestoneAdjustmentDto {
  @ApiProperty({ description: 'Milestone ID to adjust' })
  @IsUUID()
  milestoneId: string;

  @ApiProperty({ description: 'Proposed changes', type: MilestoneChangesDto })
  @IsObject()
  changes: MilestoneChangesDto;

  @ApiProperty({ description: 'Reason for requesting adjustment' })
  @IsString()
  reason: string;
}

/**
 * Approve adjustment request (by client)
 */
export class ApproveAdjustmentDto {
  @ApiPropertyOptional({ description: 'Approval notes from client' })
  @IsString()
  @IsOptional()
  notes?: string;
}

/**
 * Reject adjustment request (by client)
 */
export class RejectAdjustmentDto {
  @ApiProperty({ description: 'Reason for rejection' })
  @IsString()
  response: string;
}

/**
 * Response DTO for milestone adjustment request
 */
export class MilestoneAdjustmentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  milestoneId: string;

  @ApiProperty()
  projectId: string;

  @ApiProperty()
  requestedBy: string;

  @ApiProperty({ enum: MilestoneAdjustmentStatus })
  status: MilestoneAdjustmentStatus;

  @ApiProperty({ type: MilestoneChangesDto })
  changes: MilestoneChangesDto;

  @ApiProperty()
  reason: string;

  @ApiPropertyOptional()
  reviewedBy?: string;

  @ApiPropertyOptional()
  reviewedAt?: string;

  @ApiPropertyOptional()
  clientResponse?: string;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;
}
