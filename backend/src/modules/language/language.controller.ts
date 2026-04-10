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
  HttpStatus
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth, 
  ApiParam,
  ApiQuery
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LanguageService } from './language.service';
import {
  CreateLessonDto,
  UpdateLessonDto,
  CreateLanguageExerciseDto,
  CreateVocabularyDto,
  UpdateProgressDto,
  LessonQueryDto,
  ExerciseQueryDto,
  VocabularyQueryDto,
  ProgressQueryDto,
  LeaderboardQueryDto,
  LanguageLessonResponseDto,
  ExerciseResponseDto,
  VocabularyResponseDto,
  ProgressResponseDto,
  LanguageStatsDto,
  LeaderboardEntryDto,
  LanguageAchievementDto,
  PaginatedLessonsDto,
  PaginatedLanguageExercisesDto,
  PaginatedVocabularyDto,
  PaginatedProgressDto
} from './dto';

@ApiTags('Language Learning')
@Controller('language')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LanguageController {
  constructor(private readonly languageService: LanguageService) {}

  // =============================================
  // LESSON ENDPOINTS
  // =============================================

  @Post('lessons')
  @ApiOperation({ summary: 'Create a new language lesson' })
  @ApiResponse({ 
    status: 201, 
    description: 'Lesson created successfully', 
    type: LanguageLessonResponseDto 
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createLesson(
    @Request() req: any,
    @Body() createLessonDto: CreateLessonDto
  ): Promise<LanguageLessonResponseDto> {
    return this.languageService.createLesson(req.user.sub, createLessonDto);
  }

  @Get('lessons')
  @ApiOperation({ summary: 'Get lessons with filtering and pagination' })
  @ApiResponse({ 
    status: 200, 
    description: 'Lessons retrieved successfully', 
    type: PaginatedLessonsDto 
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getLessons(
    @Request() req: any,
    @Query() query: LessonQueryDto
  ): Promise<PaginatedLessonsDto> {
    return this.languageService.getLessons(req.user.sub, query);
  }

  @Get('lessons/:id')
  @ApiOperation({ summary: 'Get lesson by ID' })
  @ApiParam({ name: 'id', description: 'Lesson ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Lesson retrieved successfully', 
    type: LanguageLessonResponseDto 
  })
  @ApiResponse({ status: 404, description: 'Lesson not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getLessonById(
    @Request() req: any,
    @Param('id') id: string
  ): Promise<LanguageLessonResponseDto> {
    return this.languageService.getLessonById(req.user.sub, id);
  }

  @Put('lessons/:id')
  @ApiOperation({ summary: 'Update lesson by ID' })
  @ApiParam({ name: 'id', description: 'Lesson ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Lesson updated successfully', 
    type: LanguageLessonResponseDto 
  })
  @ApiResponse({ status: 404, description: 'Lesson not found' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateLesson(
    @Request() req: any,
    @Param('id') id: string,
    @Body() updateLessonDto: UpdateLessonDto
  ): Promise<LanguageLessonResponseDto> {
    return this.languageService.updateLesson(req.user.sub || req.user.sub || req.user.userId, id, updateLessonDto);
  }

  @Delete('lessons/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete lesson by ID' })
  @ApiParam({ name: 'id', description: 'Lesson ID' })
  @ApiResponse({ status: 204, description: 'Lesson deleted successfully' })
  @ApiResponse({ status: 404, description: 'Lesson not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deleteLesson(
    @Request() req: any,
    @Param('id') id: string
  ): Promise<void> {
    return this.languageService.deleteLesson(req.user.sub, id);
  }

  // =============================================
  // EXERCISE ENDPOINTS
  // =============================================

  @Post('exercises')
  @ApiOperation({ summary: 'Create a new language exercise' })
  @ApiResponse({ 
    status: 201, 
    description: 'Exercise created successfully', 
    type: ExerciseResponseDto 
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createExercise(
    @Request() req: any,
    @Body() createExerciseDto: CreateLanguageExerciseDto
  ): Promise<ExerciseResponseDto> {
    return this.languageService.createExercise(req.user.sub, createExerciseDto);
  }

  @Get('exercises')
  @ApiOperation({ summary: 'Get exercises with filtering and pagination' })
  @ApiResponse({ 
    status: 200, 
    description: 'Exercises retrieved successfully', 
    type: PaginatedLanguageExercisesDto 
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getExercises(
    @Request() req: any,
    @Query() query: ExerciseQueryDto
  ): Promise<PaginatedLanguageExercisesDto> {
    return this.languageService.getExercises(req.user.sub, query);
  }

  @Get('exercises/:id')
  @ApiOperation({ summary: 'Get exercise by ID' })
  @ApiParam({ name: 'id', description: 'Exercise ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Exercise retrieved successfully', 
    type: ExerciseResponseDto 
  })
  @ApiResponse({ status: 404, description: 'Exercise not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getExerciseById(
    @Request() req: any,
    @Param('id') id: string
  ): Promise<ExerciseResponseDto> {
    return this.languageService.getExerciseById(req.user.sub, id);
  }

  @Delete('exercises/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete exercise by ID' })
  @ApiParam({ name: 'id', description: 'Exercise ID' })
  @ApiResponse({ status: 204, description: 'Exercise deleted successfully' })
  @ApiResponse({ status: 404, description: 'Exercise not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deleteExercise(
    @Request() req: any,
    @Param('id') id: string
  ): Promise<void> {
    return this.languageService.deleteExercise(req.user.sub, id);
  }

  // =============================================
  // VOCABULARY ENDPOINTS
  // =============================================

  @Post('vocabulary')
  @ApiOperation({ summary: 'Add new vocabulary word' })
  @ApiResponse({ 
    status: 201, 
    description: 'Vocabulary added successfully', 
    type: VocabularyResponseDto 
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createVocabulary(
    @Request() req: any,
    @Body() createVocabularyDto: CreateVocabularyDto
  ): Promise<VocabularyResponseDto> {
    return this.languageService.createVocabulary(req.user.sub, createVocabularyDto);
  }

  @Get('vocabulary')
  @ApiOperation({ summary: 'Get vocabulary with filtering and pagination' })
  @ApiResponse({ 
    status: 200, 
    description: 'Vocabulary retrieved successfully', 
    type: PaginatedVocabularyDto 
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getVocabulary(
    @Request() req: any,
    @Query() query: VocabularyQueryDto
  ): Promise<PaginatedVocabularyDto> {
    return this.languageService.getVocabulary(req.user.sub, query);
  }

  @Get('vocabulary/:id')
  @ApiOperation({ summary: 'Get vocabulary by ID' })
  @ApiParam({ name: 'id', description: 'Vocabulary ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Vocabulary retrieved successfully', 
    type: VocabularyResponseDto 
  })
  @ApiResponse({ status: 404, description: 'Vocabulary not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getVocabularyById(
    @Request() req: any,
    @Param('id') id: string
  ): Promise<VocabularyResponseDto> {
    return this.languageService.getVocabularyById(req.user.sub, id);
  }

  @Delete('vocabulary/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete vocabulary by ID' })
  @ApiParam({ name: 'id', description: 'Vocabulary ID' })
  @ApiResponse({ status: 204, description: 'Vocabulary deleted successfully' })
  @ApiResponse({ status: 404, description: 'Vocabulary not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deleteVocabulary(
    @Request() req: any,
    @Param('id') id: string
  ): Promise<void> {
    return this.languageService.deleteVocabulary(req.user.sub, id);
  }

  // =============================================
  // PROGRESS TRACKING ENDPOINTS
  // =============================================

  @Post('progress')
  @ApiOperation({ summary: 'Update language learning progress' })
  @ApiResponse({ 
    status: 201, 
    description: 'Progress updated successfully', 
    type: ProgressResponseDto 
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateProgress(
    @Request() req: any,
    @Body() updateProgressDto: UpdateProgressDto
  ): Promise<ProgressResponseDto> {
    return this.languageService.updateProgress(req.user.sub, updateProgressDto);
  }

  @Get('progress')
  @ApiOperation({ summary: 'Get learning progress with filtering' })
  @ApiResponse({ 
    status: 200, 
    description: 'Progress retrieved successfully', 
    type: PaginatedProgressDto 
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProgress(
    @Request() req: any,
    @Query() query: ProgressQueryDto
  ): Promise<PaginatedProgressDto> {
    return this.languageService.getProgress(req.user.sub, query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get language learning statistics' })
  @ApiQuery({ name: 'language_code', required: false, description: 'Language code filter' })
  @ApiResponse({ 
    status: 200, 
    description: 'Statistics retrieved successfully', 
    type: [LanguageStatsDto] 
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getStats(
    @Request() req: any,
    @Query('language_code') languageCode?: string
  ): Promise<LanguageStatsDto[]> {
    return this.languageService.getStats(req.user.sub, languageCode);
  }

  // =============================================
  // LEADERBOARD ENDPOINTS
  // =============================================

  @Get('leaderboard')
  @ApiOperation({ summary: 'Get language learning leaderboard' })
  @ApiResponse({ 
    status: 200, 
    description: 'Leaderboard retrieved successfully', 
    type: [LeaderboardEntryDto] 
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getLeaderboard(
    @Query() query: LeaderboardQueryDto
  ): Promise<LeaderboardEntryDto[]> {
    return this.languageService.getLeaderboard(query);
  }

  // =============================================
  // ACHIEVEMENTS ENDPOINTS
  // =============================================

  @Get('achievements')
  @ApiOperation({ summary: 'Get user achievements' })
  @ApiQuery({ name: 'language_code', required: false, description: 'Language code filter' })
  @ApiResponse({ 
    status: 200, 
    description: 'Achievements retrieved successfully', 
    type: [LanguageAchievementDto] 
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getAchievements(
    @Request() req: any,
    @Query('language_code') languageCode?: string
  ): Promise<LanguageAchievementDto[]> {
    return this.languageService.getAchievements(req.user.sub, languageCode);
  }

  // =============================================
  // UTILITY ENDPOINTS
  // =============================================

  @Get('languages')
  @ApiOperation({ summary: 'Get available languages' })
  @ApiResponse({ 
    status: 200, 
    description: 'Languages retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          code: { type: 'string', example: 'es' },
          name: { type: 'string', example: 'Spanish' },
          native_name: { type: 'string', example: 'Español' },
          flag: { type: 'string', example: '🇪🇸' }
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getAvailableLanguages(): Promise<any[]> {
    return this.languageService.getAvailableLanguages();
  }

  @Get('skills')
  @ApiOperation({ summary: 'Get available language skills' })
  @ApiResponse({ 
    status: 200, 
    description: 'Skills retrieved successfully',
    schema: {
      type: 'array',
      items: { type: 'string' }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getSkills(): Promise<string[]> {
    return ['speaking', 'listening', 'reading', 'writing', 'vocabulary', 'grammar'];
  }

  @Get('difficulty-levels')
  @ApiOperation({ summary: 'Get available difficulty levels' })
  @ApiResponse({ 
    status: 200, 
    description: 'Difficulty levels retrieved successfully',
    schema: {
      type: 'array',
      items: { type: 'string' }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getDifficultyLevels(): Promise<string[]> {
    return ['beginner', 'elementary', 'intermediate', 'upper_intermediate', 'advanced', 'proficient'];
  }
}