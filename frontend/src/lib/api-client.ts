/**
 * API Client for Team@Once
 *
 * Centralized Axios instance with configuration from app-config
 * Provides type-safe API calls with automatic authentication and error handling
 *
 * Usage:
 *   import { apiClient } from '@/lib/api-client'
 *   const response = await apiClient.get('/projects')
 */

import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { appConfig, debugLog } from '@/config/app-config'

/**
 * API Client class with context management
 */
class ApiClientClass {
  private axiosInstance: AxiosInstance
  private companyId: string | null = null
  private projectId: string | null = null

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: appConfig.api.baseUrl,
      timeout: appConfig.api.timeout,
      // Don't set default Content-Type here - let interceptor handle it
      // This allows FormData uploads to work correctly with auto-generated boundary
    })

    this.setupInterceptors()
  }

  /**
   * Set company ID for multi-tenant context
   */
  setCompanyId(companyId: string | null) {
    this.companyId = companyId
  }

  /**
   * Get current company ID
   */
  getCompanyId(): string | null {
    return this.companyId
  }

  /**
   * Set project ID for multi-tenant context
   */
  setProjectId(projectId: string | null) {
    this.projectId = projectId
  }

  /**
   * Get current project ID
   */
  getProjectId(): string | null {
    return this.projectId
  }

  /**
   * Setup request/response interceptors
   */
  private setupInterceptors() {
    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      (config) => {
        // Get auth token from localStorage - use same key as api.ts
        const token = localStorage.getItem('accessToken')

        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }

        // Add multi-tenant headers
        if (this.companyId) {
          config.headers['x-company-id'] = this.companyId
        }
        if (this.projectId) {
          config.headers['x-project-id'] = this.projectId
        }

        // Set Content-Type only for non-FormData requests
        // FormData needs the browser to auto-set Content-Type with boundary
        const isFormData = config.data instanceof FormData
        if (!isFormData && !config.headers['Content-Type']) {
          config.headers['Content-Type'] = 'application/json'
        }

        // Ensure POST/PUT/PATCH requests have a body (empty object if none provided)
        // This prevents CORS issues with some servers
        if (['post', 'put', 'patch'].includes(config.method?.toLowerCase() || '')) {
          if (config.data === undefined || config.data === null) {
            config.data = {}
          }
        }

        // Log request in development
        if (appConfig.api.enableLogging) {
          debugLog('API Request:', {
            method: config.method?.toUpperCase(),
            url: config.url,
            baseURL: config.baseURL,
            params: config.params,
            data: config.data,
            headers: config.headers,
          })
        }

        return config
      },
      (error) => {
        debugLog('API Request Error:', error)
        return Promise.reject(error)
      }
    )

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => {
        // Log response in development
        if (appConfig.api.enableLogging) {
          debugLog('API Response:', {
            status: response.status,
            url: response.config.url,
            data: response.data,
          })
        }

        return response
      },
      (error: AxiosError) => {
        // Log error in development
        if (appConfig.api.enableLogging) {
          debugLog('API Error:', {
            status: error.response?.status,
            url: error.config?.url,
            message: error.message,
            data: error.response?.data,
          })
        }

        // Handle specific error cases
        if (error.response) {
          const responseData = error.response.data as any
          const errorMessage = responseData?.message || ''

          switch (error.response.status) {
            case 401:
              // Check if user is banned
              if (errorMessage.toLowerCase().includes('banned')) {
                console.error('User is banned:', errorMessage)
                // Clear auth and redirect to login with ban message
                localStorage.removeItem('accessToken')
                localStorage.removeItem('refreshToken')
                localStorage.removeItem('user')
                // Store ban message for login page to display
                localStorage.setItem('authError', errorMessage)
                // Redirect to login page
                if (window.location.pathname !== '/login') {
                  window.location.href = '/login'
                }
              } else {
                // Unauthorized - DO NOT redirect, let AuthContext handle it
                console.warn('401 Unauthorized - token may be invalid')
              }
              break

            case 403:
              // Forbidden - user doesn't have permission
              console.error('Permission denied')
              break

            case 404:
              // Not found
              console.error('Resource not found')
              break

            case 500:
              // Server error
              console.error('Server error occurred')
              break

            default:
              console.error('API Error:', error.response.status)
          }
        } else if (error.request) {
          // Request was made but no response received
          console.error('No response from server')
        } else {
          // Something else happened
          console.error('Request error:', error.message)
        }

        return Promise.reject(error)
      }
    )
  }

  /**
   * Get the axios instance for direct use
   */
  get instance(): AxiosInstance {
    return this.axiosInstance
  }
}

// Create singleton instance
const apiClientInstance = new ApiClientClass()

/**
 * Export the axios instance for backward compatibility
 */
export const apiClient: AxiosInstance = apiClientInstance.instance

/**
 * Export helper functions to manage context
 */
export const setCompanyId = (companyId: string | null) => apiClientInstance.setCompanyId(companyId)
export const getCompanyId = () => apiClientInstance.getCompanyId()
export const setProjectId = (projectId: string | null) => apiClientInstance.setProjectId(projectId)
export const getProjectId = () => apiClientInstance.getProjectId()

/**
 * Type-safe API response wrapper
 */
export interface ApiResponse<T = any> {
  data: T
  message?: string
  status: number
}

/**
 * Type-safe API error
 */
export interface ApiError {
  message: string
  statusCode: number
  error?: string
}

/**
 * Helper function for GET requests
 */
export const get = async <T = any>(
  url: string,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> => {
  const response = await apiClient.get<ApiResponse<T>>(url, config)
  return response.data
}

/**
 * Helper function for POST requests
 */
export const post = async <T = any>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> => {
  const response = await apiClient.post<ApiResponse<T>>(url, data, config)
  return response.data
}

/**
 * Helper function for PUT requests
 */
export const put = async <T = any>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> => {
  const response = await apiClient.put<ApiResponse<T>>(url, data, config)
  return response.data
}

/**
 * Helper function for PATCH requests
 */
export const patch = async <T = any>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> => {
  const response = await apiClient.patch<ApiResponse<T>>(url, data, config)
  return response.data
}

/**
 * Helper function for DELETE requests
 */
export const del = async <T = any>(
  url: string,
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> => {
  const response = await apiClient.delete<ApiResponse<T>>(url, config)
  return response.data
}

/**
 * Helper function to set auth token
 */
export const setAuthToken = (token: string | null) => {
  if (token) {
    localStorage.setItem('accessToken', token)
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`
  } else {
    localStorage.removeItem('accessToken')
    delete apiClient.defaults.headers.common['Authorization']
  }
}

/**
 * Helper function to get auth token
 */
export const getAuthToken = (): string | null => {
  return localStorage.getItem('accessToken')
}

/**
 * Export default client
 */
export default apiClient
