import { Injectable, NotFoundException, ForbiddenException, BadRequestException, ConflictException, Inject, forwardRef } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType, NotificationPriority } from '../notifications/dto';
import {
  CreateDiscussionDto,
  CreateDiscussionCommentDto,
  DiscussionQueryDto,
  DiscussionResponseDto,
  CommentDto,
  PaginatedDiscussionsDto,
  VoteDiscussionDto,
  VoteCommentDto,
  DiscussionAuthorDto,
} from './dto';

@Injectable()
export class DiscussionsService {
  constructor(
    private readonly db: DatabaseService,
    @Inject(forwardRef(() => NotificationsService))
    private readonly notificationsService: NotificationsService,
  ) {}

  async createDiscussion(userId: string, createDiscussionDto: CreateDiscussionDto): Promise<DiscussionResponseDto> {
    try {
      const discussionId = `disc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const discussionData: DiscussionResponseDto = {
        id: discussionId,
        title: createDiscussionDto.title,
        content: createDiscussionDto.content,
        type: createDiscussionDto.type,
        category: createDiscussionDto.category,
        author: await this.getAuthorInfo(userId),
        tags: createDiscussionDto.tags || [],
        courseId: createDiscussionDto.courseId,
        studyGroupId: createDiscussionDto.studyGroupId,
        lessonId: createDiscussionDto.lessonId,
        upvotes: 0,
        downvotes: 0,
        score: 0,
        commentCount: 0,
        viewCount: 0,
        hasBestAnswer: false,
        isPinned: createDiscussionDto.isPinned || false,
        isLocked: false,
        priority: createDiscussionDto.priority || 'normal',
        attachments: createDiscussionDto.attachments || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
      };

      // Store discussion data using database
      // await this.db.storeData(`discussion_${discussionId}`, discussionData);

      return discussionData;
    } catch (error) {
      throw new BadRequestException('Failed to create discussion: ' + error.message);
    }
  }

  async getDiscussions(userId: string, query: DiscussionQueryDto): Promise<PaginatedDiscussionsDto> {
    try {
      // Mock implementation - in real app, this would query the database
      const mockDiscussions: DiscussionResponseDto[] = [
        {
          id: 'disc_1',
          title: 'How to optimize React component re-renders?',
          content: 'I am struggling with React component re-renders in my application...',
          type: 'question' as any,
          category: 'programming' as any,
          author: {
            id: 'user_123',
            username: 'react_dev',
            fullName: 'React Developer',
            avatar: 'https://example.com/avatar1.jpg',
            badge: 'React Expert',
            reputation: 1250,
          },
          tags: ['react', 'performance', 'optimization'],
          courseId: 'course_react_advanced',
          upvotes: 25,
          downvotes: 3,
          score: 22,
          userVote: userId !== 'guest' ? 'upvote' : undefined,
          commentCount: 12,
          viewCount: 156,
          hasBestAnswer: true,
          isPinned: false,
          isLocked: false,
          priority: 'normal',
          attachments: [],
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z',
          lastActivity: '2024-01-20T14:30:00Z',
        },
        {
          id: 'disc_2',
          title: 'Best practices for database indexing',
          content: 'What are the best practices when creating database indexes for performance?',
          type: 'question' as any,
          category: 'programming' as any,
          author: {
            id: 'user_456',
            username: 'db_expert',
            fullName: 'Database Expert',
            avatar: 'https://example.com/avatar2.jpg',
            badge: 'SQL Master',
            reputation: 2100,
          },
          tags: ['database', 'sql', 'performance', 'indexing'],
          upvotes: 18,
          downvotes: 1,
          score: 17,
          commentCount: 8,
          viewCount: 89,
          hasBestAnswer: false,
          isPinned: false,
          isLocked: false,
          priority: 'normal',
          attachments: [],
          createdAt: '2024-01-18T14:00:00Z',
          updatedAt: '2024-01-18T14:00:00Z',
          lastActivity: '2024-01-19T16:45:00Z',
        },
      ];

      // Apply filters
      let filteredDiscussions = mockDiscussions;

      if (query.search) {
        filteredDiscussions = filteredDiscussions.filter(
          discussion =>
            discussion.title.toLowerCase().includes(query.search.toLowerCase()) ||
            discussion.content.toLowerCase().includes(query.search.toLowerCase()),
        );
      }

      if (query.type) {
        filteredDiscussions = filteredDiscussions.filter(discussion => discussion.type === query.type);
      }

      if (query.category) {
        filteredDiscussions = filteredDiscussions.filter(discussion => discussion.category === query.category);
      }

      if (query.tags && query.tags.length > 0) {
        filteredDiscussions = filteredDiscussions.filter(discussion =>
          discussion.tags && discussion.tags.some(tag => query.tags.includes(tag)),
        );
      }

      if (query.courseId) {
        filteredDiscussions = filteredDiscussions.filter(discussion => discussion.courseId === query.courseId);
      }

      if (query.studyGroupId) {
        filteredDiscussions = filteredDiscussions.filter(discussion => discussion.studyGroupId === query.studyGroupId);
      }

      if (query.lessonId) {
        filteredDiscussions = filteredDiscussions.filter(discussion => discussion.lessonId === query.lessonId);
      }

      if (query.myDiscussions && userId !== 'guest') {
        filteredDiscussions = filteredDiscussions.filter(discussion => discussion.author.id === userId);
      }

      if (query.unanswered) {
        filteredDiscussions = filteredDiscussions.filter(discussion => !discussion.hasBestAnswer);
      }

      if (query.hasAnswer) {
        filteredDiscussions = filteredDiscussions.filter(discussion => discussion.hasBestAnswer);
      }

      if (query.pinned) {
        filteredDiscussions = filteredDiscussions.filter(discussion => discussion.isPinned);
      }

      if (query.priority) {
        filteredDiscussions = filteredDiscussions.filter(discussion => discussion.priority === query.priority);
      }

      // Apply pagination
      const page = query.page || 1;
      const limit = query.limit || 20;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;

      const paginatedDiscussions = filteredDiscussions.slice(startIndex, endIndex);
      const total = filteredDiscussions.length;
      const totalPages = Math.ceil(total / limit);

      return {
        data: paginatedDiscussions,
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      };
    } catch (error) {
      throw new BadRequestException('Failed to fetch discussions: ' + error.message);
    }
  }

  async getDiscussionById(userId: string, id: string, includeComments: boolean = false): Promise<DiscussionResponseDto> {
    try {
      // Mock implementation
      const mockDiscussion: DiscussionResponseDto = {
        id,
        title: 'How to optimize React component re-renders?',
        content: 'I am struggling with React component re-renders in my application. Every time the parent state updates, all child components re-render unnecessarily. What are the best practices to prevent this?\n\nI have tried using React.memo but it doesn\'t seem to be working as expected. Here\'s my current component structure...',
        type: 'question' as any,
        category: 'programming' as any,
        author: {
          id: 'user_123',
          username: 'react_dev',
          fullName: 'React Developer',
          avatar: 'https://example.com/avatar1.jpg',
          badge: 'React Expert',
          reputation: 1250,
        },
        tags: ['react', 'performance', 'optimization'],
        courseId: 'course_react_advanced',
        upvotes: 25,
        downvotes: 3,
        score: 22,
        userVote: userId !== 'guest' ? 'upvote' : undefined,
        commentCount: 12,
        viewCount: 156,
        hasBestAnswer: true,
        isPinned: false,
        isLocked: false,
        priority: 'normal',
        attachments: [
          {
            type: 'image',
            url: 'https://example.com/screenshot.png',
            name: 'Component Screenshot',
            size: 245760,
          },
        ],
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
        lastActivity: '2024-01-20T14:30:00Z',
      };

      if (includeComments) {
        mockDiscussion.comments = await this.getCommentsForDiscussion(userId, id);
      }

      // Increment view count (in real implementation)
      mockDiscussion.viewCount = mockDiscussion.viewCount + 1;

      return mockDiscussion;
    } catch (error) {
      throw new NotFoundException('Discussion not found');
    }
  }

  async updateDiscussion(userId: string, id: string, updateData: Partial<CreateDiscussionDto>): Promise<DiscussionResponseDto> {
    try {
      const discussion = await this.getDiscussionById(userId, id);

      // Check if user is author or has moderator privileges
      if (discussion.author.id !== userId) {
        throw new ForbiddenException('Only the author can update this discussion');
      }

      const updatedDiscussion = {
        ...discussion,
        ...updateData,
        updatedAt: new Date().toISOString(),
      };

      return updatedDiscussion;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new BadRequestException('Failed to update discussion: ' + error.message);
    }
  }

  async deleteDiscussion(userId: string, id: string): Promise<void> {
    try {
      const discussion = await this.getDiscussionById(userId, id);

      if (discussion.author.id !== userId) {
        throw new ForbiddenException('Only the author can delete this discussion');
      }

      // Mock deletion - in real app, would delete from database
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new BadRequestException('Failed to delete discussion: ' + error.message);
    }
  }

  async voteOnDiscussion(userId: string, discussionId: string, voteDto: VoteDiscussionDto): Promise<DiscussionResponseDto> {
    try {
      const discussion = await this.getDiscussionById(userId, discussionId);

      if (discussion.author.id === userId) {
        throw new BadRequestException('Cannot vote on your own discussion');
      }

      let newUpvotes = discussion.upvotes;
      let newDownvotes = discussion.downvotes;
      let newUserVote = voteDto.vote === 'remove' ? undefined : voteDto.vote;

      // Handle vote logic
      if (discussion.userVote) {
        // Remove previous vote
        if (discussion.userVote === 'upvote') {
          newUpvotes--;
        } else {
          newDownvotes--;
        }
      }

      // Apply new vote
      if (voteDto.vote === 'upvote') {
        newUpvotes++;
      } else if (voteDto.vote === 'downvote') {
        newDownvotes++;
      }

      const updatedDiscussion = {
        ...discussion,
        upvotes: newUpvotes,
        downvotes: newDownvotes,
        score: newUpvotes - newDownvotes,
        userVote: newUserVote,
        updatedAt: new Date().toISOString(),
      };

      return updatedDiscussion;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to vote on discussion: ' + error.message);
    }
  }

  async createComment(userId: string, discussionId: string, createCommentDto: CreateDiscussionCommentDto): Promise<CommentDto> {
    try {
      const discussion = await this.getDiscussionById(userId, discussionId);
      const commentId = `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const comment: CommentDto = {
        id: commentId,
        content: createCommentDto.content,
        author: await this.getAuthorInfo(userId),
        parentCommentId: createCommentDto.parentCommentId,
        upvotes: 0,
        downvotes: 0,
        score: 0,
        isBestAnswer: createCommentDto.isBestAnswer || false,
        attachments: createCommentDto.attachments || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        replies: [],
        replyCount: 0,
      };

      // In real implementation, would store comment and update discussion comment count

      return comment;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to create comment: ' + error.message);
    }
  }

  async getCommentsForDiscussion(userId: string, discussionId: string): Promise<CommentDto[]> {
    try {
      // Mock comments data
      const mockComments: CommentDto[] = [
        {
          id: 'comment_1',
          content: 'Great question! You can use React.memo() to prevent unnecessary re-renders. Here is how you can implement it...',
          author: {
            id: 'user_456',
            username: 'react_expert',
            fullName: 'React Expert',
            avatar: 'https://example.com/avatar2.jpg',
            badge: 'Senior Developer',
            reputation: 1850,
          },
          upvotes: 15,
          downvotes: 1,
          score: 14,
          userVote: userId !== 'guest' ? 'upvote' : undefined,
          isBestAnswer: true,
          attachments: [
            {
              type: 'code',
              url: 'https://example.com/code-snippet.js',
              name: 'React.memo Example',
            },
          ],
          createdAt: '2024-01-15T11:30:00Z',
          updatedAt: '2024-01-15T11:30:00Z',
          replies: [
            {
              id: 'comment_2',
              content: 'Thanks! This is exactly what I needed.',
              author: {
                id: 'user_123',
                username: 'react_dev',
                fullName: 'React Developer',
                avatar: 'https://example.com/avatar1.jpg',
                badge: 'React Expert',
                reputation: 1250,
              },
              parentCommentId: 'comment_1',
              upvotes: 3,
              downvotes: 0,
              score: 3,
              isBestAnswer: false,
              attachments: [],
              createdAt: '2024-01-15T12:00:00Z',
              updatedAt: '2024-01-15T12:00:00Z',
              replies: [],
              replyCount: 0,
            },
          ],
          replyCount: 1,
        },
        {
          id: 'comment_3',
          content: 'Additionally, you should also consider using useMemo and useCallback hooks for performance optimization.',
          author: {
            id: 'user_789',
            username: 'performance_guru',
            fullName: 'Performance Guru',
            avatar: 'https://example.com/avatar3.jpg',
            badge: 'Performance Expert',
            reputation: 2200,
          },
          upvotes: 8,
          downvotes: 0,
          score: 8,
          isBestAnswer: false,
          attachments: [],
          createdAt: '2024-01-15T13:15:00Z',
          updatedAt: '2024-01-15T13:15:00Z',
          replies: [],
          replyCount: 0,
        },
      ];

      return mockComments;
    } catch (error) {
      throw new BadRequestException('Failed to get comments: ' + error.message);
    }
  }

  async voteOnComment(userId: string, commentId: string, voteDto: VoteCommentDto): Promise<CommentDto> {
    try {
      // Mock implementation - would fetch comment from database
      const mockComment: CommentDto = {
        id: commentId,
        content: 'Great question! You can use React.memo() to prevent unnecessary re-renders...',
        author: {
          id: 'user_456',
          username: 'react_expert',
          fullName: 'React Expert',
          avatar: 'https://example.com/avatar2.jpg',
          badge: 'Senior Developer',
          reputation: 1850,
        },
        upvotes: 15,
        downvotes: 1,
        score: 14,
        userVote: 'upvote',
        isBestAnswer: true,
        attachments: [],
        createdAt: '2024-01-15T11:30:00Z',
        updatedAt: '2024-01-15T11:30:00Z',
        replies: [],
        replyCount: 0,
      };

      if (mockComment.author.id === userId) {
        throw new BadRequestException('Cannot vote on your own comment');
      }

      // Apply voting logic similar to discussions
      let newUpvotes = mockComment.upvotes;
      let newDownvotes = mockComment.downvotes;
      let newUserVote = voteDto.vote === 'remove' ? undefined : voteDto.vote;

      if (mockComment.userVote) {
        if (mockComment.userVote === 'upvote') {
          newUpvotes--;
        } else {
          newDownvotes--;
        }
      }

      if (voteDto.vote === 'upvote') {
        newUpvotes++;
      } else if (voteDto.vote === 'downvote') {
        newDownvotes++;
      }

      return {
        ...mockComment,
        upvotes: newUpvotes,
        downvotes: newDownvotes,
        score: newUpvotes - newDownvotes,
        userVote: newUserVote,
        updatedAt: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new NotFoundException('Comment not found');
    }
  }

  async markCommentAsBestAnswer(userId: string, discussionId: string, commentId: string): Promise<CommentDto> {
    try {
      const discussion = await this.getDiscussionById(userId, discussionId);

      if (discussion.author.id !== userId) {
        throw new ForbiddenException('Only the discussion author can mark best answers');
      }

      // Mock implementation - would update comment in database
      const comment = await this.voteOnComment(userId, commentId, { vote: 'upvote' });
      
      return {
        ...comment,
        isBestAnswer: true,
        updatedAt: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new BadRequestException('Failed to mark comment as best answer: ' + error.message);
    }
  }

  private async getAuthorInfo(userId: string): Promise<DiscussionAuthorDto> {
    // Mock implementation - would fetch user data from database
    return {
      id: userId,
      username: `user_${userId.split('_')[1] || userId}`,
      fullName: 'User Name',
      avatar: 'https://example.com/avatar.jpg',
      badge: 'Member',
      reputation: 100,
    };
  }

  async getUserDiscussions(userId: string, query: Partial<DiscussionQueryDto>): Promise<DiscussionResponseDto[]> {
    try {
      const fullQuery = { ...query, myDiscussions: true };
      const result = await this.getDiscussions(userId, fullQuery as DiscussionQueryDto);
      return result.data;
    } catch (error) {
      throw new BadRequestException('Failed to get user discussions: ' + error.message);
    }
  }
}