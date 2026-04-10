import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsArray, IsNumber, Min, Max, IsBoolean } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { DiscussionType, DiscussionCategory } from './create-discussion.dto';

export class DiscussionQueryDto {
  @ApiPropertyOptional({
    description: 'Search term for discussion title or content',
    example: 'react optimization',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by discussion type',
    enum: DiscussionType,
  })
  @IsOptional()
  @IsEnum(DiscussionType)
  type?: DiscussionType;

  @ApiPropertyOptional({
    description: 'Filter by category',
    enum: DiscussionCategory,
  })
  @IsOptional()
  @IsEnum(DiscussionCategory)
  category?: DiscussionCategory;

  @ApiPropertyOptional({
    description: 'Filter by tags (comma-separated)',
    example: 'react,performance,optimization',
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
    example: 'course_react_advanced',
  })
  @IsOptional()
  @IsString()
  courseId?: string;

  @ApiPropertyOptional({
    description: 'Filter by study group ID',
    example: 'sg_123',
  })
  @IsOptional()
  @IsString()
  studyGroupId?: string;

  @ApiPropertyOptional({
    description: 'Filter by lesson ID',
    example: 'lesson_456',
  })
  @IsOptional()
  @IsString()
  lessonId?: string;

  @ApiPropertyOptional({
    description: 'Show only discussions by current user',
    example: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  myDiscussions?: boolean;

  @ApiPropertyOptional({
    description: 'Show only unanswered questions',
    example: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  unanswered?: boolean;

  @ApiPropertyOptional({
    description: 'Show only discussions with best answers',
    example: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  hasAnswer?: boolean;

  @ApiPropertyOptional({
    description: 'Show only pinned discussions',
    example: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  pinned?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by priority',
    enum: ['low', 'normal', 'high', 'urgent'],
  })
  @IsOptional()
  @IsString()
  priority?: string;

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
    enum: ['createdAt', 'updatedAt', 'title', 'votes', 'comments'],
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