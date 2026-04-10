import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';
import { 
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  Smile,
  Star,
  Play,
  CheckCircle
} from 'lucide-react';
import Icon from '@mdi/react';
import { mdiMeditation } from '@mdi/js';
import { meditationService, MeditationSession } from '../../services/meditationService';
import { format, formatDistanceToNow, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';

interface SessionFilters {
  timeframe: 'all' | 'week' | 'month' | 'custom';
  sessionType?: string;
  completed?: boolean;
  search?: string;
  startDate?: Date;
  endDate?: Date;
}

const MeditationHistory: React.FC = () => {
  const navigate = useNavigate();
  const [allSessions, setAllSessions] = useState<MeditationSession[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<MeditationSession[]>([]);
  const [displaySessions, setDisplaySessions] = useState<MeditationSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<SessionFilters>({ timeframe: 'week' });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState({
    totalSessions: 0,
    totalMinutes: 0,
    averageMood: 0,
    daysActive: 0,
    completedSessions: 0,
    averageSessionDuration: 0
  });
  const [, setError] = useState<string | null>(null);

  const pageSize = 10;

  // Load all meditation sessions and process them locally
  const loadAllSessions = async () => {
    setLoading(true);
    setError(null);
    try {
      let allSessionsData: any[] = [];
      const batchSize = 100;
      let page = 1;
      let hasMoreData = true;
      
      while (hasMoreData) {
        const batch = await meditationService.getMeditationSessions({
          page,
          limit: batchSize
        });
        
        if (batch.data && batch.data.length > 0) {
          allSessionsData = allSessionsData.concat(batch.data);
          
          if (batch.data.length < batchSize || page >= Math.ceil(batch.total / batchSize)) {
            hasMoreData = false;
          } else {
            page++;
          }
        } else {
          hasMoreData = false;
        }
      }

      setAllSessions(allSessionsData);
      
    } catch (error) {
      console.error('Error loading all sessions:', error);
      setError('Failed to load meditation sessions');
      setAllSessions([]);
    } finally {
      setLoading(false);
    }
  };

  // Process sessions based on filters
  useEffect(() => {
    if (allSessions.length === 0) return;

    let filtered = [...allSessions];
    
    // Apply date filtering
    const today = new Date();
    let startDate: Date | undefined;
    let endDate: Date | undefined;
    
    switch (filters.timeframe) {
      case 'week':
        startDate = startOfWeek(today);
        endDate = endOfWeek(today);
        break;
      case 'month':
        startDate = startOfMonth(today);
        endDate = endOfMonth(today);
        break;
      case 'custom':
        startDate = filters.startDate;
        endDate = filters.endDate;
        break;
      case 'all':
        // No date filtering for 'all'
        break;
    }

    if (startDate && endDate) {
      filtered = filtered.filter(session => {
        const sessionDateStr = session.createdAt || session.completedAt;
        if (!sessionDateStr) return false;
        
        const sessionDate = new Date(sessionDateStr);
        if (isNaN(sessionDate.getTime())) return false;
        
        return sessionDate >= startDate! && sessionDate <= endDate!;
      });
    }

    // Apply other filters
    if (filters.sessionType) {
      filtered = filtered.filter(session => 
        session.type === filters.sessionType
      );
    }

    if (filters.completed !== undefined) {
      filtered = filtered.filter(session => 
        session.completed === filters.completed
      );
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(session =>
        (session.type || '').toLowerCase().includes(searchLower) ||
        (session.notes || '').toLowerCase().includes(searchLower) ||
        (session.title || '').toLowerCase().includes(searchLower)
      );
    }

    setFilteredSessions(filtered);

    // Calculate stats from filtered sessions - using same logic as profile page
    const completedSessions = filtered.filter(session => {
      // Check completion status using multiple field names (similar to profile page logic)
      const isCompleted = session.completed === true || 
                        (session.rating && session.rating > 0) ||
                        (session.duration && session.duration > 0);
      return isCompleted;
    });
    
    // Calculate total minutes using correct field names and conversion
    const totalMinutes = completedSessions.reduce((total, session) => {
      // session.duration is in seconds per API interface, convert to minutes
      const durationInMinutes = session.duration ? Math.round(session.duration / 60) : 0;
      return total + durationInMinutes;
    }, 0);
    
    // Since mood fields don't exist in MeditationSession interface, use rating as a proxy for mood
    const ratingScores = completedSessions.map(s => s.rating).filter(rating => rating != null && !isNaN(rating)) as number[];
    const avgMood = ratingScores.length > 0 ? ratingScores.reduce((sum, rating) => sum + rating, 0) / ratingScores.length : 0;
    
    // Calculate days active (unique dates)
    const uniqueDates = new Set();
    completedSessions.forEach(session => {
      const dateStr = session.createdAt || session.completedAt;
      if (dateStr) {
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          uniqueDates.add(date.toDateString());
        }
      }
    });

    setStats({
      totalSessions: completedSessions.length,
      totalMinutes,
      averageMood: avgMood,
      daysActive: uniqueDates.size,
      completedSessions: completedSessions.length,
      averageSessionDuration: completedSessions.length > 0 ? Math.round(totalMinutes / completedSessions.length) : 0
    });

    // Apply pagination to filtered sessions
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedSessions = filtered.slice(startIndex, endIndex);
    
    setDisplaySessions(paginatedSessions);
    setTotalPages(Math.ceil(filtered.length / pageSize));
    
  }, [allSessions, filters, currentPage]);

  useEffect(() => {
    loadAllSessions();
  }, []);


  const getRatingStars = (rating?: number) => {
    if (!rating) return null;
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            className={`h-4 w-4 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
          />
        ))}
      </div>
    );
  };

  const getSessionTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      'sleep': 'bg-purple-100 text-purple-800',
      'morning': 'bg-yellow-100 text-yellow-800',
      'stress': 'bg-red-100 text-red-800',
      'focus': 'bg-blue-100 text-blue-800',
      'anxiety': 'bg-orange-100 text-orange-800',
      'default': 'bg-gray-100 text-gray-800'
    };
    return colors[type] || colors.default;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-background/80 backdrop-blur-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/meditation')}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-3">
                <Icon path={mdiMeditation} size={1.2} className="text-primary" />
                <h1 className="text-xl font-semibold">Meditation History</h1>
              </div>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Days Active</p>
                {loading ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <p className="text-2xl font-bold">{stats.daysActive}</p>
                )}
              </div>
              <Calendar className="h-8 w-8 text-primary opacity-20" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Sessions</p>
                {loading ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <p className="text-2xl font-bold">{stats.totalSessions}</p>
                )}
              </div>
              <CheckCircle className="h-8 w-8 text-primary opacity-20" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Minutes</p>
                {loading ? (
                  <Skeleton className="h-8 w-20 mt-1" />
                ) : (
                  <p className="text-2xl font-bold">{stats.totalMinutes}</p>
                )}
              </div>
              <Clock className="h-8 w-8 text-primary opacity-20" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Mood</p>
                {loading ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <p className="text-2xl font-bold">{stats.averageMood > 0 ? stats.averageMood.toFixed(1) : '0'}</p>
                )}
              </div>
              <Smile className="h-8 w-8 text-primary opacity-20" />
            </div>
          </Card>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <Card className="p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Timeframe</label>
                <select
                  className="w-full p-2 border rounded-md bg-background"
                  value={filters.timeframe}
                  onChange={(e) => setFilters({ ...filters, timeframe: e.target.value as any })}
                >
                  <option value="all">All Time</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Session Type</label>
                <select
                  className="w-full p-2 border rounded-md bg-background"
                  value={filters.sessionType || ''}
                  onChange={(e) => setFilters({ ...filters, sessionType: e.target.value || undefined })}
                >
                  <option value="">All Types</option>
                  <option value="sleep">Sleep</option>
                  <option value="morning">Morning</option>
                  <option value="stress">Stress Relief</option>
                  <option value="focus">Focus</option>
                  <option value="anxiety">Anxiety</option>
                </select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Search</label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search sessions..."
                    className="w-full pl-8 p-2 border rounded-md bg-background"
                    value={filters.search || ''}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Sessions List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading sessions...</p>
            </div>
          ) : displaySessions.length === 0 ? (
            <Card className="p-12 text-center">
              <Icon path={mdiMeditation} size={3} className="text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No sessions found</h3>
              <p className="text-muted-foreground mb-4">
                {filteredSessions.length === 0 && allSessions.length > 0
                  ? "No meditation sessions match your filters."
                  : filters.timeframe === 'week' 
                    ? "You haven't meditated this week yet." 
                    : "You haven't started your meditation journey yet."}
              </p>
              <Button onClick={() => navigate('/meditation')} className="flex items-center gap-2 mx-auto">
                <Play className="h-4 w-4" />
                Start Meditating
              </Button>
            </Card>
          ) : (
            displaySessions.map((session) => (
              <Card key={session.id} className="p-4 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Icon path={mdiMeditation} size={1} className="text-primary" />
                      <h3 className="font-semibold">{session.title || session.type || 'Meditation Session'}</h3>
                      <Badge className={getSessionTypeColor(session.type || 'default')}>
                        {session.duration ? Math.round(session.duration / 60) : 0} min
                      </Badge>
                      {session.completed && (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {(session.createdAt || session.completedAt) && (
                        <>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {(() => {
                              const dateStr = session.createdAt || session.completedAt;
                              if (!dateStr) return 'Unknown date';
                              const date = new Date(dateStr);
                              return !isNaN(date.getTime()) ? format(date, 'MMM d, yyyy') : 'Unknown date';
                            })()}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {(() => {
                              const dateStr = session.createdAt || session.completedAt;
                              if (!dateStr) return 'Unknown time';
                              const date = new Date(dateStr);
                              return !isNaN(date.getTime()) ? format(date, 'h:mm a') : 'Unknown time';
                            })()}
                          </div>
                        </>
                      )}
                      {session.notes && (
                        <span className="italic">"{session.notes}"</span>
                      )}
                    </div>
                    
                    {session.rating && (
                      <div className="flex items-center gap-6 mt-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">Rating:</span>
                          {getRatingStars(session.rating)}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">
                      {(() => {
                        const dateStr = session.createdAt || session.completedAt;
                        if (!dateStr) return '';
                        const date = new Date(dateStr);
                        return !isNaN(date.getTime()) 
                          ? formatDistanceToNow(date, { addSuffix: true })
                          : '';
                      })()}
                    </p>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center gap-2">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = currentPage - 2 + i;
                if (page < 1 || page > totalPages) return null;
                return (
                  <Button
                    key={page}
                    variant={page === currentPage ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                );
              }).filter(Boolean)}
            </div>
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default MeditationHistory;