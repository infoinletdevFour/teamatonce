import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType, NotificationPriority } from '../notifications/dto';
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
  PostStatus,
} from './dto';

@Injectable()
export class BlogService {
  constructor(
    private readonly db: DatabaseService,
    @Inject(forwardRef(() => NotificationsService))
    private readonly notificationsService: NotificationsService,
  ) {}

  // =============================================
  // BLOG POSTS OPERATIONS
  // =============================================

  async createPost(userId: string, createBlogPostDto: CreateBlogPostDto): Promise<BlogPostResponseDto> {
    try {
      // Extract only fields that exist in the database schema
      const postData = {
        user_id: userId,
        title: createBlogPostDto.title,
        content: createBlogPostDto.content,
        excerpt: createBlogPostDto.excerpt || null,
        status: createBlogPostDto.status || 'draft',
        category: createBlogPostDto.category || null,
        tags: createBlogPostDto.tags || [],
        image_url: createBlogPostDto.image_url || createBlogPostDto.featured_image || null,
        featured: createBlogPostDto.featured || false,
        author: createBlogPostDto.author || null,
        rating: createBlogPostDto.rating || null,
        views_count: 0,
        likes_count: 0,
        comments_count: 0,
        published_at: createBlogPostDto.status === 'published' ? new Date().toISOString() : null,
      };
      // Note: metadata and meta_description are not in the database schema

      console.log('Creating blog post with data:', postData);
      const result = await this.db.insert('blog_posts', postData);
      console.log('Blog post created successfully:', result);
      
      // Fetch the complete post data after creation
      const createdPost = await this.db.findOne('blog_posts', { id: result.id });
      console.log('Fetched created post:', createdPost);
      
      return this.formatBlogPost(createdPost, userId);
    } catch (error) {
      console.error('Error creating blog post:', error);
      throw new BadRequestException(`Failed to create blog post: ${error.message}`);
    }
  }

  async getPosts(userId: string, query: BlogQueryDto): Promise<PaginatedBlogPostsDto> {
    try {
      const { page = 1, limit = 10, sort_by = 'created_at', sort_order = 'desc', ...filters } = query;
      const offset = (page - 1) * limit;

      // Build where conditions
      const whereConditions: any = {};

      // For public endpoints, only show published posts unless it's the author
      if (filters.status) {
        whereConditions.status = filters.status;
      } else if (!filters.author_id || filters.author_id !== userId) {
        whereConditions.status = PostStatus.PUBLISHED;
      }

      if (filters.category) {
        whereConditions.category = filters.category;
      }

      if (filters.author_id) {
        whereConditions.user_id = filters.author_id;
      }

      if (filters.search) {
        whereConditions.$or = [
          { title: { $ilike: `%${filters.search}%` } },
          { content: { $ilike: `%${filters.search}%` } },
          { excerpt: { $ilike: `%${filters.search}%` } },
        ];
      }

      if (filters.tags && filters.tags.length > 0) {
        whereConditions.tags = { $overlap: filters.tags };
      }

      if (filters.start_date || filters.end_date) {
        whereConditions.created_at = {};
        if (filters.start_date) {
          whereConditions.created_at.$gte = new Date(filters.start_date);
        }
        if (filters.end_date) {
          whereConditions.created_at.$lte = new Date(filters.end_date + 'T23:59:59.999Z');
        }
      }

      // Get posts with pagination
      const posts = await this.db.select('blog_posts', {
        where: whereConditions,
        orderBy: sort_by,
        order: sort_order,
        limit,
        offset,
      });

      // Get total count
      const allRecords = await this.db.findMany('blog_posts', whereConditions);
      const totalCount = allRecords.length;

      return {
        data: await Promise.all(posts.map(post => this.formatBlogPost(post, userId))),
        total: totalCount,
        page,
        limit,
        total_pages: Math.ceil(totalCount / limit),
      };
    } catch (error) {
      throw new BadRequestException(`Failed to fetch blog posts: ${error.message}`);
    }
  }

  async getPostById(userId: string, postId: string): Promise<BlogPostResponseDto> {
    try {
      const post = await this.db.findOne('blog_posts', { id: postId });

      if (!post) {
        throw new NotFoundException('Blog post not found');
      }

      // Check if user can access this post
      if (post.status !== PostStatus.PUBLISHED && post.user_id !== userId) {
        throw new ForbiddenException('Access denied to this post');
      }

      return this.formatBlogPost(post, userId);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new BadRequestException(`Failed to fetch blog post: ${error.message}`);
    }
  }

  async updatePost(userId: string, postId: string, updateBlogPostDto: UpdateBlogPostDto): Promise<BlogPostResponseDto> {
    try {
      console.log('Update blog post request:', { userId, postId, updateBlogPostDto });
      
      // First check if post exists and belongs to user
      const existingPost = await this.db.findOne('blog_posts', {
        id: postId,
        user_id: userId,
      });

      if (!existingPost) {
        throw new NotFoundException('Blog post not found or access denied');
      }

      const updateData: any = { ...updateBlogPostDto };
      delete updateData.user_id; // Prevent user_id modification
      
      // Handle backward compatibility for featured_image
      if (updateData.featured_image && !updateData.image_url) {
        updateData.image_url = updateData.featured_image;
      }
      delete updateData.featured_image; // Remove deprecated field
      
      // Remove fields that don't exist in the database schema
      delete updateData.metadata;
      delete updateData.meta_description;

      console.log('Update data after processing:', updateData);

      const updatedPost = await this.db.update('blog_posts', postId, updateData);
      
      // Fetch the complete post data after update
      const completePost = await this.db.findOne('blog_posts', { id: postId });
      console.log('Fetched updated post:', completePost);
      
      return this.formatBlogPost(completePost, userId);
    } catch (error) {
      console.error('Error updating blog post:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to update blog post: ${error.message}`);
    }
  }

  async deletePost(userId: string, postId: string): Promise<void> {
    try {
      // First check if post exists and belongs to user
      const existingPost = await this.db.findOne('blog_posts', {
        id: postId,
        user_id: userId,
      });

      if (!existingPost) {
        throw new NotFoundException('Blog post not found or access denied');
      }

      // Delete associated comments first
      const comments = await this.db.findMany('blog_comments', { post_id: postId });
      for (const comment of comments) {
        await this.db.delete('blog_comments', comment.id);
      }

      // Delete associated likes
      const likes = await this.db.findMany('blog_likes', { post_id: postId });
      for (const like of likes) {
        await this.db.delete('blog_likes', like.id);
      }

      await this.db.delete('blog_posts', postId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to delete blog post: ${error.message}`);
    }
  }

  // =============================================
  // LIKES OPERATIONS
  // =============================================

  async togglePostLike(userId: string, postId: string): Promise<LikeResponseDto> {
    try {
      // Check if post exists
      const post = await this.db.findOne('blog_posts', { id: postId });
      if (!post) {
        throw new NotFoundException('Blog post not found');
      }

      // Check if like already exists
      const existingLike = await this.db.findOne('blog_likes', {
        user_id: userId,
        post_id: postId,
        comment_id: null,
      });

      let isLiked: boolean;
      let currentLikesCount = parseInt(post.likes_count) || 0;

      if (existingLike) {
        // Unlike - remove like
        await this.db.delete('blog_likes', existingLike.id);
        currentLikesCount = Math.max(0, currentLikesCount - 1);
        isLiked = false;
      } else {
        // Like - add like
        await this.db.insert('blog_likes', {
          user_id: userId,
          post_id: postId,
          comment_id: null,
        });
        currentLikesCount += 1;
        isLiked = true;
      }

      // Update post likes count
      await this.db.update('blog_posts', postId, {
        likes_count: currentLikesCount,
      });

      return {
        is_liked: isLiked,
        likes_count: currentLikesCount,
        message: isLiked ? 'Post liked successfully' : 'Post unliked successfully',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to toggle post like: ${error.message}`);
    }
  }

  async ratePost(userId: string, postId: string, rating: number): Promise<any> {
    try {
      // Validate rating
      if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
        throw new BadRequestException('Rating must be an integer between 1 and 5');
      }

      // Check if post exists
      const post = await this.db.findOne('blog_posts', { id: postId });
      if (!post) {
        throw new NotFoundException('Post not found');
      }

      // Check if user has already rated this post
      const existingRating = await this.db.findOne('blog_ratings', {
        user_id: userId,
        post_id: postId,
      });

      if (existingRating) {
        // Update existing rating
        await this.db.update('blog_ratings', existingRating.id, {
          rating: rating,
          updated_at: new Date().toISOString(),
        });
      } else {
        // Create new rating
        await this.db.insert('blog_ratings', {
          user_id: userId,
          post_id: postId,
          rating: rating,
        });
      }

      // Calculate new average rating
      const allRatings = await this.db.findMany('blog_ratings', { post_id: postId });
      const totalRatings = allRatings.length;
      const sumRatings = allRatings.reduce((sum, r) => sum + r.rating, 0);
      const averageRating = totalRatings > 0 ? parseFloat((sumRatings / totalRatings).toFixed(2)) : 0;

      // Update post with new average rating
      await this.db.update('blog_posts', postId, {
        rating: averageRating,
        updated_at: new Date().toISOString(),
      });

      return {
        success: true,
        message: existingRating ? 'Rating updated successfully' : 'Rating submitted successfully',
        rating: {
          userRating: rating,
          averageRating: averageRating,
          totalRatings: totalRatings,
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Failed to rate post: ${error.message}`);
    }
  }

  async toggleCommentLike(userId: string, commentId: string): Promise<LikeResponseDto> {
    try {
      // Check if comment exists
      const comment = await this.db.findOne('blog_comments', { id: commentId });
      if (!comment) {
        throw new NotFoundException('Comment not found');
      }

      // Check if like already exists
      const existingLike = await this.db.findOne('blog_likes', {
        user_id: userId,
        comment_id: commentId,
        post_id: null,
      });

      let isLiked: boolean;
      let currentLikesCount = parseInt(comment.likes_count) || 0;

      if (existingLike) {
        // Unlike - remove like
        await this.db.delete('blog_likes', existingLike.id);
        currentLikesCount = Math.max(0, currentLikesCount - 1);
        isLiked = false;
      } else {
        // Like - add like
        await this.db.insert('blog_likes', {
          user_id: userId,
          comment_id: commentId,
          post_id: null,
        });
        currentLikesCount += 1;
        isLiked = true;
      }

      // Update comment likes count
      await this.db.update('blog_comments', commentId, {
        likes_count: currentLikesCount,
      });

      return {
        is_liked: isLiked,
        likes_count: currentLikesCount,
        message: isLiked ? 'Comment liked successfully' : 'Comment unliked successfully',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to toggle comment like: ${error.message}`);
    }
  }

  // =============================================
  // COMMENTS OPERATIONS
  // =============================================

  async getComments(userId: string, postId: string, page: number = 1, limit: number = 20): Promise<PaginatedCommentsDto> {
    try {
      // Check if post exists
      const post = await this.db.findOne('blog_posts', { id: postId });
      if (!post) {
        throw new NotFoundException('Blog post not found');
      }

      const offset = (page - 1) * limit;

      const whereConditions = {
        post_id: postId,
        parent_comment_id: null, // Only get top-level comments
      };

      const comments = await this.db.select('blog_comments', {
        where: whereConditions,
        orderBy: 'created_at',
        order: 'desc',
        limit,
        offset,
      });

      const allRecords = await this.db.findMany('blog_comments', whereConditions);
      const totalCount = allRecords.length;

      // Format comments and get replies
      const formattedComments = await Promise.all(
        comments.map(comment => this.formatComment(comment, userId))
      );

      return {
        data: formattedComments,
        total: totalCount,
        page,
        limit,
        total_pages: Math.ceil(totalCount / limit),
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to fetch comments: ${error.message}`);
    }
  }

  async createComment(userId: string, postId: string, createCommentDto: CreateCommentDto): Promise<CommentResponseDto> {
    try {
      // Check if post exists
      const post = await this.db.findOne('blog_posts', { id: postId });
      if (!post) {
        throw new NotFoundException('Blog post not found');
      }

      // If this is a reply, check if parent comment exists
      if (createCommentDto.parent_comment_id) {
        const parentComment = await this.db.findOne('blog_comments', {
          id: createCommentDto.parent_comment_id,
          post_id: postId,
        });
        if (!parentComment) {
          throw new NotFoundException('Parent comment not found');
        }
      }

      const commentData = {
        user_id: userId,
        post_id: postId,
        content: createCommentDto.content,
        parent_comment_id: createCommentDto.parent_comment_id || null,
        likes_count: 0,
        metadata: createCommentDto.metadata || {},
      };

      const result = await this.db.insert('blog_comments', commentData);

      // Update post comments count
      const currentCommentsCount = parseInt(post.comments_count) || 0;
      await this.db.update('blog_posts', postId, {
        comments_count: currentCommentsCount + 1,
      });

      return this.formatComment(result, userId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to create comment: ${error.message}`);
    }
  }

  // =============================================
  // CATEGORIES OPERATIONS
  // =============================================

  async getCategories(): Promise<CategoryResponseDto[]> {
    try {
      // For now, return a static list. In a real app, you might have a categories table
      const categories = await this.db.findMany('blog_categories', {});

      if (categories.length === 0) {
        // Return default categories if none exist
        return this.getDefaultCategories();
      }

      return categories.map(category => ({
        name: category.name,
        description: category.description,
        post_count: category.post_count || 0,
        created_at: category.created_at,
      }));
    } catch (error) {
      // If table doesn't exist, return default categories
      return this.getDefaultCategories();
    }
  }

  async createCategory(userId: string, createCategoryDto: CreateCategoryDto): Promise<CategoryResponseDto> {
    try {
      // In a real app, you'd check if user is admin
      // For now, allowing all authenticated users to create categories

      const categoryData = {
        name: createCategoryDto.name,
        description: createCategoryDto.description || null,
        post_count: 0,
        created_by: userId,
        metadata: createCategoryDto.metadata || {},
      };

      const result = await this.db.insert('blog_categories', categoryData);

      return {
        name: result.name,
        description: result.description,
        post_count: 0,
        created_at: result.created_at,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to create category: ${error.message}`);
    }
  }

  // =============================================
  // IMAGE UPLOAD OPERATIONS
  // =============================================

  async uploadImage(userId: string, file: Express.Multer.File): Promise<ImageUploadResponseDto> {
    try {
      // Generate unique file name
      const fileName = `${userId}/${Date.now()}-${file.originalname}`;
      
      // Upload file to storage service
      const uploadResult = await /* TODO: use StorageService */ this.db.uploadFile(
        'blog-images', // Bucket name for blog images
        file.buffer,
        fileName,
        {
          contentType: file.mimetype,
          metadata: {
            userId,
            originalName: file.originalname,
          },
        }
      );

      // The SDK returns a StorageFile object with a url property
      console.log('Blog image uploaded successfully');
      console.log('Upload result:', uploadResult);
      
      const publicUrl = uploadResult.url;
      
      if (!publicUrl) {
        throw new Error('No URL returned from storage upload');
      }

      console.log('Public URL:', publicUrl);

      return {
        url: publicUrl,
        message: 'Image uploaded successfully',
      };
    } catch (error) {
      console.error('Blog image upload error:', error);
      throw new BadRequestException(`Failed to upload image: ${error.message}`);
    }
  }

  // =============================================
  // UTILITY OPERATIONS
  // =============================================

  async getPopularTags(): Promise<{ name: string; count: number }[]> {
    try {
      // Get all published posts
      const posts = await this.db.findMany('blog_posts', {
        status: PostStatus.PUBLISHED,
      });

      // Count tag occurrences
      const tagCounts: { [key: string]: number } = {};
      posts.forEach(post => {
        if (post.tags && Array.isArray(post.tags)) {
          post.tags.forEach((tag: string) => {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
          });
        }
      });

      // Convert to array and sort by count
      return Object.entries(tagCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20); // Return top 20 tags
    } catch (error) {
      throw new BadRequestException(`Failed to fetch popular tags: ${error.message}`);
    }
  }

  async getBlogStats(): Promise<{
    total_posts: number;
    published_posts: number;
    total_comments: number;
    total_likes: number;
    categories_count: number;
  }> {
    try {
      const [allPosts, publishedPosts, comments, likes, categories] = await Promise.all([
        this.db.findMany('blog_posts', {}),
        this.db.findMany('blog_posts', { status: PostStatus.PUBLISHED }),
        this.db.findMany('blog_comments', {}),
        this.db.findMany('blog_likes', {}),
        this.getCategories(),
      ]);

      return {
        total_posts: allPosts.length,
        published_posts: publishedPosts.length,
        total_comments: comments.length,
        total_likes: likes.length,
        categories_count: categories.length,
      };
    } catch (error) {
      throw new BadRequestException(`Failed to fetch blog statistics: ${error.message}`);
    }
  }

  // =============================================
  // HELPER METHODS
  // =============================================

  private async formatBlogPost(post: any, userId: string): Promise<BlogPostResponseDto> {
    console.log('Formatting blog post:', post);
    
    // Check if current user liked this post
    let isLiked = false;
    try {
      const like = await this.db.findOne('blog_likes', {
        user_id: userId,
        post_id: post.id,
        comment_id: null,
      });
      isLiked = !!like;
    } catch (error) {
      // Ignore errors when checking likes
    }

    const formatted = {
      id: post.id,
      user_id: post.user_id,
      title: post.title,
      content: post.content,
      excerpt: post.excerpt,
      status: post.status,
      category: post.category,
      tags: post.tags || [],
      image_url: post.image_url,
      meta_description: null, // Not in schema, setting to null
      views_count: parseInt(post.views_count) || 0,
      featured: post.featured || false,
      author: post.author,
      rating: post.rating ? parseFloat(post.rating) : null,
      likes_count: parseInt(post.likes_count) || 0,
      comments_count: parseInt(post.comments_count) || 0,
      is_liked: isLiked,
      published_at: post.published_at,
      metadata: {}, // Not in schema, return empty object
      created_at: post.created_at,
      updated_at: post.updated_at,
    };
    
    console.log('Formatted blog post:', formatted);
    return formatted;
  }

  private async formatComment(comment: any, userId: string): Promise<CommentResponseDto> {
    // Check if current user liked this comment
    let isLiked = false;
    try {
      const like = await this.db.findOne('blog_likes', {
        user_id: userId,
        comment_id: comment.id,
        post_id: null,
      });
      isLiked = !!like;
    } catch (error) {
      // Ignore errors when checking likes
    }

    // Get replies if this is a top-level comment
    let replies: CommentResponseDto[] = [];
    if (!comment.parent_comment_id) {
      try {
        const replyComments = await this.db.findMany('blog_comments', {
          parent_comment_id: comment.id,
        });
        replies = await Promise.all(
          replyComments.map(reply => this.formatComment(reply, userId))
        );
      } catch (error) {
        // Ignore errors when fetching replies
      }
    }

    return {
      id: comment.id,
      post_id: comment.post_id,
      user_id: comment.user_id,
      content: comment.content,
      parent_comment_id: comment.parent_comment_id,
      likes_count: parseInt(comment.likes_count) || 0,
      is_liked: isLiked,
      replies: replies,
      metadata: comment.metadata || {},
      created_at: comment.created_at,
      updated_at: comment.updated_at,
    };
  }

  private getDefaultCategories(): CategoryResponseDto[] {
    return [
      {
        name: 'Health & Wellness',
        description: 'Posts about health, fitness, and overall wellness',
        post_count: 0,
        created_at: new Date().toISOString(),
      },
      {
        name: 'Technology',
        description: 'Technology news, tutorials, and insights',
        post_count: 0,
        created_at: new Date().toISOString(),
      },
      {
        name: 'Lifestyle',
        description: 'Lifestyle tips, productivity, and personal development',
        post_count: 0,
        created_at: new Date().toISOString(),
      },
      {
        name: 'Travel',
        description: 'Travel experiences, guides, and tips',
        post_count: 0,
        created_at: new Date().toISOString(),
      },
      {
        name: 'Finance',
        description: 'Personal finance, investment, and money management',
        post_count: 0,
        created_at: new Date().toISOString(),
      },
    ];
  }
}