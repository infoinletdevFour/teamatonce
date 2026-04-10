import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsArray, IsNumber, Min, Max, IsBoolean } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { StudyGroupVisibility, StudyGroupCategory } from './create-study-group.dto';

export class StudyGroupQueryDto {
  @ApiPropertyOptional({
    description: 'Search term for group name or description',
    example: 'react',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by category',
    enum: StudyGroupCategory,
  })
  @IsOptional()
  @IsEnum(StudyGroupCategory)
  category?: StudyGroupCategory;

  @ApiPropertyOptional({
    description: 'Filter by visibility',
    enum: StudyGroupVisibility,
  })
  @IsOptional()
  @IsEnum(StudyGroupVisibility)
  visibility?: StudyGroupVisibility;

  @ApiPropertyOptional({
    description: 'Filter by tags (comma-separated)',
    example: 'react,javascript,frontend',
  })
  @IsOptional()
  @Transform(({ value }) => 
    typeof value === 'string' ? value.split(',').map(tag => tag.trim()) : value
  )
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Filter by course ID',
    example: 'course_123',
  })
  @IsOptional()
  @IsString()
  courseId?: string;

  @ApiPropertyOptional({
    description: 'Show only groups with available spots',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  hasAvailableSpots?: boolean;

  @ApiPropertyOptional({
    description: 'Show only groups user is member of',
    example: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  myGroups?: boolean;

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
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
    description: 'Sort field',
    example: 'createdAt',
    enum: ['createdAt', 'name', 'memberCount', 'updatedAt'],
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({
    description: 'Sort order',
    example: 'desc',
    enum: ['asc', 'desc'],
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}