import React, { useState, useEffect, useMemo } from 'react';
import { BookOpen, Play, Pause, Volume2, Eye, Clock, Award, CheckCircle2, ArrowLeft, Star, Users, Plus, RotateCcw, X } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import StoryReader from '../../components/language-learner/story/StoryReader';
import { ConfirmationModal } from '../../components/ui/confirmation-modal';
import { useConfirmation } from '../../hooks/useConfirmation';
import { useAuth } from '../../contexts/AuthContext';
import { Story, StoryParagraph, VocabularyWord, Question } from '../../types/story';
import { StoriesHeader } from '../../components/language-learner/stories/StoriesHeader';
import { NavigationTabs } from '../../components/language-learner/stories/NavigationTabs';
import { MyStoriesSection } from '../../components/language-learner/stories/MyStoriesSection';
import { DiscoverStoriesGrid } from '../../components/language-learner/stories/DiscoverStoriesGrid';

// Import API hooks
import {
  useStories,
  useStory,
  useCreateStory,
  useUpdateStory,
  useDeleteStory,
  useCreateProgress,
  useCompleteStory,
  Story as APIStory,
  StoryQueryParams
} from '../../hooks/language-learner';

const StoriesPage: React.FC = () => {
  const navigate = useNavigate();
  const confirmation = useConfirmation();
  const { user } = useAuth();
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [currentParagraph, setCurrentParagraph] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedWord, setSelectedWord] = useState<VocabularyWord | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [currentLanguage, setCurrentLanguage] = useState<'spanish' | 'english'>('spanish');
  const [userStories, setUserStories] = useState<Story[]>([]);
  const [page, setPage] = useState(1);
  const [deletingStoryId, setDeletingStoryId] = useState<string | null>(null);

  // API Query Parameters
  const queryParams: StoryQueryParams = useMemo(() => {
    const params: StoryQueryParams = {
      page,
      limit: 20,
      language_code: 'es', // Spanish stories
      sort_by: 'created_at',
      sort_order: 'desc',
    };

    if (activeCategory !== 'all' && activeCategory !== 'discover' && activeCategory !== 'my-stories') {
      params.category = activeCategory;
    }

    return params;
  }, [activeCategory, page]);

  // API Hooks
  const { 
    data: storiesResponse, 
    isLoading: isLoadingStories, 
    error: storiesError,
    refetch 
  } = useStories(queryParams);
  
  const createStoryMutation = useCreateStory();
  const updateStoryMutation = useUpdateStory();
  const deleteStoryMutation = useDeleteStory();
  const createProgressMutation = useCreateProgress();
  const completeStoryMutation = useCompleteStory();

  // Convert API stories to component format
  const apiStories: Story[] = useMemo(() => {
    if (!storiesResponse?.data) return [];

    return storiesResponse.data.map((apiStory: any): Story => ({
      id: apiStory.id,
      user_id: apiStory.user_id,
      title: apiStory.title,
      author: apiStory.author || 'Unknown Author',
      level: apiStory.level || 'beginner',
      estimatedTime: apiStory.estimated_time || 10,
      wordsCount: apiStory.words_count || 0,
      difficulty: apiStory.difficulty || 3,
      category: apiStory.category || 'daily_life',
      isCompleted: apiStory.is_completed || false,
      isUnlocked: true, // All stories are unlocked for now
      completionRate: apiStory.completion_rate || 0,
      rating: parseFloat(apiStory.rating) || 4.0,
      thumbnail: apiStory.thumbnail || '📖',
      preview: apiStory.preview || '',
      vocabulary: apiStory.vocabulary?.map((v: any) => v.word) || [],
      content: apiStory.content ? apiStory.content.map((p: any, index: number): StoryParagraph => ({
        id: p.id || `${index + 1}`,
        text: p.text || '',
        translation: p.translation || undefined,
        audioUrl: p.audio_url || '',
        vocabulary: []
      })) : []
    }));
  }, [storiesResponse?.data]);


  const categories = [
    { id: 'all', name: 'All Stories', icon: '📚' },
    { id: 'fiction', name: 'Fiction', icon: '📖' },
    { id: 'non_fiction', name: 'Non-Fiction', icon: '📰' },
    { id: 'news', name: 'News', icon: '📺' },
    { id: 'daily_life', name: 'Daily Life', icon: '🏠' },
    { id: 'culture', name: 'Culture', icon: '🎭' },
    { id: 'history', name: 'History', icon: '📜' },
    { id: 'science', name: 'Science', icon: '🔬' },
    { id: 'business', name: 'Business', icon: '💼' },
    { id: 'travel', name: 'Travel', icon: '✈️' },
    { id: 'education', name: 'Education', icon: '🎓' }
  ];


  // Filter stories by user ID for "My Stories"
  const myStories = useMemo(() => {
    if (!user?.id) return [];
    return apiStories.filter(story => story.user_id === user.id);
  }, [apiStories, user?.id]);

  // Combine API stories with local user stories
  const allStories = [...apiStories, ...userStories];
  const filteredStories = activeCategory === 'all' || activeCategory === 'discover'
    ? allStories.filter(story => !story.id.startsWith('user-'))
    : activeCategory === 'my-stories'
    ? myStories
    : allStories.filter(story => story.category === activeCategory);

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'advanced':
        return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getDifficultyStars = (difficulty: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-3 w-3 ${i < difficulty ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
      />
    ));
  };

  const handlePlayAudio = async (text: string) => {
    if (isPlaying) return;
    
    setIsPlaying(true);
    
    try {
      const languageCode = currentLanguage === 'spanish' ? 'es' : 'en';
      const cleanText = text.trim();
      
      const ttsUrls = [
        `https://translate.google.com/translate_tts?ie=UTF-8&tl=${languageCode}&client=tw-ob&q=${encodeURIComponent(cleanText)}`,
        `https://translate.google.com/translate_tts?ie=UTF-8&tl=${languageCode}&client=gtx&q=${encodeURIComponent(cleanText)}`,
      ];
      
      let audioPlayed = false;
      
      for (const url of ttsUrls) {
        if (audioPlayed) break;
        
        try {
          const audio = new Audio();
          audio.crossOrigin = 'anonymous';
          
          await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
              reject(new Error('Audio load timeout'));
            }, 5000);
            
            audio.oncanplaythrough = () => {
              clearTimeout(timeout);
              resolve(true);
            };
            audio.onerror = () => {
              clearTimeout(timeout);
              reject(new Error('Audio load failed'));
            };
            audio.src = url;
            audio.load();
          });
          
          await audio.play();
          audioPlayed = true;
          
          audio.onended = () => {
            setIsPlaying(false);
          };
          
        } catch (error) {
          continue;
        }
      }
      
      if (!audioPlayed) {
        useSpeechSynthesis(cleanText);
      }
      
    } catch (error) {
      console.error('All audio methods failed:', error);
      useSpeechSynthesis(text);
    }
  };

  const handleStopAudio = () => {
    // Stop speech synthesis
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    // Stop any playing audio elements
    const audioElements = document.querySelectorAll('audio');
    audioElements.forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });

    setIsPlaying(false);
  };

  const useSpeechSynthesis = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = currentLanguage === 'spanish' ? 'es-ES' : 'en-US';
      utterance.rate = 0.7;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      utterance.onend = () => {
        setIsPlaying(false);
      };

      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event.error);
        setIsPlaying(false);
      };
      
      const voices = window.speechSynthesis.getVoices();
      if (voices.length === 0) {
        window.speechSynthesis.onvoiceschanged = () => {
          const availableVoices = window.speechSynthesis.getVoices();
          const preferredVoice = availableVoices.find(voice => 
            voice.lang.startsWith(currentLanguage === 'spanish' ? 'es' : 'en')
          );
          if (preferredVoice) {
            utterance.voice = preferredVoice;
          }
          window.speechSynthesis.speak(utterance);
        };
      } else {
        const preferredVoice = voices.find(voice => 
          voice.lang.startsWith(currentLanguage === 'spanish' ? 'es' : 'en')
        );
        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }
        window.speechSynthesis.speak(utterance);
      }
    } else {
      setIsPlaying(false);
    }
  };

  const handleWordClick = (word: VocabularyWord) => {
    setSelectedWord(word);
    handlePlayAudio(word.word);
  };

  const handleDeleteStory = async (story: Story) => {
    const confirmed = await confirmation.showConfirmation({
      title: 'Delete Story',
      message: `Are you sure you want to delete "${story.title}"? This action cannot be undone and will permanently remove the story and all associated progress.`,
      confirmText: 'Delete Story',
      cancelText: 'Cancel',
      variant: 'danger'
    });

    if (!confirmed) return;

    try {
      setDeletingStoryId(story.id);

      if (story.id.startsWith('user-')) {
        // Handle user stories stored in localStorage
        const saved = localStorage.getItem('userStories');
        if (saved) {
          const stories = JSON.parse(saved);
          const updatedStories = stories.filter((s: Story) => s.id !== story.id);
          localStorage.setItem('userStories', JSON.stringify(updatedStories));
          setUserStories(updatedStories);
        }
        toast.success('Story deleted successfully', {
          description: `"${story.title}" has been permanently removed.`,
          duration: 4000,
        });
      } else {
        // Handle API stories
        await deleteStoryMutation.mutateAsync(story.id);
        await refetch();
        toast.success('Story deleted successfully', {
          description: `"${story.title}" has been permanently removed.`,
          duration: 4000,
        });
      }
    } catch (error) {
      console.error('Failed to delete story:', error);
      toast.error('Failed to delete story', {
        description: 'There was an error deleting the story. Please try again.',
        duration: 5000,
      });
    } finally {
      setDeletingStoryId(null);
    }
  };


  // For progress calculation, only use API stories (not user stories)
  const apiStoriesForProgress = apiStories;
  const completedStories = apiStoriesForProgress.filter(s => s.isCompleted).length;
  const totalProgress = apiStoriesForProgress.length > 0 ? (apiStoriesForProgress.reduce((acc, story) => acc + story.completionRate, 0) / apiStoriesForProgress.length) : 0;

  // Detect current language
  useEffect(() => {
    const savedLanguage = localStorage.getItem('currentLanguagelearning');
    if (savedLanguage === 'english') {
      setCurrentLanguage('english');
    } else {
      setCurrentLanguage('spanish');
    }
  }, []);

  // Load user stories from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('userStories');
    if (saved) {
      setUserStories(JSON.parse(saved));
    }
  }, []);

  // Refresh user stories when component mounts or window gains focus
  useEffect(() => {
    const handleFocus = () => {
      const saved = localStorage.getItem('userStories');
      if (saved) {
        setUserStories(JSON.parse(saved));
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-pink-50 via-blue-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-background overflow-x-hidden">
      
      {/* Page Header */}
      <StoriesHeader
        currentLanguage={currentLanguage}
        totalStories={apiStoriesForProgress.length}
        onBackClick={() => navigate('/language-learner/dashboard')}
      />

      <div className="max-w-6xl mx-auto p-6">
        {!selectedStory ? (
          <>
            {/* Navigation Tabs */}
            <NavigationTabs
              activeCategory={activeCategory}
              myStoriesCount={myStories.length}
              onCategoryChange={setActiveCategory}
              onAddStoryClick={() => navigate('/language-learner/add-story')}
            />

            {/* Error State */}
            {storiesError && (
              <Card className="border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10">
                <CardContent className="p-6 text-center">
                  <div className="p-4 rounded-2xl bg-red-100 dark:bg-red-900/20 w-fit mx-auto mb-4">
                    <X className="h-8 w-8 text-red-600 dark:text-red-400" />
                  </div>
                  <h3 className="text-lg font-bold text-red-900 dark:text-red-100 mb-2">
                    Error Loading Stories
                  </h3>
                  <p className="text-red-700 dark:text-red-300 mb-4">
                    {storiesError.message || 'Failed to load stories'}
                  </p>
                  <Button 
                    onClick={() => refetch()}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Loading State */}
            {isLoadingStories && !storiesError && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <div className="p-6 animate-pulse">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                      </div>
                      <div className="mt-4 space-y-2">
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* My Stories Section */}
            {!isLoadingStories && !storiesError && activeCategory === 'my-stories' ? (
              <MyStoriesSection
                myStories={myStories}
                currentLanguage={currentLanguage}
                deletingStoryId={deletingStoryId}
                onStoryClick={setSelectedStory}
                onDeleteStory={handleDeleteStory}
                onCreateStory={() => navigate('/language-learner/add-story')}
              />
            ) : isLoadingStories ? (
              // Loading State
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                <p className="text-muted-foreground">Loading stories...</p>
              </div>
            ) : (
              // Discover Stories Section
              <DiscoverStoriesGrid
                filteredStories={filteredStories}
                activeCategory={activeCategory}
                isLoadingStories={isLoadingStories}
                storiesError={storiesError}
                storiesResponse={storiesResponse || null}
                categories={categories}
                onStoryClick={setSelectedStory}
                onCategoryChange={setActiveCategory}
                onRefresh={() => refetch()}
                onPageChange={setPage}
              />
            )}
          </>
        ) : (
          /* Story Reader */
          <div className="space-y-6">
            {/* Story Header */}
            <Card className="bg-gradient-to-r from-primary/5 to-blue-50 dark:from-primary/10 dark:to-blue-900/20 border-primary/20">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <Button
                    variant="ghost"
                    onClick={() => setSelectedStory(null)}
                    className="text-gray-600 dark:text-gray-400"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Stories
                  </Button>
                  <Badge className={getLevelColor(selectedStory.level)}>
                    {selectedStory.level}
                  </Badge>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="text-6xl">{selectedStory.thumbnail}</div>
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                      {selectedStory.title}
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mb-3">
                      by {selectedStory.author}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      {selectedStory.preview}
                    </p>

                    <div className="flex items-center space-x-6 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{selectedStory.estimatedTime} min read</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <BookOpen className="h-4 w-4" />
                        <span>{selectedStory.wordsCount} words</span>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedStory.completionRate > 0 && (
                  <div className="mt-4">
                    <Progress value={selectedStory.completionRate} className="h-2" />
                    <div className="text-sm text-gray-600 dark:text-gray-400 text-center mt-2">
                      {selectedStory.completionRate}% completed
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Story Content */}
            <StoryReader
              story={{
                ...selectedStory,
                duration: selectedStory.estimatedTime,
                paragraphs: selectedStory.content.map(p => ({
                  ...p,
                  translation: p.translation || '',
                  vocabulary: [] // Map vocabulary if needed
                })),
                questionsCount: 0,
                xpReward: 50
              }}
              onComplete={(score) => {
                // Mark story as completed via API if it's an API story
                if (!selectedStory.id.startsWith('user-')) {
                  completeStoryMutation.mutate({
                    id: selectedStory.id,
                    completionRate: 100
                  }, {
                    onSuccess: (completedStory) => {
                      toast.success('Story completed! 🎉', {
                        description: `You've finished "${selectedStory.title}" and earned 50 XP points!`,
                        duration: 4000,
                      });

                      // Create progress record via API
                      createProgressMutation.mutate({
                        language_code: currentLanguage === 'spanish' ? 'es' : 'en',
                        activity_type: 'story_completed',
                        story_id: selectedStory.id,
                        points_earned: 50,
                        accuracy: score || 100,
                        completed: true,
                        time_spent: selectedStory.estimatedTime * 60
                      });
                    },
                    onError: (error) => {
                      console.error('Failed to mark story as completed:', error);
                      toast.error('Story completion not saved', {
                        description: 'Your progress was recorded locally, but failed to sync with the server.',
                        duration: 5000,
                      });
                      // Still create progress record even if completion marking fails
                      createProgressMutation.mutate({
                        language_code: currentLanguage === 'spanish' ? 'es' : 'en',
                        activity_type: 'story_completed',
                        story_id: selectedStory.id,
                        points_earned: 50,
                        accuracy: score || 100,
                        completed: true,
                        time_spent: selectedStory.estimatedTime * 60
                      });
                    }
                  });
                } else {
                  // For user stories, show completion message and create progress record
                  toast.success('Story completed! 🎉', {
                    description: `You've finished "${selectedStory.title}" and earned 50 XP points!`,
                    duration: 4000,
                  });
                  createProgressMutation.mutate({
                    language_code: currentLanguage === 'spanish' ? 'es' : 'en',
                    activity_type: 'story_completed',
                    story_id: selectedStory.id,
                    points_earned: 50,
                    accuracy: score || 100,
                    completed: true,
                    time_spent: selectedStory.estimatedTime * 60
                  });
                }

                // Handle story completion
                setSelectedStory(null);
              }}
              onVocabularyClick={(word) => {
                // Handle vocabulary click
              }}
              onPlayAudio={handlePlayAudio}
              onStopAudio={handleStopAudio}
              isPlaying={isPlaying}
            />
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmation.isOpen}
        onClose={confirmation.handleCancel}
        onConfirm={confirmation.handleConfirm}
        title={confirmation.title}
        message={confirmation.message}
        confirmText={confirmation.confirmText}
        cancelText={confirmation.cancelText}
        variant={confirmation.variant}
        icon={confirmation.icon}
      />
    </div>
  );
};

export default StoriesPage;