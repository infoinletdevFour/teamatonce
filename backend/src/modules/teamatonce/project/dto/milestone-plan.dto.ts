import { IsString, IsOptional, IsNumber, IsArray, IsEnum, IsUUID, Min, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * Status of milestone plan
 */
export enum MilestonePlanStatus {
  DRAFT = 'draft',
  PENDING_REVIEW = 'pending_review',
  CHANGES_REQUESTED = 'changes_requested',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

/**
 * Proposed milestone structure in the plan
 */
export class ProposedMilestoneDto {
  @ApiProperty({ description: 'Milestone name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Detailed description' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Milestone type', example: 'development' })
  @IsString()
  milestoneType: string;

  @ApiProperty({ description: 'Order/sequence index' })
  @IsNumber()
  orderIndex: number;

  @ApiProperty({ description: 'List of deliverables', type: [String] })
  @IsArray()
  @IsString({ each: true })
  deliverables: string[];

  @ApiProperty({ description: 'List of acceptance criteria', type: [String] })
  @IsArray()
  @IsString({ each: true })
  acceptanceCriteria: string[];

  @ApiProperty({ description: 'Estimated hours' })
  @IsNumber()
  @Min(0)
  estimatedHours: number;

  @ApiProperty({ description: 'Payment amount for this milestone' })
  @IsNumber()
  @Min(0.01)
  milestoneAmount: number;

  @ApiPropertyOptional({ description: 'Expected due date (ISO format)' })
  @IsString()
  @IsOptional()
  dueDate?: string;

  // Enhanced Upwork-style fields
  @ApiPropertyOptional({ description: 'Dependencies - what needs to be completed first', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  dependencies?: string[];

  @ApiPropertyOptional({ description: 'Resources required - tools, assets needed', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  resourcesRequired?: string[];

  @ApiPropertyOptional({ description: 'Review process - how client will review' })
  @IsString()
  @IsOptional()
  reviewProcess?: string;

  @ApiPropertyOptional({ description: 'Quality metrics - how success will be measured', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  qualityMetrics?: string[];

  @ApiPropertyOptional({ description: 'Technical implementation details' })
  @IsString()
  @IsOptional()
  technicalDetails?: string;
}

/**
 * Create a new milestone plan (by developer)
 */
export class CreateMilestonePlanDto {
  @ApiProperty({ description: 'Project ID' })
  @IsUUID()
  projectId: string;

  @ApiProperty({ description: 'Proposal ID that was accepted' })
  @IsUUID()
  proposalId: string;

  @ApiProperty({
    description: 'Array of proposed milestones',
    type: [ProposedMilestoneDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProposedMilestoneDto)
  milestones: ProposedMilestoneDto[];

  // Enhanced plan-level details (Upwork-style)
  @ApiPropertyOptional({ description: 'Executive summary of the project' })
  @IsString()
  @IsOptional()
  projectOverview?: string;

  @ApiPropertyOptional({ description: 'Technical methodology and implementation strategy' })
  @IsString()
  @IsOptional()
  technicalApproach?: string;

  @ApiPropertyOptional({ description: 'Tools and technologies to be used', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  toolsAndTechnologies?: string[];

  @ApiPropertyOptional({ description: 'Communication plan and update frequency' })
  @IsString()
  @IsOptional()
  communicationPlan?: string;

  @ApiPropertyOptional({ description: 'Project assumptions', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  assumptions?: string[];

  @ApiPropertyOptional({ description: 'Potential risks and mitigation strategies', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  risks?: string[];

  @ApiPropertyOptional({ description: 'Testing strategy and QA approach' })
  @IsString()
  @IsOptional()
  testingStrategy?: string;
}

/**
 * Update an existing milestone plan (by developer)
 */
export class UpdateMilestonePlanDto {
  @ApiPropertyOptional({
    description: 'Updated array of proposed milestones',
    type: [ProposedMilestoneDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProposedMilestoneDto)
  @IsOptional()
  milestones?: ProposedMilestoneDto[];

  @ApiPropertyOptional({ description: 'Plan status' })
  @IsEnum(MilestonePlanStatus)
  @IsOptional()
  status?: MilestonePlanStatus;

  // Enhanced plan-level details (Upwork-style)
  @ApiPropertyOptional({ description: 'Executive summary of the project' })
  @IsString()
  @IsOptional()
  projectOverview?: string;

  @ApiPropertyOptional({ description: 'Technical methodology and implementation strategy' })
  @IsString()
  @IsOptional()
  technicalApproach?: string;

  @ApiPropertyOptional({ description: 'Tools and technologies to be used', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  toolsAndTechnologies?: string[];

  @ApiPropertyOptional({ description: 'Communication plan and update frequency' })
  @IsString()
  @IsOptional()
  communicationPlan?: string;

  @ApiPropertyOptional({ description: 'Project assumptions', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  assumptions?: string[];

  @ApiPropertyOptional({ description: 'Potential risks and mitigation strategies', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  risks?: string[];

  @ApiPropertyOptional({ description: 'Testing strategy and QA approach' })
  @IsString()
  @IsOptional()
  testingStrategy?: string;
}

/**
 * Submit milestone plan for client review
 */
export class SubmitMilestonePlanDto {
  @ApiPropertyOptional({ description: 'Optional note to client' })
  @IsString()
  @IsOptional()
  note?: string;
}

/**
 * Approve milestone plan (by client)
 */
export class ApproveMilestonePlanDto {
  @ApiPropertyOptional({ description: 'Approval notes from client' })
  @IsString()
  @IsOptional()
  notes?: string;
}

/**
 * Request changes to milestone plan (by client)
 */
export class RequestMilestonePlanChangesDto {
  @ApiProperty({ description: 'Feedback from client explaining what needs to change' })
  @IsString()
  feedback: string;
}

/**
 * Reject milestone plan (by client)
 */
export class RejectMilestonePlanDto {
  @ApiProperty({ description: 'Reason for rejection' })
  @IsString()
  reason: string;
}

/**
 * Response DTO for milestone plan
 */
export class MilestonePlanResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  projectId: string;

  @ApiProperty()
  proposalId: string;

  @ApiProperty()
  submittedBy: string;

  @ApiProperty({ enum: MilestonePlanStatus })
  status: MilestonePlanStatus;

  @ApiProperty({ type: [ProposedMilestoneDto] })
  milestones: ProposedMilestoneDto[];

  @ApiPropertyOptional()
  submittedAt?: string;

  @ApiPropertyOptional()
  reviewedBy?: string;

  @ApiPropertyOptional()
  reviewedAt?: string;

  @ApiPropertyOptional()
  clientFeedback?: string;

  @ApiProperty()
  revisionCount: number;

  @ApiProperty()
  version: number;

  @ApiProperty()
  createdAt: string;

  @ApiProperty()
  updatedAt: string;

  // Enhanced plan-level details (Upwork-style)
  @ApiPropertyOptional({ description: 'Executive summary of the project' })
  projectOverview?: string;

  @ApiPropertyOptional({ description: 'Technical methodology and implementation strategy' })
  technicalApproach?: string;

  @ApiPropertyOptional({ description: 'Tools and technologies to be used', type: [String] })
  toolsAndTechnologies?: string[];

  @ApiPropertyOptional({ description: 'Communication plan and update frequency' })
  communicationPlan?: string;

  @ApiPropertyOptional({ description: 'Project assumptions', type: [String] })
  assumptions?: string[];

  @ApiPropertyOptional({ description: 'Potential risks and mitigation strategies', type: [String] })
  risks?: string[];

  @ApiPropertyOptional({ description: 'Testing strategy and QA approach' })
  testingStrategy?: string;
}
