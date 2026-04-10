import { IsString, IsOptional, IsInt, Min, Max, IsBoolean, IsArray, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ActivityType {
  LESSON_COMPLETED = 'lesson_completed',
  EXERCISE_COMPLETED = 'exercise_completed',
  VOCABULARY_LEARNED = 'vocabulary_learned',
  STREAK_MAINTAINED = 'streak_maintained',
  ACHIEVEMENT_UNLOCKED = 'achievement_unlocked'
}

export class UpdateProgressDto {
  @ApiProperty({ 
    description: 'Type of progress activity',
    enum: ActivityType,
    example: ActivityType.LESSON_COMPLETED
  })
  @IsEnum(ActivityType)
  activity_type: ActivityType;

  @ApiProperty({ description: 'Language code', example: 'es' })
  @IsString()
  language_code: string;

  @ApiPropertyOptional({ description: 'Lesson ID (if applicable)' })
  @IsOptional()
  @IsString()
  lesson_id?: string;

  @ApiPropertyOptional({ description: 'Exercise ID (if applicable)' })
  @IsOptional()
  @IsString()
  exercise_id?: string;

  @ApiPropertyOptional({ description: 'Vocabulary ID (if applicable)' })
  @IsOptional()
  @IsString()
  vocabulary_id?: string;

  @ApiPropertyOptional({ description: 'Points earned', example: 25 })
  @IsOptional()
  @IsInt()
  @Min(0)
  points_earned?: number;

  @ApiPropertyOptional({ description: 'Accuracy percentage (0-100)', example: 85 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  accuracy?: number;

  @ApiPropertyOptional({ description: 'Time spent in minutes', example: 15 })
  @IsOptional()
  @IsInt()
  @Min(1)
  time_spent?: number;

  @ApiPropertyOptional({ description: 'Whether activity was completed successfully', example: true })
  @IsOptional()
  @IsBoolean()
  completed?: boolean;

  @ApiPropertyOptional({ description: 'Mistakes made during activity', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mistakes?: string[];

  @ApiPropertyOptional({ description: 'Additional progress data' })
  @IsOptional()
  metadata?: Record<string, any>;
}