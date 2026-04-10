import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

export interface LearningMetadata {
  learning_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  xp_points: number;
  current_streak: number;
  longest_streak: number;
  total_study_time: number;
  preferred_language: string;
  timezone: string;
  learning_goals: string[];
  interests: string[];
  skills: Record<string, number>;
  achievements: string[];
  settings: {
    notifications_enabled: boolean;
    daily_reminder_time: string;
    weekly_goal_hours: number;
  };
}

@Injectable()
export class UserLearningService {
  constructor(private readonly db: DatabaseService) {}

  /**
   * Get user's learning metadata
   */
  async getLearningMetadata(userId: string): Promise<LearningMetadata> {
    const user = await this.db.getUserById(userId);
    
    // Return metadata with defaults if fields don't exist
    return {
      learning_level: user.metadata?.learning_level || 'beginner',
      xp_points: user.metadata?.xp_points || 0,
      current_streak: user.metadata?.current_streak || 0,
      longest_streak: user.metadata?.longest_streak || 0,
      total_study_time: user.metadata?.total_study_time || 0,
      preferred_language: user.metadata?.preferred_language || 'en',
      timezone: user.metadata?.timezone || 'UTC',
      learning_goals: user.metadata?.learning_goals || [],
      interests: user.metadata?.interests || [],
      skills: user.metadata?.skills || {},
      achievements: user.metadata?.achievements || [],
      settings: user.metadata?.settings || {
        notifications_enabled: true,
        daily_reminder_time: '09:00',
        weekly_goal_hours: 5,
      },
    };
  }

  /**
   * Update user's learning metadata
   */
  async updateLearningMetadata(userId: string, updates: Partial<LearningMetadata>): Promise<LearningMetadata> {
    const user = await this.db.getUserById(userId);
    const currentMetadata = await this.getLearningMetadata(userId);
    
    const updatedMetadata = {
      ...currentMetadata,
      ...updates,
    };

    await this.db.updateUser(userId, {
      metadata: {
        ...user.metadata,
        ...updatedMetadata,
      },
    });

    return updatedMetadata;
  }

  /**
   * Add XP points to user
   */
  async addXP(userId: string, points: number): Promise<number> {
    const metadata = await this.getLearningMetadata(userId);
    const newXP = metadata.xp_points + points;
    
    // Check if user should level up
    const newLevel = this.calculateLevel(newXP);
    
    await this.updateLearningMetadata(userId, {
      xp_points: newXP,
      learning_level: newLevel,
    });

    return newXP;
  }

  /**
   * Update study streak
   */
  async updateStreak(userId: string): Promise<{ current: number; longest: number }> {
    const metadata = await this.getLearningMetadata(userId);
    const newStreak = metadata.current_streak + 1;
    const longestStreak = Math.max(newStreak, metadata.longest_streak);

    await this.updateLearningMetadata(userId, {
      current_streak: newStreak,
      longest_streak: longestStreak,
    });

    return { current: newStreak, longest: longestStreak };
  }

  /**
   * Reset streak (called when user misses a day)
   */
  async resetStreak(userId: string): Promise<void> {
    await this.updateLearningMetadata(userId, {
      current_streak: 0,
    });
  }

  /**
   * Add study time in minutes
   */
  async addStudyTime(userId: string, minutes: number): Promise<number> {
    const metadata = await this.getLearningMetadata(userId);
    const newTotal = metadata.total_study_time + minutes;

    await this.updateLearningMetadata(userId, {
      total_study_time: newTotal,
    });

    return newTotal;
  }

  /**
   * Add achievement
   */
  async addAchievement(userId: string, achievementId: string): Promise<string[]> {
    const metadata = await this.getLearningMetadata(userId);
    
    if (!metadata.achievements.includes(achievementId)) {
      metadata.achievements.push(achievementId);
      
      await this.updateLearningMetadata(userId, {
        achievements: metadata.achievements,
      });
    }

    return metadata.achievements;
  }

  /**
   * Update skill progress
   */
  async updateSkill(userId: string, skillName: string, progress: number): Promise<Record<string, number>> {
    const metadata = await this.getLearningMetadata(userId);
    
    metadata.skills[skillName] = Math.min(100, Math.max(0, progress));

    await this.updateLearningMetadata(userId, {
      skills: metadata.skills,
    });

    return metadata.skills;
  }

  /**
   * Calculate learning level based on XP
   */
  private calculateLevel(xp: number): LearningMetadata['learning_level'] {
    if (xp < 1000) return 'beginner';
    if (xp < 5000) return 'intermediate';
    if (xp < 15000) return 'advanced';
    return 'expert';
  }
}