import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSelectedLesson } from '../../hooks/useSelectedLesson';
import { useLessonProgress, useUnitProgress, useLessonUnits } from '../../hooks/language-learner';
import {
  Trophy,
  Star,
  Lock,
  Play,
  CheckCircle2,
  Circle,
  BookOpen,
  Target,
  Award,
  ArrowLeft,
} from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import LanguageFlag from '../../components/language-learner/ui/LanguageFlag';

interface Unit {
  id: string;
  lesson_id: string;
  title: string;
  description: string;
  order_index: number;
  is_locked: boolean;
  unlock_criteria: any;
  estimated_duration_minutes: number;
  exercises_count: number;
  user_progress: {
    status: string;
    progress_percentage: number;
    completed_exercises: number;
    total_exercises: number;
    started_at?: string;
    completed_at?: string;
    total_time_spent?: number;
  };
  metadata: any;
  created_at: string;
  updated_at: string;
  exercises?: any[];
}

interface UnitsResponse {
  data: Unit[];
  total: number;
  lesson_info: {
    id: string;
    title: string;
    total_units: number;
  };
}

interface LearningPageProps {}

const LearningPage: React.FC<LearningPageProps> = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { lessonId } = useSelectedLesson();
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);

  // Use the API hook to fetch lesson units
  const {
    data: unitsResponse,
    isLoading: loading,
    error: apiError,
    refetch: refetchUnits
  } = useLessonUnits(lessonId || '', {
    user_id: user?.id,
    include_exercises: false
  });

  const units = unitsResponse?.data || [];
  const lessonInfo = unitsResponse?.lesson_info || null;
  const error = apiError ? String(apiError) : null;

  // Fetch lesson progress from API
  const { 
    data: lessonProgress, 
    isLoading: isProgressLoading, 
    error: progressError 
  } = useLessonProgress(user?.id || '', lessonId || '');

  // Fetch unit progress from API (only when a unit is selected)
  const { 
    data: unitProgress, 
    isLoading: isUnitProgressLoading, 
    error: unitProgressError 
  } = useUnitProgress(user?.id || '', selectedUnit?.id || '');

  const handleStartUnit = (unit: Unit) => {
    console.log('handleStartUnit called with unit:', unit.id, 'is_locked:', unit.is_locked);
    if (!unit.is_locked) {
      const lessonUrl = `/language-learner/lesson?unit_id=${unit.id}`;
      console.log('Navigating to lesson page:', lessonUrl);
      console.log('Current location:', window.location.href);

      // Also preserve lesson_id parameter if needed
      if (lessonId) {
        const urlWithLesson = `/language-learner/lesson?unit_id=${unit.id}&lesson_id=${lessonId}`;
        console.log('Navigating with lesson_id preserved:', urlWithLesson);
        navigate(urlWithLesson);
      } else {
        navigate(lessonUrl);
      }

    } else {
      console.log('Unit is locked, cannot start');
    }
  };


  // Calculate position for units in a linear path
  const getUnitPosition = (index: number, total: number) => {
    const cols = 3;
    const row = Math.floor(index / cols);
    const col = index % cols;
    const x = (col + 0.5) * (100 / cols);
    const y = 15 + row * 25;
    return { x, y };
  };

  // Calculate stats from lesson progress API or fallback to units data
  const lessonStats = {
    language: lessonInfo?.title || 'Spanish',
    languageCode: 'es',
    // Calculate actual completed units from units_progress array (more accurate than API's units_completed field)
    unitsCompleted: lessonProgress?.units_progress?.filter((unit: any) => unit.status === 'completed').length || units.filter(u => u.user_progress.status === 'completed').length,
    totalUnits: lessonProgress?.lesson_progress.total_units || units.length,
    exercisesCompleted: lessonProgress?.lesson_progress.exercises_completed || 0,
    totalExercises: lessonProgress?.lesson_progress.total_exercises || 0,
  };

  // Calculate overall progress based on actual completed units (after lessonStats definition)
  const actualUnitsCompleted = lessonStats.unitsCompleted;
  const actualTotalUnits = lessonStats.totalUnits;
  (lessonStats as any).overallProgress = actualTotalUnits > 0 ? Math.round((actualUnitsCompleted / actualTotalUnits) * 100) : 0;

  const getDifficultyColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'not_started':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const isUnitCompleted = (unit: Unit) => {
    // Use real unit progress data if available, otherwise fallback to local data
    if (selectedUnit?.id === unit.id && unitProgress) {
      return (unitProgress as any).status === 'completed';
    }
    return unit.user_progress.status === 'completed';
  };
  
  const isUnitCurrent = (unit: Unit) => {
    // Use real unit progress data if available, otherwise fallback to local data
    if (selectedUnit?.id === unit.id && unitProgress) {
      return (unitProgress as any).status === 'in_progress';
    }
    return unit.user_progress.status === 'in_progress';
  };
  
  const isUnitUnlocked = (unit: Unit) => !unit.is_locked;

  const getUnitIcon = (unit: Unit) => {
    if (isUnitCompleted(unit)) {
      return <Trophy className="h-8 w-8 text-yellow-500" />;
    }
    if (isUnitCurrent(unit)) {
      return <Star className="h-8 w-8 text-[#47bdff]" />;
    }
    if (isUnitUnlocked(unit)) {
      return <Circle className="h-8 w-8 text-muted-foreground" />;
    }
    return <Lock className="h-8 w-8 text-muted-foreground/60" />;
  };

  const getUnitCardStyle = (unit: Unit) => {
    let baseStyle = 'transition-all duration-300 cursor-pointer hover:shadow-lg ';

    if (isUnitCompleted(unit)) {
      baseStyle +=
        'bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200 dark:border-yellow-800 shadow-md';
    } else if (isUnitCurrent(unit)) {
      baseStyle +=
        'bg-gradient-to-r from-[#47bdff]/10 to-[#47bdff]/5 dark:from-[#47bdff]/20 dark:to-[#47bdff]/10 border-[#47bdff]/30 dark:border-[#47bdff]/50 shadow-md ring-2 ring-[#47bdff]/20 dark:ring-[#47bdff]/30';
    } else if (isUnitUnlocked(unit)) {
      baseStyle += 'bg-card border-border hover:border-[#47bdff]/50';
    } else {
      baseStyle += 'bg-muted/50 border-border opacity-60';
    }

    return baseStyle;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4">
        <div className="max-w-6xl mx-auto">
          {/* Back Button and Debug Info */}
          <div className="flex justify-between items-center mb-4">
            <Button
              variant="ghost"
              onClick={() => {
                if (lessonId) {
                  navigate(`/language-learner/dashboard?lesson_id=${lessonId}`);
                } else {
                  navigate('/language-learner');
                }
              }}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {lessonId ? 'Back to Dashboard' : 'Back to Lessons'}
            </Button>
          </div>
          
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <LanguageFlag languageCode={lessonStats.languageCode} size="lg" />
                <div>
                  <h1 className="text-3xl font-bold text-foreground">
                    {lessonInfo?.title || 'Language Course'}
                  </h1>
                  <p className="text-muted-foreground">
                    {lessonStats.unitsCompleted} of {lessonStats.totalUnits} units completed
                  </p>
                </div>
              </div>

            </div>

            {/* Overall Progress */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <BookOpen className="h-5 w-5 text-primary" />
                    <span className="text-lg font-semibold text-foreground">Course Progress</span>
                  </div>
                  <Badge className={getDifficultyColor('in_progress')}>
                    {(lessonStats as any).overallProgress}% Complete
                  </Badge>
                </div>
                <Progress value={(lessonStats as any).overallProgress} className="h-3" />
                <div className="flex justify-between text-sm text-muted-foreground mt-2">
                  <span>{lessonStats.unitsCompleted} units completed</span>
                  <span>{lessonStats.totalUnits - lessonStats.unitsCompleted} units remaining</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Skill Tree */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Skill Tree Visualization */}
            <div className="lg:col-span-2">
              <div className="bg-card rounded-lg p-6 border border-border">
                <div className="relative h-[600px] overflow-hidden">
                  <svg
                    width="100%"
                    height="100%"
                    className="absolute inset-0"
                    style={{ zIndex: 0 }}
                  >
                    {/* Connection lines */}
                    {units.slice(0, -1).map((unit, index) => {
                      const nextUnit = units[index + 1];
                      const unitPos = getUnitPosition(index, units.length);
                      const nextPos = getUnitPosition(index + 1, units.length);
                      return (
                        <line
                          key={`connection-${unit.id}`}
                          x1={`${unitPos.x}%`}
                          y1={`${unitPos.y + 8}%`}
                          x2={`${nextPos.x}%`}
                          y2={`${nextPos.y}%`}
                          stroke={isUnitCompleted(unit) ? '#10b981' : 'hsl(var(--border))'}
                          strokeWidth="3"
                          strokeDasharray={isUnitCompleted(unit) ? '0' : '5,5'}
                          className="transition-all duration-500"
                        />
                      );
                    })}
                  </svg>

                  {/* Unit Cards */}
                  {units.map((unit, index) => {
                    const position = getUnitPosition(index, units.length);
                    return (
                    <div
                      key={unit.id}
                      className="absolute transform -translate-x-1/2 -translate-y-1/2 w-32 h-32"
                      style={{
                        left: `${position.x}%`,
                        top: `${position.y}%`,
                        zIndex: 10,
                      }}
                      onClick={() => {
                        console.log('Unit card clicked:', unit.id, 'unlocked:', isUnitUnlocked(unit));
                        if (isUnitUnlocked(unit)) {
                          setSelectedUnit(unit);
                          console.log('Selected unit set to:', unit.id);
                        }
                      }}
                    >
                      <Card className={getUnitCardStyle(unit)}>
                        <CardContent className="p-3 text-center h-full flex flex-col justify-between">
                          <div className="flex justify-center mb-2">{getUnitIcon(unit)}</div>
                          <div>
                            <h3 className="font-semibold text-sm text-foreground mb-1">
                              {unit.title}
                            </h3>
                            <div className="text-xs text-muted-foreground">
                              {(() => {
                                // Find unit progress from lesson progress API data
                                const unitProgressData = lessonProgress?.units_progress?.find(up => up.unit_id === unit.id);
                                const completedExercises = (unitProgressData as any)?.exercises_progress?.filter((ex: any) => ex.status === 'completed').length || unit.user_progress.completed_exercises;
                                const totalExercises = (unitProgressData as any)?.exercises_progress?.length || unit.exercises_count;
                                return `${completedExercises}/${totalExercises}`;
                              })()}
                            </div>
                            {(() => {
                              // Calculate progress for progress bar
                              const unitProgressData = lessonProgress?.units_progress?.find(up => up.unit_id === unit.id);
                              const completedExercises = (unitProgressData as any)?.exercises_progress?.filter((ex: any) => ex.status === 'completed').length || unit.user_progress.completed_exercises;
                              const totalExercises = (unitProgressData as any)?.exercises_progress?.length || unit.exercises_count;
                              const progressPercentage = unitProgressData?.progress_percentage || unit.user_progress.progress_percentage;
                              
                              return completedExercises > 0 && completedExercises < totalExercises && (
                                <Progress
                                  value={progressPercentage}
                                  className="h-1 mt-1"
                                />
                              );
                            })()}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )})}
                </div>
              </div>
            </div>

            {/* Unit Details Panel */}
            <div>
              <Card className="sticky top-4">
                <CardContent className="p-6">
                  {selectedUnit ? (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        {getUnitIcon(selectedUnit)}
                        <div>
                          <h2 className="text-xl font-bold text-foreground">
                            {selectedUnit.title}
                          </h2>
                          <Badge className={getDifficultyColor((unitProgress as any)?.status || selectedUnit.user_progress.status)}>
                            {((unitProgress as any)?.status || selectedUnit.user_progress.status).replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>

                      <p className="text-muted-foreground">{selectedUnit.description}</p>

                      {/* Progress */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium text-foreground">
                            {(unitProgress as any)?.exercises_progress?.filter((ex: any) => ex.status === 'completed').length || selectedUnit.user_progress.completed_exercises}/{(unitProgress as any)?.exercises_progress?.length || selectedUnit.exercises_count} exercises
                          </span>
                        </div>
                        <Progress
                          value={unitProgress?.progress_percentage || selectedUnit.user_progress.progress_percentage}
                          className="h-2"
                        />
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 bg-muted/50 rounded-lg">
                          <Award className="h-5 w-5 text-yellow-500 mx-auto mb-1" />
                          <div className="text-sm font-medium text-foreground">
                            {selectedUnit.exercises_count * 10} XP
                          </div>
                        </div>
                        <div className="text-center p-3 bg-muted/50 rounded-lg">
                          <Target className="h-5 w-5 text-[#47bdff] mx-auto mb-1" />
                          <div className="text-sm font-medium text-foreground">
                            {selectedUnit.estimated_duration_minutes} min
                          </div>
                        </div>
                      </div>

                      {/* Exercises */}
                      <div>
                        <h3 className="text-sm font-semibold text-foreground mb-2">
                          Exercise Progress:
                        </h3>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2 text-sm">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <span className="text-muted-foreground">
                              {(unitProgress as any)?.exercises_progress?.filter((ex: any) => ex.status === 'completed').length || selectedUnit.user_progress.completed_exercises} of {(unitProgress as any)?.exercises_progress?.length || selectedUnit.exercises_count} exercises completed
                            </span>
                          </div>
                          {selectedUnit.user_progress.total_time_spent && (
                            <div className="flex items-center space-x-2 text-sm">
                              <Target className="h-4 w-4 text-blue-500" />
                              <span className="text-muted-foreground">
                                Time spent: {Math.floor(selectedUnit.user_progress.total_time_spent / 60)} minutes
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Button */}
                      <Button
                        className="w-full"
                        disabled={selectedUnit.is_locked}
                        size="lg"
                        onClick={() => {
                          console.log('Continue button clicked for unit:', selectedUnit?.id);
                          if (selectedUnit) {
                            handleStartUnit(selectedUnit);
                          }
                        }}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        {isUnitCompleted(selectedUnit)
                          ? 'Review Unit'
                          : isUnitCurrent(selectedUnit)
                          ? 'Continue'
                          : isUnitUnlocked(selectedUnit)
                          ? 'Start Unit'
                          : 'Locked'}
                      </Button>
                    </div>
                  ) : loading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                      <p className="text-muted-foreground text-sm">Loading units...</p>
                    </div>
                  ) : error ? (
                    <div className="text-center py-8">
                      <div className="text-red-500 mb-4">{error}</div>
                      <Button onClick={() => refetchUnits()} size="sm">
                        Try Again
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <BookOpen className="h-16 w-16 text-muted-foreground/60 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-foreground mb-2">Select a Unit</h3>
                      <p className="text-muted-foreground text-sm">
                        Click on a unit from the skill tree to view details and start learning.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearningPage;
