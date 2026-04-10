/**
 * Create Event Modal Component
 *
 * Modal for creating a new calendar event with all details.
 */

import React, { useState, useEffect } from 'react'
import { X, Calendar, Clock, MapPin, Link as LinkIcon, AlertCircle, Users, Check, ChevronDown } from 'lucide-react'
import { CreateEventData, EventType, EventPriority } from '@/services/calendarService'
import { getProjectTeam } from '@/services/teamMemberService'
import type { TeamMember } from '@/types/teamMember'
import { cn } from '@/lib/utils'
import RichTextEditor from '@/components/ui/RichTextEditor'

interface CreateEventModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateEventData) => Promise<void>
  initialDate?: string
  projectId: string
  currentUserId?: string
}

const EVENT_TYPES: { value: EventType; label: string; icon: string }[] = [
  { value: 'meeting', label: 'Meeting', icon: '📅' },
  { value: 'deadline', label: 'Deadline', icon: '⏰' },
  { value: 'call', label: 'Call', icon: '📞' },
  { value: 'review', label: 'Review', icon: '🔍' },
  { value: 'milestone', label: 'Milestone', icon: '🎯' },
]

const PRIORITIES: { value: EventPriority; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: 'bg-gray-100 text-gray-700' },
  { value: 'normal', label: 'Normal', color: 'bg-blue-100 text-blue-700' },
  { value: 'medium', label: 'Medium', color: 'bg-orange-100 text-orange-700' },
  { value: 'high', label: 'High', color: 'bg-red-100 text-red-700' },
]

const COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#84CC16', // Lime
]

// Get today's date in YYYY-MM-DD format for min attribute
const getTodayDate = () => new Date().toISOString().split('T')[0]

// Check if a date/time is in the past
const isDateTimeInPast = (date: string, time: string): boolean => {
  const now = new Date()
  const eventDateTime = new Date(`${date}T${time}:00`)
  return eventDateTime < now
}

export const CreateEventModal: React.FC<CreateEventModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialDate,
  projectId,
  currentUserId,
}) => {
  const [formData, setFormData] = useState<CreateEventData>({
    title: '',
    date: initialDate || getTodayDate(),
    startTime: '09:00',
    endTime: '10:00',
    type: 'meeting',
    priority: 'medium',
    attendees: [],
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [dateError, setDateError] = useState<string | null>(null)
  const [projectMembers, setProjectMembers] = useState<TeamMember[]>([])
  const [loadingMembers, setLoadingMembers] = useState(false)
  const [showAttendeesDropdown, setShowAttendeesDropdown] = useState(false)

  useEffect(() => {
    if (initialDate) {
      setFormData((prev) => ({ ...prev, date: initialDate }))
    }
  }, [initialDate])

  // Fetch project members when modal opens
  useEffect(() => {
    if (isOpen && projectId) {
      setLoadingMembers(true)
      getProjectTeam(projectId)
        .then((members) => {
          setProjectMembers(members)
        })
        .catch((err) => {
          console.error('Failed to fetch project members:', err)
        })
        .finally(() => {
          setLoadingMembers(false)
        })
    }
  }, [isOpen, projectId])

  // Auto-select the current user (creator) when the modal opens
  useEffect(() => {
    if (isOpen && currentUserId) {
      setFormData((prev) => {
        const currentAttendees = prev.attendees || []
        if (!currentAttendees.includes(currentUserId)) {
          return { ...prev, attendees: [currentUserId, ...currentAttendees] }
        }
        return prev
      })
    }
  }, [isOpen, currentUserId])

  const toggleAttendee = (userId: string) => {
    // Prevent removing the current user (creator) from attendees
    if (userId === currentUserId && formData.attendees?.includes(userId)) {
      return
    }
    setFormData((prev) => {
      const currentAttendees = prev.attendees || []
      if (currentAttendees.includes(userId)) {
        return { ...prev, attendees: currentAttendees.filter((id) => id !== userId) }
      } else {
        return { ...prev, attendees: [...currentAttendees, userId] }
      }
    })
  }

  const getSelectedAttendeesNames = () => {
    if (!formData.attendees || formData.attendees.length === 0) {
      return 'Select attendees...'
    }
    const names = formData.attendees
      .map((id) => projectMembers.find((m) => m.user_id === id)?.name)
      .filter(Boolean)
    if (names.length <= 2) {
      return names.join(', ')
    }
    return `${names.slice(0, 2).join(', ')} +${names.length - 2} more`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim()) {
      setError('Title is required')
      return
    }

    if (!formData.date) {
      setError('Date is required')
      return
    }

    if (!formData.startTime) {
      setError('Start time is required')
      return
    }

    // Validate that the event date/time is not in the past
    if (isDateTimeInPast(formData.date, formData.startTime)) {
      setDateError('Cannot create an event in the past. Please select a future date and time.')
      return
    }

    setIsSubmitting(true)
    setError(null)
    setDateError(null)

    try {
      await onSubmit(formData)
      handleClose()
    } catch (err: any) {
      setError(err.message || 'Failed to create event')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setFormData({
      title: '',
      date: getTodayDate(),
      startTime: '09:00',
      endTime: '10:00',
      type: 'meeting',
      priority: 'medium',
      attendees: [],
    })
    setError(null)
    setDateError(null)
    setShowAdvanced(false)
    setShowAttendeesDropdown(false)
    onClose()
  }

  // Handle date change with validation
  const handleDateChange = (newDate: string) => {
    setFormData({ ...formData, date: newDate })
    setDateError(null)
    // Check if new date with current time is in past
    if (isDateTimeInPast(newDate, formData.startTime)) {
      setDateError('Selected date/time is in the past')
    }
  }

  // Handle time change with validation
  const handleStartTimeChange = (newTime: string) => {
    setFormData({ ...formData, startTime: newTime })
    setDateError(null)
    // Check if current date with new time is in past
    if (isDateTimeInPast(formData.date, newTime)) {
      setDateError('Selected date/time is in the past')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />

      {/* Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Create New Event
          </h2>
          <button
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
            onClick={handleClose}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          {/* Title */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Event Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => {
                setFormData({ ...formData, title: e.target.value })
                setError(null)
              }}
              placeholder="Enter event title..."
              autoFocus
              className={cn(
                'w-full px-4 py-3 rounded-lg border bg-gray-50 dark:bg-gray-700/50',
                'text-gray-900 dark:text-white placeholder-gray-400',
                'focus:outline-none focus:ring-2 focus:ring-blue-500',
                error && !formData.title
                  ? 'border-red-300 dark:border-red-500'
                  : 'border-gray-200 dark:border-gray-600'
              )}
            />
          </div>

          {/* Event Type */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Event Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {EVENT_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors',
                    formData.type === type.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                      : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  )}
                  onClick={() => setFormData({ ...formData, type: type.value })}
                >
                  <span>{type.icon}</span>
                  <span>{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Date & Time */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Date & Time *
            </label>
            <div className="grid grid-cols-3 gap-2">
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  value={formData.date}
                  min={getTodayDate()}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className={cn(
                    'w-full pl-10 pr-3 py-2 text-sm border rounded-lg bg-gray-50 dark:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-blue-500',
                    dateError ? 'border-red-300 dark:border-red-500' : 'border-gray-200 dark:border-gray-600'
                  )}
                />
              </div>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => handleStartTimeChange(e.target.value)}
                  className={cn(
                    'w-full pl-10 pr-3 py-2 text-sm border rounded-lg bg-gray-50 dark:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-blue-500',
                    dateError ? 'border-red-300 dark:border-red-500' : 'border-gray-200 dark:border-gray-600'
                  )}
                />
              </div>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  placeholder="End"
                  className="w-full pl-10 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            {/* Date/Time Error */}
            {dateError && (
              <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {dateError}
              </p>
            )}
          </div>

          {/* Priority */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Priority
            </label>
            <div className="flex gap-2">
              {PRIORITIES.map((priority) => (
                <button
                  key={priority.value}
                  type="button"
                  className={cn(
                    'flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    formData.priority === priority.value
                      ? priority.color
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  )}
                  onClick={() => setFormData({ ...formData, priority: priority.value })}
                >
                  {priority.label}
                </button>
              ))}
            </div>
          </div>

          {/* Attendees */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Attendees
              </div>
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowAttendeesDropdown(!showAttendeesDropdown)}
                className={cn(
                  'w-full px-4 py-3 rounded-lg border bg-gray-50 dark:bg-gray-700/50 text-left',
                  'text-gray-900 dark:text-white',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500',
                  'border-gray-200 dark:border-gray-600',
                  'flex items-center justify-between'
                )}
                disabled={loadingMembers}
              >
                <span className={formData.attendees?.length === 0 ? 'text-gray-400' : ''}>
                  {loadingMembers ? 'Loading members...' : getSelectedAttendeesNames()}
                </span>
                <ChevronDown className={cn('w-4 h-4 text-gray-400 transition-transform', showAttendeesDropdown && 'rotate-180')} />
              </button>

              {/* Dropdown */}
              {showAttendeesDropdown && !loadingMembers && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {projectMembers.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-gray-500">No team members found</div>
                  ) : (
                    projectMembers.map((member) => {
                      const isCreator = member.user_id === currentUserId
                      const isSelected = formData.attendees?.includes(member.user_id)
                      return (
                        <button
                          key={member.user_id}
                          type="button"
                          onClick={() => toggleAttendee(member.user_id)}
                          className={cn(
                            'w-full px-4 py-2 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors',
                            isCreator && 'bg-blue-50/50 dark:bg-blue-900/20'
                          )}
                        >
                          {/* Avatar */}
                          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {member.avatar ? (
                              <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                {member.name?.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          {/* Name & Role */}
                          <div className="flex-1 text-left">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {member.name}
                              {isCreator && <span className="ml-1 text-xs text-gray-500">(You)</span>}
                            </div>
                            <div className="text-xs text-gray-500 capitalize">{member.role}</div>
                          </div>
                          {/* Checkmark */}
                          {isSelected && (
                            <Check className={cn('w-4 h-4', isCreator ? 'text-gray-400' : 'text-blue-500')} />
                          )}
                        </button>
                      )
                    })
                  )}
                </div>
              )}
            </div>
            {formData.attendees && formData.attendees.length > 0 && (
              <p className="mt-2 text-xs text-gray-500">
                {formData.attendees.length} attendee{formData.attendees.length > 1 ? 's' : ''} selected
                {currentUserId && formData.attendees.includes(currentUserId) && ' (including you)'}
              </p>
            )}
          </div>

          {/* Color */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Color
            </label>
            <div className="flex gap-2">
              {COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={cn(
                    'w-8 h-8 rounded-full transition-transform',
                    formData.color === color && 'ring-2 ring-offset-2 ring-gray-400 scale-110'
                  )}
                  style={{ backgroundColor: color }}
                  onClick={() => setFormData({ ...formData, color })}
                />
              ))}
            </div>
          </div>

          {/* Advanced Options Toggle */}
          <button
            type="button"
            className="flex items-center gap-2 text-sm text-blue-500 hover:text-blue-600 mb-4"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            <AlertCircle className="w-4 h-4" />
            {showAdvanced ? 'Hide' : 'Show'} advanced options
          </button>

          {/* Advanced Options */}
          {showAdvanced && (
            <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <RichTextEditor
                  value={formData.description || ''}
                  onChange={(value) => setFormData({ ...formData, description: value })}
                  placeholder="Add a description..."
                  height={150}
                  minHeight={100}
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Location
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={formData.location || ''}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Add location..."
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Meeting URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Meeting URL
                </label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="url"
                    value={formData.meetingUrl || ''}
                    onChange={(e) => setFormData({ ...formData, meetingUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

            </div>
          )}

          {/* Error */}
          {error && (
            <p className="mt-4 text-sm text-red-500">{error}</p>
          )}
        </form>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={cn(
              'px-4 py-2 text-sm bg-blue-500 text-white rounded-lg',
              'hover:bg-blue-600 transition-colors',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Creating...
              </span>
            ) : (
              'Create Event'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default CreateEventModal
