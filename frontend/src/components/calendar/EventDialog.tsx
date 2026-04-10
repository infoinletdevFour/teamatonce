/**
 * Event Dialog Component
 *
 * Modal for viewing and editing calendar event details.
 */

import React, { useState, useEffect } from 'react'
import {
  X,
  Calendar,
  MapPin,
  Link as LinkIcon,
  AlertCircle,
  Edit2,
  Trash2,
  Check,
  Bell,
} from 'lucide-react'
import {
  CalendarEvent,
  UpdateEventData,
  EventType,
  EventPriority,
  getEventTypeColor,
  formatTime,
  formatDate,
} from '@/services/calendarService'
import { cn } from '@/lib/utils'
import RichTextEditor from '@/components/ui/RichTextEditor'

interface EventDialogProps {
  event: CalendarEvent | null
  isOpen: boolean
  onClose: () => void
  onUpdate: (eventId: string, data: UpdateEventData) => Promise<void>
  onDelete: (eventId: string) => void
  onComplete: (eventId: string) => void
  currentUserId?: string // Current user's ID for edit permission check
}

// Get today's date in YYYY-MM-DD format for min attribute
const getTodayDate = () => new Date().toISOString().split('T')[0]

// Check if a date/time is in the past
const isDateTimeInPast = (date: string, time: string): boolean => {
  const now = new Date()
  const eventDateTime = new Date(`${date}T${time}:00`)
  return eventDateTime < now
}

const EVENT_TYPES: { value: EventType; label: string }[] = [
  { value: 'meeting', label: 'Meeting' },
  { value: 'deadline', label: 'Deadline' },
  { value: 'call', label: 'Call' },
  { value: 'review', label: 'Review' },
  { value: 'milestone', label: 'Milestone' },
]

const PRIORITIES: { value: EventPriority; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: 'text-gray-500' },
  { value: 'normal', label: 'Normal', color: 'text-blue-500' },
  { value: 'medium', label: 'Medium', color: 'text-orange-500' },
  { value: 'high', label: 'High', color: 'text-red-500' },
]

export const EventDialog: React.FC<EventDialogProps> = ({
  event,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  onComplete,
  currentUserId,
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setSaving] = useState(false)
  const [formData, setFormData] = useState<UpdateEventData>({})
  const [dateError, setDateError] = useState<string | null>(null)

  // Check if current user is the creator of the event
  const isCreator = currentUserId && event?.createdBy === currentUserId

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title,
        description: event.description,
        date: event.date,
        startTime: event.startTime,
        endTime: event.endTime,
        type: event.type,
        priority: event.priority,
        location: event.location,
        meetingUrl: event.meetingUrl,
      })
      setIsEditing(false)
      setDateError(null)
    }
  }, [event])

  const handleSave = async () => {
    if (!event) return

    // Validate that the event date/time is not in the past
    const dateToCheck = formData.date || event.date
    const timeToCheck = formData.startTime || event.startTime
    if (isDateTimeInPast(dateToCheck, timeToCheck)) {
      setDateError('Cannot set an event to a past date/time. Please select a future date and time.')
      return
    }

    setSaving(true)
    setDateError(null)
    try {
      await onUpdate(event.id, formData)
      setIsEditing(false)
    } catch (error: any) {
      console.error('Failed to update event:', error)
      // Show backend validation error if present
      if (error.message) {
        setDateError(error.message)
      }
    } finally {
      setSaving(false)
    }
  }

  // Handle date change with validation
  const handleDateChange = (newDate: string) => {
    setFormData({ ...formData, date: newDate })
    setDateError(null)
    const timeToCheck = formData.startTime || event?.startTime || '00:00'
    if (isDateTimeInPast(newDate, timeToCheck)) {
      setDateError('Selected date/time is in the past')
    }
  }

  // Handle time change with validation
  const handleStartTimeChange = (newTime: string) => {
    setFormData({ ...formData, startTime: newTime })
    setDateError(null)
    const dateToCheck = formData.date || event?.date || getTodayDate()
    if (isDateTimeInPast(dateToCheck, newTime)) {
      setDateError('Selected date/time is in the past')
    }
  }

  const handleDelete = () => {
    if (!event) return
    if (window.confirm('Are you sure you want to delete this event?')) {
      onDelete(event.id)
      onClose()
    }
  }

  if (!isOpen || !event) return null

  const eventColor = event.color || getEventTypeColor(event.type)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Dialog */}
      <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header with color strip */}
        <div
          className="h-2"
          style={{ backgroundColor: eventColor }}
        />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: eventColor }}
            />
            {isEditing ? (
              <input
                type="text"
                value={formData.title || ''}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="text-lg font-semibold text-gray-900 dark:text-white bg-transparent border-b-2 border-blue-500 focus:outline-none"
              />
            ) : (
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {event.title}
              </h2>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Only show edit button if user is the creator and event is not completed */}
            {!isEditing && event.status !== 'completed' && isCreator && (
              <button
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
                onClick={() => setIsEditing(true)}
                title="Edit"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}
            <button
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
              onClick={onClose}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Status Badge */}
          {event.status !== 'upcoming' && (
            <div
              className={cn(
                'inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full',
                event.status === 'completed' && 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
                event.status === 'cancelled' && 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              )}
            >
              {event.status === 'completed' && <Check className="w-3 h-3" />}
              {event.status.charAt(0).toUpperCase() + event.status.slice(1).replace('_', ' ')}
            </div>
          )}

          {/* Date & Time */}
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-2">
                  <input
                    type="date"
                    value={formData.date || ''}
                    min={getTodayDate()}
                    onChange={(e) => handleDateChange(e.target.value)}
                    className={cn(
                      'w-full px-3 py-2 text-sm border rounded-lg bg-gray-50 dark:bg-gray-700',
                      dateError ? 'border-red-300 dark:border-red-500' : 'border-gray-200 dark:border-gray-600'
                    )}
                  />
                  <div className="flex gap-2">
                    <input
                      type="time"
                      value={formData.startTime || ''}
                      onChange={(e) => handleStartTimeChange(e.target.value)}
                      className={cn(
                        'flex-1 px-3 py-2 text-sm border rounded-lg bg-gray-50 dark:bg-gray-700',
                        dateError ? 'border-red-300 dark:border-red-500' : 'border-gray-200 dark:border-gray-600'
                      )}
                    />
                    <span className="flex items-center text-gray-400">to</span>
                    <input
                      type="time"
                      value={formData.endTime || ''}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700"
                    />
                  </div>
                  {/* Date/Time Error */}
                  {dateError && (
                    <p className="text-sm text-red-500">{dateError}</p>
                  )}
                </div>
              ) : (
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatDate(event.date)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatTime(event.startTime)}
                    {event.endTime && ` - ${formatTime(event.endTime)}`}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Type & Priority */}
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-gray-400 mt-0.5" />
            <div className="flex-1">
              {isEditing ? (
                <div className="flex gap-2">
                  <select
                    value={formData.type || 'meeting'}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as EventType })}
                    className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700"
                  >
                    {EVENT_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={formData.priority || 'medium'}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as EventPriority })}
                    className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700"
                  >
                    {PRIORITIES.map((priority) => (
                      <option key={priority.value} value={priority.value}>
                        {priority.label}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {EVENT_TYPES.find((t) => t.value === event.type)?.label || event.type}
                  </span>
                  <span className="text-gray-300">|</span>
                  <span
                    className={cn(
                      'text-sm font-medium',
                      PRIORITIES.find((p) => p.value === event.priority)?.color
                    )}
                  >
                    {PRIORITIES.find((p) => p.value === event.priority)?.label || event.priority} Priority
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Location */}
          {(event.location || isEditing) && (
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.location || ''}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Add location"
                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700"
                  />
                ) : (
                  <p className="text-sm text-gray-700 dark:text-gray-300">{event.location}</p>
                )}
              </div>
            </div>
          )}

          {/* Meeting URL */}
          {(event.meetingUrl || isEditing) && (
            <div className="flex items-start gap-3">
              <LinkIcon className="w-5 h-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                {isEditing ? (
                  <input
                    type="url"
                    value={formData.meetingUrl || ''}
                    onChange={(e) => setFormData({ ...formData, meetingUrl: e.target.value })}
                    placeholder="Add meeting URL"
                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700"
                  />
                ) : (
                  <a
                    href={event.meetingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-500 hover:underline"
                  >
                    {event.meetingUrl}
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Description */}
          <div className="flex items-start gap-3">
            <Bell className="w-5 h-5 text-gray-400 mt-0.5" />
            <div className="flex-1">
              {isEditing ? (
                <RichTextEditor
                  value={formData.description || ''}
                  onChange={(value) => setFormData({ ...formData, description: value })}
                  placeholder="Add description"
                  height={150}
                  minHeight={100}
                />
              ) : event.description ? (
                <div
                  className="text-sm text-gray-700 dark:text-gray-300 prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: event.description }}
                />
              ) : (
                <p className="text-sm text-gray-500">No description</p>
              )}
            </div>
          </div>

          {/* Meta Info */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500">
            <p>Created by {event.createdBy}</p>
            <p>Last updated: {new Date(event.updatedAt).toLocaleString()}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700">
          <button
            className="flex items-center gap-1 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
            onClick={handleDelete}
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>

          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button
                  className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  onClick={() => setIsEditing(false)}
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </>
            ) : (
              event.status === 'upcoming' && (
                <button
                  className="flex items-center gap-1 px-4 py-2 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600"
                  onClick={() => onComplete(event.id)}
                >
                  <Check className="w-4 h-4" />
                  Mark Complete
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default EventDialog
