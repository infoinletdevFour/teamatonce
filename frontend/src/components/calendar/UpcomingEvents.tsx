/**
 * Upcoming Events Component
 *
 * Sidebar component showing upcoming events list.
 */

import React from 'react'
import { Calendar, Clock, MapPin, Video, ChevronRight } from 'lucide-react'
import {
  CalendarEvent,
  getEventTypeColor,
  formatTime,
  formatDate,
} from '@/services/calendarService'
import { cn } from '@/lib/utils'

interface UpcomingEventsProps {
  events: CalendarEvent[]
  onEventClick: (event: CalendarEvent) => void
  onViewAll?: () => void
  limit?: number
  isLoading?: boolean
}

export const UpcomingEvents: React.FC<UpcomingEventsProps> = ({
  events,
  onEventClick,
  onViewAll,
  limit = 5,
  isLoading,
}) => {
  const displayEvents = events.slice(0, limit)

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4">
        <div className="animate-pulse">
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 dark:text-white">Upcoming Events</h3>
        {onViewAll && events.length > limit && (
          <button
            className="text-sm text-blue-500 hover:text-blue-600 flex items-center gap-1"
            onClick={onViewAll}
          >
            View all
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {displayEvents.length === 0 ? (
        <div className="text-center py-8">
          <Calendar className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">No upcoming events</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayEvents.map((event) => {
            const eventColor = event.color || getEventTypeColor(event.type)
            const isToday = event.date === new Date().toISOString().split('T')[0]
            const isTomorrow = event.date === new Date(Date.now() + 86400000).toISOString().split('T')[0]

            return (
              <div
                key={event.id}
                className="group flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                onClick={() => onEventClick(event)}
              >
                {/* Color indicator */}
                <div
                  className="w-1 h-full min-h-[40px] rounded-full flex-shrink-0"
                  style={{ backgroundColor: eventColor }}
                />

                <div className="flex-1 min-w-0">
                  {/* Title */}
                  <p className="font-medium text-gray-900 dark:text-white truncate group-hover:text-blue-500 transition-colors">
                    {event.title}
                  </p>

                  {/* Date & Time */}
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                    <span
                      className={cn(
                        'px-1.5 py-0.5 rounded',
                        isToday && 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
                        isTomorrow && 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                      )}
                    >
                      {isToday ? 'Today' : isTomorrow ? 'Tomorrow' : formatDate(event.date)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTime(event.startTime)}
                    </span>
                  </div>

                  {/* Location or Meeting URL */}
                  {(event.location || event.meetingUrl) && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                      {event.meetingUrl ? (
                        <>
                          <Video className="w-3 h-3" />
                          <span>Online meeting</span>
                        </>
                      ) : (
                        <>
                          <MapPin className="w-3 h-3" />
                          <span className="truncate">{event.location}</span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Type badge */}
                <span
                  className="px-2 py-0.5 text-xs rounded-full flex-shrink-0"
                  style={{
                    backgroundColor: eventColor + '20',
                    color: eventColor,
                  }}
                >
                  {event.type}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {events.length > limit && (
        <p className="mt-3 text-center text-xs text-gray-500 dark:text-gray-400">
          +{events.length - limit} more events
        </p>
      )}
    </div>
  )
}

export default UpcomingEvents
