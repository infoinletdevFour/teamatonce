import {
  Controller,
  Get,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AchievementsService } from './achievements.service';
import {
  ProgressAchievementDto,
  AchievementsCategoryDto,
  AchievementsStatsDto,
} from './dto';

@ApiTags('achievements')
@Controller('achievements')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AchievementsController {
  constructor(private readonly achievementsService: AchievementsService) {}

  // =============================================
  // ACHIEVEMENTS ENDPOINTS
  // =============================================

  @Get()
  @ApiOperation({ summary: 'Get user achievements' })
  @ApiQuery({ name: 'category', required: false, description: 'Filter by achievement category' })
  @ApiQuery({ name: 'status', required: false, enum: ['earned', 'available', 'locked'], description: 'Filter by achievement status' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of achievements to return' })
  @ApiResponse({ status: 200, description: 'Achievements retrieved successfully', type: [ProgressAchievementDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserAchievements(
    @Request() req: any,
    @Query('category') category?: string,
    @Query('status') status?: 'earned' | 'available' | 'locked',
    @Query('limit') limit?: number,
  ): Promise<ProgressAchievementDto[]> {
    return this.achievementsService.getUserAchievements(req.user.sub || req.user.userId, {
      category,
      status,
      limit: limit ? Math.min(limit, 100) : 50,
    });
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get achievement categories with counts' })
  @ApiResponse({ status: 200, description: 'Achievement categories retrieved successfully', type: [AchievementsCategoryDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getAchievementCategories(@Request() req: any): Promise<AchievementsCategoryDto[]> {
    return this.achievementsService.getAchievementCategories(req.user.sub || req.user.userId);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get user achievement statistics' })
  @ApiResponse({ status: 200, description: 'Achievement statistics retrieved successfully', type: AchievementsStatsDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getAchievementStats(@Request() req: any): Promise<AchievementsStatsDto> {
    return this.achievementsService.getAchievementStats(req.user.sub || req.user.userId);
  }

  @Get('recent')
  @ApiOperation({ summary: 'Get recently earned achievements' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of recent achievements to return (max 20)' })
  @ApiResponse({ status: 200, description: 'Recent achievements retrieved successfully', type: [ProgressAchievementDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getRecentAchievements(
    @Request() req: any,
    @Query('limit') limit?: number,
  ): Promise<ProgressAchievementDto[]> {
    const limitValue = Math.min(limit || 10, 20);
    return this.achievementsService.getRecentAchievements(req.user.sub || req.user.userId, limitValue);
  }

  @Get('available')
  @ApiOperation({ summary: 'Get available achievements user can earn' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of available achievements to return' })
  @ApiResponse({ status: 200, description: 'Available achievements retrieved successfully', type: [ProgressAchievementDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getAvailableAchievements(
    @Request() req: any,
    @Query('limit') limit?: number,
  ): Promise<ProgressAchievementDto[]> {
    const limitValue = Math.min(limit || 20, 50);
    return this.achievementsService.getAvailableAchievements(req.user.sub || req.user.userId, limitValue);
  }

  @Get('progress')
  @ApiOperation({ summary: 'Get achievement progress for in-progress achievements' })
  @ApiResponse({ status: 200, description: 'Achievement progress retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getAchievementProgress(@Request() req: any): Promise<{
    inProgress: Array<{
      achievement: ProgressAchievementDto;
      currentProgress: number;
      targetProgress: number;
      progressPercentage: number;
    }>;
  }> {
    return this.achievementsService.getAchievementProgress(req.user.sub || req.user.userId);
  }
}