import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsArray, IsOptional, IsBoolean, Min } from 'class-validator';

export class FundMilestoneEscrowDto {
  @ApiProperty({ description: 'The milestone ID to fund' })
  @IsString()
  milestoneId: string;

  @ApiProperty({ description: 'Amount to fund in smallest currency unit (e.g., cents)', minimum: 1 })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({ description: 'Stripe payment method ID' })
  @IsString()
  paymentMethodId: string;

  @ApiProperty({ description: 'Currency code (e.g., USD, EUR)', required: false, default: 'USD' })
  @IsString()
  @IsOptional()
  currency?: string;
}

export class SubmitDeliverablesDto {
  @ApiProperty({ description: 'The milestone ID for deliverable submission' })
  @IsString()
  milestoneId: string;

  @ApiProperty({ description: 'Array of file URLs or S3 keys', type: [String] })
  @IsArray()
  files: string[];

  @ApiProperty({ description: 'Description of the deliverables' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Type of deliverable (e.g., source_code, documentation, design)', required: false })
  @IsString()
  @IsOptional()
  deliverableType?: string;
}

export class ApproveDeliverableDto {
  @ApiProperty({ description: 'The milestone ID to approve' })
  @IsString()
  milestoneId: string;

  @ApiProperty({ description: 'Optional review notes from client', required: false })
  @IsString()
  @IsOptional()
  reviewNotes?: string;
}

export class RequestChangesDto {
  @ApiProperty({ description: 'The milestone ID to request changes for' })
  @IsString()
  milestoneId: string;

  @ApiProperty({ description: 'Detailed notes explaining required changes' })
  @IsString()
  changeNotes: string;

  @ApiProperty({ description: 'Number of days to extend the deadline', required: false })
  @IsNumber()
  @IsOptional()
  extendDays?: number;
}

export class CreateConnectAccountDto {
  @ApiProperty({ description: 'Email address for the developer' })
  @IsString()
  email: string;

  @ApiProperty({ description: 'Country code for the Stripe Connect account', example: 'US', required: false, default: 'US' })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiProperty({ description: 'Business type (individual or company)', required: false, default: 'individual', enum: ['individual', 'company'] })
  @IsString()
  @IsOptional()
  businessType?: 'individual' | 'company';
}

export class RefundEscrowDto {
  @ApiProperty({ description: 'The milestone ID to refund' })
  @IsString()
  milestoneId: string;

  @ApiProperty({ description: 'Reason for the refund' })
  @IsString()
  reason: string;

  @ApiProperty({ description: 'Full or partial refund', default: true })
  @IsBoolean()
  @IsOptional()
  fullRefund?: boolean;

  @ApiProperty({ description: 'Amount to refund for partial refunds', required: false })
  @IsNumber()
  @IsOptional()
  amount?: number;
}

export class AutoReleaseConfigDto {
  @ApiProperty({ description: 'The milestone ID to configure auto-release' })
  @IsString()
  milestoneId: string;

  @ApiProperty({ description: 'Enable or disable auto-release' })
  @IsBoolean()
  enabled: boolean;

  @ApiProperty({ description: 'Number of days after submission to auto-release', required: false, default: 7 })
  @IsNumber()
  @IsOptional()
  daysAfterSubmission?: number;
}
