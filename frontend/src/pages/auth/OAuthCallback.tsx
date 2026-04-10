import { useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Loader2 } from 'lucide-react'
import { apiClient, setAuthToken } from '@/lib/api-client'

export default function OAuthCallback() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const hasProcessed = useRef(false)

  useEffect(() => {
    const handleCallback = async () => {
      // Prevent duplicate calls (React Strict Mode causes double render)
      if (hasProcessed.current) {
        return
      }
      hasProcessed.current = true

      // Following database pattern: backend redirects here with tokens in URL params
      const databaseToken = searchParams.get('access_token')
      const userId = searchParams.get('user_id')
      const email = searchParams.get('email')
      const error = searchParams.get('error')

      if (error) {
        console.error('OAuth error:', error)
        navigate('/login?error=' + encodeURIComponent(error))
        return
      }

      if (!databaseToken) {
        console.error('No access token received from OAuth callback')
        navigate('/login?error=' + encodeURIComponent('Authentication failed'))
        return
      }

      console.log('✅ database token received, exchanging for Team@Once token...')

      try {
        // Get the stored role from OAuth signup flow
        const role = localStorage.getItem('oauth_signup_role') || 'client'

        // Exchange database token for Team@Once token
        const response = await apiClient.post('/auth/oauth/exchange', {
          databaseToken,
          userId,
          email,
          role // Pass the role to backend
        })

        // Clear the stored role after use
        localStorage.removeItem('oauth_signup_role')

        const { accessToken, refreshToken, user } = response.data

        if (!accessToken) {
          throw new Error('No Team@Once token received')
        }

        console.log('✅ Team@Once token received, storing...')

        // Store tokens using centralized auth token setter
        setAuthToken(accessToken)
        if (refreshToken) {
          localStorage.setItem('refreshToken', refreshToken)
        }

        // Dispatch custom event to notify AuthContext
        window.dispatchEvent(new CustomEvent('auth-token-stored'))

        // Check for pending invitation token first
        const pendingInvitationToken = localStorage.getItem('pending_invitation_token')
        if (pendingInvitationToken) {
          console.log('✅ Pending invitation found, redirecting to accept invitation page')
          navigate(`/invitation/${pendingInvitationToken}`)
          return
        }

        // Fetch companies using the centralized API client
        try {
          console.log('✅ Fetching companies with new token...')
          const companiesResponse = await apiClient.get('/company')

          const companies = companiesResponse.data?.data || companiesResponse.data || []
          console.log('✅ Companies fetched:', companies.length)

          if (Array.isArray(companies) && companies.length > 0) {
            const lastCompanyId = localStorage.getItem('lastCompanyId')
            const company = companies.find((c: any) => c.id === lastCompanyId) || companies[0]
            console.log('✅ Navigating to company dashboard:', company.id)

            // Navigate based on user role
            const role = user?.role || 'client'
            if (role === 'seller' || role === 'designer' || role === 'project-manager') {
              navigate(`/company/${company.id}/seller/dashboard`)
            } else {
              navigate(`/company/${company.id}/client/dashboard`)
            }
          } else {
            console.log('⚠️ No companies found, redirecting to onboarding')
            navigate('/onboarding/company')
          }
        } catch (companyError) {
          console.warn('Could not fetch companies, redirecting to onboarding:', companyError)
          navigate('/onboarding/company')
        }
      } catch (error) {
        console.error('❌ Token exchange failed:', error)
        navigate('/login?error=' + encodeURIComponent('Authentication failed'))
      }
    }

    handleCallback()
  }, [searchParams, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {t('auth.oauthCallback.title')}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          {t('auth.oauthCallback.message')}
        </p>
      </div>
    </div>
  )
}
