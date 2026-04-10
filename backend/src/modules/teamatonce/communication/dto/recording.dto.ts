import { IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for starting a video recording
 */
export class StartRecordingDto {
  @ApiPropertyOptional({
    description: 'Record audio only (minimal video)',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  audio_only?: boolean;
}

/**
 * Recording status enum
 */
export enum RecordingStatus {
  RECORDING = 'recording',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

/**
 * Response interface for recording operations
 */
export interface RecordingResponse {
  id: string;
  video_session_id: string;
  project_id: string;
  database_recording_id: string;
  recording_url?: string;
  duration_seconds?: number;
  file_size_bytes?: number;
  status: RecordingStatus;
  started_at: string;
  completed_at?: string;
  started_by: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

/**
 * Response for stop recording operation
 */
export interface StopRecordingResponse {
  message: string;
  duration_seconds: number;
  status: RecordingStatus;
}
