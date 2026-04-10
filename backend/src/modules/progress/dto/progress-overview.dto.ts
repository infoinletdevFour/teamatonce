import { ApiProperty } from '@nestjs/swagger';

export class SkillProgressDto {
  @ApiProperty({ description: 'Skill name' })
  skill: string;

  @ApiProperty({ description: 'Current level (0-100)' })
  level: number;

  @ApiProperty({ description: 'XP points in this skill' })
  xp: number;

  @ApiProperty({ description: 'Next level threshold' })
  nextLevelXp: number;
}

export class ProgressAchievementDto {
  @ApiProperty({ description: 'Achievement ID' })
  id: string;

  @ApiProperty({ description: 'Achievement title' })
  title: string;

  @ApiProperty({ description: 'Achievement description' })
  description: string;

  @ApiProperty({ description: 'Achievement icon URL', required: false })
  iconUrl?: string;

  @ApiProperty({ description: 'When achievement was earned', required: false })
  earnedAt?: Date;

  @ApiProperty({ description: 'Achievement category' })
  category: string;

  @ApiProperty({ description: 'XP reward for achievement' })
  xpReward: number;
}

export class StreakInfoDto {
  @ApiProperty({ description: 'Current streak length in days' })
  current: number;

  @ApiProperty({ description: 'Longest streak ever in days' })
  longest: number;

  @ApiProperty({ description: 'Last activity date' })
  lastActivityDate: Date;

  @ApiProperty({ description: 'Is streak active today' })
  isActiveToday: boolean;

  @ApiProperty({ description: 'Days until streak milestone' })
  daysToNextMilestone: number;

  @ApiProperty({ description: 'Next milestone threshold' })
  nextMilestone: number;
}

export class LearningStatsDto {
  @ApiProperty({ description: 'Total study time in minutes' })
  totalStudyTime: number;

  @ApiProperty({ description: 'Total sessions completed' })
  totalSessions: number;

  @ApiProperty({ description: 'Total lessons completed' })
  totalLessonsCompleted: number;

  @ApiProperty({ description: 'Total assessments taken' })
  totalAssessmentsTaken: number;

  @ApiProperty({ description: 'Total assessments passed' })
  totalAssessmentsPassed: number;

  @ApiProperty({ description: 'Average study time per day (last 30 days)' })
  averageStudyTimePerDay: number;

  @ApiProperty({ description: 'Active courses count' })
  activeCourses: number;

  @ApiProperty({ description: 'Completed courses count' })
  completedCourses: number;
}

export class WeeklyActivityDto {
  @ApiProperty({ description: 'Day of week (0-6, Sunday=0)' })
  dayOfWeek: number;

  @ApiProperty({ description: 'Date' })
  date: string;

  @ApiProperty({ description: 'Minutes studied' })
  minutesStudied: number;

  @ApiProperty({ description: 'Sessions completed' })
  sessions: number;

  @ApiProperty({ description: 'XP earned' })
  xpEarned: number;

  @ApiProperty({ description: 'Has activity on this day' })
  hasActivity: boolean;
}

export class ProgressOverviewDto {
  @ApiProperty({ description: 'User level based on total XP' })
  level: number;

  @ApiProperty({ description: 'Current XP points' })
  currentXp: number;

  @ApiProperty({ description: 'XP needed for next level' })
  nextLevelXp: number;

  @ApiProperty({ description: 'Progress to next level (0-100)' })
  levelProgress: number;

  @ApiProperty({ description: 'Current streak information', type: StreakInfoDto })
  streak: StreakInfoDto;

  @ApiProperty({ description: 'Learning statistics', type: LearningStatsDto })
  stats: LearningStatsDto;

  @ApiProperty({ description: 'Skill progress breakdown', type: [SkillProgressDto] })
  skills: SkillProgressDto[];

  @ApiProperty({ description: 'Recent achievements', type: [ProgressAchievementDto] })
  recentAchievements: ProgressAchievementDto[];

  @ApiProperty({ description: 'Weekly activity data', type: [WeeklyActivityDto] })
  weeklyActivity: WeeklyActivityDto[];

  @ApiProperty({ description: 'Study goals and progress' })
  goals: {
    daily: {
      target: number;
      completed: number;
      percentage: number;
    };
    weekly: {
      target: number;
      completed: number;
      percentage: number;
    };
    monthly: {
      target: number;
      completed: number;
      percentage: number;
    };
  };
}