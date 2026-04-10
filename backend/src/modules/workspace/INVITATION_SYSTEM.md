# Deskive Workspace Invitation System

Complete backend invitation service for Deskive workspaces, based on the TeamAtOnce implementation.

## 📁 File Structure

```
backend/src/modules/workspace/
├── dto/
│   └── invitation.dto.ts              # DTOs with validation decorators
├── invitation.service.ts              # Core invitation business logic
├── workspace.controller.ts            # Authenticated workspace endpoints
├── invitation-public.controller.ts    # Public invitation endpoints
├── workspace.module.ts                # Module configuration
└── INVITATION_SYSTEM.md              # This documentation
```

## 🎯 Features

- ✅ **Create Invitation**: Send workspace invitations via email
- ✅ **List Invitations**: View all workspace invitations with filters
- ✅ **View Invitation**: Public endpoint to preview invitation details
- ✅ **Accept Invitation**: Authenticated users accept and join workspace
- ✅ **Decline Invitation**: Decline invitation with optional reason
- ✅ **Resend Invitation**: Resend invitation email (auto-renews if expired)
- ✅ **Cancel Invitation**: Cancel pending invitations
- ✅ **Token-based Security**: Secure 64-character random tokens
- ✅ **Auto-expiration**: 7-day expiration with auto-renewal on resend
- ✅ **Email Notifications**: Automated invitation emails via Fluxez
- ✅ **Permission Checks**: Owner/admin-only invitation management
- ✅ **Member Creation**: Auto-create workspace member on acceptance

## 📋 API Endpoints

### Workspace Endpoints (Authenticated)

#### Create Invitation
```http
POST /workspace/:workspaceId/invitations
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "john.doe@example.com",
  "name": "John Doe",
  "role": "member",
  "message": "Join our workspace!",
  "initialPermissions": ["view_workspace", "manage_own_tasks"]
}
```

#### List Invitations
```http
GET /workspace/:workspaceId/invitations?status=pending
Authorization: Bearer <token>
```

#### Resend Invitation
```http
POST /workspace/:workspaceId/invitations/:invitationId/resend
Authorization: Bearer <token>
```

#### Cancel Invitation
```http
DELETE /workspace/:workspaceId/invitations/:invitationId
Authorization: Bearer <token>
```

### Public Endpoints

#### Get Invitation by Token (Public)
```http
GET /invitations/:token
```

Response:
```json
{
  "success": true,
  "invitation": {
    "id": "uuid",
    "email": "john.doe@example.com",
    "name": "John Doe",
    "role": "member",
    "message": "Join our workspace!",
    "expiresAt": "2025-11-03T12:00:00.000Z",
    "workspace": {
      "id": "uuid",
      "name": "My Workspace",
      "description": "A collaborative workspace"
    },
    "invitedBy": {
      "name": "Jane Smith",
      "email": "jane@example.com"
    }
  }
}
```

#### Accept Invitation (Authenticated)
```http
POST /invitations/:token/accept
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Doe",
  "bio": "Project manager",
  "phone": "+1-555-123-4567",
  "location": "San Francisco, CA",
  "timezone": "America/Los_Angeles"
}
```

Response:
```json
{
  "success": true,
  "message": "Invitation accepted successfully",
  "workspaceMember": {
    "id": "uuid",
    "workspaceId": "uuid",
    "userId": "usr_123",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "role": "member",
    "status": "active",
    "joinedAt": "2025-10-27T12:00:00.000Z"
  }
}
```

#### Decline Invitation (Public)
```http
POST /invitations/:token/decline
Content-Type: application/json

{
  "declineReason": "Currently not available"
}
```

## 🗄️ Database Schema

The invitation system requires the following database tables:

### workspace_invitations
```sql
CREATE TABLE workspace_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  invited_by VARCHAR NOT NULL,
  email VARCHAR NOT NULL,
  name VARCHAR,
  role VARCHAR NOT NULL,
  message TEXT,
  initial_permissions JSONB DEFAULT '[]',
  status VARCHAR NOT NULL DEFAULT 'pending',
  token VARCHAR NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  sent_count INTEGER DEFAULT 1,
  last_sent_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  declined_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  decline_reason TEXT,
  member_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_workspace_invitations_workspace_id ON workspace_invitations(workspace_id);
CREATE INDEX idx_workspace_invitations_email ON workspace_invitations(email);
CREATE INDEX idx_workspace_invitations_token ON workspace_invitations(token);
CREATE INDEX idx_workspace_invitations_status ON workspace_invitations(status);
```

### workspace_members
```sql
CREATE TABLE workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  user_id VARCHAR NOT NULL,
  name VARCHAR NOT NULL,
  email VARCHAR NOT NULL,
  avatar_url VARCHAR,
  bio TEXT,
  role VARCHAR NOT NULL,
  permissions JSONB DEFAULT '[]',
  is_owner BOOLEAN DEFAULT FALSE,
  status VARCHAR DEFAULT 'active',
  phone VARCHAR,
  location VARCHAR,
  timezone VARCHAR DEFAULT 'UTC',
  is_online BOOLEAN DEFAULT FALSE,
  last_seen_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_workspace_members_workspace_id ON workspace_members(workspace_id);
CREATE INDEX idx_workspace_members_user_id ON workspace_members(user_id);
CREATE INDEX idx_workspace_members_email ON workspace_members(email);
```

### workspaces
```sql
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id VARCHAR NOT NULL,
  name VARCHAR NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 📝 DTOs

### CreateInvitationDto
```typescript
{
  email: string;              // Required, validated email
  name?: string;              // Optional, 2-100 chars
  role: WorkspaceMemberRole;  // Required: owner, admin, member, viewer
  message?: string;           // Optional, max 1000 chars
  initialPermissions?: string[]; // Optional array of permission strings
}
```

### AcceptInvitationDto
```typescript
{
  name?: string;      // Optional, 2-100 chars
  bio?: string;       // Optional, max 500 chars
  phone?: string;     // Optional
  location?: string;  // Optional
  timezone?: string;  // Optional
}
```

### DeclineInvitationDto
```typescript
{
  declineReason?: string; // Optional, max 500 chars
}
```

## 🔐 Security & Permissions

### Permission Levels

**Create/Manage Invitations:**
- Workspace owners (always allowed)
- Workspace admins (allowed)
- Members/viewers (denied)

**Accept Invitations:**
- Any authenticated user with matching email

**Decline Invitations:**
- Anyone with the token (no auth required)

**View Invitations:**
- Anyone with the token (no auth required)

### Token Security
- 64-character hex token (crypto.randomBytes(32))
- Unique per invitation
- Auto-expires after 7 days
- New token generated on resend if expired

### Email Validation
- Email match required for acceptance
- Case-insensitive comparison
- Prevents invitation hijacking

## 🔄 Invitation Workflow

```
1. Create Invitation
   ↓
2. Email Sent to Invitee
   ↓
3. Invitee Clicks Link
   ↓
4. View Invitation Details (Public)
   ↓
5. User Logs In / Signs Up
   ↓
6. Accept Invitation (Authenticated)
   ↓
7. Create Workspace Member
   ↓
8. Update Invitation Status
   ↓
9. User Joins Workspace
```

## 📧 Email Template

```html
<h2>You've been invited to join [Workspace Name]!</h2>

<p>Hi [Invitee Name],</p>

<p><strong>[Inviter Name]</strong> has invited you to join their workspace
on Deskive as a <strong>[Role]</strong>.</p>

<p><em>"[Custom Message]"</em></p>

<a href="[Frontend URL]/invite/[Token]">Accept Invitation</a>

<p>This invitation will expire in 7 days.</p>
```

## 🛠️ Service Methods

### InvitationService

```typescript
// Public Methods
createInvitation(workspaceId, userId, dto)
getWorkspaceInvitations(workspaceId, userId, status?)
getInvitationByToken(token)
acceptInvitation(token, userId, dto)
declineInvitation(token, dto)
resendInvitation(invitationId, userId)
cancelInvitation(invitationId, userId)

// Private Methods
generateInvitationToken()
getInvitationExpiration()
checkInvitationExpired(invitation)
sendInvitationEmail(invitation)
validateUserPermission(workspaceId, userId)
getDefaultPermissions(role)
```

## 🎨 Default Permissions by Role

```typescript
owner: ['all']
admin: ['manage_workspace', 'manage_members', 'manage_projects', 'view_analytics']
member: ['view_workspace', 'manage_own_tasks', 'view_projects']
viewer: ['view_workspace', 'view_projects']
```

## 🚀 Usage Examples

### Creating an Invitation

```typescript
// In your service or controller
const result = await invitationService.createInvitation(
  'workspace-uuid',
  'user-id',
  {
    email: 'newmember@example.com',
    name: 'New Member',
    role: WorkspaceMemberRole.MEMBER,
    message: 'Welcome to our team!',
    initialPermissions: ['view_workspace', 'manage_own_tasks']
  }
);
```

### Accepting an Invitation

```typescript
// User clicks invite link, logs in, then:
const result = await invitationService.acceptInvitation(
  'invitation-token',
  'user-id',
  {
    name: 'John Doe',
    bio: 'Excited to join!',
    timezone: 'America/New_York'
  }
);
```

## 🧪 Testing

### Test Cases

1. ✅ Create invitation with valid data
2. ✅ Prevent duplicate active invitations
3. ✅ Prevent inviting existing members
4. ✅ Non-admin cannot create invitations
5. ✅ Accept invitation with matching email
6. ✅ Reject acceptance with mismatched email
7. ✅ Prevent accepting expired invitation
8. ✅ Resend expired invitation (generates new token)
9. ✅ Cancel pending invitation
10. ✅ Decline invitation without auth

## 🔧 Configuration

### Environment Variables

```env
# Fluxez Configuration
FLUXEZ_API_KEY=your_service_key
FLUXEZ_ANON_KEY=your_anon_key

# Frontend URL for invitation links
FRONTEND_URL=https://app.deskive.com

# JWT Configuration
JWT_SECRET=your_jwt_secret
JWT_EXPIRATION=7d
```

## 📊 Invitation States

```
pending    → Initial state, email sent
accepted   → User accepted and joined workspace
declined   → User declined invitation
expired    → Invitation token expired
cancelled  → Invitation cancelled by workspace admin
```

## 🎯 Integration Points

### Required Services
- **FluxezService**: Database operations and email sending
- **JwtAuthGuard**: Authentication for protected endpoints
- **ConfigService**: Environment configuration

### Database Tables
- `workspace_invitations`: Invitation records
- `workspace_members`: Member records (created on acceptance)
- `workspaces`: Workspace details

### External Dependencies
- Fluxez SDK for database and email
- NestJS validation pipes
- Class-validator decorators

## 📚 References

### Based on TeamAtOnce Implementation
- `/backend/src/modules/company/invitation.service.ts`
- `/backend/src/modules/company/company.controller.ts`
- `/backend/src/modules/company/dto/invitation.dto.ts`

### Adapted for Deskive
- Changed "company" to "workspace"
- Changed "team member" to "workspace member"
- Simplified member data (removed developer-specific fields)
- Updated role structure for workspace context

---

**Built for Deskive** - Production-ready workspace invitation system
