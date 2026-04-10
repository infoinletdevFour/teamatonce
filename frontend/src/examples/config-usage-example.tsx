/**
 * Configuration Usage Examples
 *
 * This file demonstrates how to use the application configuration,
 * API client, and WebSocket client in React components.
 */

import { useEffect, useState } from 'react'
import { appConfig, isDevelopment, debugLog } from '@/config/app-config'
import { get, post, setAuthToken } from '@/lib/api-client'
import { socketClient } from '@/lib/websocket-client'

/**
 * Example 1: Accessing Configuration Values
 */
export function ConfigExample() {
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Application Configuration</h2>

      <div className="space-y-2">
        <p><strong>Environment:</strong> {appConfig.app.env}</p>
        <p><strong>API URL:</strong> {appConfig.api.baseUrl}</p>
        <p><strong>WebSocket URL:</strong> {appConfig.websocket.url}</p>
        <p><strong>App Version:</strong> {appConfig.app.version}</p>

        {isDevelopment && (
          <div className="mt-4 p-2 bg-yellow-100 rounded">
            <p className="text-sm text-yellow-800">
              Running in development mode - Debug logging is enabled
            </p>
          </div>
        )}

        {appConfig.features.analytics && (
          <p className="text-green-600">Analytics: Enabled</p>
        )}

        {appConfig.payment.stripe.enabled && (
          <p className="text-green-600">Stripe: Configured</p>
        )}
      </div>
    </div>
  )
}

/**
 * Example 2: Using the API Client
 */
interface Project {
  id: string
  name: string
  status: string
  createdAt: string
}

export function ApiClientExample() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch projects
  const fetchProjects = async () => {
    try {
      setLoading(true)
      setError(null)

      // Using the typed get helper
      const response = await get<Project[]>('/projects')
      setProjects(response.data)

      debugLog('Projects fetched:', response.data)
    } catch (err: any) {
      setError(err.message || 'Failed to fetch projects')
      console.error('Error fetching projects:', err)
    } finally {
      setLoading(false)
    }
  }

  // Create a new project
  const createProject = async () => {
    try {
      const newProject = {
        name: 'My New Project',
        description: 'Project created via API',
      }

      const response = await post<Project>('/projects', newProject)

      debugLog('Project created:', response.data)

      // Add to list
      setProjects(prev => [...prev, response.data])
    } catch (err: any) {
      setError(err.message || 'Failed to create project')
      console.error('Error creating project:', err)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">API Client Example</h2>

      {loading && <p>Loading projects...</p>}

      {error && (
        <div className="p-2 bg-red-100 text-red-700 rounded mb-4">
          {error}
        </div>
      )}

      <div className="mb-4">
        <button
          onClick={createProject}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Create New Project
        </button>
      </div>

      <div className="space-y-2">
        {projects.map(project => (
          <div key={project.id} className="p-3 border rounded">
            <h3 className="font-semibold">{project.name}</h3>
            <p className="text-sm text-gray-600">Status: {project.status}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Example 3: Using the WebSocket Client
 */
interface Message {
  id: string
  userId: string
  message: string
  timestamp: string
}

export function WebSocketExample() {
  const [connected, setConnected] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const roomId = 'project-123'

  useEffect(() => {
    // Connect to WebSocket
    socketClient.connect()
    setConnected(socketClient.isConnected())

    // Join room
    socketClient.joinRoom(roomId)

    // Listen for connection status
    socketClient.on('connect', () => {
      setConnected(true)
      debugLog('WebSocket connected')
    })

    socketClient.on('disconnect', () => {
      setConnected(false)
      debugLog('WebSocket disconnected')
    })

    // Listen for messages
    const handleMessage = (data: Message) => {
      debugLog('New message received:', data)
      setMessages(prev => [...prev, data])
    }
    socketClient.onMessage(handleMessage)

    // Listen for typing indicators
    socketClient.onTyping((data) => {
      debugLog('User typing:', data)
      // Update UI to show typing indicator
    })

    // Cleanup on unmount
    return () => {
      socketClient.leaveRoom(roomId)
      socketClient.off('receive:message', handleMessage)
      socketClient.disconnect()
    }
  }, [roomId])

  const sendMessage = () => {
    if (!inputMessage.trim()) return

    socketClient.sendMessage(roomId, inputMessage)
    setInputMessage('')
  }

  const handleTyping = (isTyping: boolean) => {
    socketClient.sendTyping(roomId, isTyping)
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">WebSocket Example</h2>

      <div className="mb-4">
        <span className={`inline-block px-2 py-1 rounded text-sm ${
          connected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {connected ? 'Connected' : 'Disconnected'}
        </span>
      </div>

      <div className="mb-4 space-y-2 h-64 overflow-y-auto border rounded p-3">
        {messages.length === 0 ? (
          <p className="text-gray-500">No messages yet</p>
        ) : (
          messages.map(msg => (
            <div key={msg.id} className="p-2 bg-gray-50 rounded">
              <p className="text-sm text-gray-600">{msg.userId}</p>
              <p>{msg.message}</p>
              <p className="text-xs text-gray-400">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </p>
            </div>
          ))
        )}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onFocus={() => handleTyping(true)}
          onBlur={() => handleTyping(false)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type a message..."
          className="flex-1 px-3 py-2 border rounded"
          disabled={!connected}
        />
        <button
          onClick={sendMessage}
          disabled={!connected || !inputMessage.trim()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
        >
          Send
        </button>
      </div>
    </div>
  )
}

/**
 * Example 4: Authentication Flow
 */
export function AuthExample() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const login = async (email: string, password: string) => {
    try {
      // Call login API
      const response = await post<{ token: string }>('/auth/login', {
        email,
        password,
      })

      // Save token
      const { token } = response.data
      setAuthToken(token)
      setIsAuthenticated(true)

      debugLog('Login successful')

      // Connect to WebSocket with authenticated token
      socketClient.connect()
    } catch (err) {
      console.error('Login failed:', err)
    }
  }

  const logout = () => {
    // Clear token
    setAuthToken(null)
    setIsAuthenticated(false)

    // Disconnect WebSocket
    socketClient.disconnect()

    debugLog('Logged out')
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Authentication Example</h2>

      {isAuthenticated ? (
        <div>
          <p className="mb-4 text-green-600">You are logged in</p>
          <button
            onClick={logout}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      ) : (
        <div>
          <p className="mb-4 text-gray-600">You are not logged in</p>
          <button
            onClick={() => login('user@example.com', 'password')}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Login
          </button>
        </div>
      )}
    </div>
  )
}

/**
 * Example 5: Feature Flags
 */
export function FeatureFlagsExample() {
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Feature Flags Example</h2>

      <div className="space-y-3">
        {/* Conditionally render based on feature flags */}
        {appConfig.features.analytics && (
          <div className="p-3 bg-blue-50 rounded">
            <h3 className="font-semibold">Analytics Enabled</h3>
            <p className="text-sm">Google Analytics is tracking page views</p>
          </div>
        )}

        {appConfig.features.errorTracking && (
          <div className="p-3 bg-purple-50 rounded">
            <h3 className="font-semibold">Error Tracking Enabled</h3>
            <p className="text-sm">Sentry is capturing errors</p>
          </div>
        )}

        {appConfig.features.debugMode && (
          <div className="p-3 bg-yellow-50 rounded">
            <h3 className="font-semibold">Debug Mode Enabled</h3>
            <p className="text-sm">Detailed logging is active</p>
          </div>
        )}

        {/* OAuth providers */}
        <div className="mt-4">
          <h3 className="font-semibold mb-2">Available OAuth Providers:</h3>
          <div className="space-y-2">
            {appConfig.auth.github.enabled && (
              <button className="w-full px-4 py-2 bg-gray-800 text-white rounded">
                Login with GitHub
              </button>
            )}
            {appConfig.auth.google.enabled && (
              <button className="w-full px-4 py-2 bg-red-500 text-white rounded">
                Login with Google
              </button>
            )}
          </div>
        </div>

        {/* Payment methods */}
        {appConfig.payment.stripe.enabled && (
          <div className="mt-4 p-3 bg-green-50 rounded">
            <h3 className="font-semibold">Payment Processing Available</h3>
            <p className="text-sm">Stripe payments are configured</p>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Combined Example Component
 */
export function AllExamples() {
  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">
        Team@Once Configuration Examples
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ConfigExample />
        <FeatureFlagsExample />
        <ApiClientExample />
        <WebSocketExample />
        <AuthExample />
      </div>
    </div>
  )
}
