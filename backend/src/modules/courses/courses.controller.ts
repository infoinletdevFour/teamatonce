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
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiParam, ApiQuery, ApiConsumes } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CoursesService } from './courses.service';
import {
  CreateCourseDto,
  UpdateCourseDto,
  CourseQueryDto,
  CourseEnrollmentDto,
  CourseProgressDto,
  CourseResponseDto,
  CourseEnrollmentResponseDto,
  PaginatedCoursesDto,
} from './dto';

@ApiTags('courses')
@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  // =============================================
  // PUBLIC ENDPOINTS
  // =============================================

  @Get()
  @ApiOperation({ summary: 'Get all published courses' })
  @ApiResponse({ status: 200, description: 'Courses retrieved successfully', type: PaginatedCoursesDto })
  async getCourses(
    @Query(new ValidationPipe({ transform: true, whitelist: true })) query: CourseQueryDto,
  ): Promise<PaginatedCoursesDto> {
    return this.coursesService.getCourses(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get course by ID' })
  @ApiParam({ name: 'id', description: 'Course ID' })
  @ApiResponse({ status: 200, description: 'Course retrieved successfully', type: CourseResponseDto })
  @ApiResponse({ status: 404, description: 'Course not found' })
  async getCourseById(@Param('id') id: string): Promise<CourseResponseDto> {
    return this.coursesService.getCourseById(id);
  }

  // =============================================
  // AUTHENTICATED ENDPOINTS
  // =============================================

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('thumbnail'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Create a new course (instructor only)' })
  @ApiResponse({ status: 201, description: 'Course created successfully', type: CourseResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createCourse(
    @Request() req: any,
    @Body() body: any,
    @UploadedFile() thumbnail?: Express.Multer.File,
  ): Promise<CourseResponseDto> {
    // Parse JSON strings from form-data
    try {
      const createCourseDto: CreateCourseDto = {
        title: body.title,
        subtitle: body.subtitle,
        description: body.description,
        category: body.category,
        subcategory: body.subcategory,
        level: body.level,
        language: body.language,
        price: body.price ? parseFloat(body.price) : undefined,
        originalPrice: body.originalPrice ? parseFloat(body.originalPrice) : undefined,
        currency: body.currency,
        refundPolicy: body.refundPolicy ? parseInt(body.refundPolicy) : undefined,
        thumbnailUrl: body.thumbnailUrl,
        promoVideoUrl: body.promoVideoUrl,
        promoVideoType: body.promoVideoType,
        tags: body.tags ? (typeof body.tags === 'string' ? JSON.parse(body.tags) : body.tags) : undefined,
        prerequisites: body.prerequisites ? (typeof body.prerequisites === 'string' ? JSON.parse(body.prerequisites) : body.prerequisites) : undefined,
        learningOutcomes: body.learningOutcomes ? (typeof body.learningOutcomes === 'string' ? JSON.parse(body.learningOutcomes) : body.learningOutcomes) : undefined,
        targetAudience: body.targetAudience ? (typeof body.targetAudience === 'string' ? JSON.parse(body.targetAudience) : body.targetAudience) : undefined,
        modules: body.modules ? (typeof body.modules === 'string' ? JSON.parse(body.modules) : body.modules) : undefined,
        certificateEnabled: body.certificateEnabled === 'true' || body.certificateEnabled === true,
        discussionEnabled: body.discussionEnabled === 'true' || body.discussionEnabled === true,
        qnaEnabled: body.qnaEnabled === 'true' || body.qnaEnabled === true,
        downloadableResources: body.downloadableResources === 'true' || body.downloadableResources === true,
        mobileAccess: body.mobileAccess === 'true' || body.mobileAccess === true,
        lifetimeAccess: body.lifetimeAccess === 'true' || body.lifetimeAccess === true,
        certificateSettings: body.certificateSettings ? (typeof body.certificateSettings === 'string' ? JSON.parse(body.certificateSettings) : body.certificateSettings) : undefined,
        publishSettings: body.publishSettings ? (typeof body.publishSettings === 'string' ? JSON.parse(body.publishSettings) : body.publishSettings) : undefined,
        seoSettings: body.seoSettings ? (typeof body.seoSettings === 'string' ? JSON.parse(body.seoSettings) : body.seoSettings) : undefined,
      };

      return this.coursesService.createCourse(req.user.sub || req.user.userId, createCourseDto, thumbnail);
    } catch (error) {
      throw new BadRequestException(`Invalid request data: ${error.message}`);
    }
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update course (instructor only)' })
  @ApiParam({ name: 'id', description: 'Course ID' })
  @ApiResponse({ status: 200, description: 'Course updated successfully', type: CourseResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not course instructor' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  async updateCourse(
    @Request() req: any,
    @Param('id') id: string,
    @Body(ValidationPipe) updateCourseDto: UpdateCourseDto,
  ): Promise<CourseResponseDto> {
    return this.coursesService.updateCourse(req.user.sub || req.user.userId, id, updateCourseDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete course (instructor only)' })
  @ApiParam({ name: 'id', description: 'Course ID' })
  @ApiResponse({ status: 204, description: 'Course deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not course instructor' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  async deleteCourse(@Request() req: any, @Param('id') id: string): Promise<void> {
    return this.coursesService.deleteCourse(req.user.sub || req.user.userId, id);
  }

  // =============================================
  // ENROLLMENT ENDPOINTS
  // =============================================

  @Post(':id/enroll')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Enroll in a course' })
  @ApiParam({ name: 'id', description: 'Course ID' })
  @ApiResponse({ status: 201, description: 'Enrolled successfully', type: CourseEnrollmentResponseDto })
  @ApiResponse({ status: 400, description: 'Already enrolled or invalid data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  async enrollInCourse(
    @Request() req: any,
    @Param('id') id: string,
    @Body(ValidationPipe) enrollmentDto: CourseEnrollmentDto,
  ): Promise<CourseEnrollmentResponseDto> {
    return this.coursesService.enrollInCourse(req.user.sub || req.user.userId, id, enrollmentDto);
  }

  @Get(':id/progress')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get course progress for current user' })
  @ApiParam({ name: 'id', description: 'Course ID' })
  @ApiResponse({ status: 200, description: 'Progress retrieved successfully', type: CourseEnrollmentResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not enrolled in course' })
  async getCourseProgress(
    @Request() req: any,
    @Param('id') id: string,
  ): Promise<CourseEnrollmentResponseDto> {
    return this.coursesService.getCourseProgress(req.user.sub || req.user.userId, id);
  }

  @Put(':id/progress')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update course progress' })
  @ApiParam({ name: 'id', description: 'Course ID' })
  @ApiResponse({ status: 200, description: 'Progress updated successfully', type: CourseEnrollmentResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not enrolled in course' })
  async updateCourseProgress(
    @Request() req: any,
    @Param('id') id: string,
    @Body(ValidationPipe) updateProgressDto: CourseProgressDto,
  ): Promise<CourseEnrollmentResponseDto> {
    return this.coursesService.updateCourseProgress(req.user.sub || req.user.userId, id, updateProgressDto);
  }

  @Post(':courseId/lessons/:lessonId/complete')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark lesson as completed' })
  @ApiParam({ name: 'courseId', description: 'Course ID' })
  @ApiParam({ name: 'lessonId', description: 'Lesson ID' })
  @ApiResponse({ status: 200, description: 'Lesson marked as completed', type: CourseEnrollmentResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not enrolled in course' })
  async completeLessonProgress(
    @Request() req: any,
    @Param('courseId') courseId: string,
    @Param('lessonId') lessonId: string,
  ): Promise<CourseEnrollmentResponseDto> {
    return this.coursesService.completeLessonProgress(req.user.sub || req.user.userId, courseId, lessonId);
  }

  // =============================================
  // USER ENROLLMENT ENDPOINTS
  // =============================================

  @Get('my/enrollments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user enrollments' })
  @ApiResponse({ status: 200, description: 'Enrollments retrieved successfully', type: [CourseEnrollmentResponseDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserEnrollments(
    @Request() req: any,
    @Query(new ValidationPipe({ transform: true, whitelist: true })) query: Partial<CourseQueryDto>,
  ): Promise<CourseEnrollmentResponseDto[]> {
    return this.coursesService.getUserEnrollments(req.user.sub || req.user.userId, query);
  }

  @Get('enrolled')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get enrolled courses' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of courses to return (max 50)' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by enrollment status' })
  @ApiResponse({ status: 200, description: 'Enrolled courses retrieved successfully', type: [CourseResponseDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getEnrolledCourses(
    @Request() req: any,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
  ): Promise<CourseResponseDto[]> {
    const limitValue = Math.min(limit || 20, 50); // Max 50 courses
    return this.coursesService.getEnrolledCoursesWithLimit(req.user.sub || req.user.userId, limitValue);
  }

  @Get('enrolled/limit')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get enrolled courses with limit (legacy endpoint)' })
  @ApiResponse({ status: 200, description: 'Enrolled courses retrieved successfully', type: [CourseResponseDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getEnrolledCoursesWithLimit(
    @Request() req: any,
    @Query('limit') limit?: number,
  ): Promise<CourseResponseDto[]> {
    const limitValue = Math.min(limit || 10, 50); // Max 50 courses
    return this.coursesService.getEnrolledCoursesWithLimit(req.user.sub || req.user.userId, limitValue);
  }

  // =============================================
  // INSTRUCTOR ENDPOINTS
  // =============================================

  @Get('my/courses')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get instructor courses' })
  @ApiResponse({ status: 200, description: 'Instructor courses retrieved successfully', type: PaginatedCoursesDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getInstructorCourses(
    @Request() req: any,
    @Query(new ValidationPipe({ transform: true, whitelist: true })) query: CourseQueryDto,
  ): Promise<PaginatedCoursesDto> {
    return this.coursesService.getInstructorCourses(req.user.sub || req.user.userId, query);
  }

  @Get('my/courses/:id/enrollments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get course enrollments (instructor only)' })
  @ApiParam({ name: 'id', description: 'Course ID' })
  @ApiResponse({ status: 200, description: 'Course enrollments retrieved successfully', type: [CourseEnrollmentResponseDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not course instructor' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  async getCourseEnrollments(
    @Request() req: any,
    @Param('id') id: string,
  ): Promise<CourseEnrollmentResponseDto[]> {
    return this.coursesService.getCourseEnrollments(req.user.sub || req.user.userId, id);
  }
}