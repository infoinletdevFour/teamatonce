# Team@Once Frontend - Project Guidelines
## Universal Rules for All InfoInlet Projects
### React+Vite Frontend

---

## Project Structure

```
teamatonce/frontend/
├── src/
│   ├── components/          # Reusable UI components
│   ├── contexts/           # React contexts (Auth, Company, etc.)
│   ├── hooks/              # Custom React hooks
│   ├── layouts/            # Page layouts
│   ├── lib/                # Core utilities
│   │   ├── api.ts          # API client - ALWAYS use this
│   │   └── api-client.ts   # Axios instance configuration
│   ├── pages/              # All page components
│   │   ├── public/         # Public pages (landing, browse, pricing)
│   │   ├── auth/           # Authentication pages
│   │   ├── client/         # Client dashboard pages
│   │   ├── developer/      # Developer dashboard pages
│   │   ├── project/        # Project management pages
│   │   ├── payment/        # Payment pages
│   │   ├── contract/       # Contract pages
│   │   ├── workspace/      # Workspace pages
│   │   ├── invitation/     # Invitation pages
│   │   ├── onboarding/     # Onboarding pages
│   │   └── settings/       # Settings pages
│   ├── services/           # API service modules
│   ├── stores/             # Zustand stores
│   ├── types/              # TypeScript type definitions
│   └── utils/              # Utility functions
```

---

## 1. API Response Structure Alignment

### The Problem
Backend and frontend response handling must match exactly.

### Rules

**Backend MUST return consistent structure:**
```typescript
// CORRECT - Always wrap in data
return { data: users, message: 'Success' };

// WRONG - Raw return
return users;
```

**Frontend MUST consume correctly:**
```typescript
// If backend returns: { data: users }
const { data } = response.data;  // CORRECT

// WRONG - Double nesting when backend already wraps
const users = response.data.data.data;

// WRONG - No .data when backend wraps in data
const users = response.data;  // Missing .data
```

### What to Check
- Every API call in frontend - does it match backend return structure?
- Every controller return in backend - is it wrapped consistently?
- Look for `response.data.data` patterns - usually wrong
- Look for direct object access when backend wraps in `{ data: ... }`

---

## 2. CamelCase Everywhere (Except Database)

### The Rule
- **Database columns**: snake_case
- **Backend returns to frontend**: camelCase
- **Frontend receives**: camelCase
- **API responses/events**: camelCase

### Backend Must Transform
```typescript
// WRONG - Backend sending snake_case
{
  user_id: 1,
  first_name: "John",
  created_at: "2024-01-01"
}

// CORRECT - Backend sends camelCase
{
  userId: 1,
  firstName: "John",
  createdAt: "2024-01-01"
}
```

### Required Packages for Case & Pluralization
**ALWAYS use these npm packages. NEVER write custom functions.**

```bash
npm install change-case pluralize
npm install -D @types/pluralize  # TypeScript types
```

```typescript
// CORRECT - Use change-case package
import { camelCase, snakeCase, pascalCase, paramCase } from 'change-case';

camelCase('user_name');      // 'userName'
snakeCase('userName');       // 'user_name'
pascalCase('user_name');     // 'UserName'
paramCase('userName');       // 'user-name'

// CORRECT - Use pluralize package
import pluralize from 'pluralize';

pluralize('user');           // 'users'
pluralize.singular('users'); // 'user'
pluralize.isPlural('users'); // true
pluralize.isSingular('user');// true

// WRONG - Custom implementations
const toCamelCase = (str) => str.replace(/_([a-z])/g, ...);  // DON'T DO THIS
const toPlural = (str) => str + 's';                          // DON'T DO THIS
```

### What to Check
- Backend DTOs returning snake_case
- Entity column names leaking to responses
- WebSocket events sending snake_case
- Frontend interfaces expecting snake_case (should be camelCase)
- Custom case conversion functions (replace with `change-case`)
- Custom pluralization logic (replace with `pluralize`)

---

## 3. API Client Consistency

### The Rule
**NEVER use axios or fetch directly. ALWAYS use `lib/api` or `lib/api-client`.**

```typescript
// WRONG - Direct axios
import axios from 'axios';
const res = await axios.get('/users');

// WRONG - Raw fetch
const res = await fetch('/api/users');

// CORRECT - Always lib/api-client
import { apiClient } from '@/lib/api-client';
const res = await apiClient.get('/users');
```

### What to Check
- Any `import axios from 'axios'` outside of `lib/` folder
- Any `fetch(` calls outside of `lib/` folder
- Hardcoded URLs in code

---

## 4. POST Request Body - Never null

### The Rule
**Always pass `{}` for empty body, NEVER `null` or `undefined`.**

```typescript
// WRONG - Causes CORS errors
await apiClient.post('/endpoint', null);
await apiClient.post('/endpoint', undefined);
await apiClient.post('/endpoint');  // No body

// CORRECT - Always empty object
await apiClient.post('/endpoint', {});
```

### What to Check
- POST calls with `null` as second parameter
- POST calls with `undefined` as second parameter
- POST calls with no second parameter at all

---

## 5. File Upload Headers

### The Rule
**NEVER manually set Content-Type for FormData uploads. Browser handles it automatically.**

```typescript
// WRONG - Manual header breaks boundary
await apiClient.post('/upload', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});

// CORRECT - No Content-Type header
await apiClient.post('/upload', formData);
```

---

## 6. Navigation & Routing

### Rules

**A. Every page needs:**
1. Route in `App.tsx` or router config
2. Link/navigation to reach it
3. Menu item if it's a main feature

**B. Dynamic params must be passed:**
```typescript
// WRONG - Missing params
navigate('/projects');

// CORRECT - All params included
navigate(`/projects/${projectId}`);
```

### What to Check
1. **App.tsx** - All pages have routes defined?
2. **Sidebar/Menu** - All main features have menu items?
3. **Links** - Do they match route paths exactly?
4. **Dynamic routes** - Are all params passed?
5. **Protected routes** - Auth wrapper applied?
6. **404 fallback** - `<Route path="*" />` exists?

---

## 7. Build Must Pass

### The Rule
**`npm run build` must complete with ZERO errors before considering any feature complete.**

```bash
# Run this and fix ALL errors
npm run build
```

### Common Build Errors to Fix
- TypeScript type errors
- Missing imports
- Unused variables (if strict mode)
- Missing dependencies
- Invalid JSX
- Path alias issues

---

## 8. Mock/Fake/Dummy/Placeholder Data

### The Rule
**No mock data in production code. All data must come from real APIs.**

### Patterns to Find and Remove

**Hardcoded arrays:**
```typescript
// REMOVE
const users = [
  { id: 1, name: 'John Doe' },
  { id: 2, name: 'Jane Doe' },
];

// REPLACE WITH
const { data: users } = await apiClient.get('/users');
```

**Placeholder text:**
```typescript
// REMOVE these strings
"Lorem ipsum dolor sit amet"
"John Doe" / "Jane Doe"
"john@example.com" / "test@test.com"
"123-456-7890"
"Sample Company"
"Test Project"
```

### What to Check
Search entire codebase for:
- `mock` / `Mock` / `MOCK`
- `dummy` / `Dummy` / `DUMMY`
- `fake` / `Fake` / `FAKE`
- `placeholder` / `Placeholder`
- `Lorem ipsum`
- `John Doe` / `Jane Doe`
- `example.com` / `test@`
- `TODO` / `FIXME` / `HACK` / `XXX`
- `picsum.photos` / `placehold.co` / `via.placeholder`
- `Math.random()` for generating fake data
- Files in `src/data/` folder

---

## 9. Environment Variables

### The Rule
**`.env` API URL must include `/api/v1` - code should NOT add it.**

```bash
# CORRECT .env
VITE_API_URL=https://api.example.com/api/v1

# WRONG .env
VITE_API_URL=https://api.example.com
```

### Usage
```typescript
// CORRECT - Just the endpoint
await apiClient.get('/users');
await apiClient.post('/projects', data);

// WRONG - Adding version in code
await apiClient.get('/api/v1/users');
```

---

## 10. Available Services

| Service | Purpose | Import |
|---------|---------|--------|
| `dashboardService` | Dashboard stats, activity | `@/services/dashboardService` |
| `projectService` | Project CRUD, milestones, tasks, team | `@/services/projectService` |
| `milestoneService` | Milestone management | `@/services/milestoneService` |
| `paymentService` | Payments, invoices, subscriptions | `@/services/paymentService` |
| `contractService` | Contracts, signatures | `@/services/contractService` |
| `messageService` | Messages, conversations | `@/services/messageService` |
| `developerService` | Developer profiles, search | `@/services/developerService` |
| `gigService` | Gig listings, applications | `@/services/gigService` |
| `companyService` | Company management | `@/services/companyService` |
| `teamMemberService` | Team member operations | `@/services/teamMemberService` |
| `notificationService` | Notifications | `@/services/notificationService` |
| `invitationService` | Team invitations | `@/services/invitationService` |
| `workspaceService` | Workspace management | `@/services/workspaceService` |
| `supportService` | Support packages, FAQs | `@/services/supportService` |
| `publicService` | Public pages (no auth) | `@/services/publicService` |

---

## 11. Page Implementation Pattern

Every page should follow this pattern:

```typescript
import { useState, useEffect } from 'react';
import { useCompany } from '@/contexts/CompanyContext';
import { someService } from '@/services/someService';
import { Loader2 } from 'lucide-react';

const MyPage: React.FC = () => {
  const { company } = useCompany();
  const [data, setData] = useState<DataType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!company?.id) return;

      try {
        setLoading(true);
        const response = await someService.getData(company.id);
        setData(response);
      } catch (err: any) {
        setError(err.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [company?.id]);

  if (loading) return <Loader2 className="animate-spin" />;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {data.map(item => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  );
};
```

---

## 12. Type Definitions

All types are in `src/types/`:

| File | Types |
|------|-------|
| `project.ts` | Project, Task, ProjectStatus, TaskStatus, TeamMember |
| `payment.ts` | Payment, Invoice, Contract, Milestone, PaymentStatus |
| `invitation.ts` | Invitation, InvitationStatus, TeamRole, InvitationDetails |
| `milestone.ts` | Milestone, MilestoneStatus, MilestoneType |
| `company.ts` | Company types |
| `developer.ts` | Developer types |
| `workspace.ts` | Workspace types |

---

## Review Checklist Summary

| # | Area | What to Check |
|---|------|---------------|
| 1 | Response Structure | `response.data` vs `response.data.data` alignment |
| 2 | Case Convention | Backend returns camelCase, only DB uses snake_case |
| 3 | API Client | No direct axios/fetch, always use `lib/api-client` |
| 4 | POST Body | Always `{}`, never `null` or `undefined` |
| 5 | Upload Headers | No manual Content-Type for FormData |
| 6 | Navigation | Routes in App.tsx, menu items exist |
| 7 | Build | All builds pass with zero errors |
| 8 | Mock Data | No placeholder/fake/dummy data remaining |
| 9 | Env Variables | API URL includes `/api/v1`, code doesn't add it |

---

## When Reviewing This Project

1. Run build: `npm run build`
2. Check types in `src/types/` for proper schema
3. Search for mock/placeholder data
4. Verify all routes exist and have menu items
5. Check API calls match backend response structure
6. Confirm all snake_case converted to camelCase
7. Verify lib/api-client usage everywhere
8. Check POST calls have `{}` not `null`
9. Verify upload handlers don't set Content-Type
10. Confirm .env has `/api/v1` in URL

---

**Last Updated**: December 2025
**Maintained by**: InfoInlet Development Team
