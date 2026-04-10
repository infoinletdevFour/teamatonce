import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsDateString,
  IsEnum,
  IsArray,
  IsObject,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum MeetingType {
  VIDEO = 'video',
  AUDIO = 'audio',
  IN_PERSON = 'in_person',
}

export enum MeetingStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export class CreateMeetingDto {
  @ApiProperty({ description: 'Meeting title' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Meeting description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: MeetingType, description: 'Type of meeting' })
  @IsEnum(MeetingType)
  meetingType: MeetingType;

  @ApiPropertyOptional({ description: 'Meeting location or URL' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({ description: 'Meeting start time' })
  @IsDateString()
  startTime: string;

  @ApiProperty({ description: 'Meeting end time' })
  @IsDateString()
  endTime: string;

  @ApiPropertyOptional({ description: 'Meeting agenda', type: 'string' })
  @IsOptional()
  @IsString()
  agenda?: string;

  @ApiPropertyOptional({ description: 'Attendee user IDs', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attendees?: string[];
}

export class UpdateMeetingDto {
  @ApiPropertyOptional({ description: 'Meeting title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Meeting description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: MeetingType, description: 'Type of meeting' })
  @IsOptional()
  @IsEnum(MeetingType)
  meetingType?: MeetingType;

  @ApiPropertyOptional({ description: 'Meeting location or URL' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ description: 'Meeting start time' })
  @IsOptional()
  @IsDateString()
  startTime?: string;

  @ApiPropertyOptional({ description: 'Meeting end time' })
  @IsOptional()
  @IsDateString()
  endTime?: string;

  @ApiPropertyOptional({ description: 'Meeting agenda' })
  @IsOptional()
  @IsString()
  agenda?: string;

  @ApiPropertyOptional({ enum: MeetingStatus, description: 'Meeting status' })
  @IsOptional()
  @IsEnum(MeetingStatus)
  status?: MeetingStatus;
}

export class AddMeetingNotesDto {
  @ApiProperty({ description: 'Meeting notes' })
  @IsString()
  notes: string;
}

export class AddMeetingRecordingDto {
  @ApiProperty({ description: 'Recording URL' })
  @IsString()
  recordingUrl: string;
}

export class AddMeetingAttendeeDto {
  @ApiProperty({ description: 'User ID of attendee to add' })
  @IsString()
  userId: string;
}
