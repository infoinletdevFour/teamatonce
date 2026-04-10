import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { 
  UpdateUserDto, 
  UserPreferencesDto, 
  UserQueryDto,
  MessageResponseDto,
  UserPreferencesResponseDto,
  PublicUserProfileDto
} from './dto';

@Injectable()
export class UsersService {
  constructor(private readonly db: DatabaseService) {}

  // ============================================
  // USER PROFILE MANAGEMENT
  // ============================================

  async getCurrentUser(userId: string) {
    try {
      // Use the SDK's getUserById to get the full user profile
      const response = await this.db.getUserById(userId);

      if (!response || !response.user) {
        throw new NotFoundException('User not found');
      }

      // database returns { success: true, user: {...} }
      // Note: Runtime data uses camelCase, but TypeScript types use snake_case (SDK bug)
      const user: any = response.user;
      const metadata = user.metadata || {};

      // Calculate profile completion percentage
      const profileFields = [
        user.fullName,
        metadata.username,
        metadata.bio,
        metadata.location,
        metadata.website,
        metadata.avatar,
        metadata.phone,
        metadata.dateOfBirth,
        metadata.gender
      ];
      const filledFields = profileFields.filter(field => field !== null && field !== undefined && field !== '').length;
      const profileCompletion = Math.round((filledFields / profileFields.length) * 100);

      return {
        // Core database fields (top level)
        id: user.id,
        email: user.email,
        name: user.fullName || metadata.full_name || user.name,
        email_verified: user.emailVerified || false,
        phone_verified: user.phoneVerified || false,
        last_login_at: user.lastSignInAt,

        // Extended profile fields (from metadata)
        username: metadata.username,
        phone: metadata.phone,
        avatar_url: metadata.avatar,
        bio: metadata.bio,
        location: metadata.location,
        website: metadata.website,
        date_of_birth: metadata.dateOfBirth,
        gender: metadata.gender,
        company: metadata.company,
        title: metadata.title,

        // Preferences from metadata JSONB
        social_links: metadata.social_links || {},
        interests: metadata.interests || [],
        preferences: metadata.preferences || this.getDefaultPreferences(),
        timezone: metadata.timezone || 'UTC',
        language: metadata.language || 'en',

        // Timestamps (camelCase in runtime)
        created_at: user.createdAt,
        updated_at: user.updatedAt,

        // Additional computed fields
        profile_completion: profileCompletion
      };
    } catch (error) {
      throw new BadRequestException('Failed to retrieve user profile: ' + error.message);
    }
  }

  async updateProfile(userId: string, dto: UpdateUserDto) {
    try {
      // Get current user to merge metadata
      const response = await this.db.getUserById(userId);
      const currentUser: any = response?.user;

      // Prepare update data - only core database fields at top level
      const updateData: any = {};

      // Core database fields (only these exist at user level)
      if (dto.email !== undefined) updateData.email = dto.email;
      if (dto.name !== undefined) {
        updateData.fullName = dto.name;
        updateData.name = dto.name; // Some SDKs use 'name' instead of 'fullName'
      }

      // All other fields go into metadata
      const metadata: any = {
        ...(currentUser?.metadata || {})
      };

      // Extended profile fields in metadata
      if (dto.name !== undefined) metadata.full_name = dto.name;
      if (dto.username !== undefined) metadata.username = dto.username;
      if (dto.phone !== undefined) metadata.phone = dto.phone;
      if (dto.bio !== undefined) metadata.bio = dto.bio;
      if (dto.location !== undefined) metadata.location = dto.location;
      if (dto.website !== undefined) metadata.website = dto.website;
      if (dto.dateOfBirth !== undefined) metadata.dateOfBirth = dto.dateOfBirth;
      if (dto.gender !== undefined) metadata.gender = dto.gender;
      if (dto.timezone !== undefined) metadata.timezone = dto.timezone;
      if (dto.language !== undefined) metadata.language = dto.language;
      if (dto.company !== undefined) metadata.company = dto.company;
      if (dto.title !== undefined) metadata.title = dto.title;
      if (dto.avatar !== undefined) metadata.avatar = dto.avatar;

      // Update metadata
      updateData.metadata = metadata;

      // Use database's updateUser method (works with service key)
      await this.db.updateUser(userId, updateData);

      // Log activity (non-blocking)
      await this.logActivity(userId, 'profile_updated', 'User profile updated');

      // Return updated profile
      return await this.getCurrentUser(userId);
    } catch (error) {
      throw new BadRequestException('Failed to update profile: ' + error.message);
    }
  }

  async deleteAccount(userId: string, password: string): Promise<MessageResponseDto> {
    // Account deletion should be done through proper auth endpoints
    // with user's JWT token, not with service key
    // For now, return a message indicating the limitation
    return {
      message: 'Account deletion must be performed through authentication service. ' +
        'Please use the proper auth endpoint with your user credentials.'
    };
  }

  // ============================================
  // AVATAR MANAGEMENT
  // ============================================

  async uploadAvatar(userId: string, file: Express.Multer.File) {
    try {
      // Upload file to storage service - this works with service key
      const fileData = {
        bucket: 'avatars',
        path: `${userId}/${Date.now()}-${file.originalname}`,
        file: file.buffer,
        contentType: file.mimetype,
      };

      const uploadResult = await /* TODO: use StorageService */ this.db.uploadFile('avatars', file.buffer, fileData.path, {
        contentType: file.mimetype,
        upsert: true,
      });

      if (!uploadResult || !uploadResult.url) {
        throw new BadRequestException('Failed to upload avatar');
      }

      const avatarUrl = uploadResult.url;

      // Update user metadata with the new avatar URL
      const userResponse = await this.db.getUserById(userId);
      const currentUser: any = userResponse?.user;
      const updatedMetadata = {
        ...(currentUser?.metadata || {}),
        avatar: avatarUrl,
      };

      await this.db.updateUser(userId, {
        metadata: updatedMetadata,
      });

      // Log activity
      await this.logActivity(userId, 'avatar_uploaded', 'Avatar uploaded');

      // Use the URL directly from the upload result
      return {
        avatar_url: avatarUrl,
        message: 'Avatar uploaded successfully.'
      };
    } catch (error) {
      throw new BadRequestException('Failed to upload avatar: ' + error.message);
    }
  }

  async deleteAvatar(userId: string): Promise<MessageResponseDto> {
    // Avatar deletion from auth should be done client-side
    // We can only handle storage deletion here
    // For now, return a message indicating the limitation
    return {
      message: 'Avatar deletion must be performed client-side. ' +
        'Use the frontend application to remove your avatar.'
    };
  }

  // ============================================
  // PREFERENCES MANAGEMENT
  // ============================================

  async getPreferences(userId: string) {
    // Preferences are stored in auth.metadata which requires user JWT
    // Return default preferences for now
    const defaultPrefs = this.getDefaultPreferences();
    return {
      preferences: defaultPrefs,
      timezone: defaultPrefs.timezone || 'UTC',
      language: defaultPrefs.language || 'en'
    };
  }

  async updatePreferences(userId: string, dto: UserPreferencesDto): Promise<UserPreferencesResponseDto> {
    try {
      // Get current user to merge with existing metadata
      const response = await this.db.getUserById(userId);
      const currentUser: any = response?.user;

      // Merge preferences into metadata
      const updatedMetadata = {
        ...(currentUser?.metadata || {}),
        preferences: dto,
        timezone: dto.timezone,
        language: dto.language
      };

      // Update user with new metadata
      await this.db.updateUser(userId, {
        metadata: updatedMetadata
      });

      // Log activity
      await this.logActivity(userId, 'preferences_updated', 'User preferences updated');

      // Return updated preferences
      return {
        preferences: dto,
        timezone: dto.timezone || 'UTC',
        language: dto.language || 'en'
      };
    } catch (error) {
      throw new BadRequestException('Failed to update preferences: ' + error.message);
    }
  }

  // ============================================
  // USER ACTIVITY
  // ============================================

  async getUserActivity(userId: string, query: UserQueryDto) {
    try {
      // Build query for user_activity table - this works with service key
      const queryBuilder = this.db.table('user_activity')
        .where('user_id', userId);
      
      if (query.startDate) {
        queryBuilder.gte('created_at', new Date(query.startDate));
      }
      if (query.endDate) {
        queryBuilder.lte('created_at', new Date(query.endDate));
      }

      const limit = query.limit || 20;
      const offset = query.offset || 0;
      
      queryBuilder
        .orderBy('created_at', 'desc')
        .limit(limit)
        .offset(offset);

      const result = await queryBuilder.execute();
      
      const page = Math.floor(offset / limit) + 1;
      const total_pages = Math.ceil((result.count || 0) / limit);
      
      return {
        data: result.data || [],
        total: result.count || 0,
        page,
        limit,
        total_pages
      };
    } catch (error) {
      throw new BadRequestException('Failed to retrieve activity: ' + error.message);
    }
  }

  async logActivity(userId: string, type: string, description?: string, metadata?: any) {
    try {
      await this.db.insert('user_activity', {
        user_id: userId,
        activity_type: type,
        data: {
          description,
          ...metadata
        },
        ip_address: null, // Should be extracted from request
        user_agent: null, // Should be extracted from request
        created_at: new Date().toISOString()
      });
    } catch (error) {
      // Logging failures shouldn't break the main operation
      console.error('Failed to log activity:', error);
    }
  }

  // ============================================
  // DATA EXPORT
  // ============================================

  async exportUserData(userId: string) {
    try {
      // Note: User profile from auth should be fetched client-side
      // We can only export data from our database tables
      
      // Get all user data from our database tables (not auth)
      const [
        healthProfile,
        fitnessActivities,
        nutritionLogs,
        healthMetrics,
        expenses,
        budgets,
        meditationSessions,
        mentalHealthLogs,
        travelPlans,
        notifications,
        reminders,
        aiGenerations,
        activities
      ] = await Promise.all([
        this.db.findOne('health_profiles', { user_id: userId }).catch(() => null),
        this.db.findMany('fitness_activities', { user_id: userId }).catch(() => []),
        this.db.findMany('nutrition_logs', { user_id: userId }).catch(() => []),
        this.db.findMany('health_metrics', { user_id: userId }).catch(() => []),
        this.db.findMany('expenses', { user_id: userId }).catch(() => []),
        this.db.findMany('budgets', { user_id: userId }).catch(() => []),
        this.db.findMany('meditation_sessions', { user_id: userId }).catch(() => []),
        this.db.findMany('mental_health_logs', { user_id: userId }).catch(() => []),
        this.db.findMany('travel_plans', { user_id: userId }).catch(() => []),
        this.db.findMany('notifications', { user_id: userId }).catch(() => []),
        this.db.findMany('reminders', { user_id: userId }).catch(() => []),
        this.db.findMany('ai_generations', { user_id: userId }).catch(() => []),
        this.db.findMany('user_activity', { user_id: userId }).catch(() => [])
      ]);

      // Log export activity
      await this.logActivity(userId, 'data_exported', 'User data exported');

      return {
        exported_at: new Date().toISOString(),
        user_id: userId,
        data: {
          // Profile should be fetched client-side from auth
          profile: {
            note: 'Profile data should be exported client-side with user authentication'
          },
          health_profile: healthProfile,
          fitness_activities: fitnessActivities,
          nutrition_logs: nutritionLogs,
          health_metrics: healthMetrics,
          expenses: expenses,
          budgets: budgets,
          meditation_sessions: meditationSessions,
          mental_health_logs: mentalHealthLogs,
          travel_plans: travelPlans,
          ai_generations: aiGenerations,
          notifications: notifications,
          reminders: reminders,
          user_activity: activities
        }
      };
    } catch (error) {
      throw new BadRequestException('Failed to export user data: ' + error.message);
    }
  }

  // ============================================
  // PUBLIC PROFILES
  // ============================================

  async getPublicProfile(userId: string): Promise<PublicUserProfileDto> {
    try {
      // Use the SDK's getUserById to get the user profile
      const response = await this.db.getUserById(userId);

      if (!response || !response.user) {
        throw new NotFoundException('User not found');
      }

      const user: any = response.user;
      const metadata = user.metadata || {};

      // Return only public-facing information
      return {
        id: user.id,
        username: metadata.username,
        full_name: user.fullName,
        bio: metadata.bio,
        avatar_url: metadata.avatar,
        location: metadata.location,
        website: metadata.website,
        created_at: user.createdAt,
        is_own_profile: false // This should be determined by comparing with current user
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to retrieve public profile: ' + error.message);
    }
  }

  async getPublicProfileWithStats(userId: string) {
    try {
      // Get basic user profile from auth service
      const response = await this.db.getUserById(userId);

      if (!response || !response.user) {
        throw new NotFoundException('User not found');
      }

      const user: any = response.user;
      const metadata = user.metadata || {};

      // Get client statistics from projects table
      let projectsPosted = 0;
      let projectsCompleted = 0;
      let totalSpent = 0;

      try {
        // Get all projects where this user is the client
        const allProjects = await this.db.findMany('projects', {
          client_id: userId,
          deleted_at: null,
        });

        projectsPosted = allProjects.length;

        // Count completed projects
        projectsCompleted = allProjects.filter(
          (p: any) => p.status === 'completed'
        ).length;

        // Calculate total spent (sum of actual_cost for completed projects)
        totalSpent = allProjects.reduce((sum: number, p: any) => {
          if (p.status === 'completed' && p.actual_cost) {
            return sum + parseFloat(p.actual_cost);
          }
          return sum;
        }, 0);
      } catch (err) {
        // If projects table query fails, continue with default values
        console.error('Failed to fetch project stats:', err);
      }

      // Get feedback/rating statistics - feedback given by this client
      let averageRatingGiven: number | null = null;
      let totalFeedbacksGiven = 0;
      let ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      let recentFeedbacks: any[] = [];

      try {
        // Get all public feedbacks given by this client
        const allFeedbacks = await this.db.findMany('project_feedback', {
          client_id: userId,
          deleted_at: null,
        });

        totalFeedbacksGiven = allFeedbacks.length;

        if (allFeedbacks.length > 0) {
          // Calculate average rating given
          const totalRating = allFeedbacks.reduce((sum: number, f: any) => sum + (f.rating || 0), 0);
          averageRatingGiven = Number((totalRating / allFeedbacks.length).toFixed(1));

          // Calculate rating distribution
          allFeedbacks.forEach((f: any) => {
            if (f.rating >= 1 && f.rating <= 5) {
              ratingDistribution[f.rating as 1 | 2 | 3 | 4 | 5]++;
            }
          });

          // Get recent public feedbacks (last 5) with project info
          const publicFeedbacks = allFeedbacks
            .filter((f: any) => f.is_public)
            .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 5);

          // Enrich feedbacks with project info
          for (const feedback of publicFeedbacks) {
            try {
              const project = await this.db.findOne('projects', { id: feedback.project_id });
              recentFeedbacks.push({
                id: feedback.id,
                rating: feedback.rating,
                title: feedback.title,
                content: feedback.content,
                feedbackType: feedback.feedback_type,
                createdAt: feedback.created_at,
                project: project ? {
                  id: project.id,
                  name: project.name,
                } : null,
              });
            } catch {
              // Skip feedback if project lookup fails
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch feedback stats:', err);
      }

      // Return public profile with stats
      return {
        id: user.id,
        name: user.fullName || user.name || metadata.full_name || metadata.username,
        email: user.email,
        avatar: metadata.avatar || user.avatarUrl,
        role: user.role || 'client', // ✅ FIXED: Read from direct role column, NOT from metadata
        createdAt: user.createdAt,
        // Client statistics
        projectsPosted,
        projectsCompleted,
        totalSpent,
        // Feedback statistics
        averageRatingGiven,
        totalFeedbacksGiven,
        ratingDistribution,
        recentFeedbacks,
        // Additional info
        location: metadata.location,
        timezone: metadata.timezone,
        bio: metadata.bio,
        company: metadata.company,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to retrieve public profile: ' + error.message);
    }
  }

  async searchUsers(query: UserQueryDto) {
    // User search in auth requires proper authentication
    // This should be handled client-side or through a proper auth endpoint
    const limit = query.limit || 20;
    const offset = query.offset || 0;
    const page = Math.floor(offset / limit) + 1;
    
    return {
      data: [],
      message: 'User search must be performed through the authentication service',
      total: 0,
      page,
      limit,
      total_pages: 0
    };
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  private getDefaultPreferences(): UserPreferencesDto {
    return {
      theme: 'light',
      language: 'en',
      timezone: 'UTC',
      notifications: {
        email: true,
        push: true,
        in_app: true
      },
      privacy: {
        profile_visibility: 'public',
        show_activity: true,
        show_stats: true
      },
      features: {
        health_tracking: true,
        fitness_tracking: true,
        finance_tracking: true,
        meditation_tracking: true,
        travel_planning: true
      }
    };
  }
}