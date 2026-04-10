import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsEnum, IsNumber, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export enum SearchScope {
  ALL = 'all',
  PROJECTS = 'projects',
  MILESTONES = 'milestones',
  TASKS = 'tasks',
  DISCUSSIONS = 'discussions',
  FILES = 'files',
}

export class SearchQueryDto {
  @ApiProperty({
    description: 'Search query string',
    example: 'mobile app development',
    minLength: 2,
  })
  @IsString()
  query: string;

  @ApiPropertyOptional({
    description: 'Search scope - what to search in',
    enum: SearchScope,
    example: SearchScope.ALL,
  })
  @IsOptional()
  @IsEnum(SearchScope)
  scope?: SearchScope = SearchScope.ALL;

  @ApiPropertyOptional({
    description: 'Content types to include',
    example: ['projects', 'milestones', 'tasks'],
    isArray: true,
    enum: ['projects', 'milestones', 'tasks', 'discussions', 'files'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  types?: string[];

  @ApiPropertyOptional({
    description: 'Tags to filter by',
    example: ['web', 'mobile', 'frontend'],
    isArray: true,
  })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.split(',').map(tag => tag.trim()) : value
  )
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Category/Status filter',
    example: 'in_progress',
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    description: 'Project ID filter',
    example: 'project_123',
  })
  @IsOptional()
  @IsString()
  projectId?: string;

  @ApiPropertyOptional({
    description: 'Start date filter (ISO format)',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsString()
  dateFrom?: string;

  @ApiPropertyOptional({
    description: 'End date filter (ISO format)',
    example: '2024-12-31',
  })
  @IsOptional()
  @IsString()
  dateTo?: string;

  @ApiPropertyOptional({
    description: 'Page number',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    example: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Sort by field',
    example: 'relevance',
    enum: ['relevance', 'date', 'popularity'],
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'relevance';
}
