import { IsString, IsOptional, IsNumber, IsArray, IsEnum, IsBoolean, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLearningPathDto {
  @ApiProperty({ description: 'Learning path title' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Learning path description' })
  @IsString()
  description: string;

  @ApiPropertyOptional({ description: 'Thumbnail URL' })
  @IsOptional()
  @IsString()
  thumbnail_url?: string;

  @ApiProperty({ description: 'Learning path category' })
  @IsString()
  category: string;

  @ApiProperty({ 
    description: 'Difficulty level',
    enum: ['beginner', 'intermediate', 'advanced']
  })
  @IsEnum(['beginner', 'intermediate', 'advanced'])
  level: string;

  @ApiProperty({ description: 'Estimated duration in weeks' })
  @IsNumber()
  @Min(1)
  estimated_duration_weeks: number;

  @ApiPropertyOptional({ description: 'Skills taught in this path', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @ApiPropertyOptional({ description: 'Prerequisites', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  prerequisites?: string[];

  @ApiPropertyOptional({ description: 'Learning objectives', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  learning_objectives?: string[];

  @ApiPropertyOptional({ description: 'Make learning path public', default: true })
  @IsOptional()
  @IsBoolean()
  is_public?: boolean;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class AddCourseToPathDto {
  @ApiProperty({ description: 'Course ID to add' })
  @IsString()
  course_id: string;

  @ApiProperty({ description: 'Order index in the path' })
  @IsNumber()
  @Min(0)
  order_index: number;

  @ApiPropertyOptional({ description: 'Is this course required?', default: true })
  @IsOptional()
  @IsBoolean()
  is_required?: boolean;

  @ApiPropertyOptional({ description: 'Prerequisite course IDs', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  unlock_after?: string[];
}