import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DiscussionType, DiscussionCategory } from './create-discussion.dto';

export class DiscussionAuthorDto {
  @ApiProperty({ description: 'Author ID', example: 'user_123' })
  id: string;

  @ApiProperty({ description: 'Author username', example: 'john_doe' })
  username: string;

  @ApiPropertyOptional({ description: 'Author full name', example: 'John Doe' })
  fullName?: string;

  @ApiPropertyOptional({ description: 'Author avatar URL', example: 'https://example.com/avatar.jpg' })
  avatar?: string;

  @ApiPropertyOptional({ description: 'Author badge/title', example: 'React Expert' })
  badge?: string;

  @ApiPropertyOptional({ description: 'Author reputation score', example: 1250 })
  reputation?: number;
}

export class CommentDto {
  @ApiProperty({ description: 'Comment ID', example: 'comment_123' })
  id: string;

  @ApiProperty({ description: 'Comment content' })
  content: string;

  @ApiProperty({ description: 'Comment author', type: DiscussionAuthorDto })
  author: DiscussionAuthorDto;

  @ApiPropertyOptional({ description: 'Parent comment ID if this is a reply' })
  parentCommentId?: string;

  @ApiProperty({ description: 'Upvotes count', example: 15 })
  upvotes: number;

  @ApiProperty({ description: 'Downvotes count', example: 2 })
  downvotes: number;

  @ApiProperty({ description: 'Net score (upvotes - downvotes)', example: 13 })
  score: number;

  @ApiPropertyOptional({ description: 'User vote on this comment', enum: ['upvote', 'downvote'] })
  userVote?: 'upvote' | 'downvote';

  @ApiProperty({ description: 'Whether this is marked as best answer', example: false })
  isBestAnswer: boolean;

  @ApiPropertyOptional({ description: 'Attached files/media' })
  attachments?: Array<{
    type: 'image' | 'document' | 'code' | 'link';
    url: string;
    name: string;
    size?: number;
  }>;

  @ApiProperty({ description: 'Creation date', example: '2024-01-15T10:00:00Z' })
  createdAt: string;

  @ApiProperty({ description: 'Last update date', example: '2024-01-15T10:00:00Z' })
  updatedAt: string;

  @ApiPropertyOptional({ description: 'Nested replies', isArray: true, type: () => CommentDto })
  replies?: CommentDto[];

  @ApiProperty({ description: 'Number of replies', example: 3 })
  replyCount: number;
}

export class DiscussionResponseDto {
  @ApiProperty({ description: 'Discussion ID', example: 'disc_123' })
  id: string;

  @ApiProperty({ description: 'Discussion title', example: 'How to optimize React component re-renders?' })
  title: string;

  @ApiProperty({ description: 'Discussion content/body' })
  content: string;

  @ApiProperty({ description: 'Discussion type', enum: DiscussionType })
  type: DiscussionType;

  @ApiProperty({ description: 'Discussion category', enum: DiscussionCategory })
  category: DiscussionCategory;

  @ApiProperty({ description: 'Discussion author', type: DiscussionAuthorDto })
  author: DiscussionAuthorDto;

  @ApiPropertyOptional({ description: 'Discussion tags', isArray: true, type: String })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Related course ID' })
  courseId?: string;

  @ApiPropertyOptional({ description: 'Related study group ID' })
  studyGroupId?: string;

  @ApiPropertyOptional({ description: 'Related lesson ID' })
  lessonId?: string;

  @ApiProperty({ description: 'Upvotes count', example: 25 })
  upvotes: number;

  @ApiProperty({ description: 'Downvotes count', example: 3 })
  downvotes: number;

  @ApiProperty({ description: 'Net score (upvotes - downvotes)', example: 22 })
  score: number;

  @ApiPropertyOptional({ description: 'User vote on this discussion', enum: ['upvote', 'downvote'] })
  userVote?: 'upvote' | 'downvote';

  @ApiProperty({ description: 'Number of comments', example: 12 })
  commentCount: number;

  @ApiProperty({ description: 'Number of views', example: 156 })
  viewCount: number;

  @ApiProperty({ description: 'Whether discussion has a best answer', example: true })
  hasBestAnswer: boolean;

  @ApiProperty({ description: 'Whether discussion is pinned', example: false })
  isPinned: boolean;

  @ApiProperty({ description: 'Whether discussion is locked', example: false })
  isLocked: boolean;

  @ApiPropertyOptional({ description: 'Priority level', example: 'normal' })
  priority?: string;

  @ApiPropertyOptional({ description: 'Attached files/media' })
  attachments?: Array<{
    type: 'image' | 'document' | 'code' | 'link';
    url: string;
    name: string;
    size?: number;
  }>;

  @ApiProperty({ description: 'Creation date', example: '2024-01-15T10:00:00Z' })
  createdAt: string;

  @ApiProperty({ description: 'Last update date', example: '2024-01-15T10:00:00Z' })
  updatedAt: string;

  @ApiProperty({ description: 'Last activity date', example: '2024-01-20T14:30:00Z' })
  lastActivity: string;

  @ApiPropertyOptional({ description: 'Comments (populated when requested)', isArray: true, type: CommentDto })
  comments?: CommentDto[];
}

export class PaginatedDiscussionsDto {
  @ApiProperty({ description: 'List of discussions', isArray: true, type: DiscussionResponseDto })
  data: DiscussionResponseDto[];

  @ApiProperty({ description: 'Total number of discussions', example: 150 })
  total: number;

  @ApiProperty({ description: 'Current page', example: 1 })
  page: number;

  @ApiProperty({ description: 'Items per page', example: 20 })
  limit: number;

  @ApiProperty({ description: 'Total pages', example: 8 })
  totalPages: number;

  @ApiProperty({ description: 'Has next page', example: true })
  hasNextPage: boolean;

  @ApiProperty({ description: 'Has previous page', example: false })
  hasPrevPage: boolean;
}

export class VoteDiscussionDto {
  @ApiProperty({
    description: 'Vote type',
    enum: ['upvote', 'downvote', 'remove'],
    example: 'upvote',
  })
  vote: 'upvote' | 'downvote' | 'remove';
}

export class VoteCommentDto {
  @ApiProperty({
    description: 'Vote type',
    enum: ['upvote', 'downvote', 'remove'],
    example: 'upvote',
  })
  vote: 'upvote' | 'downvote' | 'remove';
}