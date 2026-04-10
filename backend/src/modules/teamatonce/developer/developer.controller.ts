import {
  Controller,
  Get,
  Put,
  Body,
  Query,
  UseGuards,
  Request,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { DeveloperService } from './developer.service';
import {
  PerformanceMetricsDto,
  DeveloperReviewDto,
  DeveloperAchievementDto,
  SkillRatingDto,
  DeveloperProfileDto,
  UpdateDeveloperProfileDto,
  DashboardStatsDto,
  AIMatchedProjectDto,
} from './dto/developer.dto';

/**
 * Developer Controller
 *
 * Handles developer-specific endpoints for performance metrics,
 * reviews, achievements, and profile management
 */
@ApiTags('Developer')
@ApiBearerAuth()
@Controller('developer')
@UseGuards(JwtAuthGuard)
export class DeveloperController {
  constructor(private readonly developerService: DeveloperService) {}

  /**
   * Get dashboard stats (aggregated data for developer dashboard)
   */
  @Get('dashboard')
  @ApiOperation({ summary: 'Get developer dashboard stats' })
  @ApiResponse({
    status: 200,
    description: 'Dashboard stats retrieved successfully',
    type: DashboardStatsDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getDashboardStats(@Request() req: any): Promise<DashboardStatsDto> {
    try {
      const userId = req.user?.sub || req.user?.userId;
      if (!userId) {
        throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
      }

      return this.developerService.getDashboardStats(userId);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        error.message || 'Failed to get dashboard stats',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get AI-matched projects for the developer
   */
  @Get('matched-projects')
  @ApiOperation({ summary: 'Get AI-matched projects' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Maximum number of projects to return',
  })
  @ApiResponse({
    status: 200,
    description: 'Matched projects retrieved successfully',
    type: [AIMatchedProjectDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMatchedProjects(
    @Request() req: any,
    @Query('limit') limit?: number,
  ): Promise<AIMatchedProjectDto[]> {
    try {
      const userId = req.user?.sub || req.user?.userId;
      if (!userId) {
        throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
      }

      return this.developerService.getMatchedProjects(userId, limit);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        error.message || 'Failed to get matched projects',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get developer performance metrics
   */
  @Get('performance')
  @ApiOperation({ summary: 'Get developer performance metrics' })
  @ApiResponse({
    status: 200,
    description: 'Performance metrics retrieved successfully',
    type: PerformanceMetricsDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getPerformanceMetrics(@Request() req: any): Promise<PerformanceMetricsDto> {
    try {
      const userId = req.user?.sub || req.user?.userId;
      if (!userId) {
        throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
      }

      return this.developerService.getPerformanceMetrics(userId);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        error.message || 'Failed to get performance metrics',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get developer reviews
   */
  @Get('reviews')
  @ApiOperation({ summary: 'Get developer reviews' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Maximum number of reviews to return',
  })
  @ApiResponse({
    status: 200,
    description: 'Reviews retrieved successfully',
    type: [DeveloperReviewDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getDeveloperReviews(
    @Request() req: any,
    @Query('limit') limit?: number,
  ): Promise<DeveloperReviewDto[]> {
    try {
      const userId = req.user?.sub || req.user?.userId;
      if (!userId) {
        throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
      }

      return this.developerService.getDeveloperReviews(userId, limit);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        error.message || 'Failed to get reviews',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get developer achievements
   */
  @Get('achievements')
  @ApiOperation({ summary: 'Get developer achievements' })
  @ApiResponse({
    status: 200,
    description: 'Achievements retrieved successfully',
    type: [DeveloperAchievementDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getAchievements(@Request() req: any): Promise<DeveloperAchievementDto[]> {
    try {
      const userId = req.user?.sub || req.user?.userId;
      if (!userId) {
        throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
      }

      return this.developerService.getAchievements(userId);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        error.message || 'Failed to get achievements',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get skill ratings
   */
  @Get('skill-ratings')
  @ApiOperation({ summary: 'Get developer skill ratings' })
  @ApiResponse({
    status: 200,
    description: 'Skill ratings retrieved successfully',
    type: [SkillRatingDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getSkillRatings(@Request() req: any): Promise<SkillRatingDto[]> {
    try {
      const userId = req.user?.sub || req.user?.userId;
      if (!userId) {
        throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
      }

      return this.developerService.getSkillRatings(userId);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        error.message || 'Failed to get skill ratings',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get portfolio items (completed projects)
   */
  @Get('portfolio')
  @ApiOperation({ summary: 'Get developer portfolio items (completed projects)' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Maximum number of portfolio items to return',
  })
  @ApiResponse({
    status: 200,
    description: 'Portfolio items retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getPortfolioItems(
    @Request() req: any,
    @Query('limit') limit?: number,
  ): Promise<any[]> {
    try {
      const userId = req.user?.sub || req.user?.userId;
      if (!userId) {
        throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
      }

      return this.developerService.getPortfolioItems(userId, limit);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        error.message || 'Failed to get portfolio items',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get developer profile
   */
  @Get('profile')
  @ApiOperation({ summary: 'Get developer profile' })
  @ApiResponse({
    status: 200,
    description: 'Profile retrieved successfully',
    type: DeveloperProfileDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Developer not found' })
  async getDeveloperProfile(@Request() req: any): Promise<DeveloperProfileDto> {
    try {
      const userId = req.user?.sub || req.user?.userId;
      if (!userId) {
        throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
      }

      return this.developerService.getDeveloperProfile(userId);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        error.message || 'Failed to get profile',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Update developer profile
   */
  @Put('profile')
  @ApiOperation({ summary: 'Update developer profile' })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully',
    type: DeveloperProfileDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Developer not found' })
  async updateDeveloperProfile(
    @Request() req: any,
    @Body() data: UpdateDeveloperProfileDto,
  ): Promise<DeveloperProfileDto> {
    try {
      const userId = req.user?.sub || req.user?.userId;
      if (!userId) {
        throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
      }

      return this.developerService.updateDeveloperProfile(userId, data);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        error.message || 'Failed to update profile',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
