/**
 * WebSocket Client for Team@Once
 *
 * Real-time communication using Socket.io
 * Handles connection, reconnection, and event management
 *
 * Usage:
 *   import { socketClient } from '@/lib/websocket-client'
 *   socketClient.connect()
 *   socketClient.on('message', (data) => console.log(data))
 */

import io from 'socket.io-client'
import { appConfig, debugLog } from '@/config/app-config'
import { getAuthToken } from './api-client'

type Socket = ReturnType<typeof io>

class WebSocketClient {
  private socket: Socket | null = null
  private reconnectAttempts = 0
  private userId: string | null = null

  /**
   * Connect to WebSocket server
   * @param userId - Optional user ID to join user-specific room
   * @param projectId - Optional project ID to join project room
   * @param teamMemberId - Optional team member ID for status tracking
   */
  connect(userId?: string, projectId?: string, teamMemberId?: string): void {
    if (this.socket?.connected) {
      debugLog('WebSocket already connected')
      // If already connected but projectId provided, join the project room
      if (projectId) {
        this.joinProject(projectId, userId, teamMemberId)
      }
      return
    }

    const token = getAuthToken()

    // Store userId for later use
    if (userId) {
      this.userId = userId
    }

    // Connect to the /teamatonce namespace
    const wsUrl = `${appConfig.websocket.url}/teamatonce`

    this.socket = io(wsUrl, {
      auth: {
        token,
      },
      query: {
        userId: userId || undefined,
        projectId: projectId || undefined,
        teamMemberId: teamMemberId || undefined,
      },
      path: '/socket.io/',
      transports: ['websocket', 'polling'],
      reconnection: appConfig.websocket.autoReconnect,
      reconnectionDelay: appConfig.websocket.reconnectionDelay,
      reconnectionAttempts: appConfig.websocket.maxReconnectionAttempts,
    })

    this.setupEventHandlers()
  }

  /**
   * Get the current user ID
   */
  getUserId(): string | null {
    return this.userId
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.socket) {
      debugLog('Disconnecting WebSocket')
      this.socket.disconnect()
      this.socket = null
      this.reconnectAttempts = 0
    }
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return this.socket?.connected ?? false
  }

  /**
   * Emit an event to the server
   */
  emit(event: string, data?: any): void {
    if (!this.socket?.connected) {
      debugLog('WebSocket not connected. Cannot emit event:', event)
      return
    }

    debugLog('Emitting WebSocket event:', event, data)
    this.socket.emit(event, data)
  }

  /**
   * Listen to an event from the server
   */
  on(event: string, callback: (data: any) => void): void {
    if (!this.socket) {
      debugLog('WebSocket not initialized. Cannot listen to event:', event)
      return
    }

    debugLog('Listening to WebSocket event:', event)
    this.socket.on(event, callback)
  }

  /**
   * Remove event listener
   */
  off(event: string, callback?: (data: any) => void): void {
    if (!this.socket) {
      return
    }

    debugLog('Removing WebSocket event listener:', event)
    this.socket.off(event, callback)
  }

  /**
   * Setup default event handlers
   */
  private setupEventHandlers(): void {
    if (!this.socket) return

    // Connection successful
    this.socket.on('connect', () => {
      debugLog('WebSocket connected', this.socket?.id)
      this.reconnectAttempts = 0
    })

    // Connection error
    this.socket.on('connect_error', (error: Error) => {
      debugLog('WebSocket connection error:', error.message)
      this.reconnectAttempts++

      if (this.reconnectAttempts >= appConfig.websocket.maxReconnectionAttempts) {
        debugLog('Max reconnection attempts reached. Giving up.')
        this.disconnect()
      }
    })

    // Disconnected
    this.socket.on('disconnect', (reason: string) => {
      debugLog('WebSocket disconnected:', reason)

      if (reason === 'io server disconnect') {
        // Server disconnected the socket, need to manually reconnect
        this.socket?.connect()
      }
    })

    // Reconnection attempt
    this.socket.on('reconnect_attempt', (attempt: number) => {
      debugLog(`WebSocket reconnection attempt ${attempt}`)
    })

    // Reconnection successful
    this.socket.on('reconnect', (attempt: number) => {
      debugLog(`WebSocket reconnected after ${attempt} attempts`)
      this.reconnectAttempts = 0
    })

    // Reconnection failed
    this.socket.on('reconnect_failed', () => {
      debugLog('WebSocket reconnection failed')
    })
  }

  /**
   * Join a room
   */
  joinRoom(roomId: string): void {
    // Backend expects 'join-room' event with room ID as string
    this.emit('join-room', roomId)
  }

  /**
   * Join a project room for real-time updates
   */
  joinProject(projectId: string, userId?: string, teamMemberId?: string): void {
    if (!this.socket?.connected) {
      debugLog('WebSocket not connected. Cannot join project:', projectId)
      return
    }

    debugLog('Joining project room:', projectId)
    this.emit('join-project', {
      projectId,
      userId: userId || this.userId,
      teamMemberId,
    })
  }

  /**
   * Leave a project room
   */
  leaveProject(projectId: string): void {
    if (!this.socket?.connected) {
      return
    }

    debugLog('Leaving project room:', projectId)
    this.emit('leave-project', { projectId })
  }

  /**
   * Leave a room
   */
  leaveRoom(roomId: string): void {
    // Backend expects 'leave-room' event with room ID as string
    this.emit('leave-room', roomId)
  }

  /**
   * Send a message
   */
  sendMessage(roomId: string, message: string, metadata?: any): void {
    this.emit('send:message', {
      roomId,
      message,
      metadata,
      timestamp: new Date().toISOString(),
    })
  }

  /**
   * Listen for messages
   */
  onMessage(callback: (data: any) => void): void {
    // Listen for both old and new event names for compatibility
    this.on('receive:message', (data) => {
      debugLog('Received receive:message event:', data)
      callback(data)
    })
    this.on('new-message', (data) => {
      debugLog('Received new-message event:', data)
      callback(data)
    })
  }

  /**
   * Listen for message updates (edits)
   */
  onMessageUpdate(callback: (data: any) => void): void {
    this.on('message-updated', (data) => {
      debugLog('Received message-updated event:', data)
      callback(data)
    })
  }

  /**
   * Listen for message deletions
   */
  onMessageDelete(callback: (data: any) => void): void {
    this.on('message-deleted', (data) => {
      debugLog('Received message-deleted event:', data)
      callback(data)
    })
  }

  /**
   * Listen for typing indicators
   */
  onTyping(callback: (data: { userId: string; isTyping: boolean }) => void): void {
    this.on('user:typing', callback)
  }

  /**
   * Send typing indicator
   */
  sendTyping(roomId: string, isTyping: boolean): void {
    this.emit('typing', { roomId, isTyping })
  }

  /**
   * Listen for user status changes
   */
  onUserStatus(callback: (data: { userId: string; status: 'online' | 'offline' }) => void): void {
    this.on('user:status', callback)
  }

  /**
   * Listen for project updates
   */
  onProjectUpdate(callback: (data: any) => void): void {
    this.on('project:update', callback)
  }

  /**
   * Listen for milestone updates
   */
  onMilestoneUpdate(callback: (data: any) => void): void {
    this.on('milestone:update', callback)
  }

  /**
   * Listen for payment notifications
   */
  onPaymentNotification(callback: (data: any) => void): void {
    this.on('payment:notification', callback)
  }

  /**
   * Listen for new notifications
   */
  onNotification(callback: (data: any) => void): void {
    this.on('notification', (data) => {
      debugLog('Received notification event:', data)
      callback(data)
    })
    this.on('notification:event', (data) => {
      debugLog('Received notification:event:', data)
      callback(data)
    })
  }

  /**
   * Listen for notification read events
   */
  onNotificationRead(callback: (data: { notification_id: string }) => void): void {
    this.on('notification_read', (data) => {
      debugLog('Received notification_read event:', data)
      callback(data)
    })
  }

  /**
   * Listen for notification deleted events
   */
  onNotificationDeleted(callback: (data: { notification_id: string }) => void): void {
    this.on('notification_deleted', (data) => {
      debugLog('Received notification_deleted event:', data)
      callback(data)
    })
  }

  /**
   * Listen for calendar event created
   */
  onCalendarEventCreated(callback: (data: { event: any; createdBy: string; timestamp: string }) => void): void {
    this.on('calendar-event-created', (data) => {
      debugLog('Received calendar-event-created event:', data)
      callback(data)
    })
  }

  /**
   * Listen for calendar event updated
   */
  onCalendarEventUpdated(callback: (data: { event: any; updatedBy: string; timestamp: string }) => void): void {
    this.on('calendar-event-updated', (data) => {
      debugLog('Received calendar-event-updated event:', data)
      callback(data)
    })
  }

  /**
   * Listen for calendar event deleted
   */
  onCalendarEventDeleted(callback: (data: { eventId: string; deletedBy: string; timestamp: string }) => void): void {
    this.on('calendar-event-deleted', (data) => {
      debugLog('Received calendar-event-deleted event:', data)
      callback(data)
    })
  }

  /**
   * Listen for calendar event cancelled
   */
  onCalendarEventCancelled(callback: (data: { event: any; cancelledBy: string; timestamp: string }) => void): void {
    this.on('calendar-event-cancelled', (data) => {
      debugLog('Received calendar-event-cancelled event:', data)
      callback(data)
    })
  }

  /**
   * Listen for calendar event reminder
   */
  onCalendarEventReminder(callback: (data: { event: any; title: string; message: string; timestamp: string }) => void): void {
    this.on('calendar-event-reminder', (data) => {
      debugLog('Received calendar-event-reminder event:', data)
      callback(data)
    })
  }

  /**
   * Remove calendar event listeners
   */
  offCalendarEvents(): void {
    this.off('calendar-event-created')
    this.off('calendar-event-updated')
    this.off('calendar-event-deleted')
    this.off('calendar-event-cancelled')
    this.off('calendar-event-reminder')
  }

  // ============================================
  // MILESTONE EVENTS
  // ============================================

  /**
   * Listen for milestone created events
   */
  onMilestoneCreated(callback: (data: { milestone: any; userId: string; timestamp: string }) => void): void {
    this.on('milestone-created', (data) => {
      debugLog('Received milestone-created event:', data)
      callback(data)
    })
  }

  /**
   * Listen for milestone updated events
   */
  onMilestoneUpdated(callback: (data: { milestone: any; userId: string; timestamp: string }) => void): void {
    this.on('milestone-updated', (data) => {
      debugLog('Received milestone-updated event:', data)
      callback(data)
    })
  }

  /**
   * Listen for milestone deleted events
   */
  onMilestoneDeleted(callback: (data: { milestoneId: string; userId: string; timestamp: string }) => void): void {
    this.on('milestone-deleted', (data) => {
      debugLog('Received milestone-deleted event:', data)
      callback(data)
    })
  }

  /**
   * Listen for milestone submitted events
   */
  onMilestoneSubmitted(callback: (data: { milestone: any; userId: string; timestamp: string }) => void): void {
    this.on('milestone-submitted', (data) => {
      debugLog('Received milestone-submitted event:', data)
      callback(data)
    })
  }

  /**
   * Listen for milestone approved events
   */
  onMilestoneApproved(callback: (data: { milestone: any; userId: string; timestamp: string }) => void): void {
    this.on('milestone-approved', (data) => {
      debugLog('Received milestone-approved event:', data)
      callback(data)
    })
  }

  /**
   * Listen for milestone feedback required events
   */
  onMilestoneFeedbackRequired(callback: (data: { milestone: any; userId: string; timestamp: string }) => void): void {
    this.on('milestone-feedback-required', (data) => {
      debugLog('Received milestone-feedback-required event:', data)
      callback(data)
    })
  }

  /**
   * Remove milestone event listeners
   */
  offMilestoneEvents(): void {
    this.off('milestone-created')
    this.off('milestone-updated')
    this.off('milestone-deleted')
    this.off('milestone-submitted')
    this.off('milestone-approved')
    this.off('milestone-feedback-required')
  }

  // ============================================
  // MILESTONE PLAN EVENTS (Professional Workflow)
  // ============================================

  /**
   * Listen for milestone plan created events
   */
  onMilestonePlanCreated(callback: (data: { plan: any; userId: string; timestamp: string }) => void): void {
    this.on('milestone-plan-created', (data) => {
      debugLog('Received milestone-plan-created event:', data)
      callback(data)
    })
  }

  /**
   * Listen for milestone plan updated events
   */
  onMilestonePlanUpdated(callback: (data: { plan: any; userId: string; timestamp: string }) => void): void {
    this.on('milestone-plan-updated', (data) => {
      debugLog('Received milestone-plan-updated event:', data)
      callback(data)
    })
  }

  /**
   * Listen for milestone plan submitted events
   */
  onMilestonePlanSubmitted(callback: (data: { plan: any; userId: string; timestamp: string }) => void): void {
    this.on('milestone-plan-submitted', (data) => {
      debugLog('Received milestone-plan-submitted event:', data)
      callback(data)
    })
  }

  /**
   * Listen for milestone plan approved events
   */
  onMilestonePlanApproved(callback: (data: { plan: any; userId: string; timestamp: string }) => void): void {
    this.on('milestone-plan-approved', (data) => {
      debugLog('Received milestone-plan-approved event:', data)
      callback(data)
    })
  }

  /**
   * Listen for milestone plan changes requested events
   */
  onMilestonePlanChangesRequested(callback: (data: { plan: any; userId: string; timestamp: string }) => void): void {
    this.on('milestone-plan-changes-requested', (data) => {
      debugLog('Received milestone-plan-changes-requested event:', data)
      callback(data)
    })
  }

  /**
   * Listen for milestone plan rejected events
   */
  onMilestonePlanRejected(callback: (data: { plan: any; userId: string; timestamp: string }) => void): void {
    this.on('milestone-plan-rejected', (data) => {
      debugLog('Received milestone-plan-rejected event:', data)
      callback(data)
    })
  }

  /**
   * Remove milestone plan event listeners
   */
  offMilestonePlanEvents(): void {
    this.off('milestone-plan-created')
    this.off('milestone-plan-updated')
    this.off('milestone-plan-submitted')
    this.off('milestone-plan-approved')
    this.off('milestone-plan-changes-requested')
    this.off('milestone-plan-rejected')
  }

  // ============================================
  // TASK EVENTS
  // ============================================

  /**
   * Listen for task created events
   */
  onTaskCreated(callback: (data: { task: any; userId: string; timestamp: string }) => void): void {
    this.on('task-created', (data) => {
      debugLog('Received task-created event:', data)
      callback(data)
    })
  }

  /**
   * Listen for task updated events
   */
  onTaskUpdated(callback: (data: { task: any; userId: string; timestamp: string }) => void): void {
    this.on('task-updated', (data) => {
      debugLog('Received task-updated event:', data)
      callback(data)
    })
  }

  /**
   * Listen for task deleted events
   */
  onTaskDeleted(callback: (data: { taskId: string; milestoneId: string | null; userId: string; timestamp: string }) => void): void {
    this.on('task-deleted', (data) => {
      debugLog('Received task-deleted event:', data)
      callback(data)
    })
  }

  /**
   * Listen for task assigned events
   */
  onTaskAssigned(callback: (data: { task: any; assignedBy: string; assignedTo: string; timestamp: string }) => void): void {
    this.on('task-assigned', (data) => {
      debugLog('Received task-assigned event:', data)
      callback(data)
    })
  }

  /**
   * Remove task event listeners
   */
  offTaskEvents(): void {
    this.off('task-created')
    this.off('task-updated')
    this.off('task-deleted')
    this.off('task-assigned')
  }

  // ============================================
  // PAYMENT/ESCROW EVENTS
  // ============================================

  /**
   * Listen for payment funded events (milestone funded in escrow)
   */
  onPaymentFunded(callback: (data: { payment: any; milestone: any; milestoneId: string; amount: number; escrowStatus: string; userId: string; timestamp: string }) => void): void {
    this.on('payment-funded', (data) => {
      debugLog('Received payment-funded event:', data)
      callback(data)
    })
  }

  /**
   * Listen for payment released events (milestone approved, payment released)
   */
  onPaymentReleased(callback: (data: { payment: any; milestone: any; milestoneId: string; amount: number; escrowStatus: string; isAutoApproved: boolean; userId: string; timestamp: string }) => void): void {
    this.on('payment-released', (data) => {
      debugLog('Received payment-released event:', data)
      callback(data)
    })
  }

  /**
   * Listen for deliverable submitted events
   */
  onDeliverableSubmitted(callback: (data: { payment: any; deliverable: any; milestone: any; milestoneId: string; autoApproveDate: string; escrowStatus: string; userId: string; timestamp: string }) => void): void {
    this.on('deliverable-submitted', (data) => {
      debugLog('Received deliverable-submitted event:', data)
      callback(data)
    })
  }

  /**
   * Listen for changes requested events
   */
  onChangesRequested(callback: (data: { payment: any; deliverable: any; milestone: any; milestoneId: string; changeNotes: string; newDeadline: string; extendedDays: number; escrowStatus: string; userId: string; timestamp: string }) => void): void {
    this.on('changes-requested', (data) => {
      debugLog('Received changes-requested event:', data)
      callback(data)
    })
  }

  /**
   * Listen for payment refunded events
   */
  onPaymentRefunded(callback: (data: { payment: any; milestone: any; milestoneId: string; amount: number; reason: string; escrowStatus: string; userId: string; timestamp: string }) => void): void {
    this.on('payment-refunded', (data) => {
      debugLog('Received payment-refunded event:', data)
      callback(data)
    })
  }

  /**
   * Listen for general payment updated events
   */
  onPaymentUpdated(callback: (data: { payment: any; milestone: any; milestoneId: string; escrowStatus: string; userId: string; timestamp: string }) => void): void {
    this.on('payment-updated', (data) => {
      debugLog('Received payment-updated event:', data)
      callback(data)
    })
  }

  /**
   * Remove payment event listeners
   */
  offPaymentEvents(): void {
    this.off('payment-funded')
    this.off('payment-released')
    this.off('deliverable-submitted')
    this.off('changes-requested')
    this.off('payment-refunded')
    this.off('payment-updated')
  }

  /**
   * Get socket instance (for advanced usage)
   */
  getSocket(): Socket | null {
    return this.socket
  }
}

// Create singleton instance
export const socketClient = new WebSocketClient()

// Export class for testing or creating multiple instances
export default WebSocketClient
