import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock,
  Users, Video, Plus,
  CheckCircle, AlertCircle, Star, X, Trash2, Check, ChevronDown
} from 'lucide-react';
import {
  getCalendarEvents,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  type CalendarEvent,
} from '@/services/developerService';
import { getProjectTeam } from '@/services/teamMemberService';
import type { TeamMember } from '@/types/teamMember';
import { getProjectStats } from '@/services/projectService';
import { useProject } from '@/contexts/ProjectContext';
import { useProjectRole } from '@/hooks/useProjectRole';
import { useAuth } from '@/contexts/AuthContext';
import { AccessDenied, AccessLoading } from '@/components/project';
import { socketClient } from '@/lib/websocket-client';
import { toast } from 'sonner';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isToday, setHours, setMinutes, startOfMonth, endOfMonth, addDays, isSameMonth } from 'date-fns';
import RichTextEditor from '@/components/ui/RichTextEditor';

// Get today's date in YYYY-MM-DD format for min attribute
const getTodayDate = () => new Date().toISOString().split('T')[0];

// Check if a date/time is in the past
const isDateTimeInPast = (date: string, time: string): boolean => {
  const now = new Date();
  const eventDateTime = new Date(`${date}T${time}:00`);
  return eventDateTime < now;
};

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const HOUR_HEIGHT = 60;

const Calendar: React.FC = () => {
  const { projectId } = useProject();
  const { isClient, hasAccess, loading: roleLoading } = useProjectRole(projectId ?? undefined);
  const { user } = useAuth();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day' | 'list'>('week');
  const [showEventModal, setShowEventModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ date: Date; hour: number } | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [draggedEvent, setDraggedEvent] = useState<CalendarEvent | null>(null);
  const [dropTarget, setDropTarget] = useState<{ date: Date; hour?: number } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dateError, setDateError] = useState<string | null>(null);
  const [projectStatus, setProjectStatus] = useState<string>('active');
  const [projectMembers, setProjectMembers] = useState<TeamMember[]>([]);
  const [selectedAttendees, setSelectedAttendees] = useState<string[]>([]);
  const [showAttendeesDropdown, setShowAttendeesDropdown] = useState(false);
  const [eventDescription, setEventDescription] = useState('');

  // Check if project is completed/ended
  const isProjectCompleted = projectStatus === 'completed' || projectStatus === 'ended';

  // Check if current user is the creator of the selected event
  const isEventCreator = selectedEvent && user && selectedEvent.createdBy === user.id;

  useEffect(() => {
    if (projectId) {
      loadCalendarEvents();
      // Fetch project status
      getProjectStats(projectId).then((data) => {
        setProjectStatus(data.project?.status || 'active');
      }).catch(console.error);
      // Fetch project members for attendees dropdown
      getProjectTeam(projectId).then((members) => {
        setProjectMembers(members);
      }).catch(console.error);
    }
  }, [projectId]);

  // ============================================
  // WEBSOCKET REAL-TIME CALENDAR UPDATES
  // ============================================

  // Handle real-time event creation
  const handleCalendarEventCreated = useCallback((data: { event: CalendarEvent; createdBy: string; timestamp: string }) => {
    // Only add if this event is for the current project
    if (data.event.projectId === projectId) {
      setEvents(prev => {
        // Avoid duplicates
        if (prev.some(e => e.id === data.event.id)) {
          return prev;
        }
        return [...prev, data.event];
      });

      // Show toast notification if created by someone else
      if (data.createdBy !== user?.id) {
        toast.info(`New event: "${data.event.title}" was added to the calendar`);
      }
    }
  }, [projectId, user?.id]);

  // Handle real-time event update
  const handleCalendarEventUpdated = useCallback((data: { event: CalendarEvent; updatedBy: string; timestamp: string }) => {
    if (data.event.projectId === projectId) {
      setEvents(prev => prev.map(e => e.id === data.event.id ? data.event : e));

      // Show toast notification if updated by someone else
      if (data.updatedBy !== user?.id) {
        toast.info(`Event "${data.event.title}" was updated`);
      }
    }
  }, [projectId, user?.id]);

  // Handle real-time event deletion
  const handleCalendarEventDeleted = useCallback((data: { eventId: string; deletedBy: string; timestamp: string }) => {
    setEvents(prev => {
      const deletedEvent = prev.find(e => e.id === data.eventId);
      if (deletedEvent && data.deletedBy !== user?.id) {
        toast.info(`Event "${deletedEvent.title}" was deleted`);
      }
      return prev.filter(e => e.id !== data.eventId);
    });
  }, [user?.id]);

  // Handle real-time event cancellation
  const handleCalendarEventCancelled = useCallback((data: { event: CalendarEvent; cancelledBy: string; timestamp: string }) => {
    if (data.event.projectId === projectId) {
      setEvents(prev => prev.map(e => e.id === data.event.id ? data.event : e));

      // Show toast notification if cancelled by someone else
      if (data.cancelledBy !== user?.id) {
        toast.info(`Event "${data.event.title}" was cancelled`);
      }
    }
  }, [projectId, user?.id]);

  // Handle real-time event reminder
  const handleCalendarEventReminder = useCallback((data: { event: any; title: string; message: string; timestamp: string }) => {
    // Show reminder toast notification
    toast.warning(data.message, {
      duration: 10000, // Show for 10 seconds
      icon: '⏰',
    });
  }, []);

  // Setup WebSocket connection and listeners
  useEffect(() => {
    if (!projectId || !user?.id) return;

    // Connect to WebSocket with user and project context
    // This will also join the project room if socket is already connected
    socketClient.connect(user.id, projectId);

    // Setup calendar event listeners
    socketClient.onCalendarEventCreated(handleCalendarEventCreated);
    socketClient.onCalendarEventUpdated(handleCalendarEventUpdated);
    socketClient.onCalendarEventDeleted(handleCalendarEventDeleted);
    socketClient.onCalendarEventCancelled(handleCalendarEventCancelled);
    socketClient.onCalendarEventReminder(handleCalendarEventReminder);

    // Cleanup on unmount
    return () => {
      socketClient.offCalendarEvents();
      // Leave the project room when leaving the calendar page
      socketClient.leaveProject(projectId);
    };
  }, [projectId, user?.id, handleCalendarEventCreated, handleCalendarEventUpdated, handleCalendarEventDeleted, handleCalendarEventCancelled, handleCalendarEventReminder]);

  const loadCalendarEvents = async () => {
    if (!projectId) return;

    try {
      setLoading(true);
      const eventsData = await getCalendarEvents(projectId);
      setEvents(eventsData);
    } catch (error) {
      console.error('Error loading calendar events:', error);
    } finally {
      setLoading(false);
    }
  };

  // Toggle attendee selection (creator cannot be removed)
  const toggleAttendee = (userId: string) => {
    // Don't allow removing the creator (current user)
    if (userId === user?.id && selectedAttendees.includes(userId)) {
      return;
    }
    setSelectedAttendees((prev) => {
      if (prev.includes(userId)) {
        return prev.filter((id) => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  // Auto-select creator when opening modal for new event
  useEffect(() => {
    if (showEventModal && !selectedEvent && user?.id) {
      // For new events, pre-select the creator
      setSelectedAttendees((prev) => {
        if (!prev.includes(user.id)) {
          return [user.id, ...prev];
        }
        return prev;
      });
    }
  }, [showEventModal, selectedEvent, user?.id]);

  // Get display text for selected attendees
  const getSelectedAttendeesText = () => {
    if (selectedAttendees.length === 0) {
      return 'Select attendees...';
    }
    const names = selectedAttendees
      .map((id) => projectMembers.find((m) => m.user_id === id)?.name)
      .filter(Boolean);
    if (names.length <= 2) {
      return names.join(', ');
    }
    return `${names.slice(0, 2).join(', ')} +${names.length - 2} more`;
  };

  const handleSubmitEvent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!projectId) return;

    const formData = new FormData(e.currentTarget);
    const eventDate = formData.get('date') as string;
    const startTime = formData.get('startTime') as string;

    // Validate that the event date/time is not in the past
    if (isDateTimeInPast(eventDate, startTime)) {
      setDateError('Cannot create or update an event in the past. Please select a future date and time.');
      return;
    }

    // Check if user is trying to edit someone else's event
    if (selectedEvent && !isEventCreator) {
      setDateError('You can only edit events that you created.');
      return;
    }

    setDateError(null);

    // Build event data, only including optional fields if they have values
    const eventData: any = {
      title: formData.get('title') as string,
      date: eventDate,
      startTime: startTime,
      endTime: formData.get('endTime') as string,
      type: formData.get('type') as 'meeting' | 'deadline' | 'call' | 'review' | 'milestone',
      priority: formData.get('priority') as 'high' | 'medium' | 'low' | 'normal',
      status: 'upcoming' as const,
    };

    // Only add optional fields if they have values
    if (eventDescription && eventDescription.trim()) {
      eventData.description = eventDescription;
    }

    const meetingUrl = formData.get('meetingUrl') as string;
    if (meetingUrl && meetingUrl.trim()) {
      eventData.meetingUrl = meetingUrl;
    }

    // Add attendees if any are selected
    if (selectedAttendees.length > 0) {
      eventData.attendees = selectedAttendees;
    }

    // Add reminder if set
    const reminderMinutes = formData.get('reminderMinutes') as string;
    if (reminderMinutes && parseInt(reminderMinutes) > 0) {
      eventData.reminderMinutes = parseInt(reminderMinutes);
    }

    try {
      setIsSubmitting(true);

      if (selectedEvent) {
        // Update existing event
        await updateCalendarEvent(projectId, selectedEvent.id, eventData);
      } else {
        // Create new event
        await createCalendarEvent(projectId, eventData);
      }

      await loadCalendarEvents(); // Reload events
      setShowEventModal(false);
      setSelectedSlot(null);
      setSelectedEvent(null);
      setSelectedAttendees([]);
      setShowAttendeesDropdown(false);
    } catch (error: any) {
      console.error(`Error ${selectedEvent ? 'updating' : 'creating'} event:`, error);
      const errorMessage = error?.response?.data?.message || error?.message || `Failed to ${selectedEvent ? 'update' : 'create'} event.`;
      setDateError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEventDoubleClick = (event: CalendarEvent) => {
    // Only allow editing if user is the creator
    if (user && event.createdBy !== user.id) {
      alert('You can only edit events that you created.');
      return;
    }
    setSelectedEvent(event);
    // Set attendees from the event (if any)
    setSelectedAttendees((event as any).attendees || []);
    // Set the description for editing
    setEventDescription(event.description || '');
    setDateError(null);
    setShowEventModal(true);
  };

  const handleDeleteEvent = async () => {
    if (!selectedEvent || !projectId) return;

    try {
      setIsSubmitting(true);
      await deleteCalendarEvent(projectId, selectedEvent.id);
      await loadCalendarEvents(); // Reload events
      setShowEventModal(false);
      setShowDeleteConfirm(false);
      setSelectedEvent(null);
      setSelectedAttendees([]);
      setShowAttendeesDropdown(false);
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Failed to delete event. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Week days calculation
  const weekDays = useMemo(() => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
    return eachDayOfInterval({
      start: weekStart,
      end: endOfWeek(weekStart, { weekStartsOn: 0 })
    });
  }, [currentDate]);

  // Drag & Drop Handlers
  const handleDragStart = (e: React.DragEvent, event: CalendarEvent) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/json', JSON.stringify({ eventId: event.id }));
    setDraggedEvent(event);
  };

  const handleDragEnd = () => {
    setDraggedEvent(null);
    setDropTarget(null);
  };

  const handleDragOver = (e: React.DragEvent, date: Date, hour?: number) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent bubbling to parent elements
    e.dataTransfer.dropEffect = 'move';

    // Only update if actually different to avoid unnecessary re-renders
    setDropTarget(prev => {
      const isSame = prev?.hour === hour && prev?.date && isSameDay(prev.date, date);
      if (isSame) return prev;
      return { date, hour };
    });
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent bubbling to parent elements

    // Don't clear dropTarget when moving between hour slots
    // Only clear if leaving the calendar grid entirely
    const relatedTarget = e.relatedTarget as HTMLElement;

    // Check if we're moving to another valid drop target (another hour slot)
    // If relatedTarget has drag handlers, we're moving to another slot
    if (relatedTarget && relatedTarget.hasAttribute &&
      (relatedTarget.hasAttribute('data-drop-zone') ||
        relatedTarget.closest('[data-drop-zone]'))) {
      // Moving to another slot, don't clear
      return;
    }

    // Only clear if truly leaving the drop area
    if (!relatedTarget || !e.currentTarget.contains(relatedTarget)) {
      setDropTarget(null);
    }
  };

  const handleDrop = (e: React.DragEvent, date: Date, hour?: number) => {
    e.preventDefault();
    if (draggedEvent && projectId) {
      // Parse the original start and end times
      const [startHour, startMinute] = draggedEvent.startTime.split(':').map(Number);

      // Calculate duration in milliseconds
      const oldStart = new Date(`${draggedEvent.date}T${draggedEvent.startTime}:00`);
      const oldEnd = new Date(`${draggedEvent.date}T${draggedEvent.endTime}:00`);
      const duration = oldEnd.getTime() - oldStart.getTime();

      // Create new start time
      // If hour is provided (day/week view), use it with 0 minutes
      // Otherwise (month view), use the original hour and minute
      let newStartTime: Date;
      if (hour !== undefined) {
        // Dropped on a specific hour slot - set to that hour with 0 minutes
        newStartTime = setHours(setMinutes(date, 0), hour);
      } else {
        // Dropped on a day (month view) - keep original time
        newStartTime = setHours(setMinutes(date, startMinute), startHour);
      }

      const newEndTime = new Date(newStartTime.getTime() + duration);

      const newDate = format(date, 'yyyy-MM-dd');
      const newStartTimeStr = format(newStartTime, 'HH:mm');
      const newEndTimeStr = format(newEndTime, 'HH:mm');

      // Validate: Cannot move event to past date/time
      if (isDateTimeInPast(newDate, newStartTimeStr)) {
        alert('Cannot move an event to a past date/time. Please select a future date and time.');
        setDraggedEvent(null);
        setDropTarget(null);
        return;
      }

      // Validate: Only creator can move the event
      if (user && draggedEvent.createdBy !== user.id) {
        alert('You can only move events that you created.');
        setDraggedEvent(null);
        setDropTarget(null);
        return;
      }

      // Store original events for potential rollback
      const originalEvents = events;

      // Optimistically update UI immediately
      const updatedEvents = events.map(evt =>
        evt.id === draggedEvent.id
          ? {
            ...evt,
            date: newDate,
            startTime: newStartTimeStr,
            endTime: newEndTimeStr
          }
          : evt
      );
      setEvents(updatedEvents);

      // Call API to update backend without blocking UI
      updateCalendarEvent(projectId, draggedEvent.id, {
        date: newDate,
        startTime: newStartTimeStr,
        endTime: newEndTimeStr,
      })
        .then(() => {
          // Success - no action needed, UI already updated
          console.log('Event updated successfully');
        })
        .catch((error: any) => {
          console.error('Error updating event:', error);
          // Revert to original state on error
          setEvents(originalEvents);
          const errorMessage = error?.response?.data?.message || 'Failed to update event. Please try again.';
          alert(errorMessage);
        });
    }
    setDraggedEvent(null);
    setDropTarget(null);
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'meeting': return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'deadline': return 'bg-red-100 text-red-700 border-red-300';
      case 'milestone': return 'bg-purple-100 text-purple-700 border-purple-300';
      case 'review': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'call': return 'bg-green-100 text-green-700 border-green-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'meeting': return Users;
      case 'deadline': return AlertCircle;
      case 'milestone': return Star;
      case 'review': return CheckCircle;
      case 'call': return Video;
      default: return CalendarIcon;
    }
  };

  // Month view calendar grid
  const monthDays = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    const startDay = startOfWeek(start, { weekStartsOn: 0 });
    const endDay = endOfWeek(end, { weekStartsOn: 0 });

    const days = [];
    let day = startDay;
    while (day <= endDay) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  }, [currentDate]);

  const getEventsForDay = (day: Date) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    return events.filter(event => {
      if (!event.date) return false;
      return event.date === dateStr;
    }).sort((a, b) => {
      const aTime = new Date(`${a.date} ${a.startTime}`).getTime();
      const bTime = new Date(`${b.date} ${b.startTime}`).getTime();
      return aTime - bTime;
    });
  };

  const getEventPosition = (event: CalendarEvent) => {
    try {
      const startTime = new Date(`${event.date} ${event.startTime}`);
      const endTime = new Date(`${event.date} ${event.endTime}`);

      const startHour = startTime.getHours();
      const startMinutes = startTime.getMinutes();
      const endHour = endTime.getHours();
      const endMinutes = endTime.getMinutes();

      const top = (startHour + startMinutes / 60) * HOUR_HEIGHT;
      const duration = (endHour + endMinutes / 60) - (startHour + startMinutes / 60);
      const height = Math.max(duration * HOUR_HEIGHT, 25);

      return { top, height };
    } catch (error) {
      return { top: 0, height: 60 };
    }
  };

  const previousPeriod = () => {
    if (viewMode === 'week') {
      setCurrentDate(new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000));
    } else if (viewMode === 'day') {
      setCurrentDate(new Date(currentDate.getTime() - 24 * 60 * 60 * 1000));
    } else if (viewMode === 'month') {
      const newDate = new Date(currentDate);
      newDate.setMonth(newDate.getMonth() - 1);
      setCurrentDate(newDate);
    }
  };

  const nextPeriod = () => {
    if (viewMode === 'week') {
      setCurrentDate(new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000));
    } else if (viewMode === 'day') {
      setCurrentDate(new Date(currentDate.getTime() + 24 * 60 * 60 * 1000));
    } else if (viewMode === 'month') {
      const newDate = new Date(currentDate);
      newDate.setMonth(newDate.getMonth() + 1);
      setCurrentDate(newDate);
    }
  };

  const getCurrentTimePosition = () => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    return (currentMinutes / 60) * HOUR_HEIGHT;
  };

  const getViewTitle = () => {
    if (viewMode === 'day') {
      return format(currentDate, 'EEEE, MMMM d, yyyy');
    } else if (viewMode === 'week') {
      return `${format(weekDays[0], 'MMM d')} - ${format(weekDays[6], 'MMM d, yyyy')}`;
    } else if (viewMode === 'month') {
      return format(currentDate, 'MMMM yyyy');
    } else {
      return 'Agenda View';
    }
  };

  const stats = [
    {
      label: 'Upcoming Events',
      value: events.filter(e => e.status === 'upcoming').length,
      icon: CalendarIcon,
      color: 'bg-blue-500',
    },
    {
      label: 'This Week',
      value: events.filter(e => {
        const eventDate = new Date(e.date);
        const weekStart = new Date();
        const weekEnd = new Date();
        weekEnd.setDate(weekEnd.getDate() + 7);
        return eventDate >= weekStart && eventDate <= weekEnd;
      }).length,
      icon: Clock,
      color: 'bg-green-500',
    },
    {
      label: 'High Priority',
      value: events.filter(e => e.priority === 'high' && e.status === 'upcoming').length,
      icon: AlertCircle,
      color: 'bg-red-500',
    },
    {
      label: 'Meetings',
      value: events.filter(e => e.type === 'meeting' && e.status === 'upcoming').length,
      icon: Users,
      color: 'bg-purple-500',
    },
  ];

  // Show loading while checking access
  if (roleLoading) {
    return <AccessLoading />;
  }

  // Show access denied if user is not a project member
  if (!hasAccess) {
    return <AccessDenied message="You don't have permission to access the calendar for this project." />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading calendar events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Main Calendar Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Calendar Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3">
          {/* Single Row Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-white">Calendar & Schedule</h1>
              <span className="text-sm text-white/70">Manage your meetings, deadlines, and milestones</span>
            </div>
            {!isProjectCompleted && (
              <button
                onClick={() => setShowEventModal(true)}
                className="flex items-center space-x-2 bg-white text-indigo-600 px-4 py-2 rounded-lg font-medium hover:bg-white/90 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>New Event</span>
              </button>
            )}
          </div>

          {/* Compact Navigation Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <h2 className="text-base font-semibold">{getViewTitle()}</h2>
              <div className="flex items-center space-x-1">
                <button
                  onClick={previousPeriod}
                  className="w-8 h-8 bg-white/20 rounded flex items-center justify-center hover:bg-white/30 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentDate(new Date())}
                  className="px-3 py-1 bg-white/20 rounded text-sm font-medium hover:bg-white/30 transition-colors"
                >
                  Today
                </button>
                <button
                  onClick={nextPeriod}
                  className="w-8 h-8 bg-white/20 rounded flex items-center justify-center hover:bg-white/30 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* View Mode Selector */}
            <div className="flex items-center space-x-1">
              {[
                { mode: 'day', label: 'Day' },
                { mode: 'week', label: 'Week' },
                { mode: 'month', label: 'Month' },
                { mode: 'list', label: 'Agenda' }
              ].map(({ mode, label }) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode as any)}
                  className={`px-3 py-1 rounded text-sm font-medium transition-all ${viewMode === mode
                      ? 'bg-white text-indigo-600'
                      : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Calendar */}
        <div className="flex-1 overflow-hidden flex flex-col">

          {/* Day View */}
          {viewMode === 'day' && (
            <div className="flex-1 overflow-hidden flex flex-col bg-background">
              {/* Day Header */}
              <div className="flex border-b-2 border-border bg-background sticky top-0 z-10">
                <div className="w-16 flex-shrink-0 border-r border-border p-2">
                  <div className="text-xs text-muted-foreground">GMT</div>
                </div>
                <div className="flex-1">
                  <div className={`border-l border-border p-3 text-center ${isToday(currentDate) ? 'bg-gradient-to-r from-indigo-500/5 to-purple-500/5' : ''}`}>
                    <div className="text-xs text-muted-foreground mb-1">{format(currentDate, 'EEEE')}</div>
                    <div className={`text-sm font-medium w-8 h-8 rounded-full flex items-center justify-center mx-auto ${isToday(currentDate) ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white' : ''}`}>
                      {format(currentDate, 'd')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Time Grid */}
              <div className="flex-1 overflow-auto scrollbar-hide">
                <div className="flex relative">
                  {/* Time Column */}
                  <div className="w-16 flex-shrink-0 border-r border-border">
                    {HOURS.map((hour) => (
                      <div key={hour} className="relative" style={{ height: HOUR_HEIGHT }}>
                        {hour % 3 === 0 && (
                          <div className="absolute top-0 right-2 text-xs text-muted-foreground">
                            {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Day Column */}
                  <div className="flex-1 relative">
                    <div className={`border-l border-border relative ${isToday(currentDate) ? 'bg-gradient-to-r from-indigo-500/5 to-purple-500/5' : ''}`} style={{ minHeight: HOURS.length * HOUR_HEIGHT }}>
                      {/* Hour Grid Lines */}
                      {HOURS.map((hour) => (
                        <div
                          key={hour}
                          data-drop-zone="true"
                          className={`relative border-b border-border/50 ${!isProjectCompleted ? 'cursor-pointer hover:bg-muted/50' : ''} transition-colors ${dropTarget?.date && isSameDay(dropTarget.date, currentDate) && dropTarget.hour === hour ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border-indigo-500/50' : ''}`}
                          style={{ height: HOUR_HEIGHT }}
                          onClick={() => {
                            if (isProjectCompleted) return;
                            setSelectedSlot({ date: currentDate, hour });
                            setShowEventModal(true);
                          }}
                          onDragOver={(e) => handleDragOver(e, currentDate, hour)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, currentDate, hour)}
                        >
                          {dropTarget?.date && isSameDay(dropTarget.date, currentDate) && dropTarget.hour === hour && (
                            <div className="absolute inset-0 border-2 border-dashed border-indigo-500/50 rounded-md bg-gradient-to-r from-indigo-500/10 to-purple-500/10">
                              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-xs text-indigo-600 font-medium">Drop here</div>
                            </div>
                          )}
                        </div>
                      ))}

                      {/* Events */}
                      {getEventsForDay(currentDate).map((event) => {
                        const { top, height } = getEventPosition(event);
                        const Icon = getEventTypeIcon(event.type);

                        const isDragging = draggedEvent?.id === event.id;

                        return (
                          <div
                            key={event.id}
                            className="absolute left-1 right-1 z-20"
                            style={{
                              top,
                              height,
                              visibility: isDragging ? 'hidden' : 'visible'
                            }}
                          >
                            <div
                              draggable
                              onDragStart={(e) => handleDragStart(e, event)}
                              onDragEnd={handleDragEnd}
                              onDoubleClick={() => handleEventDoubleClick(event)}
                              className={`${getEventTypeColor(event.type)} border-l-4 rounded-lg px-2 py-1 cursor-move shadow-sm hover:shadow-md transition-all h-full overflow-hidden`}
                            >
                              <div className="flex items-center space-x-1">
                                <Icon className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate font-semibold text-xs">{event.title}</span>
                              </div>
                              <div className="text-xs opacity-75 mt-0.5">
                                {format(new Date(event.date), 'MMM d')} • {event.startTime}
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {/* Current Time Indicator */}
                      {isToday(currentDate) && (
                        <div className="absolute left-0 right-0 z-30 flex items-center" style={{ top: getCurrentTimePosition() }}>
                          <div className="w-2 h-2 bg-red-500 rounded-full -ml-1 z-10" />
                          <div className="flex-1 h-0.5 bg-red-500" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Week View */}
          {viewMode === 'week' && (
            <div className="flex-1 overflow-hidden flex flex-col bg-background">
              {/* Week Header */}
              <div className="flex border-b-2 border-border bg-background sticky top-0 z-10">
                <div className="w-16 flex-shrink-0 border-r border-border p-2">
                  <div className="text-xs text-muted-foreground">GMT</div>
                </div>
                <div className="grid grid-cols-7 flex-1">
                  {weekDays.map((day) => {
                    const isDayToday = isToday(day);
                    return (
                      <div
                        key={day.toISOString()}
                        className={`border-l border-border p-3 text-center ${isDayToday ? 'bg-gradient-to-r from-indigo-500/5 to-purple-500/5' : ''
                          }`}
                      >
                        <div className="text-xs text-muted-foreground mb-1">
                          {format(day, 'EEE')}
                        </div>
                        <div
                          className={`text-sm font-medium w-8 h-8 rounded-full flex items-center justify-center mx-auto ${isDayToday
                              ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white'
                              : ''
                            }`}
                        >
                          {format(day, 'd')}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Time Grid */}
              <div className="flex-1 overflow-auto scrollbar-hide">
                <div className="flex relative">
                  {/* Time Column */}
                  <div className="w-16 flex-shrink-0 border-r border-border">
                    {HOURS.map((hour) => (
                      <div
                        key={hour}
                        className="relative"
                        style={{ height: HOUR_HEIGHT }}
                      >
                        {hour % 3 === 0 && (
                          <div className="absolute top-0 right-2 text-xs text-muted-foreground">
                            {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Day Columns */}
                  <div className="grid grid-cols-7 flex-1 relative">
                    {weekDays.map((day) => {
                      const dayEvents = getEventsForDay(day);
                      const isDayToday = isToday(day);

                      return (
                        <div
                          key={day.toISOString()}
                          className={`border-l border-border relative ${isDayToday ? 'bg-gradient-to-r from-indigo-500/5 to-purple-500/5' : ''
                            }`}
                          style={{ minHeight: HOURS.length * HOUR_HEIGHT }}
                        >
                          {/* Hour Grid Lines */}
                          {HOURS.map((hour) => (
                            <div
                              key={hour}
                              data-drop-zone="true"
                              className={`relative border-b border-border/50 ${!isProjectCompleted ? 'cursor-pointer hover:bg-muted/50' : ''} transition-colors ${dropTarget?.date && isSameDay(dropTarget.date, day) && dropTarget.hour === hour
                                  ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border-indigo-500/50'
                                  : ''
                                }`}
                              style={{ height: HOUR_HEIGHT }}
                              onClick={() => {
                                if (isProjectCompleted) return;
                                setSelectedSlot({ date: day, hour });
                                setShowEventModal(true);
                              }}
                              onDragOver={(e) => handleDragOver(e, day, hour)}
                              onDragLeave={handleDragLeave}
                              onDrop={(e) => handleDrop(e, day, hour)}
                            >
                              {dropTarget?.date && isSameDay(dropTarget.date, day) && dropTarget.hour === hour && (
                                <div className="absolute inset-0 border-2 border-dashed border-indigo-500/50 rounded-md bg-gradient-to-r from-indigo-500/10 to-purple-500/10">
                                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-xs text-indigo-600 font-medium">
                                    Drop here
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}

                          {/* Events */}
                          {dayEvents.map((event) => {
                            const { top, height } = getEventPosition(event);
                            const Icon = getEventTypeIcon(event.type);

                            const isDragging = draggedEvent?.id === event.id;

                            return (
                              <div
                                key={event.id}
                                className="absolute left-1 right-1 z-20"
                                style={{
                                  top,
                                  height,
                                  visibility: isDragging ? 'hidden' : 'visible'
                                }}
                              >
                                <div
                                  draggable
                                  onDragStart={(e) => handleDragStart(e, event)}
                                  onDragEnd={handleDragEnd}
                                  onDoubleClick={() => handleEventDoubleClick(event)}
                                  className={`${getEventTypeColor(event.type)} border-l-4 rounded-lg px-2 py-1 cursor-move shadow-sm hover:shadow-md transition-all h-full overflow-hidden`}
                                >
                                  <div className="flex items-center space-x-1">
                                    <Icon className="w-3 h-3 flex-shrink-0" />
                                    <span className="truncate font-semibold text-xs">{event.title}</span>
                                  </div>
                                  <div className="text-xs opacity-75 mt-0.5">
                                    {format(new Date(event.date), 'MMM d')} • {event.startTime}
                                  </div>
                                </div>
                              </div>
                            );
                          })}

                          {/* Current Time Indicator */}
                          {isDayToday && (
                            <div
                              className="absolute left-0 right-0 z-30 flex items-center"
                              style={{ top: getCurrentTimePosition() }}
                            >
                              <div className="w-2 h-2 bg-red-500 rounded-full -ml-1 z-10" />
                              <div className="flex-1 h-0.5 bg-red-500" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Month View */}
          {viewMode === 'month' && (
            <div className="flex-1 overflow-auto bg-background">
              <div className="relative">
                {/* Day headers - Sticky */}
                <div className="sticky top-0 z-10 grid grid-cols-7 gap-px bg-border">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <div key={day} className="bg-muted p-2 text-center text-xs font-semibold text-muted-foreground">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-px bg-border">
                  {/* Calendar days */}
                  {monthDays.map((day) => {
                    const dayEvents = getEventsForDay(day);
                    const isDayToday = isToday(day);
                    const isCurrentMonth = isSameMonth(day, currentDate);

                    return (
                      <div
                        key={day.toISOString()}
                        className={`bg-background p-2 min-h-[100px] cursor-pointer hover:bg-muted/30 transition-colors ${!isCurrentMonth ? 'opacity-40' : ''} ${isDayToday ? 'bg-gradient-to-br from-indigo-500/10 to-purple-500/10' : ''}`}
                        onClick={() => {
                          setCurrentDate(day);
                          setViewMode('day');
                        }}
                        onDragOver={(e) => handleDragOver(e, day)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, day)}
                      >
                        <div className={`text-sm font-medium mb-1 ${isDayToday ? 'w-6 h-6 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white flex items-center justify-center' : ''}`}>
                          {format(day, 'd')}
                        </div>
                        <div className="space-y-1">
                          {dayEvents.slice(0, 3).map((event) => {
                            const Icon = getEventTypeIcon(event.type);
                            return (
                              <div
                                key={event.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, event)}
                                onDoubleClick={() => handleEventDoubleClick(event)}
                                className={`${getEventTypeColor(event.type)} border-l-2 rounded px-1 py-0.5 cursor-move text-xs truncate flex items-center gap-1`}
                              >
                                <Icon className="w-2.5 h-2.5 flex-shrink-0" />
                                <span className="truncate">{event.title}</span>
                              </div>
                            );
                          })}
                          {dayEvents.length > 3 && (
                            <div className="text-xs text-muted-foreground px-1">+{dayEvents.length - 3} more</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* List/Agenda View */}
          {viewMode === 'list' && (
            <div className="flex-1 overflow-auto bg-background p-6">
              <div className="max-w-4xl mx-auto space-y-4">
                {events.length === 0 ? (
                  <div className="text-center py-12">
                    <CalendarIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No events scheduled</p>
                  </div>
                ) : (
                  events.map((event) => {
                    const Icon = getEventTypeIcon(event.type);
                    return (
                      <div key={event.id} className={`${getEventTypeColor(event.type)} border-l-4 rounded-lg p-4 shadow-sm`}>
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className={`w-10 h-10 rounded-lg ${getEventTypeColor(event.type)} flex items-center justify-center mt-1`}>
                              <Icon className="w-5 h-5" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-base">{event.title}</h3>
                              {event.description ? (
                                <div
                                  className="text-sm opacity-75 mt-1 prose prose-sm max-w-none"
                                  dangerouslySetInnerHTML={{ __html: event.description }}
                                />
                              ) : (
                                <p className="text-sm opacity-75 mt-1">No description</p>
                              )}
                              <div className="flex items-center gap-4 mt-2 text-xs opacity-75">
                                <span className="flex items-center gap-1">
                                  <CalendarIcon className="w-3 h-3" />
                                  {event.date}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {event.startTime} - {event.endTime}
                                </span>
                              </div>
                            </div>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${event.priority === 'high' ? 'bg-red-100 text-red-700' : event.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                            {event.priority || 'Normal'}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Right Sidebar */}
      <div className="w-80 border-l border-border bg-background overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Stats */}
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="bg-card rounded-lg p-4 border border-border">
                <div className="flex items-center justify-between">
                  <div className={`w-12 h-12 rounded-lg ${stat.color} flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Event Modal */}
      <AnimatePresence>
        {showEventModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => {
              setShowEventModal(false);
              setSelectedSlot(null);
              setSelectedEvent(null);
              setSelectedAttendees([]);
              setShowAttendeesDropdown(false);
              setEventDescription('');
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-background rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-border"
            >
              <div className="p-6 border-b border-border">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">{selectedEvent ? 'Edit Event' : 'Add New Event'}</h2>
                  <button
                    onClick={() => {
                      setShowEventModal(false);
                      setSelectedSlot(null);
                      setSelectedEvent(null);
                      setSelectedAttendees([]);
                      setShowAttendeesDropdown(false);
                    }}
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <form key={selectedEvent?.id || 'new'} onSubmit={handleSubmitEvent} className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Event Title *</label>
                    <input
                      type="text"
                      name="title"
                      required
                      defaultValue={selectedEvent?.title || ''}
                      placeholder="Enter event title"
                      className="w-full px-4 py-3 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Description</label>
                    <RichTextEditor
                      value={eventDescription}
                      onChange={setEventDescription}
                      placeholder="Enter event description"
                      height={150}
                      minHeight={100}
                    />
                  </div>
                  {/* Date/Time Validation Error */}
                  {dateError && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      {dateError}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Date *</label>
                      <input
                        type="date"
                        name="date"
                        required
                        min={getTodayDate()}
                        defaultValue={selectedEvent?.date || (selectedSlot ? format(selectedSlot.date, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'))}
                        onChange={() => setDateError(null)}
                        className={`w-full px-4 py-3 bg-muted border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-colors ${dateError ? 'border-red-500' : 'border-border'}`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Event Type *</label>
                      <select name="type" required defaultValue={selectedEvent?.type || 'meeting'} className="w-full px-4 py-3 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-colors">
                        <option value="meeting">Meeting</option>
                        <option value="deadline">Deadline</option>
                        <option value="call">Call</option>
                        <option value="review">Review</option>
                        <option value="milestone">Milestone</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Start Time *</label>
                      <input
                        type="time"
                        name="startTime"
                        required
                        defaultValue={selectedEvent?.startTime || (selectedSlot ? `${String(selectedSlot.hour).padStart(2, '0')}:00` : '09:00')}
                        onChange={() => setDateError(null)}
                        className={`w-full px-4 py-3 bg-muted border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-colors ${dateError ? 'border-red-500' : 'border-border'}`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">End Time *</label>
                      <input
                        type="time"
                        name="endTime"
                        required
                        defaultValue={selectedEvent?.endTime || (selectedSlot ? `${String(selectedSlot.hour + 1).padStart(2, '0')}:00` : '10:00')}
                        className="w-full px-4 py-3 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Meeting URL</label>
                      <input
                        type="url"
                        name="meetingUrl"
                        defaultValue={selectedEvent?.meetingLink || ''}
                        placeholder="https://meet.google.com/..."
                        className="w-full px-4 py-3 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Priority</label>
                      <select name="priority" defaultValue={selectedEvent?.priority || 'normal'} className="w-full px-4 py-3 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-colors">
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                        <option value="normal">Normal</option>
                      </select>
                    </div>
                  </div>

                  {/* Reminder */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Reminder (minutes before)</label>
                    <input
                      type="number"
                      name="reminderMinutes"
                      min="1"
                      defaultValue={selectedEvent?.reminderMinutes || ''}
                      placeholder="e.g., 15 for 15 minutes before"
                      className="w-full px-4 py-3 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      Leave empty for no reminder. All attendees will be notified.
                    </p>
                  </div>

                  {/* Attendees */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Attendees
                      </div>
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowAttendeesDropdown(!showAttendeesDropdown)}
                        className="w-full px-4 py-3 bg-muted border border-border rounded-lg text-left focus:outline-none focus:ring-2 focus:ring-primary transition-colors flex items-center justify-between"
                      >
                        <span className={selectedAttendees.length === 0 ? 'text-muted-foreground' : ''}>
                          {getSelectedAttendeesText()}
                        </span>
                        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showAttendeesDropdown ? 'rotate-180' : ''}`} />
                      </button>

                      {/* Dropdown */}
                      {showAttendeesDropdown && (
                        <div className="absolute z-10 w-full mt-1 bg-background border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                          {projectMembers.length === 0 ? (
                            <div className="px-4 py-3 text-sm text-muted-foreground">No team members found</div>
                          ) : (
                            projectMembers.map((member) => {
                              const isCreator = member.user_id === user?.id;
                              const isSelected = selectedAttendees.includes(member.user_id);
                              return (
                                <button
                                  key={member.user_id}
                                  type="button"
                                  onClick={() => toggleAttendee(member.user_id)}
                                  className={`w-full px-4 py-2 flex items-center gap-3 hover:bg-muted transition-colors ${isCreator ? 'bg-muted/50' : ''}`}
                                >
                                  {/* Avatar */}
                                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                                    {member.avatar ? (
                                      <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                                    ) : (
                                      <span className="text-sm font-medium text-primary">
                                        {member.name?.charAt(0).toUpperCase()}
                                      </span>
                                    )}
                                  </div>
                                  {/* Name & Role */}
                                  <div className="flex-1 text-left">
                                    <div className="text-sm font-medium">
                                      {member.name}
                                      {isCreator && <span className="ml-1 text-xs text-muted-foreground">(You)</span>}
                                    </div>
                                    <div className="text-xs text-muted-foreground capitalize">{member.role}</div>
                                  </div>
                                  {/* Checkmark */}
                                  {isSelected && (
                                    <Check className={`w-4 h-4 ${isCreator ? 'text-muted-foreground' : 'text-primary'}`} />
                                  )}
                                </button>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                    {selectedAttendees.length > 0 && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        {selectedAttendees.length} attendee{selectedAttendees.length > 1 ? 's' : ''} selected. You will be added as an attendee automatically.
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 mt-6 pt-6 border-t border-border">
                  {selectedEvent && (
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(true)}
                      disabled={isSubmitting}
                      className="px-6 py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setShowEventModal(false);
                      setSelectedSlot(null);
                      setSelectedEvent(null);
                      setSelectedAttendees([]);
                      setShowAttendeesDropdown(false);
                    }}
                    className="flex-1 px-6 py-3 bg-background border border-border rounded-lg font-medium hover:bg-muted transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (selectedEvent ? 'Updating...' : 'Creating...') : (selectedEvent ? 'Update Event' : 'Create Event')}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-background rounded-2xl shadow-2xl max-w-md w-full border border-border"
            >
              <div className="p-6">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mx-auto mb-4">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-center mb-2">Delete Event</h3>
                <p className="text-muted-foreground text-center mb-1">
                  Are you sure you want to delete this event?
                </p>
                {selectedEvent && (
                  <p className="text-center font-medium mb-6">"{selectedEvent.title}"</p>
                )}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isSubmitting}
                    className="flex-1 px-6 py-3 bg-background border border-border rounded-lg font-medium hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteEvent}
                    disabled={isSubmitting}
                    className="flex-1 px-6 py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Calendar;
