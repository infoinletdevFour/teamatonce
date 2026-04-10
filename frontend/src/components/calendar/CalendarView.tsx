/**
 * Calendar View Component
 *
 * Main calendar component with month view and event display.
 * Supports navigation, event creation, and event details.
 */

import React, { useState, useMemo } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
} from 'lucide-react'
import {
  CalendarEvent,
  getEventTypeColor,
  formatTime,
} from '@/services/calendarService'
import { cn } from '@/lib/utils'

interface CalendarViewProps {
  events: CalendarEvent[]
  selectedDate: Date
  onDateSelect: (date: Date) => void
  onEventClick: (event: CalendarEvent) => void
  onCreateEvent: (date?: string) => void
  isLoading?: boolean
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export const CalendarView: React.FC<CalendarViewProps> = ({
  events,
  selectedDate,
  onDateSelect,
  onEventClick,
  onCreateEvent,
  isLoading,
}) => {
  const [currentMonth, setCurrentMonth] = useState(
    new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
  )

  // Get calendar days for the current month
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()

    // First day of the month
    const firstDay = new Date(year, month, 1)

    // Days from previous month to show
    const daysFromPrevMonth = firstDay.getDay()
    // Days from next month to show
    const totalDays = 42 // 6 weeks * 7 days

    const days: {
      date: Date
      isCurrentMonth: boolean
      isToday: boolean
      isSelected: boolean
      events: CalendarEvent[]
    }[] = []

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Add days
    for (let i = 0; i < totalDays; i++) {
      const date = new Date(year, month, 1 - daysFromPrevMonth + i)
      const dateStr = date.toISOString().split('T')[0]

      days.push({
        date,
        isCurrentMonth: date.getMonth() === month,
        isToday: date.getTime() === today.getTime(),
        isSelected: date.toDateString() === selectedDate.toDateString(),
        events: events.filter((e) => e.date === dateStr),
      })
    }

    return days
  }, [currentMonth, events, selectedDate])

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
  }

  const goToToday = () => {
    const today = new Date()
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1))
    onDateSelect(today)
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </h2>
          <div className="flex items-center gap-1">
            <button
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              onClick={goToPreviousMonth}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              className="px-3 py-1.5 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              onClick={goToToday}
            >
              Today
            </button>
            <button
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              onClick={goToNextMonth}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <button
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          onClick={() => onCreateEvent()}
        >
          <Plus className="w-4 h-4" />
          New Event
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 p-4">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 mb-2">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="py-2 text-center text-sm font-medium text-gray-500 dark:text-gray-400"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          {calendarDays.map((day, index) => (
            <div
              key={index}
              className={cn(
                'min-h-[100px] p-2 bg-white dark:bg-gray-900 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors',
                !day.isCurrentMonth && 'bg-gray-50 dark:bg-gray-800/30'
              )}
              onClick={() => onDateSelect(day.date)}
            >
              {/* Date Number */}
              <div
                className={cn(
                  'w-7 h-7 flex items-center justify-center rounded-full text-sm mb-1',
                  day.isToday && 'bg-blue-500 text-white font-semibold',
                  day.isSelected && !day.isToday && 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 font-semibold',
                  !day.isCurrentMonth && 'text-gray-400 dark:text-gray-600'
                )}
              >
                {day.date.getDate()}
              </div>

              {/* Events */}
              <div className="space-y-1 overflow-hidden">
                {day.events.slice(0, 3).map((event) => (
                  <div
                    key={event.id}
                    className="px-1.5 py-0.5 text-xs rounded truncate cursor-pointer hover:opacity-80"
                    style={{
                      backgroundColor: event.color || getEventTypeColor(event.type) + '20',
                      color: event.color || getEventTypeColor(event.type),
                      borderLeft: `2px solid ${event.color || getEventTypeColor(event.type)}`,
                    }}
                    onClick={(e) => {
                      e.stopPropagation()
                      onEventClick(event)
                    }}
                  >
                    {formatTime(event.startTime)} {event.title}
                  </div>
                ))}
                {day.events.length > 3 && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 px-1.5">
                    +{day.events.length - 3} more
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default CalendarView
