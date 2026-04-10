import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import {
  StartStudySessionDto,
  EndStudySessionDto,
  StudySessionResponseDto,
  ProgressOverviewDto,
  AnalyticsQueryDto,
  AnalyticsResponseDto,
  ProgressAchievementDto,
  StreakInfoDto,
  LearningStatsDto,
  WeeklyActivityDto,
  SkillProgressDto,
  TimeRange,
  StudyPatternDto,
  LearningEfficiencyDto,
  SubjectAnalyticsDto,
  ComparisonMetricsDto,
  TimeSeriesDataPoint
} from './dto';

@Injectable()
export class ProgressService {
  constructor(private readonly db: DatabaseService) {}

  // =============================================
  // STUDY SESSIONS
  // =============================================

  async startStudySession(userId: string, startStudySessionDto: StartStudySessionDto): Promise<StudySessionResponseDto> {
    try {
      const sessionData = {
        user_id: userId,
        course_id: startStudySessionDto.courseId,
        lesson_id: startStudySessionDto.lessonId,
        session_type: startStudySessionDto.sessionType,
        started_at: new Date().toISOString(),
        metadata: JSON.stringify(startStudySessionDto.metadata || {}),
        device_type: startStudySessionDto.deviceType,
        quality_metrics: JSON.stringify({})
      };

      const result = await this.db.insert('study_sessions', sessionData);
      return this.formatStudySessionResponse(result);
    } catch (error) {
      throw new BadRequestException(`Failed to start study session: ${error.message}`);
    }
  }

  async endStudySession(userId: string, sessionId: string, endStudySessionDto: EndStudySessionDto): Promise<StudySessionResponseDto> {
    try {
      const session = await this.db.findOne('study_sessions', { id: sessionId });
      if (!session) {
        throw new NotFoundException('Study session not found');
      }
      if (session.user_id !== userId) {
        throw new BadRequestException('You can only end your own study sessions');
      }
      if (session.ended_at) {
        throw new BadRequestException('Study session already ended');
      }

      const endedAt = new Date();
      const startedAt = new Date(session.started_at);
      const durationMinutes = Math.floor((endedAt.getTime() - startedAt.getTime()) / (1000 * 60));

      const updateData = {
        ended_at: endedAt.toISOString(),
        duration_minutes: durationMinutes,
        progress_made: endStudySessionDto.progressMade || 0,
        engagement_score: endStudySessionDto.engagementScore,
        notes: endStudySessionDto.notes,
        quality_metrics: JSON.stringify(endStudySessionDto.qualityMetrics || {})
      };

      const result = await this.db.update('study_sessions', sessionId, updateData);
      
      // Update user statistics and streak
      await this.updateUserStatsAfterSession(userId, result);
      
      return this.formatStudySessionResponse(result);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      throw new BadRequestException(`Failed to end study session: ${error.message}`);
    }
  }

  async getUserStudySessions(userId: string, limit = 50, offset = 0): Promise<StudySessionResponseDto[]> {
    try {
      const sessions = await this.db.findMany('study_sessions', 
        { user_id: userId }, 
        { 
          orderBy: 'started_at',
          order: 'desc',
          limit, 
          offset 
        }
      );

      return sessions.map(session => this.formatStudySessionResponse(session));
    } catch (error) {
      throw new BadRequestException(`Failed to get study sessions: ${error.message}`);
    }
  }

  // =============================================
  // PROGRESS OVERVIEW
  // =============================================

  async getProgressOverview(userId: string): Promise<ProgressOverviewDto> {
    try {
      const [profile, sessions, analytics] = await Promise.all([
        this.getUserProfile(userId),
        this.getRecentSessions(userId, 30), // Last 30 days
        this.getBasicAnalytics(userId, 30)
      ]);

      const level = this.calculateUserLevel(profile.xp_points || 0);
      const nextLevelXp = this.getXpForLevel(level + 1);
      const currentLevelXp = this.getXpForLevel(level);
      const levelProgress = ((profile.xp_points - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100;

      const streak = await this.calculateStreak(userId);
      const stats = await this.calculateLearningStats(userId);
      const skills = await this.calculateSkillProgress(userId);
      const recentAchievements = await this.getRecentAchievements(userId, 5);
      const weeklyActivity = await this.getWeeklyActivity(userId);
      const goals = await this.calculateGoalsProgress(userId);

      return {
        level,
        currentXp: profile.xp_points || 0,
        nextLevelXp,
        levelProgress: Math.min(100, Math.max(0, levelProgress)),
        streak,
        stats,
        skills,
        recentAchievements,
        weeklyActivity,
        goals
      };
    } catch (error) {
      throw new BadRequestException(`Failed to get progress overview: ${error.message}`);
    }
  }

  // =============================================
  // ACHIEVEMENTS AND STREAKS
  // =============================================

  async getUserAchievements(userId: string): Promise<ProgressAchievementDto[]> {
    try {
      // This would typically come from a dedicated achievements system
      // For now, we'll generate some basic achievements based on user progress
      const achievements = await this.generateUserAchievements(userId);
      return achievements;
    } catch (error) {
      throw new BadRequestException(`Failed to get achievements: ${error.message}`);
    }
  }

  async getStreakInfo(userId: string): Promise<StreakInfoDto> {
    try {
      return await this.calculateStreak(userId);
    } catch (error) {
      throw new BadRequestException(`Failed to get streak info: ${error.message}`);
    }
  }

  // =============================================
  // ANALYTICS
  // =============================================

  async getAnalytics(userId: string, query: AnalyticsQueryDto): Promise<AnalyticsResponseDto> {
    try {
      const { timeRange, startDate, endDate, courseId, subject } = query;
      const dateRange = this.getDateRange(timeRange, startDate, endDate);

      const [
        summary,
        timeSeries,
        studyPatterns,
        efficiency,
        subjectBreakdown,
        comparison
      ] = await Promise.all([
        this.getAnalyticsSummary(userId, dateRange, courseId, subject),
        this.getTimeSeriesData(userId, dateRange, query.metric),
        this.getStudyPatterns(userId, dateRange),
        this.getLearningEfficiency(userId, dateRange),
        this.getSubjectBreakdown(userId, dateRange),
        this.getComparisonMetrics(userId, dateRange)
      ]);

      const recommendations = await this.generateRecommendations(userId, studyPatterns, efficiency);
      const insights = await this.generateInsights(userId, summary, studyPatterns, efficiency);

      return {
        timeRange: timeRange || TimeRange.MONTH,
        startDate: dateRange.start,
        endDate: dateRange.end,
        summary,
        timeSeries,
        studyPatterns,
        efficiency,
        subjectBreakdown,
        comparison,
        recommendations,
        insights
      };
    } catch (error) {
      throw new BadRequestException(`Failed to get analytics: ${error.message}`);
    }
  }

  // =============================================
  // HELPER METHODS
  // =============================================

  private async getUserProfile(userId: string): Promise<any> {
    const profile = await this.db.findOne('user_profiles', { user_id: userId });

    if (!profile) {
      // Create default profile if doesn't exist
      const defaultProfile = {
        user_id: userId,
        xp_points: 0,
        current_streak: 0,
        longest_streak: 0,
        total_study_time: 0,
        achievements: JSON.stringify([]),
        skills: JSON.stringify({})
      };
      return await this.db.insert('user_profiles', defaultProfile);
    }

    return profile;
  }

  private async getRecentSessions(userId: string, days: number): Promise<any[]> {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    
    return await this.db.findMany('study_sessions', {
      user_id: userId,
      started_at: { $gte: cutoffDate }
    });
  }

  private async getBasicAnalytics(userId: string, days: number): Promise<any> {
    // This would aggregate analytics data
    return {
      totalSessions: 0,
      totalTime: 0,
      averageEngagement: 0
    };
  }

  private calculateUserLevel(xp: number): number {
    // Simple level calculation: every 1000 XP = 1 level
    return Math.floor(xp / 1000) + 1;
  }

  private getXpForLevel(level: number): number {
    return (level - 1) * 1000;
  }

  private async calculateStreak(userId: string): Promise<StreakInfoDto> {
    try {
      const profile = await this.getUserProfile(userId);
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];

      // Check if user has activity today
      const todayActivity = await this.db.findMany('study_sessions', {
        user_id: userId,
        started_at: { $gte: todayStr }
      });

      const isActiveToday = todayActivity.length > 0;
      
      // Calculate next milestone
      const nextMilestone = Math.ceil((profile.current_streak + 1) / 7) * 7; // Next week milestone
      const daysToNextMilestone = nextMilestone - profile.current_streak;

      return {
        current: profile.current_streak || 0,
        longest: profile.longest_streak || 0,
        lastActivityDate: isActiveToday ? today : new Date(Date.now() - 24 * 60 * 60 * 1000),
        isActiveToday,
        daysToNextMilestone,
        nextMilestone
      };
    } catch (error) {
      // Return default streak info if calculation fails
      return {
        current: 0,
        longest: 0,
        lastActivityDate: new Date(),
        isActiveToday: false,
        daysToNextMilestone: 7,
        nextMilestone: 7
      };
    }
  }

  private async calculateLearningStats(userId: string): Promise<LearningStatsDto> {
    try {
      const [sessions, enrollments, attempts] = await Promise.all([
        this.db.findMany('study_sessions', { user_id: userId }),
        this.db.findMany('course_enrollments', { user_id: userId }),
        this.db.findMany('assessment_attempts', { user_id: userId })
      ]);

      const totalStudyTime = sessions.reduce((sum: number, s: any) => sum + (s.duration_minutes || 0), 0);
      const activeCourses = enrollments.filter((e: any) => e.status === 'active').length;
      const completedCourses = enrollments.filter((e: any) => e.status === 'completed').length;
      const passedAssessments = attempts.filter((a: any) => a.passed).length;

      // Calculate average study time per day (last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const recentSessions = sessions.filter((s: any) => new Date(s.started_at) >= thirtyDaysAgo);
      const recentStudyTime = recentSessions.reduce((sum: number, s: any) => sum + (s.duration_minutes || 0), 0);
      const averageStudyTimePerDay = recentStudyTime / 30;

      return {
        totalStudyTime,
        totalSessions: sessions.length,
        totalLessonsCompleted: 0, // Would need to calculate from progress records
        totalAssessmentsTaken: attempts.length,
        totalAssessmentsPassed: passedAssessments,
        averageStudyTimePerDay,
        activeCourses,
        completedCourses
      };
    } catch (error) {
      // Return default stats if calculation fails
      return {
        totalStudyTime: 0,
        totalSessions: 0,
        totalLessonsCompleted: 0,
        totalAssessmentsTaken: 0,
        totalAssessmentsPassed: 0,
        averageStudyTimePerDay: 0,
        activeCourses: 0,
        completedCourses: 0
      };
    }
  }

  private async calculateSkillProgress(userId: string): Promise<SkillProgressDto[]> {
    // This would calculate skill progress from course enrollments and assessments
    // For now, returning empty array as placeholder
    return [];
  }

  private async getRecentAchievements(userId: string, limit: number): Promise<ProgressAchievementDto[]> {
    // Generate achievements based on user progress
    return await this.generateUserAchievements(userId, limit);
  }

  private async getWeeklyActivity(userId: string): Promise<WeeklyActivityDto[]> {
    const weekDays = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const nextDayStr = new Date(date.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const sessions = await this.db.findMany('study_sessions', {
        user_id: userId,
        started_at: { $gte: dateStr, $lt: nextDayStr }
      });

      const minutesStudied = sessions.reduce((sum: number, s: any) => sum + (s.duration_minutes || 0), 0);
      
      weekDays.push({
        dayOfWeek: date.getDay(),
        date: dateStr,
        minutesStudied,
        sessions: sessions.length,
        xpEarned: Math.floor(minutesStudied * 0.1), // Rough XP calculation
        hasActivity: sessions.length > 0
      });
    }

    return weekDays;
  }

  private async calculateGoalsProgress(userId: string): Promise<any> {
    // Calculate daily, weekly, and monthly goals progress
    // For now, returning placeholder values
    return {
      daily: { target: 60, completed: 45, percentage: 75 },
      weekly: { target: 420, completed: 280, percentage: 67 },
      monthly: { target: 1800, completed: 1200, percentage: 67 }
    };
  }

  private async generateUserAchievements(userId: string, limit = 10): Promise<ProgressAchievementDto[]> {
    const achievements: ProgressAchievementDto[] = [];
    const stats = await this.calculateLearningStats(userId);
    const profile = await this.getUserProfile(userId);

    // Generate achievements based on stats
    if (stats.totalSessions >= 1) {
      achievements.push({
        id: 'first_session',
        title: 'Getting Started',
        description: 'Complete your first study session',
        category: 'milestone',
        xpReward: 50,
        earnedAt: new Date()
      });
    }

    if (stats.totalSessions >= 10) {
      achievements.push({
        id: 'dedicated_learner',
        title: 'Dedicated Learner',
        description: 'Complete 10 study sessions',
        category: 'milestone',
        xpReward: 100,
        earnedAt: new Date()
      });
    }

    if (profile.current_streak >= 7) {
      achievements.push({
        id: 'week_streak',
        title: 'Week Warrior',
        description: 'Maintain a 7-day learning streak',
        category: 'streak',
        xpReward: 200,
        earnedAt: new Date()
      });
    }

    return achievements.slice(0, limit);
  }

  private async updateUserStatsAfterSession(userId: string, session: any): Promise<void> {
    try {
      const profile = await this.getUserProfile(userId);
      const xpGained = Math.floor((session.duration_minutes || 0) * 0.1); // 0.1 XP per minute
      
      // Update profile with new XP and study time
      await this.db.update('user_profiles', profile.id, {
        xp_points: (profile.xp_points || 0) + xpGained,
        total_study_time: (profile.total_study_time || 0) + (session.duration_minutes || 0)
      });

      // Update daily analytics
      const today = new Date().toISOString().split('T')[0];
      const existingAnalytics = await this.db.findOne('learning_analytics', {
        user_id: userId,
        date: today
      });

      const analyticsData = {
        user_id: userId,
        date: today,
        total_study_time: (session.duration_minutes || 0),
        session_count: 1,
        xp_earned: xpGained,
        streak_maintained: true,
        subjects_studied: JSON.stringify([]),
        skills_practiced: JSON.stringify([]),
        engagement_metrics: JSON.stringify({
          averageEngagement: session.engagement_score || 0
        })
      };

      if (existingAnalytics) {
        await this.db.update('learning_analytics', existingAnalytics.id, {
          total_study_time: existingAnalytics.total_study_time + (session.duration_minutes || 0),
          session_count: existingAnalytics.session_count + 1,
          xp_earned: existingAnalytics.xp_earned + xpGained
        });
      } else {
        await this.db.insert('learning_analytics', analyticsData);
      }
    } catch (error) {
      console.error('Failed to update user stats after session:', error);
      // Don't throw error as session was already completed successfully
    }
  }

  private formatStudySessionResponse(data: any): StudySessionResponseDto {
    return {
      id: data.id,
      userId: data.user_id,
      courseId: data.course_id,
      lessonId: data.lesson_id,
      sessionType: data.session_type,
      startedAt: new Date(data.started_at),
      endedAt: data.ended_at ? new Date(data.ended_at) : undefined,
      durationMinutes: data.duration_minutes,
      progressMade: data.progress_made,
      engagementScore: data.engagement_score,
      notes: data.notes,
      metadata: JSON.parse(data.metadata || '{}'),
      deviceType: data.device_type,
      qualityMetrics: JSON.parse(data.quality_metrics || '{}')
    };
  }

  private getDateRange(timeRange?: TimeRange, startDate?: string, endDate?: string): { start: string; end: string } {
    const end = endDate ? new Date(endDate) : new Date();
    let start: Date;

    if (startDate) {
      start = new Date(startDate);
    } else {
      switch (timeRange) {
        case TimeRange.WEEK:
          start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case TimeRange.MONTH:
          start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case TimeRange.QUARTER:
          start = new Date(end.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case TimeRange.YEAR:
          start = new Date(end.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
      }
    }

    return {
      start: start.toISOString(),
      end: end.toISOString()
    };
  }

  // Placeholder implementations for analytics methods
  private async getAnalyticsSummary(userId: string, dateRange: any, courseId?: string, subject?: string): Promise<any> {
    return {
      totalStudyTime: 0,
      totalSessions: 0,
      totalXpEarned: 0,
      averageEngagement: 0,
      goalCompletionRate: 0
    };
  }

  private async getTimeSeriesData(userId: string, dateRange: any, metric?: any): Promise<TimeSeriesDataPoint[]> {
    return [];
  }

  private async getStudyPatterns(userId: string, dateRange: any): Promise<StudyPatternDto> {
    return {
      mostActiveDay: 1,
      mostActiveHour: 14,
      averageSessionDuration: 45,
      preferredSessionType: 'video',
      consistencyScore: 75,
      peakHours: [9, 14, 20]
    };
  }

  private async getLearningEfficiency(userId: string, dateRange: any): Promise<LearningEfficiencyDto> {
    return {
      courseCompletionRate: 75,
      averageAssessmentScore: 82,
      timeEfficiencyRatio: 1.1,
      retentionRate: 88,
      learningVelocity: 5.5,
      engagementTrend: 'stable'
    };
  }

  private async getSubjectBreakdown(userId: string, dateRange: any): Promise<SubjectAnalyticsDto[]> {
    return [];
  }

  private async getComparisonMetrics(userId: string, dateRange: any): Promise<ComparisonMetricsDto> {
    return {
      percentile: 75,
      comparison: {
        studyTime: 'above',
        performance: 'average',
        consistency: 'above'
      }
    };
  }

  private async generateRecommendations(userId: string, patterns: StudyPatternDto, efficiency: LearningEfficiencyDto): Promise<string[]> {
    const recommendations: string[] = [];

    if (patterns.consistencyScore < 70) {
      recommendations.push('Try to maintain a more consistent study schedule to improve retention.');
    }

    if (efficiency.averageAssessmentScore < 80) {
      recommendations.push('Consider reviewing completed lessons before taking assessments.');
    }

    if (patterns.averageSessionDuration < 30) {
      recommendations.push('Longer study sessions (30-60 minutes) may improve learning effectiveness.');
    }

    return recommendations;
  }

  private async generateInsights(userId: string, summary: any, patterns: StudyPatternDto, efficiency: LearningEfficiencyDto): Promise<string[]> {
    const insights: string[] = [];

    insights.push(`Your most productive time for learning is around ${patterns.mostActiveHour}:00.`);
    insights.push(`You have a ${efficiency.courseCompletionRate}% course completion rate.`);
    insights.push(`Your learning consistency score is ${patterns.consistencyScore}/100.`);

    return insights;
  }
}