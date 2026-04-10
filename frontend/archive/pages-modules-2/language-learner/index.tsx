import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSelectedLesson } from '../../hooks/useSelectedLesson';
import { api } from '../../lib/api';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {
  ChevronLeft,
  BookOpen,
  Volume2,
  MessageCircle,
  Trophy,
  Target,
  Heart,
  Flame,
  Crown,
  Users,
  BarChart3,
  Globe,
  Headphones,
  Mic,
  Star,
  Play,
  ArrowRight,
  CheckCircle,
  Clock,
  ArrowLeft,
} from 'lucide-react';

interface Lesson {
  id: string;
  title: string;
  description: string;
  language_code: string;
  source_language: string;
  skill: string;
  difficulty: string;
  duration_minutes: number;
  tags: string[];
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

interface LessonsResponse {
  data: Lesson[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

const LanguageLearnerLanding: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectLesson, clearSelectedLesson } = useSelectedLesson();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [showLessons, setShowLessons] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const languages = [
    { name: 'Spanish', flag: '🇪🇸', learners: '12.5M', difficulty: 'Easy' },
    { name: 'French', flag: '🇫🇷', learners: '8.2M', difficulty: 'Medium' },
    { name: 'German', flag: '🇩🇪', learners: '6.1M', difficulty: 'Medium' },
    { name: 'Italian', flag: '🇮🇹', learners: '4.8M', difficulty: 'Easy' },
    { name: 'Portuguese', flag: '🇵🇹', learners: '3.5M', difficulty: 'Easy' },
    { name: 'Japanese', flag: '🇯🇵', learners: '5.9M', difficulty: 'Hard' },
    { name: 'Korean', flag: '🇰🇷', learners: '4.2M', difficulty: 'Hard' },
    { name: 'Chinese', flag: '🇨🇳', learners: '7.1M', difficulty: 'Very Hard' },
  ];

  const features = [
    {
      icon: BookOpen,
      title: 'Interactive Lessons',
      description: 'Bite-sized lessons that adapt to your learning style and pace',
      color: 'from-primary/10 to-primary/5 border-primary/20',
      iconColor: 'text-primary',
    },
    {
      icon: Volume2,
      title: 'Pronunciation Practice',
      description: 'AI-powered speech recognition to perfect your accent',
      color: 'from-emerald-500/10 to-emerald-500/5 border-emerald-200',
      iconColor: 'text-emerald-600',
    },
    {
      icon: MessageCircle,
      title: 'Real-world Stories',
      description: 'Learn through engaging stories and conversations',
      color: 'from-primary/10 to-primary/5 border-primary/20',
      iconColor: 'text-primary',
    },
    {
      icon: Target,
      title: 'Personalized Practice',
      description: 'Spaced repetition system that focuses on your weak areas',
      color: 'from-emerald-600/10 to-emerald-500/10 border-emerald-300',
      iconColor: 'text-emerald-700',
    },
    {
      icon: Trophy,
      title: 'Gamified Learning',
      description: 'Earn XP, maintain streaks, and compete with friends',
      color: 'from-primary/10 to-primary/5 border-primary/20',
      iconColor: 'text-primary',
    },
    {
      icon: BarChart3,
      title: 'Progress Tracking',
      description: 'Detailed analytics to monitor your learning journey',
      color: 'from-emerald-500/10 to-emerald-600/10 border-emerald-200',
      iconColor: 'text-emerald-600',
    },
  ];

  const learningMethods = [
    {
      icon: Headphones,
      title: 'Listen & Repeat',
      description: 'Master pronunciation with native speaker audio',
    },
    {
      icon: Mic,
      title: 'Speak & Practice',
      description: 'Build confidence with speaking exercises',
    },
    {
      icon: BookOpen,
      title: 'Read & Understand',
      description: 'Improve comprehension with interactive stories',
    },
    {
      icon: Users,
      title: 'Connect & Share',
      description: 'Practice with native speakers and learners',
    },
  ];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      language: 'Spanish',
      avatar: '👩‍💼',
      text: 'I learned more Spanish in 3 months than in 2 years of traditional classes!',
      rating: 5,
    },
    {
      name: 'Mike Chen',
      language: 'French',
      avatar: '👨‍💻',
      text: 'The pronunciation feedback helped me sound more natural. Amazing!',
      rating: 5,
    },
    {
      name: 'Emma Wilson',
      language: 'German',
      avatar: '👩‍🎓',
      text: 'Perfect for busy schedules. I can learn anywhere, anytime.',
      rating: 5,
    },
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
      case 'Easy':
        return 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400';
      case 'intermediate':
      case 'Medium':
        return 'text-primary bg-primary/10 dark:bg-primary/20 dark:text-primary';
      case 'advanced':
      case 'Hard':
        return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20 dark:text-orange-400';
      case 'Very Hard':
        return 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'text-muted-foreground bg-muted dark:bg-muted dark:text-muted-foreground';
    }
  };

  const fetchUserLessons = async () => {
    if (!user?.id) {
      setError('Please log in to view your lessons');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data: LessonsResponse = await api.request(
        `/language/lessons?user_id=${user.id}`
      );
      setLessons(data.data);
      setShowLessons(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch lessons');
    } finally {
      setLoading(false);
    }
  };

  const handleLessonClick = (lessonId: string) => {
    console.log('handleLessonClick called with lessonId:', lessonId);
    // Use the hook to store lesson ID for persistence across language learner module
    selectLesson(lessonId);
    navigate(`/language-learner/dashboard?lesson_id=${lessonId}`);
  };

  const handleBackToLanding = () => {
    setShowLessons(false);
    setLessons([]);
    setError(null);
    // Clear selected lesson when going back to landing
    clearSelectedLesson();
  };

  if (showLessons) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-blue-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <div className="mb-8">
            <Button variant="ghost" onClick={handleBackToLanding} className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Landing
            </Button>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Your Lessons</h1>
            <p className="text-lg text-muted-foreground">Continue your language learning journey</p>
          </div>

          {/* Error Message */}
          {error && (
            <Card className="mb-6 border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
              <CardContent className="p-4">
                <p className="text-red-600 dark:text-red-400">{error}</p>
                <Button variant="outline" size="sm" onClick={fetchUserLessons} className="mt-2">
                  Try Again
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Lessons List */}
          {lessons.length > 0 ? (
            <div className="space-y-4">
              {lessons.map((lesson) => (
                <Card
                  key={lesson.id}
                  className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
                  onClick={() => handleLessonClick(lesson.id)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-semibold text-foreground">{lesson.title}</h3>
                          <Badge className={getDifficultyColor(lesson.difficulty)}>
                            {lesson.difficulty}
                          </Badge>
                        </div>

                        <p className="text-muted-foreground mb-4">{lesson.description}</p>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {lesson.duration_minutes} min
                          </div>
                          <div className="flex items-center gap-1">
                            <Globe className="h-4 w-4" />
                            {lesson.language_code.toUpperCase()}
                          </div>
                          <div className="flex items-center gap-1">
                            <BookOpen className="h-4 w-4" />
                            {lesson.skill}
                          </div>
                        </div>

                        {lesson.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {lesson.tags.slice(0, 3).map((tag, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {lesson.tags.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{lesson.tags.length - 3} more
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>

                      <ArrowRight className="h-5 w-5 text-muted-foreground ml-4 flex-shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            !error && (
              <Card className="p-12 text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">No Lessons Found</h3>
                <p className="text-muted-foreground mb-6">
                  You don't have any lessons yet. Start by creating your first lesson or going
                  through our onboarding process.
                </p>
                <Button
                  onClick={() => navigate('/language-learner/onboarding')}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  Get Started
                </Button>
              </Card>
            )
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-blue-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-primary/10 rounded-2xl">
              <BookOpen className="h-12 w-12 text-primary" />
            </div>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">Language Learner</h1>

          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Master any language with our scientifically-proven method. Interactive lessons,
            pronunciation practice, and real-world conversations to make learning effective and fun.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => navigate('/language-learner/onboarding')}
              className="bg-primary hover:bg-primary/90 text-primary-foreground text-lg px-8 py-3"
            >
              Get Started
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>

            <Button
              size="lg"
              variant="outline"
              onClick={fetchUserLessons}
              disabled={loading}
              className="text-lg px-8 py-3"
            >
              {loading ? 'Loading...' : 'Continue'}
            </Button>
          </div>
        </div>

        {/* Stats Section */}
        {/* <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          <Card className="p-6 text-center hover:shadow-lg transition-all duration-200">
            <Globe className="h-6 w-6 text-primary mx-auto mb-3" />
            <p className="text-3xl font-bold text-foreground mb-1">40+</p>
            <p className="text-sm text-muted-foreground">Languages</p>
          </Card>
          <Card className="p-6 text-center hover:shadow-lg transition-all duration-200">
            <Users className="h-6 w-6 text-primary mx-auto mb-3" />
            <p className="text-3xl font-bold text-foreground mb-1">50M+</p>
            <p className="text-sm text-muted-foreground">Learners</p>
          </Card>
          <Card className="p-6 text-center hover:shadow-lg transition-all duration-200">
            <Trophy className="h-6 w-6 text-primary mx-auto mb-3" />
            <p className="text-3xl font-bold text-foreground mb-1">98%</p>
            <p className="text-sm text-muted-foreground">Success Rate</p>
          </Card>
          <Card className="p-6 text-center hover:shadow-lg transition-all duration-200">
            <BookOpen className="h-6 w-6 text-primary mx-auto mb-3" />
            <p className="text-3xl font-bold text-foreground mb-1">1000+</p>
            <p className="text-sm text-muted-foreground">Lessons</p>
          </Card>
        </div> */}

        {/* Popular Languages */}
        <section className="mb-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-4">Choose Your Language</h2>
            <p className="text-muted-foreground">
              Start learning one of our most popular languages
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {languages.map((language) => (
              <Card
                key={language.name}
                className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
                onClick={() => navigate('/language-learner/onboarding')}
              >
                <CardContent className="p-6 text-center">
                  <div className="text-4xl mb-3">{language.flag}</div>
                  <h3 className="font-semibold text-foreground mb-2">{language.name}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{language.learners} learners</p>
                  <Badge className={`text-xs ${getDifficultyColor(language.difficulty)}`}>
                    {language.difficulty}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Features Section */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Everything You Need to Learn
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our comprehensive platform combines proven learning methods with modern technology to
              make language acquisition natural and engaging.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card
                key={index}
                className={`p-6 bg-gradient-to-br ${feature.color} border-2 hover:shadow-lg transition-all duration-200 group cursor-pointer`}
                onClick={() => navigate('/language-learner/onboarding')}
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-white/60 dark:bg-gray-800/60 rounded-lg">
                      <feature.icon className={`h-5 w-5 ${feature.iconColor}`} />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                      {feature.title}
                    </h3>
                  </div>

                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Learning Methods */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Four Skills, One Platform</h2>
            <p className="text-muted-foreground">Develop all aspects of language proficiency</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {learningMethods.map((method, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <method.icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{method.title}</h3>
                <p className="text-sm text-muted-foreground">{method.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Testimonials */}
        <section className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">What Our Learners Say</h2>
            <p className="text-muted-foreground">
              Real success stories from language learners around the world
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <span className="text-3xl mr-3">{testimonial.avatar}</span>
                    <div>
                      <h4 className="font-semibold text-foreground">{testimonial.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        Learning {testimonial.language}
                      </p>
                    </div>
                  </div>
                  <div className="flex mb-3">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                  <p className="text-foreground italic">"{testimonial.text}"</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <Card className="p-8 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 text-center">
          <div className="space-y-6">
            <div className="flex justify-center">
              <div className="p-4 bg-primary/20 rounded-2xl">
                <Trophy className="h-8 w-8 text-primary" />
              </div>
            </div>

            <div>
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Ready to Start Your Language Journey?
              </h2>
              <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
                Join millions of learners who have successfully mastered new languages. Start your
                personalized journey today with our guided onboarding process.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => navigate('/language-learner/onboarding')}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Play className="h-4 w-4 mr-2" />
                Start Learning
              </Button>

              <Button size="lg" variant="outline" onClick={fetchUserLessons} disabled={loading}>
                <BookOpen className="h-4 w-4 mr-2" />
                {loading ? 'Loading...' : 'Continue Learning'}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default LanguageLearnerLanding;
