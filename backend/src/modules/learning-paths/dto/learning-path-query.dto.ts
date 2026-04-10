import { IsOptional, IsString, IsNumber, IsArray, IsEnum, IsBoolean, Min, Max } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class LearningPathQueryDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Sort by field', default: 'created_at' })
  @IsOptional()
  @IsString()
  sort_by?: string = 'created_at';

  @ApiPropertyOptional({ 
    description: 'Sort order',
    enum: ['asc', 'desc'],
    default: 'desc'
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sort_order?: string = 'desc';

  @ApiPropertyOptional({ description: 'Search in title and description' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by category' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ 
    description: 'Filter by difficulty level',
    enum: ['beginner', 'intermediate', 'advanced']
  })
  @IsOptional()
  @IsEnum(['beginner', 'intermediate', 'advanced'])
  level?: string;

  @ApiPropertyOptional({ description: 'Filter by creator ID' })
  @IsOptional()
  @IsString()
  creator_id?: string;

  @ApiPropertyOptional({ 
    description: 'Filter by status',
    enum: ['draft', 'published', 'archived']
  })
  @IsOptional()
  @IsEnum(['draft', 'published', 'archived'])
  status?: string;

  @ApiPropertyOptional({ description: 'Show only featured paths' })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  is_featured?: boolean;

  @ApiPropertyOptional({ description: 'Show only public paths' })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  is_public?: boolean;

  @ApiPropertyOptional({ description: 'Minimum duration in weeks' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  min_duration?: number;

  @ApiPropertyOptional({ description: 'Maximum duration in weeks' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  max_duration?: number;

  @ApiPropertyOptional({ description: 'Minimum rating' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(5)
  min_rating?: number;
}