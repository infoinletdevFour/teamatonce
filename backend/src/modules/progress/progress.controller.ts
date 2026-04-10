import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProgressService } from './progress.service';
import {
  StartStudySessionDto,
  EndStudySessionDto,
  StudySessionResponseDto,
  ProgressOverviewDto,
  AnalyticsQueryDto,
  AnalyticsResponseDto,
  ProgressAchievementDto,
  StreakInfoDto,
} from './dto';

@ApiTags('progress')
@Controller('progress')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  // =============================================
  // PROGRESS OVERVIEW
  // =============================================

  @Get()
  @ApiOperation({ summary: 'Get user progress (root endpoint)' })
  @ApiResponse({ status: 200, description: 'Progress overview retrieved successfully', type: ProgressOverviewDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProgress(@Request() req: any): Promise<ProgressOverviewDto> {
    return this.progressService.getProgressOverview(req.user.sub || req.user.userId);
  }

  @Get('overview')
  @ApiOperation({ summary: 'Get user progress overview' })
  @ApiResponse({ status: 200, description: 'Progress overview retrieved successfully', type: ProgressOverviewDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProgressOverview(@Request() req: any): Promise<ProgressOverviewDto> {
    return this.progressService.getProgressOverview(req.user.sub || req.user.userId);
  }

  // =============================================
  // STUDY SESSIONS
  // =============================================

  @Post('study-session')
  @ApiOperation({ summary: 'Start a new study session' })
  @ApiResponse({ status: 201, description: 'Study session started successfully', type: StudySessionResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async startStudySession(
    @Request() req: any,
    @Body(ValidationPipe) startStudySessionDto: StartStudySessionDto,
  ): Promise<StudySessionResponseDto> {
    return this.progressService.startStudySession(req.user.sub || req.user.userId, startStudySessionDto);
  }

  @Post('study-session/:sessionId/end')
  @ApiOperation({ summary: 'End a study session' })
  @ApiParam({ name: 'sessionId', description: 'Study session ID' })
  @ApiResponse({ status: 200, description: 'Study session ended successfully', type: StudySessionResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid request or session already ended' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Study session not found' })
  async endStudySession(
    @Request() req: any,
    @Param('sessionId') sessionId: string,
    @Body(ValidationPipe) endStudySessionDto: EndStudySessionDto,
  ): Promise<StudySessionResponseDto> {
    return this.progressService.endStudySession(req.user.sub || req.user.userId, sessionId, endStudySessionDto);
  }

  @Get('study-sessions')
  @ApiOperation({ summary: 'Get user study sessions history' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of sessions to return (max 100)' })
  @ApiQuery({ name: 'offset', required: false, description: 'Number of sessions to skip' })
  @ApiResponse({ status: 200, description: 'Study sessions retrieved successfully', type: [StudySessionResponseDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserStudySessions(
    @Request() req: any,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ): Promise<StudySessionResponseDto[]> {
    const limitValue = Math.min(limit || 50, 100);
    const offsetValue = offset || 0;
    return this.progressService.getUserStudySessions(req.user.sub || req.user.userId, limitValue, offsetValue);
  }

  // =============================================
  // ACHIEVEMENTS AND STREAKS
  // =============================================

  @Get('achievements')
  @ApiOperation({ summary: 'Get user achievements' })
  @ApiResponse({ status: 200, description: 'Achievements retrieved successfully', type: [ProgressAchievementDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserAchievements(@Request() req: any): Promise<ProgressAchievementDto[]> {
    return this.progressService.getUserAchievements(req.user.sub || req.user.userId);
  }

  @Get('streaks')
  @ApiOperation({ summary: 'Get user streak information' })
  @ApiResponse({ status: 200, description: 'Streak information retrieved successfully', type: StreakInfoDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getStreakInfo(@Request() req: any): Promise<StreakInfoDto> {
    return this.progressService.getStreakInfo(req.user.sub || req.user.userId);
  }

  @Get('streak')
  @ApiOperation({ summary: 'Get user streak information (singular)' })
  @ApiResponse({ status: 200, description: 'Streak information retrieved successfully', type: StreakInfoDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getStreakInfoSingular(@Request() req: any): Promise<StreakInfoDto> {
    return this.progressService.getStreakInfo(req.user.sub || req.user.userId);
  }

  // =============================================
  // ANALYTICS
  // =============================================

  @Get('analytics')
  @ApiOperation({ summary: 'Get detailed user learning analytics' })
  @ApiQuery({ name: 'timeRange', required: false, enum: ['week', 'month', 'quarter', 'year', 'all_time'], description: 'Time range for analytics' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date for custom range (ISO format)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date for custom range (ISO format)' })
  @ApiQuery({ name: 'metric', required: false, enum: ['study_time', 'sessions', 'lessons_completed', 'assessments_completed', 'xp_earned', 'engagement'], description: 'Specific metric to focus on' })
  @ApiQuery({ name: 'courseId', required: false, description: 'Filter by specific course' })
  @ApiQuery({ name: 'subject', required: false, description: 'Filter by subject' })
  @ApiResponse({ status: 200, description: 'Analytics retrieved successfully', type: AnalyticsResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid query parameters' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getAnalytics(
    @Request() req: any,
    @Query(new ValidationPipe({ transform: true, whitelist: true })) query: AnalyticsQueryDto,
  ): Promise<AnalyticsResponseDto> {
    return this.progressService.getAnalytics(req.user.sub || req.user.userId, query);
  }

  // =============================================
  // QUICK STATS ENDPOINTS
  // =============================================

  @Get('stats/today')
  @ApiOperation({ summary: 'Get today\'s learning stats' })
  @ApiResponse({ status: 200, description: 'Today\'s stats retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getTodayStats(@Request() req: any): Promise<{
    studyTime: number;
    sessions: number;
    xpEarned: number;
    streakActive: boolean;
  }> {
    // This would be implemented to get today's specific stats
    const overview = await this.progressService.getProgressOverview(req.user.sub || req.user.userId);
    
    return {
      studyTime: 0, // Would calculate today's study time
      sessions: 0, // Would calculate today's sessions
      xpEarned: 0, // Would calculate today's XP
      streakActive: overview.streak.isActiveToday
    };
  }

  @Get('stats/week')
  @ApiOperation({ summary: 'Get this week\'s learning stats' })
  @ApiResponse({ status: 200, description: 'Week\'s stats retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getWeekStats(@Request() req: any): Promise<{
    totalStudyTime: number;
    totalSessions: number;
    totalXpEarned: number;
    averageDaily: number;
    activeDays: number;
  }> {
    const overview = await this.progressService.getProgressOverview(req.user.sub || req.user.userId);
    
    const totalStudyTime = overview.weeklyActivity.reduce((sum, day) => sum + day.minutesStudied, 0);
    const totalSessions = overview.weeklyActivity.reduce((sum, day) => sum + day.sessions, 0);
    const totalXpEarned = overview.weeklyActivity.reduce((sum, day) => sum + day.xpEarned, 0);
    const activeDays = overview.weeklyActivity.filter(day => day.hasActivity).length;
    
    return {
      totalStudyTime,
      totalSessions,
      totalXpEarned,
      averageDaily: totalStudyTime / 7,
      activeDays
    };
  }

  @Get('leaderboard')
  @ApiOperation({ summary: 'Get user position on leaderboards' })
  @ApiQuery({ name: 'type', required: false, enum: ['xp', 'streak', 'study_time'], description: 'Leaderboard type' })
  @ApiQuery({ name: 'scope', required: false, enum: ['global', 'friends', 'course'], description: 'Leaderboard scope' })
  @ApiResponse({ status: 200, description: 'Leaderboard data retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getLeaderboard(
    @Request() req: any,
    @Query('type') type = 'xp',
    @Query('scope') scope = 'global',
  ): Promise<{
    userRank: number;
    userScore: number;
    totalUsers: number;
    topUsers: Array<{
      rank: number;
      userId: string;
      displayName?: string;
      score: number;
    }>;
    nearbyUsers: Array<{
      rank: number;
      userId: string;
      displayName?: string;
      score: number;
    }>;
  }> {
    // This would be implemented to get leaderboard data
    // For now, returning placeholder data
    return {
      userRank: 42,
      userScore: 1500,
      totalUsers: 1000,
      topUsers: [],
      nearbyUsers: []
    };
  }
}