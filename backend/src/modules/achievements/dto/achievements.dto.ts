import { ApiProperty } from '@nestjs/swagger';
import { ProgressAchievementDto } from '../../progress/dto';

export class AchievementsCategoryDto {
  @ApiProperty({ description: 'Category name (internal key)' })
  name: string;

  @ApiProperty({ description: 'Display name for category' })
  displayName: string;

  @ApiProperty({ description: 'Category description' })
  description: string;

  @ApiProperty({ description: 'Total achievements in category' })
  totalCount: number;

  @ApiProperty({ description: 'Earned achievements in category' })
  earnedCount: number;

  @ApiProperty({ description: 'Available achievements in category' })
  availableCount: number;

  @ApiProperty({ description: 'Category icon/emoji' })
  icon: string;
}

export class AchievementStreakDto {
  @ApiProperty({ description: 'Longest achievement earning streak' })
  longest: number;

  @ApiProperty({ description: 'Current achievement earning streak' })
  current: number;
}

export class AchievementsStatsDto {
  @ApiProperty({ description: 'Total achievements earned' })
  totalEarned: number;

  @ApiProperty({ description: 'Total achievements available in system' })
  totalAvailable: number;

  @ApiProperty({ description: 'Total XP earned from achievements' })
  totalXpEarned: number;

  @ApiProperty({ description: 'Overall completion rate percentage' })
  completionRate: number;

  @ApiProperty({ description: 'Recently earned achievements', type: [ProgressAchievementDto] })
  recentAchievements: ProgressAchievementDto[];

  @ApiProperty({ description: 'Achievement stats by category', type: [AchievementsCategoryDto] })
  categoryStats: AchievementsCategoryDto[];

  @ApiProperty({ description: 'Achievement earning streak info', type: AchievementStreakDto })
  streak: AchievementStreakDto;
}