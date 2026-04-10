import { IsOptional, IsString, IsInt, Min, Max, IsEnum, IsArray, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { LanguageSkill, DifficultyLevel } from './create-lesson.dto';
import { ExerciseType } from './create-exercise.dto';

export class BaseQueryDto {
  @ApiPropertyOptional({ description: 'Page number', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ description: 'Sort field', example: 'created_at' })
  @IsOptional()
  @IsString()
  sort_by?: string;

  @ApiPropertyOptional({ description: 'Sort order', enum: ['asc', 'desc'], example: 'desc' })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sort_order?: 'asc' | 'desc';
}

export class LessonQueryDto extends BaseQueryDto {
  @ApiPropertyOptional({ description: 'Language code filter', example: 'es' })
  @IsOptional()
  @IsString()
  language_code?: string;

  @ApiPropertyOptional({ description: 'Source language filter', example: 'en' })
  @IsOptional()
  @IsString()
  source_language?: string;

  @ApiPropertyOptional({ description: 'Skill filter', enum: LanguageSkill })
  @IsOptional()
  @IsEnum(LanguageSkill)
  skill?: LanguageSkill;

  @ApiPropertyOptional({ description: 'Difficulty filter', enum: DifficultyLevel })
  @IsOptional()
  @IsEnum(DifficultyLevel)
  difficulty?: DifficultyLevel;

  @ApiPropertyOptional({ description: 'Start date filter', example: '2024-01-01' })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional({ description: 'End date filter', example: '2024-12-31' })
  @IsOptional()
  @IsDateString()
  end_date?: string;

  @ApiPropertyOptional({ description: 'Published status filter', example: true })
  @IsOptional()
  @Type(() => Boolean)
  is_published?: boolean;

  @ApiPropertyOptional({ description: 'Search in title/description' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Tags filter', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

export class ExerciseQueryDto extends BaseQueryDto {
  @ApiPropertyOptional({ description: 'Language code filter', example: 'es' })
  @IsOptional()
  @IsString()
  language_code?: string;

  @ApiPropertyOptional({ description: 'Exercise type filter', enum: ExerciseType })
  @IsOptional()
  @IsEnum(ExerciseType)
  type?: ExerciseType;

  @ApiPropertyOptional({ description: 'Lesson ID filter' })
  @IsOptional()
  @IsString()
  lesson_id?: string;

  @ApiPropertyOptional({ description: 'Search in question text' })
  @IsOptional()
  @IsString()
  search?: string;
}

export class VocabularyQueryDto extends BaseQueryDto {
  @ApiPropertyOptional({ description: 'Language code filter', example: 'es' })
  @IsOptional()
  @IsString()
  language_code?: string;

  @ApiPropertyOptional({ description: 'Search in word/translation' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Category filter', example: 'greetings' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Difficulty level filter (1-10)', example: 3 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  difficulty_level?: number;
}

export class ProgressQueryDto extends BaseQueryDto {
  @ApiPropertyOptional({ description: 'Language code filter', example: 'es' })
  @IsOptional()
  @IsString()
  language_code?: string;

  @ApiPropertyOptional({ description: 'Start date filter', example: '2024-01-01' })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional({ description: 'End date filter', example: '2024-12-31' })
  @IsOptional()
  @IsDateString()
  end_date?: string;

  @ApiPropertyOptional({ description: 'Activity type filter', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  activity_types?: string[];
}

export class LeaderboardQueryDto extends BaseQueryDto {
  @ApiPropertyOptional({ description: 'Language code filter', example: 'es' })
  @IsOptional()
  @IsString()
  language_code?: string;

  @ApiPropertyOptional({ description: 'Time period', enum: ['daily', 'weekly', 'monthly', 'all_time'], example: 'weekly' })
  @IsOptional()
  @IsEnum(['daily', 'weekly', 'monthly', 'all_time'])
  period?: 'daily' | 'weekly' | 'monthly' | 'all_time';
}