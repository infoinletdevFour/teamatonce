# Workspace Invitation System - Quick Reference

## 🚀 Quick Start (3 Steps)

### 1. Add Module
```typescript
// app.module.ts
import { WorkspaceModule } from './modules/workspace/workspace.module';

@Module({
  imports: [WorkspaceModule, /* ... */],
})
export class AppModule {}
```

### 2. Create Tables
```sql
-- Run SQL from INVITATION_SYSTEM.md
CREATE TABLE workspace_invitations (...);
CREATE TABLE workspace_members (...);
CREATE TABLE workspaces (...);
```

### 3. Configure
```env
FRONTEND_URL=https://app.deskive.com
FLUXEZ_API_KEY=your_key
JWT_SECRET=your_secret
```

## 📋 API Endpoints

### Workspace Management (Auth Required)
```http
POST   /workspace/:id/invitations            Create
GET    /workspace/:id/invitations            List
POST   /workspace/:id/invitations/:id/resend Resend
DELETE /workspace/:id/invitations/:id        Cancel
```

### Invitation Flow (Public/Auth)
```http
GET    /invitations/:token          View (Public)
POST   /invitations/:token/accept   Accept (Auth)
POST   /invitations/:token/decline  Decline (Public)
```

## 💻 Code Examples

### Create Invitation
```typescript
// Backend
await invitationService.createInvitation(workspaceId, userId, {
  email: 'user@example.com',
  role: WorkspaceMemberRole.MEMBER,
  message: 'Welcome!',
});

// Frontend
fetch(`/api/workspace/${id}/invitations`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({ email, role, message }),
});
```

### Accept Invitation
```typescript
// Frontend
fetch(`/api/invitations/${token}/accept`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${authToken}` },
  body: JSON.stringify({ timezone: 'America/New_York' }),
});
```

## 🎯 Features Checklist

- ✅ Email invitations
- ✅ Secure tokens (64-char hex)
- ✅ Auto-expiration (7 days)
- ✅ Role-based permissions
- ✅ Resend with renewal
- ✅ Accept/decline flow
- ✅ Duplicate prevention
- ✅ Status tracking

## 🔐 Security

- **Tokens**: Crypto-random 64 chars
- **Email**: Must match user
- **Permissions**: Owner/admin only
- **Expiration**: 7 days
- **Status**: One-time use

## 📊 Database Tables

```
workspace_invitations
├── token (unique)
├── email
├── role
├── status
└── expires_at

workspace_members (created on accept)
├── workspace_id
├── user_id
├── role
└── permissions

workspaces
├── owner_id
└── name
```

## 🛠️ Service Methods

```typescript
createInvitation(workspaceId, userId, dto)
getWorkspaceInvitations(workspaceId, userId, status?)
getInvitationByToken(token)
acceptInvitation(token, userId, dto)
declineInvitation(token, dto)
resendInvitation(invitationId, userId)
cancelInvitation(invitationId, userId)
```

## 📝 DTOs

```typescript
CreateInvitationDto {
  email: string
  name?: string
  role: WorkspaceMemberRole
  message?: string
  initialPermissions?: string[]
}

AcceptInvitationDto {
  name?: string
  bio?: string
  timezone?: string
}

DeclineInvitationDto {
  declineReason?: string
}
```

## 🎨 Roles & Permissions

```typescript
owner  → ['all']
admin  → ['manage_workspace', 'manage_members', ...]
member → ['view_workspace', 'manage_own_tasks', ...]
viewer → ['view_workspace', 'view_projects']
```

## 🔄 Workflow

```
Create → Email → View → Login → Accept → Join
```

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Email not sending | Check FLUXEZ_API_KEY |
| Permission denied | User must be owner/admin |
| Token expired | Use resend endpoint |
| Email mismatch | User email must match invite |

## 📚 Documentation

- **README.md** - Overview
- **INVITATION_SYSTEM.md** - Full docs
- **INTEGRATION_GUIDE.md** - Setup guide

## 📦 Files Created

```
workspace/
├── dto/invitation.dto.ts        (279 lines)
├── invitation.service.ts        (774 lines)
├── workspace.controller.ts      (230 lines)
├── invitation-public.controller.ts (155 lines)
├── workspace.module.ts          (39 lines)
└── docs/ (README, guides)       (1,158 lines)
```

**Total**: 2,635 lines • Production ready • Fully documented

---

**Need more info?** See full documentation in workspace module folder.
