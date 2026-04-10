import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsDateString,
  IsEnum,
  IsUrl,
  IsArray,
  IsInt,
  Min,
} from 'class-validator';

export enum EventType {
  MEETING = 'meeting',
  DEADLINE = 'deadline',
  CALL = 'call',
  REVIEW = 'review',
  MILESTONE = 'milestone',
}

export enum EventPriority {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  NORMAL = 'normal',
}

export enum EventStatus {
  UPCOMING = 'upcoming',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export class CreateEventDto {
  @ApiProperty({ description: 'Event title' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Event description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Event date (YYYY-MM-DD)' })
  @IsDateString()
  date: string;

  @ApiProperty({ description: 'Event start time (e.g., "09:00")' })
  @IsString()
  startTime: string;

  @ApiProperty({ description: 'Event end time (e.g., "10:00")' })
  @IsString()
  endTime: string;

  @ApiProperty({
    description: 'Event type',
    enum: EventType,
    default: EventType.MEETING,
  })
  @IsEnum(EventType)
  type: EventType;

  @ApiPropertyOptional({ description: 'Meeting URL (e.g., Google Meet, Zoom)' })
  @IsOptional()
  @IsUrl()
  meetingUrl?: string;

  @ApiPropertyOptional({
    description: 'Event priority',
    enum: EventPriority,
    default: EventPriority.NORMAL,
  })
  @IsOptional()
  @IsEnum(EventPriority)
  priority?: EventPriority;

  @ApiPropertyOptional({
    description: 'Event status',
    enum: EventStatus,
    default: EventStatus.UPCOMING,
  })
  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus;

  @ApiPropertyOptional({ description: 'Event color (hex code)' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ description: 'Event location' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ description: 'Array of user IDs who are attending', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attendees?: string[];

  @ApiPropertyOptional({ description: 'Minutes before event to send reminder (positive integer)', example: 15 })
  @IsOptional()
  @IsInt()
  @Min(1)
  reminderMinutes?: number;
}

export class UpdateEventDto {
  @ApiPropertyOptional({ description: 'Event title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Event description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Event date (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ description: 'Event start time (e.g., "09:00")' })
  @IsOptional()
  @IsString()
  startTime?: string;

  @ApiPropertyOptional({ description: 'Event end time (e.g., "10:00")' })
  @IsOptional()
  @IsString()
  endTime?: string;

  @ApiPropertyOptional({ description: 'Event type', enum: EventType })
  @IsOptional()
  @IsEnum(EventType)
  type?: EventType;

  @ApiPropertyOptional({ description: 'Meeting URL' })
  @IsOptional()
  @IsUrl()
  meetingUrl?: string;

  @ApiPropertyOptional({ description: 'Event priority', enum: EventPriority })
  @IsOptional()
  @IsEnum(EventPriority)
  priority?: EventPriority;

  @ApiPropertyOptional({ description: 'Event status', enum: EventStatus })
  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus;

  @ApiPropertyOptional({ description: 'Event color (hex code)' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ description: 'Event location' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ description: 'Array of user IDs who are attending', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attendees?: string[];

  @ApiPropertyOptional({ description: 'Minutes before event to send reminder (positive integer)', example: 15 })
  @IsOptional()
  @IsInt()
  @Min(1)
  reminderMinutes?: number;
}
