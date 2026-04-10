import { IsString, IsOptional, IsArray, IsEnum, MinLength, MaxLength, IsBoolean, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PostStatus } from './create-blog-post.dto';

export class UpdateBlogPostDto {
  @ApiPropertyOptional({ description: 'Blog post title', example: 'My Updated Journey to Better Health' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ description: 'Blog post content (markdown supported)', example: 'This is my updated story about improving my health...' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  content?: string;

  @ApiPropertyOptional({ description: 'Short excerpt or summary', example: 'An updated brief overview of my health journey' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  excerpt?: string;

  @ApiPropertyOptional({ 
    description: 'Post status',
    enum: PostStatus,
    example: PostStatus.PUBLISHED
  })
  @IsOptional()
  @IsEnum(PostStatus)
  status?: PostStatus;

  @ApiPropertyOptional({ description: 'Blog post category', example: 'wellness' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ 
    description: 'Tags for the blog post', 
    type: [String],
    example: ['health', 'fitness', 'wellness', 'lifestyle'] 
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Featured image URL', example: 'https://example.com/updated-image.jpg' })
  @IsOptional()
  @IsString()
  image_url?: string;

  @ApiPropertyOptional({ description: 'Featured image URL (deprecated, use image_url)', example: 'https://example.com/updated-image.jpg' })
  @IsOptional()
  @IsString()
  featured_image?: string;

  @ApiPropertyOptional({ description: 'Meta description for SEO', example: 'Updated: Learn about my health journey and tips for better living' })
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