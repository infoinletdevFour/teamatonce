import React, { useState, useEffect } from 'react';
import { Target, Brain, Clock, CheckCircle2, X, Play, ArrowLeft, Trophy, TrendingUp, Filter, Zap, BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import XPCounter from '../../components/language-learner/ui/XPCounter';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useExercises, useSubmitExercise } from '../../hooks/language-learner';

interface PracticeSession {
  startTime: Date;
  completed: number;
  correct: number;
  streak: number;
  xpEarned: number;
}

const PracticePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // State for filtering and practice
  const [difficultyFilter, setDifficultyFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [sessionStats, setSessionStats] = useState<PracticeSession>({
    startTime: new Date(),
    completed: 0,
    correct: 0,
    streak: 0,
    xpEarned: 0
  });

  // API hooks
  const queryParams = {
    user_id: user?.id,
    difficulty_level: difficultyFilter ? parseInt(difficultyFilter) : undefined,
    type: typeFilter || undefined,
    include_answers: false
  };

  console.log('useExercises query params:', queryParams); // Debug logging

  const { 
    data: exercisesData, 
    isLoading: exercisesLoading, 
    error: exercisesError,
    refetch: refetchExercises 
  } = useExercises(queryParams);

  const submitExerciseMutation = useSubmitExercise();

  const exercises = exercisesData?.data || [];
  const currentExercise = exercises[currentExerciseIndex];
  const userProgress = exercisesData?.user_unit_progress;

  // Debug logging
  console.log('Practice Page Debug:', {
    exercisesData,
    exercises,
    exercisesLoading,
    exercisesError,
    user: user?.id,
    difficultyFilter,
    typeFilter
  });

  const difficultyLevels = [
    { value: '1', label: 'Beginner (1)', color: 'text-green-600' },
    { value: '2', label: 'Easy (2)', color: 'text-blue-600' },
    { value: '3', label: 'Medium (3)', color: 'text-yellow-600' },
    { value: '4', label: 'Hard (4)', color: 'text-orange-600' },
    { value: '5', label: 'Expert (5)', color: 'text-red-600' }
  ];

  const exerciseTypes = [
    { value: 'multiple_choice', label: 'Multiple Choice' },
    { value: 'fill_blank', label: 'Fill in the Blank' },
    { value: 'translation', label: 'Translation' },
    { value: 'listening', label: 'Listening' }
  ];

  const getDifficultyColor = (level: number) => {
    const colors = {
      1: 'text-green-600 bg-green-50 dark:bg-green-900/20',
      2: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
      3: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20',
      4: 'text-orange-600 bg-orange-50 dark:bg-orange-900/20',
      5: 'text-red-600 bg-red-50 dark:bg-red-900/20'
    };
    return colors[level as keyof typeof colors] || 'text-gray-600 bg-gray-50';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50 dark:bg-green-900/20';
      case 'in_progress':
        return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
      case 'not_attempted':
        return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const handleFilterChange = () => {
    refetchExercises();
    setSessionStarted(false);
    setCurrentExerciseIndex(0);
  };

  useEffect(() => {
    handleFilterChange();
  }, [difficultyFilter, typeFilter]);

  const startPracticeSession = () => {
    setSessionStarted(true);
    setCurrentExerciseIndex(0);
    setSessionStats({
      startTime: new Date(),
      completed: 0,
      correct: 0,
      streak: 0,
      xpEarned: 0
    });
  };

  const handleAnswerSubmit = async () => {
    if (showFeedback || !currentExercise) return;

    const submissionData = {
      user_answer: { option_index: currentExercise.options?.indexOf(selectedAnswer) || 0 },
      time_spent_seconds: 30
    };

    try {
      const response = await submitExerciseMutation.mutateAsync({
        exerciseId: currentExercise.id,
        submissionData
      } as any);

      setIsCorrect(response.is_correct);
      setShowFeedback(true);
      
      const newStats = {
        ...sessionStats,
        completed: sessionStats.completed + 1,
        correct: response.is_correct ? sessionStats.correct + 1 : sessionStats.correct,
        streak: response.is_correct ? sessionStats.streak + 1 : 0,
        xpEarned: sessionStats.xpEarned + response.points_earned
      };
      
      setSessionStats(newStats);
    } catch (error) {
      console.error('Failed to submit exercise:', error);
    }
  };

  const handleContinue = () => {
    setShowFeedback(false);
    setSelectedAnswer('');
    
    if (currentExerciseIndex < exercises.length - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
    } else {
      // Session completed
      setSessionStarted(false);
      refetchExercises(); // Refresh to get updated progress
    }
  };

  const renderExercise = () => {
    if (!currentExercise) return null;

    if (currentExercise.type === 'multiple_choice') {
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {currentExercise.options?.map((option: any) => (
              <Button
                key={option}
                variant={selectedAnswer === option ? "default" : "outline"}
                size="lg"
                className={`h-16 text-lg transition-all duration-200 ${
                  showFeedback
                    ? 'opacity-60'
                    : selectedAnswer === option
                    ? 'bg-primary hover:bg-primary text-white'
                    : ''
                }`}
                onClick={() => setSelectedAnswer(option)}
                disabled={showFeedback}
              >
                {option}
              </Button>
            ))}
          </div>
        </div>
      );
    }

    return <div>Exercise type not implemented yet</div>;
  };

  if (exercisesLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading exercises...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-background">
      
      {/* Header */}
      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
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
                Practice Exercises
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Practice with real exercises from all units
              </p>
            </div>
          </div>
          
          {sessionStarted && (
            <div className="flex items-center space-x-4">
              <XPCounter currentXP={sessionStats.xpEarned} targetXP={100} size="sm" animated={false} />
            </div>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {!sessionStarted ? (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-4 text-center">
                  <BookOpen className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {exercises.length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Total Exercises
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {userProgress?.completed_exercises || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Completed
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <Trophy className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {userProgress?.total_points || 0}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Points Earned
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <TrendingUp className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {userProgress?.max_possible_points ? Math.round((userProgress.total_points / userProgress.max_possible_points) * 100) : 0}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Overall Progress
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Filter className="h-5 w-5 text-primary" />
                  <span>Filter Exercises</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Difficulty Level
                    </label>
                    <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All difficulty levels" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Levels</SelectItem>
                        {difficultyLevels.map((level) => (
                          <SelectItem key={level.value} value={level.value}>
                            <span className={level.color}>{level.label}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Exercise Type
                    </label>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All exercise types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Types</SelectItem>
                        {exerciseTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="mt-4 flex justify-between items-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Showing {exercises.length} exercises
                  </p>
                  <Button onClick={startPracticeSession} disabled={exercises.length === 0}>
                    <Zap className="h-4 w-4 mr-2" />
                    Start Practice Session
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Exercise List */}
            {exercises.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Available Exercises
                </h2>
                
                <div className="grid gap-4">
                  {exercises.map((exercise: any) => (
                    <Card key={exercise.id} className="transition-all duration-300 hover:shadow-lg">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {exercise.title}
                              </h3>
                              <Badge className={getDifficultyColor(exercise.difficulty_level)}>
                                Level {exercise.difficulty_level}
                              </Badge>
                              <Badge variant="outline">
                                {exercise.type.replace('_', ' ')}
                              </Badge>
                              <Badge className={getStatusColor(exercise.user_progress?.status || 'not_attempted')}>
                                {exercise.user_progress?.status?.replace('_', ' ') || 'not attempted'}
                              </Badge>
                            </div>

                            <p className="text-gray-600 dark:text-gray-400 mb-2">
                              {exercise.question}
                            </p>

                            <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                              <span>Unit: {exercise.unit_title}</span>
                              <span>•</span>
                              <span>{exercise.points} points</span>
                              {exercise.user_progress?.status === 'completed' && (
                                <>
                                  <span>•</span>
                                  <span className="text-green-600 dark:text-green-400">
                                    {exercise.user_progress.points_earned} points earned
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            {exercise.user_progress?.status === 'completed' ? (
                              <CheckCircle2 className="h-5 w-5 text-green-500" />
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/language-learner/lesson?exercise_id=${exercise.id}`)}
                              >
                                <Play className="h-4 w-4 mr-1" />
                                Practice
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {exercises.length === 0 && !exercisesLoading && (
              <Card>
                <CardContent className="p-8 text-center">
                  <BookOpen className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    No exercises found
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    No exercises match your current filters. Try adjusting your difficulty level or exercise type filters.
                  </p>
                  <Button variant="outline" onClick={() => {
                    setDifficultyFilter('');
                    setTypeFilter('');
                  }}>
                    Clear Filters
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          /* Practice Session */
          <div className="space-y-6">
            {/* Session Progress */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Exercise {currentExerciseIndex + 1} of {exercises.length}
                    </div>
                    <Progress 
                      value={((currentExerciseIndex + 1) / exercises.length) * 100} 
                      className="w-32 h-2"
                    />
                  </div>
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="text-emerald-600 dark:text-emerald-400">
                      ✓ {sessionStats.correct}
                    </div>
                    <div className="text-gray-600 dark:text-gray-400">
                      Streak: {sessionStats.streak}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Current Exercise */}
            {currentExercise && (
              <Card>
                <CardContent className="p-8">
                  <div className="text-center mb-6">
                    <div className="flex justify-center space-x-2 mb-4">
                      <Badge className={getDifficultyColor(currentExercise.difficulty_level)}>
                        Level {currentExercise.difficulty_level}
                      </Badge>
                      <Badge variant="outline">
                        {currentExercise.type.replace('_', ' ')}
                      </Badge>
                      <Badge variant="outline">
                        {currentExercise.points} points
                      </Badge>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                      {currentExercise.question}
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                      From unit: {currentExercise.unit_title}
                    </p>
                  </div>

                  {renderExercise()}

                  {/* Feedback */}
                  {showFeedback && (
                    <div className={`mt-6 p-4 rounded-lg ${
                      isCorrect 
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800'
                        : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                    }`}>
                      <div className="flex items-start space-x-3">
                        <div className={`p-1 rounded-full ${
                          isCorrect ? 'bg-emerald-100 dark:bg-emerald-900/20' : 'bg-red-100 dark:bg-red-900/20'
                        }`}>
                          {isCorrect ? (
                            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <X className="h-5 w-5 text-red-600 dark:text-red-400" />
                          )}
                        </div>
                        <div>
                          <h3 className={`font-semibold ${
                            isCorrect ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                          }`}>
                            {isCorrect ? 'Correct!' : 'Incorrect'}
                          </h3>
                          {currentExercise.explanation && (
                            <p className="text-gray-600 dark:text-gray-400 mt-1">
                              {currentExercise.explanation}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Button */}
                  <div className="text-center mt-8">
                    {!showFeedback ? (
                      <Button
                        size="lg"
                        onClick={handleAnswerSubmit}
                        disabled={!selectedAnswer || submitExerciseMutation.isPending}
                        className="min-w-32"
                      >
                        {submitExerciseMutation.isPending ? 'Checking...' : 'Check Answer'}
                      </Button>
                    ) : (
                      <Button
                        size="lg"
                        onClick={handleContinue}
                        className={isCorrect ? 'bg-emerald-500 hover:bg-emerald-600' : ''}
                      >
                        {currentExerciseIndex === exercises.length - 1 ? 'Finish Session' : 'Continue'}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PracticePage;