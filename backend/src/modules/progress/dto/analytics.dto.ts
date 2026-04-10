import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsDateString, IsEnum, IsNumber, Min, Max } from 'class-validator';

export enum TimeRange {
  WEEK = 'week',
  MONTH = 'month',
  QUARTER = 'quarter',
  YEAR = 'year',
  ALL_TIME = 'all_time'
}

export enum MetricType {
  STUDY_TIME = 'study_time',
  SESSIONS = 'sessions',
  LESSONS_COMPLETED = 'lessons_completed',
  ASSESSMENTS_COMPLETED = 'assessments_completed',
  XP_EARNED = 'xp_earned',
  ENGAGEMENT = 'engagement'
}

export class AnalyticsQueryDto {
  @ApiProperty({ enum: TimeRange, required: false, description: 'Time range for analytics' })
  @IsOptional()
  @IsEnum(TimeRange)
  timeRange?: TimeRange = TimeRange.MONTH;

  @ApiProperty({ required: false, description: 'Start date for custom range' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ required: false, description: 'End date for custom range' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ enum: MetricType, required: false, description: 'Specific metric to focus on' })
  @IsOptional()
  @IsEnum(MetricType)
  metric?: MetricType;

  @ApiProperty({ required: false, description: 'Course ID to filter by' })
  @IsOptional()
  courseId?: string;

  @ApiProperty({ required: false, description: 'Subject to filter by' })
  @IsOptional()
  subject?: string;
}

export class TimeSeriesDataPoint {
  @ApiProperty({ description: 'Date for this data point' })
  date: string;

  @ApiProperty({ description: 'Value for the metric' })
  value: number;

  @ApiProperty({ description: 'Additional metadata for this point', required: false })
  metadata?: any;
}

export class StudyPatternDto {
  @ApiProperty({ description: 'Most active day of week (0-6, Sunday=0)' })
  mostActiveDay: number;

  @ApiProperty({ description: 'Most active hour of day (0-23)' })
  mostActiveHour: number;

  @ApiProperty({ description: 'Average session duration in minutes' })
  averageSessionDuration: number;

  @ApiProperty({ description: 'Preferred study session type' })
  preferredSessionType: string;

  @ApiProperty({ description: 'Study consistency score (0-100)' })
  consistencyScore: number;

  @ApiProperty({ description: 'Peak performance hours', type: [Number] })
  peakHours: number[];
}

export class LearningEfficiencyDto {
  @ApiProperty({ description: 'Completion rate for started courses (0-100)' })
  courseCompletionRate: number;

  @ApiProperty({ description: 'Average assessment score (0-100)' })
  averageAssessmentScore: number;

  @ApiProperty({ description: 'Time to completion compared to average (ratio)' })
  timeEfficiencyRatio: number;

  @ApiProperty({ description: 'Retention rate based on review sessions (0-100)' })
  retentionRate: number;

  @ApiProperty({ description: 'Learning velocity (XP per hour)' })
  learningVelocity: number;

  @ApiProperty({ description: 'Engagement trend over time' })
  engagementTrend: 'increasing' | 'stable' | 'decreasing';
}

export class SubjectAnalyticsDto {
  @ApiProperty({ description: 'Subject name' })
  subject: string;

  @ApiProperty({ description: 'Time spent studying this subject (minutes)' })
  timeSpent: number;

  @ApiProperty({ description: 'Number of sessions in this subject' })
  sessions: number;

  @ApiProperty({ description: 'XP earned in this subject' })
  xpEarned: number;

  @ApiProperty({ description: 'Average performance in this subject (0-100)' })
  averagePerformance: number;

  @ApiProperty({ description: 'Progress percentage in active courses' })
  progressPercentage: number;

  @ApiProperty({ description: 'Difficulty level preference in this subject' })
  difficultyPreference: string;
}

export class ComparisonMetricsDto {
  @ApiProperty({ description: 'User percentile compared to similar learners (0-100)' })
  percentile: number;

  @ApiProperty({ description: 'Comparison with average learner' })
  comparison: {
    studyTime: 'above' | 'average' | 'below';
    performance: 'above' | 'average' | 'below';
    consistency: 'above' | 'average' | 'below';
  };

  @ApiProperty({ description: 'Ranking among peers', required: false })
  peerRanking?: {
    rank: number;
    totalPeers: number;
    category: string;
  };
}

export class AnalyticsResponseDto {
  @ApiProperty({ description: 'Time range of the analytics data' })
  timeRange: TimeRange;

  @ApiProperty({ description: 'Start date of data' })
  startDate: string;

  @ApiProperty({ description: 'End date of data' })
  endDate: string;

  @ApiProperty({ description: 'Overall metrics summary' })
  summary: {
    totalStudyTime: number;
    totalSessions: number;
    totalXpEarned: number;
    averageEngagement: number;
    goalCompletionRate: number;
  };

  @ApiProperty({ description: 'Time series data for the main metric', type: [TimeSeriesDataPoint] })
  timeSeries: TimeSeriesDataPoint[];

  @ApiProperty({ description: 'Study pattern analysis', type: StudyPatternDto })
  studyPatterns: StudyPatternDto;

  @ApiProperty({ description: 'Learning efficiency metrics', type: LearningEfficiencyDto })
  efficiency: LearningEfficiencyDto;

  @ApiProperty({ description: 'Subject breakdown', type: [SubjectAnalyticsDto] })
  subjectBreakdown: SubjectAnalyticsDto[];

  @ApiProperty({ description: 'Comparison with other learners', type: ComparisonMetricsDto })
  comparison: ComparisonMetricsDto;

  @ApiProperty({ description: 'Recommendations for improvement' })
  recommendations: string[];

  @ApiProperty({ description: 'Insights and observations' })
  insights: string[];
}