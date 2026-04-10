import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsDateString,
} from 'class-validator';

export enum VideoSessionType {
  MEETING = 'meeting',
  DEMO = 'demo',
  REVIEW = 'review',
  TRAINING = 'training',
}

export enum VideoSessionStatus {
  SCHEDULED = 'scheduled',
  ACTIVE = 'active',
  ENDED = 'ended',
  CANCELLED = 'cancelled',
}

export class CreateVideoSessionDto {
  @ApiProperty({ description: 'Video session room name' })
  @IsString()
  roomName: string;

  @ApiPropertyOptional({ enum: VideoSessionType, description: 'Session type', default: VideoSessionType.MEETING })
  @IsOptional()
  @IsEnum(VideoSessionType)
  sessionType?: VideoSessionType;

  @ApiPropertyOptional({ description: 'Scheduled start time' })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @ApiPropertyOptional({ description: 'Meeting agenda' })
  @IsOptional()
  @IsString()
  agenda?: string;
}

export class UpdateVideoSessionDto {
  @ApiPropertyOptional({ description: 'Recording URL' })
  @IsOptional()
  @IsString()
  recordingUrl?: string;

  @ApiPropertyOptional({ description: 'Meeting notes' })
  @IsOptional()
  @IsString()
  meetingNotes?: string;

  @ApiPropertyOptional({ enum: VideoSessionStatus, description: 'Session status' })
  @IsOptional()
  @IsEnum(VideoSessionStatus)
  status?: VideoSessionStatus;
}

export class JoinVideoSessionDto {
  @ApiProperty({ description: 'Participant user ID' })
  @IsString()
  userId: string;

  @ApiProperty({ description: 'Participant display name' })
  @IsString()
  displayName: string;
}

export class UpdateParticipantsDto {
  @ApiProperty({ description: 'Array of participant objects', type: [Object] })
  @IsArray()
  participants: Array<{
    userId: string;
    displayName: string;
    joinedAt: string;
    leftAt?: string;
  }>;
}
