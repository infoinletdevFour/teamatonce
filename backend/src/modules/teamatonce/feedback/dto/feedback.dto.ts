import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsInt, IsOptional, IsUUID, Min, Max, IsEnum } from 'class-validator';

export enum FeedbackType {
  PROJECT = 'project',
  MILESTONE = 'milestone',
  TEAM_MEMBER = 'team-member',
}

export class CreateFeedbackDto {
  @ApiProperty({ description: 'Project ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  projectId: string;

  @ApiPropertyOptional({ description: 'Milestone ID (optional)', example: '123e4567-e89b-12d3-a456-426614174001' })
  @IsOptional()
  @IsUUID()
  milestoneId?: string;

  @ApiProperty({ description: 'Feedback type', enum: FeedbackType, example: FeedbackType.PROJECT })
  @IsEnum(FeedbackType)
  feedbackType: FeedbackType;

  @ApiProperty({ description: 'Rating (1-5 stars)', example: 4, minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional({ description: 'Feedback title', example: 'Great work on milestone 1' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ description: 'Feedback content', example: 'The team delivered excellent quality work on time.' })
  @IsString()
  content: string;

  @ApiPropertyOptional({ description: 'Areas of improvement', type: [String], example: ['Better communication', 'More frequent updates'] })
  @IsOptional()
  areasOfImprovement?: string[];

  @ApiPropertyOptional({ description: 'Positive aspects', type: [String], example: ['High quality code', 'On-time delivery'] })
  @IsOptional()
  positiveAspects?: string[];

  @ApiPropertyOptional({ description: 'Attachments (file URLs)', type: [String] })
  @IsOptional()
  attachments?: string[];

  @ApiPropertyOptional({ description: 'Is feedback public', example: false })
  @IsOptional()
  isPublic?: boolean;
}

export class UpdateFeedbackDto {
  @ApiPropertyOptional({ description: 'Rating (1-5 stars)', example: 5, minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional({ description: 'Feedback title', example: 'Updated: Excellent work' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ description: 'Feedback content', example: 'Updated feedback content' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ description: 'Areas of improvement', type: [String] })
  @IsOptional()
  areasOfImprovement?: string[];

  @ApiPropertyOptional({ description: 'Positive aspects', type: [String] })
  @IsOptional()
  positiveAspects?: string[];

  @ApiPropertyOptional({ description: 'Is feedback public', example: true })
  @IsOptional()
  isPublic?: boolean;
}

export class RespondToFeedbackDto {
  @ApiProperty({ description: 'Response to feedback', example: 'Thank you for your feedback! We appreciate your kind words.' })
  @IsString()
  response: string;
}

export class FeedbackQueryDto {
  @ApiPropertyOptional({ description: 'Milestone ID filter', example: '123e4567-e89b-12d3-a456-426614174001' })
  @IsOptional()
  @IsUUID()
  milestoneId?: string;

  @ApiPropertyOptional({ description: 'Feedback type filter', enum: FeedbackType })
  @IsOptional()
  @IsEnum(FeedbackType)
  feedbackType?: FeedbackType;

  @ApiPropertyOptional({ description: 'Minimum rating filter', example: 4, minimum: 1, maximum: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  minRating?: number;
}
