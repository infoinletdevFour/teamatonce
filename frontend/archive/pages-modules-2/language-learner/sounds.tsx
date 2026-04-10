import React, { useState, useRef, useEffect } from 'react';
import { Volume2, Mic, Play, Square, RotateCcw, Award, CheckCircle2, ArrowLeft, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Progress } from '../../components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelectedLesson } from '../../hooks/useSelectedLesson';
import { toast } from '../../components/ui/sonner';
import { languageApiService, Letter, Phoneme as ApiPhoneme, MinimalPair } from '../../services/languageApi';

interface PronunciationExercise {
  id: string;
  type: 'minimal-pairs' | 'word-practice' | 'sentence-practice';
  phoneme: string;
  words: string[];
  correctPronunciation: string;
  userScore?: number;
}

const SoundsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { lessonId } = useSelectedLesson();
  const [selectedPhoneme, setSelectedPhoneme] = useState<ApiPhoneme | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentExercise, setCurrentExercise] = useState(0);
  const [pronunciationScore, setPronunciationScore] = useState<number | null>(null);
  const [completedPhonemes, setCompletedPhonemes] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('vowels');
  const [practiceSubTab, setPracticeSubTab] = useState('minimal-pairs');
  const [currentLanguage, setCurrentLanguage] = useState<'spanish' | 'english'>('spanish');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [vowels, setVowels] = useState<ApiPhoneme[]>([]);
  const [consonants, setConsonants] = useState<ApiPhoneme[]>([]);
  const [allPhonemes, setAllPhonemes] = useState<ApiPhoneme[]>([]);
  const [minimalPairs, setMinimalPairs] = useState<MinimalPair[]>([]);
  const [totalLetters, setTotalLetters] = useState<number>(0);

  // Helper function to convert API Letter to Phoneme format
  const convertLetterToPhoneme = (letter: Letter): ApiPhoneme => {
    return {
      id: letter.id,
      symbol: letter.letter,
      ipa: letter.pronunciation || `/${letter.letter}/`,
      description: letter.description || '',
      examples: letter.examples || [],
      audioUrl: letter.audioUrl || '',
      difficulty: 'easy' as 'easy' | 'medium' | 'hard',
      category: letter.type as 'vowel' | 'consonant',
      position: '',
      manner: '',
    };
  };

  // Fetch letters, phonemes, and minimal pairs from API
  useEffect(() => {
    const fetchData = async () => {
      if (!currentLanguage) return;

      setIsLoading(true);
      try {
        const languageCode = currentLanguage === 'spanish' ? 'es' : 'en';

        // Fetch all letters (for total count), vowels, consonants, phonemes, and minimal pairs
        const [allLettersResponse, vowelsResponse, consonantsResponse, allPhonemesResponse, minimalPairsResponse] = await Promise.all([
          languageApiService.getLetters({ languageCode }),
          languageApiService.getLetters({ languageCode, type: 'vowel' }),
          languageApiService.getLetters({ languageCode, type: 'consonant' }),
          languageApiService.getPhonemes({ languageCode }),
          languageApiService.getMinimalPairs({ languageCode })
        ]);

        // Convert letters to phoneme format for vowels and consonants tabs
        const vowelPhonemes = vowelsResponse.letters.map(convertLetterToPhoneme);
        const consonantPhonemes = consonantsResponse.letters.map(convertLetterToPhoneme);

        setTotalLetters(allLettersResponse.totalCount);
        setVowels(vowelPhonemes);
        setConsonants(consonantPhonemes);
        setAllPhonemes(allPhonemesResponse.phonemes);
        setMinimalPairs(minimalPairsResponse.minimalPairs);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load data. Please try again.');
        // Fallback to empty arrays
        setTotalLetters(0);
        setVowels([]);
        setConsonants([]);
        setAllPhonemes([]);
        setMinimalPairs([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [currentLanguage]);

  // Detect current language from URL or localStorage
  useEffect(() => {
    const currentPath = location.pathname;
    const savedLanguage = localStorage.getItem('currentLanguagelearning');

    if (savedLanguage === 'english' || currentPath.includes('english')) {
      setCurrentLanguage('english');
    } else {
      setCurrentLanguage('spanish'); // Default to Spanish
    }
  }, [location]);


  const progressPercentage = allPhonemes.length > 0 ? (completedPhonemes.length / allPhonemes.length) * 100 : 0;

  const handlePhonemeSelect = (phoneme: ApiPhoneme) => {
    setSelectedPhoneme(phoneme);
    setPronunciationScore(null);
  };

  const handlePlayAudio = async (text: string) => {
    if (isPlaying) return;
    
    setIsPlaying(true);
    
    try {
      // Try multiple TTS services
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
          console.log(`TTS service failed for ${url}:`, error);
          continue;
        }
      }
      
      // If all external services fail, use browser's Speech Synthesis API
      if (!audioPlayed) {
        console.log('Falling back to Speech Synthesis API');
        useSpeechSynthesis(cleanText);
      }
      
    } catch (error) {
      console.error('All audio methods failed:', error);
      useSpeechSynthesis(text);
    }
  };

  const useSpeechSynthesis = (text: string) => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = currentLanguage === 'spanish' ? 'es-ES' : 'en-US';
      utterance.rate = 0.7;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      utterance.onstart = () => {
        console.log('Speech started');
      };
      
      utterance.onend = () => {
        console.log('Speech ended');
        setIsPlaying(false);
      };
      
      utterance.onerror = (event) => {
        console.error('Speech synthesis error:', event.error);
        setIsPlaying(false);
      };
      
      // Wait for voices to load
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
      console.error('Speech synthesis not supported');
      setIsPlaying(false);
    }
  };

  const handleStartRecording = async () => {
    if (isRecording) {
      // Stop recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const chunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const recordedBlob = new Blob(chunks, { type: 'audio/wav' });
        setRecordedChunks([recordedBlob]);
        
        // Mock pronunciation analysis
        setTimeout(() => {
          const mockScore = Math.floor(Math.random() * 30) + 70; // 70-100 score
          setPronunciationScore(mockScore);
          
          if (mockScore >= 80 && selectedPhoneme && !completedPhonemes.includes(selectedPhoneme.id)) {
            setCompletedPhonemes([...completedPhonemes, selectedPhoneme.id]);
          }
        }, 1000);
        
        // Clean up
        stream.getTracks().forEach(track => track.stop());
      };
      
      setIsRecording(true);
      setPronunciationScore(null);
      mediaRecorder.start();
      
      // Auto-stop after 5 seconds
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
          setIsRecording(false);
        }
      }, 5000);
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast.error('Could not access microphone. Please check permissions.');
      setIsRecording(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'hard':
        return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-600 dark:text-emerald-400';
    if (score >= 80) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const renderPhonemeGrid = (phonemes: ApiPhoneme[], title: string) => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {phonemes.map((phoneme) => (
          <Card
            key={phoneme.id}
            className={`cursor-pointer transition-all duration-300 hover:scale-105 border-2 ${
              selectedPhoneme?.id === phoneme.id
                ? 'ring-2 ring-[#47bdff] bg-[#47bdff]/5 border-[#47bdff] scale-105'
                : 'hover:border-[#47bdff]/60 border-gray-200'
            } ${
              completedPhonemes.includes(phoneme.id)
                ? 'bg-emerald-50/60 dark:bg-emerald-900/15 border-emerald-400'
                : ''
            }`}
            onClick={() => handlePhonemeSelect(phoneme)}
          >
            <CardContent className="p-4 text-center">
              <div className="flex justify-center mb-2">
                {completedPhonemes.includes(phoneme.id) && (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 absolute -mt-2 -ml-2" />
                )}
                <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {phoneme.symbol}
                </div>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                {phoneme.ipa}
              </div>
              <Badge className={getDifficultyColor(phoneme.difficulty)}>
                {phoneme.difficulty}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-pink-50 via-blue-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-background overflow-x-hidden">
      
      {/* Page Header */}
      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (lessonId) {
                  navigate(`/language-learner/dashboard?lesson_id=${lessonId}`);
                } else {
                  navigate('/language-learner/dashboard');
                }
              }}
              className="text-gray-600 dark:text-gray-400"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {currentLanguage === 'spanish' ? 'Spanish' : 'English'} Pronunciation Practice
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Master {currentLanguage === 'spanish' ? 'Spanish' : 'English'} sounds and phonetics
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Letters</div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {totalLetters}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-[#47bdff] mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Loading letters...</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Phoneme Selection */}
            <div className="lg:col-span-2 space-y-6">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="vowels">Vowels</TabsTrigger>
                  <TabsTrigger value="consonants">Consonants</TabsTrigger>
                  <TabsTrigger value="practice">Practice</TabsTrigger>
                </TabsList>

                <TabsContent value="vowels" className="space-y-4">
                  {vowels.length > 0 ? (
                    renderPhonemeGrid(vowels, `${currentLanguage === 'spanish' ? 'Spanish' : 'English'} Vowels`)
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-600 dark:text-gray-400">No vowels found for this language.</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="consonants" className="space-y-4">
                  {consonants.length > 0 ? (
                    renderPhonemeGrid(consonants, `${currentLanguage === 'spanish' ? 'Difficult Spanish' : 'Challenging English'} Consonants`)
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-600 dark:text-gray-400">No consonants found for this language.</p>
                    </div>
                  )}
                </TabsContent>
              
              <TabsContent value="practice" className="space-y-4">
                <Tabs value={practiceSubTab} onValueChange={setPracticeSubTab}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="minimal-pairs">Minimal Pairs</TabsTrigger>
                    <TabsTrigger value="phonemes">Phonemes</TabsTrigger>
                  </TabsList>

                  <TabsContent value="minimal-pairs" className="space-y-4 mt-4">
                    {minimalPairs.length > 0 ? (
                      <div className="grid gap-3">
                        {minimalPairs.map((pair) => (
                          <Card key={pair.id} className="hover:scale-102 transition-all duration-300 border-2 border-gray-200 hover:border-[#47bdff]/60">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="flex items-center space-x-3 text-lg font-semibold text-gray-900 dark:text-white">
                                    <span>{pair.pair[0]}</span>
                                    <span className="text-sm text-gray-400 font-normal">vs</span>
                                    <span>{pair.pair[1]}</span>
                                  </div>
                                  <p className="text-sm text-teal-600 dark:text-teal-400 mt-1">
                                    {pair.description}
                                  </p>
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="border-2 border-[#47bdff]/20 hover:border-[#47bdff] hover:bg-[#47bdff] hover:text-white transition-all duration-300 flex items-center gap-2"
                                  onClick={() => {
                                    // Play both words in the minimal pair
                                    handlePlayAudio(pair.pair[0]);
                                    setTimeout(() => handlePlayAudio(pair.pair[1]), 2000);
                                  }}
                                >
                                  <Play className="h-4 w-4" />
                                  <Volume2 className="h-4 w-4" />
                                  Practice
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-600 dark:text-gray-400">No minimal pairs found for this language.</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="phonemes" className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {allPhonemes.map((phoneme) => (
                        <Card
                          key={phoneme.id}
                          className={`cursor-pointer transition-all duration-300 hover:scale-105 border-2 ${
                            selectedPhoneme?.id === phoneme.id
                              ? 'ring-2 ring-[#47bdff] bg-[#47bdff]/5 border-[#47bdff] scale-105'
                              : 'hover:border-[#47bdff]/60 border-gray-200'
                          }`}
                          onClick={() => handlePhonemeSelect(phoneme)}
                        >
                          <CardContent className="p-4 text-center">
                            <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                              {phoneme.symbol}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                              {phoneme.ipa}
                            </div>
                            <Badge className={getDifficultyColor(phoneme.difficulty)}>
                              {phoneme.difficulty}
                            </Badge>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </TabsContent>
            </Tabs>
          </div>

          {/* Practice Panel */}
          <div className="space-y-6">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Volume2 className="h-5 w-5 text-primary" />
                  <span>Practice Session</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {selectedPhoneme ? (
                  <>
                    {/* Phoneme Info */}
                    <div className="text-center">
                      <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                        {selectedPhoneme.symbol}
                      </div>
                      <div className="text-lg text-gray-600 dark:text-gray-400 mb-2">
                        {selectedPhoneme.ipa}
                      </div>
                      <Badge className={getDifficultyColor(selectedPhoneme.difficulty)}>
                        {selectedPhoneme.difficulty}
                      </Badge>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
                        {selectedPhoneme.description}
                      </p>
                    </div>

                    {/* Audio Controls */}
                    <div className="space-y-4">
                      <div className="text-center">
                        <Button
                          variant="outline"
                          size="lg"
                          onClick={() => handlePlayAudio(selectedPhoneme.symbol)}
                          disabled={isPlaying}
                          className="w-full mb-4 h-16 text-lg font-semibold border-2 border-[#47bdff]/20 hover:border-[#47bdff] hover:bg-[#47bdff] hover:text-white transition-all duration-300"
                        >
                          <Volume2 className={`h-6 w-6 mr-3 ${isPlaying ? 'animate-pulse' : ''}`} />
                          {isPlaying ? '🔊 Playing...' : '🔊 Listen to Sound'}
                        </Button>
                      </div>

                      {/* Examples */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                          Example Words:
                        </h4>
                        <div className="grid gap-2">
                          {selectedPhoneme.examples.map((example, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
                            >
                              <span className="font-medium text-gray-900 dark:text-white">
                                {example}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handlePlayAudio(example)}
                                className="hover:bg-[#47bdff]/10 hover:text-[#47bdff] transition-all duration-200"
                              >
                                <Volume2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Recording Section */}
                      {/* <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                          Practice Speaking:
                        </h4>
                        <div className="text-center space-y-4">
                          <Button
                            variant={isRecording ? "destructive" : "default"}
                            size="lg"
                            onClick={handleStartRecording}
                            disabled={isRecording}
                            className={`w-full h-16 text-lg font-semibold transition-all duration-300 rounded-xl ${
                              isRecording
                                ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                                : 'bg-gradient-to-r from-[#47bdff] to-[#47bdff]/90 hover:from-[#47bdff]/90 hover:to-[#47bdff]/80 text-white hover:scale-105'
                            }`}
                          >
                            {isRecording ? (
                              <>
                                <Square className="h-6 w-6 mr-3" />
                                🎤 Recording...
                              </>
                            ) : (
                              <>
                                <Mic className="h-6 w-6 mr-3" />
                                🎤 Start Recording
                              </>
                            )}
                          </Button>

                          {pronunciationScore !== null && (
                            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                              <div className="text-center">
                                <div className={`text-2xl font-bold ${getScoreColor(pronunciationScore)}`}>
                                  {pronunciationScore}%
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                  Pronunciation Score
                                </div>
                                {pronunciationScore >= 80 && (
                                  <div className="flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                    <Award className="h-4 w-4 mr-1" />
                                    <span className="text-xs">Great job!</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div> */}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Volume2 className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Select a Sound
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      Choose a phoneme from the grid to start practicing pronunciation.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Achievement Card */}
            {/* {completedPhonemes.length > 0 && (
              <Card className="bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-900/20 dark:to-blue-900/20 border-emerald-200 dark:border-emerald-800">
                <CardContent className="p-4 text-center">
                  <Award className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                  <div className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                    {completedPhonemes.length} sounds mastered!
                  </div>
                  <div className="text-xs text-emerald-600 dark:text-emerald-500">
                    Keep practicing to improve your accent
                  </div>
                </CardContent>
              </Card>
            )} */}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SoundsPage;