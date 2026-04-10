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
import { StudyGroupsService } from './study-groups.service';
import {
  CreateStudyGroupDto,
  UpdateStudyGroupDto,
  StudyGroupQueryDto,
  StudyGroupResponseDto,
  PaginatedStudyGroupsDto,
  StudyGroupJoinRequestDto,
  StudyGroupMemberDto,
  StudyGroupEventDto,
} from './dto';

@ApiTags('study-groups')
@Controller('study-groups')
export class StudyGroupsController {
  constructor(private readonly studyGroupsService: StudyGroupsService) {}

  // =============================================
  // PUBLIC ENDPOINTS
  // =============================================

  @Get()
  @ApiOperation({ summary: 'Get all public study groups' })
  @ApiResponse({ status: 200, description: 'Study groups retrieved successfully', type: PaginatedStudyGroupsDto })
  async getStudyGroups(
    @Query(new ValidationPipe({ transform: true, whitelist: true })) query: StudyGroupQueryDto,
  ): Promise<PaginatedStudyGroupsDto> {
    // For public endpoint, we pass a guest user ID
    return this.studyGroupsService.getStudyGroups('guest', query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get study group by ID' })
  @ApiParam({ name: 'id', description: 'Study Group ID' })
  @ApiResponse({ status: 200, description: 'Study group retrieved successfully', type: StudyGroupResponseDto })
  @ApiResponse({ status: 404, description: 'Study group not found' })
  async getStudyGroupById(@Param('id') id: string): Promise<StudyGroupResponseDto> {
    return this.studyGroupsService.getStudyGroupById('guest', id);
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'Get study group members (public groups only)' })
  @ApiParam({ name: 'id', description: 'Study Group ID' })
  @ApiResponse({ status: 200, description: 'Members retrieved successfully', type: [StudyGroupMemberDto] })
  @ApiResponse({ status: 403, description: 'Cannot view members of private group' })
  @ApiResponse({ status: 404, description: 'Study group not found' })
  async getStudyGroupMembers(@Param('id') id: string): Promise<StudyGroupMemberDto[]> {
    return this.studyGroupsService.getStudyGroupMembers('guest', id);
  }

  // =============================================
  // AUTHENTICATED ENDPOINTS
  // =============================================

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new study group' })
  @ApiResponse({ status: 201, description: 'Study group created successfully', type: StudyGroupResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async createStudyGroup(
    @Request() req: any,
    @Body(ValidationPipe) createStudyGroupDto: CreateStudyGroupDto,
  ): Promise<StudyGroupResponseDto> {
    return this.studyGroupsService.createStudyGroup(req.user.sub || req.user.userId, createStudyGroupDto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update study group (owner/admin only)' })
  @ApiParam({ name: 'id', description: 'Study Group ID' })
  @ApiResponse({ status: 200, description: 'Study group updated successfully', type: StudyGroupResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Study group not found' })
  async updateStudyGroup(
    @Request() req: any,
    @Param('id') id: string,
    @Body(ValidationPipe) updateStudyGroupDto: UpdateStudyGroupDto,
  ): Promise<StudyGroupResponseDto> {
    return this.studyGroupsService.updateStudyGroup(req.user.sub || req.user.userId, id, updateStudyGroupDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete study group (owner only)' })
  @ApiParam({ name: 'id', description: 'Study Group ID' })
  @ApiResponse({ status: 204, description: 'Study group deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - only owner can delete' })
  @ApiResponse({ status: 404, description: 'Study group not found' })
  async deleteStudyGroup(@Request() req: any, @Param('id') id: string): Promise<void> {
    return this.studyGroupsService.deleteStudyGroup(req.user.sub || req.user.userId, id);
  }

  // =============================================
  // MEMBERSHIP ENDPOINTS
  // =============================================

  @Post(':id/join')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Join a study group' })
  @ApiParam({ name: 'id', description: 'Study Group ID' })
  @ApiResponse({ status: 201, description: 'Successfully joined group or join request created', type: StudyGroupResponseDto })
  @ApiResponse({ status: 400, description: 'Cannot join group' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Study group not found' })
  @ApiResponse({ status: 409, description: 'Already a member or group is full' })
  async joinStudyGroup(
    @Request() req: any,
    @Param('id') id: string,
    @Body(ValidationPipe) joinRequest?: StudyGroupJoinRequestDto,
  ): Promise<StudyGroupResponseDto> {
    return this.studyGroupsService.joinStudyGroup(req.user.sub || req.user.userId, id, joinRequest);
  }

  @Post(':id/leave')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Leave a study group' })
  @ApiParam({ name: 'id', description: 'Study Group ID' })
  @ApiResponse({ status: 204, description: 'Successfully left the group' })
  @ApiResponse({ status: 400, description: 'Cannot leave group (not a member or is owner)' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Study group not found' })
  async leaveStudyGroup(@Request() req: any, @Param('id') id: string): Promise<void> {
    return this.studyGroupsService.leaveStudyGroup(req.user.sub || req.user.userId, id);
  }

  @Get(':id/members/authenticated')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get study group members (authenticated)' })
  @ApiParam({ name: 'id', description: 'Study Group ID' })
  @ApiResponse({ status: 200, description: 'Members retrieved successfully', type: [StudyGroupMemberDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Cannot view members - not a member' })
  @ApiResponse({ status: 404, description: 'Study group not found' })
  async getStudyGroupMembersAuthenticated(
    @Request() req: any,
    @Param('id') id: string,
  ): Promise<StudyGroupMemberDto[]> {
    return this.studyGroupsService.getStudyGroupMembers(req.user.sub || req.user.userId, id);
  }

  // =============================================
  // USER STUDY GROUPS ENDPOINTS
  // =============================================

  @Get('my/groups')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user study groups' })
  @ApiResponse({ status: 200, description: 'User study groups retrieved successfully', type: [StudyGroupResponseDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserStudyGroups(
    @Request() req: any,
    @Query(new ValidationPipe({ transform: true, whitelist: true })) query: Partial<StudyGroupQueryDto>,
  ): Promise<StudyGroupResponseDto[]> {
    return this.studyGroupsService.getUserStudyGroups(req.user.sub || req.user.userId, query);
  }

  @Get('my/groups/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get detailed study group info (members only)' })
  @ApiParam({ name: 'id', description: 'Study Group ID' })
  @ApiResponse({ status: 200, description: 'Study group details retrieved successfully', type: StudyGroupResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Not a member of this group' })
  @ApiResponse({ status: 404, description: 'Study group not found' })
  async getMyStudyGroupDetails(@Request() req: any, @Param('id') id: string): Promise<StudyGroupResponseDto> {
    return this.studyGroupsService.getStudyGroupById(req.user.sub || req.user.userId, id, true);
  }

  // =============================================
  // EVENTS ENDPOINTS
  // =============================================

  @Post(':id/events')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create study group event (owner/admin/moderator only)' })
  @ApiParam({ name: 'id', description: 'Study Group ID' })
  @ApiResponse({ status: 201, description: 'Event created successfully', type: StudyGroupEventDto })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Study group not found' })
  async createStudyGroupEvent(
    @Request() req: any,
    @Param('id') id: string,
    @Body(ValidationPipe) eventData: Partial<StudyGroupEventDto>,
  ): Promise<StudyGroupEventDto> {
    return this.studyGroupsService.createStudyGroupEvent(req.user.sub || req.user.userId, id, eventData);
  }

  // =============================================
  // AUTHENTICATED SEARCH ENDPOINTS
  // =============================================

  @Get('search/authenticated')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Search study groups (authenticated - includes private groups user is member of)' })
  @ApiResponse({ status: 200, description: 'Study groups retrieved successfully', type: PaginatedStudyGroupsDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async searchStudyGroupsAuthenticated(
    @Request() req: any,
    @Query(new ValidationPipe({ transform: true, whitelist: true })) query: StudyGroupQueryDto,
  ): Promise<PaginatedStudyGroupsDto> {
    return this.studyGroupsService.getStudyGroups(req.user.sub || req.user.userId, query);
  }
}