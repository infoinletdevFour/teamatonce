# Team@Once Frontend Configuration Guide

This guide explains how to configure the Team@Once frontend application for different environments.

## Table of Contents

- [Quick Start](#quick-start)
- [Environment Files](#environment-files)
- [Environment Variables](#environment-variables)
- [Configuration Usage](#configuration-usage)
- [API Client](#api-client)
- [WebSocket Client](#websocket-client)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

---

## Quick Start

### 1. Copy Environment Template

For **local development**:
```bash
cp .env.example .env.local
```

For **production**:
```bash
cp .env.example .env.production
```

### 2. Update Environment Variables

Edit your `.env.local` or `.env.production` file with your actual values:

```env
VITE_API_URL=http://localhost:3001/api/v1
VITE_WS_URL=http://localhost:3001
VITE_APP_ENV=development
```

### 3. Start the Application

```bash
npm run dev        # Development mode
npm run build      # Production build
npm run preview    # Preview production build
```

---

## Environment Files

The frontend uses **Vite** for bundling, which requires all client-side environment variables to be prefixed with `VITE_`.

### File Structure

```
frontend/
├── .env.local              # Local development (gitignored)
├── .env.production         # Production (gitignored)
├── .env.example            # Template (committed to git)
└── src/
    ├── config/
    │   └── app-config.ts   # Centralized config management
    ├── lib/
    │   ├── api-client.ts   # HTTP client with config
    │   └── websocket-client.ts  # WebSocket client
    └── vite-env.d.ts       # TypeScript definitions
```

### Environment File Priority

Vite loads environment files in this order (highest priority first):

1. `.env.local` - Local overrides (never committed)
2. `.env.[mode].local` - Mode-specific local overrides
3. `.env.[mode]` - Mode-specific (e.g., `.env.production`)
4. `.env` - Base environment file

**Note**: `.env.local` is **always** loaded, except in `test` mode.

---

## Environment Variables

### Required Variables

These variables **must** be set for the application to work:

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | `http://localhost:3001/api/v1` |
| `VITE_WS_URL` | WebSocket server URL | `http://localhost:3001` |
| `VITE_APP_ENV` | Application environment | `development`, `staging`, `production` |
| `VITE_APP_URL` | Frontend application URL | `http://localhost:5175` |

### Optional Variables

#### Feature Flags
- `VITE_ENABLE_ANALYTICS` - Enable Google Analytics (default: `false`)
- `VITE_ENABLE_ERROR_TRACKING` - Enable Sentry error tracking (default: `false`)
- `VITE_ENABLE_DEBUG_MODE` - Enable debug logging (default: `false`)

#### Authentication
- `VITE_GITHUB_CLIENT_ID` - GitHub OAuth client ID
- `VITE_GOOGLE_CLIENT_ID` - Google OAuth client ID
- `VITE_NEXTAUTH_URL` - NextAuth URL
- `VITE_NEXTAUTH_SECRET` - NextAuth secret key

#### Payment
- `VITE_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key (pk_test_... or pk_live_...)

#### Storage
- `VITE_AWS_REGION` - AWS S3 region
- `VITE_AWS_BUCKET` - AWS S3 bucket name
- `VITE_GCS_BUCKET` - Google Cloud Storage bucket name

#### Analytics & Monitoring
- `VITE_GA_TRACKING_ID` - Google Analytics tracking ID
- `VITE_SENTRY_DSN` - Sentry DSN for error tracking

#### Miscellaneous
- `VITE_MAX_FILE_SIZE` - Maximum file upload size in MB (default: `10`)
- `VITE_API_TIMEOUT` - API request timeout in milliseconds (default: `30000`)
- `VITE_LOG_API_REQUESTS` - Enable API request logging (default: `true` in dev)
- `VITE_DEFAULT_LOCALE` - Default language (default: `en`)
- `VITE_SUPPORTED_LOCALES` - Comma-separated list of supported locales

---

## Configuration Usage

### Importing Configuration

```typescript
import { appConfig } from '@/config/app-config'

// Access configuration values
const apiUrl = appConfig.api.baseUrl
const wsUrl = appConfig.websocket.url
const isDev = appConfig.app.env === 'development'
```

### Environment Helpers

```typescript
import { isDevelopment, isProduction, debugLog } from '@/config/app-config'

if (isDevelopment) {
  debugLog('Running in development mode')
}

if (isProduction) {
  console.log('Running in production mode')
}
```

### Validating Configuration

Call this in your application entry point to ensure all required variables are set:

```typescript
import { validateConfig } from '@/config/app-config'

const validation = validateConfig()
if (!validation.valid) {
  console.error('Configuration errors:', validation.errors)
  // Handle errors (e.g., show error page)
}
```

### Configuration Object Structure

```typescript
appConfig = {
  api: {
    baseUrl: string
    timeout: number
    enableLogging: boolean
  },
  websocket: {
    url: string
    autoReconnect: boolean
    reconnectionDelay: number
    maxReconnectionAttempts: number
  },
  app: {
    env: 'development' | 'staging' | 'production'
    url: string
    name: string
    version: string
  },
  features: {
    analytics: boolean
    errorTracking: boolean
    debugMode: boolean
  },
  auth: {
    github: { clientId: string, enabled: boolean }
    google: { clientId: string, enabled: boolean }
    nextAuth: { url: string, secret: string }
  },
  payment: {
    stripe: { publishableKey: string, enabled: boolean }
  },
  storage: {
    aws: { region: string, bucket: string, enabled: boolean }
    gcs: { bucket: string, enabled: boolean }
    maxFileSize: number // in bytes
  },
  analytics: {
    googleAnalytics: { trackingId: string, enabled: boolean }
    sentry: { dsn: string, enabled: boolean, environment: string }
  },
  i18n: {
    defaultLocale: string
    supportedLocales: string[]
  }
}
```

---

## API Client

The API client is pre-configured with the environment settings.

### Basic Usage

```typescript
import { apiClient, get, post, put, del } from '@/lib/api-client'

// Using helper functions (recommended)
const projects = await get('/projects')
const newProject = await post('/projects', { name: 'My Project' })
const updated = await put('/projects/123', { name: 'Updated' })
await del('/projects/123')

// Using axios instance directly
const response = await apiClient.get('/projects')
```

### With TypeScript Types

```typescript
interface Project {
  id: string
  name: string
  status: string
}

const projects = await get<Project[]>('/projects')
// projects is typed as ApiResponse<Project[]>
```

### Authentication

The API client automatically includes the authentication token from localStorage:

```typescript
import { setAuthToken, getAuthToken } from '@/lib/api-client'

// Set token (e.g., after login)
setAuthToken('your-jwt-token')

// Get current token
const token = getAuthToken()

// Clear token (e.g., on logout)
setAuthToken(null)
```

### Error Handling

The API client automatically handles common errors:

- **401 Unauthorized**: Clears token and redirects to login
- **403 Forbidden**: Logs permission error
- **404 Not Found**: Logs resource not found
- **500 Server Error**: Logs server error

You can also handle errors in your code:

```typescript
try {
  const data = await get('/projects/123')
} catch (error) {
  if (error.response?.status === 404) {
    console.error('Project not found')
  }
}
```

---

## WebSocket Client

The WebSocket client provides real-time communication capabilities.

### Basic Usage

```typescript
import { socketClient } from '@/lib/websocket-client'

// Connect to WebSocket server
socketClient.connect()

// Check connection status
if (socketClient.isConnected()) {
  console.log('Connected!')
}

// Disconnect
socketClient.disconnect()
```

### Listening to Events

```typescript
// Listen for messages
socketClient.onMessage((data) => {
  console.log('New message:', data)
})

// Listen for project updates
socketClient.onProjectUpdate((data) => {
  console.log('Project updated:', data)
})

// Listen for typing indicators
socketClient.onTyping((data) => {
  console.log(`User ${data.userId} is ${data.isTyping ? 'typing' : 'stopped typing'}`)
})

// Listen for user status changes
socketClient.onUserStatus((data) => {
  console.log(`User ${data.userId} is ${data.status}`)
})

// Listen for custom events
socketClient.on('custom:event', (data) => {
  console.log('Custom event:', data)
})
```

### Emitting Events

```typescript
// Join a room
socketClient.joinRoom('project-123')

// Send a message
socketClient.sendMessage('project-123', 'Hello team!')

// Send typing indicator
socketClient.sendTyping('project-123', true)

// Leave a room
socketClient.leaveRoom('project-123')

// Emit custom events
socketClient.emit('custom:event', { key: 'value' })
```

### React Integration

```typescript
import { useEffect } from 'react'
import { socketClient } from '@/lib/websocket-client'

function ChatComponent() {
  useEffect(() => {
    // Connect on mount
    socketClient.connect()

    // Listen for messages
    const handleMessage = (data) => {
      console.log('New message:', data)
    }
    socketClient.onMessage(handleMessage)

    // Cleanup on unmount
    return () => {
      socketClient.off('receive:message', handleMessage)
      socketClient.disconnect()
    }
  }, [])

  return <div>Chat Component</div>
}
```

---

## Best Practices

### 1. Never Commit Sensitive Data

- **Never** commit `.env.local` or `.env.production` files
- Only commit `.env.example` as a template
- Use strong, unique secrets for production

### 2. Use Type-Safe Configuration

Always import from `app-config.ts` instead of accessing `import.meta.env` directly:

```typescript
// ✅ Good - Type-safe and centralized
import { appConfig } from '@/config/app-config'
const apiUrl = appConfig.api.baseUrl

// ❌ Bad - No type safety, scattered throughout codebase
const apiUrl = import.meta.env.VITE_API_URL
```

### 3. Validate Configuration Early

Call `validateConfig()` in your application entry point:

```typescript
// src/main.tsx
import { validateConfig } from '@/config/app-config'

const validation = validateConfig()
if (!validation.valid) {
  console.error('Configuration errors:', validation.errors)
  // Show error UI instead of starting app
}
```

### 4. Use Debug Logging

Use `debugLog()` instead of `console.log()` for development logging:

```typescript
import { debugLog } from '@/config/app-config'

// Only logs in development or when debug mode is enabled
debugLog('User data:', userData)
```

### 5. Feature Flags

Use feature flags to enable/disable features:

```typescript
import { appConfig } from '@/config/app-config'

if (appConfig.features.analytics) {
  // Initialize Google Analytics
}

if (appConfig.features.errorTracking) {
  // Initialize Sentry
}
```

### 6. Environment-Specific Behavior

```typescript
import { isDevelopment, isProduction } from '@/config/app-config'

if (isDevelopment) {
  // Enable debugging features
  console.log('Debug mode enabled')
}

if (isProduction) {
  // Disable console logs
  console.log = () => {}
}
```

---

## Troubleshooting

### Environment Variables Not Loading

**Problem**: Changes to `.env.local` are not reflected in the application.

**Solution**:
1. Restart the Vite dev server (`npm run dev`)
2. Clear Vite cache: `rm -rf node_modules/.vite`
3. Ensure variables are prefixed with `VITE_`

### Type Errors with Environment Variables

**Problem**: TypeScript errors when accessing environment variables.

**Solution**:
1. Check `src/vite-env.d.ts` has the correct type definitions
2. Restart TypeScript server in your editor
3. Ensure you're using the correct variable names

### API Requests Failing

**Problem**: API requests return 404 or CORS errors.

**Solution**:
1. Verify `VITE_API_URL` is correct (should end with `/api/v1`)
2. Ensure backend is running on the correct port
3. Check backend CORS configuration includes frontend URL
4. Verify no trailing slashes in URLs

### WebSocket Connection Failing

**Problem**: WebSocket connection not establishing.

**Solution**:
1. Verify `VITE_WS_URL` is correct (should NOT include `/api/v1`)
2. Ensure WebSocket server is running
3. Check browser console for connection errors
4. Verify authentication token is valid

### Build Errors

**Problem**: Build fails with missing environment variables.

**Solution**:
1. Create `.env.production` with required variables
2. Run `npm run build:production` instead of `npm run build`
3. Check for typos in variable names

### Production Not Using Production Config

**Problem**: Production build uses development configuration.

**Solution**:
1. Set `VITE_APP_ENV=production` in `.env.production`
2. Use `npm run build:production` to build with production mode
3. Ensure you're deploying the correct `.env` file

---

## Generating Secrets

### NextAuth Secret

```bash
openssl rand -base64 32
```

### JWT Secret

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Additional Resources

- [Vite Environment Variables Documentation](https://vitejs.dev/guide/env-and-mode.html)
- [Socket.io Client Documentation](https://socket.io/docs/v4/client-api/)
- [Axios Documentation](https://axios-http.com/docs/intro)

---

**Need Help?** Contact the Team@Once development team or check the project documentation.
