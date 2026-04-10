import React, { useState, useMemo } from 'react';
import { Calendar, Trophy, Target, Clock, Flame, Award, Bell, ArrowLeft, Crown, Star, TrendingUp, BookOpen, RotateCcw, X, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { Switch } from '../../components/ui/switch';
import LanguageFlag from '../../components/language-learner/ui/LanguageFlag';
import XPCounter from '../../components/language-learner/ui/XPCounter';
import StreakCounter from '../../components/language-learner/dashboard/StreakCounter';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { languageApiService, ComprehensiveUserProgress, LessonProgressResponse, VocabularyWord, PaginatedResponse, LearningAnalytics, SimpleAchievement } from '../../services/languageApi';
import { useSelectedLesson } from '../../hooks/useSelectedLesson';

// Import API hooks
import {
  useUserLeaderboardPosition,
  useProgressAnalytics,
  useProgressDashboard,
  useStudySessionStats,
  useVocabularyStats,
  useLessons
} from '../../hooks/language-learner';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  earned: boolean;
  earnedDate?: Date;
  category: 'streak' | 'xp' | 'lessons' | 'social' | 'special';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface LearningStats {
  totalXP: number;
  currentStreak: number;
  longestStreak: number;
  totalLessons: number;
  totalPractice: number;
  averageScore: number;
  timeStudied: number; // in minutes
  wordsLearned: number;
  currentLevel: number;
  joinDate: Date;
  lastActive: Date;
}

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { lessonId } = useSelectedLesson();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [reminderTime, setReminderTime] = useState('19:00');
  const [userProgress, setUserProgress] = useState<ComprehensiveUserProgress | null>(null);
  const [lessonProgress, setLessonProgress] = useState<LessonProgressResponse | null>(null);
  const [vocabularyData, setVocabularyData] = useState<{ total: number; completed: number } | null>(null);
  const [analyticsData, setAnalyticsData] = useState<LearningAnalytics | null>(null);
  const [achievementsData, setAchievementsData] = useState<SimpleAchievement[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const hasFetchedRef = React.useRef(false);

  // Memoize params to prevent infinite re-renders
  const lessonsParams = useMemo(() => ({ language_code: 'es', limit: 1000 }), []);

  // API Hooks
  const { data: userPosition, isLoading: isLoadingUserPosition, error: userPositionError } = useUserLeaderboardPosition('es');
  const { data: progressAnalytics, isLoading: isLoadingAnalytics } = useProgressAnalytics('es', 30);
  const { data: progressDashboard, isLoading: isLoadingDashboard } = useProgressDashboard('es');
  const { data: studySessionStats, isLoading: isLoadingStudyStats } = useStudySessionStats('es', 30);
  const { stats: vocabularyStats, isLoading: isLoadingVocabStats } = useVocabularyStats('es');
  // const { data: lessonsData, isLoading: isLoadingLessons } = useLessons(lessonsParams);

  // Fetch all data once on mount
  React.useEffect(() => {
    if (!user?.id || !isAuthenticated || hasFetchedRef.current) return;

    const fetchAllData = async () => {
      setIsInitialLoading(true);
      hasFetchedRef.current = true;

      try {
        // Fetch all data in parallel
        const [progress, lessonProg, vocabData, analytics, achievements] = await Promise.all([
          // User progress
          (async () => {
            try {
              const params: any = { include_details: false };
              if (lessonId) params.lesson_id = lessonId;
              return await languageApiService.getComprehensiveUserProgress(user.id, params);
            } catch (error) {
              console.error('Failed to fetch user progress:', error);
              return null;
            }
          })(),
          // Lesson progress
          (async () => {
            try {
              if (!lessonId) return null;
              return await languageApiService.getLessonProgress(user.id, lessonId);
            } catch (error) {
              console.error('Failed to fetch lesson progress:', error);
              return null;
            }
          })(),
          // Vocabulary data
          (async () => {
            try {
              const response = await languageApiService.getVocabulary({
                language_code: 'es',
                page: 1,
                limit: 1000
              });
              return {
                total: response.total,
                completed: response.data.filter(word => word.is_completed).length
              };
            } catch (error) {
              console.error('Failed to fetch vocabulary data:', error);
              return null;
            }
          })(),
          // Analytics data
          (async () => {
            try {
              return await languageApiService.getLearningAnalytics(user.id, {
                period: 'all',
                lesson_id: lessonId
              });
            } catch (error) {
              console.error('Failed to fetch analytics data:', error);
              return null;
            }
          })(),
          // Achievements
          (async () => {
            try {
              return await languageApiService.getAchievements({ language_code: 'es' });
            } catch (error) {
              console.error('Failed to fetch achievements:', error);
              return [];
            }
          })()
        ]);

        setUserProgress(progress);
        setLessonProgress(lessonProg);
        setVocabularyData(vocabData);
        setAnalyticsData(analytics);
        setAchievementsData(achievements);
      } finally {
        setIsInitialLoading(false);
      }
    };

    fetchAllData();
  }, [user?.id, isAuthenticated, lessonId]);


  // Derive user stats from API data
  const userStats: LearningStats = useMemo(() => {
    if (!userPosition || !progressAnalytics || !studySessionStats || !vocabularyStats) {
      return {
        totalXP: 0,
        currentStreak: 0,
        longestStreak: 0,
        totalLessons: 0,
        totalPractice: 0,
        averageScore: 0,
        timeStudied: 0,
        wordsLearned: 0,
        currentLevel: 1,
        joinDate: new Date(),
        lastActive: new Date()
      };
    }

    return {
      totalXP: userPosition.total_xp || 0,
      currentStreak: userPosition.current_streak || 0,
      longestStreak: userPosition.best_streak || 0,
      totalLessons: userPosition.lessons_completed || 0,
      totalPractice: studySessionStats.totalSessions || 0,
      averageScore: Math.round(studySessionStats.averageAccuracy || 0),
      timeStudied: Math.round(studySessionStats.totalTimeMinutes || 0),
      wordsLearned: vocabularyStats.totalWords || 0,
      currentLevel: Math.floor((userPosition.total_xp || 0) / 1000) + 1,
      joinDate: new Date('2024-01-15'), // This would come from user profile API
      lastActive: new Date()
    };
  }, [userPosition, progressAnalytics, studySessionStats, vocabularyStats]);


  // Derive weekly XP data from analytics API
  const weeklyXp = useMemo(() => {
    if (!analyticsData?.study_time?.daily_breakdown || analyticsData.study_time.daily_breakdown.length === 0) {
      return [0, 0, 0, 0, 0, 0, 0]; // Mon, Tue, Wed, Thu, Fri, Sat, Sun
    }

    const breakdown = analyticsData.study_time.daily_breakdown;
    const weekData = [0, 0, 0, 0, 0, 0, 0]; // Mon, Tue, Wed, Thu, Fri, Sat, Sun

    // Map API dates to correct day positions
    breakdown.forEach(dayData => {
      const date = new Date(dayData.date + 'T00:00:00');
      const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const arrayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      weekData[arrayIndex] = dayData.xp || 0;
    });

    return weekData;
  }, [analyticsData]);

  // Derive monthly data from analytics API
  const monthlyData = useMemo(() => {
    if (!analyticsData?.study_time?.daily_breakdown) {
      return [];
    }

    // Group daily breakdown by month
    const monthlyMap = new Map();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    analyticsData.study_time.daily_breakdown.forEach(day => {
      const date = new Date(day.date);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      const monthName = monthNames[date.getMonth()];

      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, { month: monthName, xp: 0, lessons: 0 });
      }

      const monthData = monthlyMap.get(monthKey);
      monthData.xp += day.xp;
      monthData.lessons += day.exercises_completed;
    });

    return Array.from(monthlyMap.values()).slice(-6); // Last 6 months
  }, [analyticsData]);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common':
        return 'border-gray-300 dark:border-gray-600';
      case 'rare':
        return 'border-blue-400 dark:border-blue-500 bg-blue-50 dark:bg-blue-900/20';
      case 'epic':
        return 'border-purple-400 dark:border-purple-500 bg-purple-50 dark:bg-purple-900/20';
      case 'legendary':
        return 'border-yellow-400 dark:border-yellow-500 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20';
      default:
        return 'border-gray-300 dark:border-gray-600';
    }
  };

  const formatTimeStudied = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`;
    }
    return `${remainingMinutes}m`;
  };

  const getCurrentLevel = (xp: number) => {
    return Math.floor(xp / 1000) + 1;
  };

  const getXPForNextLevel = (currentXP: number) => {
    const currentLevel = getCurrentLevel(currentXP);
    return currentLevel * 1000;
  };

  // Map icon names to emojis
  const getAchievementIcon = (iconUrl: string | undefined) => {
    if (!iconUrl) return '🏆';
    const iconMap: Record<string, string> = {
      'icon_1': '👶',
      'icon_2': '📚',
      'icon_3': '🎓',
      'icon_4': '💪',
      'icon_5': '⭐',
      'icon_6': '📖',
      'icon_7': '🧠',
      'icon_8': '💰',
      'icon_9': '💎',
      'icon_10': '👑'
    };
    const iconName = iconUrl.split('/').pop()?.replace('.png', '') || '';
    return iconMap[iconName] || '🏆';
  };

  // Loading state
  const isLoading = isLoadingUserPosition || isLoadingAnalytics || isLoadingDashboard || isLoadingStudyStats || isLoadingVocabStats;

  // Handle loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading your profile...</p>
        </div>
      </div>
    );
  }

  // Handle error states
  if (userPositionError) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Error Loading Profile</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {userPositionError.message || 'Failed to load your learning profile.'}
          </p>
          <div className="space-x-4">
            <Button onClick={() => window.location.reload()} variant="outline">
              <RotateCcw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button onClick={() => navigate('/language-learner/dashboard')}>
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show loading skeleton while initial data is being fetched
  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Page Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/language-learner/dashboard')}
                className="text-gray-600 dark:text-gray-400"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Learning Profile
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Track your progress and achievements
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto p-6">
          {/* Loading Skeleton */}
          <Card className="mb-6 animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-2"></div>
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {[...Array(2)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">

      {/* Page Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/language-learner/dashboard')}
              className="text-gray-600 dark:text-gray-400"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Learning Profile
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Track your progress and achievements
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {/* Profile Header */}
        <Card className="mb-6 bg-gradient-to-r from-primary/5 to-blue-50 dark:from-primary/10 dark:to-blue-900/20 border-primary/20">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {(user?.name || 'L').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {user?.name || 'Language Learner'}
                  </h2>
                  <div className="flex items-center space-x-3 mt-2">
                    <LanguageFlag languageCode="es" showName languageName="Spanish" />
                    {userPosition?.rank_position && (
                      <Badge variant="outline">
                        Rank #{userPosition.rank_position}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-8">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {userProgress?.overall_progress?.streak_days ?? 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Day Streak</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {(userProgress?.overall_progress?.total_points_earned ?? 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total XP</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Statistics</h2>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Course Progress */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BookOpen className="h-5 w-5 text-primary" />
                    <span>Course Progress</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!lessonProgress ? (
                    <div className="text-center animate-pulse">
                      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-24 mx-auto mb-2"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mx-auto mb-4"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        {lessonProgress.lesson_progress.units_completed}/{lessonProgress.lesson_progress.total_units}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Units completed
                      </div>
                      <Progress
                        value={(lessonProgress.lesson_progress.units_completed / lessonProgress.lesson_progress.total_units) * 100}
                        className="h-3"
                      />
                      <div className="text-center text-xs text-gray-500 dark:text-gray-400 mt-2">
                        {Math.round((lessonProgress.lesson_progress.units_completed / lessonProgress.lesson_progress.total_units) * 100)}% complete
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Word Learning Progress */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BookOpen className="h-5 w-5 text-emerald-500" />
                    <span>Word Learning Progress</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!vocabularyData ? (
                    <div className="text-center animate-pulse">
                      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-24 mx-auto mb-2"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mx-auto mb-4"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        {vocabularyData.completed}/{vocabularyData.total}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                        Words learned
                      </div>
                      <Progress
                        value={(vocabularyData.completed / vocabularyData.total) * 100}
                        className="h-3"
                      />
                      <div className="text-center text-xs text-gray-500 dark:text-gray-400 mt-2">
                        {Math.round((vocabularyData.completed / vocabularyData.total) * 100)}% mastered
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Monthly Progress Chart */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-purple-500" />
                    <span>Monthly Progress</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!analyticsData ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading monthly progress...</div>
                  ) : monthlyData.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">No activity data available yet</div>
                  ) : (
                    <div className="space-y-4">
                      {monthlyData.map((month, index) => (
                        <div key={`${month.month}-${index}`} className="flex items-center space-x-4">
                          <div className="w-12 text-sm text-gray-600 dark:text-gray-400">
                            {month.month}
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-900 dark:text-white">{month.xp} XP</span>
                              <span className="text-gray-600 dark:text-gray-400">{month.lessons} exercises</span>
                            </div>
                            <Progress value={month.xp > 0 ? Math.min((month.xp / 100) * 100, 100) : 0} className="h-2" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Achievements Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <Award className="h-6 w-6" />
            Achievements
          </h2>
          {achievementsData.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading achievements...</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {achievementsData.map((achievement) => (
                <div
                  key={achievement.id}
                  className={`p-4 rounded-lg text-center transition-all duration-300 ${
                    achievement.unlocked
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800'
                      : 'bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 opacity-60'
                  }`}
                >
                  <div className={`text-4xl mb-2 ${achievement.unlocked ? '' : 'grayscale opacity-50'}`}>
                    {getAchievementIcon(achievement.icon_url)}
                  </div>
                  <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-1">
                    {achievement.name}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {achievement.unlocked_at
                      ? new Date(achievement.unlocked_at).toLocaleDateString()
                      : `${achievement.points} pts`}
                  </p>
                  {!achievement.unlocked && achievement.progress !== undefined && (
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                        <div
                          className="bg-blue-500 h-1.5 rounded-full"
                          style={{ width: `${achievement.progress}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {achievement.current}/{achievement.target}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* This Week's Progress Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">This Week's Progress</h2>
          <div className="space-y-6">
            <Card>
              <CardHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <BarChart3 className="h-5 w-5 text-primary" />
                  </div>
                  This Week's Progress
                </CardTitle>
                <CardDescription className="mt-2">
                  Keep up the momentum! 🔥
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {weeklyXp && weeklyXp.length > 0 && weeklyXp.some(xp => xp > 0) ? (
                  <div className="space-y-6">
                    {/* Summary Stats */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="h-4 w-4 text-primary" />
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Total XP</p>
                        </div>
                        <p className="text-3xl font-bold text-primary">
                          {weeklyXp.reduce((a, b) => a + b, 0)}
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Flame className="h-4 w-4 text-emerald-600" />
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Active Days</p>
                        </div>
                        <p className="text-3xl font-bold text-emerald-600">
                          {weeklyXp.filter(xp => xp > 0).length}
                        </p>
                      </div>
                    </div>

                    {/* Bar Chart */}
                    <div className="relative">
                      {/* Y-axis label */}
                      <div className="absolute -left-10 top-1/2 -translate-y-1/2 -rotate-90 origin-center">
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">XP</span>
                      </div>

                      {/* Chart area */}
                      <div className="flex gap-4">
                        {/* Y-axis scale */}
                        <div className="flex flex-col-reverse justify-between h-64 py-2 text-xs text-gray-600 dark:text-gray-400 font-medium">
                          {(() => {
                            const maxXp = Math.max(...weeklyXp) || 1;
                            const step = Math.ceil(maxXp / 5);
                            const scale = Array.from({ length: 6 }, (_, i) => step * i);
                            return scale.map((value, i) => (
                              <div key={i} className="leading-none">{value}</div>
                            ));
                          })()}
                        </div>

                        {/* Chart with grid */}
                        <div className="flex-1 relative">
                          {/* Horizontal grid lines */}
                          <div className="absolute inset-0 flex flex-col justify-between py-2">
                            {[...Array(6)].map((_, i) => (
                              <div key={i} className="border-t border-gray-200 dark:border-gray-700" />
                            ))}
                          </div>

                          {/* Bars */}
                          <div className="relative h-64 flex items-end justify-around gap-2 px-4">
                            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
                              const xpValue = weeklyXp[index] || 0;
                              const maxXp = Math.max(...weeklyXp) || 1;
                              const heightPercent = maxXp > 0 ? (xpValue / maxXp) * 100 : 0;
                              const today = new Date().getDay();
                              const todayIndex = today === 0 ? 6 : today - 1;
                              const isToday = index === todayIndex;

                              const colors = ['#ef4444', '#22c55e', '#3b82f6', '#eab308', '#f97316', '#a855f7', '#ec4899'];
                              const color = colors[index];

                              return (
                                <div key={day} className="flex flex-col items-center flex-1 group">
                                  <div className="relative w-full flex flex-col items-center justify-end mb-2" style={{ height: '240px' }}>
                                    {xpValue > 0 && (
                                      <>
                                        <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                                          {xpValue}
                                        </div>
                                        <div
                                          className="w-full rounded-sm transition-all duration-300 group-hover:brightness-110 relative"
                                          style={{
                                            height: `${Math.max(heightPercent, 2)}%`,
                                            backgroundColor: color,
                                            border: isToday ? '2px solid currentColor' : 'none',
                                            boxShadow: isToday ? '0 0 0 2px white, 0 0 0 4px currentColor' : 'none'
                                          }}
                                        >
                                          <span className="absolute inset-0 flex items-center justify-center text-white font-semibold text-sm rotate-90">
                                            {day}
                                          </span>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                  <span className={`text-sm font-medium mt-1 ${
                                    isToday ? 'text-gray-900 dark:text-white font-bold' : 'text-gray-600 dark:text-gray-400'
                                  }`}>
                                    {day}
                                  </span>
                                </div>
                              );
                            })}
                          </div>

                          {/* X-axis */}
                          <div className="border-t-2 border-gray-900 dark:border-gray-100 ml-4" />
                        </div>
                      </div>

                      {/* X-axis label */}
                      <div className="text-center mt-3">
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Days</span>
                      </div>

                      {/* Y-axis */}
                      <div className="absolute left-12 top-2 bottom-16 w-0.5 bg-gray-900 dark:bg-gray-100" />
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No activity this week yet. Start learning to see your progress!
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;