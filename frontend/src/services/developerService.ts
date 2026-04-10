import { apiClient } from '@/lib/api-client';

// ============================================
// Dashboard Types
// ============================================

export interface DashboardStats {
  earnings: {
    thisMonth: number;
    lastMonth: number;
    total: number;
    pending: number;
    growth: number;
  };
  stats: {
    activeProjects: number;
    completedProjects: number;
    totalHoursTracked: number;
    averageRating: number;
  };
  activeProjects: Array<{
    id: string;
    name: string;
    clientName: string;
    progress: number;
    dueDate: string;
    status: string;
  }>;
  upcomingDeadlines: Array<{
    project: string;
    milestone: string;
    dueDate: string;
    daysLeft: number;
  }>;
  skillsVerification: Array<{
    skill: string;
    verified: boolean;
    level: string;
  }>;
}

export interface AIMatchedProject {
  id: string;
  title: string;
  description: string;
  clientName: string;
  clientRating: number;
  budget: {
    min: number;
    max: number;
    type: string;
  };
  duration: string;
  requiredSkills: string[];
  matchPercentage: number;
  postedDate: string;
  proposalsCount: number;
  status: string;
  category: string;
}

// ============================================
// Performance Types
// ============================================

export interface PerformanceMetrics {
  rating: number;
  totalReviews: number;
  projectsCompleted: number;
  onTimeDelivery: number;
  codeQuality: number;
  clientSatisfaction: number;
  responseTime: string;
  totalEarnings: number;
  monthlyEarnings: number[];
  hoursWorked: number[];
}

export interface Review {
  id: string;
  clientName: string;
  rating: number;
  comment: string;
  projectTitle: string;
  date: string;
  skills: string[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  earned: string;
}

export interface SkillRating {
  skill: string;
  rating: number;
  reviews: number;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  type: 'meeting' | 'deadline' | 'milestone' | 'review' | 'call';
  startTime: string;
  endTime: string;
  date: string;
  location?: string;
  isVirtual: boolean;
  meetingLink?: string;
  attendees?: string[];
  projectName: string;
  priority: 'high' | 'medium' | 'low';
  status: 'upcoming' | 'completed' | 'cancelled';
  reminderMinutes?: number; // Minutes before event to send reminder
  reminderSent?: boolean; // Whether reminder has been sent
  createdBy: string; // User ID of the event creator
  createdAt?: string;
  updatedAt?: string;
}

// ============================================
// Dashboard API Functions
// ============================================

// Get dashboard stats (aggregated data)
export const getDashboardStats = async (): Promise<DashboardStats> => {
  try {
    const response = await apiClient.get('/developer/dashboard');
    return response.data;
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
};

// Get AI-matched projects
export const getMatchedProjects = async (limit?: number): Promise<AIMatchedProject[]> => {
  try {
    const response = await apiClient.get('/developer/matched-projects', {
      params: { limit },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching matched projects:', error);
    throw error;
  }
};

// ============================================
// Performance API Functions
// ============================================

// Get developer performance metrics
export const getPerformanceMetrics = async (): Promise<PerformanceMetrics> => {
  try {
    const response = await apiClient.get('/developer/performance');
    return response.data;
  } catch (error) {
    console.error('Error fetching performance metrics:', error);
    throw error;
  }
};

// Get developer reviews
export const getDeveloperReviews = async (limit?: number): Promise<Review[]> => {
  try {
    const response = await apiClient.get('/developer/reviews', {
      params: { limit },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching reviews:', error);
    throw error;
  }
};

// Get developer achievements
export const getAchievements = async (): Promise<Achievement[]> => {
  try {
    const response = await apiClient.get('/developer/achievements');
    return response.data;
  } catch (error) {
    console.error('Error fetching achievements:', error);
    throw error;
  }
};

// Get skill ratings
export const getSkillRatings = async (): Promise<SkillRating[]> => {
  try {
    const response = await apiClient.get('/developer/skill-ratings');
    return response.data;
  } catch (error) {
    console.error('Error fetching skill ratings:', error);
    throw error;
  }
};

// Get portfolio items (completed projects)
export interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  technologies: string[];
  completedDate: string;
  clientName: string;
  projectUrl?: string;
}

export const getPortfolioItems = async (limit?: number): Promise<PortfolioItem[]> => {
  try {
    const response = await apiClient.get('/developer/portfolio', {
      params: { limit },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching portfolio items:', error);
    throw error;
  }
};

// Get calendar events for a project (client-only feature)
export const getCalendarEvents = async (
  projectId: string,
  startDate?: string,
  endDate?: string
): Promise<CalendarEvent[]> => {
  try {
    const response = await apiClient.get(
      `/teamatonce/communication/projects/${projectId}/events`,
      {
        params: { start: startDate, end: endDate },
      }
    );

    // Transform backend response (snake_case) to frontend format (camelCase)
    const events = response.data.map((event: any) => ({
      id: event.id,
      title: event.title,
      description: event.description || '',
      type: event.type,
      startTime: event.start_time || event.startTime, // Convert snake_case to camelCase
      endTime: event.end_time || event.endTime, // Convert snake_case to camelCase
      date: event.date.split('T')[0], // Convert ISO timestamp to YYYY-MM-DD format
      location: event.location,
      isVirtual: !!event.meeting_url,
      meetingLink: event.meeting_url || event.meetingUrl,
      attendees: event.attendees || [],
      projectName: event.project_name || event.projectName || '',
      priority: event.priority || 'normal',
      status: event.status || 'upcoming',
      reminderMinutes: event.reminder_minutes || event.reminderMinutes,
      reminderSent: event.reminder_sent || event.reminderSent,
      createdBy: event.created_by || event.createdBy, // Map creator ID for edit permission check
      createdAt: event.created_at || event.createdAt,
      updatedAt: event.updated_at || event.updatedAt,
    }));

    return events;
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    throw error;
  }
};

// Create calendar event (client-only feature)
export const createCalendarEvent = async (
  projectId: string,
  eventData: {
    title: string;
    description?: string;
    date: string;
    startTime: string;
    endTime: string;
    type: 'meeting' | 'deadline' | 'milestone' | 'review' | 'call';
    meetingUrl?: string;
    priority?: 'high' | 'medium' | 'low' | 'normal';
    status?: 'upcoming' | 'completed' | 'cancelled';
    color?: string;
    location?: string;
    reminderMinutes?: number;
  }
): Promise<CalendarEvent> => {
  try {
    const response = await apiClient.post(
      `/teamatonce/communication/projects/${projectId}/events`,
      eventData
    );
    return response.data;
  } catch (error) {
    console.error('Error creating calendar event:', error);
    throw error;
  }
};

// Update calendar event (client-only feature)
export const updateCalendarEvent = async (
  projectId: string,
  eventId: string,
  eventData: {
    title?: string;
    description?: string;
    date?: string;
    startTime?: string;
    endTime?: string;
    type?: 'meeting' | 'deadline' | 'milestone' | 'review' | 'call';
    meetingUrl?: string;
    priority?: 'high' | 'medium' | 'low' | 'normal';
    status?: 'upcoming' | 'completed' | 'cancelled';
    color?: string;
    location?: string;
    reminderMinutes?: number;
  }
): Promise<CalendarEvent> => {
  try {
    const response = await apiClient.put(
      `/teamatonce/communication/projects/${projectId}/events/${eventId}`,
      eventData
    );
    return response.data;
  } catch (error) {
    console.error('Error updating calendar event:', error);
    throw error;
  }
};

// Delete calendar event (client-only feature)
export const deleteCalendarEvent = async (
  projectId: string,
  eventId: string
): Promise<void> => {
  try {
    await apiClient.delete(
      `/teamatonce/communication/projects/${projectId}/events/${eventId}`
    );
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    throw error;
  }
};

// Get developer profile with complete data
export const getDeveloperProfile = async () => {
  try {
    // Fetch all data in parallel
    const [profileRes, performanceRes, reviewsRes, skillRatingsRes, portfolioRes] = await Promise.allSettled([
      apiClient.get('/developer/profile'),
      apiClient.get('/developer/performance'),
      apiClient.get('/developer/reviews'),
      apiClient.get('/developer/skill-ratings'),
      apiClient.get('/developer/portfolio'),
    ]);

    // Extract profile data (required)
    const profile = profileRes.status === 'fulfilled' ? profileRes.value.data : {};

    // Extract optional data with defaults
    const performance = performanceRes.status === 'fulfilled' ? performanceRes.value.data : {
      rating: 0,
      totalReviews: 0,
      totalEarnings: 0,
    };

    const reviews = reviewsRes.status === 'fulfilled' ? reviewsRes.value.data : [];
    const skillRatings = skillRatingsRes.status === 'fulfilled' ? skillRatingsRes.value.data : [];
    const portfolioData = portfolioRes.status === 'fulfilled' ? portfolioRes.value.data : [];

    // Build verified skills list from skill ratings
    const verifiedSkills = skillRatings
      .filter((sr: any) => sr.reviews >= 2)
      .map((sr: any) => sr.skill);

    // Transform skills from string array to Skill objects
    const skillsArray = profile.skills || [];
    const transformedSkills = skillsArray.map((skillName: string) => {
      const skillRating = skillRatings.find((sr: any) => sr.skill === skillName);
      const isVerified = verifiedSkills.includes(skillName);
      const reviewCount = skillRating?.reviews || 0;

      return {
        name: skillName,
        level: reviewCount >= 5 ? 'expert' : reviewCount >= 2 ? 'intermediate' : 'beginner',
        verified: isVerified,
        yearsOfExperience: Math.max(1, Math.floor(reviewCount / 2)), // Estimate based on reviews
      };
    });

    // Transform reviews to match frontend format
    const transformedReviews = reviews.map((r: any) => ({
      id: r.id,
      clientName: r.clientName || 'Anonymous',
      rating: r.rating || 0,
      comment: r.comment || '',
      projectTitle: r.projectTitle || 'Project',
      date: r.date || new Date().toISOString(),
    }));

    // Portfolio items are now fetched from the dedicated endpoint
    const portfolioItems = portfolioData.map((p: any) => ({
      id: p.id,
      title: p.title,
      description: p.description || `Project completed for ${p.clientName || 'client'}`,
      technologies: p.technologies || [],
      completedDate: p.completedDate || new Date().toISOString(),
      projectUrl: p.projectUrl,
    }));

    // Calculate average rating from reviews as fallback
    const calculatedRating = reviews.length > 0
      ? reviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / reviews.length
      : 0;

    // Return complete developer profile
    return {
      id: profile.id || '',
      name: profile.name || '',
      email: profile.email || '',
      avatar: profile.avatar,
      title: profile.title || 'Developer',
      hourlyRate: profile.hourlyRate || 0,
      rating: performance.rating || calculatedRating,
      totalReviews: performance.totalReviews || reviews.length,
      totalEarnings: performance.totalEarnings || 0,
      bio: profile.bio || '',
      location: profile.location || '',
      timezone: profile.timezone || '',
      availability: profile.availability || 'available',
      languages: ['English'], // Default, could be added to backend later
      joinedDate: profile.memberSince || new Date().toISOString(),
      skills: transformedSkills,
      portfolioItems,
      reviews: transformedReviews,
      verifiedSkills,
    };
  } catch (error) {
    console.error('Error fetching developer profile:', error);
    throw error;
  }
};

// Update developer profile
export const updateDeveloperProfile = async (data: any) => {
  try {
    // Transform frontend Developer format to backend UpdateDeveloperProfileDto format
    const updateData: Record<string, any> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.title !== undefined) updateData.title = data.title;
    if (data.bio !== undefined) updateData.bio = data.bio;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.timezone !== undefined) updateData.timezone = data.timezone;
    if (data.hourlyRate !== undefined) updateData.hourlyRate = data.hourlyRate;
    if (data.availability !== undefined) updateData.availability = data.availability;

    // Transform skills from Skill objects to string array
    if (data.skills) {
      updateData.skills = data.skills.map((skill: any) =>
        typeof skill === 'string' ? skill : skill.name
      );
    }

    await apiClient.put('/developer/profile', updateData);

    // Refetch the complete profile after update
    return await getDeveloperProfile();
  } catch (error) {
    console.error('Error updating developer profile:', error);
    throw error;
  }
};
