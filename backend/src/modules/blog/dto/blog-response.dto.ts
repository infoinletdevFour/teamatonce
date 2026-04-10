import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PostStatus } from './create-blog-post.dto';

export class BlogPostResponseDto {
  @ApiProperty({ description: 'Post ID' })
  id: string;

  @ApiProperty({ description: 'Author ID' })
  user_id: string;

  @ApiProperty({ description: 'Post title' })
  title: string;

  @ApiProperty({ description: 'Post content' })
  content: string;

  @ApiPropertyOptional({ description: 'Post excerpt' })
  excerpt?: string;

  @ApiProperty({ description: 'Post status', enum: PostStatus })
  status: PostStatus;

  @ApiPropertyOptional({ description: 'Post category' })
  category?: string;

  @ApiPropertyOptional({ description: 'Post tags', type: [String] })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Featured image URL' })
  image_url?: string;

  @ApiPropertyOptional({ description: 'Meta description' })
  meta_description?: string;

  @ApiProperty({ description: 'Number of likes' })
  likes_count: number;

  @ApiProperty({ description: 'Number of comments' })
  comments_count: number;

  @ApiPropertyOptional({ description: 'Number of views' })
  views_count?: number;

  @ApiPropertyOptional({ description: 'Whether post is featured' })
  featured?: boolean;

  @ApiPropertyOptional({ description: 'Post author name' })
  author?: string;

  @ApiPropertyOptional({ description: 'Post rating' })
  rating?: number;

  @ApiProperty({ description: 'Whether current user liked the post' })
  is_liked: boolean;

  @ApiPropertyOptional({ description: 'Publication date' })
  published_at?: string;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  metadata?: Record<string, any>;

  @ApiProperty({ description: 'Post creation date' })
  created_at: string;

  @ApiProperty({ description: 'Post update date' })
  updated_at: string;
}

export class CommentResponseDto {
  @ApiProperty({ description: 'Comment ID' })
  id: string;

  @ApiProperty({ description: 'Post ID' })
  post_id: string;

  @ApiProperty({ description: 'Author ID' })
  user_id: string;

  @ApiProperty({ description: 'Comment content' })
  content: string;

  @ApiPropertyOptional({ description: 'Parent comment ID' })
  parent_comment_id?: string;

  @ApiProperty({ description: 'Number of likes' })
  likes_count: number;

  @ApiProperty({ description: 'Whether current user liked the comment' })
  is_liked: boolean;

  @ApiPropertyOptional({ description: 'Nested replies', type: [CommentResponseDto] })
  replies?: CommentResponseDto[];

  @ApiPropertyOptional({ description: 'Additional metadata' })
  metadata?: Record<string, any>;

  @ApiProperty({ description: 'Comment creation date' })
  created_at: string;

  @ApiProperty({ description: 'Comment update date' })
  updated_at: string;
}

export class PaginatedBlogPostsDto {
  @ApiProperty({ description: 'Array of blog posts', type: [BlogPostResponseDto] })
  data: BlogPostResponseDto[];

  @ApiProperty({ description: 'Total number of posts' })
  total: number;

  @ApiProperty({ description: 'Current page number' })
  page: number;

  @ApiProperty({ description: 'Posts per page' })
  limit: number;

  @ApiProperty({ description: 'Total number of pages' })
  total_pages: number;
}

export class PaginatedCommentsDto {
  @ApiProperty({ description: 'Array of comments', type: [CommentResponseDto] })
  data: CommentResponseDto[];

  @ApiProperty({ description: 'Total number of comments' })
  total: number;

  @ApiProperty({ description: 'Current page number' })
  page: number;

  @ApiProperty({ description: 'Comments per page' })
  limit: number;

  @ApiProperty({ description: 'Total number of pages' })
  total_pages: number;
}

export class CategoryResponseDto {
  @ApiProperty({ description: 'Category name' })
  name: string;

  @ApiProperty({ description: 'Category description' })
  description?: string;

  @ApiProperty({ description: 'Number of posts in category' })
  post_count: number;

  @ApiProperty({ description: 'Category creation date' })
  created_at: string;
}

export class LikeResponseDto {
  @ApiProperty({ description: 'Whether the item is now liked' })
  is_liked: boolean;

  @ApiProperty({ description: 'Current total likes count' })
  likes_count: number;

  @ApiProperty({ description: 'Response message' })
  message: string;
}

export class ImageUploadResponseDto {
  @ApiProperty({ description: 'Uploaded image URL' })
  url: string;

  @ApiProperty({ description: 'Upload success message' })
  message: string;
}