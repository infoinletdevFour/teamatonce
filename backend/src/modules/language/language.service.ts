import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import {
  CreateLessonDto,
  CreateLanguageExerciseDto,
  CreateVocabularyDto,
  UpdateProgressDto,
  LessonQueryDto,
  ExerciseQueryDto,
  VocabularyQueryDto,
  ProgressQueryDto,
  LeaderboardQueryDto,
  LanguageLessonResponseDto,
  ExerciseResponseDto,
  VocabularyResponseDto,
  ProgressResponseDto,
  LanguageStatsDto,
  LeaderboardEntryDto,
  LanguageAchievementDto,
  PaginatedLessonsDto,
  PaginatedLanguageExercisesDto,
  PaginatedVocabularyDto,
  PaginatedProgressDto
} from './dto';

@Injectable()
export class LanguageService {
  constructor(private readonly db: DatabaseService) {}

  // =============================================
  // LESSON OPERATIONS
  // =============================================

  async createLesson(userId: string, createLessonDto: CreateLessonDto): Promise<LanguageLessonResponseDto> {
    try {
      const lessonData = {
        user_id: userId,
        title: createLessonDto.title,
        description: createLessonDto.description,
        language_code: createLessonDto.language_code,
        source_language: createLessonDto.source_language,
        skill: createLessonDto.skill,
        difficulty: createLessonDto.difficulty,
        duration_minutes: createLessonDto.duration_minutes,
        content: createLessonDto.content,
        tags: createLessonDto.tags || [],
        is_published: createLessonDto.is_published ?? false,
        metadata: createLessonDto.metadata || {},
      };

      console.log('Creating lesson with data:', JSON.stringify(lessonData, null, 2));
      
      // Try to insert into language_lessons_v2 table
      try {
        const result = await this.db.insert('language_lessons_v2', lessonData);
        console.log('Lesson creation result:', result);
        return this.formatLesson(result);
      } catch (insertError) {
        console.error('Direct insert failed, error details:', {
          message: insertError.message,
          code: insertError.code,
          statusCode: insertError.statusCode,
          details: insertError.details,
          response: insertError.response
        });
        
        // Let's try with a simpler data structure to identify the issue
        const simpleData = {
          user_id: userId,
          title: createLessonDto.title,
          description: createLessonDto.description,
          language_code: createLessonDto.language_code,
          source_language: createLessonDto.source_language,
          skill: createLessonDto.skill,
          difficulty: createLessonDto.difficulty,
          duration_minutes: createLessonDto.duration_minutes,
        };
        
        console.log('Trying with simplified data:', simpleData);
        const result = await this.db.insert('language_lessons_v2', simpleData);
        return this.formatLesson(result);
      }
    } catch (error) {
      console.error('Lesson creation error:', error);
      throw new BadRequestException(`Failed to create lesson: ${error.message}`);
    }
  }

  async getLessons(userId: string, query: LessonQueryDto): Promise<PaginatedLessonsDto> {
    try {
      const { page = 1, limit = 20, sort_by = 'created_at', sort_order = 'desc', ...filters } = query;
      const offset = (page - 1) * limit;

      const whereConditions: any = { user_id: userId };

      if (filters.language_code) {
        whereConditions.language_code = filters.language_code;
      }

      if (filters.skill) {
        whereConditions.skill = filters.skill;
      }

      if (filters.difficulty) {
        whereConditions.difficulty = filters.difficulty;
      }

      if (filters.search) {
        whereConditions.$or = [
          { title: { $ilike: `%${filters.search}%` } },
          { description: { $ilike: `%${filters.search}%` } }
        ];
      }

      if (filters.tags && filters.tags.length > 0) {
        whereConditions.tags = { $overlap: filters.tags };
      }

      const lessons = await this.db.select('language_lessons_v2', {
        where: whereConditions,
        orderBy: sort_by,
        order: sort_order,
        limit,
        offset,
      });

      const allRecords = await this.db.findMany('language_lessons_v2', whereConditions);
      const totalCount = allRecords.length;

      return {
        data: lessons.map(this.formatLesson),
        total: totalCount,
        page,
        limit,
        total_pages: Math.ceil(totalCount / limit),
      };
    } catch (error) {
      throw new BadRequestException(`Failed to fetch lessons: ${error.message}`);
    }
  }

  async getLessonById(userId: string, lessonId: string): Promise<LanguageLessonResponseDto> {
    try {
      const lesson = await this.db.findOne('language_lessons_v2', { 
        id: lessonId, 
        user_id: userId 
      });

      if (!lesson) {
        throw new NotFoundException('Lesson not found');
      }

      return this.formatLesson(lesson);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to fetch lesson: ${error.message}`);
    }
  }

  async updateLesson(userId: string, lessonId: string, updateLessonDto: Partial<CreateLessonDto>): Promise<LanguageLessonResponseDto> {
    try {
      const existingLesson = await this.db.findOne('language_lessons_v2', { 
        id: lessonId, 
        user_id: userId 
      });

      if (!existingLesson) {
        throw new NotFoundException('Lesson not found');
      }

      const updateData: any = { ...updateLessonDto };
      delete updateData.user_id;

      const updatedLesson = await this.db.update('language_lessons_v2', lessonId, updateData);
      return this.formatLesson(updatedLesson);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to update lesson: ${error.message}`);
    }
  }

  async deleteLesson(userId: string, lessonId: string): Promise<void> {
    try {
      const existingLesson = await this.db.findOne('language_lessons_v2', { 
        id: lessonId, 
        user_id: userId 
      });

      if (!existingLesson) {
        throw new NotFoundException('Lesson not found');
      }

      await this.db.delete('language_lessons_v2', lessonId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to delete lesson: ${error.message}`);
    }
  }

  // =============================================
  // EXERCISE OPERATIONS
  // =============================================

  async createExercise(userId: string, createExerciseDto: CreateLanguageExerciseDto): Promise<ExerciseResponseDto> {
    try {
      const exerciseData = {
        user_id: userId,
        question: createExerciseDto.question,
        type: createExerciseDto.type,
        language_code: createExerciseDto.language_code,
        lesson_id: createExerciseDto.lesson_id || null,
        answers: createExerciseDto.answers,
        explanation: createExerciseDto.explanation || null,
        hints: createExerciseDto.hints || [],
        points: createExerciseDto.points || 10,
        audio_url: createExerciseDto.audio_url || null,
        image_url: createExerciseDto.image_url || null,
        tags: createExerciseDto.tags || [],
        metadata: createExerciseDto.metadata || {},
      };

      const result = await this.db.insert('language_exercises', exerciseData);
      return this.formatExercise(result);
    } catch (error) {
      throw new BadRequestException(`Failed to create exercise: ${error.message}`);
    }
  }

  async getExercises(userId: string, query: ExerciseQueryDto): Promise<PaginatedLanguageExercisesDto> {
    try {
      const { page = 1, limit = 20, sort_by = 'created_at', sort_order = 'desc', ...filters } = query;
      const offset = (page - 1) * limit;

      const whereConditions: any = { user_id: userId };

      if (filters.language_code) {
        whereConditions.language_code = filters.language_code;
      }

      if (filters.type) {
        whereConditions.type = filters.type;
      }

      if (filters.lesson_id) {
        whereConditions.lesson_id = filters.lesson_id;
      }

      if (filters.search) {
        whereConditions.question = { $ilike: `%${filters.search}%` };
      }

      const exercises = await this.db.select('language_exercises', {
        where: whereConditions,
        orderBy: sort_by,
        order: sort_order,
        limit,
        offset,
      });

      const allRecords = await this.db.findMany('language_exercises', whereConditions);
      const totalCount = allRecords.length;

      return {
        data: exercises.map(this.formatExercise),
        total: totalCount,
        page,
        limit,
        total_pages: Math.ceil(totalCount / limit),
      };
    } catch (error) {
      throw new BadRequestException(`Failed to fetch exercises: ${error.message}`);
    }
  }

  async getExerciseById(userId: string, exerciseId: string): Promise<ExerciseResponseDto> {
    try {
      const exercise = await this.db.findOne('language_exercises', { 
        id: exerciseId, 
        user_id: userId 
      });

      if (!exercise) {
        throw new NotFoundException('Exercise not found');
      }

      return this.formatExercise(exercise);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to fetch exercise: ${error.message}`);
    }
  }

  async deleteExercise(userId: string, exerciseId: string): Promise<void> {
    try {
      const existingExercise = await this.db.findOne('language_exercises', { 
        id: exerciseId, 
        user_id: userId 
      });

      if (!existingExercise) {
        throw new NotFoundException('Exercise not found');
      }

      await this.db.delete('language_exercises', exerciseId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to delete exercise: ${error.message}`);
    }
  }

  // =============================================
  // VOCABULARY OPERATIONS
  // =============================================

  async createVocabulary(userId: string, createVocabularyDto: CreateVocabularyDto): Promise<VocabularyResponseDto> {
    try {
      const vocabularyData = {
        user_id: userId,
        word: createVocabularyDto.word,
        translation: createVocabularyDto.translation,
        language_code: createVocabularyDto.language_code,
        translation_language: createVocabularyDto.translation_language,
        word_type: createVocabularyDto.word_type,
        phonetic: createVocabularyDto.phonetic || null,
        definition: createVocabularyDto.definition || null,
        example_sentence: createVocabularyDto.example_sentence || null,
        example_translation: createVocabularyDto.example_translation || null,
        audio_url: createVocabularyDto.audio_url || null,
        image_url: createVocabularyDto.image_url || null,
        difficulty_level: createVocabularyDto.difficulty_level || 5,
        frequency: createVocabularyDto.frequency || 5,
        category: createVocabularyDto.category || null,
        tags: createVocabularyDto.tags || [],
        metadata: createVocabularyDto.metadata || {},
      };

      const result = await this.db.insert('language_vocabulary', vocabularyData);
      return this.formatVocabulary(result);
    } catch (error) {
      throw new BadRequestException(`Failed to create vocabulary: ${error.message}`);
    }
  }

  async getVocabulary(userId: string, query: VocabularyQueryDto): Promise<PaginatedVocabularyDto> {
    try {
      const { page = 1, limit = 50, sort_by = 'created_at', sort_order = 'desc', ...filters } = query;
      const offset = (page - 1) * limit;

      const whereConditions: any = { user_id: userId };

      if (filters.language_code) {
        whereConditions.language_code = filters.language_code;
      }

      if (filters.category) {
        whereConditions.category = filters.category;
      }

      if (filters.difficulty_level) {
        whereConditions.difficulty_level = filters.difficulty_level;
      }

      if (filters.search) {
        whereConditions.$or = [
          { word: { $ilike: `%${filters.search}%` } },
          { translation: { $ilike: `%${filters.search}%` } }
        ];
      }

      const vocabulary = await this.db.select('language_vocabulary', {
        where: whereConditions,
        orderBy: sort_by,
        order: sort_order,
        limit,
        offset,
      });

      const allRecords = await this.db.findMany('language_vocabulary', whereConditions);
      const totalCount = allRecords.length;

      return {
        data: vocabulary.map(this.formatVocabulary),
        total: totalCount,
        page,
        limit,
        total_pages: Math.ceil(totalCount / limit),
      };
    } catch (error) {
      throw new BadRequestException(`Failed to fetch vocabulary: ${error.message}`);
    }
  }

  async getVocabularyById(userId: string, vocabularyId: string): Promise<VocabularyResponseDto> {
    try {
      const vocabulary = await this.db.findOne('language_vocabulary', { 
        id: vocabularyId, 
        user_id: userId 
      });

      if (!vocabulary) {
        throw new NotFoundException('Vocabulary not found');
      }

      return this.formatVocabulary(vocabulary);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to fetch vocabulary: ${error.message}`);
    }
  }

  async deleteVocabulary(userId: string, vocabularyId: string): Promise<void> {
    try {
      const existingVocabulary = await this.db.findOne('language_vocabulary', { 
        id: vocabularyId, 
        user_id: userId 
      });

      if (!existingVocabulary) {
        throw new NotFoundException('Vocabulary not found');
      }

      await this.db.delete('language_vocabulary', vocabularyId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to delete vocabulary: ${error.message}`);
    }
  }

  // =============================================
  // PROGRESS OPERATIONS
  // =============================================

  async updateProgress(userId: string, updateProgressDto: UpdateProgressDto): Promise<ProgressResponseDto> {
    try {
      const progressData = {
        user_id: userId,
        activity_type: updateProgressDto.activity_type,
        language_code: updateProgressDto.language_code,
        lesson_id: updateProgressDto.lesson_id || null,
        exercise_id: updateProgressDto.exercise_id || null,
        vocabulary_id: updateProgressDto.vocabulary_id || null,
        points_earned: updateProgressDto.points_earned || 0,
        accuracy: updateProgressDto.accuracy || null,
        time_spent: updateProgressDto.time_spent || null,
        completed: updateProgressDto.completed ?? true,
        mistakes: updateProgressDto.mistakes || [],
        metadata: updateProgressDto.metadata || {},
      };

      const result = await this.db.insert('language_progress', progressData);
      return this.formatProgress(result);
    } catch (error) {
      throw new BadRequestException(`Failed to update progress: ${error.message}`);
    }
  }

  async getProgress(userId: string, query: ProgressQueryDto): Promise<PaginatedProgressDto> {
    try {
      const { page = 1, limit = 50, sort_by = 'created_at', sort_order = 'desc', ...filters } = query;
      const offset = (page - 1) * limit;

      const whereConditions: any = { user_id: userId };

      if (filters.language_code) {
        whereConditions.language_code = filters.language_code;
      }

      if (filters.activity_types && filters.activity_types.length > 0) {
        whereConditions.activity_type = { $in: filters.activity_types };
      }

      if (filters.start_date || filters.end_date) {
        whereConditions.created_at = {};
        if (filters.start_date) {
          whereConditions.created_at.$gte = new Date(filters.start_date);
        }
        if (filters.end_date) {
          whereConditions.created_at.$lte = new Date(filters.end_date + 'T23:59:59.999Z');
        }
      }

      const progress = await this.db.select('language_progress', {
        where: whereConditions,
        orderBy: sort_by,
        order: sort_order,
        limit,
        offset,
      });

      const allRecords = await this.db.findMany('language_progress', whereConditions);
      const totalCount = allRecords.length;

      return {
        data: progress.map(this.formatProgress),
        total: totalCount,
        page,
        limit,
        total_pages: Math.ceil(totalCount / limit),
      };
    } catch (error) {
      throw new BadRequestException(`Failed to fetch progress: ${error.message}`);
    }
  }

  async getStats(userId: string, languageCode?: string): Promise<LanguageStatsDto[]> {
    try {
      const whereConditions: any = { user_id: userId };
      if (languageCode) {
        whereConditions.language_code = languageCode;
      }

      const progressRecords = await this.db.findMany('language_progress', whereConditions);
      const statsMap = new Map<string, LanguageStatsDto>();

      progressRecords.forEach((record: any) => {
        const lang = record.language_code;
        
        if (!statsMap.has(lang)) {
          statsMap.set(lang, {
            language_code: lang,
            total_points: 0,
            current_streak: 0,
            lessons_completed: 0,
            exercises_completed: 0,
            vocabulary_learned: 0,
            average_accuracy: 0,
            time_spent: 0,
          });
        }

        const stats = statsMap.get(lang)!;
        stats.total_points += record.points_earned || 0;
        stats.time_spent += record.time_spent || 0;

        if (record.activity_type === 'lesson_completed') {
          stats.lessons_completed++;
        } else if (record.activity_type === 'exercise_completed') {
          stats.exercises_completed++;
        } else if (record.activity_type === 'vocabulary_learned') {
          stats.vocabulary_learned++;
        }
      });

      // Calculate current streak and average accuracy (simplified)
      statsMap.forEach((stats, lang) => {
        const langRecords = progressRecords.filter((r: any) => r.language_code === lang);
        const accuracyRecords = langRecords.filter((r: any) => r.accuracy != null);
        
        if (accuracyRecords.length > 0) {
          stats.average_accuracy = parseFloat(
            (accuracyRecords.reduce((sum: number, r: any) => sum + r.accuracy, 0) / accuracyRecords.length).toFixed(1)
          );
        }

        // Simplified streak calculation
        stats.current_streak = this.calculateStreak(langRecords);
      });

      return Array.from(statsMap.values());
    } catch (error) {
      throw new BadRequestException(`Failed to fetch stats: ${error.message}`);
    }
  }

  async getLeaderboard(query: LeaderboardQueryDto): Promise<LeaderboardEntryDto[]> {
    try {
      const { limit = 100, language_code, period = 'all_time' } = query;

      let whereConditions: any = {};
      if (language_code) {
        whereConditions.language_code = language_code;
      }

      // Filter by time period
      if (period !== 'all_time') {
        const now = new Date();
        let startDate: Date;

        switch (period) {
          case 'daily':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
          case 'weekly':
            startDate = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
            break;
          case 'monthly':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
          default:
            startDate = new Date(0);
        }

        whereConditions.created_at = { $gte: startDate };
      }

      const progressRecords = await this.db.findMany('language_progress', whereConditions);
      const userStats = new Map<string, any>();

      progressRecords.forEach((record: any) => {
        const userId = record.user_id;
        
        if (!userStats.has(userId)) {
          userStats.set(userId, {
            user_id: userId,
            total_points: 0,
            current_streak: 0,
          });
        }

        const stats = userStats.get(userId)!;
        stats.total_points += record.points_earned || 0;
      });

      // Convert to array and sort by points
      const leaderboard = Array.from(userStats.values())
        .sort((a, b) => b.total_points - a.total_points)
        .slice(0, limit)
        .map((entry, index) => ({
          ...entry,
          rank: index + 1,
          username: `User ${entry.user_id.slice(-4)}` // Simplified username
        }));

      return leaderboard;
    } catch (error) {
      throw new BadRequestException(`Failed to fetch leaderboard: ${error.message}`);
    }
  }

  async getAchievements(userId: string, languageCode?: string): Promise<LanguageAchievementDto[]> {
    try {
      // Get user progress
      const whereConditions: any = { user_id: userId };
      if (languageCode) {
        whereConditions.language_code = languageCode;
      }

      const progressRecords = await this.db.findMany('language_progress', whereConditions);
      
      // Calculate achievements based on progress
      const achievements = this.calculateAchievements(progressRecords);
      
      return achievements;
    } catch (error) {
      throw new BadRequestException(`Failed to fetch achievements: ${error.message}`);
    }
  }

  async getAvailableLanguages(): Promise<any[]> {
    return [
      { code: 'es', name: 'Spanish', native_name: 'Español', flag: '🇪🇸' },
      { code: 'fr', name: 'French', native_name: 'Français', flag: '🇫🇷' },
      { code: 'de', name: 'German', native_name: 'Deutsch', flag: '🇩🇪' },
      { code: 'it', name: 'Italian', native_name: 'Italiano', flag: '🇮🇹' },
      { code: 'pt', name: 'Portuguese', native_name: 'Português', flag: '🇵🇹' },
      { code: 'zh', name: 'Chinese', native_name: '中文', flag: '🇨🇳' },
      { code: 'ja', name: 'Japanese', native_name: '日本語', flag: '🇯🇵' },
      { code: 'ko', name: 'Korean', native_name: '한국어', flag: '🇰🇷' },
      { code: 'ru', name: 'Russian', native_name: 'Русский', flag: '🇷🇺' },
      { code: 'ar', name: 'Arabic', native_name: 'العربية', flag: '🇸🇦' }
    ];
  }

  // =============================================
  // HELPER METHODS
  // =============================================

  private formatLesson(lesson: any): LanguageLessonResponseDto {
    return {
      id: lesson.id,
      user_id: lesson.user_id,
      title: lesson.title,
      description: lesson.description,
      language_code: lesson.language_code,
      source_language: lesson.source_language,
      skill: lesson.skill,
      difficulty: lesson.difficulty,
      duration_minutes: lesson.duration_minutes,
      content: lesson.content || [],
      tags: lesson.tags || [],
      is_published: lesson.is_published || false,
      metadata: lesson.metadata || {},
      created_at: lesson.created_at,
      updated_at: lesson.updated_at,
    };
  }

  private formatExercise(exercise: any): ExerciseResponseDto {
    return {
      id: exercise.id,
      user_id: exercise.user_id,
      question: exercise.question,
      type: exercise.type,
      language_code: exercise.language_code,
      lesson_id: exercise.lesson_id,
      answers: exercise.answers || [],
      explanation: exercise.explanation,
      hints: exercise.hints || [],
      points: exercise.points || 10,
      audio_url: exercise.audio_url,
      image_url: exercise.image_url,
      tags: exercise.tags || [],
      metadata: exercise.metadata || {},
      created_at: exercise.created_at,
    };
  }

  private formatVocabulary(vocabulary: any): VocabularyResponseDto {
    return {
      id: vocabulary.id,
      user_id: vocabulary.user_id,
      word: vocabulary.word,
      translation: vocabulary.translation,
      language_code: vocabulary.language_code,
      translation_language: vocabulary.translation_language,
      word_type: vocabulary.word_type,
      phonetic: vocabulary.phonetic,
      definition: vocabulary.definition,
      example_sentence: vocabulary.example_sentence,
      example_translation: vocabulary.example_translation,
      audio_url: vocabulary.audio_url,
      image_url: vocabulary.image_url,
      difficulty_level: vocabulary.difficulty_level || 5,
      frequency: vocabulary.frequency || 5,
      category: vocabulary.category,
      tags: vocabulary.tags || [],
      metadata: vocabulary.metadata || {},
      created_at: vocabulary.created_at,
    };
  }

  private formatProgress(progress: any): ProgressResponseDto {
    return {
      id: progress.id,
      user_id: progress.user_id,
      activity_type: progress.activity_type,
      language_code: progress.language_code,
      lesson_id: progress.lesson_id,
      exercise_id: progress.exercise_id,
      vocabulary_id: progress.vocabulary_id,
      points_earned: progress.points_earned || 0,
      accuracy: progress.accuracy,
      time_spent: progress.time_spent,
      completed: progress.completed || false,
      mistakes: progress.mistakes || [],
      metadata: progress.metadata || {},
      created_at: progress.created_at,
    };
  }

  private calculateStreak(progressRecords: any[]): number {
    // Simplified streak calculation - count consecutive days with activity
    if (progressRecords.length === 0) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const dates = new Set(
      progressRecords.map((r: any) => {
        const date = new Date(r.created_at);
        date.setHours(0, 0, 0, 0);
        return date.getTime();
      })
    );

    let streak = 0;
    let currentDate = today.getTime();

    while (dates.has(currentDate)) {
      streak++;
      currentDate -= 24 * 60 * 60 * 1000; // Go back one day
    }

    return streak;
  }

  private calculateAchievements(progressRecords: any[]): LanguageAchievementDto[] {
    const achievements: LanguageAchievementDto[] = [];
    
    const totalPoints = progressRecords.reduce((sum: number, r: any) => sum + (r.points_earned || 0), 0);
    const lessonsCompleted = progressRecords.filter((r: any) => r.activity_type === 'lesson_completed').length;
    const vocabularyLearned = progressRecords.filter((r: any) => r.activity_type === 'vocabulary_learned').length;

    // Define achievements
    const achievementDefinitions = [
      { name: 'First Steps', description: 'Complete your first lesson', threshold: 1, type: 'lessons', points: 10 },
      { name: 'Dedicated Learner', description: 'Complete 10 lessons', threshold: 10, type: 'lessons', points: 50 },
      { name: 'Word Collector', description: 'Learn 50 vocabulary words', threshold: 50, type: 'vocabulary', points: 30 },
      { name: 'Point Master', description: 'Earn 1000 points', threshold: 1000, type: 'points', points: 100 },
    ];

    achievementDefinitions.forEach((def, index) => {
      let currentCount = 0;
      
      switch (def.type) {
        case 'lessons':
          currentCount = lessonsCompleted;
          break;
        case 'vocabulary':
          currentCount = vocabularyLearned;
          break;
        case 'points':
          currentCount = totalPoints;
          break;
      }

      const unlocked = currentCount >= def.threshold;
      
      achievements.push({
        id: `achievement_${index + 1}`,
        name: def.name,
        description: def.description,
        icon_url: `/achievements/icon_${index + 1}.png`,
        points: def.points,
        unlocked,
        unlocked_at: unlocked ? new Date().toISOString() : undefined,
      });
    });

    return achievements;
  }
}