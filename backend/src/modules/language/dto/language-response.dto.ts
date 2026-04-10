import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LanguageSkill, DifficultyLevel, LessonContentDto } from './create-lesson.dto';
import { ExerciseType, AnswerOptionDto } from './create-exercise.dto';
import { WordType } from './create-vocabulary.dto';

export class LanguageLessonResponseDto {
  @ApiProperty({ description: 'Lesson ID' })
  id: string;

  @ApiProperty({ description: 'User ID' })
  user_id: string;

  @ApiProperty({ description: 'Lesson title' })
  title: string;

  @ApiProperty({ description: 'Lesson description' })
  description: string;

  @ApiProperty({ description: 'Target language code' })
  language_code: string;

  @ApiProperty({ description: 'Source language code' })
  source_language: string;

  @ApiProperty({ description: 'Primary skill', enum: LanguageSkill })
  skill: LanguageSkill;

  @ApiProperty({ description: 'Difficulty level', enum: DifficultyLevel })
  difficulty: DifficultyLevel;

  @ApiProperty({ description: 'Duration in minutes' })
  duration_minutes: number;

  @ApiProperty({ description: 'Lesson content', type: [LessonContentDto] })
  content: LessonContentDto[];

  @ApiPropertyOptional({ description: 'Tags', type: [String] })
  tags?: string[];

  @ApiProperty({ description: 'Is published' })
  is_published: boolean;

  @ApiPropertyOptional({ description: 'Metadata' })
  metadata?: Record<string, any>;

  @ApiProperty({ description: 'Created at' })
  created_at: string;

  @ApiProperty({ description: 'Updated at' })
  updated_at: string;
}

export class ExerciseResponseDto {
  @ApiProperty({ description: 'Exercise ID' })
  id: string;

  @ApiProperty({ description: 'User ID' })
  user_id: string;

  @ApiProperty({ description: 'Question text' })
  question: string;

  @ApiProperty({ description: 'Exercise type', enum: ExerciseType })
  type: ExerciseType;

  @ApiProperty({ description: 'Language code' })
  language_code: string;

  @ApiPropertyOptional({ description: 'Lesson ID' })
  lesson_id?: string;

  @ApiProperty({ description: 'Answer options', type: [AnswerOptionDto] })
  answers: AnswerOptionDto[];

  @ApiPropertyOptional({ description: 'Explanation' })
  explanation?: string;

  @ApiPropertyOptional({ description: 'Hints', type: [String] })
  hints?: string[];

  @ApiProperty({ description: 'Points' })
  points: number;

  @ApiPropertyOptional({ description: 'Audio URL' })
  audio_url?: string;

  @ApiPropertyOptional({ description: 'Image URL' })
  image_url?: string;

  @ApiPropertyOptional({ description: 'Tags', type: [String] })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Metadata' })
  metadata?: Record<string, any>;

  @ApiProperty({ description: 'Created at' })
  created_at: string;
}

export class VocabularyResponseDto {
  @ApiProperty({ description: 'Vocabulary ID' })
  id: string;

  @ApiProperty({ description: 'User ID' })
  user_id: string;

  @ApiProperty({ description: 'Word or phrase' })
  word: string;

  @ApiProperty({ description: 'Translation' })
  translation: string;

  @ApiProperty({ description: 'Language code' })
  language_code: string;

  @ApiProperty({ description: 'Translation language' })
  translation_language: string;

  @ApiProperty({ description: 'Word type', enum: WordType })
  word_type: WordType;

  @ApiPropertyOptional({ description: 'Phonetic' })
  phonetic?: string;

  @ApiPropertyOptional({ description: 'Definition' })
  definition?: string;

  @ApiPropertyOptional({ description: 'Example sentence' })
  example_sentence?: string;

  @ApiPropertyOptional({ description: 'Example translation' })
  example_translation?: string;

  @ApiPropertyOptional({ description: 'Audio URL' })
  audio_url?: string;

  @ApiPropertyOptional({ description: 'Image URL' })
  image_url?: string;

  @ApiProperty({ description: 'Difficulty level' })
  difficulty_level: number;

  @ApiProperty({ description: 'Frequency' })
  frequency: number;

  @ApiPropertyOptional({ description: 'Category' })
  category?: string;

  @ApiPropertyOptional({ description: 'Tags', type: [String] })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Metadata' })
  metadata?: Record<string, any>;

  @ApiProperty({ description: 'Created at' })
  created_at: string;
}

export class ProgressResponseDto {
  @ApiProperty({ description: 'Progress ID' })
  id: string;

  @ApiProperty({ description: 'User ID' })
  user_id: string;

  @ApiProperty({ description: 'Activity type' })
  activity_type: string;

  @ApiProperty({ description: 'Language code' })
  language_code: string;

  @ApiPropertyOptional({ description: 'Lesson ID' })
  lesson_id?: string;

  @ApiPropertyOptional({ description: 'Exercise ID' })
  exercise_id?: string;

  @ApiPropertyOptional({ description: 'Vocabulary ID' })
  vocabulary_id?: string;

  @ApiProperty({ description: 'Points earned' })
  points_earned: number;

  @ApiPropertyOptional({ description: 'Accuracy' })
  accuracy?: number;

  @ApiPropertyOptional({ description: 'Time spent' })
  time_spent?: number;

  @ApiProperty({ description: 'Completed' })
  completed: boolean;

  @ApiPropertyOptional({ description: 'Mistakes', type: [String] })
  mistakes?: string[];

  @ApiPropertyOptional({ description: 'Metadata' })
  metadata?: Record<string, any>;

  @ApiProperty({ description: 'Created at' })
  created_at: string;
}

export class LanguageStatsDto {
  @ApiProperty({ description: 'Language code' })
  language_code: string;

  @ApiProperty({ description: 'Total points' })
  total_points: number;

  @ApiProperty({ description: 'Current streak' })
  current_streak: number;

  @ApiProperty({ description: 'Lessons completed' })
  lessons_completed: number;

  @ApiProperty({ description: 'Exercises completed' })
  exercises_completed: number;

  @ApiProperty({ description: 'Vocabulary learned' })
  vocabulary_learned: number;

  @ApiProperty({ description: 'Average accuracy' })
  average_accuracy: number;

  @ApiProperty({ description: 'Time spent in minutes' })
  time_spent: number;
}

export class LeaderboardEntryDto {
  @ApiProperty({ description: 'User ID' })
  user_id: string;

  @ApiPropertyOptional({ description: 'Username' })
  username?: string;

  @ApiProperty({ description: 'Total points' })
  total_points: number;

  @ApiProperty({ description: 'Current streak' })
  current_streak: number;

  @ApiProperty({ description: 'Rank' })
  rank: number;
}

export class LanguageAchievementDto {
  @ApiProperty({ description: 'Achievement ID' })
  id: string;

  @ApiProperty({ description: 'Achievement name' })
  name: string;

  @ApiProperty({ description: 'Description' })
  description: string;

  @ApiProperty({ description: 'Icon URL' })
  icon_url: string;

  @ApiProperty({ description: 'Points awarded' })
  points: number;

  @ApiProperty({ description: 'Is unlocked' })
  unlocked: boolean;

  @ApiPropertyOptional({ description: 'Unlocked at' })
  unlocked_at?: string;
}

// Paginated response DTOs
export class PaginatedLessonsDto {
  @ApiProperty({ description: 'Lessons data', type: [LanguageLessonResponseDto] })
  data: LanguageLessonResponseDto[];

  @ApiProperty({ description: 'Total count' })
  total: number;

  @ApiProperty({ description: 'Current page' })
  page: number;

  @ApiProperty({ description: 'Items per page' })
  limit: number;

  @ApiProperty({ description: 'Total pages' })
  total_pages: number;
}

export class PaginatedLanguageExercisesDto {
  @ApiProperty({ description: 'Exercises data', type: [ExerciseResponseDto] })
  data: ExerciseResponseDto[];

  @ApiProperty({ description: 'Total count' })
  total: number;

  @ApiProperty({ description: 'Current page' })
  page: number;

  @ApiProperty({ description: 'Items per page' })
  limit: number;

  @ApiProperty({ description: 'Total pages' })
  total_pages: number;
}

export class PaginatedVocabularyDto {
  @ApiProperty({ description: 'Vocabulary data', type: [VocabularyResponseDto] })
  data: VocabularyResponseDto[];

  @ApiProperty({ description: 'Total count' })
  total: number;

  @ApiProperty({ description: 'Current page' })
  page: number;

  @ApiProperty({ description: 'Items per page' })
  limit: number;

  @ApiProperty({ description: 'Total pages' })
  total_pages: number;
}

export class PaginatedProgressDto {
  @ApiProperty({ description: 'Progress data', type: [ProgressResponseDto] })
  data: ProgressResponseDto[];

  @ApiProperty({ description: 'Total count' })
  total: number;

  @ApiProperty({ description: 'Current page' })
  page: number;

  @ApiProperty({ description: 'Items per page' })
  limit: number;

  @ApiProperty({ description: 'Total pages' })
  total_pages: number;
}