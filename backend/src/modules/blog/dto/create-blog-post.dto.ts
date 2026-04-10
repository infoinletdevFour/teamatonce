import { IsString, IsOptional, IsArray, IsEnum, MinLength, MaxLength, IsBoolean, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum PostStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived'
}

export class CreateBlogPostDto {
  @ApiProperty({ description: 'Blog post title', example: 'My Journey to Better Health' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title: string;

  @ApiProperty({ description: 'Blog post content (markdown supported)', example: 'This is my story about improving my health...' })
  @IsString()
  @MinLength(1)
  content: string;

  @ApiPropertyOptional({ description: 'Short excerpt or summary', example: 'A brief overview of my health journey' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  excerpt?: string;

  @ApiProperty({ 
    description: 'Post status',
    enum: PostStatus,
    example: PostStatus.PUBLISHED
  })
  @IsEnum(PostStatus)
  status: PostStatus;

  @ApiPropertyOptional({ description: 'Blog post category', example: 'health' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ 
    description: 'Tags for the blog post', 
    type: [String],
    example: ['health', 'fitness', 'lifestyle'] 
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Featured image URL', example: 'https://example.com/image.jpg' })
  @IsOptional()
  @IsString()
  image_url?: string;

  @ApiPropertyOptional({ description: 'Featured image URL (deprecated, use image_url)', example: 'https://example.com/image.jpg' })
  @IsOptional()
  @IsString()
  featured_image?: string;

  @ApiPropertyOptional({ description: 'Meta description for SEO', example: 'Learn about my health journey and tips for better living' })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  meta_description?: string;

  @ApiPropertyOptional({ description: 'Whether the post is featured', example: true })
  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @ApiPropertyOptional({ description: 'Post author name', example: 'John Doe' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  author?: string;

  @ApiPropertyOptional({ description: 'Post rating (1-5)', example: 4.5 })
  @IsOptional()
  @IsNumber()
  rating?: number;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  metadata?: Record<string, any>;
}