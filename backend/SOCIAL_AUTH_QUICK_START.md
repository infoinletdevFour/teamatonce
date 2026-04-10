# Social Authentication Quick Start Guide

## 🚀 Quick Setup (5 minutes)

### 1. Configure Environment Variables

Copy these to your `.env` file:

```bash
# Backend URL
BACKEND_URL=http://localhost:3001

# OAuth State Secret (generate with: openssl rand -hex 32)
OAUTH_STATE_SECRET=your-secure-random-secret-here

# Google OAuth (Get from: https://console.cloud.google.com/apis/credentials)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3001/auth/social/google/callback

# GitHub OAuth (Get from: https://github.com/settings/developers)
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_REDIRECT_URI=http://localhost:3001/auth/social/github/callback
```

### 2. Test the Implementation

```bash
# Start the backend
npm run start:dev

# Test endpoints (in another terminal)
curl http://localhost:3001/auth/social/providers
```

### 3. Configure OAuth Apps

#### Google OAuth Setup (2 minutes)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create project → APIs & Services → Credentials
3. Create OAuth 2.0 Client ID
4. Add redirect URI: `http://localhost:3001/auth/social/google/callback`
5. Copy Client ID and Secret to `.env`

#### GitHub OAuth Setup (2 minutes)

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. New OAuth App
3. Set callback URL: `http://localhost:3001/auth/social/github/callback`
4. Copy Client ID and Secret to `.env`

## 📱 Frontend Integration

### Complete OAuth Flow Example

```typescript
// 1. Start OAuth flow
async function loginWithGoogle() {
  try {
    // Get authorization URL
    const { authorizationUrl, state } = await fetch(
      'http://localhost:3001/auth/social/google/init',
      { method: 'POST' }
    ).then(r => r.json());

    // Store state for validation
    localStorage.setItem('oauth_state', state);

    // Redirect to Google
    window.location.href = authorizationUrl;
  } catch (error) {
    console.error('OAuth init failed:', error);
  }
}

// 2. Handle OAuth callback (on your callback page)
async function handleOAuthCallback() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  const state = params.get('state');
  const storedState = localStorage.getItem('oauth_state');

  // Validate state (CSRF protection)
  if (state !== storedState) {
    console.error('State mismatch - possible CSRF attack');
    return;
  }

  try {
    // Exchange code for user + token
    const response = await fetch(
      'http://localhost:3001/auth/social/google/callback',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, state })
      }
    ).then(r => r.json());

    // Store authentication data
    localStorage.setItem('access_token', response.access_token);
    localStorage.setItem('user', JSON.stringify(response.user));

    // Clean up
    localStorage.removeItem('oauth_state');

    // Redirect to app
    window.location.href = '/dashboard';

  } catch (error) {
    console.error('OAuth callback failed:', error);
    // Handle error (show message, redirect to login, etc.)
  }
}

// 3. Use authenticated API calls
async function fetchUserProfile() {
  const token = localStorage.getItem('access_token');

  const profile = await fetch('http://localhost:3001/auth/me', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }).then(r => r.json());

  console.log('User profile:', profile);
}
```

### React Hook Example

```typescript
import { useState, useEffect } from 'react';

export function useOAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialize OAuth flow
  const loginWithProvider = async (provider: 'google' | 'github') => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `http://localhost:3001/auth/social/${provider}/init`,
        { method: 'POST' }
      ).then(r => r.json());

      localStorage.setItem('oauth_state', response.state);
      window.location.href = response.authorizationUrl;
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  // Handle callback
  const handleCallback = async () => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    const storedState = localStorage.getItem('oauth_state');

    if (!code || !state || state !== storedState) {
      setError('Invalid OAuth callback');
      return;
    }

    setLoading(true);

    try {
      // Detect provider from URL or state
      const provider = window.location.pathname.includes('google')
        ? 'google'
        : 'github';

      const response = await fetch(
        `http://localhost:3001/auth/social/${provider}/callback`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, state })
        }
      ).then(r => r.json());

      // Store auth data
      localStorage.setItem('access_token', response.access_token);
      localStorage.setItem('user', JSON.stringify(response.user));
      localStorage.removeItem('oauth_state');

      // Success!
      return response;

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    loginWithProvider,
    handleCallback,
    loading,
    error
  };
}

// Usage in component
function LoginButton() {
  const { loginWithProvider, loading } = useOAuth();

  return (
    <button
      onClick={() => loginWithProvider('google')}
      disabled={loading}
    >
      {loading ? 'Loading...' : 'Sign in with Google'}
    </button>
  );
}

// Callback page component
function OAuthCallback() {
  const { handleCallback, loading, error } = useOAuth();
  const navigate = useNavigate();

  useEffect(() => {
    handleCallback().then((response) => {
      if (response) {
        navigate('/dashboard');
      }
    });
  }, []);

  if (loading) return <div>Completing sign in...</div>;
  if (error) return <div>Error: {error}</div>;
  return null;
}
```

## 🔗 Account Linking Example

```typescript
// Link a social account to existing user
async function linkGitHubAccount() {
  const userToken = localStorage.getItem('access_token');

  // 1. Start OAuth flow (same as login)
  const { authorizationUrl, state } = await fetch(
    'http://localhost:3001/auth/social/github/init',
    { method: 'POST' }
  ).then(r => r.json());

  // Mark this as a "link" action
  localStorage.setItem('oauth_state', state);
  localStorage.setItem('oauth_action', 'link');

  window.location.href = authorizationUrl;
}

// In callback handler:
async function handleLinkCallback() {
  const action = localStorage.getItem('oauth_action');

  if (action === 'link') {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    const userToken = localStorage.getItem('access_token');

    // First get the OAuth token
    const callbackResponse = await fetch(
      'http://localhost:3001/auth/social/github/callback',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, state })
      }
    ).then(r => r.json());

    // Then link it to current user
    await fetch('http://localhost:3001/auth/social/link', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        provider: 'github',
        accessToken: callbackResponse.access_token
      })
    });

    localStorage.removeItem('oauth_action');
    console.log('GitHub account linked successfully!');
  }
}

// View linked accounts
async function getLinkedAccounts() {
  const token = localStorage.getItem('access_token');

  const { accounts } = await fetch(
    'http://localhost:3001/auth/social/linked',
    {
      headers: { 'Authorization': `Bearer ${token}` }
    }
  ).then(r => r.json());

  console.log('Linked accounts:', accounts);
  // Returns: [{ provider: 'google', email: '...', ... }, ...]
}

// Unlink an account
async function unlinkAccount(provider: 'google' | 'github') {
  const token = localStorage.getItem('access_token');

  await fetch('http://localhost:3001/auth/social/unlink', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ provider })
  });

  console.log(`${provider} account unlinked`);
}
```

## 🧪 Testing with cURL

```bash
# 1. Get available providers
curl http://localhost:3001/auth/social/providers

# 2. Initialize Google OAuth
curl -X POST http://localhost:3001/auth/social/google/init

# 3. After OAuth redirect, handle callback
curl -X POST http://localhost:3001/auth/social/google/callback \
  -H "Content-Type: application/json" \
  -d '{
    "code": "4/0AeanUN...",
    "state": "abc123..."
  }'

# 4. Use returned JWT token for authenticated requests
curl http://localhost:3001/auth/me \
  -H "Authorization: Bearer eyJhbGc..."

# 5. Get linked accounts
curl http://localhost:3001/auth/social/linked \
  -H "Authorization: Bearer eyJhbGc..."

# 6. Link another account
curl -X POST http://localhost:3001/auth/social/link \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "github",
    "accessToken": "gho_..."
  }'

# 7. Unlink account
curl -X POST http://localhost:3001/auth/social/unlink \
  -H "Authorization: Bearer eyJhbGc..." \
  -H "Content-Type: application/json" \
  -d '{"provider": "github"}'
```

## 📊 API Endpoints Summary

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/auth/social/providers` | GET | No | List available providers |
| `/auth/social/:provider/init` | POST | No | Start OAuth flow |
| `/auth/social/:provider/callback` | POST | No | Handle OAuth callback |
| `/auth/social/auth` | POST | No | Direct social auth |
| `/auth/social/link` | POST | Yes | Link social account |
| `/auth/social/unlink` | POST | Yes | Unlink social account |
| `/auth/social/linked` | GET | Yes | Get linked accounts |
| `/auth/admin/social/configure` | POST | Admin | Configure provider |

## 🎯 Common Use Cases

### 1. Simple Social Login

```typescript
// User clicks "Sign in with Google"
await loginWithProvider('google');
// → Redirects to Google
// → Returns to your callback URL
// → Exchange code for token
// → User logged in!
```

### 2. Link Multiple Accounts

```typescript
// User wants to link GitHub to existing account
await linkGitHubAccount();
// → Same OAuth flow
// → Links to current user instead of creating new user
```

### 3. Show All Linked Accounts

```typescript
const { accounts } = await getLinkedAccounts();
// Display in settings page:
// ✓ Google (user@gmail.com)
// ✓ GitHub (username)
```

### 4. Unlink Account

```typescript
// User wants to remove GitHub link
await unlinkAccount('github');
// Note: Cannot unlink last authentication method
```

## ⚠️ Important Notes

1. **State Token**: Always validate state token to prevent CSRF attacks
2. **HTTPS**: Use HTTPS in production for OAuth callbacks
3. **Error Handling**: Always handle OAuth errors gracefully
4. **Token Storage**: Store JWT securely (HTTP-only cookies recommended)
5. **Redirect URI**: Must exactly match OAuth app configuration

## 🐛 Troubleshooting

### "redirect_uri_mismatch"
- Check OAuth app settings
- Ensure `.env` REDIRECT_URI matches OAuth app
- Use exact URL (no trailing slash differences)

### "Invalid State Token"
- State expired (10 min limit)
- Restart OAuth flow
- Check OAUTH_STATE_SECRET is set

### "Provider not configured"
- Check provider credentials in `.env`
- Ensure CLIENT_ID and CLIENT_SECRET are set
- Restart backend after .env changes

## 📚 Full Documentation

For complete details, see:
- `SOCIAL_AUTH_IMPLEMENTATION.md` - Comprehensive implementation guide
- API docs: `http://localhost:3001/api` (Swagger UI)
- Fluxez docs: https://docs.fluxez.io/

## 🎉 You're Ready!

Your social authentication is now set up and ready to use. Start by configuring your OAuth apps and testing the flow with the provided examples.

Need help? Check the full documentation or reach out to the team!
