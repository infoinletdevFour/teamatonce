# Company Onboarding - Quick Start Guide

## 5-Minute Integration

### Step 1: Add to Router (30 seconds)

```tsx
import { CompanyOnboarding } from '@/pages';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

// Add this route to your router
<Route
  path="/onboarding/company"
  element={
    <ProtectedRoute>
      <CompanyOnboarding />
    </ProtectedRoute>
  }
/>
```

### Step 2: Update Signup Redirect (30 seconds)

```tsx
// In your Signup component
const handleSignup = async () => {
  const user = await signup(email, password, name, role);
  navigate('/onboarding/company'); // Add this line
};
```

### Step 3: Test (2 minutes)

1. Sign up as a new user
2. You'll be redirected to company onboarding
3. Select account type (Solo/Team/Company)
4. Fill in basic information
5. Review and submit
6. You'll be redirected to your dashboard

**That's it!** 🎉

---

## Quick Reference

### Import
```tsx
import { CompanyOnboarding } from '@/pages';
```

### Route
```tsx
/onboarding/company
```

### Navigation After Completion
```tsx
Client → /client/dashboard
Developer → /developer/team
```

### Required User State
- User must be authenticated (`useAuth()`)
- User must have a role (client or developer)

---

## Account Types

| Type | Users | Fields Required | Use Case |
|------|-------|-----------------|----------|
| **Solo** | 1 | Display Name | Individual freelancers |
| **Team** | 2-10 | Display Name, Company Name | Small teams & startups |
| **Company** | 11+ | Display Name, Company Name | Large organizations |

---

## Form Fields

### Required
- ✅ Display Name (always)
- ✅ Company Name (Team/Company only)

### Optional
- 📧 Business Email
- 🌐 Website
- 🏢 Business Type

---

## Common Issues

### Issue: Component not rendering
**Solution**: Make sure user is authenticated and AuthProvider is wrapping your app

### Issue: API errors
**Solution**: Check that backend API is running and endpoints are configured correctly

### Issue: Navigation not working after submission
**Solution**: Verify dashboard routes exist: `/client/dashboard` and `/developer/team`

---

## Customization

### Change account types
Edit `ACCOUNT_TYPES` array in `CompanyOnboarding.tsx`

### Add more fields
Add inputs in `Step2Content` with React Hook Form

### Modify styling
Update Tailwind classes throughout the component

### Change navigation
Modify the `onSubmit` function navigation logic

---

## Complete Example (Copy & Paste)

```tsx
// In your App.tsx or main router file
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CompanyOnboarding } from '@/pages';
import { AuthProvider } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Toaster } from 'sonner';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Onboarding */}
          <Route
            path="/onboarding/company"
            element={
              <ProtectedRoute>
                <CompanyOnboarding />
              </ProtectedRoute>
            }
          />

          {/* Dashboards */}
          <Route path="/client/dashboard" element={<ClientDashboard />} />
          <Route path="/developer/team" element={<DeveloperTeam />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors />
    </AuthProvider>
  );
}
```

---

## Need More Help?

- 📖 **Full Docs**: See `README.md` in the same directory
- 💻 **Examples**: Check `INTEGRATION_EXAMPLE.tsx` for 8 different patterns
- 📋 **Summary**: Read `COMPANY_ONBOARDING_COMPLETE.md` in project root

---

**You're all set!** The component is production-ready and fully documented.
