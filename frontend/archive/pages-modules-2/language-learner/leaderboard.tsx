import React, { useState, useEffect } from 'react';
import { Trophy, Users, Globe, Crown, Medal, Target, TrendingUp, Calendar, ArrowLeft, Star, Award, Flame, UserPlus, MessageCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import XPCounter from '../../components/language-learner/ui/XPCounter';
import LanguageFlag from '../../components/language-learner/ui/LanguageFlag';
import { useNavigate } from 'react-router-dom';
import { languageApiService, SimpleLeaderboardEntry } from '../../services/languageApi';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from '../../components/ui/sonner';

interface LeaderboardUser {
  id: string;
  name: string;
  avatar?: string;
  currentXP: number;
  weeklyXP: number;
  monthlyXP: number;
  totalXP: number;
  level: number;
  streak: number;
  country: string;
  league: 'bronze' | 'silver' | 'gold' | 'diamond' | 'obsidian';
  rank: number;
  weeklyRank: number;
  isFriend: boolean;
  isCurrentUser: boolean;
  achievements: Achievement[];
  joinDate: Date;
  lastActive: Date;
}

interface Achievement {
  id: string;
  title: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  earnedDate: Date;
}

interface League {
  id: string;
  name: string;
  icon: string;
  color: string;
  minXP: number;
  description: string;
}

const LeaderboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState<'weekly' | 'monthly' | 'all-time'>('weekly');
  const [leaderboardData, setLeaderboardData] = useState<SimpleLeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch leaderboard data from API
  useEffect(() => {
    const fetchLeaderboard = async () => {
      setIsLoading(true);
      try {
        // Map period to API format (all-time -> all_time)
        const apiPeriod = selectedPeriod === 'all-time' ? 'all_time' : selectedPeriod;

        const data = await languageApiService.getLeaderboard({
          page: 1,
          limit: 50,
          sort_by: 'total_points',
          sort_order: 'desc',
          period: apiPeriod as any,
          language_code: 'es' // Spanish
        });
        setLeaderboardData(data);
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
        toast.error('Failed to load leaderboard. Please try again.');
        setLeaderboardData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, [selectedPeriod]);

  // Mock leagues data
  const leagues: League[] = [
    { id: 'bronze', name: 'Bronze League', icon: '🥉', color: 'text-amber-600 dark:text-amber-500', minXP: 0, description: 'Starting your journey' },
    { id: 'silver', name: 'Silver League', icon: '🥈', color: 'text-muted-foreground', minXP: 1000, description: 'Building momentum' },
    { id: 'gold', name: 'Gold League', icon: '🥇', color: 'text-yellow-600 dark:text-yellow-500', minXP: 5000, description: 'Consistent learner' },
    { id: 'diamond', name: 'Diamond League', icon: '💎', color: 'text-primary', minXP: 15000, description: 'Advanced mastery' },
    { id: 'obsidian', name: 'Obsidian League', icon: '🖤', color: 'text-purple-600 dark:text-purple-500', minXP: 50000, description: 'Elite status' }
  ];

  // Mock leaderboard data
  const mockUsers: LeaderboardUser[] = [
    {
      id: '1',
      name: 'Maria Rodriguez',
      currentXP: 2450,
      weeklyXP: 890,
      monthlyXP: 3200,
      totalXP: 15600,
      level: 16,
      streak: 47,
      country: 'ES',
      league: 'diamond',
      rank: 1,
      weeklyRank: 1,
      isFriend: true,
      isCurrentUser: false,
      achievements: [
        { id: '1', title: 'Week Warrior', icon: '🔥', rarity: 'common', earnedDate: new Date('2024-08-01') },
        { id: '2', title: 'Diamond League', icon: '💎', rarity: 'epic', earnedDate: new Date('2024-07-15') }
      ],
      joinDate: new Date('2024-01-10'),
      lastActive: new Date()
    },
    {
      id: '2',
      name: 'You',
      currentXP: 2450,
      weeklyXP: 725,
      monthlyXP: 2800,
      totalXP: 12450,
      level: 12,
      streak: 32,
      country: 'US',
      league: 'gold',
      rank: 2,
      weeklyRank: 2,
      isFriend: false,
      isCurrentUser: true,
      achievements: [
        { id: '3', title: 'Streak Master', icon: '⚡', rarity: 'rare', earnedDate: new Date('2024-08-10') }
      ],
      joinDate: new Date('2024-01-15'),
      lastActive: new Date()
    },
    {
      id: '3',
      name: 'Ahmed Hassan',
      currentXP: 1850,
      weeklyXP: 650,
      monthlyXP: 2400,
      totalXP: 9800,
      level: 10,
      streak: 21,
      country: 'EG',
      league: 'gold',
      rank: 3,
      weeklyRank: 3,
      isFriend: true,
      isCurrentUser: false,
      achievements: [],
      joinDate: new Date('2024-02-01'),
      lastActive: new Date('2024-08-24')
    },
    {
      id: '4',
      name: 'Sophie Chen',
      currentXP: 1650,
      weeklyXP: 580,
      monthlyXP: 2100,
      totalXP: 8900,
      level: 9,
      streak: 14,
      country: 'CN',
      league: 'silver',
      rank: 4,
      weeklyRank: 4,
      isFriend: false,
      isCurrentUser: false,
      achievements: [],
      joinDate: new Date('2024-03-01'),
      lastActive: new Date('2024-08-23')
    },
    {
      id: '5',
      name: 'Lucas Silva',
      currentXP: 1420,
      weeklyXP: 490,
      monthlyXP: 1800,
      totalXP: 7200,
      level: 8,
      streak: 9,
      country: 'BR',
      league: 'silver',
      rank: 5,
      weeklyRank: 5,
      isFriend: true,
      isCurrentUser: false,
      achievements: [],
      joinDate: new Date('2024-03-15'),
      lastActive: new Date('2024-08-22')
    }
  ];

  const globalUsers: LeaderboardUser[] = [
    ...mockUsers,
    {
      id: '6',
      name: 'Yuki Tanaka',
      currentXP: 3850,
      weeklyXP: 1200,
      monthlyXP: 4800,
      totalXP: 28500,
      level: 28,
      streak: 89,
      country: 'JP',
      league: 'obsidian' as const,
      rank: 1,
      weeklyRank: 1,
      isFriend: false,
      isCurrentUser: false,
      achievements: [
        { id: '4', title: 'Legend', icon: '👑', rarity: 'legendary' as const, earnedDate: new Date('2024-06-01') }
      ],
      joinDate: new Date('2023-12-01'),
      lastActive: new Date()
    },
    {
      id: '7',
      name: 'Emma Thompson',
      currentXP: 3200,
      weeklyXP: 980,
      monthlyXP: 3800,
      totalXP: 22100,
      level: 22,
      streak: 67,
      country: 'GB',
      league: 'diamond' as const,
      rank: 2,
      weeklyRank: 2,
      isFriend: false,
      isCurrentUser: false,
      achievements: [],
      joinDate: new Date('2023-11-15'),
      lastActive: new Date()
    }
  ].sort((a, b) => b.weeklyXP - a.weeklyXP);

  const currentUser = mockUsers.find(user => user.isCurrentUser)!;
  const friends = mockUsers.filter(user => user.isFriend);
  const currentLeague = leagues.find(league => league.id === currentUser.league)!;

  // Find current user in leaderboard data
  const currentUserData = leaderboardData.find(entry => entry.user_id === user?.id);
  const myRank = currentUserData?.rank || 0;
  const myXP = currentUserData?.total_points || 0;
  const highestXP = leaderboardData.length > 0 ? Math.max(...leaderboardData.map(u => u.total_points)) : 0;

  const getLeagueIcon = (league: string) => {
    const leagueData = leagues.find(l => l.id === league);
    return leagueData ? leagueData.icon : '🏆';
  };

  const getLeagueColor = (league: string) => {
    const leagueData = leagues.find(l => l.id === league);
    return leagueData ? leagueData.color : 'text-muted-foreground';
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-muted-foreground" />;
      case 3:
        return <Award className="h-5 w-5 text-amber-600 dark:text-amber-500" />;
      default:
        return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  const getXPForPeriod = (user: LeaderboardUser) => {
    switch (selectedPeriod) {
      case 'weekly':
        return user.weeklyXP;
      case 'monthly':
        return user.monthlyXP;
      case 'all-time':
        return user.totalXP;
      default:
        return user.weeklyXP;
    }
  };

  const renderLeaderboard = (users: LeaderboardUser[], showGlobal = false) => (
    <div className="space-y-3">
      {users.map((user, index) => (
        <Card
          key={user.id}
          className={`transition-all duration-300 hover:shadow-lg ${
            user.isCurrentUser 
              ? 'ring-2 ring-primary bg-primary/5 dark:bg-primary/10' 
              : 'hover:border-primary'
          }`}
        >
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-12">
                {getRankIcon(showGlobal ? index + 1 : user.rank)}
              </div>
              
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                  {user.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <h3 className="font-semibold text-foreground truncate">
                    {user.name}
                  </h3>
                  {user.isCurrentUser && (
                    <Badge variant="outline" className="text-xs">You</Badge>
                  )}
                </div>
                <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                  <LanguageFlag languageCode={user.country.toLowerCase()} size="sm" />
                </div>
              </div>

              <div className="text-right">
                <div className="text-lg font-bold text-foreground">
                  {getXPForPeriod(user).toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">
                  XP
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      
      {/* Page Header */}
      <div className="bg-card border-b border-border px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/language-learner/dashboard')}
              className="text-muted-foreground"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Leaderboards
              </h1>
              <p className="text-muted-foreground">
                Compete with friends and learners worldwide
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        <div className="space-y-6">
          {/* Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-blue-100 dark:bg-blue-800/30 flex items-center justify-center">
                  <Trophy className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  {isLoading ? '-' : `#${myRank}`}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  My Rank
                </div>
              </CardContent>
            </Card>

            <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-green-100 dark:bg-green-800/30 flex items-center justify-center">
                  <Users className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  {isLoading ? '-' : leaderboardData.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Total Users
                </div>
              </CardContent>
            </Card>

            <Card className="bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-orange-100 dark:bg-orange-800/30 flex items-center justify-center">
                  <Target className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  {isLoading ? '-' : myXP.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  My Earned XP
                </div>
              </CardContent>
            </Card>

            <Card className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-purple-100 dark:bg-purple-800/30 flex items-center justify-center">
                  <TrendingUp className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  {isLoading ? '-' : highestXP.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Highest XP
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-semibold text-foreground">Global Leaderboard</h2>
              <Badge variant="outline">Worldwide competition</Badge>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant={selectedPeriod === 'weekly' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPeriod('weekly')}
              >
                Weekly
              </Button>
              <Button
                variant={selectedPeriod === 'monthly' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPeriod('monthly')}
              >
                Monthly
              </Button>
              <Button
                variant={selectedPeriod === 'all-time' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPeriod('all-time')}
              >
                All Time
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-[#47bdff]" />
            </div>
          ) : leaderboardData.length > 0 ? (
            <div className="space-y-3">
              {leaderboardData.map((entry, index) => (
                <Card
                  key={entry.user_id}
                  className={`transition-all duration-300 hover:shadow-lg ${
                    entry.user_id === user?.id
                      ? 'ring-2 ring-primary bg-primary/5 dark:bg-primary/10'
                      : 'hover:border-primary'
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center w-12">
                        {getRankIcon(entry.rank)}
                      </div>

                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-primary text-primary-foreground font-semibold">
                          {entry.username.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-semibold text-foreground truncate">
                            {entry.username}
                          </h3>
                          {entry.user_id === user?.id && (
                            <Badge variant="outline" className="text-xs">You</Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                          <LanguageFlag languageCode={entry.language_code || 'es'} size="sm" />
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-lg font-bold text-foreground">
                          {entry.total_points.toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          XP
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400">No leaderboard data available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPage;