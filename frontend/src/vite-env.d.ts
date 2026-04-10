/// <reference types="vite/client" />

/**
 * Type definitions for Vite environment variables
 * All environment variables must be prefixed with VITE_ to be exposed to the client
 */
interface ImportMetaEnv {
  // API Configuration
  readonly VITE_API_URL: string
  readonly VITE_WS_URL: string

  // Application Configuration
  readonly VITE_APP_ENV: 'development' | 'staging' | 'production'
  readonly VITE_APP_URL: string

  // Feature Flags
  readonly VITE_ENABLE_ANALYTICS: string
  readonly VITE_ENABLE_ERROR_TRACKING: string
  readonly VITE_ENABLE_DEBUG_MODE: string

  // Authentication Configuration
  readonly VITE_GITHUB_CLIENT_ID?: string
  readonly VITE_GOOGLE_CLIENT_ID?: string
  readonly VITE_NEXTAUTH_URL?: string
  readonly VITE_NEXTAUTH_SECRET?: string

  // Payment Configuration
  readonly VITE_STRIPE_PUBLISHABLE_KEY?: string

  // AI/ML Configuration (Optional)
  readonly VITE_OPENAI_API_KEY?: string

  // Storage Configuration (Optional)
  readonly VITE_AWS_REGION?: string
  readonly VITE_AWS_BUCKET?: string
  readonly VITE_GCS_BUCKET?: string

  // Analytics & Monitoring (Optional)
  readonly VITE_GA_TRACKING_ID?: string
  readonly VITE_SENTRY_DSN?: string

  // Misc Configuration
  readonly VITE_MAX_FILE_SIZE?: string
  readonly VITE_API_TIMEOUT?: string
  readonly VITE_LOG_API_REQUESTS?: string
  readonly VITE_DEFAULT_LOCALE?: string
  readonly VITE_SUPPORTED_LOCALES?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}