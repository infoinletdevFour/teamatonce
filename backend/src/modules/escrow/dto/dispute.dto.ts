import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsArray, IsOptional, IsEnum, Min, Max } from 'class-validator';

export enum DisputeReason {
  NOT_DELIVERED = 'not_delivered',
  QUALITY_ISSUES = 'quality_issues',
  INCOMPLETE = 'incomplete',
  NOT_AS_SPECIFIED = 'not_as_specified',
  TECHNICAL_ISSUES = 'technical_issues',
  DEADLINE_MISSED = 'deadline_missed',
  OTHER = 'other',
}

export enum DisputeResolution {
  FULL_REFUND = 'full_refund',
  PARTIAL_REFUND = 'partial_refund',
  FULL_PAYMENT = 'full_payment',
  PARTIAL_PAYMENT = 'partial_payment',
  REWORK_REQUIRED = 'rework_required',
  EXTEND_DEADLINE = 'extend_deadline',
}

export class OpenDisputeDto {
  @ApiProperty({ description: 'The milestone ID to dispute' })
  @IsString()
  milestoneId: string;

  @ApiProperty({
    description: 'Reason for the dispute',
    enum: DisputeReason,
    example: DisputeReason.QUALITY_ISSUES
  })
  @IsEnum(DisputeReason)
  reason: DisputeReason;

  @ApiProperty({ description: 'Detailed description of the dispute' })
  @IsString()
  description: string;

  @ApiProperty({
    description: 'Supporting evidence URLs (screenshots, documents, etc.)',
    type: [String],
    required: false
  })
  @IsArray()
  @IsOptional()
  evidence?: string[];

  @ApiProperty({ description: 'Requested resolution outcome', required: false })
  @IsString()
  @IsOptional()
  requestedResolution?: string;
}

export class RespondToDisputeDto {
  @ApiProperty({ description: 'Response message to the dispute' })
  @IsString()
  response: string;

  @ApiProperty({
    description: 'Supporting evidence URLs for the response',
    type: [String],
    required: false
  })
  @IsArray()
  @IsOptional()
  evidence?: string[];

  @ApiProperty({ description: 'Counter-proposal for resolution', required: false })
  @IsString()
  @IsOptional()
  counterProposal?: string;

  @ApiProperty({ description: 'Agree to client requested resolution', required: false, default: false })
  @IsOptional()
  agreeToResolution?: boolean;
}

export class MediateDisputeDto {
  @ApiProperty({
    description: 'Final resolution decision',
    enum: DisputeResolution,
    example: DisputeResolution.PARTIAL_REFUND
  })
  @IsEnum(DisputeResolution)
  resolution: DisputeResolution;

  @ApiProperty({ description: 'Percentage of payment to client (0-100)', minimum: 0, maximum: 100 })
  @IsNumber()
  @Min(0)
  @Max(100)
  clientPercentage: number;

  @ApiProperty({ description: 'Percentage of payment to developer (0-100)', minimum: 0, maximum: 100 })
  @IsNumber()
  @Min(0)
  @Max(100)
  developerPercentage: number;

  @ApiProperty({ description: 'Admin notes explaining the decision' })
  @IsString()
  mediationNotes: string;

  @ApiProperty({ description: 'Additional actions required', required: false })
  @IsString()
  @IsOptional()
  additionalActions?: string;

  @ApiProperty({ description: 'Days to extend deadline if applicable', required: false })
  @IsNumber()
  @IsOptional()
  extendDays?: number;
}

export class AcceptMediationDto {
  @ApiProperty({ description: 'Accept or reject the mediation decision' })
  @IsOptional()
  accepted: boolean;

  @ApiProperty({ description: 'Comments about the mediation decision', required: false })
  @IsString()
  @IsOptional()
  comments?: string;
}

export class EscalateDisputeDto {
  @ApiProperty({ description: 'Reason for escalation' })
  @IsString()
  reason: string;

  @ApiProperty({ description: 'Additional evidence for escalation', type: [String], required: false })
  @IsArray()
  @IsOptional()
  additionalEvidence?: string[];
}

export class WithdrawDisputeDto {
  @ApiProperty({ description: 'Reason for withdrawing the dispute' })
  @IsString()
  reason: string;
}
