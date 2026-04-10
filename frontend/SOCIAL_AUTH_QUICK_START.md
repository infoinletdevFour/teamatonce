# Social Authentication - Quick Start Guide

## Usage in Components

### Basic Usage

```tsx
import SocialAuthGroup from '@/components/auth/SocialAuthGroup';

// In your component
<SocialAuthGroup
  mode="login"  // or "signup"
  providers={['google', 'github']}
  onSuccess={(user) => {
    console.log('Logged in:', user);
    navigate('/dashboard');
  }}
  onError={(error) => {
    toast.error('Login failed', { description: error.message });
  }}
/>
```

### With User Type (Signup)

```tsx
<SocialAuthGroup
  mode="signup"
  userType="client"  // or "developer"
  providers={['google', 'github']}
  onSuccess={(user) => navigate('/client/dashboard')}
  onError={(error) => toast.error(error.message)}
/>
```

### Single Button

```tsx
import SocialAuthButton from '@/components/auth/SocialAuthButton';

<SocialAuthButton
  provider="google"
  mode="login"
  fullWidth
  onSuccess={(user) => console.log('Logged in:', user)}
  onError={(error) => console.error(error)}
/>
```

## Environment Variables

Create `.env.local` with:

```bash
VITE_GITHUB_CLIENT_ID=your_github_client_id
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_APP_URL=http://localhost:5175
```

## OAuth Callback URL

The callback URL must be configured in your OAuth apps:

**Development:** `http://localhost:5175/auth/callback`
**Production:** `https://teamatonce.com/auth/callback`

## Backend Endpoints Required

1. **POST** `/api/v1/auth/social/initiate` - Get OAuth URL
2. **POST** `/api/v1/auth/social/callback` - Exchange code for tokens
3. **POST** `/api/v1/auth/social/link` - Link social account
4. **DELETE** `/api/v1/auth/social/unlink/:provider` - Unlink account

## Error Boundary

Wrap your auth pages with error boundary:

```tsx
import SocialAuthErrorBoundary from '@/components/auth/SocialAuthErrorBoundary';

<SocialAuthErrorBoundary>
  <YourAuthPage />
</SocialAuthErrorBoundary>
```

## Testing

1. Set environment variables
2. Click social button
3. Authorize at provider
4. Verify redirect and login
5. Check token in localStorage

## Troubleshooting

**Buttons don't show?**
- Check `VITE_GOOGLE_CLIENT_ID` and `VITE_GITHUB_CLIENT_ID` are set

**Invalid state error?**
- State tokens expire after 5 minutes
- Clear sessionStorage and retry

**Redirect fails?**
- Verify callback URL in OAuth app settings
- Check `VITE_APP_URL` matches your domain

**Account linking modal doesn't show?**
- Backend must return `EMAIL_ALREADY_EXISTS` error
- Error must include `email`, `provider`, and `socialToken`

## Component Props

### SocialAuthGroup

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| mode | 'login' \| 'signup' | required | Auth mode |
| userType | 'client' \| 'developer' | undefined | User type for signup |
| providers | SocialProvider[] | ['google', 'github'] | Providers to show |
| orientation | 'horizontal' \| 'vertical' | 'horizontal' | Layout |
| dividerText | string | 'Or continue with email' | Divider text |
| showDivider | boolean | true | Show divider |
| onSuccess | (user) => void | undefined | Success callback |
| onError | (error) => void | undefined | Error callback |

### SocialAuthButton

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| provider | 'google' \| 'github' | required | Provider |
| mode | 'login' \| 'signup' | 'login' | Auth mode |
| userType | 'client' \| 'developer' | undefined | User type |
| variant | 'default' \| 'outline' \| 'ghost' | 'default' | Button style |
| size | 'sm' \| 'md' \| 'lg' | 'md' | Button size |
| fullWidth | boolean | false | Full width |
| disabled | boolean | false | Disabled state |
| showIcon | boolean | true | Show icon |
| showText | boolean | true | Show text |
| onSuccess | (user) => void | undefined | Success callback |
| onError | (error) => void | undefined | Error callback |

## Files Created

✅ `/src/types/social-auth.ts` - TypeScript types
✅ `/src/config/social-auth-config.ts` - Configuration
✅ `/src/hooks/useOAuthState.ts` - State management
✅ `/src/hooks/useSocialAuth.ts` - OAuth flow
✅ `/src/components/auth/SocialAuthButton.tsx` - Button component
✅ `/src/components/auth/SocialAuthGroup.tsx` - Button group
✅ `/src/components/auth/SocialAuthCallback.tsx` - Callback handler
✅ `/src/components/auth/AccountLinkingModal.tsx` - Link modal
✅ `/src/components/auth/SocialAuthErrorBoundary.tsx` - Error boundary

## Routes Added

✅ `/auth/callback` - OAuth callback endpoint

---

Ready to use! 🚀
