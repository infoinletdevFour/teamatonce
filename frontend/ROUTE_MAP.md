# Team@Once - Route Map

## Visual Route Structure

```
Team@Once Application
│
├── 🌐 PUBLIC ROUTES (No Authentication Required)
│   ├── /                              → Landing Page
│   ├── /auth/login                    → Login Page
│   ├── /auth/signup                   → Signup Page
│   ├── /auth/forgot-password          → Password Recovery
│   └── /help                          → Help & Support
│
├── 👤 CLIENT ROUTES (Requires: role="client")
│   │   Layout: DashboardLayout (role="client")
│   │
│   ├── /client                        → Redirects to /client/dashboard
│   ├── /client/dashboard              → ✅ Client Dashboard (Implemented)
│   ├── /client/projects               → Projects List
│   ├── /client/projects/new           → New Project Wizard
│   ├── /client/messages               → Messages & Chat
│   ├── /client/contracts              → Contract Management
│   ├── /client/payments               → Payment History
│   ├── /client/settings               → Account Settings
│   └── /client/profile                → User Profile
│
├── 💻 DEVELOPER ROUTES (Requires: role="developer")
│   │   Layout: DashboardLayout (role="developer")
│   │
│   ├── /developer                     → Redirects to /developer/dashboard
│   ├── /developer/dashboard           → ✅ Developer Dashboard (Implemented)
│   ├── /developer/projects            → Assigned Projects
│   ├── /developer/team                → Team Collaboration
│   ├── /developer/messages            → Messages & Chat
│   ├── /developer/calendar            → Calendar & Schedule
│   ├── /developer/performance         → Performance Metrics
│   ├── /developer/settings            → Account Settings
│   └── /developer/profile             → Developer Profile
│
├── 📁 PROJECT ROUTES (Requires: authenticated)
│   │   Layout: ProjectLayout
│   │
│   ├── /project/:projectId            → Redirects to dashboard
│   ├── /project/:projectId/dashboard  → Project Overview
│   ├── /project/:projectId/communication-hub
│   │                                  → Real-time Chat & Video
│   ├── /project/:projectId/files      → Files & Documents
│   ├── /project/:projectId/team       → Team Members
│   ├── /project/:projectId/milestone-approval
│   │                                  → Milestone Approval
│   ├── /project/:projectId/contract-payment
│   │                                  → Contract & Payment
│   ├── /project/:projectId/payments   → Payment Tracking
│   └── /project/:projectId/project-definition
│                                      → Project Requirements
│
├── 💳 PAYMENT ROUTES (Requires: authenticated)
│   ├── /payment/checkout/:invoiceId   → Payment Checkout
│   ├── /payment/success               → Payment Success
│   └── /payment/failed                → Payment Failed
│
├── 📄 CONTRACT ROUTES (Requires: authenticated)
│   ├── /contract/:contractId/view     → View Contract
│   └── /contract/:contractId/sign     → Sign Contract
│
└── ❌ ERROR ROUTES
    ├── /404                           → ✅ 404 Not Found (Implemented)
    └── /*                             → Catch-all → 404
```

## Navigation Flow

### Client User Journey

```
1. Landing Page (/)
   ↓
2. Sign Up (/auth/signup) or Login (/auth/login)
   ↓
3. Client Dashboard (/client/dashboard)
   ↓
   ├── Create New Project (/client/projects/new)
   ├── View Projects (/client/projects)
   ├── Check Messages (/client/messages)
   └── Manage Payments (/client/payments)
   ↓
4. Project Details (/project/:id/*)
   ↓
   ├── Communication Hub (chat, video)
   ├── Review Milestones
   ├── Approve Deliverables
   └── Process Payments
```

### Developer User Journey

```
1. Landing Page (/)
   ↓
2. Login (/auth/login)
   ↓
3. Developer Dashboard (/developer/dashboard)
   ↓
   ├── View Assigned Projects (/developer/projects)
   ├── Check Calendar (/developer/calendar)
   ├── Track Performance (/developer/performance)
   └── Team Chat (/developer/team)
   ↓
4. Project Workspace (/project/:id/*)
   ↓
   ├── Communication Hub
   ├── Upload Files
   ├── Submit Milestones
   └── View Contract
```

## Layout Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                      App Component                          │
│                     (Router Setup)                          │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┬──────────────┐
        │              │              │              │
┌───────▼──────┐  ┌────▼─────┐  ┌────▼─────┐  ┌────▼─────┐
│   Public     │  │Protected │  │Protected │  │Protected │
│   Routes     │  │  Client  │  │Developer │  │ Project  │
│   (No Auth)  │  │  Routes  │  │  Routes  │  │  Routes  │
└──────────────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘
                       │              │              │
              ┌────────▼──────┐  ┌────▼──────┐  ┌───▼──────┐
              │ DashboardLayout│ │Dashboard  │  │ Project  │
              │  (role=client) │ │Layout     │  │ Layout   │
              │                │ │(developer)│  │          │
              └────────────────┘ └───────────┘  └──────────┘
```

## Authentication States

```
┌──────────────────┐
│  User Visits     │
│  Protected Route │
└────────┬─────────┘
         │
         ▼
    ┌────────┐
    │ Check  │
    │ Auth   │
    └───┬────┘
        │
    ┌───▼───┐
    │Token? │
    └───┬───┘
        │
   ┌────▼────┐           ┌──────────────┐
   │  Yes    │           │     No       │
   └────┬────┘           └──────┬───────┘
        │                       │
        ▼                       ▼
  ┌──────────┐          ┌──────────────┐
  │Check Role│          │Redirect to   │
  └────┬─────┘          │  /auth/login │
       │                │ (save return │
   ┌───▼────┐           │     URL)     │
   │Matches?│           └──────────────┘
   └───┬────┘
       │
  ┌────▼────┐           ┌──────────────┐
  │  Yes    │           │     No       │
  └────┬────┘           └──────┬───────┘
       │                       │
       ▼                       ▼
  ┌──────────┐          ┌──────────────┐
  │Show Page │          │Redirect to   │
  └──────────┘          │User Dashboard│
                        └──────────────┘
```

## Component Relationships

```
App.tsx
├── Uses: QueryClientProvider
├── Uses: Router (BrowserRouter)
│
├── Imports: Layouts
│   ├── DashboardLayout
│   └── ProjectLayout
│
├── Imports: Components
│   └── ProtectedRoute
│
├── Imports: Pages
│   ├── LandingPage
│   ├── Auth Pages (Login, Signup, ForgotPassword)
│   ├── ClientDashboard
│   ├── DeveloperDashboard
│   ├── NotFound
│   └── PlaceholderPage
│
└── Defines: Routes
    ├── Public Routes
    ├── Client Routes (wrapped in ProtectedRoute + DashboardLayout)
    ├── Developer Routes (wrapped in ProtectedRoute + DashboardLayout)
    ├── Project Routes (wrapped in ProtectedRoute + ProjectLayout)
    ├── Payment Routes (wrapped in ProtectedRoute)
    ├── Contract Routes (wrapped in ProtectedRoute)
    └── Error Routes
```

## Data Flow

```
┌─────────────────┐
│  User Action    │
│  (Navigation)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  React Router   │
│  Route Matching │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ ProtectedRoute  │
│ Authentication  │
│     Check       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐      ┌──────────────┐
│  Layout         │──────│  Sidebar     │
│  Component      │      │  Navigation  │
└────────┬────────┘      └──────────────┘
         │
         │               ┌──────────────┐
         ├───────────────│  Header      │
         │               │  (Search,    │
         │               │  Notifs)     │
         │               └──────────────┘
         │
         ▼
┌─────────────────┐
│  Page           │
│  Component      │
│  (Content)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  API Calls      │
│  (useQuery,     │
│   useMutation)  │
└─────────────────┘
```

## Route Protection Matrix

| Route Pattern           | Auth Required | Role Required | Layout Used       |
|------------------------|---------------|---------------|-------------------|
| `/`                    | ❌ No         | None          | None              |
| `/auth/*`              | ❌ No         | None          | None              |
| `/client/*`            | ✅ Yes        | client        | DashboardLayout   |
| `/developer/*`         | ✅ Yes        | developer     | DashboardLayout   |
| `/project/:id/*`       | ✅ Yes        | Any           | ProjectLayout     |
| `/payment/*`           | ✅ Yes        | Any           | None              |
| `/contract/*`          | ✅ Yes        | Any           | None              |
| `/help`                | ❌ No         | None          | None              |
| `/*` (404)             | ❌ No         | None          | None              |

## Implementation Status

| Component              | Status | File Path                              |
|-----------------------|--------|----------------------------------------|
| DashboardLayout       | ✅     | src/layouts/DashboardLayout.tsx        |
| ProjectLayout         | ✅     | src/layouts/ProjectLayout.tsx          |
| ProtectedRoute        | ✅     | src/components/auth/ProtectedRoute.tsx |
| NotFound              | ✅     | src/pages/NotFound.tsx                 |
| PlaceholderPage       | ✅     | src/pages/PlaceholderPage.tsx          |
| ClientDashboard       | ✅     | src/pages/client/ClientDashboard.tsx   |
| DeveloperDashboard    | ✅     | src/pages/developer/DeveloperDashboard.tsx |
| App Routing           | ✅     | src/App.tsx                            |

**Legend:**
- ✅ Implemented
- 🔄 Placeholder (uses PlaceholderPage component)
- ❌ Not Started

## Quick Reference

### To Test Client Routes:
```javascript
localStorage.setItem('authToken', 'mock-token');
localStorage.setItem('userRole', 'client');
// Navigate to: http://localhost:3000/client/dashboard
```

### To Test Developer Routes:
```javascript
localStorage.setItem('authToken', 'mock-token');
localStorage.setItem('userRole', 'developer');
// Navigate to: http://localhost:3000/developer/dashboard
```

### To Test Logout:
```javascript
localStorage.removeItem('authToken');
localStorage.removeItem('userRole');
// Try accessing protected routes - should redirect to login
```

---

**Last Updated:** October 2024
**Total Routes:** 40+
**Implemented Pages:** 7
**Placeholder Pages:** 30+
