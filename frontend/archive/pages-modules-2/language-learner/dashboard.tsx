import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../hooks';
import { useSelectedLesson } from '../../hooks/useSelectedLesson';
import { languageApiService, ComprehensiveUserProgress } from '../../services/languageApi';
import type { Lesson } from '../../services/languageLessonsApi';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import {
  BookOpen,
  Flame,
  Heart,
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
  Gift,
} from 'lucide-react';

const LanguageLearnerDashboard: React.FC = () => {
  console.log('🎯 LanguageLearnerDashboard component rendered');

  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  // Temporarily disable useLanguage to prevent infinite loops
  // const { profile, loading, error, updateProfile } = useLanguage();
  const profile = null;
  const loading = false;
  const error = null;
  const { lessonId } = useSelectedLesson();

  console.log('🎯 Dashboard render:', {
    isAuthenticated,
    user: user?.name,
    profile: null,
    lessonId,
    loading,
    error: !!error,
  });
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [lessonLoading, setLessonLoading] = useState(false);
  const [lessonError, setLessonError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [hasNavigated, setHasNavigated] = useState(false);
  const [userProgress, setUserProgress] = useState<ComprehensiveUserProgress | null>(null);
  const [progressLoading, setProgressLoading] = useState(false);
  const [progressError, setProgressError] = useState<string | null>(null);

  // Manual lesson fetching with debugging
  useEffect(() => {
    console.log('Dashboard: lessonId changed to:', lessonId);

    if (lessonId) {
      const hasToken = !!localStorage.getItem('life_os_access_token');
      console.log(
        'Dashboard: Starting manual lesson fetch for ID:',
        lessonId,
        'hasToken:',
        hasToken,
      );

      if (!hasToken) {
        console.log('Dashboard: No token available, cannot fetch lesson');
        setLessonError('Authentication required to load lesson');
        return;
      }

      setLessonLoading(true);
      setLessonError(null);

      // Import and call the API service directly
      import('../../services/languageLessonsApi')
        .then(({ languageLessonsApiService }) => {
          console.log('Dashboard: API service imported, calling getLessonById');
          return languageLessonsApiService.getLessonById(lessonId);
        })
        .then((lesson) => {
          console.log('Dashboard: Lesson fetched successfully:', lesson);
          setSelectedLesson(lesson);
          setLessonLoading(false);
        })
        .catch((error) => {
          console.error('Dashboard: Lesson fetch failed:', error);
          setLessonError(error.message);
          setLessonLoading(false);
        });
    } else {
      console.log('Dashboard: No lessonId, clearing lesson data');
      setSelectedLesson(null);
      setLessonLoading(false);
      setLessonError(null);
    }
  }, [lessonId]);

  // Separate useEffect for navigation logic (runs only when auth state changes)
  useEffect(() => {
    console.log('🎯 Navigation check:', {
      isAuthenticated,
      loading,
      profile: !!profile,
      hasNavigated,
    });

    // Prevent multiple navigations
    if (hasNavigated) return;

    // Only redirect if we're not loading and have determined the final auth state
    if (loading) return; // Still loading, don't make navigation decisions yet

    if (!isAuthenticated) {
      const savedOnboarding = localStorage.getItem('languageLearnerOnboarding');
      const savedUser = localStorage.getItem('languageLearnerUser');

      if (!savedOnboarding && !savedUser) {
        console.log('🎯 Redirecting to onboarding - no auth and no local data');
        setHasNavigated(true);
        navigate('/language-learner/onboarding');
        return;
      }
    }

    // If authenticated but no profile and no localStorage data
    if (isAuthenticated && !profile) {
      const savedOnboarding = localStorage.getItem('languageLearnerOnboarding');
      const savedUser = localStorage.getItem('languageLearnerUser');

      if (!savedOnboarding && !savedUser) {
        console.log('🎯 Redirecting to onboarding - authenticated but no profile or local data');
        setHasNavigated(true);
        navigate('/language-learner/onboarding');
        return;
      }
    }
  }, [isAuthenticated, loading, profile, navigate, hasNavigated]);

  // Separate useEffect for timer (runs once)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []); // Empty dependency array - only run once

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
        params.include_details = false;

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

  if (loading || (lessonId && lessonLoading) || progressLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <span className="ml-4 text-lg">
          {progressLoading ? 'Loading progress data...' : lessonId && lessonLoading ? 'Loading lesson data...' : 'Loading language profile...'}
        </span>
      </div>
    );
  }

  // Check if we have data either from API or localStorage
  const savedOnboarding = localStorage.getItem('languageLearnerOnboarding');
  const savedUser = localStorage.getItem('languageLearnerUser');

  console.log('🎯 Dashboard data check:', {
    isAuthenticated,
    hasSavedOnboarding: !!savedOnboarding,
    hasSavedUser: !!savedUser,
    profile: !!profile,
    hasToken: !!localStorage.getItem('life_os_access_token'),
  });

  // Allow showing the dashboard if we have a lesson ID, even without full authentication
  const hasToken = !!localStorage.getItem('life_os_access_token');

  if (!isAuthenticated && !savedOnboarding && !savedUser && !lessonId) {
    console.log('🎯 Dashboard: No auth, no localStorage data, and no lessonId, returning null');
    return null;
  }

  // If we have a lesson ID but no authentication, show a login prompt
  if (!isAuthenticated && !hasToken && lessonId) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="text-center max-w-md">
          <h2 className="text-xl font-semibold text-foreground mb-2">Lesson Available</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            You have a lesson selected, but you need to log in to view it.
          </p>
          <div className="space-y-3">
            <Button onClick={() => navigate('/auth/login')} className="w-full">
              Log In to View Lesson
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/language-learner/onboarding')}
              className="w-full"
            >
              Start Fresh
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Use saved data if profile is not available from API
  const userData = profile || (savedUser ? JSON.parse(savedUser) : null);

  if (!userData && !savedOnboarding) {
    return null;
  }

  // Only show error page if both profile and lesson loading failed, and we have no fallback data
  if (error && lessonError && !savedOnboarding && !savedUser) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">Error loading data</h2>
          <p className="text-gray-600 dark:text-gray-400">{lessonError || error}</p>
          <Button onClick={() => navigate('/language-learner/onboarding')} className="mt-4">
            Go to Onboarding
          </Button>
        </div>
      </div>
    );
  }

  // Use real API data only for streak and XP, keep mock data for everything else
  const mockData = {
    streak: userProgress?.overall_progress?.streak_days ?? 15,
    xp: userProgress?.overall_progress?.total_points_earned ?? 2450,
    level: 12,
    todayProgress: 18, // minutes - keep as mock
    todayGoal: selectedLesson?.metadata?.onboarding_preferences?.dailyGoal || 15,
    weeklyXp: [120, 85, 150, 200, 180, 220, 95],
    currentLesson: {
      id: 'basics-3',
      title: 'Family Members',
      description: 'Learn to talk about your family',
      progress: 65,
      estimatedTime: 8,
      difficulty: 'Beginner',
      xpReward: 15,
    },
    recentAchievements: [
      { id: 1, title: 'Week Warrior', description: '7-day streak!', icon: Flame, unlocked: true },
      {
        id: 2,
        title: 'First Crown',
        description: 'Mastered Basics 1',
        icon: Crown,
        unlocked: true,
      },
      {
        id: 3,
        title: 'Speed Learner',
        description: 'Complete 3 lessons in one day',
        icon: Zap,
        unlocked: false,
      },
    ],
    upcomingLessons: [
      { id: 'food-1', title: 'Food & Drinks', locked: false, progress: 0 },
      { id: 'colors-1', title: 'Colors', locked: false, progress: 30 },
      { id: 'numbers-1', title: 'Numbers', locked: true, progress: 0 },
    ],
    weeklyGoal: {
      target: 5, // lessons per week
      completed: 3,
      remaining: 2,
    },
    friends: [
      { name: 'Sarah', xp: 2890, streak: 23, avatar: '👩‍💼' },
      { name: 'Mike', xp: 2156, streak: 12, avatar: '👨‍💻' },
      { name: 'Emma', xp: 1834, streak: 8, avatar: '👩‍🎓' },
    ],
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getMotivationalMessage = () => {
    if (mockData.todayProgress >= mockData.todayGoal) {
      return "Amazing! You've reached your daily goal! 🎉";
    }
    if (mockData.todayProgress > 0) {
      const remaining = mockData.todayGoal - mockData.todayProgress;
      return `Great start! Just ${remaining} more minutes to reach your goal.`;
    }
    return 'Ready to start your learning session today?';
  };

  const progressPercentage = Math.min((mockData.todayProgress / mockData.todayGoal) * 100, 100);

  return (
    <div className="space-y-6">
      {/* Welcome Header */}

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-gradient-to-r from-primary/10 to-primary/20 border-primary/20">
          <CardContent className="p-4 text-center">
            <div className="flex justify-center mb-2">
              <Flame className="h-8 w-8 text-primary" />
            </div>
            <div className="text-2xl font-bold text-foreground">{mockData.streak}</div>
            <div className="text-sm text-muted-foreground">Day Streak</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-primary/10 to-primary/20 border-primary/20">
          <CardContent className="p-4 text-center">
            <div className="flex justify-center mb-2">
              <Crown className="h-8 w-8 text-primary" />
            </div>
            <div className="text-2xl font-bold text-foreground">{mockData.xp.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Total XP</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-primary/10 to-primary/20 border-primary/20">
          <CardContent className="p-4 text-center">
            <div className="flex justify-center mb-2">
              <Target className="h-8 w-8 text-primary" />
            </div>
            <div className="text-2xl font-bold text-foreground">{mockData.level}</div>
            <div className="text-sm text-muted-foreground">Level</div>
          </CardContent>
        </Card>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Daily Goal Progress */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Daily Goal
                </CardTitle>
                <Badge variant="secondary">
                  {mockData.todayProgress}/{mockData.todayGoal} min
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{Math.round(progressPercentage)}%</span>
                </div>
                <Progress value={progressPercentage} className="h-3" />
              </div>
              {mockData.todayProgress >= mockData.todayGoal ? (
                <div className="flex items-center text-emerald-600 dark:text-emerald-400 text-sm">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Goal completed! Bonus XP earned!
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  Keep going! {mockData.todayGoal - mockData.todayProgress} minutes to reach your
                  goal.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Continue Learning */}
          <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5 text-primary" />
                {selectedLesson ? 'Selected Lesson' : 'Continue Learning'}
              </CardTitle>
              <CardDescription>
                {selectedLesson ? 'Ready to start your lesson' : 'Pick up where you left off'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {selectedLesson?.title || mockData.currentLesson.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedLesson?.description || mockData.currentLesson.description}
                    </p>
                    {selectedLesson && (
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {selectedLesson.language_code.toUpperCase()}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {selectedLesson.skill}
                        </Badge>
                        {selectedLesson.tags.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary" className="mb-2">
                      {selectedLesson?.difficulty || mockData.currentLesson.difficulty}
                    </Badge>
                    <div className="text-sm text-muted-foreground">
                      ~{selectedLesson?.duration_minutes || mockData.currentLesson.estimatedTime}{' '}
                      min
                    </div>
                  </div>
                </div>

                {!selectedLesson && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Lesson Progress</span>
                      <span className="font-medium">{mockData.currentLesson.progress}%</span>
                    </div>
                    <Progress value={mockData.currentLesson.progress} className="h-2" />
                  </div>
                )}

                {selectedLesson && selectedLesson.content && selectedLesson.content.length > 0 && (
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <p className="text-sm font-medium text-foreground mb-1">Lesson Preview:</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedLesson.content[0]?.data?.text}
                    </p>
                    {selectedLesson.content[0]?.data?.translation && (
                      <p className="text-xs text-primary mt-1 italic">
                        {selectedLesson.content[0].data.translation}
                      </p>
                    )}
                  </div>
                )}

                <Button
                  className="w-full h-12 text-lg bg-primary hover:bg-primary/90"
                  onClick={() => {
                    if (lessonId) {
                      navigate(`/language-learner/learning?lesson_id=${lessonId}`);
                    } else {
                      navigate('/language-learner/learning');
                    }
                  }}
                >
                  <Play className="h-5 w-5 mr-2" />
                  {lessonId ? 'Start Lesson' : 'Continue Lesson'} (+
                  {mockData.currentLesson.xpReward} XP)
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Lessons */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Up Next
              </CardTitle>
              <CardDescription>Ready for your next challenge?</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockData.upcomingLessons.map((lesson, index) => (
                  <div
                    key={lesson.id}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      lesson.locked
                        ? 'bg-muted/50'
                        : 'bg-primary/5 hover:bg-primary/10 cursor-pointer'
                    }`}
                    onClick={
                      !lesson.locked
                        ? () => {
                            if (lessonId) {
                              navigate(`/language-learner/learning?lesson_id=${lessonId}`);
                            } else {
                              navigate('/language-learner/lesson');
                            }
                          }
                        : undefined
                    }
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          lesson.locked ? 'bg-muted' : 'bg-primary text-primary-foreground'
                        }`}
                      >
                        {lesson.locked ? (
                          <Lock className="h-5 w-5" />
                        ) : lesson.progress > 0 ? (
                          <BookOpen className="h-5 w-5" />
                        ) : (
                          <Play className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <h4
                          className={`font-medium ${
                            lesson.locked ? 'text-muted-foreground' : 'text-foreground'
                          }`}
                        >
                          {lesson.title}
                        </h4>
                        {lesson.progress > 0 && (
                          <div className="text-xs text-muted-foreground">
                            {lesson.progress}% completed
                          </div>
                        )}
                      </div>
                    </div>
                    {!lesson.locked && <ArrowRight className="h-4 w-4 text-muted-foreground" />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Achievements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                Recent Achievements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockData.recentAchievements.map((achievement) => {
                  const Icon = achievement.icon;
                  return (
                    <div
                      key={achievement.id}
                      className={`flex items-center space-x-3 p-3 rounded-lg ${
                        achievement.unlocked
                          ? 'bg-primary/5 border border-primary/20'
                          : 'bg-muted/50'
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          achievement.unlocked
                            ? 'bg-primary/20 text-primary'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <h4
                          className={`font-medium ${
                            achievement.unlocked ? 'text-foreground' : 'text-muted-foreground'
                          }`}
                        >
                          {achievement.title}
                        </h4>
                        <p className="text-sm text-muted-foreground">{achievement.description}</p>
                      </div>
                      {achievement.unlocked && <CheckCircle className="h-5 w-5 text-emerald-500" />}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start h-12"
                onClick={() => {
                  if (lessonId) {
                    navigate(`/language-learner/learning?lesson_id=${lessonId}`);
                  } else {
                    navigate('/language-learner/practice');
                  }
                }}
              >
                <Target className="h-5 w-5 mr-3 text-primary" />
                {lessonId ? 'View Lesson Units' : 'Practice Weak Skills'}
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start h-12"
                onClick={() => navigate('/language-learner/sounds')}
              >
                <Volume2 className="h-5 w-5 mr-3 text-primary" />
                Pronunciation Practice
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start h-12"
                onClick={() => navigate('/language-learner/stories')}
              >
                <MessageCircle className="h-5 w-5 mr-3 text-primary" />
                Read Stories
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start h-12"
                onClick={() => navigate('/language-learner/vocabulary')}
              >
                <BookOpen className="h-5 w-5 mr-3 text-primary" />
                Review Vocabulary
              </Button>
            </CardContent>
          </Card>

          {/* Weekly Goal */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Weekly Goal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Lessons completed</span>
                  <span className="font-medium">
                    {mockData.weeklyGoal.completed}/{mockData.weeklyGoal.target}
                  </span>
                </div>
                <Progress
                  value={(mockData.weeklyGoal.completed / mockData.weeklyGoal.target) * 100}
                  className="h-2"
                />
                <div className="text-sm text-muted-foreground">
                  {mockData.weeklyGoal.remaining} more lessons to reach your weekly goal!
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Friends Leaderboard */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Friends
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/language-learner/leaderboard')}
                >
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockData.friends.map((friend, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{friend.avatar}</span>
                      <div>
                        <h4 className="font-medium text-foreground">{friend.name}</h4>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <Crown className="h-3 w-3" />
                          <span>{friend.xp.toLocaleString()} XP</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Flame className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">{friend.streak}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Study Reminder */}
          <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Perfect Time to Learn!</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Studies show that learning before {selectedLesson?.metadata?.onboarding_preferences?.reminderTime || '7:00 PM'}
                improves retention by 40%.
              </p>
              <Button size="sm" className="bg-primary hover:bg-primary/90">
                Start Session
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default LanguageLearnerDashboard;
