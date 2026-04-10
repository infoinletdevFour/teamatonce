# Social Authentication Implementation Guide

## Overview

Complete backend implementation of OAuth 2.0 social authentication for TeamAtOnce using Fluxez Node SDK. This implementation provides secure social login through Google and GitHub, with extensible architecture for additional providers.

## Architecture

### Key Components

1. **DTOs** (`src/modules/auth/dto/social-auth.dto.ts`)
   - Type-safe request/response objects with validation
   - Comprehensive Swagger documentation
   - Support for all OAuth flows

2. **OAuth Strategies** (`src/modules/auth/strategies/`)
   - `oauth-strategy.interface.ts` - Base interface for all strategies
   - `google.strategy.ts` - Google OAuth 2.0 implementation
   - `github.strategy.ts` - GitHub OAuth implementation
   - Each strategy handles the complete OAuth flow independently

3. **Auth Service** (`src/modules/auth/auth.service.ts`)
   - Social authentication orchestration
   - User account linking/unlinking
   - Integration with Fluxez SDK
   - Automatic user creation or login

4. **Auth Controller** (`src/modules/auth/auth.controller.ts`)
   - RESTful API endpoints for OAuth operations
   - Full Swagger/OpenAPI documentation
   - JWT-protected routes for account management

## Features

### Core Functionality

✅ **OAuth Flow Management**
- Authorization URL generation with CSRF protection
- Secure callback handling with state validation
- Token exchange and user profile fetching
- Automatic user creation or authentication

✅ **Account Management**
- Link multiple social accounts to one user
- Unlink social accounts safely
- View all linked accounts
- Prevent orphaned accounts (can't unlink last auth method)

✅ **Security**
- CSRF state token validation
- Secure token storage in user metadata
- Email verification from providers
- Automatic duplicate account detection

✅ **Provider Support**
- Google OAuth 2.0 (with refresh tokens)
- GitHub OAuth (standard flow)
- Extensible for Facebook, Twitter, Apple, etc.

### User Experience

- **New Users**: Automatically create account with social profile data
- **Existing Users**: Link social account to existing email
- **Multiple Accounts**: Support for linking multiple providers
- **Profile Data**: Auto-populate name, email, avatar from provider

## API Endpoints

### Public Endpoints

#### 1. Get Available Providers
```http
GET /auth/social/providers
```

**Response:**
```json
{
  "providers": [
    {
      "provider": "google",
      "enabled": true,
      "displayName": "Sign in with Google",
      "iconUrl": "https://www.google.com/favicon.ico",
      "scopes": ["openid", "profile", "email"]
    },
    {
      "provider": "github",
      "enabled": true,
      "displayName": "Sign in with GitHub",
      "iconUrl": "https://github.com/favicon.ico",
      "scopes": ["read:user", "user:email"]
    }
  ],
  "total": 2
}
```

#### 2. Initialize OAuth Flow
```http
POST /auth/social/:provider/init
```

**Parameters:**
- `provider`: google | github

**Request Body (optional):**
```json
{
  "redirectUri": "http://localhost:3000/auth/callback",
  "params": {
    "prompt": "consent"
  }
}
```

**Response:**
```json
{
  "authorizationUrl": "https://accounts.google.com/o/oauth2/v2/auth?...",
  "state": "csrf_state_token_here"
}
```

**Frontend Usage:**
```typescript
// 1. Initialize OAuth flow
const { authorizationUrl, state } = await fetch('/auth/social/google/init', {
  method: 'POST'
}).then(r => r.json());

// 2. Store state in localStorage
localStorage.setItem('oauth_state', state);

// 3. Redirect user to authorizationUrl
window.location.href = authorizationUrl;
```

#### 3. Handle OAuth Callback
```http
POST /auth/social/:provider/callback
```

**Parameters:**
- `provider`: google | github

**Request Body:**
```json
{
  "code": "authorization_code_from_provider",
  "state": "csrf_state_token"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "name": "John Doe",
    "avatarUrl": "https://...",
    "provider": "google",
    "role": "user"
  },
  "access_token": "jwt_token_here",
  "message": "Signed in successfully",
  "metadata": {
    "isNewUser": false,
    "provider": "google"
  }
}
```

**Frontend Usage:**
```typescript
// After OAuth redirect back to your app
const urlParams = new URLSearchParams(window.location.search);
const code = urlParams.get('code');
const state = urlParams.get('state');
const storedState = localStorage.getItem('oauth_state');

// Validate state matches
if (state === storedState) {
  const response = await fetch('/auth/social/google/callback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, state })
  }).then(r => r.json());

  // Store JWT token and user data
  localStorage.setItem('access_token', response.access_token);
  localStorage.setItem('user', JSON.stringify(response.user));

  // Clean up
  localStorage.removeItem('oauth_state');

  // Redirect to dashboard
  window.location.href = '/dashboard';
}
```

#### 4. Direct Social Auth (with existing token)
```http
POST /auth/social/auth
```

**Request Body:**
```json
{
  "provider": "google",
  "accessToken": "oauth_access_token",
  "refreshToken": "oauth_refresh_token",
  "userData": {
    "id": "123",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

### Protected Endpoints (Require JWT Auth)

#### 5. Link Social Account
```http
POST /auth/social/link
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "provider": "github",
  "accessToken": "oauth_access_token",
  "metadata": {
    "primaryAccount": false
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "github account linked successfully"
}
```

**Frontend Usage:**
```typescript
// After user clicks "Link GitHub Account" button
const { authorizationUrl, state } = await fetch('/auth/social/github/init', {
  method: 'POST'
}).then(r => r.json());

localStorage.setItem('oauth_state', state);
localStorage.setItem('oauth_action', 'link'); // Track this is a link action

// Redirect to OAuth
window.location.href = authorizationUrl;

// In callback handler:
const action = localStorage.getItem('oauth_action');
if (action === 'link') {
  // Get token first from callback
  const callbackResponse = await fetch('/auth/social/github/callback', {
    method: 'POST',
    body: JSON.stringify({ code, state })
  }).then(r => r.json());

  // Then link the account
  await fetch('/auth/social/link', {
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
}
```

#### 6. Unlink Social Account
```http
POST /auth/social/unlink
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "provider": "github"
}
```

**Response:**
```json
{
  "success": true,
  "message": "github account unlinked successfully"
}
```

**Error Cases:**
- Cannot unlink if it's the only authentication method
- User must set password first or link another account

#### 7. Get Linked Accounts
```http
GET /auth/social/linked
Authorization: Bearer <jwt_token>
```

**Response:**
```json
{
  "accounts": [
    {
      "provider": "google",
      "providerId": "123456789",
      "email": "user@gmail.com",
      "name": "John Doe",
      "avatarUrl": "https://...",
      "linkedAt": "2024-01-01T00:00:00Z",
      "metadata": {}
    },
    {
      "provider": "github",
      "providerId": "987654321",
      "email": "user@users.noreply.github.com",
      "name": "johndoe",
      "avatarUrl": "https://...",
      "linkedAt": "2024-01-02T00:00:00Z",
      "metadata": {}
    }
  ],
  "total": 2
}
```

#### 8. Configure Provider (Admin Only)
```http
POST /auth/admin/social/configure
Authorization: Bearer <admin_jwt_token>
```

**Request Body:**
```json
{
  "provider": "google",
  "clientId": "new_client_id",
  "clientSecret": "new_client_secret",
  "redirectUri": "https://production.com/auth/callback",
  "scopes": ["openid", "profile", "email"],
  "enabled": true
}
```

## Environment Configuration

### Required Variables

```bash
# Backend base URL (used for OAuth callbacks)
BACKEND_URL=http://localhost:3001

# OAuth state secret (for CSRF protection)
OAUTH_STATE_SECRET=your-secure-random-secret-here

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3001/auth/social/google/callback

# GitHub OAuth
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_REDIRECT_URI=http://localhost:3001/auth/social/github/callback
```

### Getting OAuth Credentials

#### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Go to Credentials → Create Credentials → OAuth 2.0 Client ID
5. Configure consent screen
6. Add authorized redirect URIs:
   - Development: `http://localhost:3001/auth/social/google/callback`
   - Production: `https://yourdomain.com/auth/social/google/callback`
7. Copy Client ID and Client Secret

**Required Scopes:**
- `openid`
- `https://www.googleapis.com/auth/userinfo.email`
- `https://www.googleapis.com/auth/userinfo.profile`

#### GitHub OAuth Setup

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in application details:
   - Application name: TeamAtOnce
   - Homepage URL: `http://localhost:3000` (your frontend)
   - Authorization callback URL: `http://localhost:3001/auth/social/github/callback`
4. Copy Client ID and generate Client Secret

**Required Scopes:**
- `read:user` - Read user profile
- `user:email` - Read user email addresses

## Data Storage

### User Metadata Structure

Social accounts are stored in Fluxez user metadata:

```typescript
{
  user: {
    id: "user_id",
    email: "user@example.com",
    name: "John Doe",
    avatar_url: "https://...",
    metadata: {
      role: "user",
      social_auth: true,  // User created via social auth
      primary_provider: "google",  // First provider used
      linked_accounts: [
        {
          provider: "google",
          providerId: "123456789",
          email: "user@gmail.com",
          name: "John Doe",
          avatarUrl: "https://...",
          linkedAt: "2024-01-01T00:00:00Z",
          metadata: {}
        },
        {
          provider: "github",
          providerId: "987654321",
          email: "user@github.com",
          name: "johndoe",
          avatarUrl: "https://...",
          linkedAt: "2024-01-02T00:00:00Z",
          metadata: {}
        }
      ]
    }
  }
}
```

### Key Fields

- `social_auth`: Boolean indicating user was created via social login
- `primary_provider`: The first OAuth provider used to create account
- `linked_accounts`: Array of all linked social accounts
- Each linked account stores provider-specific data and metadata

## Security Considerations

### CSRF Protection

1. **State Token Generation**
   - Random 64-byte value
   - HMAC-SHA256 signed with secret
   - Timestamped for expiration

2. **State Token Validation**
   - Must match stored state
   - Expires after 10 minutes
   - One-time use only

3. **State Token Storage**
   - Stored in-memory on backend
   - Automatic cleanup of expired tokens
   - Never exposed to client except in URL

### OAuth Flow Security

1. **Authorization Code Flow**
   - Most secure OAuth 2.0 flow
   - Code exchange happens server-side
   - Client secret never exposed to frontend

2. **Token Storage**
   - OAuth tokens stored in Fluxez user metadata
   - Backend JWT for session management
   - Secure HTTP-only cookies recommended for production

3. **Email Verification**
   - Requires verified email from OAuth provider
   - Prevents account takeover via unverified emails

4. **Account Linking Protection**
   - Checks for duplicate provider links
   - Prevents linking already-linked accounts
   - Validates user ownership before linking

### Best Practices

1. **Use HTTPS in Production**
   ```bash
   BACKEND_URL=https://api.yourdomain.com
   GOOGLE_REDIRECT_URI=https://api.yourdomain.com/auth/social/google/callback
   ```

2. **Secure State Secret**
   ```bash
   # Generate secure random secret
   OAUTH_STATE_SECRET=$(openssl rand -hex 32)
   ```

3. **Validate Redirect URIs**
   - Whitelist allowed redirect URIs
   - Validate URI in OAuth init
   - Prevent open redirect vulnerabilities

4. **Rate Limiting**
   - Implement rate limiting on OAuth endpoints
   - Prevent brute force attacks
   - Use Redis for distributed rate limiting

## Error Handling

### Common Errors

1. **Invalid State Token**
   ```json
   {
     "statusCode": 400,
     "message": "Invalid or expired state token"
   }
   ```

2. **Provider Not Configured**
   ```json
   {
     "statusCode": 400,
     "message": "Provider facebook is not supported or not configured"
   }
   ```

3. **Email Already Exists**
   ```json
   {
     "statusCode": 409,
     "message": "An account with this email already exists"
   }
   ```

4. **Cannot Unlink Last Account**
   ```json
   {
     "statusCode": 400,
     "message": "Cannot unlink the only social account. Please set a password first or link another account."
   }
   ```

5. **Social Account Already Linked**
   ```json
   {
     "statusCode": 409,
     "message": "This social account is already linked to another user"
   }
   ```

### Error Handling Best Practices

```typescript
// Frontend error handling example
try {
  const response = await fetch('/auth/social/google/callback', {
    method: 'POST',
    body: JSON.stringify({ code, state })
  });

  if (!response.ok) {
    const error = await response.json();

    if (error.statusCode === 409) {
      // Account exists, show link account option
      showLinkAccountDialog(error.message);
    } else if (error.statusCode === 400) {
      // Invalid state, restart OAuth flow
      redirectToLogin();
    } else {
      // General error
      showErrorMessage(error.message);
    }
    return;
  }

  const data = await response.json();
  handleSuccessfulAuth(data);

} catch (error) {
  console.error('OAuth error:', error);
  showErrorMessage('Authentication failed. Please try again.');
}
```

## Testing

### Manual Testing

1. **Test Google OAuth Flow**
   ```bash
   # 1. Get authorization URL
   curl -X POST http://localhost:3001/auth/social/google/init

   # 2. Visit URL in browser and authorize
   # 3. Copy code and state from callback URL

   # 4. Exchange code for token
   curl -X POST http://localhost:3001/auth/social/google/callback \
     -H "Content-Type: application/json" \
     -d '{"code":"CODE_HERE","state":"STATE_HERE"}'
   ```

2. **Test Account Linking**
   ```bash
   # Get JWT token from login/social auth
   TOKEN="your_jwt_token"

   # Link GitHub account
   curl -X POST http://localhost:3001/auth/social/link \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"provider":"github","accessToken":"GITHUB_TOKEN"}'
   ```

3. **Test Get Linked Accounts**
   ```bash
   curl -X GET http://localhost:3001/auth/social/linked \
     -H "Authorization: Bearer $TOKEN"
   ```

### Automated Testing

Create test cases for:

1. OAuth flow completion
2. New user creation
3. Existing user authentication
4. Account linking/unlinking
5. State token validation
6. Error scenarios

## Monitoring & Logging

### Important Logs

The implementation includes comprehensive logging:

1. **OAuth Initialization**
   ```
   [AuthService] Initializing social auth for provider: google
   [GoogleStrategy] Generated new state token: abc123...
   ```

2. **OAuth Callback**
   ```
   [AuthService] Handling social callback for provider: google
   [GoogleStrategy] Successfully exchanged code for token
   [GoogleStrategy] Successfully fetched profile for user: user@example.com
   ```

3. **User Creation/Login**
   ```
   [AuthService] Creating new user from google profile
   [AuthService] New user created via google: user_id_123
   ```

4. **Account Linking**
   ```
   [AuthService] Linking github account to user: user_id_123
   [AuthService] Added new github link for user: user_id_123
   ```

### Monitoring Metrics

Track these metrics in production:

1. OAuth flow completion rate
2. Failed authentications by provider
3. New user registrations via social auth
4. Account linking/unlinking frequency
5. State token validation failures

## Extending to Other Providers

### Adding a New Provider (Example: Facebook)

1. **Create Strategy**
   ```typescript
   // src/modules/auth/strategies/facebook.strategy.ts
   import { Injectable } from '@nestjs/common';
   import { IOAuthStrategy } from './oauth-strategy.interface';

   @Injectable()
   export class FacebookStrategy implements IOAuthStrategy {
     // Implement all interface methods
     // Similar to GoogleStrategy but with Facebook endpoints
   }
   ```

2. **Update DTOs**
   ```typescript
   // Add to SocialProvider enum
   export enum SocialProvider {
     GOOGLE = 'google',
     GITHUB = 'github',
     FACEBOOK = 'facebook', // Add this
   }
   ```

3. **Register in Module**
   ```typescript
   // auth.module.ts
   import { FacebookStrategy } from './strategies/facebook.strategy';

   @Module({
     providers: [
       // ...
       FacebookStrategy,
     ],
   })
   ```

4. **Register in Service**
   ```typescript
   // auth.service.ts
   constructor(
     // ...
     private facebookStrategy: FacebookStrategy,
   ) {
     this.strategies.set(SocialProvider.FACEBOOK, this.facebookStrategy);
   }
   ```

5. **Add Environment Variables**
   ```bash
   FACEBOOK_CLIENT_ID=your_facebook_app_id
   FACEBOOK_CLIENT_SECRET=your_facebook_app_secret
   FACEBOOK_REDIRECT_URI=http://localhost:3001/auth/social/facebook/callback
   ```

## Production Checklist

Before deploying to production:

- [ ] Use HTTPS for all OAuth redirect URIs
- [ ] Generate secure random state secret
- [ ] Configure OAuth apps with production URLs
- [ ] Enable rate limiting on OAuth endpoints
- [ ] Set up monitoring and logging
- [ ] Test all OAuth flows thoroughly
- [ ] Document OAuth setup for team
- [ ] Configure CORS properly
- [ ] Use HTTP-only cookies for tokens
- [ ] Implement token refresh mechanism
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Configure proper RBAC for admin endpoints
- [ ] Test account linking/unlinking flows
- [ ] Verify email validation from providers
- [ ] Set up backup authentication methods

## Troubleshooting

### Common Issues

1. **"redirect_uri_mismatch" Error**
   - Check OAuth app redirect URI configuration
   - Ensure REDIRECT_URI env variable matches OAuth app settings
   - Verify protocol (http vs https)

2. **"Invalid State Token" Error**
   - State token expired (10 minute limit)
   - State token already used
   - CSRF protection triggered
   - Solution: Restart OAuth flow

3. **"Email Required" Error**
   - OAuth provider didn't return email
   - Email not verified on provider
   - Solution: Ensure email scope is requested

4. **"Cannot Exchange Code" Error**
   - Invalid client ID or secret
   - Code already used
   - Code expired
   - Solution: Check OAuth credentials

## Support & Resources

### Documentation Links

- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
- [GitHub OAuth Apps](https://docs.github.com/en/developers/apps/building-oauth-apps)
- [Fluxez SDK Documentation](https://docs.fluxez.io/)
- [NestJS Documentation](https://docs.nestjs.com/)

### Testing Tools

- [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)
- [JWT Debugger](https://jwt.io/)
- Postman/Insomnia for API testing

## Conclusion

This implementation provides a complete, production-ready social authentication system with:

- ✅ Secure OAuth 2.0 flows
- ✅ Multiple provider support
- ✅ Account linking/unlinking
- ✅ Comprehensive error handling
- ✅ Full API documentation
- ✅ Extensible architecture
- ✅ Security best practices

The system is ready to be integrated with the frontend and can be easily extended to support additional OAuth providers as needed.
