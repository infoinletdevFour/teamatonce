# Team Invitation System Implementation

## Overview
Complete team invitation system for Team@Once platform with email invitations, token-based acceptance, and integration with signup flow.

## Files Created

### 1. Type Definitions
**File**: `/src/types/invitation.ts`
- `InvitationStatus` enum (pending, accepted, revoked, expired)
- `TeamRole` type
- `Invitation` interface
- `SendInvitationData` interface
- `AcceptInvitationData` interface
- `InvitationDetails` interface (with company info)
- `ResendInvitationResponse` interface
- `RevokeInvitationResponse` interface

### 2. Service Layer
**File**: `/src/services/invitationService.ts`

**Functions**:
- `sendInvitation(companyId, data)` - Send team invitation via API
- `getInvitations(companyId)` - Get all company invitations
- `getInvitationByToken(token)` - Get invitation details for accept page
- `acceptInvitation(data)` - Accept invitation with token
- `declineInvitation(token)` - Decline invitation
- `revokeInvitation(companyId, invitationId)` - Cancel pending invitation
- `resendInvitation(companyId, invitationId)` - Resend invitation email
- `isInvitationExpired(expiresAt)` - Check expiration status
- `getTimeRemaining(expiresAt)` - Format time remaining

**API Endpoints Used**:
- `POST /api/v1/company/:companyId/invitations` - Send invitation
- `GET /api/v1/company/:companyId/invitations` - List invitations
- `GET /api/v1/invitations/:token` - Get invitation by token
- `POST /api/v1/invitations/:token/accept` - Accept invitation
- `POST /api/v1/invitations/:token/decline` - Decline invitation
- `DELETE /api/v1/company/:companyId/invitations/:id` - Revoke invitation
- `POST /api/v1/company/:companyId/invitations/:id/resend` - Resend invitation

### 3. UI Components

#### SendInvitationModal Component
**File**: `/src/components/invitation/SendInvitationModal.tsx`

**Features**:
- Modal form for sending invitations
- Fields: email, role, skills, hourly rate, custom message
- Validation and error handling
- Success/error notifications
- Integration with backend API
- Auto-close after successful send

**Props**:
- `isOpen: boolean` - Modal visibility state
- `onClose: () => void` - Close handler
- `companyId: string` - Company ID for invitation
- `onSuccess?: () => void` - Success callback

#### InvitationList Component
**File**: `/src/components/invitation/InvitationList.tsx`

**Features**:
- Display sent invitations with status badges
- Separate sections for pending and historical invitations
- Resend button for pending invitations
- Revoke button with confirmation
- Expiration countdown display
- Skills and custom message display
- Loading and error states
- Auto-refresh on actions

**Props**:
- `companyId: string` - Company ID
- `onUpdate?: () => void` - Update callback

**Status Display**:
- Pending (yellow badge) - with time remaining
- Accepted (green badge) - with acceptance date
- Revoked (red badge) - with revoked date
- Expired (gray badge)

#### Component Index
**File**: `/src/components/invitation/index.ts`
- Exports both components for easy importing

### 4. Pages

#### Accept Invitation Page
**File**: `/src/pages/invitation/Accept.tsx`

**URL**: `/invitation/accept?token=xxx`

**Features**:
- Load invitation details by token
- Display company information
- Show invitation details (role, skills, message)
- Expiration status and countdown
- Accept/Decline buttons
- Redirect logic:
  - Not logged in → signup with prefilled email
  - Logged in → accept and redirect to team page
- Error handling for invalid/expired tokens
- Beautiful gradient design matching platform theme

**Flow**:
1. User clicks invitation link in email
2. Page loads invitation details
3. If not logged in: redirects to signup
4. If logged in: shows accept/decline options
5. On accept: joins team and redirects to team page

### 5. Updated Files

#### Team Page Integration
**File**: `/src/pages/developer/Team.tsx` (Updated)

**Changes**:
- Added "View Invitations" button
- Integrated SendInvitationModal
- Integrated InvitationList component
- Toggle visibility for invitations section
- Refresh mechanism for invitation updates

**New Features**:
- View all sent invitations
- Send new invitations
- Manage pending invitations
- Track invitation status

#### Signup Flow Integration
**File**: `/src/pages/auth/Signup.tsx` (Updated)

**Changes**:
- Parse invitation token and email from URL params
- Pre-fill email field when from invitation
- Disable email field if from invitation
- Auto-set user type to 'developer' for invitations
- Accept invitation after successful signup
- Show invitation notice banner
- Updated title and description for invitation flow

**URL Params**:
- `?token=xxx` - Invitation token
- `?email=xxx` - Pre-filled email address

**Flow**:
1. User arrives from invitation link
2. Email is pre-filled and locked
3. User completes registration
4. Invitation is automatically accepted
5. User redirected to team page

## Features Implemented

### Email Invitation Flow
1. Team owner/admin sends invitation via modal
2. Backend sends email with invitation link
3. Recipient clicks link in email
4. Lands on accept invitation page
5. If not registered: completes signup
6. If registered: accepts directly
7. Joins team automatically

### Token-Based Security
- Unique token for each invitation
- Token validation on backend
- Expiration handling (configurable)
- One-time use tokens (after acceptance)

### Invitation Management
- **Send**: Create and send new invitations
- **Resend**: Resend to pending invitations
- **Revoke**: Cancel pending invitations
- **Track**: Monitor status changes
- **Expire**: Automatic expiration handling

### Status Tracking
- **Pending**: Waiting for acceptance
- **Accepted**: Successfully joined team
- **Revoked**: Cancelled by sender
- **Expired**: Time limit exceeded

### User Experience
- Beautiful UI with gradient designs
- Loading states and animations
- Error handling with clear messages
- Success notifications
- Responsive design
- Status badges and icons
- Time remaining countdown
- Role-based color coding

## Integration Points

### Backend API Requirements
The system expects the following backend endpoints:

1. **Send Invitation**
   - `POST /api/v1/company/:companyId/invitations`
   - Body: `{ email, role, customMessage?, skills?, hourlyRate? }`
   - Returns: Invitation object with token

2. **List Invitations**
   - `GET /api/v1/company/:companyId/invitations`
   - Returns: Array of invitations

3. **Get Invitation Details**
   - `GET /api/v1/invitations/:token`
   - Returns: Invitation with company details

4. **Accept Invitation**
   - `POST /api/v1/invitations/:token/accept`
   - Requires authentication
   - Adds user to team

5. **Decline Invitation**
   - `POST /api/v1/invitations/:token/decline`
   - Updates status to declined

6. **Revoke Invitation**
   - `DELETE /api/v1/company/:companyId/invitations/:id`
   - Only by sender

7. **Resend Invitation**
   - `POST /api/v1/company/:companyId/invitations/:id/resend`
   - Sends new email, extends expiration

### Email Template Required
Backend should send email with:
- Company name and logo
- Inviter name
- Role being offered
- Invitation link: `https://app.teamatonce.com/invitation/accept?token={token}`
- Expiration date

## Usage Examples

### Sending an Invitation
```typescript
import { SendInvitationModal } from '@/components/invitation';

<SendInvitationModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  companyId="company-123"
  onSuccess={() => {
    // Refresh invitations list
    loadInvitations();
  }}
/>
```

### Displaying Invitations
```typescript
import { InvitationList } from '@/components/invitation';

<InvitationList
  companyId="company-123"
  onUpdate={() => {
    // Handle updates
  }}
/>
```

### Using Invitation Service
```typescript
import invitationService from '@/services/invitationService';

// Send invitation
const invitation = await invitationService.sendInvitation('company-123', {
  email: 'developer@example.com',
  role: 'developer',
  skills: ['React', 'Node.js'],
  hourlyRate: 100,
  customMessage: 'Welcome to our team!'
});

// Get invitations
const invitations = await invitationService.getInvitations('company-123');

// Accept invitation
await invitationService.acceptInvitation({ token: 'invitation-token' });
```

## Testing Checklist

- [ ] Send invitation with valid data
- [ ] Send invitation with missing required fields
- [ ] View list of sent invitations
- [ ] Resend pending invitation
- [ ] Revoke pending invitation
- [ ] Accept invitation (logged in)
- [ ] Accept invitation (not logged in → signup)
- [ ] Decline invitation
- [ ] View expired invitation
- [ ] View invalid token
- [ ] Email field locked on signup from invitation
- [ ] Auto-accept after signup completion
- [ ] Redirect to team page after acceptance

## Configuration

### Environment Variables
Ensure these are set in your `.env` files:

```env
# API Base URL
VITE_API_BASE_URL=http://localhost:3001

# App URL for email links
VITE_APP_URL=http://localhost:3000
```

### Invitation Expiration
Default expiration is handled by backend. Typical values:
- Development: 7 days
- Production: 7-14 days

## Future Enhancements

1. **Bulk Invitations**: Send multiple invitations at once
2. **Custom Email Templates**: Personalized invitation emails
3. **Invitation Analytics**: Track open rates, acceptance rates
4. **Role Permissions**: Fine-grained permission selection
5. **Team Size Limits**: Prevent over-invitation based on plan
6. **Invitation History**: Detailed audit log
7. **Reminder Emails**: Auto-remind for pending invitations
8. **Custom Expiration**: Per-invitation expiration settings

## Troubleshooting

### Common Issues

**Issue**: Email field not pre-filled on signup
- **Solution**: Check URL parameters are being passed correctly

**Issue**: Invitation not accepted after signup
- **Solution**: Verify token is valid and API endpoint is correct

**Issue**: Cannot resend invitation
- **Solution**: Check invitation status is 'pending'

**Issue**: Invitation shows as expired but shouldn't be
- **Solution**: Verify server time sync and timezone handling

## Support

For backend implementation details, refer to:
- Backend API documentation: `/backend/src/modules/teamatonce.module.ts`
- Invitation controller: TBD by backend team
- Email service: TBD by backend team

---

**Implementation Date**: October 2024
**Status**: Complete ✓
**Developer**: Claude Code Assistant
