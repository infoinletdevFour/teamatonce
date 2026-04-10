import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  ParseFilePipe,
  FileTypeValidator,
  MaxFileSizeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BlogService } from './blog.service';
import {
  CreateBlogPostDto,
  UpdateBlogPostDto,
  CreateCommentDto,
  CreateCategoryDto,
  BlogQueryDto,
  BlogPostResponseDto,
  CommentResponseDto,
  PaginatedBlogPostsDto,
  PaginatedCommentsDto,
  CategoryResponseDto,
  LikeResponseDto,
  ImageUploadResponseDto,
} from './dto';

@ApiTags('Blog')
@Controller('blog')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  // =============================================
  // BLOG POSTS ENDPOINTS
  // =============================================

  @Get('posts')
  @ApiOperation({ summary: 'Get all blog posts with filtering and pagination' })
  @ApiResponse({
    status: 200,
    description: 'Posts retrieved successfully',
    type: PaginatedBlogPostsDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getPosts(
    @Request() req: any,
    @Query() query: BlogQueryDto
  ): Promise<PaginatedBlogPostsDto> {
    return this.blogService.getPosts(req.user.sub || req.user.sub || req.user.userId, query);
  }

  @Post('posts')
  @ApiOperation({ summary: 'Create a new blog post' })
  @ApiResponse({
    status: 201,
    description: 'Post created successfully',
    type: BlogPostResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createPost(
    @Request() req: any,
    @Body() createBlogPostDto: CreateBlogPostDto
  ): Promise<BlogPostResponseDto> {
    return this.blogService.createPost(req.user.sub || req.user.sub || req.user.userId, createBlogPostDto);
  }

  @Get('posts/:id')
  @ApiOperation({ summary: 'Get blog post by ID' })
  @ApiParam({ name: 'id', description: 'Post ID' })
  @ApiResponse({
    status: 200,
    description: 'Post retrieved successfully',
    type: BlogPostResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Post not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getPostById(
    @Request() req: any,
    @Param('id') id: string
  ): Promise<BlogPostResponseDto> {
    return this.blogService.getPostById(req.user.sub || req.user.sub || req.user.userId, id);
  }

  @Put('posts/:id')
  @ApiOperation({ summary: 'Update blog post by ID' })
  @ApiParam({ name: 'id', description: 'Post ID' })
  @ApiResponse({
    status: 200,
    description: 'Post updated successfully',
    type: BlogPostResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Post not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not your post' })
  async updatePost(
    @Request() req: any,
    @Param('id') id: string,
    @Body() updateBlogPostDto: UpdateBlogPostDto
  ): Promise<BlogPostResponseDto> {
    return this.blogService.updatePost(req.user.sub || req.user.sub || req.user.userId, id, updateBlogPostDto);
  }

  @Delete('posts/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete blog post by ID' })
  @ApiParam({ name: 'id', description: 'Post ID' })
  @ApiResponse({ status: 204, description: 'Post deleted successfully' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not your post' })
  async deletePost(
    @Request() req: any,
    @Param('id') id: string
  ): Promise<void> {
    return this.blogService.deletePost(req.user.sub || req.user.sub || req.user.userId, id);
  }

  // =============================================
  // LIKES ENDPOINTS
  // =============================================

  @Post('posts/:id/like')
  @ApiOperation({ summary: 'Toggle like on a blog post' })
  @ApiParam({ name: 'id', description: 'Post ID' })
  @ApiResponse({
    status: 200,
    description: 'Like toggled successfully',
    type: LikeResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Post not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async togglePostLike(
    @Request() req: any,
    @Param('id') id: string
  ): Promise<LikeResponseDto> {
    return this.blogService.togglePostLike(req.user.sub || req.user.sub || req.user.userId, id);
  }

  @Post('posts/:id/rate')
  @ApiOperation({ summary: 'Rate a blog post' })
  @ApiParam({ name: 'id', description: 'Post ID' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['rating'],
      properties: {
        rating: {
          type: 'number',
          minimum: 1,
          maximum: 5,
          description: 'Rating from 1 to 5 stars'
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Rating submitted successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        rating: {
          type: 'object',
          properties: {
            userRating: { type: 'number' },
            averageRating: { type: 'number' },
            totalRatings: { type: 'number' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Post not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Invalid rating value' })
  async ratePost(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { rating: number }
  ): Promise<any> {
    return this.blogService.ratePost(req.user.sub || req.user.sub || req.user.userId, id, body.rating);
  }

  // =============================================
  // COMMENTS ENDPOINTS
  // =============================================

  @Get('posts/:id/comments')
  @ApiOperation({ summary: 'Get comments for a blog post' })
  @ApiParam({ name: 'id', description: 'Post ID' })
  @ApiResponse({
    status: 200,
    description: 'Comments retrieved successfully',
    type: PaginatedCommentsDto,
  })
  @ApiResponse({ status: 404, description: 'Post not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getComments(
    @Request() req: any,
    @Param('id') postId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20
  ): Promise<PaginatedCommentsDto> {
    return this.blogService.getComments(req.user.sub || req.user.sub || req.user.userId, postId, page, limit);
  }

  @Post('posts/:id/comments')
  @ApiOperation({ summary: 'Add a comment to a blog post' })
  @ApiParam({ name: 'id', description: 'Post ID' })
  @ApiResponse({
    status: 201,
    description: 'Comment created successfully',
    type: CommentResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Post not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async createComment(
    @Request() req: any,
    @Param('id') postId: string,
    @Body() createCommentDto: CreateCommentDto
  ): Promise<CommentResponseDto> {
    return this.blogService.createComment(req.user.sub || req.user.sub || req.user.userId, postId, createCommentDto);
  }

  @Post('comments/:id/like')
  @ApiOperation({ summary: 'Toggle like on a comment' })
  @ApiParam({ name: 'id', description: 'Comment ID' })
  @ApiResponse({
    status: 200,
    description: 'Like toggled successfully',
    type: LikeResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async toggleCommentLike(
    @Request() req: any,
    @Param('id') id: string
  ): Promise<LikeResponseDto> {
    return this.blogService.toggleCommentLike(req.user.sub || req.user.sub || req.user.userId, id);
  }

  // =============================================
  // CATEGORIES ENDPOINTS
  // =============================================

  @Get('categories')
  @ApiOperation({ summary: 'Get all blog categories' })
  @ApiResponse({
    status: 200,
    description: 'Categories retrieved successfully',
    type: [CategoryResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCategories(): Promise<CategoryResponseDto[]> {
    return this.blogService.getCategories();
  }

  @Post('categories')
  @ApiOperation({ summary: 'Create a new blog category (admin only)' })
  @ApiResponse({
    status: 201,
    description: 'Category created successfully',
    type: CategoryResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  async createCategory(
    @Request() req: any,
    @Body() createCategoryDto: CreateCategoryDto
  ): Promise<CategoryResponseDto> {
    return this.blogService.createCategory(req.user.sub || req.user.sub || req.user.userId, createCategoryDto);
  }

  // =============================================
  // IMAGE UPLOAD ENDPOINTS
  // =============================================

  @Post('images/upload')
  @ApiOperation({ summary: 'Upload an image for blog posts' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Image uploaded successfully',
    type: ImageUploadResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid file' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multer.memoryStorage(), // Use memory storage for buffer access
      fileFilter: (req, file, cb) => {
        // Accept only image files
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
          return cb(new BadRequestException('Only image files are allowed'), false);
        }
        cb(null, true);
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
      },
    })
  )
  async uploadImage(
    @Request() req: any,
    @UploadedFile() file: Express.Multer.File
  ): Promise<ImageUploadResponseDto> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    return this.blogService.uploadImage(req.user.sub || req.user.sub || req.user.userId, file);
  }

  // =============================================
  // UTILITY ENDPOINTS
  // =============================================

  @Get('tags')
  @ApiOperation({ summary: 'Get popular tags' })
  @ApiResponse({
    status: 200,
    description: 'Tags retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          count: { type: 'number' }
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getPopularTags(): Promise<{ name: string; count: number }[]> {
    return this.blogService.getPopularTags();
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get blog statistics' })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        total_posts: { type: 'number' },
        published_posts: { type: 'number' },
        total_comments: { type: 'number' },
        total_likes: { type: 'number' },
        categories_count: { type: 'number' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getBlogStats(): Promise<{
    total_posts: number;
    published_posts: number;
    total_comments: number;
    total_likes: number;
    categories_count: number;
  }> {
    return this.blogService.getBlogStats();
  }
}