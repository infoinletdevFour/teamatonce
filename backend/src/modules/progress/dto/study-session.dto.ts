import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEnum, IsNumber, IsObject, Min } from 'class-validator';

export enum SessionType {
  VIDEO = 'video',
  READING = 'reading',
  PRACTICE = 'practice',
  QUIZ = 'quiz',
  AI_TUTOR = 'ai_tutor',
  DISCUSSION = 'discussion',
  PROJECT = 'project'
}

export class StartStudySessionDto {
  @ApiProperty({ description: 'Course ID', required: false })
  @IsOptional()
  @IsString()
  courseId?: string;

  @ApiProperty({ description: 'Lesson ID', required: false })
  @IsOptional()
  @IsString()
  lessonId?: string;

  @ApiProperty({ enum: SessionType, description: 'Type of study session' })
  @IsEnum(SessionType)
  sessionType: SessionType;

  @ApiProperty({ description: 'Additional session metadata', required: false })
  @IsOptional()
  @IsObject()
  metadata?: any;

  @ApiProperty({ description: 'Device type used for session', required: false })
  @IsOptional()
  @IsString()
  deviceType?: string;
}

export class EndStudySessionDto {
  @ApiProperty({ description: 'Progress made during session (0-100)', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  progressMade?: number;

  @ApiProperty({ description: 'Engagement score (0-100)', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  engagementScore?: number;

  @ApiProperty({ description: 'Session notes', required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ description: 'Quality metrics', required: false })
  @IsOptional()
  @IsObject()
  qualityMetrics?: any;
}

export class StudySessionResponseDto {
  @ApiProperty({ description: 'Session ID' })
  id: string;

  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ description: 'Course ID', required: false })
  courseId?: string;

  @ApiProperty({ description: 'Lesson ID', required: false })
  lessonId?: string;

  @ApiProperty({ enum: SessionType, description: 'Session type' })
  sessionType: SessionType;

  @ApiProperty({ description: 'Session start time' })
  startedAt: Date;

  @ApiProperty({ description: 'Session end time', required: false })
  endedAt?: Date;

  @ApiProperty({ description: 'Duration in minutes', required: false })
  durationMinutes?: number;

  @ApiProperty({ description: 'Progress made', required: false })
  progressMade?: number;

  @ApiProperty({ description: 'Engagement score', required: false })
  engagementScore?: number;

  @ApiProperty({ description: 'Session notes', required: false })
  notes?: string;

  @ApiProperty({ description: 'Session metadata' })
  metadata: any;

  @ApiProperty({ description: 'Device type', required: false })
  deviceType?: string;

  @ApiProperty({ description: 'Quality metrics' })
  qualityMetrics: any;
}