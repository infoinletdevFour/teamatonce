# Team Management Page - Quick Start Guide

## File Location
```
/frontend/src/pages/settings/TeamManagement.tsx
```

## Import and Use

### In your React Router configuration:
```tsx
import TeamManagement from '@/pages/settings/TeamManagement';

// Add to your routes
{
  path: '/settings/team',
  element: <TeamManagement />,
}
```

### Direct import in a component:
```tsx
import TeamManagement from '@/pages/settings/TeamManagement';

function SettingsPage() {
  return <TeamManagement />;
}
```

## Features Overview

### 1. **Company Selection** (Multi-Company Support)
- Automatically displays selector if user has multiple companies
- Switches data when different company is selected

### 2. **Stats Dashboard**
- Total Members count
- Active Members count
- Pending Invitations count

### 3. **Member Management**
- View all team members in a responsive grid
- Filter by role (Owner, Admin, Developer, Designer, QA)
- Edit member roles (Owner/Admin only)
- Remove members (Owner/Admin only)

### 4. **Invitation System**
- Send invitations to new team members
- View pending invitations
- Resend expired invitations
- Revoke pending invitations

### 5. **Role-Based Access Control**
- **Owners & Admins** can:
  - Invite new members
  - Edit member roles
  - Remove members
- **All Members** can:
  - View team members
  - See member details

## User Workflow

### For Company Owners/Admins:
1. **View Team**: See all team members at a glance
2. **Invite Members**: Click "Invite Member" button
   - Enter email address
   - Select role
   - Add skills (optional)
   - Set hourly rate (optional)
   - Add custom message (optional)
3. **Manage Members**:
   - Click Edit on any member card to change their role
   - Click Remove to remove them from the team (with confirmation)
4. **Track Invitations**: Scroll to "Pending Invitations" section
   - See all outstanding invitations
   - Resend if needed
   - Revoke if necessary

### For Regular Members:
1. **View Team**: See all team members
2. **Filter**: Use role filter to find specific team members
3. **Refresh**: Click refresh icon to update data

## Component Dependencies

### Required Files (Already Exist):
✅ `/components/team/TeamMemberCard.tsx`
✅ `/components/invitation/SendInvitationModal.tsx`
✅ `/components/invitation/InvitationList.tsx`
✅ `/components/ui/Modal.tsx`
✅ `/services/companyService.ts`
✅ `/types/company.ts`
✅ `/types/teamMember.ts`

### Required npm Packages:
✅ `framer-motion` - For animations
✅ `lucide-react` - For icons
✅ `sonner` - For toast notifications
✅ `react` - Core React library

## API Endpoints Used

The component uses these endpoints from `companyService`:

1. **GET** `/api/v1/company` - Get user's companies
2. **GET** `/api/v1/company/:companyId/members` - Get company members
3. **GET** `/api/v1/company/:companyId/stats` - Get company statistics
4. **GET** `/api/v1/company/:companyId/members/me` - Get current user's membership
5. **PUT** `/api/v1/company/:companyId/members/:memberId` - Update member
6. **DELETE** `/api/v1/company/:companyId/members/:memberId` - Remove member

## Permission Requirements

### Backend Requirements:
Ensure your backend properly validates:
- User has owner or admin role before allowing edits
- Cannot modify owner role
- Cannot remove owner
- User belongs to the company they're managing

### Frontend Permissions:
The component checks `currentUserMembership.role` to determine:
- Show/hide "Invite Member" button
- Enable/disable edit actions
- Enable/disable remove actions

## Customization

### Change Color Scheme:
Find and replace gradient classes:
```tsx
// Current: Blue-to-Purple
from-blue-600 to-purple-600

// Example alternatives:
from-green-600 to-teal-600   // Green theme
from-pink-600 to-rose-600    // Pink theme
from-indigo-600 to-blue-600  // Indigo theme
```

### Adjust Grid Columns:
```tsx
// Current: 3 columns on desktop
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"

// 4 columns on desktop:
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"

// 2 columns max:
className="grid grid-cols-1 md:grid-cols-2 gap-6"
```

### Add More Filters:
In the filter section, add more dropdowns:
```tsx
<div>
  <label className="block text-sm font-bold text-gray-700 mb-2">
    Status
  </label>
  <select
    value={statusFilter}
    onChange={(e) => setStatusFilter(e.target.value)}
    className="w-full px-4 py-2 bg-gray-50 border-2 border-gray-200 rounded-xl..."
  >
    <option value="all">All Status</option>
    <option value="active">Active</option>
    <option value="inactive">Inactive</option>
  </select>
</div>
```

## Troubleshooting

### Issue: "No Company Found" appears
**Solution**: User needs to create a company first through the onboarding flow

### Issue: Stats showing "0" for everything
**Solution**: Check backend `/company/:companyId/stats` endpoint is working

### Issue: Cannot invite members
**Possible Causes**:
1. User is not owner or admin
2. Backend invitation endpoint not working
3. Missing required fields in invitation form

### Issue: Members not loading
**Solution**: 
1. Check console for API errors
2. Verify `/company/:companyId/members` endpoint
3. Check user has access to the company

### Issue: Cannot edit/remove members
**Possible Causes**:
1. User is not owner or admin (check permissions)
2. Trying to edit/remove owner (not allowed)
3. Backend validation preventing action

## Testing the Component

### Manual Testing Checklist:
- [ ] Page loads without errors
- [ ] Stats display correctly
- [ ] Members grid displays
- [ ] Filter works (select each role)
- [ ] Invite modal opens (as owner/admin)
- [ ] Can send invitation
- [ ] Invitation appears in list
- [ ] Can resend invitation
- [ ] Can revoke invitation
- [ ] Edit modal opens
- [ ] Can change member role
- [ ] Cannot edit owner
- [ ] Remove confirmation works
- [ ] Member removed successfully
- [ ] Cannot remove owner
- [ ] Refresh button works
- [ ] Company switcher works (if multiple)

## Best Practices

### Do's:
✅ Use this component inside a protected route
✅ Ensure user is authenticated before loading
✅ Handle company creation flow before this page
✅ Implement proper backend validation
✅ Use error boundaries to catch component errors

### Don'ts:
❌ Don't allow unauthenticated access
❌ Don't bypass role-based permission checks
❌ Don't allow owner role modification
❌ Don't skip confirmation on destructive actions
❌ Don't expose sensitive user data in network requests

## Support & Questions

For questions about:
- **Component usage**: See this document
- **API integration**: Check `/services/companyService.ts`
- **Styling**: Review Tailwind classes in component
- **Types**: Check `/types/company.ts` and `/types/teamMember.ts`

---

**Quick Reference**:
- File: `/frontend/src/pages/settings/TeamManagement.tsx`
- Lines: 704
- Dependencies: 4 components, 1 service, 2 type files
- Features: Members, Invitations, Roles, Permissions, Filtering
- Status: ✅ Ready for Use
