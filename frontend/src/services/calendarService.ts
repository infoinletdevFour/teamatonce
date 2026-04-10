/**
 * Calendar Service for Team@Once
 *
 * Handles all API calls related to project calendar events
 */

import { apiClient } from '@/lib/api-client'

// ============================================
// TYPES
// ============================================

export type EventType = 'meeting' | 'deadline' | 'call' | 'review' | 'milestone'
export type EventPriority = 'high' | 'medium' | 'low' | 'normal'
export type EventStatus = 'upcoming' | 'completed' | 'cancelled'

export interface CalendarEvent {
  id: string
  projectId: string
  title: string
  description?: string
  date: string // YYYY-MM-DD format
  startTime: string // HH:MM format
  endTime: string // HH:MM format
  type: EventType
  meetingUrl?: string
  priority: EventPriority
  status: EventStatus
  color?: string
  location?: string
  attendees: string[] // Array of user IDs who are attending
  createdBy: string
  createdAt: string
  updatedAt: string
  deletedAt?: string
}

export interface CreateEventData {
  title: string
  description?: string
  date: string
  startTime: string
  endTime: string
  type?: EventType
  meetingUrl?: string
  priority?: EventPriority
  color?: string
  location?: string
  attendees?: string[]
}

export interface UpdateEventData {
  title?: string
  description?: string
  date?: string
  startTime?: string
  endTime?: string
  type?: string
  meetingUrl?: string
  priority?: string
  status?: EventStatus
  color?: string
  location?: string
  attendees?: string[]
}

export interface EventsFilters {
  startDate?: string
  endDate?: string
  type?: string
  status?: string
}

// ============================================
// CRUD OPERATIONS
// ============================================

/**
 * Create a new calendar event
 */
export const createEvent = async (
  projectId: string,
  data: CreateEventData
): Promise<CalendarEvent> => {
  const response = await apiClient.post(`/projects/${projectId}/calendar/events`, data)
  return response.data
}

/**
 * Get all events for a project
 */
export const getEvents = async (
  projectId: string,
  filters?: EventsFilters
): Promise<CalendarEvent[]> => {
  const params = new URLSearchParams()

  if (filters?.startDate) params.append('startDate', filters.startDate)
  if (filters?.endDate) params.append('endDate', filters.endDate)
  if (filters?.type) params.append('type', filters.type)
  if (filters?.status) params.append('status', filters.status)

  const queryString = params.toString()
  const url = `/projects/${projectId}/calendar/events${queryString ? `?${queryString}` : ''}`

  const response = await apiClient.get(url)
  return response.data
}

/**
 * Get upcoming events for a project
 */
export const getUpcomingEvents = async (
  projectId: string,
  limit: number = 10
): Promise<CalendarEvent[]> => {
  const response = await apiClient.get(
    `/projects/${projectId}/calendar/events/upcoming?limit=${limit}`
  )
  return response.data
}

/**
 * Get events for a specific date
 */
export const getEventsByDate = async (
  projectId: string,
  date: string
): Promise<CalendarEvent[]> => {
  const response = await apiClient.get(`/projects/${projectId}/calendar/events/date/${date}`)
  return response.data
}

/**
 * Get events in a date range
 */
export const getEventsInRange = async (
  projectId: string,
  startDate: string,
  endDate: string
): Promise<CalendarEvent[]> => {
  const response = await apiClient.get(
    `/projects/${projectId}/calendar/events/range?startDate=${startDate}&endDate=${endDate}`
  )
  return response.data
}

/**
 * Get a single event by ID
 */
export const getEvent = async (projectId: string, eventId: string): Promise<CalendarEvent> => {
  const response = await apiClient.get(`/projects/${projectId}/calendar/events/${eventId}`)
  return response.data
}

/**
 * Update an event
 */
export const updateEvent = async (
  projectId: string,
  eventId: string,
  data: UpdateEventData
): Promise<CalendarEvent> => {
  const response = await apiClient.put(`/projects/${projectId}/calendar/events/${eventId}`, data)
  return response.data
}

/**
 * Delete an event (soft delete)
 */
export const deleteEvent = async (
  projectId: string,
  eventId: string
): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.delete(`/projects/${projectId}/calendar/events/${eventId}`)
  return response.data
}

// ============================================
// STATUS OPERATIONS
// ============================================

/**
 * Mark an event as completed
 */
export const completeEvent = async (
  projectId: string,
  eventId: string
): Promise<CalendarEvent> => {
  const response = await apiClient.post(`/projects/${projectId}/calendar/events/${eventId}/complete`)
  return response.data
}

/**
 * Cancel an event
 */
export const cancelEvent = async (
  projectId: string,
  eventId: string
): Promise<CalendarEvent> => {
  const response = await apiClient.post(`/projects/${projectId}/calendar/events/${eventId}/cancel`)
  return response.data
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get event type label
 */
export const getEventTypeLabel = (type: EventType): string => {
  const labels: Record<EventType, string> = {
    meeting: 'Meeting',
    deadline: 'Deadline',
    call: 'Call',
    review: 'Review',
    milestone: 'Milestone',
  }
  return labels[type] || type
}

/**
 * Get event type color
 */
export const getEventTypeColor = (type: EventType): string => {
  const colors: Record<EventType, string> = {
    meeting: '#3b82f6', // blue
    deadline: '#ef4444', // red
    call: '#22c55e', // green
    review: '#f59e0b', // amber
    milestone: '#8b5cf6', // purple
  }
  return colors[type] || '#6b7280'
}

/**
 * Get priority label
 */
export const getPriorityLabel = (priority: EventPriority): string => {
  const labels: Record<EventPriority, string> = {
    high: 'High',
    medium: 'Medium',
    low: 'Low',
    normal: 'Normal',
  }
  return labels[priority] || priority
}

/**
 * Get status label
 */
export const getStatusLabel = (status: EventStatus): string => {
  const labels: Record<EventStatus, string> = {
    upcoming: 'Upcoming',
    completed: 'Completed',
    cancelled: 'Cancelled',
  }
  return labels[status] || status
}

/**
 * Format time for display (HH:MM -> h:mm a)
 */
export const formatTime = (time: string): string => {
  const [hours, minutes] = time.split(':').map(Number)
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours % 12 || 12
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`
}

/**
 * Format date for display
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}
