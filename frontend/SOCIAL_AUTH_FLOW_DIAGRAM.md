# Social Authentication Flow Diagram

## Complete OAuth Flow Visualization

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SOCIAL AUTHENTICATION FLOW                           │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐
│  User visits    │
│  Login/Signup   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────────────────┐
│  Login.tsx / Signup.tsx                             │
│  ┌───────────────────────────────────────────────┐  │
│  │ <SocialAuthGroup>                             │  │
│  │   - Renders Google & GitHub buttons           │  │
│  │   - mode="login" or "signup"                  │  │
│  │   - userType="client" or "developer"          │  │
│  └───────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│  User clicks "Google" or "GitHub" button            │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│  SocialAuthButton.tsx                               │
│  ┌───────────────────────────────────────────────┐  │
│  │  onClick handler triggered                    │  │
│  │    → calls useSocialAuth.initiateOAuth()      │  │
│  └───────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│  useSocialAuth.ts Hook                              │
│  ┌───────────────────────────────────────────────┐  │
│  │  1. Generate CSRF state token                 │  │
│  │     → useOAuthState.generateState()           │  │
│  │  2. Store state in sessionStorage             │  │
│  │  3. Call backend API                          │  │
│  │     POST /auth/social/initiate                │  │
│  │     { provider, mode, userType, state }       │  │
│  └───────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│  Backend API (TO BE IMPLEMENTED)                    │
│  ┌───────────────────────────────────────────────┐  │
│  │  1. Validate request                          │  │
│  │  2. Build OAuth authorization URL             │  │
│  │  3. Add client_id, redirect_uri, scope        │  │
│  │  4. Return { authUrl, state }                 │  │
│  └───────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│  Frontend Redirects User                            │
│  window.location.href = authUrl                     │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│  OAuth Provider (Google/GitHub)                     │
│  ┌───────────────────────────────────────────────┐  │
│  │  1. User sees consent screen                  │  │
│  │  2. User authorizes app                       │  │
│  │  3. User grants permissions                   │  │
│  │  4. Provider redirects back with code         │  │
│  │     → /auth/callback?code=XXX&state=YYY       │  │
│  └───────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│  SocialAuthCallback.tsx                             │
│  ┌───────────────────────────────────────────────┐  │
│  │  Route: /auth/callback                        │  │
│  │  1. Parse URL params (code, state, provider)  │  │
│  │  2. Show loading overlay                      │  │
│  │  3. Validate state token (CSRF protection)    │  │
│  │     → useOAuthState.validateState(state)      │  │
│  │  4. Call backend callback handler             │  │
│  │     useSocialAuth.handleCallback()            │  │
│  └───────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│  Backend API (TO BE IMPLEMENTED)                    │
│  ┌───────────────────────────────────────────────┐  │
│  │  POST /auth/social/callback                   │  │
│  │  { provider, code, state, mode, userType }    │  │
│  │                                                │  │
│  │  1. Validate state token                      │  │
│  │  2. Exchange code for access token            │  │
│  │     → Call provider API with code             │  │
│  │  3. Get user info from provider               │  │
│  │  4. Check if user exists in database          │  │
│  │     ┌──────────────────────────────────────┐  │  │
│  │     │ IF user exists:                      │  │  │
│  │     │   - Create JWT tokens                │  │  │
│  │     │   - Return user + tokens             │  │  │
│  │     └──────────────────────────────────────┘  │  │
│  │     ┌──────────────────────────────────────┐  │  │
│  │     │ IF email exists (different provider):│  │  │
│  │     │   - Throw EMAIL_ALREADY_EXISTS       │  │  │
│  │     │   - Include: email, provider, token  │  │  │
│  │     └──────────────────────────────────────┘  │  │
│  │     ┌──────────────────────────────────────┐  │  │
│  │     │ IF new user (signup mode):           │  │  │
│  │     │   - Create user account              │  │  │
│  │     │   - Set role from userType           │  │  │
│  │     │   - Create JWT tokens                │  │  │
│  │     │   - Return user + tokens             │  │  │
│  │     └──────────────────────────────────────┘  │  │
│  │  5. Return response                           │  │
│  │     { user, accessToken, refreshToken }       │  │
│  └───────────────────────────────────────────────┘  │
└──────────────────────┬──────────────────────────────┘
                       │
         ┌─────────────┴─────────────┐
         │                           │
         ▼                           ▼
┌──────────────────┐        ┌──────────────────────┐
│  SUCCESS PATH    │        │  ERROR PATH          │
└────────┬─────────┘        └─────────┬────────────┘
         │                             │
         ▼                             ▼
┌──────────────────────────────┐  ┌────────────────────────────────┐
│  SocialAuthCallback          │  │  Error Handling                │
│  1. Store tokens             │  │  ┌──────────────────────────┐  │
│     → localStorage           │  │  │ EMAIL_ALREADY_EXISTS?    │  │
│  2. Update AuthContext       │  │  │   → Show AccountLinking  │  │
│     → refreshUser()          │  │  │      Modal               │  │
│  3. Show success toast       │  │  └──────────────────────────┘  │
│  4. Redirect to dashboard    │  │  ┌──────────────────────────┐  │
│     - Developer → /dev/...   │  │  │ Other errors?            │  │
│     - Client → /client/...   │  │  │   → Show error message   │  │
└──────────────────────────────┘  │  │   → Redirect to login    │  │
                                  │  └──────────────────────────┘  │
                                  └────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════════
                           ACCOUNT LINKING FLOW
═══════════════════════════════════════════════════════════════════════════════

                 ┌─────────────────────────────────┐
                 │  Backend throws                 │
                 │  EMAIL_ALREADY_EXISTS           │
                 │  { email, provider, token }     │
                 └──────────────┬──────────────────┘
                                │
                                ▼
                 ┌─────────────────────────────────┐
                 │  AccountLinkingModal.tsx        │
                 │  ┌───────────────────────────┐  │
                 │  │  1. Show modal dialog     │  │
                 │  │  2. Display email         │  │
                 │  │  3. Request password      │  │
                 │  │  4. User enters password  │  │
                 │  └───────────────────────────┘  │
                 └──────────────┬──────────────────┘
                                │
                                ▼
                 ┌─────────────────────────────────┐
                 │  Backend API                    │
                 │  POST /auth/social/link         │
                 │  { email, password, provider,   │
                 │    socialToken }                │
                 │                                 │
                 │  1. Verify password             │
                 │  2. Link social account         │
                 │  3. Return user + tokens        │
                 └──────────────┬──────────────────┘
                                │
                                ▼
                 ┌─────────────────────────────────┐
                 │  1. Close modal                 │
                 │  2. Store tokens                │
                 │  3. Update AuthContext          │
                 │  4. Show success toast          │
                 │  5. Redirect to dashboard       │
                 └─────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════════
                            SECURITY FEATURES
═══════════════════════════════════════════════════════════════════════════════

┌────────────────────────────────────────────────────────────────────────────┐
│  CSRF Protection                                                           │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  • State token: crypto.randomUUID() (cryptographically secure)       │  │
│  │  • Stored in sessionStorage (cleared on browser close)               │  │
│  │  • One-time use (cleared after validation)                           │  │
│  │  • 5-minute expiration                                                │  │
│  │  • Validated on callback                                             │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────┐
│  Token Management                                                          │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  • JWT tokens stored in localStorage                                 │  │
│  │  • Automatic refresh on expiration                                   │  │
│  │  • Cleared on logout                                                 │  │
│  │  • HTTPS-only cookies for refresh tokens (backend)                   │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────┐
│  Error Handling                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  • SocialAuthErrorBoundary catches all errors                        │  │
│  │  • User-friendly error messages                                      │  │
│  │  • Automatic cleanup of failed attempts                              │  │
│  │  • Retry functionality                                               │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────┘

═══════════════════════════════════════════════════════════════════════════════
                            COMPONENT HIERARCHY
═══════════════════════════════════════════════════════════════════════════════

App.tsx
├── AuthProvider (context)
│   └── Routes
│       ├── /auth/login → Login.tsx
│       │   └── SocialAuthErrorBoundary
│       │       └── SocialAuthGroup
│       │           └── SocialAuthButton (Google)
│       │           └── SocialAuthButton (GitHub)
│       │
│       ├── /auth/signup → Signup.tsx
│       │   └── SocialAuthErrorBoundary
│       │       └── SocialAuthGroup
│       │           └── SocialAuthButton (Google)
│       │           └── SocialAuthButton (GitHub)
│       │
│       └── /auth/callback → SocialAuthCallback.tsx
│           ├── Loading State
│           ├── Success State
│           ├── Error State
│           └── AccountLinkingModal (conditional)

═══════════════════════════════════════════════════════════════════════════════
                            HOOKS DEPENDENCY GRAPH
═══════════════════════════════════════════════════════════════════════════════

SocialAuthButton
    └── useSocialAuth
        ├── useOAuthState
        │   ├── generateState() → crypto.randomUUID()
        │   ├── validateState() → sessionStorage.getItem()
        │   └── clearState() → sessionStorage.removeItem()
        │
        ├── @tanstack/react-query (useMutation)
        │   ├── initiateOAuth mutation
        │   └── handleCallback mutation
        │
        └── api (from lib/api.ts)
            ├── getSocialAuthUrl()
            └── handleSocialAuthCallback()

═══════════════════════════════════════════════════════════════════════════════
                               FILE STRUCTURE
═══════════════════════════════════════════════════════════════════════════════

frontend/src/
├── components/auth/
│   ├── SocialAuthButton.tsx         ← Individual provider button
│   ├── SocialAuthGroup.tsx          ← Group of provider buttons
│   ├── SocialAuthCallback.tsx       ← OAuth callback handler
│   ├── AccountLinkingModal.tsx      ← Account linking UI
│   └── SocialAuthErrorBoundary.tsx  ← Error boundary
│
├── hooks/
│   ├── useOAuthState.ts             ← CSRF state management
│   └── useSocialAuth.ts             ← OAuth flow logic
│
├── types/
│   └── social-auth.ts               ← TypeScript definitions
│
├── config/
│   └── social-auth-config.ts        ← Provider configuration
│
└── lib/
    └── api.ts (updated)             ← API client methods

═══════════════════════════════════════════════════════════════════════════════
```

## Key Points

### 1. State Token Lifecycle
```
Generate → Store in sessionStorage → Validate on callback → Clear (one-time use)
```

### 2. Provider Flow
```
Frontend → Backend → OAuth Provider → Backend → Frontend
```

### 3. Error Handling
```
OAuth Error → ErrorBoundary → User-friendly message → Retry/Fallback
```

### 4. Account Linking
```
Email exists → Modal → Verify password → Link accounts → Success
```

### 5. Token Management
```
OAuth tokens → JWT tokens → localStorage → Auto-refresh → Logout clear
```

---

This diagram shows the complete flow from user click to successful authentication! 🎯
