import { IsOptional, IsString, IsEnum, IsArray, IsInt, Min, IsDateString } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PostStatus } from './create-blog-post.dto';

export class BlogQueryDto {
  @ApiPropertyOptional({ description: 'Page number for pagination', example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Number of posts per page', example: 10, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Search term for posts', example: 'health tips' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by category', example: 'health' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ 
    description: 'Filter by post status',
    enum: PostStatus,
    example: PostStatus.PUBLISHED
  })
  @IsOptional()
  @IsEnum(PostStatus)
  status?: PostStatus;

  @ApiPropertyOptional({ 
    description: 'Filter by tags (comma-separated)', 
    example: 'health,fitness,lifestyle',
    type: String
  })
  @IsOptional()
  @Transform(({ value }) => typeof value === 'string' ? value.split(',').map(tag => tag.trim()) : value)
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Filter by author ID' })
  @IsOptional()
  @IsString()
  author_id?: string;

  @ApiPropertyOptional({ description: 'Start date for filtering posts', example: '2024-01-01' })
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @ApiPropertyOptional({ description: 'End date for filtering posts', example: '2024-12-31' })
  @IsOptional()
  @IsDateString()
  end_date?: string;

  @ApiPropertyOptional({ 
    description: 'Sort field',
    example: 'created_at',
    default: 'created_at',
    enum: ['created_at', 'updated_at', 'title', 'likes_count', 'comments_count']
  })
  @IsOptional()
  @IsString()
  sort_by?: string = 'created_at';

  @ApiPropertyOptional({ 
    description: 'Sort order',
    example: 'desc',
    default: 'desc',
    enum: ['asc', 'desc']
  })
  @IsOptional()
  @IsString()
  sort_order?: 'asc' | 'desc' = 'desc';
}