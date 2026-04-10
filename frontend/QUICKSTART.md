# Team@Once - Quick Start Guide

## 🚀 Getting Started in 5 Minutes

This guide will help you quickly understand and navigate the Team@Once routing and layout system.

## Step 1: Start the Development Server

```bash
cd frontend
npm install
npm run dev
```

The application will be available at: `http://localhost:3000`

## Step 2: Understand the Structure

### Three Main User Flows:

1. **Public User** → Landing Page, Auth Pages
2. **Client User** → Dashboard, Projects, Payments
3. **Developer User** → Dashboard, Projects, Performance

## Step 3: Test Authentication

### Quick Authentication Setup (Browser Console)

**For Client Testing:**
```javascript
localStorage.setItem('authToken', 'mock-token');
localStorage.setItem('userRole', 'client');
// Reload page
location.reload();
```

**For Developer Testing:**
```javascript
localStorage.setItem('authToken', 'mock-token');
localStorage.setItem('userRole', 'developer');
// Reload page
location.reload();
```

**To Logout:**
```javascript
localStorage.clear();
location.reload();
```

## Step 4: Navigate the Application

### As a Client:

1. **Visit:** `http://localhost:3000/client/dashboard`
   - See your projects overview
   - View stats and recent activity
   - Click on quick action cards

2. **Try Project Routes:** `http://localhost:3000/project/1/dashboard`
   - See project-specific layout
   - Notice breadcrumb navigation
   - View team members

### As a Developer:

1. **Visit:** `http://localhost:3000/developer/dashboard`
   - See your tasks and projects
   - View performance metrics
   - Check upcoming deadlines

2. **Try Project Routes:** `http://localhost:3000/project/1/dashboard`
   - Same project layout as client
   - Access communication hub
   - View files and team

## Step 5: Explore Layouts

### DashboardLayout Features:

- **Sidebar:** Collapsible navigation (click hamburger icon)
- **Header:** Search, notifications, user menu
- **Responsive:** Try resizing browser window
- **Mobile:** Click menu icon on mobile

### ProjectLayout Features:

- **Breadcrumbs:** Track your navigation path
- **Progress Bar:** See project completion status
- **Team View:** Quick view of team members with online status
- **Back Button:** Return to main dashboard

## Common Tasks

### Task 1: Test Different Roles

```javascript
// Test as Client
localStorage.setItem('authToken', 'mock-token');
localStorage.setItem('userRole', 'client');
window.location.href = '/client/dashboard';

// Test as Developer
localStorage.setItem('userRole', 'developer');
window.location.href = '/developer/dashboard';
```

### Task 2: Test Protected Routes

1. Clear localStorage: `localStorage.clear()`
2. Try visiting: `http://localhost:3000/client/dashboard`
3. Should redirect to login
4. Set auth token and try again

### Task 3: Test 404 Page

Visit any non-existent route:
```
http://localhost:3000/this-does-not-exist
```

Should see the animated 404 page.

### Task 4: Test Navigation

1. Login as client
2. Navigate to dashboard
3. Click on "My Projects" in sidebar
4. Click on a project
5. See project layout with breadcrumbs
6. Click different sections (Communication, Files, etc.)
7. Click "Back to Dashboard"

## File Organization

```
📁 Key Files to Know:

src/
├── App.tsx                    ← Main routing config
├── layouts/
│   ├── DashboardLayout.tsx    ← Main app layout
│   └── ProjectLayout.tsx      ← Project pages layout
├── components/auth/
│   └── ProtectedRoute.tsx     ← Auth wrapper
└── pages/
    ├── client/
    │   └── ClientDashboard.tsx     ← Client home
    ├── developer/
    │   └── DeveloperDashboard.tsx  ← Developer home
    ├── NotFound.tsx                ← 404 page
    └── PlaceholderPage.tsx         ← Temp pages
```

## Customization

### Change Navigation Items

**Client Navigation:**
Edit: `src/layouts/DashboardLayout.tsx`
Find: `clientNavItems` array
```typescript
const clientNavItems: NavItem[] = [
  { name: 'Dashboard', path: '/client/dashboard', icon: LayoutDashboard },
  // Add more items here
];
```

**Developer Navigation:**
Same file, find: `developerNavItems` array

**Project Navigation:**
Edit: `src/layouts/ProjectLayout.tsx`
Find: `projectNavItems` array

### Add a New Route

1. **Create the page component:**
   ```typescript
   // src/pages/client/NewPage.tsx
   export const NewPage: React.FC = () => {
     return <div>My New Page</div>;
   };
   ```

2. **Add route in App.tsx:**
   ```typescript
   <Route path="new-page" element={<NewPage />} />
   ```

3. **Add navigation link** (optional):
   Update `navItems` in `DashboardLayout.tsx`

### Change Theme Colors

All components use the same gradient:
```typescript
from-blue-600 to-purple-600
```

To change globally:
1. Search for `from-blue-600 to-purple-600` in all files
2. Replace with your gradient (e.g., `from-green-600 to-teal-600`)

## Troubleshooting

### Problem: Page shows loading spinner forever

**Solution:**
- Check browser console for errors
- Verify localStorage has `authToken` set
- Check network tab for failed requests

### Problem: Redirected to login immediately

**Solution:**
```javascript
// Check auth state
console.log(localStorage.getItem('authToken'));
console.log(localStorage.getItem('userRole'));

// Set if missing
localStorage.setItem('authToken', 'mock-token');
localStorage.setItem('userRole', 'client'); // or 'developer'
```

### Problem: Wrong dashboard appears

**Solution:**
- Check `userRole` in localStorage
- Should be either `'client'` or `'developer'`
- Must match the route you're trying to access

### Problem: Sidebar not appearing

**Solution:**
- Check screen size (may be collapsed on mobile)
- Click hamburger menu icon
- Check browser console for errors

### Problem: Styles not loading

**Solution:**
- Ensure Tailwind CSS is configured
- Check `index.css` is imported
- Run `npm run dev` again

## Development Workflow

### Typical Development Flow:

1. **Plan the page:**
   - Determine if it's client, developer, or project-specific
   - Sketch layout and components needed

2. **Create the component:**
   ```bash
   # Create new page file
   touch src/pages/client/MyNewPage.tsx
   ```

3. **Add to routing:**
   - Open `src/App.tsx`
   - Add route in appropriate section

4. **Test:**
   - Set authentication
   - Navigate to new route
   - Test responsive design
   - Check console for errors

5. **Add navigation:**
   - Update sidebar in appropriate layout
   - Add icon and badge if needed

## Testing Checklist

Before committing changes:

- [ ] Test on desktop (1920px+)
- [ ] Test on tablet (768px)
- [ ] Test on mobile (375px)
- [ ] Test as client user
- [ ] Test as developer user
- [ ] Test authentication flow
- [ ] Test 404 page
- [ ] Check browser console (no errors)
- [ ] Test navigation links
- [ ] Test logout functionality

## Keyboard Shortcuts (Future)

These can be implemented later:

- `Ctrl/Cmd + K` - Search
- `Ctrl/Cmd + B` - Toggle sidebar
- `Ctrl/Cmd + /` - Keyboard shortcuts help
- `Esc` - Close modals/dropdowns

## Next Steps

1. **Replace Placeholders:**
   - Implement actual page content
   - Connect to backend APIs
   - Add real data fetching

2. **Add Real Auth:**
   - Replace localStorage with JWT
   - Add refresh token logic
   - Implement proper logout

3. **Enhance UX:**
   - Add loading skeletons
   - Implement error boundaries
   - Add toast notifications
   - Create confirmation modals

4. **Add Features:**
   - Search functionality
   - Real-time notifications
   - File upload
   - Video calling

## Resources

- **ROUTING.md** - Complete routing documentation
- **IMPLEMENTATION_SUMMARY.md** - Full implementation details
- **ROUTE_MAP.md** - Visual route structure
- **Component JSDoc** - In-file documentation

## Getting Help

If you're stuck:

1. Check the documentation files above
2. Look at component JSDoc comments
3. Check browser console for errors
4. Verify authentication state
5. Try with a fresh localStorage (clear and set again)

## Quick Commands

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests (if configured)
npm test

# Lint code
npm run lint
```

## Important URLs

- **Development:** http://localhost:3000
- **Client Dashboard:** http://localhost:3000/client/dashboard
- **Developer Dashboard:** http://localhost:3000/developer/dashboard
- **Project View:** http://localhost:3000/project/1/dashboard
- **404 Page:** http://localhost:3000/404

---

**That's it! You're ready to start developing.** 🎉

For detailed information, check the other documentation files:
- ROUTING.md
- IMPLEMENTATION_SUMMARY.md
- ROUTE_MAP.md
