import {
  Controller,
  Get,
  Put,
  Delete,
  Post,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
  BadRequestException,
  ParseFilePipe,
  FileTypeValidator,
  MaxFileSizeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  UpdateUserDto,
  UserPreferencesDto,
  UserQueryDto,
  ActivityQueryDto,
  DeleteAccountDto,
  UserProfileResponseDto,
  PublicUserProfileDto,
  UserPreferencesResponseDto,
  UserActivityResponseDto,
  PaginatedUsersDto,
  AvatarUploadResponseDto,
  MessageResponseDto,
  UserDataExportDto,
} from './dto';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ============================================
  // CURRENT USER PROFILE ENDPOINTS
  // ============================================

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved successfully', type: UserProfileResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getCurrentUser(@Request() req): Promise<UserProfileResponseDto> {
    return this.usersService.getCurrentUser(req.user.sub);
  }

  @Put('me')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'User profile updated successfully', type: UserProfileResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateCurrentUser(
    @Request() req,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserProfileResponseDto> {
    return this.usersService.updateProfile(req.user.sub, updateUserDto);
  }

  @Delete('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete current user account (requires password confirmation)' })
  @ApiResponse({ status: 200, description: 'Account deleted successfully', type: MessageResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid password' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async deleteCurrentUser(
    @Request() req,
    @Body() deleteAccountDto: DeleteAccountDto,
  ): Promise<MessageResponseDto> {
    return this.usersService.deleteAccount(req.user.sub, deleteAccountDto.password);
  }

  // ============================================
  // AVATAR MANAGEMENT ENDPOINTS
  // ============================================

  @Post('avatar')
  @ApiOperation({ summary: 'Upload user avatar' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Avatar uploaded successfully', type: AvatarUploadResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid file' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(),
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
    },
  }))
  async uploadAvatar(
    @Request() req,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new FileTypeValidator({ fileType: /(jpeg|jpg|png|gif|webp)$/ }),
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
        ],
      }),
    )
    file: Express.Multer.File,
  ): Promise<AvatarUploadResponseDto> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (!file.buffer) {
      throw new BadRequestException('File buffer not available');
    }

    return this.usersService.uploadAvatar(req.user.sub, file);
  }

  @Delete('avatar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove user avatar' })
  @ApiResponse({ status: 200, description: 'Avatar removed successfully', type: MessageResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request - No avatar to remove' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async removeAvatar(@Request() req): Promise<MessageResponseDto> {
    return this.usersService.deleteAvatar(req.user.sub);
  }

  // ============================================
  // USER PREFERENCES ENDPOINTS
  // ============================================

  @Get('preferences')
  @ApiOperation({ summary: 'Get user preferences and settings' })
  @ApiResponse({ status: 200, description: 'User preferences retrieved successfully', type: UserPreferencesResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserPreferences(@Request() req): Promise<UserPreferencesResponseDto> {
    return this.usersService.getPreferences(req.user.sub);
  }

  @Put('preferences')
  @ApiOperation({ summary: 'Update user preferences and settings' })
  @ApiResponse({ status: 200, description: 'User preferences updated successfully', type: UserPreferencesResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateUserPreferences(
    @Request() req,
    @Body() userPreferencesDto: UserPreferencesDto,
  ): Promise<UserPreferencesResponseDto> {
    return this.usersService.updatePreferences(req.user.sub, userPreferencesDto);
  }

  // ============================================
  // USER ACTIVITY ENDPOINTS
  // ============================================

  @Get('activity')
  @ApiOperation({ summary: 'Get user activity log with pagination' })
  @ApiResponse({ status: 200, description: 'User activity retrieved successfully', type: UserActivityResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', type: Number })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page', type: Number })
  @ApiQuery({ name: 'activity_type', required: false, description: 'Filter by activity type' })
  async getUserActivity(
    @Request() req,
    @Query() query: ActivityQueryDto,
  ): Promise<UserActivityResponseDto> {
    const { page = 1, limit = 50 } = query;
    const offset = (page - 1) * limit;
    const queryDto = { limit, offset };
    return this.usersService.getUserActivity(req.user.sub, queryDto);
  }

  // ============================================
  // DATA EXPORT ENDPOINT
  // ============================================

  @Get('export')
  @ApiOperation({ summary: 'Export all user data (GDPR compliance)' })
  @ApiResponse({ status: 200, description: 'User data exported successfully', type: UserDataExportDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async exportUserData(@Request() req): Promise<UserDataExportDto> {
    return this.usersService.exportUserData(req.user.sub);
  }

  // ============================================
  // PUBLIC USER ENDPOINTS
  // ============================================

  @Get('search')
  @ApiOperation({ summary: 'Search users by username, full name, or bio' })
  @ApiResponse({ status: 200, description: 'Users found successfully', type: PaginatedUsersDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiQuery({ name: 'search', required: false, description: 'Search term' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', type: Number })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page', type: Number })
  @ApiQuery({ name: 'sort_by', required: false, description: 'Sort by field', enum: ['created_at', 'updated_at', 'username', 'full_name'] })
  @ApiQuery({ name: 'sort_order', required: false, description: 'Sort order', enum: ['asc', 'desc'] })
  async searchUsers(
    @Request() req,
    @Query() query: UserQueryDto,
  ): Promise<PaginatedUsersDto> {
    return this.usersService.searchUsers(query);
  }

  @Get(':id/public-profile')
  @ApiOperation({ summary: 'Get public user profile with client statistics' })
  @ApiResponse({ status: 200, description: 'Public profile with stats retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getPublicProfileWithStats(
    @Param('id') userId: string,
  ) {
    return this.usersService.getPublicProfileWithStats(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get public user profile by ID' })
  @ApiResponse({ status: 200, description: 'User profile retrieved successfully', type: PublicUserProfileDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserById(
    @Request() req,
    @Param('id') userId: string,
  ): Promise<PublicUserProfileDto> {
    return this.usersService.getPublicProfile(userId);
  }
}