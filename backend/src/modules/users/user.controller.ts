import { Controller, Get, Patch, Post, UseGuards, Request, Body, UploadedFile, UseInterceptors, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserPreferencesDto } from './dto/user-preferences.dto';

/**
 * User Controller - Simplified endpoints for frontend compatibility
 * Maps to /user path (note: singular, not plural)
 */
@ApiTags('User')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('user')
export class UserController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@Request() req) {
    const userId = req.user.sub || req.user.userId;

    try {
      // Use REAL UsersService.getCurrentUser method
      const profile = await this.usersService.getCurrentUser(userId);

      // Transform to frontend expected format
      return {
        id: profile.id,
        email: profile.email,
        firstName: profile.name?.split(' ')[0] || '',
        lastName: profile.name?.split(' ').slice(1).join(' ') || '',
        name: profile.name,
        avatar: profile.avatar_url || null,
        phone: profile.phone,
        company: profile.company || '',
        title: profile.title || '',
        location: profile.location || '',
        website: profile.website || '',
        bio: profile.bio || '',
        timezone: profile.timezone || 'UTC',
        language: profile.language || 'en',
        memberSince: profile.created_at,
        updatedAt: profile.updated_at,
      };
    } catch (error) {
      // If user doesn't exist in database yet (new OAuth user), return basic profile from JWT
      return {
        id: userId,
        email: req.user.email,
        firstName: req.user.name?.split(' ')[0] || req.user.email?.split('@')[0] || '',
        lastName: req.user.name?.split(' ').slice(1).join(' ') || '',
        name: req.user.name || req.user.email?.split('@')[0],
        username: req.user.email?.split('@')[0],
        avatar: null,
        phone: null,
        company: '',
        title: '',
        location: null,
        website: null,
        bio: null,
        timezone: 'UTC',
        language: 'en',
        memberSince: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
  }

  @Get('settings')
  @ApiOperation({ summary: 'Get user settings' })
  @ApiResponse({ status: 200, description: 'User settings retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getSettings(@Request() req) {
    const userId = req.user.sub || req.user.userId;

    try {
      // Use REAL UsersService.getPreferences method
      const preferences = await this.usersService.getPreferences(userId);

      // Transform to frontend expected format (expanded structure)
      const prefs = preferences.preferences || {};
      return {
        notifications: {
          email: {
            projectUpdates: prefs.notifications?.email !== false,
            milestoneCompletion: prefs.notifications?.email !== false,
            paymentReminders: prefs.notifications?.email !== false,
            teamMessages: prefs.notifications?.email !== false,
            weeklyDigest: false,
          },
          push: {
            projectUpdates: prefs.notifications?.push !== false,
            teamMessages: prefs.notifications?.push !== false,
            urgentAlerts: prefs.notifications?.push !== false,
          },
          sms: {
            urgentAlerts: false,
            paymentReminders: false,
          }
        },
        preferences: {
          theme: prefs.theme || preferences.timezone || 'light',
          dashboardView: 'cards',
          projectSorting: 'recent',
          autoSave: true,
          compactMode: false,
        },
        company: {
          name: '',
          website: '',
          industry: '',
          size: '',
          address: '',
          city: '',
          state: '',
          postalCode: '',
          country: '',
          taxId: '',
        }
      };
    } catch (error) {
      // Return default settings if error
      return {
        notifications: {
          email: {
            projectUpdates: true,
            milestoneCompletion: true,
            paymentReminders: true,
            teamMessages: true,
            weeklyDigest: false,
          },
          push: {
            projectUpdates: true,
            teamMessages: true,
            urgentAlerts: true,
          },
          sms: {
            urgentAlerts: false,
            paymentReminders: false,
          }
        },
        preferences: {
          theme: 'light',
          dashboardView: 'cards',
          projectSorting: 'recent',
          autoSave: true,
          compactMode: false,
        },
        company: {
          name: '',
          website: '',
          industry: '',
          size: '',
          address: '',
          city: '',
          state: '',
          postalCode: '',
          country: '',
          taxId: '',
        }
      };
    }
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Update user profile' })
  @ApiResponse({ status: 200, description: 'User profile updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateProfile(@Request() req, @Body() profileData: UpdateUserDto) {
    const userId = req.user.sub || req.user.userId;

    try {
      // Use REAL UsersService.updateProfile method
      const updatedProfile = await this.usersService.updateProfile(userId, profileData);

      // Transform to frontend expected format
      return {
        ...updatedProfile,
        firstName: updatedProfile.name?.split(' ')[0] || '',
        lastName: updatedProfile.name?.split(' ').slice(1).join(' ') || '',
        avatar: updatedProfile.avatar_url,
        memberSince: updatedProfile.created_at,
        updatedAt: updatedProfile.updated_at,
      };
    } catch (error) {
      throw error;
    }
  }

  @Patch('settings')
  @ApiOperation({ summary: 'Update user settings' })
  @ApiResponse({ status: 200, description: 'User settings updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateSettings(@Request() req, @Body() settingsData: UserPreferencesDto) {
    const userId = req.user.sub || req.user.userId;

    try {
      // Use REAL UsersService.updatePreferences method
      await this.usersService.updatePreferences(userId, settingsData);

      // Return updated settings in frontend format
      return await this.getSettings(req);
    } catch (error) {
      throw error;
    }
  }

  @Post('avatar')
  @UseInterceptors(FileInterceptor('avatar', {
    storage: memoryStorage(),
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB max
    },
    fileFilter: (req, file, callback) => {
      // Only allow image files
      if (!file.mimetype.match(/^image\/(jpeg|jpg|png|gif|webp)$/)) {
        return callback(new BadRequestException('Only image files are allowed'), false);
      }
      callback(null, true);
    },
  }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        avatar: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiOperation({ summary: 'Upload user avatar' })
  @ApiResponse({ status: 200, description: 'Avatar uploaded successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async uploadAvatar(@Request() req, @UploadedFile() file: Express.Multer.File) {
    const userId = req.user.sub || req.user.userId;

    if (!file) {
      throw new BadRequestException('No file provided');
    }

    if (!file.buffer) {
      throw new BadRequestException('File buffer not available. Ensure memory storage is configured.');
    }

    try {
      // Use REAL UsersService.uploadAvatar method
      const result = await this.usersService.uploadAvatar(userId, file);

      // Return in camelCase format expected by frontend
      return {
        avatarUrl: result.avatar_url,
        message: result.message
      };
    } catch (error) {
      throw error;
    }
  }

  @Post('password')
  @ApiOperation({ summary: 'Update user password' })
  @ApiResponse({ status: 200, description: 'Password updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Invalid current password' })
  async updatePassword(@Request() req, @Body() passwordData: { currentPassword: string; newPassword: string }) {
    const userId = req.user.sub || req.user.userId;

    // Password management is handled by database on the client side
    // This endpoint returns a message explaining how to change passwords
    return {
      success: false,
      message: 'Password changes must be performed through the auth serviceentication service. ' +
               'Please use the password reset flow in the frontend or contact support.'
    };
  }
}
