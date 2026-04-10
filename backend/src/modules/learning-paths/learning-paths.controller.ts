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
  NotFoundException,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LearningPathsService } from './learning-paths.service';
import {
  CreateLearningPathDto,
  UpdateLearningPathDto,
  AddCourseToPathDto,
  UpdateCourseOrderDto,
  LearningPathQueryDto,
  LearningPathResponseDto,
  LearningPathWithCoursesDto,
  LearningPathCourseDto,
  LearningPathEnrollmentDto,
  PaginatedLearningPathsDto,
} from './dto';

@ApiTags('learning-paths')
@Controller('learning-paths')
export class LearningPathsController {
  constructor(private readonly learningPathsService: LearningPathsService) {}

  // =============================================
  // PUBLIC ENDPOINTS
  // =============================================

  @Get()
  @ApiOperation({ summary: 'Get all published learning paths' })
  @ApiResponse({ status: 200, description: 'Learning paths retrieved successfully', type: PaginatedLearningPathsDto })
  async getLearningPaths(
    @Query(new ValidationPipe({ transform: true, whitelist: true })) query: LearningPathQueryDto,
  ): Promise<PaginatedLearningPathsDto> {
    return this.learningPathsService.getLearningPaths(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get learning path by ID with courses' })
  @ApiParam({ name: 'id', description: 'Learning path ID' })
  @ApiResponse({ status: 200, description: 'Learning path retrieved successfully', type: LearningPathWithCoursesDto })
  @ApiResponse({ status: 404, description: 'Learning path not found' })
  async getLearningPathById(@Param('id') id: string): Promise<LearningPathWithCoursesDto> {
    return this.learningPathsService.getLearningPathById(id);
  }

  // =============================================
  // AUTHENTICATED ENDPOINTS
  // =============================================

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new learning path' })
  @ApiResponse({ status: 201, description: 'Learning path created successfully', type: LearningPathResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createLearningPath(
    @Request() req: any,
    @Body(ValidationPipe) createLearningPathDto: CreateLearningPathDto,
  ): Promise<LearningPathResponseDto> {
    return this.learningPathsService.createLearningPath(req.user.sub || req.user.userId, createLearningPathDto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update learning path (creator only)' })
  @ApiParam({ name: 'id', description: 'Learning path ID' })
  @ApiResponse({ status: 200, description: 'Learning path updated successfully', type: LearningPathResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not path creator' })
  @ApiResponse({ status: 404, description: 'Learning path not found' })
  async updateLearningPath(
    @Request() req: any,
    @Param('id') id: string,
    @Body(ValidationPipe) updateLearningPathDto: UpdateLearningPathDto,
  ): Promise<LearningPathResponseDto> {
    return this.learningPathsService.updateLearningPath(req.user.sub || req.user.userId, id, updateLearningPathDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete learning path (creator only)' })
  @ApiParam({ name: 'id', description: 'Learning path ID' })
  @ApiResponse({ status: 204, description: 'Learning path deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not path creator' })
  @ApiResponse({ status: 404, description: 'Learning path not found' })
  async deleteLearningPath(@Request() req: any, @Param('id') id: string): Promise<void> {
    return this.learningPathsService.deleteLearningPath(req.user.sub || req.user.userId, id);
  }

  // =============================================
  // COURSE MANAGEMENT ENDPOINTS
  // =============================================

  @Post(':id/courses')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add course to learning path' })
  @ApiParam({ name: 'id', description: 'Learning path ID' })
  @ApiResponse({ status: 201, description: 'Course added to path successfully', type: LearningPathCourseDto })
  @ApiResponse({ status: 400, description: 'Invalid input data or course already in path' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not path creator' })
  @ApiResponse({ status: 404, description: 'Learning path or course not found' })
  async addCourseToPath(
    @Request() req: any,
    @Param('id') id: string,
    @Body(ValidationPipe) addCourseDto: AddCourseToPathDto,
  ): Promise<LearningPathCourseDto> {
    return this.learningPathsService.addCourseToPath(req.user.sub || req.user.userId, id, addCourseDto);
  }

  @Delete(':pathId/courses/:courseId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove course from learning path' })
  @ApiParam({ name: 'pathId', description: 'Learning path ID' })
  @ApiParam({ name: 'courseId', description: 'Course ID' })
  @ApiResponse({ status: 204, description: 'Course removed from path successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not path creator' })
  @ApiResponse({ status: 404, description: 'Learning path or course not found' })
  async removeCourseFromPath(
    @Request() req: any,
    @Param('pathId') pathId: string,
    @Param('courseId') courseId: string,
  ): Promise<void> {
    return this.learningPathsService.removeCourseFromPath(req.user.sub || req.user.userId, pathId, courseId);
  }

  @Put(':pathId/courses/:courseId/order')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update course order in learning path' })
  @ApiParam({ name: 'pathId', description: 'Learning path ID' })
  @ApiParam({ name: 'courseId', description: 'Course ID' })
  @ApiResponse({ status: 200, description: 'Course order updated successfully', type: LearningPathCourseDto })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not path creator' })
  @ApiResponse({ status: 404, description: 'Learning path or course not found' })
  async updateCourseOrder(
    @Request() req: any,
    @Param('pathId') pathId: string,
    @Param('courseId') courseId: string,
    @Body(ValidationPipe) updateOrderDto: UpdateCourseOrderDto,
  ): Promise<LearningPathCourseDto> {
    return this.learningPathsService.updateCourseOrder(req.user.sub || req.user.userId, pathId, courseId, updateOrderDto);
  }

  // =============================================
  // ENROLLMENT ENDPOINTS
  // =============================================

  @Post(':id/enroll')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Enroll in a learning path' })
  @ApiParam({ name: 'id', description: 'Learning path ID' })
  @ApiResponse({ status: 201, description: 'Enrolled successfully', type: LearningPathEnrollmentDto })
  @ApiResponse({ status: 400, description: 'Already enrolled or path not available' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Learning path not found' })
  async enrollInLearningPath(
    @Request() req: any,
    @Param('id') id: string,
  ): Promise<LearningPathEnrollmentDto> {
    return this.learningPathsService.enrollInLearningPath(req.user.sub || req.user.userId, id);
  }

  @Get(':id/progress')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get learning path progress for current user' })
  @ApiParam({ name: 'id', description: 'Learning path ID' })
  @ApiResponse({ status: 200, description: 'Progress retrieved successfully', type: LearningPathEnrollmentDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not enrolled in learning path' })
  async getLearningPathProgress(
    @Request() req: any,
    @Param('id') id: string,
  ): Promise<LearningPathEnrollmentDto> {
    return this.learningPathsService.getLearningPathProgress(req.user.sub || req.user.userId, id);
  }

  @Post(':pathId/courses/:courseId/complete')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark course as completed in learning path' })
  @ApiParam({ name: 'pathId', description: 'Learning path ID' })
  @ApiParam({ name: 'courseId', description: 'Course ID' })
  @ApiResponse({ status: 200, description: 'Course marked as completed', type: LearningPathEnrollmentDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Not enrolled in learning path' })
  async updateLearningPathProgress(
    @Request() req: any,
    @Param('pathId') pathId: string,
    @Param('courseId') courseId: string,
  ): Promise<LearningPathEnrollmentDto> {
    return this.learningPathsService.updateLearningPathProgress(req.user.sub || req.user.userId, pathId, courseId);
  }

  // =============================================
  // CREATOR ENDPOINTS
  // =============================================

  @Get('my/paths')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get creator learning paths' })
  @ApiResponse({ status: 200, description: 'Creator learning paths retrieved successfully', type: PaginatedLearningPathsDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCreatorLearningPaths(
    @Request() req: any,
    @Query(new ValidationPipe({ transform: true, whitelist: true })) query: LearningPathQueryDto,
  ): Promise<PaginatedLearningPathsDto> {
    return this.learningPathsService.getCreatorLearningPaths(req.user.sub || req.user.userId, query);
  }

  @Get('my/paths/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get creator learning path by ID (includes private)' })
  @ApiParam({ name: 'id', description: 'Learning path ID' })
  @ApiResponse({ status: 200, description: 'Learning path retrieved successfully', type: LearningPathWithCoursesDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Learning path not found' })
  async getCreatorLearningPathById(
    @Request() req: any,
    @Param('id') id: string,
  ): Promise<LearningPathWithCoursesDto> {
    const path = await this.learningPathsService.getLearningPathById(id, true);
    
    // Verify user is the creator
    if (path.creator_id !== (req.user.sub || req.user.userId)) {
      throw new NotFoundException('Learning path not found');
    }
    
    return path;
  }
}