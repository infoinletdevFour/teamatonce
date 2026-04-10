# ProtectedRoute Component - Flow Diagram

## Component Flow Chart

```
┌─────────────────────────────────────────────────────────────────┐
│                     USER ACCESSES ROUTE                         │
│                    <ProtectedRoute>                             │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
                   ┌─────────────────────┐
                   │  Check isLoading    │
                   └──────────┬──────────┘
                              │
              ┌───────────────┴───────────────┐
              │                               │
              ▼                               ▼
         isLoading                       isLoading
          = true                          = false
              │                               │
              ▼                               ▼
    ┌──────────────────┐          ┌──────────────────────┐
    │  LOADING SCREEN  │          │ Check Authentication │
    │                  │          └──────────┬───────────┘
    │ • Shield icon    │                     │
    │ • Spinner        │         ┌───────────┴────────────┐
    │ • Progress dots  │         │                        │
    └──────────────────┘         ▼                        ▼
                          isAuthenticated          isAuthenticated
                              = false                  = true
                                 │                        │
                                 ▼                        ▼
                      ┌────────────────────┐   ┌──────────────────────┐
                      │ REDIRECT TO LOGIN  │   │ Check requiredRole   │
                      │                    │   └──────────┬───────────┘
                      │ • Save return URL  │              │
                      │ • Navigate to      │   ┌──────────┴──────────┐
                      │   /auth/login      │   │                     │
                      └────────────────────┘   ▼                     ▼
                                          No role              Has requiredRole
                                          required                    │
                                              │              ┌────────┴────────┐
                                              │              │                 │
                                              │              ▼                 ▼
                                              │         user.role          user.role
                                              │         matches            mismatch
                                              │              │                 │
                                              │              │                 ▼
                                              │              │      ┌──────────────────┐
                                              │              │      │ ACCESS DENIED    │
                                              │              │      │                  │
                                              │              │      │ • Lock icon      │
                                              │              │      │ • Error message  │
                                              │              │      │ • Show both roles│
                                              │              │      │ • Redirect btn   │
                                              │              │      └────────┬─────────┘
                                              │              │               │
                                              │              │               ▼
                                              │              │      Redirect to user's
                                              │              │      role-specific
                                              │              │      dashboard
                                              │              │
                                              └──────────────┴───────────────┐
                                                             │
                                                             ▼
                                              ┌──────────────────────────────┐
                                              │   RENDER CHILDREN ✓          │
                                              │                              │
                                              │   User is authenticated      │
                                              │   and authorized             │
                                              └──────────────────────────────┘
```

## State Matrix

| isLoading | isAuthenticated | user | requiredRole | user.role matches | Result |
|-----------|----------------|------|--------------|------------------|--------|
| `true` | - | - | - | - | **Loading Screen** |
| `false` | `false` | `null` | - | - | **Redirect to Login** |
| `false` | `true` | ✓ | `undefined` | - | **Render Children** |
| `false` | `true` | ✓ | `'client'` | ✓ | **Render Children** |
| `false` | `true` | ✓ | `'client'` | ✗ | **Access Denied** |

## User Journey Examples

### Journey 1: Successful Access (No Role Required)

```
1. User → /profile
2. ProtectedRoute checks auth
3. isLoading: true → Shows loading screen (0.5s)
4. Auth verified → isAuthenticated: true
5. No requiredRole → Access granted
6. Renders Profile component ✓
```

### Journey 2: Successful Access (With Correct Role)

```
1. Client user → /client/dashboard
2. ProtectedRoute checks auth
3. isLoading: true → Shows loading screen (0.5s)
4. Auth verified → isAuthenticated: true, user.role: 'client'
5. requiredRole: 'client' → Role matches ✓
6. Renders ClientDashboard component ✓
```

### Journey 3: Unauthenticated User

```
1. Guest → /client/dashboard
2. ProtectedRoute checks auth
3. isLoading: true → Shows loading screen (0.3s)
4. No token found → isAuthenticated: false
5. Save return URL: '/client/dashboard'
6. Redirect to /auth/login
7. User logs in
8. Redirect back to /client/dashboard ✓
```

### Journey 4: Wrong Role

```
1. Developer user → /client/dashboard
2. ProtectedRoute checks auth
3. isLoading: true → Shows loading screen (0.5s)
4. Auth verified → isAuthenticated: true, user.role: 'developer'
5. requiredRole: 'client' → Role mismatch ✗
6. Shows Access Denied page (2s)
7. Auto-redirect to /developer/dashboard
```

## Component Dependencies Flow

```
┌────────────────────┐
│   App.tsx          │
│  ┌──────────────┐  │
│  │ AuthProvider │  │
│  └──────┬───────┘  │
│         │          │
│  ┌──────▼───────┐  │
│  │   Router     │  │
│  │              │  │
│  │  ┌────────┐  │  │
│  │  │ Routes │  │  │
│  │  └───┬────┘  │  │
│  │      │       │  │
│  │  ┌───▼────────────────────┐
│  │  │  ProtectedRoute        │
│  │  │                        │
│  │  │  Uses:                 │
│  │  │  • useAuth()          │
│  │  │  • useLocation()      │
│  │  │                        │
│  │  │  Renders:              │
│  │  │  • LoadingScreen       │
│  │  │  • AccessDenied        │
│  │  │  • Navigate            │
│  │  │  • children            │
│  │  └────────────────────────┘
│  └──────────────┘  │
└────────────────────┘
```

## AuthContext Integration

```
AuthContext provides:
├── user: User | null
│   ├── id: string
│   ├── email: string
│   ├── name: string
│   └── role: 'client' | 'developer' | 'designer' | 'project-manager' | 'admin'
│
├── isAuthenticated: boolean
├── isLoading: boolean
│
└── Methods:
    ├── login(email, password)
    ├── signup(email, password, name, role)
    ├── logout()
    └── refreshUser()

ProtectedRoute uses:
├── user → Check existence & role
├── isAuthenticated → Check auth status
└── isLoading → Show loading state
```

## Animation Timeline

### Loading Screen
```
0ms    - Component mounts
0ms    - Opacity: 0, Scale: 0.9
300ms  - Opacity: 1, Scale: 1 (fade in)
500ms  - Text appears (staggered)
900ms  - Progress dots animate (loop)
```

### Access Denied
```
0ms    - Component mounts
0ms    - Opacity: 0, Scale: 0.9
300ms  - Opacity: 1, Scale: 1 (card appears)
500ms  - Icon pops (scale: 0 → 1)
800ms  - Title fades in
1000ms - Description fades in
1200ms - Button fades in
1800ms - Help text fades in
```

## Error Handling

```
┌─────────────────────┐
│  useAuth() called   │
└──────────┬──────────┘
           │
     ┌─────▼─────┐
     │ Throws?   │
     └─────┬─────┘
           │
    ┌──────┴──────┐
    │             │
    ▼             ▼
  Error        Success
    │             │
    ▼             │
Error caught      │
by ErrorBoundary  │
    │             │
    └─────────────┘
          │
          ▼
    Component
    continues
```

## Role-Based Dashboard Mapping

```typescript
const DASHBOARD_ROUTES = {
  client: '/client/dashboard',
  developer: '/developer/dashboard',
  designer: '/designer/dashboard',
  'project-manager': '/project-manager/dashboard',
  admin: '/admin/dashboard',
};

// Used when user tries to access wrong role's page
function getRedirectPath(userRole: string): string {
  return DASHBOARD_ROUTES[userRole] || '/';
}
```

## Performance Considerations

```
Initial Load:
├── AuthContext checks token (async)
│   └── ~100-300ms API call
├── ProtectedRoute shows loading
│   └── 300ms minimum (smooth UX)
└── Total perceived load: ~400-600ms

Subsequent Navigation:
├── AuthContext state cached
├── No API call needed
├── Instant role check
└── Total load: ~0ms (cached)
```

## Security Flow

```
1. User attempts access
   ↓
2. Check localStorage for token
   ↓
3. If token exists:
   ├─→ Validate with API (getCurrentUser)
   ├─→ Check expiration
   ├─→ Auto-refresh if needed
   └─→ Set user state
   ↓
4. ProtectedRoute checks:
   ├─→ isAuthenticated (token valid)
   ├─→ user exists
   └─→ role matches (if required)
   ↓
5. Grant or deny access
```

## Best Practices Checklist

✅ Always wrap routes, not individual components
✅ Use requiredRole for sensitive sections
✅ Preserve return URLs for better UX
✅ Handle loading states gracefully
✅ Provide clear error messages
✅ Test all role combinations
✅ Keep AuthContext at app root
✅ Use TypeScript for type safety

---

**File**: `/Users/islamnymul/DEVELOP/INFOINLET-PROD/teamatonce/frontend/src/components/auth/ProtectedRoute.tsx`
