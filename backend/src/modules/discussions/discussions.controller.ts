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
  ValidationPipe,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DiscussionsService } from './discussions.service';
import {
  CreateDiscussionDto,
  CreateDiscussionCommentDto,
  DiscussionQueryDto,
  DiscussionResponseDto,
  CommentDto,
  PaginatedDiscussionsDto,
  VoteDiscussionDto,
  VoteCommentDto,
} from './dto';

@ApiTags('discussions')
@Controller('discussions')
export class DiscussionsController {
  constructor(private readonly discussionsService: DiscussionsService) {}

  // =============================================
  // PUBLIC ENDPOINTS
  // =============================================

  @Get()
  @ApiOperation({ summary: 'Get all public discussions' })
  @ApiResponse({ status: 200, description: 'Discussions retrieved successfully', type: PaginatedDiscussionsDto })
  async getDiscussions(
    @Query(new ValidationPipe({ transform: true, whitelist: true })) query: DiscussionQueryDto,
  ): Promise<PaginatedDiscussionsDto> {
    return this.discussionsService.getDiscussions('guest', query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get discussion by ID' })
  @ApiParam({ name: 'id', description: 'Discussion ID' })
  @ApiResponse({ status: 200, description: 'Discussion retrieved successfully', type: DiscussionResponseDto })
  @ApiResponse({ status: 404, description: 'Discussion not found' })
  async getDiscussionById(@Param('id') id: string): Promise<DiscussionResponseDto> {
    return this.discussionsService.getDiscussionById('guest', id);
  }

  @Get(':id/comments')
  @ApiOperation({ summary: 'Get discussion comments' })
  @ApiParam({ name: 'id', description: 'Discussion ID' })
  @ApiResponse({ status: 200, description: 'Comments retrieved successfully', type: [CommentDto] })
  @ApiResponse({ status: 404, description: 'Discussion not found' })
  async getDiscussionComments(@Param('id') id: string): Promise<CommentDto[]> {
    return this.discussionsService.getCommentsForDiscussion('guest', id);
  }

  // =============================================
  // AUTHENTICATED ENDPOINTS
  // =============================================

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new discussion' })
  @ApiResponse({ status: 201, description: 'Discussion created successfully', type: DiscussionResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createDiscussion(
    @Request() req: any,
    @Body(ValidationPipe) createDiscussionDto: CreateDiscussionDto,
  ): Promise<DiscussionResponseDto> {
    return this.discussionsService.createDiscussion(req.user.sub || req.user.userId, createDiscussionDto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update discussion (author only)' })
  @ApiParam({ name: 'id', description: 'Discussion ID' })
  @ApiResponse({ status: 200, description: 'Discussion updated successfully', type: DiscussionResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - only author can update' })
  @ApiResponse({ status: 404, description: 'Discussion not found' })
  async updateDiscussion(
    @Request() req: any,
    @Param('id') id: string,
    @Body(ValidationPipe) updateData: Partial<CreateDiscussionDto>,
  ): Promise<DiscussionResponseDto> {
    return this.discussionsService.updateDiscussion(req.user.sub || req.user.userId, id, updateData);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete discussion (author only)' })
  @ApiParam({ name: 'id', description: 'Discussion ID' })
  @ApiResponse({ status: 204, description: 'Discussion deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - only author can delete' })
  @ApiResponse({ status: 404, description: 'Discussion not found' })
  async deleteDiscussion(@Request() req: any, @Param('id') id: string): Promise<void> {
    return this.discussionsService.deleteDiscussion(req.user.sub || req.user.userId, id);
  }

  // =============================================
  // VOTING ENDPOINTS
  // =============================================

  @Post(':id/vote')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Vote on a discussion' })
  @ApiParam({ name: 'id', description: 'Discussion ID' })
  @ApiResponse({ status: 200, description: 'Vote recorded successfully', type: DiscussionResponseDto })
  @ApiResponse({ status: 400, description: 'Cannot vote on your own discussion' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Discussion not found' })
  async voteOnDiscussion(
    @Request() req: any,
    @Param('id') id: string,
    @Body(ValidationPipe) voteDto: VoteDiscussionDto,
  ): Promise<DiscussionResponseDto> {
    return this.discussionsService.voteOnDiscussion(req.user.sub || req.user.userId, id, voteDto);
  }

  // =============================================
  // COMMENTS ENDPOINTS
  // =============================================

  @Post(':id/comments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a comment to discussion' })
  @ApiParam({ name: 'id', description: 'Discussion ID' })
  @ApiResponse({ status: 201, description: 'Comment created successfully', type: CommentDto })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Discussion not found' })
  async addComment(
    @Request() req: any,
    @Param('id') id: string,
    @Body(ValidationPipe) createCommentDto: CreateDiscussionCommentDto,
  ): Promise<CommentDto> {
    return this.discussionsService.createComment(req.user.sub || req.user.userId, id, createCommentDto);
  }

  @Get(':id/comments/authenticated')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get discussion comments (authenticated - includes voting info)' })
  @ApiParam({ name: 'id', description: 'Discussion ID' })
  @ApiResponse({ status: 200, description: 'Comments retrieved successfully', type: [CommentDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Discussion not found' })
  async getDiscussionCommentsAuthenticated(
    @Request() req: any,
    @Param('id') id: string,
  ): Promise<CommentDto[]> {
    return this.discussionsService.getCommentsForDiscussion(req.user.sub || req.user.userId, id);
  }

  @Post('comments/:commentId/vote')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Vote on a comment' })
  @ApiParam({ name: 'commentId', description: 'Comment ID' })
  @ApiResponse({ status: 200, description: 'Vote recorded successfully', type: CommentDto })
  @ApiResponse({ status: 400, description: 'Cannot vote on your own comment' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  async voteOnComment(
    @Request() req: any,
    @Param('commentId') commentId: string,
    @Body(ValidationPipe) voteDto: VoteCommentDto,
  ): Promise<CommentDto> {
    return this.discussionsService.voteOnComment(req.user.sub || req.user.userId, commentId, voteDto);
  }

  @Post(':discussionId/comments/:commentId/best-answer')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark comment as best answer (discussion author only)' })
  @ApiParam({ name: 'discussionId', description: 'Discussion ID' })
  @ApiParam({ name: 'commentId', description: 'Comment ID' })
  @ApiResponse({ status: 200, description: 'Comment marked as best answer', type: CommentDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Only discussion author can mark best answers' })
  @ApiResponse({ status: 404, description: 'Discussion or comment not found' })
  async markCommentAsBestAnswer(
    @Request() req: any,
    @Param('discussionId') discussionId: string,
    @Param('commentId') commentId: string,
  ): Promise<CommentDto> {
    return this.discussionsService.markCommentAsBestAnswer(req.user.sub || req.user.userId, discussionId, commentId);
  }

  // =============================================
  // USER DISCUSSIONS ENDPOINTS
  // =============================================

  @Get('my/discussions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user discussions' })
  @ApiResponse({ status: 200, description: 'User discussions retrieved successfully', type: [DiscussionResponseDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserDiscussions(
    @Request() req: any,
    @Query(new ValidationPipe({ transform: true, whitelist: true })) query: Partial<DiscussionQueryDto>,
  ): Promise<DiscussionResponseDto[]> {
    return this.discussionsService.getUserDiscussions(req.user.sub || req.user.userId, query);
  }

  @Get('my/discussions/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get detailed discussion info (authenticated)' })
  @ApiParam({ name: 'id', description: 'Discussion ID' })
  @ApiResponse({ status: 200, description: 'Discussion details retrieved successfully', type: DiscussionResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Discussion not found' })
  async getMyDiscussionDetails(@Request() req: any, @Param('id') id: string): Promise<DiscussionResponseDto> {
    return this.discussionsService.getDiscussionById(req.user.sub || req.user.userId, id, true);
  }

  // =============================================
  // AUTHENTICATED SEARCH ENDPOINTS
  // =============================================

  @Get('search/authenticated')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Search discussions (authenticated - includes voting info and private discussions)' })
  @ApiResponse({ status: 200, description: 'Discussions retrieved successfully', type: PaginatedDiscussionsDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async searchDiscussionsAuthenticated(
    @Request() req: any,
    @Query(new ValidationPipe({ transform: true, whitelist: true })) query: DiscussionQueryDto,
  ): Promise<PaginatedDiscussionsDto> {
    return this.discussionsService.getDiscussions(req.user.sub || req.user.userId, query);
  }

  // =============================================
  // CONTEXT-SPECIFIC ENDPOINTS
  // =============================================

  @Get('course/:courseId')
  @ApiOperation({ summary: 'Get discussions for a specific course' })
  @ApiParam({ name: 'courseId', description: 'Course ID' })
  @ApiResponse({ status: 200, description: 'Course discussions retrieved successfully', type: PaginatedDiscussionsDto })
  async getCourseDiscussions(
    @Param('courseId') courseId: string,
    @Query(new ValidationPipe({ transform: true, whitelist: true })) query: DiscussionQueryDto,
  ): Promise<PaginatedDiscussionsDto> {
    const courseQuery = { ...query, courseId };
    return this.discussionsService.getDiscussions('guest', courseQuery);
  }

  @Get('study-group/:studyGroupId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get discussions for a specific study group (members only)' })
  @ApiParam({ name: 'studyGroupId', description: 'Study Group ID' })
  @ApiResponse({ status: 200, description: 'Study group discussions retrieved successfully', type: PaginatedDiscussionsDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getStudyGroupDiscussions(
    @Request() req: any,
    @Param('studyGroupId') studyGroupId: string,
    @Query(new ValidationPipe({ transform: true, whitelist: true })) query: DiscussionQueryDto,
  ): Promise<PaginatedDiscussionsDto> {
    const groupQuery = { ...query, studyGroupId };
    return this.discussionsService.getDiscussions(req.user.sub || req.user.userId, groupQuery);
  }

  @Get('lesson/:lessonId')
  @ApiOperation({ summary: 'Get discussions for a specific lesson' })
  @ApiParam({ name: 'lessonId', description: 'Lesson ID' })
  @ApiResponse({ status: 200, description: 'Lesson discussions retrieved successfully', type: PaginatedDiscussionsDto })
  async getLessonDiscussions(
    @Param('lessonId') lessonId: string,
    @Query(new ValidationPipe({ transform: true, whitelist: true })) query: DiscussionQueryDto,
  ): Promise<PaginatedDiscussionsDto> {
    const lessonQuery = { ...query, lessonId };
    return this.discussionsService.getDiscussions('guest', lessonQuery);
  }
}