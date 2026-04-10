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
import { ContentService } from './content.service';
import {
  CreateLessonDto,
  CreateResourceDto,
  LessonResponseDto,
  ResourceResponseDto,
  PaginatedLessonsDto,
  PaginatedResourcesDto,
  ContentQueryDto,
} from './dto';

@ApiTags('content')
@Controller('content')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  // =============================================
  // LESSON ENDPOINTS
  // =============================================

  @Get('lessons')
  @ApiOperation({ summary: 'Get all published lessons' })
  @ApiResponse({ status: 200, description: 'Lessons retrieved successfully', type: PaginatedLessonsDto })
  async getLessons(
    @Query(new ValidationPipe({ transform: true, whitelist: true })) query: ContentQueryDto,
  ): Promise<PaginatedLessonsDto> {
    return this.contentService.getLessons('guest', query);
  }

  @Get('lessons/:id')
  @ApiOperation({ summary: 'Get lesson by ID' })
  @ApiParam({ name: 'id', description: 'Lesson ID' })
  @ApiResponse({ status: 200, description: 'Lesson retrieved successfully', type: LessonResponseDto })
  @ApiResponse({ status: 404, description: 'Lesson not found' })
  async getLessonById(@Param('id') id: string): Promise<LessonResponseDto> {
    return this.contentService.getLessonById('guest', id);
  }

  @Post('lessons')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new lesson' })
  @ApiResponse({ status: 201, description: 'Lesson created successfully', type: LessonResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createLesson(
    @Request() req: any,
    @Body(ValidationPipe) createLessonDto: CreateLessonDto,
  ): Promise<LessonResponseDto> {
    return this.contentService.createLesson(req.user.sub || req.user.userId, createLessonDto);
  }

  @Put('lessons/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update lesson (author only)' })
  @ApiParam({ name: 'id', description: 'Lesson ID' })
  @ApiResponse({ status: 200, description: 'Lesson updated successfully', type: LessonResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - only author can update' })
  @ApiResponse({ status: 404, description: 'Lesson not found' })
  async updateLesson(
    @Request() req: any,
    @Param('id') id: string,
    @Body(ValidationPipe) updateData: Partial<CreateLessonDto>,
  ): Promise<LessonResponseDto> {
    return this.contentService.updateLesson(req.user.sub || req.user.userId, id, updateData);
  }

  @Delete('lessons/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete lesson (author only)' })
  @ApiParam({ name: 'id', description: 'Lesson ID' })
  @ApiResponse({ status: 204, description: 'Lesson deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - only author can delete' })
  @ApiResponse({ status: 404, description: 'Lesson not found' })
  async deleteLesson(@Request() req: any, @Param('id') id: string): Promise<void> {
    return this.contentService.deleteLesson(req.user.sub || req.user.userId, id);
  }

  // =============================================
  // RESOURCE ENDPOINTS
  // =============================================

  @Get('resources')
  @ApiOperation({ summary: 'Get all public resources' })
  @ApiResponse({ status: 200, description: 'Resources retrieved successfully', type: PaginatedResourcesDto })
  async getResources(
    @Query(new ValidationPipe({ transform: true, whitelist: true })) query: ContentQueryDto,
  ): Promise<PaginatedResourcesDto> {
    return this.contentService.getResources('guest', query);
  }

  @Get('resources/:id')
  @ApiOperation({ summary: 'Get resource by ID' })
  @ApiParam({ name: 'id', description: 'Resource ID' })
  @ApiResponse({ status: 200, description: 'Resource retrieved successfully', type: ResourceResponseDto })
  @ApiResponse({ status: 404, description: 'Resource not found' })
  async getResourceById(@Param('id') id: string): Promise<ResourceResponseDto> {
    return this.contentService.getResourceById('guest', id);
  }

  @Post('resources')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload a new resource' })
  @ApiResponse({ status: 201, description: 'Resource uploaded successfully', type: ResourceResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createResource(
    @Request() req: any,
    @Body(ValidationPipe) createResourceDto: CreateResourceDto,
  ): Promise<ResourceResponseDto> {
    return this.contentService.createResource(req.user.sub || req.user.userId, createResourceDto);
  }

  @Put('resources/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update resource (uploader only)' })
  @ApiParam({ name: 'id', description: 'Resource ID' })
  @ApiResponse({ status: 200, description: 'Resource updated successfully', type: ResourceResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - only uploader can update' })
  @ApiResponse({ status: 404, description: 'Resource not found' })
  async updateResource(
    @Request() req: any,
    @Param('id') id: string,
    @Body(ValidationPipe) updateData: Partial<CreateResourceDto>,
  ): Promise<ResourceResponseDto> {
    return this.contentService.updateResource(req.user.sub || req.user.userId, id, updateData);
  }

  @Delete('resources/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete resource (uploader only)' })
  @ApiParam({ name: 'id', description: 'Resource ID' })
  @ApiResponse({ status: 204, description: 'Resource deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - only uploader can delete' })
  @ApiResponse({ status: 404, description: 'Resource not found' })
  async deleteResource(@Request() req: any, @Param('id') id: string): Promise<void> {
    return this.contentService.deleteResource(req.user.sub || req.user.userId, id);
  }

  // =============================================
  // AUTHENTICATED CONTENT ENDPOINTS
  // =============================================

  @Get('lessons/authenticated')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get lessons (authenticated - includes user progress)' })
  @ApiResponse({ status: 200, description: 'Lessons retrieved successfully', type: PaginatedLessonsDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getLessonsAuthenticated(
    @Request() req: any,
    @Query(new ValidationPipe({ transform: true, whitelist: true })) query: ContentQueryDto,
  ): Promise<PaginatedLessonsDto> {
    return this.contentService.getLessons(req.user.sub || req.user.userId, query);
  }

  @Get('lessons/:id/authenticated')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get lesson by ID (authenticated - includes user progress)' })
  @ApiParam({ name: 'id', description: 'Lesson ID' })
  @ApiResponse({ status: 200, description: 'Lesson retrieved successfully', type: LessonResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Lesson not found' })
  async getLessonByIdAuthenticated(@Request() req: any, @Param('id') id: string): Promise<LessonResponseDto> {
    return this.contentService.getLessonById(req.user.sub || req.user.userId, id);
  }

  @Get('resources/authenticated')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get resources (authenticated - includes private resources)' })
  @ApiResponse({ status: 200, description: 'Resources retrieved successfully', type: PaginatedResourcesDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getResourcesAuthenticated(
    @Request() req: any,
    @Query(new ValidationPipe({ transform: true, whitelist: true })) query: ContentQueryDto,
  ): Promise<PaginatedResourcesDto> {
    return this.contentService.getResources(req.user.sub || req.user.userId, query);
  }

  // =============================================
  // USER CONTENT ENDPOINTS
  // =============================================

  @Get('my/lessons')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user lessons' })
  @ApiResponse({ status: 200, description: 'User lessons retrieved successfully', type: [LessonResponseDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserLessons(@Request() req: any): Promise<LessonResponseDto[]> {
    const result = await this.contentService.getUserContent(req.user.sub || req.user.userId, 'lessons');
    return result as LessonResponseDto[];
  }

  @Get('my/resources')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user resources' })
  @ApiResponse({ status: 200, description: 'User resources retrieved successfully', type: [ResourceResponseDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserResources(@Request() req: any): Promise<ResourceResponseDto[]> {
    const result = await this.contentService.getUserContent(req.user.sub || req.user.userId, 'resources');
    return result as ResourceResponseDto[];
  }

  // =============================================
  // COURSE CONTENT ENDPOINTS
  // =============================================

  @Get('course/:courseId')
  @ApiOperation({ summary: 'Get all content for a specific course' })
  @ApiParam({ name: 'courseId', description: 'Course ID' })
  @ApiResponse({
    status: 200,
    description: 'Course content retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        lessons: {
          type: 'array',
          items: { $ref: '#/components/schemas/LessonResponseDto' },
        },
        resources: {
          type: 'array',
          items: { $ref: '#/components/schemas/ResourceResponseDto' },
        },
      },
    },
  })
  async getCourseContent(@Param('courseId') courseId: string): Promise<{
    lessons: LessonResponseDto[];
    resources: ResourceResponseDto[];
  }> {
    return this.contentService.getCourseContent(courseId);
  }

  @Get('course/:courseId/authenticated')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all content for a specific course (authenticated - includes progress)' })
  @ApiParam({ name: 'courseId', description: 'Course ID' })
  @ApiResponse({
    status: 200,
    description: 'Course content retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        lessons: {
          type: 'array',
          items: { $ref: '#/components/schemas/LessonResponseDto' },
        },
        resources: {
          type: 'array',
          items: { $ref: '#/components/schemas/ResourceResponseDto' },
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCourseContentAuthenticated(
    @Request() req: any,
    @Param('courseId') courseId: string,
  ): Promise<{
    lessons: LessonResponseDto[];
    resources: ResourceResponseDto[];
  }> {
    return this.contentService.getCourseContent(courseId, req.user.sub || req.user.userId);
  }

  @Get('course/:courseId/lessons')
  @ApiOperation({ summary: 'Get lessons for a specific course' })
  @ApiParam({ name: 'courseId', description: 'Course ID' })
  @ApiResponse({ status: 200, description: 'Course lessons retrieved successfully', type: PaginatedLessonsDto })
  async getCourseLessons(
    @Param('courseId') courseId: string,
    @Query(new ValidationPipe({ transform: true, whitelist: true })) query: ContentQueryDto,
  ): Promise<PaginatedLessonsDto> {
    const courseQuery = { ...query, courseId };
    return this.contentService.getLessons('guest', courseQuery);
  }

  @Get('course/:courseId/resources')
  @ApiOperation({ summary: 'Get resources for a specific course' })
  @ApiParam({ name: 'courseId', description: 'Course ID' })
  @ApiResponse({ status: 200, description: 'Course resources retrieved successfully', type: PaginatedResourcesDto })
  async getCourseResources(
    @Param('courseId') courseId: string,
    @Query(new ValidationPipe({ transform: true, whitelist: true })) query: ContentQueryDto,
  ): Promise<PaginatedResourcesDto> {
    const courseQuery = { ...query, courseId };
    return this.contentService.getResources('guest', courseQuery);
  }

  // =============================================
  // CHAPTER CONTENT ENDPOINTS
  // =============================================

  @Get('chapter/:chapterId/lessons')
  @ApiOperation({ summary: 'Get lessons for a specific chapter' })
  @ApiParam({ name: 'chapterId', description: 'Chapter ID' })
  @ApiResponse({ status: 200, description: 'Chapter lessons retrieved successfully', type: PaginatedLessonsDto })
  async getChapterLessons(
    @Param('chapterId') chapterId: string,
    @Query(new ValidationPipe({ transform: true, whitelist: true })) query: ContentQueryDto,
  ): Promise<PaginatedLessonsDto> {
    const chapterQuery = { ...query, chapterId };
    return this.contentService.getLessons('guest', chapterQuery);
  }

  @Get('chapter/:chapterId/resources')
  @ApiOperation({ summary: 'Get resources for a specific chapter' })
  @ApiParam({ name: 'chapterId', description: 'Chapter ID' })
  @ApiResponse({ status: 200, description: 'Chapter resources retrieved successfully', type: PaginatedResourcesDto })
  async getChapterResources(
    @Param('chapterId') chapterId: string,
    @Query(new ValidationPipe({ transform: true, whitelist: true })) query: ContentQueryDto,
  ): Promise<PaginatedResourcesDto> {
    const chapterQuery = { ...query, chapterId };
    return this.contentService.getResources('guest', chapterQuery);
  }
}