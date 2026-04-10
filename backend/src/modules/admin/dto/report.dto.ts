import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ReportResolution {
  CONTENT_REMOVED = 'content_removed',
  USER_WARNED = 'user_warned',
  USER_BANNED = 'user_banned',
  NO_ACTION = 'no_action',
}

export class ReviewReportDto {
  @ApiProperty({
    description: 'Resolution for the report',
    enum: ReportResolution,
    example: ReportResolution.CONTENT_REMOVED,
  })
  @IsEnum(ReportResolution)
  resolution: ReportResolution;

  @ApiPropertyOptional({ description: 'Notes about the resolution' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class CreateReportDto {
  @ApiProperty({ description: 'Type of content being reported', example: 'user' })
  @IsString()
  reportType: string; // 'user', 'job', 'project', 'gig', 'message'

  @ApiProperty({ description: 'ID of the content being reported' })
  @IsString()
  targetId: string;

  @ApiPropertyOptional({ description: 'User ID who owns the reported content' })
  @IsString()
  @IsOptional()
  targetUserId?: string;

  @ApiProperty({ description: 'Reason for the report', example: 'spam' })
  @IsString()
  reason: string; // 'spam', 'inappropriate', 'fraud', 'harassment', 'other'

  @ApiPropertyOptional({ description: 'Additional description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Evidence URLs' })
  @IsOptional()
  evidenceUrls?: string[];
}
