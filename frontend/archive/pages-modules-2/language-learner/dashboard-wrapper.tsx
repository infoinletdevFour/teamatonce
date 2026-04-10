import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSelectedLesson } from '../../hooks/useSelectedLesson';
import { Lesson, languageLessonsApiService } from '../../services/languageLessonsApi';
import { languageApiService, ComprehensiveUserProgress, SimpleLeaderboardEntry, SimpleAchievement, LearningAnalytics } from '../../services/languageApi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import {
  BookOpen,
  Flame,
  Crown,
  Target,
  Trophy,
  Calendar,
  TrendingUp,
  Play,
  Lock,
  CheckCircle,
  Star,
  Clock,
  Volume2,
  MessageCircle,
  Award,
  Users,
  BarChart3,
  ArrowRight,
  Zap,
  Gift
} from 'lucide-react';

const LanguageLearnerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { lessonId } = useSelectedLesson();
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [lessonLoading, setLessonLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [userProgress, setUserProgress] = useState<ComprehensiveUserProgress | null>(null);
  const [progressLoading, setProgressLoading] = useState(false);
  const [progressError, setProgressError] = useState<string | null>(null);
  const [leaderboard, setLeaderboard] = useState<SimpleLeaderboardEntry[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [leaderboardError, setLeaderboardError] = useState<string | null>(null);
  const [achievements, setAchievements] = useState<SimpleAchievement[]>([]);
  const [achievementsLoading, setAchievementsLoading] = useState(false);
  const [achievementsError, setAchievementsError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<LearningAnalytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user has completed onboarding
    const savedOnboarding = localStorage.getItem('languageLearnerOnboarding');
    const savedUser = localStorage.getItem('languageLearnerUser');

    if (!savedOnboarding && !savedUser) {
      navigate('/language-learner/onboarding');
      return;
    }

    // Update time every minute
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, [navigate]);

  // Fetch user progress data
  useEffect(() => {
    const fetchUserProgress = async () => {
      if (!user?.id || !isAuthenticated) return;

      setProgressLoading(true);
      setProgressError(null);

      try {
        const params: any = {};
        if (lessonId) {
          params.lesson_id = lessonId;
        }
        params.include_details = false; // Set to true if you want detailed exercise progress

        const progress = await languageApiService.getComprehensiveUserProgress(user.id, params);
        setUserProgress(progress);
      } catch (error) {
        console.error('Failed to fetch user progress:', error);
        setProgressError(error instanceof Error ? error.message : 'Failed to load progress data');
      } finally {
        setProgressLoading(false);
      }
    };

    fetchUserProgress();
  }, [user?.id, isAuthenticated, lessonId]);

  // Fetch leaderboard data
  useEffect(() => {
    const fetchLeaderboard = async () => {
      if (!isAuthenticated) return;

      setLeaderboardLoading(true);
      setLeaderboardError(null);

      try {
        const leaderboardData = await languageApiService.getLeaderboard({
          page: 1,
          limit: 5, // Only fetch top 5 for dashboard preview
          sort_by: 'total_points',
          sort_order: 'desc',
          period: 'all_time'
        });
        setLeaderboard(leaderboardData);
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error);
        setLeaderboardError(error instanceof Error ? error.message : 'Failed to load leaderboard');
      } finally {
        setLeaderboardLoading(false);
      }
    };

    fetchLeaderboard();
  }, [isAuthenticated]);

  // Fetch achievements data
  useEffect(() => {
    const fetchAchievements = async () => {
      if (!isAuthenticated) return;

      setAchievementsLoading(true);
      setAchievementsError(null);

      try {
        const savedOnboarding = localStorage.getItem('languageLearnerOnboarding');
        const onboardingData = savedOnboarding ? JSON.parse(savedOnboarding) : null;
        const targetLanguageCode = onboardingData?.targetLanguage || 'es'; // Default to Spanish

        const achievementsData = await languageApiService.getAchievements({
          language_code: targetLanguageCode
        });
        setAchievements(achievementsData);
      } catch (error) {
        console.error('Failed to fetch achievements:', error);
        setAchievementsError(error instanceof Error ? error.message : 'Failed to load achievements');
      } finally {
        setAchievementsLoading(false);
      }
    };

    fetchAchievements();
  }, [isAuthenticated]);

  // Fetch analytics data
  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!user?.id || !isAuthenticated) return;

      setAnalyticsLoading(true);
      setAnalyticsError(null);

      try {
        const analyticsData = await languageApiService.getLearningAnalytics(user.id, {
          period: '7d' // 7 days for weekly analytics
        });
        setAnalytics(analyticsData);
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
        setAnalyticsError(error instanceof Error ? error.message : 'Failed to load analytics');
      } finally {
        setAnalyticsLoading(false);
      }
    };

    fetchAnalytics();
  }, [user?.id, isAuthenticated]);

  // Fetch lesson data when lessonId is available
  useEffect(() => {
    if (lessonId) {
      const hasToken = !!localStorage.getItem('life_os_access_token');

      if (!hasToken) {
        return;
      }

      setLessonLoading(true);

      // Call the API service directly
      languageLessonsApiService.getLessonById(lessonId)
        .then((lesson) => {
          setSelectedLesson(lesson);
          setLessonLoading(false);
        })
        .catch((error) => {
          console.error('Dashboard: Lesson fetch failed:', error);
          setLessonLoading(false);
        });
    } else {
      setSelectedLesson(null);
      setLessonLoading(false);
    }
  }, [lessonId]);

  // Get saved user data from localStorage
  const savedOnboarding = localStorage.getItem('languageLearnerOnboarding');
  const savedUser = localStorage.getItem('languageLearnerUser');
  
  if (!savedOnboarding && !savedUser) {
    return null;
  }

  const onboardingData = savedOnboarding ? JSON.parse(savedOnboarding) : null;
  const userData = savedUser ? JSON.parse(savedUser) : null;

  // Determine daily goal source
  const lessonDailyGoal = selectedLesson?.metadata?.onboarding_preferences?.dailyGoal;
  const localDailyGoal = onboardingData?.dailyGoal;
  const finalDailyGoal = lessonDailyGoal || localDailyGoal || 15;

  // Memoize weekly XP calculation to prevent double loading
  const weeklyXp = useMemo(() => {
    // Try to get real analytics data first
    if (analytics?.study_time?.daily_breakdown && analytics.study_time.daily_breakdown.length > 0) {
      const breakdown = analytics.study_time.daily_breakdown;

      // Initialize week array [Mon, Tue, Wed, Thu, Fri, Sat, Sun]
      const weekData = [0, 0, 0, 0, 0, 0, 0];

      // Map API dates to correct day positions
      breakdown.forEach(dayData => {
        const date = new Date(dayData.date + 'T00:00:00'); // Add time to avoid timezone issues
        const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.

        // Convert to our array index: Monday=0, Tuesday=1, ..., Sunday=6
        const arrayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

        // Use points_earned or total_minutes or exercises_completed as XP proxy
        const dailyXP = dayData.points_earned || (dayData.total_minutes * 5) || (dayData.exercises_completed * 10) || 0;

        weekData[arrayIndex] = dailyXP;
      });

      return weekData;
    }

    // Fallback: Create a week with some activity for today
    const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
    const weekData = [0, 0, 0, 0, 0, 0, 0]; // Mon, Tue, Wed, Thu, Fri, Sat, Sun

    // Map Sunday (0) to index 6, Monday (1) to index 0, etc.
    const todayIndex = today === 0 ? 6 : today - 1;

    // Add some XP for today if we have any progress indicators
    if (userProgress?.overall_progress?.total_points_earned > 0) {
      weekData[todayIndex] = userProgress.overall_progress.total_points_earned; // Show actual total XP for today
    }

    return weekData;
  }, [analytics, userProgress?.overall_progress?.total_points_earned, analyticsLoading]);

  // Use only real API data - no mock data
  const dashboardData = useMemo(() => ({
    streak: userProgress?.overall_progress?.streak_days || 0,
    xp: userProgress?.overall_progress?.total_points_earned || 0,
    level: Math.floor((userProgress?.overall_progress?.total_points_earned || 0) / 100) + 1,
    todayProgress: analytics?.study_time?.total_minutes || 0,
    todayGoal: finalDailyGoal,
    weeklyXp,
    currentLesson: selectedLesson ? {
      title: selectedLesson.title,
      progress: 0, // Calculate from user progress if needed
      nextLesson: 'Continue Learning'
    } : null,
    achievements: achievements.map(achievement => ({
      title: achievement.name,
      icon: achievement.unlocked ? Star : BookOpen,
      unlocked: achievement.unlocked,
      description: achievement.description,
      points: achievement.points,
      progress: achievement.progress || 0,
      target: achievement.target || 100
    })),
    friends: leaderboard.map((entry, index) => ({
      name: entry.user_id === user?.id ? 'Me' : entry.username,
      xp: entry.total_points,
      avatar: entry.profile_image || '👤',
      rank: entry.rank,
      isUser: entry.user_id === user?.id
    }))
  }), [userProgress, analytics, finalDailyGoal, weeklyXp, selectedLesson, achievements, leaderboard, user?.id]);

  // Language mapping
  const languages: { [key: string]: { name: string; flag: string } } = {
    'es': { name: 'Spanish', flag: '🇪🇸' },
    'fr': { name: 'French', flag: '🇫🇷' },
    'de': { name: 'German', flag: '🇩🇪' },
    'it': { name: 'Italian', flag: '🇮🇹' },
    'pt': { name: 'Portuguese', flag: '🇵🇹' },
    'ja': { name: 'Japanese', flag: '🇯🇵' },
    'ko': { name: 'Korean', flag: '🇰🇷' },
    'zh': { name: 'Chinese', flag: '🇨🇳' },
    'ru': { name: 'Russian', flag: '🇷🇺' },
    'ar': { name: 'Arabic', flag: '🇸🇦' },
    'hi': { name: 'Hindi', flag: '🇮🇳' },
    'nl': { name: 'Dutch', flag: '🇳🇱' }
  };

  const targetLanguage = languages[onboardingData?.targetLanguage] || { name: 'Spanish', flag: '🇪🇸' };

  const getTimeOfDayGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const progressPercentage = Math.round((dashboardData.todayProgress / dashboardData.todayGoal) * 100);

  // Show loading state
  if (progressLoading || lessonLoading || leaderboardLoading || achievementsLoading || analyticsLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <span className="ml-4 text-lg">Loading dashboard...</span>
      </div>
    );
  }

  // Show error state
  if (progressError || leaderboardError || achievementsError || analyticsError) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="text-center max-w-md">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Error loading data</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {progressError || leaderboardError || achievementsError || analyticsError}
          </p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-blue-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {getTimeOfDayGreeting()}, {userData?.name || 'Learner'}!
              </h1>
              <p className="text-muted-foreground">
                {selectedLesson ? selectedLesson.title : `Let's continue your ${targetLanguage.name} journey`}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="flex items-center gap-2 mb-1">
                  <Flame className="h-5 w-5 text-orange-500" />
                  <span className="text-2xl font-bold">{dashboardData.streak}</span>
                </div>
                <span className="text-xs text-muted-foreground">day streak</span>
              </div>
              <div className="text-center">
                <div className="flex items-center gap-2 mb-1">
                  <Star className="h-5 w-5 text-yellow-500" />
                  <span className="text-2xl font-bold">{dashboardData.xp}</span>
                </div>
                <span className="text-xs text-muted-foreground">total XP</span>
              </div>
            </div>
          </div>

        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Continue Learning */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  {selectedLesson ? 'Selected Lesson' : 'Continue Learning'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedLesson ? (
                  // Show real lesson data
                  <>
                    <div className="mb-4">
                      <h3 className="text-lg font-semibold mb-1">{selectedLesson.title}</h3>
                      <p className="text-sm text-muted-foreground">{selectedLesson.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {selectedLesson.language_code.toUpperCase()}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {selectedLesson.skill}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {selectedLesson.difficulty}
                        </Badge>
                      </div>
                    </div>
                    <Button 
                      className="w-full" 
                      size="lg"
                      onClick={() => {
                        if (lessonId) {
                          navigate(`/language-learner/learning?lesson_id=${lessonId}`);
                        } else {
                          navigate('/language-learner/learning');
                        }
                      }}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Start Lesson
                    </Button>
                  </>
                ) : dashboardData.currentLesson ? (
                  // Show current lesson progress
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold mb-1">{dashboardData.currentLesson.title}</h3>
                        <p className="text-sm text-muted-foreground">{dashboardData.currentLesson.nextLesson}</p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary mb-1">
                          {dashboardData.currentLesson.progress}%
                        </div>
                        <span className="text-xs text-muted-foreground">Complete</span>
                      </div>
                    </div>
                    <Progress value={dashboardData.currentLesson.progress} className="mb-4" />
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={() => navigate('/language-learner/learning')}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Continue Lesson
                    </Button>
                  </>
                ) : (
                  // No lesson selected
                  <div className="text-center py-4">
                    <div className="text-muted-foreground text-4xl mb-2">📚</div>
                    <h3 className="text-lg font-semibold mb-1">Ready to Learn?</h3>
                    <p className="text-sm text-muted-foreground mb-4">Select a lesson to continue your journey</p>
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={() => navigate('/language-learner/learning')}
                    >
                      Browse Lessons
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card 
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate('/language-learner/practice')}
              >
                <CardContent className="p-4 text-center">
                  <Target className="h-8 w-8 text-primary mx-auto mb-2" />
                  <span className="text-sm font-medium">Practice</span>
                </CardContent>
              </Card>
              <Card 
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate('/language-learner/stories')}
              >
                <CardContent className="p-4 text-center">
                  <MessageCircle className="h-8 w-8 text-primary mx-auto mb-2" />
                  <span className="text-sm font-medium">Stories</span>
                </CardContent>
              </Card>
              <Card 
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate('/language-learner/sounds')}
              >
                <CardContent className="p-4 text-center">
                  <Volume2 className="h-8 w-8 text-primary mx-auto mb-2" />
                  <span className="text-sm font-medium">Sounds</span>
                </CardContent>
              </Card>
              <Card 
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate('/language-learner/vocabulary')}
              >
                <CardContent className="p-4 text-center">
                  <BookOpen className="h-8 w-8 text-primary mx-auto mb-2" />
                  <span className="text-sm font-medium">Vocabulary</span>
                </CardContent>
              </Card>
            </div>

            {/* Weekly Progress */}
            <Card className="overflow-hidden">
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
                {dashboardData.weeklyXp && dashboardData.weeklyXp.length > 0 && dashboardData.weeklyXp.some(xp => xp > 0) ? (
                  <div className="space-y-6">
                    {/* Summary Stats */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="h-4 w-4 text-primary" />
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Total XP</p>
                        </div>
                        <p className="text-3xl font-bold text-primary">
                          {dashboardData.weeklyXp.reduce((a, b) => a + b, 0)}
                        </p>
                      </div>
                      <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Flame className="h-4 w-4 text-emerald-600" />
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Active Days</p>
                        </div>
                        <p className="text-3xl font-bold text-emerald-600">
                          {dashboardData.weeklyXp.filter(xp => xp > 0).length}
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
                            const maxXp = Math.max(...dashboardData.weeklyXp) || 1;
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
                              const xpValue = dashboardData.weeklyXp[index] || 0;
                              const maxXp = Math.max(...dashboardData.weeklyXp) || 1;
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
                  <div className="flex flex-col items-center justify-center h-40 text-center">
                    <div className="p-4 rounded-full bg-muted/50 mb-3">
                      <BarChart3 className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">No progress data yet</p>
                    <p className="text-xs text-muted-foreground">Start learning to see your weekly progress!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Leaderboard Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Trophy className="h-5 w-5" />
                    Leaderboard
                  </span>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => navigate('/language-learner/leaderboard')}
                  >
                    View all
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dashboardData.friends.map((friend) => (
                    <div 
                      key={friend.rank}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        friend.isUser ? 'bg-primary/10' : 'bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-muted-foreground">
                          {friend.rank}
                        </span>
                        <span className="text-2xl">{friend.avatar}</span>
                        <span className="font-medium">{friend.name}</span>
                      </div>
                      <span className="font-semibold">{friend.xp} XP</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Achievements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Achievements
                  </span>
                  <Badge variant="outline">{dashboardData.level}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-3 max-h-80 overflow-y-auto">
                  {dashboardData.achievements.map((achievement, index) => {
                    const Icon = achievement.icon;
                    return (
                      <div
                        key={index}
                        className={`p-3 rounded-lg text-center ${
                          achievement.unlocked
                            ? 'bg-primary/10'
                            : 'bg-muted/50 opacity-60'
                        }`}
                        title={achievement.description}
                      >
                        <Icon className={`h-6 w-6 mx-auto mb-2 ${
                          achievement.unlocked ? 'text-primary' : 'text-muted-foreground'
                        }`} />
                        <span className="text-xs font-medium block">
                          {achievement.title}
                        </span>
                        {achievement.points && (
                          <span className="text-xs text-muted-foreground block mt-1">
                            {achievement.points} pts
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </div>
  );
};

export default LanguageLearnerDashboard;