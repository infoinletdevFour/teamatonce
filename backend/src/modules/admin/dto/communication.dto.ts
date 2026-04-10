import { IsString, IsOptional, IsEnum, IsArray, IsObject, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum TargetAudience {
  ALL = 'all',
  CLIENTS = 'clients',
  SELLERS = 'sellers',
  PENDING_APPROVAL = 'pending_approval',
  SPECIFIC_USERS = 'specific_users',
  INDIVIDUAL = 'individual',
}

export class BulkEmailDto {
  @ApiProperty({ description: 'Campaign name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Email subject line' })
  @IsString()
  subject: string;

  @ApiProperty({ description: 'Email content in HTML format' })
  @IsString()
  contentHtml: string;

  @ApiPropertyOptional({ description: 'Plain text version of the email' })
  @IsString()
  @IsOptional()
  contentText?: string;

  @ApiProperty({ description: 'Target audience for the email', enum: TargetAudience })
  @IsEnum(TargetAudience)
  targetAudience: TargetAudience;

  @ApiPropertyOptional({ description: 'Additional filters for targeting' })
  @IsObject()
  @IsOptional()
  targetFilters?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Schedule time for sending (ISO 8601)' })
  @IsDateString()
  @IsOptional()
  scheduledAt?: string;

  @ApiPropertyOptional({ description: 'Individual email addresses (when targetAudience is "individual")' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  individualEmails?: string[];
}

export enum NotificationPriorityLevel {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
}

export class BulkNotificationDto {
  @ApiProperty({ description: 'Notification title' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Notification message' })
  @IsString()
  message: string;

  @ApiProperty({ description: 'Target audience', enum: TargetAudience })
  @IsEnum(TargetAudience)
  targetAudience: TargetAudience;

  @ApiPropertyOptional({ description: 'Individual email addresses (when targeting specific users)' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  individualEmails?: string[];

  @ApiPropertyOptional({ description: 'Notification type' })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiPropertyOptional({ description: 'Action URL when notification is clicked' })
  @IsString()
  @IsOptional()
  actionUrl?: string;

  @ApiPropertyOptional({ description: 'Notification priority', enum: NotificationPriorityLevel })
  @IsEnum(NotificationPriorityLevel)
  @IsOptional()
  priority?: NotificationPriorityLevel;
}
