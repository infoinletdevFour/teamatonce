import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CourseEnrollmentDto {
  @ApiPropertyOptional({ description: 'Enrollment note or reason' })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({ description: 'Additional enrollment metadata' })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class CourseProgressDto {
  @ApiPropertyOptional({ description: 'Current lesson ID' })
  @IsOptional()
  @IsString()
  current_lesson_id?: string;

  @ApiPropertyOptional({ description: 'Current chapter ID' })
  @IsOptional()
  @IsString()
  current_chapter_id?: string;

  @ApiPropertyOptional({ description: 'Additional progress metadata' })
  @IsOptional()
  metadata?: Record<string, any>;
}