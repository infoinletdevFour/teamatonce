import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateLessonFromOnboarding } from '../../hooks/language-learner/useLessons';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Progress } from '../../components/ui/progress';
import { Badge } from '../../components/ui/badge';
import {
  ChevronLeft,
  ChevronRight,
  BookOpen,
  CheckCircle,
  Clock,
  Target,
  Users,
  Briefcase,
  GraduationCap,
  Heart,
  Brain,
  Plane,
  Star,
  Volume2,
  Eye,
  MousePointer,
  BookText,
  PenTool
} from 'lucide-react';

interface OnboardingData {
  targetLanguage: string;
  nativeLanguage: string;
  purpose: string;
  dailyGoal: number;
  proficiencyLevel: string;
  learningStyles: string[];
  notifications: boolean;
  reminderTime: string;
}

const LanguageLearnerOnboarding: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    targetLanguage: '',
    nativeLanguage: 'en',
    purpose: '',
    dailyGoal: 15,
    proficiencyLevel: '',
    learningStyles: [],
    notifications: true,
    reminderTime: '19:00'
  });

  // API integration for lesson creation
  const createLessonMutation = useCreateLessonFromOnboarding({
    onSuccess: (lesson) => {
      console.log('Initial lesson created successfully:', lesson);
      // Continue with navigation
      navigate('/language-learner/dashboard');
    },
    onError: (error) => {
      console.error('Failed to create initial lesson:', error);
      // Continue to dashboard anyway - lesson creation is not critical for onboarding
      navigate('/language-learner/dashboard');
    }
  });

  const totalSteps = 7;

  const languages = [
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸', difficulty: 'Easy', popular: true },
    { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', difficulty: 'Easy', popular: true },
    { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', difficulty: 'Medium', popular: true },
    { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', difficulty: 'Medium', popular: true },
    { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹', difficulty: 'Easy', popular: true },
    { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵', difficulty: 'Hard', popular: true },
    { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹', difficulty: 'Easy', popular: false },
    { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷', difficulty: 'Hard', popular: false },
    { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳', difficulty: 'Very Hard', popular: false },
    { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺', difficulty: 'Hard', popular: false },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', difficulty: 'Very Hard', popular: false },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳', difficulty: 'Hard', popular: false },
    { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱', difficulty: 'Medium', popular: false }
  ];

  const nativeLanguages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Spanish', flag: '🇪🇸' },
    { code: 'fr', name: 'French', flag: '🇫🇷' },
    { code: 'de', name: 'German', flag: '🇩🇪' },
    { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
    { code: 'it', name: 'Italian', flag: '🇮🇹' },
    { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
    { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
    { code: 'ko', name: 'Korean', flag: '🇰🇷' },
    { code: 'ru', name: 'Russian', flag: '🇷🇺' },
    { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
    { code: 'hi', name: 'Hindi', flag: '🇮🇳' }
  ];

  const purposes = [
    {
      id: 'travel',
      title: 'Travel & Tourism',
      description: 'Explore the world with confidence',
      icon: Plane,
      color: 'bg-primary/10 text-primary'
    },
    {
      id: 'business',
      title: 'Business & Career',
      description: 'Advance your professional goals',
      icon: Briefcase,
      color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'
    },
    {
      id: 'education',
      title: 'Education & School',
      description: 'Academic success and studies',
      icon: GraduationCap,
      color: 'bg-primary/10 text-primary'
    },
    {
      id: 'family',
      title: 'Family & Heritage',
      description: 'Connect with your roots',
      icon: Heart,
      color: 'bg-primary/10 text-primary'
    },
    {
      id: 'hobby',
      title: 'Personal Interest',
      description: 'Learn for the joy of it',
      icon: Star,
      color: 'bg-primary/10 text-primary'
    },
    {
      id: 'brain-training',
      title: 'Brain Training',
      description: 'Keep your mind sharp',
      icon: Brain,
      color: 'bg-primary/10 text-primary'
    }
  ];

  const dailyGoals = [
    { minutes: 5, label: 'Casual', description: 'Just getting started' },
    { minutes: 10, label: 'Regular', description: 'Build a habit' },
    { minutes: 15, label: 'Serious', description: 'Make real progress', recommended: true },
    { minutes: 20, label: 'Intense', description: 'Accelerated learning' }
  ];

  const proficiencyLevels = [
    {
      id: 'beginner',
      title: 'Complete Beginner',
      description: "I'm new to this language",
      details: 'Start from the basics',
      color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'
    },
    {
      id: 'some-phrases',
      title: 'Know Some Phrases',
      description: 'I know a few words and phrases',
      details: 'Skip the very basics',
      color: 'bg-primary/10 text-primary'
    },
    {
      id: 'intermediate',
      title: 'Intermediate',
      description: 'I can have simple conversations',
      details: 'Focus on expanding vocabulary',
      color: 'bg-primary/10 text-primary'
    },
    {
      id: 'advanced',
      title: 'Advanced',
      description: 'I can discuss complex topics',
      details: 'Refine and perfect skills',
      color: 'bg-primary/10 text-primary'
    }
  ];

  const learningStyles = [
    {
      id: 'visual',
      title: 'Visual',
      description: 'Learn with images and colors',
      icon: Eye,
      color: 'bg-primary/10 text-primary'
    },
    {
      id: 'audio',
      title: 'Audio',
      description: 'Learn by listening and speaking',
      icon: Volume2,
      color: 'bg-primary/10 text-primary'
    },
    {
      id: 'interactive',
      title: 'Interactive',
      description: 'Learn through games and activities',
      icon: MousePointer,
      color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400'
    },
    {
      id: 'reading',
      title: 'Reading',
      description: 'Learn through stories and text',
      icon: BookText,
      color: 'bg-primary/10 text-primary'
    },
    {
      id: 'writing',
      title: 'Writing',
      description: 'Learn by writing and exercises',
      icon: PenTool,
      color: 'bg-primary/10 text-primary'
    }
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400';
      case 'Medium': return 'text-primary bg-primary/10';
      case 'Hard': return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20 dark:text-orange-400';
      case 'Very Hard': return 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400';
      default: return 'text-muted-foreground bg-muted';
    }
  };

  const updateData = (updates: Partial<OnboardingData>) => {
    setOnboardingData(prev => ({ ...prev, ...updates }));
  };

  const toggleLearningStyle = (styleId: string) => {
    const styles = onboardingData.learningStyles.includes(styleId)
      ? onboardingData.learningStyles.filter(s => s !== styleId)
      : [...onboardingData.learningStyles, styleId];
    updateData({ learningStyles: styles });
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: return onboardingData.targetLanguage !== '';
      case 1: return onboardingData.nativeLanguage !== '';
      case 2: return onboardingData.purpose !== '';
      case 3: return onboardingData.dailyGoal > 0;
      case 4: return onboardingData.proficiencyLevel !== '';
      case 5: return onboardingData.learningStyles.length > 0;
      case 6: return true;
      default: return false;
    }
  };

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    try {
      // Save onboarding data to localStorage
      localStorage.setItem('languageLearnerOnboarding', JSON.stringify(onboardingData));
      localStorage.setItem('languageLearnerUser', JSON.stringify({
        ...onboardingData,
        streak: 0,
        xp: 0,
        hearts: 5,
        maxHearts: 5,
        level: 1,
        completedAt: new Date().toISOString()
      }));

      // Create initial lesson based on onboarding preferences
      await createLessonMutation.mutate(onboardingData);
      
    } catch (error) {
      console.error('Error during onboarding completion:', error);
      // Navigate to dashboard anyway - don't block user
      navigate('/language-learner/dashboard');
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Which language do you want to learn?
              </h2>
              <p className="text-muted-foreground">
                Choose the language you'd like to master
              </p>
            </div>
            
            {/* Popular Languages */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Most Popular
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {languages.filter(lang => lang.popular).map((language) => (
                  <Button
                    key={language.code}
                    variant={onboardingData.targetLanguage === language.code ? "default" : "outline"}
                    className="h-auto p-4 justify-start"
                    onClick={() => updateData({ targetLanguage: language.code })}
                  >
                    <span className="text-2xl mr-3">{language.flag}</span>
                    <div className="text-left">
                      <div className="font-semibold">{language.name}</div>
                      <div className="text-sm opacity-70">{language.nativeName}</div>
                    </div>
                    <div className="ml-auto">
                      <Badge className={`text-xs ${getDifficultyColor(language.difficulty)}`}>
                        {language.difficulty}
                      </Badge>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            {/* All Languages */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">
                All Languages
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {languages.filter(lang => !lang.popular).map((language) => (
                  <Button
                    key={language.code}
                    variant={onboardingData.targetLanguage === language.code ? "default" : "outline"}
                    className="h-auto p-3 justify-start"
                    onClick={() => updateData({ targetLanguage: language.code })}
                  >
                    <span className="text-xl mr-3">{language.flag}</span>
                    <div className="text-left">
                      <div className="font-medium">{language.name}</div>
                      <div className="text-xs opacity-70">{language.nativeName}</div>
                    </div>
                    <div className="ml-auto">
                      <Badge className={`text-xs ${getDifficultyColor(language.difficulty)}`}>
                        {language.difficulty}
                      </Badge>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-2">
                What's your native language?
              </h2>
              <p className="text-muted-foreground">
                We'll use this to create better translations and explanations
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {nativeLanguages.map((language) => (
                <Button
                  key={language.code}
                  variant={onboardingData.nativeLanguage === language.code ? "default" : "outline"}
                  className="h-auto p-4 justify-start"
                  onClick={() => updateData({ nativeLanguage: language.code })}
                >
                  <span className="text-2xl mr-3">{language.flag}</span>
                  <div className="font-semibold">{language.name}</div>
                </Button>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                What's your main goal?
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Help us personalize your learning experience
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {purposes.map((purpose) => {
                const Icon = purpose.icon;
                return (
                  <Button
                    key={purpose.id}
                    variant={onboardingData.purpose === purpose.id ? "default" : "outline"}
                    className="h-auto p-6 justify-start"
                    onClick={() => updateData({ purpose: purpose.id })}
                  >
                    <div className={`w-12 h-12 rounded-lg ${purpose.color} flex items-center justify-center mr-4`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold mb-1">{purpose.title}</div>
                      <div className="text-sm opacity-70">{purpose.description}</div>
                    </div>
                  </Button>
                );
              })}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                How much time can you dedicate daily?
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Consistency is key! Even 5 minutes a day makes a difference
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {dailyGoals.map((goal) => (
                <Button
                  key={goal.minutes}
                  variant={onboardingData.dailyGoal === goal.minutes ? "default" : "outline"}
                  className={`h-auto p-6 justify-start relative ${
                    goal.recommended ? 'ring-2 ring-primary ring-opacity-50' : ''
                  }`}
                  onClick={() => updateData({ dailyGoal: goal.minutes })}
                >
                  {goal.recommended && (
                    <Badge className="absolute -top-2 -right-2 bg-primary text-primary-foreground">
                      Recommended
                    </Badge>
                  )}
                  <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center mr-4">
                    <Clock className="h-6 w-6" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold mb-1">{goal.minutes} minutes - {goal.label}</div>
                    <div className="text-sm opacity-70">{goal.description}</div>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                What's your current level?
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Don't worry, we'll adjust as you progress
              </p>
            </div>
            
            <div className="space-y-4">
              {proficiencyLevels.map((level) => (
                <Button
                  key={level.id}
                  variant={onboardingData.proficiencyLevel === level.id ? "default" : "outline"}
                  className="h-auto p-6 justify-start w-full"
                  onClick={() => updateData({ proficiencyLevel: level.id })}
                >
                  <div className="text-left flex-1">
                    <div className="font-semibold mb-1">{level.title}</div>
                    <div className="text-sm opacity-70 mb-2">{level.description}</div>
                    <Badge className={`text-xs ${level.color}`}>
                      {level.details}
                    </Badge>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-8">
            <div className="text-center">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-[#47bdff]/10 to-[#47bdff]/20 w-fit mx-auto mb-6">
                <Brain className="h-8 w-8 text-[#47bdff]" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                How do you learn best?
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Select all learning styles that work for you. We'll create a personalized experience that matches your preferences.
              </p>
              {onboardingData.learningStyles.length > 0 && (
                <div className="mt-4 p-3 bg-emerald-50/80 dark:bg-emerald-900/20 rounded-xl border border-emerald-200/50 dark:border-emerald-700/50 inline-block">
                  <p className="text-emerald-700 dark:text-emerald-400 text-sm font-medium">
                    ✓ {onboardingData.learningStyles.length} style{onboardingData.learningStyles.length !== 1 ? 's' : ''} selected
                  </p>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {learningStyles.map((style) => {
                const Icon = style.icon;
                const isSelected = onboardingData.learningStyles.includes(style.id);
                
                return (
                  <Card
                    key={style.id}
                    className={`cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-2 ${
                      isSelected 
                        ? 'border-[#47bdff] bg-gradient-to-br from-[#47bdff]/5 to-[#47bdff]/10 shadow-lg shadow-[#47bdff]/10' 
                        : 'border-gray-200 dark:border-gray-700 hover:border-[#47bdff]/50 bg-white/80 dark:bg-gray-800/60'
                    }`}
                    onClick={() => toggleLearningStyle(style.id)}
                  >
                    <CardContent className="p-6">
                      <div className="text-center space-y-4">
                        <div className={`w-16 h-16 rounded-2xl ${style.color} flex items-center justify-center mx-auto`}>
                          <Icon className="h-8 w-8" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">
                            {style.title}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                            {style.description}
                          </p>
                        </div>
                        {isSelected && (
                          <div className="pt-2">
                            <div className="w-8 h-8 rounded-full bg-[#47bdff] flex items-center justify-center mx-auto">
                              <CheckCircle className="h-5 w-5 text-white" />
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-8">
            <div className="text-center">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-green-500/20 w-fit mx-auto mb-6">
                <Target className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                Set up notifications
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Stay motivated and build consistency with personalized reminders
              </p>
            </div>
            
            <div className="max-w-2xl mx-auto space-y-6">
              <Card className="border-0 bg-gradient-to-br from-white/90 to-gray-50/50 dark:from-gray-800/60 dark:to-gray-700/30 backdrop-blur-sm">
                <CardContent className="p-8">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="p-2 rounded-xl bg-[#47bdff]/10">
                          <Clock className="h-5 w-5 text-[#47bdff]" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                          Daily Reminders
                        </h3>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                        Get gentle reminders to practice and maintain your learning streak
                      </p>
                    </div>
                    <Button
                      variant={onboardingData.notifications ? "default" : "outline"}
                      size="lg"
                      onClick={() => updateData({ notifications: !onboardingData.notifications })}
                      className={`ml-6 px-6 transition-all duration-300 ${
                        onboardingData.notifications 
                          ? 'bg-[#47bdff] hover:bg-[#47bdff]/90 text-white shadow-lg'
                          : 'border-2 border-gray-200 dark:border-gray-600 hover:border-[#47bdff] hover:text-[#47bdff]'
                      }`}
                    >
                      {onboardingData.notifications ? '✓ Enabled' : 'Enable'}
                    </Button>
                  </div>

                  {onboardingData.notifications && (
                    <div className="mt-8 p-6 bg-gradient-to-r from-blue-50/80 to-indigo-50/50 dark:from-blue-900/15 dark:to-indigo-900/10 rounded-2xl border border-blue-200/50 dark:border-blue-700/30">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="block text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            Preferred Reminder Time
                          </label>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Choose when you'd like to receive your daily practice reminder
                          </p>
                        </div>
                        <input
                          type="time"
                          value={onboardingData.reminderTime}
                          onChange={(e) => updateData({ reminderTime: e.target.value })}
                          className="w-40 h-12 px-4 py-3 text-lg font-medium border-2 border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-[#47bdff] focus:ring-4 focus:ring-[#47bdff]/10 transition-all duration-200"
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-0 bg-gradient-to-br from-emerald-50/80 to-green-50/50 dark:from-emerald-900/15 dark:to-green-900/10 backdrop-blur-sm">
                <CardContent className="p-8">
                  <div className="text-center space-y-4">
                    <div className="text-4xl mb-4">🎉</div>
                    <h4 className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                      You're all set!
                    </h4>
                    <p className="text-emerald-700 dark:text-emerald-200 leading-relaxed max-w-md mx-auto">
                      We've created a personalized learning experience based on your preferences. 
                      Your journey to mastering {languages.find(l => l.code === onboardingData.targetLanguage)?.name || 'your target language'} starts now!
                    </p>
                    
                    <div className="grid grid-cols-2 gap-4 mt-6 p-4 bg-white/60 dark:bg-gray-800/40 rounded-xl">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-[#47bdff]">{onboardingData.dailyGoal}min</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Daily Goal</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-emerald-600">{onboardingData.learningStyles.length}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Learning Styles</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-[#47bdff]/10 to-[#47bdff]/20">
                <BookOpen className="h-6 w-6 text-[#47bdff]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 dark:from-white dark:via-gray-100 dark:to-gray-200 bg-clip-text text-transparent">
                  Language Learning Setup
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Step {currentStep + 1} of {totalSteps}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-[#47bdff]">{Math.round(((currentStep + 1) / totalSteps) * 100)}%</div>
              <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">Complete</div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Progress</span>
            <span className="text-sm font-medium text-[#47bdff]">{currentStep + 1} / {totalSteps}</span>
          </div>
          <Progress value={((currentStep + 1) / totalSteps) * 100} className="h-3 bg-gray-200/50 dark:bg-gray-800/50" />
        </div>

        {/* Step Content */}
        <Card className="mb-8 border-0 bg-white/90 dark:bg-gray-900/60 backdrop-blur-xl shadow-xl">
          <CardContent className="p-8 lg:p-12">
            {renderStep()}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            size="lg"
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="h-12 px-6 border-2 border-gray-200 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 font-medium transition-all duration-200"
          >
            <ChevronLeft className="h-5 w-5 mr-2" />
            Previous
          </Button>
          
          <div className="flex items-center space-x-2">
            {Array.from({ length: totalSteps }).map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentStep
                    ? 'bg-[#47bdff] w-8'
                    : index < currentStep
                    ? 'bg-emerald-500'
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}
              />
            ))}
          </div>
          
          {currentStep === totalSteps - 1 ? (
            <Button
              onClick={handleComplete}
              disabled={!canProceed() || createLessonMutation.loading}
              size="lg"
              className="h-12 px-8 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-70 disabled:transform-none"
            >
              {createLessonMutation.loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating Your First Lesson...
                </>
              ) : (
                <>
                  🚀 Start Learning
                  <CheckCircle className="h-5 w-5 ml-2" />
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              size="lg"
              className={`h-12 px-8 font-semibold transition-all duration-300 ${
                canProceed()
                  ? 'bg-gradient-to-r from-[#47bdff] to-[#47bdff]/90 hover:from-[#47bdff]/90 hover:to-[#47bdff]/80 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
              }`}
            >
              Continue
              <ChevronRight className="h-5 w-5 ml-2" />
            </Button>
          )}
        </div>
      </main>
    </div>
  );
};

export default LanguageLearnerOnboarding;