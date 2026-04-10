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
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { FeedbackService } from './feedback.service';
import {
  CreateFeedbackDto,
  UpdateFeedbackDto,
  RespondToFeedbackDto,
  FeedbackQueryDto,
} from './dto/feedback.dto';

@ApiTags('feedback')
@ApiBearerAuth()
@Controller('feedback')
@UseGuards(JwtAuthGuard)
export class FeedbackController {
  constructor(private readonly feedbackService: FeedbackService) {}

  // ============================================
  // PROJECT FEEDBACK
  // ============================================

  @Post()
  @ApiOperation({ summary: 'Create new feedback for a project or milestone' })
  @ApiResponse({ status: 201, description: 'Feedback created successfully' })
  @ApiResponse({ status: 404, description: 'Project or milestone not found' })
  async createFeedback(@Req() req, @Body() dto: CreateFeedbackDto) {
    const userId = req.user.sub || req.user.userId;
    return this.feedbackService.createFeedback(userId, dto);
  }

  @Get('project/:projectId')
  @ApiOperation({ summary: 'Get all feedbacks for a project' })
  @ApiResponse({ status: 200, description: 'Returns list of feedbacks' })
  @ApiQuery({ name: 'milestoneId', required: false, description: 'Filter by milestone ID' })
  @ApiQuery({ name: 'feedbackType', required: false, description: 'Filter by feedback type' })
  @ApiQuery({ name: 'minRating', required: false, description: 'Minimum rating filter (1-5)' })
  async getProjectFeedbacks(
    @Param('projectId') projectId: string,
    @Query() queryDto: FeedbackQueryDto
  ) {
    return this.feedbackService.getProjectFeedbacks(projectId, queryDto);
  }

  @Get('project/:projectId/rating')
  @ApiOperation({ summary: 'Get average rating for a project' })
  @ApiResponse({ status: 200, description: 'Returns average rating and distribution' })
  async getProjectRating(@Param('projectId') projectId: string) {
    return this.feedbackService.getAverageProjectRating(projectId);
  }

  @Get('project/:projectId/statistics')
  @ApiOperation({ summary: 'Get feedback statistics for a project' })
  @ApiResponse({ status: 200, description: 'Returns comprehensive feedback statistics' })
  async getProjectStatistics(@Param('projectId') projectId: string) {
    return this.feedbackService.getFeedbackStatistics(projectId);
  }

  // ============================================
  // MILESTONE FEEDBACK
  // ============================================

  @Get('milestone/:milestoneId')
  @ApiOperation({ summary: 'Get all feedbacks for a milestone' })
  @ApiResponse({ status: 200, description: 'Returns list of milestone feedbacks' })
  async getMilestoneFeedbacks(@Param('milestoneId') milestoneId: string) {
    return this.feedbackService.getMilestoneFeedbacks(milestoneId);
  }

  @Get('milestone/:milestoneId/rating')
  @ApiOperation({ summary: 'Get average rating for a milestone' })
  @ApiResponse({ status: 200, description: 'Returns average milestone rating' })
  async getMilestoneRating(@Param('milestoneId') milestoneId: string) {
    return this.feedbackService.getAverageMilestoneRating(milestoneId);
  }

  // ============================================
  // INDIVIDUAL FEEDBACK MANAGEMENT
  // ============================================

  @Get(':id')
  @ApiOperation({ summary: 'Get feedback by ID' })
  @ApiResponse({ status: 200, description: 'Returns feedback details' })
  @ApiResponse({ status: 404, description: 'Feedback not found' })
  async getFeedback(@Param('id') id: string) {
    return this.feedbackService.getFeedbackById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update feedback (owner only)' })
  @ApiResponse({ status: 200, description: 'Feedback updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - not the feedback owner' })
  @ApiResponse({ status: 404, description: 'Feedback not found' })
  async updateFeedback(
    @Req() req,
    @Param('id') id: string,
    @Body() dto: UpdateFeedbackDto
  ) {
    const userId = req.user.sub || req.user.userId;
    return this.feedbackService.updateFeedback(id, userId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete feedback (owner only)' })
  @ApiResponse({ status: 200, description: 'Feedback deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - not the feedback owner' })
  @ApiResponse({ status: 404, description: 'Feedback not found' })
  async deleteFeedback(@Req() req, @Param('id') id: string) {
    const userId = req.user.sub || req.user.userId;
    return this.feedbackService.deleteFeedback(id, userId);
  }

  @Put(':id/respond')
  @ApiOperation({ summary: 'Respond to feedback (team/admin only)' })
  @ApiResponse({ status: 200, description: 'Response added successfully' })
  @ApiResponse({ status: 404, description: 'Feedback not found' })
  async respondToFeedback(
    @Req() req,
    @Param('id') id: string,
    @Body() dto: RespondToFeedbackDto
  ) {
    const responderId = req.user.sub || req.user.userId;
    return this.feedbackService.respondToFeedback(id, responderId, dto);
  }
}
