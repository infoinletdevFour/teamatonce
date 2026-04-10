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
import { AssessmentsService } from './assessments.service';
import {
  CreateAssessmentDto,
  StartAssessmentDto,
  SubmitAssessmentDto,
  AssessmentResponseDto,
  AssessmentAttemptResponseDto,
} from './dto';

@ApiTags('assessments')
@Controller('assessments')
export class AssessmentsController {
  constructor(private readonly assessmentsService: AssessmentsService) {}

  // =============================================
  // ASSESSMENT CRUD OPERATIONS
  // =============================================

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new assessment' })
  @ApiResponse({ status: 201, description: 'Assessment created successfully', type: AssessmentResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createAssessment(
    @Request() req: any,
    @Body(ValidationPipe) createAssessmentDto: CreateAssessmentDto,
  ): Promise<AssessmentResponseDto> {
    return this.assessmentsService.createAssessment(req.user.sub || req.user.userId, createAssessmentDto);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get assessment by ID' })
  @ApiParam({ name: 'id', description: 'Assessment ID' })
  @ApiResponse({ status: 200, description: 'Assessment retrieved successfully', type: AssessmentResponseDto })
  @ApiResponse({ status: 404, description: 'Assessment not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getAssessmentById(@Param('id') id: string): Promise<AssessmentResponseDto> {
    return this.assessmentsService.getAssessmentById(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update assessment (creator only)' })
  @ApiParam({ name: 'id', description: 'Assessment ID' })
  @ApiResponse({ status: 200, description: 'Assessment updated successfully', type: AssessmentResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not assessment creator' })
  @ApiResponse({ status: 404, description: 'Assessment not found' })
  async updateAssessment(
    @Request() req: any,
    @Param('id') id: string,
    @Body(ValidationPipe) updateAssessmentDto: Partial<CreateAssessmentDto>,
  ): Promise<AssessmentResponseDto> {
    return this.assessmentsService.updateAssessment(req.user.sub || req.user.userId, id, updateAssessmentDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete assessment (creator only)' })
  @ApiParam({ name: 'id', description: 'Assessment ID' })
  @ApiResponse({ status: 204, description: 'Assessment deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not assessment creator' })
  @ApiResponse({ status: 404, description: 'Assessment not found' })
  async deleteAssessment(@Request() req: any, @Param('id') id: string): Promise<void> {
    return this.assessmentsService.deleteAssessment(req.user.sub || req.user.userId, id);
  }

  @Post(':id/publish')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Publish assessment (creator only)' })
  @ApiParam({ name: 'id', description: 'Assessment ID' })
  @ApiResponse({ status: 200, description: 'Assessment published successfully', type: AssessmentResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - not assessment creator' })
  @ApiResponse({ status: 404, description: 'Assessment not found' })
  async publishAssessment(
    @Request() req: any,
    @Param('id') id: string,
  ): Promise<AssessmentResponseDto> {
    return this.assessmentsService.publishAssessment(req.user.sub || req.user.userId, id);
  }

  // =============================================
  // ASSESSMENT ATTEMPTS
  // =============================================

  @Post(':id/attempts')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Start a new assessment attempt' })
  @ApiParam({ name: 'id', description: 'Assessment ID' })
  @ApiResponse({ status: 201, description: 'Assessment attempt started successfully', type: AssessmentAttemptResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid request or max attempts exceeded' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Assessment not found' })
  async startAssessmentAttempt(
    @Request() req: any,
    @Param('id') id: string,
    @Body(ValidationPipe) startAssessmentDto: StartAssessmentDto,
  ): Promise<AssessmentAttemptResponseDto> {
    return this.assessmentsService.startAssessmentAttempt(req.user.sub || req.user.userId, id, startAssessmentDto);
  }

  @Post(':id/submit')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit assessment answers' })
  @ApiParam({ name: 'id', description: 'Assessment Attempt ID' })
  @ApiResponse({ status: 200, description: 'Assessment submitted successfully', type: AssessmentAttemptResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid submission or time exceeded' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not your attempt' })
  @ApiResponse({ status: 404, description: 'Assessment attempt not found' })
  async submitAssessment(
    @Request() req: any,
    @Param('id') attemptId: string,
    @Body(ValidationPipe) submitAssessmentDto: SubmitAssessmentDto,
  ): Promise<AssessmentAttemptResponseDto> {
    return this.assessmentsService.submitAssessment(req.user.sub || req.user.userId, attemptId, submitAssessmentDto);
  }

  @Get(':id/results')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get assessment results' })
  @ApiParam({ name: 'id', description: 'Assessment Attempt ID' })
  @ApiResponse({ status: 200, description: 'Assessment results retrieved successfully', type: AssessmentAttemptResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not your attempt' })
  @ApiResponse({ status: 404, description: 'Assessment attempt not found' })
  async getAssessmentResults(
    @Request() req: any,
    @Param('id') attemptId: string,
  ): Promise<AssessmentAttemptResponseDto> {
    return this.assessmentsService.getAssessmentResults(req.user.sub || req.user.userId, attemptId);
  }

  // =============================================
  // USER ATTEMPTS HISTORY
  // =============================================

  @Get('my/attempts')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user assessment attempts' })
  @ApiResponse({ status: 200, description: 'User attempts retrieved successfully', type: [AssessmentAttemptResponseDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserAssessmentAttempts(
    @Request() req: any,
    @Query('assessmentId') assessmentId?: string,
  ): Promise<AssessmentAttemptResponseDto[]> {
    return this.assessmentsService.getUserAssessmentAttempts(req.user.sub || req.user.userId, assessmentId);
  }

  // =============================================
  // COURSE/LESSON ASSESSMENTS
  // =============================================

  @Get('course/:courseId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get assessments for a course' })
  @ApiParam({ name: 'courseId', description: 'Course ID' })
  @ApiResponse({ status: 200, description: 'Course assessments retrieved successfully', type: [AssessmentResponseDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCourseAssessments(
    @Param('courseId') courseId: string,
  ): Promise<AssessmentResponseDto[]> {
    // This would be implemented in the service to find assessments by course_id
    // For now, returning empty array as placeholder
    return [];
  }

  @Get('lesson/:lessonId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get assessments for a lesson' })
  @ApiParam({ name: 'lessonId', description: 'Lesson ID' })
  @ApiResponse({ status: 200, description: 'Lesson assessments retrieved successfully', type: [AssessmentResponseDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getLessonAssessments(
    @Param('lessonId') lessonId: string,
  ): Promise<AssessmentResponseDto[]> {
    // This would be implemented in the service to find assessments by lesson_id
    // For now, returning empty array as placeholder
    return [];
  }
}