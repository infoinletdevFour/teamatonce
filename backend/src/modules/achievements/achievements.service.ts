import { Injectable, BadRequestException } from '@nestjs/common';
import { ProgressService } from '../progress/progress.service';
import {
  ProgressAchievementDto,
  AchievementsCategoryDto,
  AchievementsStatsDto,
} from './dto';

interface AchievementQuery {
  category?: string;
  status?: 'earned' | 'available' | 'locked';
  limit?: number;
}

@Injectable()
export class AchievementsService {
  constructor(private readonly progressService: ProgressService) {}

  async getUserAchievements(userId: string, query: AchievementQuery = {}): Promise<ProgressAchievementDto[]> {
    try {
      const { category, status, limit = 50 } = query;

      // Get achievements from progress service
      let achievements = await this.progressService.getUserAchievements(userId);
      
      // Get all available achievements
      const allAchievements = await this.getAllPossibleAchievements(userId);
      
      // Filter based on status
      if (status === 'earned') {
        achievements = achievements; // Already earned
      } else if (status === 'available') {
        achievements = allAchievements.filter(achievement => 
          !achievements.find(earned => earned.id === achievement.id) &&
          this.isAchievementAvailable(achievement, userId)
        );
      } else if (status === 'locked') {
        achievements = allAchievements.filter(achievement => 
          !achievements.find(earned => earned.id === achievement.id) &&
          !this.isAchievementAvailable(achievement, userId)
        );
      } else {
        // Return all achievements with their status
        const earnedIds = achievements.map(a => a.id);
        achievements = allAchievements.map(achievement => ({
          ...achievement,
          earnedAt: earnedIds.includes(achievement.id) ? 
            achievements.find(a => a.id === achievement.id)?.earnedAt : undefined
        }));
      }

      // Filter by category if specified
      if (category) {
        achievements = achievements.filter(achievement => achievement.category === category);
      }

      // Apply limit
      return achievements.slice(0, limit);
    } catch (error) {
      throw new BadRequestException(`Failed to get user achievements: ${error.message}`);
    }
  }

  async getAchievementCategories(userId: string): Promise<AchievementsCategoryDto[]> {
    try {
      const earnedAchievements = await this.progressService.getUserAchievements(userId);
      const allAchievements = await this.getAllPossibleAchievements(userId);

      const categories = new Map<string, AchievementsCategoryDto>();

      // Process all achievements to create category stats
      allAchievements.forEach(achievement => {
        const category = achievement.category;
        if (!categories.has(category)) {
          categories.set(category, {
            name: category,
            displayName: this.getCategoryDisplayName(category),
            description: this.getCategoryDescription(category),
            totalCount: 0,
            earnedCount: 0,
            availableCount: 0,
            icon: this.getCategoryIcon(category),
          });
        }

        const categoryData = categories.get(category)!;
        categoryData.totalCount++;

        const isEarned = earnedAchievements.some(earned => earned.id === achievement.id);
        if (isEarned) {
          categoryData.earnedCount++;
        } else if (this.isAchievementAvailable(achievement, userId)) {
          categoryData.availableCount++;
        }
      });

      return Array.from(categories.values()).sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      throw new BadRequestException(`Failed to get achievement categories: ${error.message}`);
    }
  }

  async getAchievementStats(userId: string): Promise<AchievementsStatsDto> {
    try {
      const earnedAchievements = await this.progressService.getUserAchievements(userId);
      const allAchievements = await this.getAllPossibleAchievements(userId);

      const totalXpFromAchievements = earnedAchievements.reduce((sum, achievement) => 
        sum + (achievement.xpReward || 0), 0);

      const recentAchievements = earnedAchievements
        .filter(achievement => achievement.earnedAt)
        .sort((a, b) => new Date(b.earnedAt!).getTime() - new Date(a.earnedAt!).getTime())
        .slice(0, 5);

      const categories = await this.getAchievementCategories(userId);
      const completionRate = allAchievements.length > 0 ? 
        (earnedAchievements.length / allAchievements.length) * 100 : 0;

      return {
        totalEarned: earnedAchievements.length,
        totalAvailable: allAchievements.length,
        totalXpEarned: totalXpFromAchievements,
        completionRate: Math.round(completionRate),
        recentAchievements: recentAchievements.slice(0, 3),
        categoryStats: categories,
        streak: {
          longest: this.getLongestAchievementStreak(earnedAchievements),
          current: this.getCurrentAchievementStreak(earnedAchievements),
        },
      };
    } catch (error) {
      throw new BadRequestException(`Failed to get achievement stats: ${error.message}`);
    }
  }

  async getRecentAchievements(userId: string, limit = 10): Promise<ProgressAchievementDto[]> {
    try {
      const achievements = await this.progressService.getUserAchievements(userId);
      return achievements
        .filter(achievement => achievement.earnedAt)
        .sort((a, b) => new Date(b.earnedAt!).getTime() - new Date(a.earnedAt!).getTime())
        .slice(0, limit);
    } catch (error) {
      throw new BadRequestException(`Failed to get recent achievements: ${error.message}`);
    }
  }

  async getAvailableAchievements(userId: string, limit = 20): Promise<ProgressAchievementDto[]> {
    try {
      const earnedAchievements = await this.progressService.getUserAchievements(userId);
      const allAchievements = await this.getAllPossibleAchievements(userId);
      const earnedIds = earnedAchievements.map(a => a.id);

      const availableAchievements = allAchievements.filter(achievement => 
        !earnedIds.includes(achievement.id) &&
        this.isAchievementAvailable(achievement, userId)
      );

      return availableAchievements
        .sort((a, b) => (a.xpReward || 0) - (b.xpReward || 0)) // Sort by XP reward (easiest first)
        .slice(0, limit);
    } catch (error) {
      throw new BadRequestException(`Failed to get available achievements: ${error.message}`);
    }
  }

  async getAchievementProgress(userId: string): Promise<{
    inProgress: Array<{
      achievement: ProgressAchievementDto;
      currentProgress: number;
      targetProgress: number;
      progressPercentage: number;
    }>;
  }> {
    try {
      // This would be implemented to track progress towards achievements
      // For now, return empty array as placeholder
      return { inProgress: [] };
    } catch (error) {
      throw new BadRequestException(`Failed to get achievement progress: ${error.message}`);
    }
  }

  // =============================================
  // HELPER METHODS
  // =============================================

  private async getAllPossibleAchievements(userId: string): Promise<ProgressAchievementDto[]> {
    // This would return all possible achievements in the system
    // For now, generating a comprehensive list based on different categories
    
    const baseAchievements: ProgressAchievementDto[] = [
      // Milestone achievements
      {
        id: 'first_session',
        title: 'Getting Started',
        description: 'Complete your first study session',
        category: 'milestone',
        xpReward: 50,
      },
      {
        id: 'ten_sessions',
        title: 'Dedicated Learner',
        description: 'Complete 10 study sessions',
        category: 'milestone',
        xpReward: 100,
      },
      {
        id: 'fifty_sessions',
        title: 'Study Enthusiast',
        description: 'Complete 50 study sessions',
        category: 'milestone',
        xpReward: 250,
      },
      {
        id: 'hundred_sessions',
        title: 'Learning Master',
        description: 'Complete 100 study sessions',
        category: 'milestone',
        xpReward: 500,
      },

      // Streak achievements
      {
        id: 'week_streak',
        title: 'Week Warrior',
        description: 'Maintain a 7-day learning streak',
        category: 'streak',
        xpReward: 200,
      },
      {
        id: 'month_streak',
        title: 'Monthly Master',
        description: 'Maintain a 30-day learning streak',
        category: 'streak',
        xpReward: 1000,
      },
      {
        id: 'three_month_streak',
        title: 'Consistency Champion',
        description: 'Maintain a 90-day learning streak',
        category: 'streak',
        xpReward: 2500,
      },

      // Course achievements
      {
        id: 'first_course',
        title: 'Course Beginner',
        description: 'Complete your first course',
        category: 'course',
        xpReward: 300,
      },
      {
        id: 'five_courses',
        title: 'Course Explorer',
        description: 'Complete 5 courses',
        category: 'course',
        xpReward: 750,
      },
      {
        id: 'ten_courses',
        title: 'Course Master',
        description: 'Complete 10 courses',
        category: 'course',
        xpReward: 1500,
      },

      // Assessment achievements
      {
        id: 'first_assessment',
        title: 'Test Taker',
        description: 'Pass your first assessment',
        category: 'assessment',
        xpReward: 100,
      },
      {
        id: 'perfect_score',
        title: 'Perfect Score',
        description: 'Get 100% on an assessment',
        category: 'assessment',
        xpReward: 200,
      },
      {
        id: 'ten_assessments',
        title: 'Assessment Expert',
        description: 'Pass 10 assessments',
        category: 'assessment',
        xpReward: 500,
      },

      // Time achievements
      {
        id: 'ten_hours',
        title: 'Time Keeper',
        description: 'Study for 10 total hours',
        category: 'time',
        xpReward: 150,
      },
      {
        id: 'hundred_hours',
        title: 'Time Master',
        description: 'Study for 100 total hours',
        category: 'time',
        xpReward: 800,
      },
      {
        id: 'thousand_hours',
        title: 'Time Legend',
        description: 'Study for 1000 total hours',
        category: 'time',
        xpReward: 3000,
      },

      // Social achievements
      {
        id: 'first_discussion',
        title: 'Discussion Starter',
        description: 'Participate in your first discussion',
        category: 'social',
        xpReward: 75,
      },
      {
        id: 'helpful_peer',
        title: 'Helpful Peer',
        description: 'Help 10 other learners',
        category: 'social',
        xpReward: 300,
      },
    ];

    return baseAchievements;
  }

  private isAchievementAvailable(achievement: ProgressAchievementDto, userId: string): boolean {
    // This would implement logic to check if an achievement is available to earn
    // For now, returning true for all (all achievements are available)
    return true;
  }

  private getCategoryDisplayName(category: string): string {
    const categoryNames: Record<string, string> = {
      milestone: 'Milestones',
      streak: 'Study Streaks',
      course: 'Course Completion',
      assessment: 'Assessments',
      time: 'Study Time',
      social: 'Community',
      special: 'Special Events',
    };
    return categoryNames[category] || category.charAt(0).toUpperCase() + category.slice(1);
  }

  private getCategoryDescription(category: string): string {
    const descriptions: Record<string, string> = {
      milestone: 'Achievements for reaching important learning milestones',
      streak: 'Achievements for maintaining consistent learning habits',
      course: 'Achievements for completing courses and lessons',
      assessment: 'Achievements for excelling in assessments and tests',
      time: 'Achievements for dedicating time to learning',
      social: 'Achievements for engaging with the learning community',
      special: 'Limited-time and special event achievements',
    };
    return descriptions[category] || `Achievements in the ${category} category`;
  }

  private getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
      milestone: '🏆',
      streak: '🔥',
      course: '📚',
      assessment: '📝',
      time: '⏰',
      social: '👥',
      special: '⭐',
    };
    return icons[category] || '🏅';
  }

  private getLongestAchievementStreak(achievements: ProgressAchievementDto[]): number {
    // This would calculate the longest streak of consecutive day achievements
    // For now, returning a placeholder value
    return achievements.length > 0 ? Math.min(achievements.length, 30) : 0;
  }

  private getCurrentAchievementStreak(achievements: ProgressAchievementDto[]): number {
    // This would calculate the current streak of recent achievements
    // For now, returning a placeholder value
    return achievements.length > 0 ? Math.min(achievements.length, 7) : 0;
  }
}