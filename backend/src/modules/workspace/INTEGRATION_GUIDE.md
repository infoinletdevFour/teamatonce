# Workspace Invitation System - Integration Guide

Quick guide to integrate the workspace invitation system into your Deskive application.

## 🚀 Quick Setup

### 1. Add Module to App Module

```typescript
// backend/src/app.module.ts

import { WorkspaceModule } from './modules/workspace/workspace.module';

@Module({
  imports: [
    // ... other modules
    WorkspaceModule,
  ],
})
export class AppModule {}
```

### 2. Run Database Migrations

Create and run the migration for the invitation tables:

```bash
# Create migration file
npx fluxez migration:create workspace_invitations

# Add the schema from INVITATION_SYSTEM.md to the migration

# Run migration
npx fluxez migration:run
```

Or manually create tables using the SQL from `INVITATION_SYSTEM.md`.

### 3. Update Environment Variables

```env
# .env or .env.production
FRONTEND_URL=https://app.deskive.com
FLUXEZ_API_KEY=your_service_key
FLUXEZ_ANON_KEY=your_anon_key
JWT_SECRET=your_jwt_secret
```

### 4. Test the Endpoints

```bash
# Start the server
npm run dev

# API will be available at:
# - POST   /workspace/:id/invitations
# - GET    /workspace/:id/invitations
# - GET    /invitations/:token
# - POST   /invitations/:token/accept
# - POST   /invitations/:token/decline
# - POST   /workspace/:id/invitations/:invId/resend
# - DELETE /workspace/:id/invitations/:invId
```

## 📝 Required Database Tables

### 1. workspace_invitations

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

### 2. workspace_members

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
CREATE UNIQUE INDEX idx_workspace_members_unique ON workspace_members(workspace_id, user_id);
```

### 3. workspaces (if not exists)

```sql
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id VARCHAR NOT NULL,
  name VARCHAR NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_workspaces_owner_id ON workspaces(owner_id);
```

## 🔌 Frontend Integration

### Accept Invitation Flow

```typescript
// 1. User receives email with link: https://app.deskive.com/invite/{token}

// 2. Frontend loads invitation details (public, no auth)
const response = await fetch(`/api/invitations/${token}`);
const { invitation } = await response.json();

// 3. User logs in or signs up

// 4. Accept invitation (authenticated)
const acceptResponse = await fetch(`/api/invitations/${token}/accept`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'John Doe',
    bio: 'Excited to join!',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  }),
});

// 5. Redirect to workspace
const { workspaceMember } = await acceptResponse.json();
window.location.href = `/workspace/${workspaceMember.workspaceId}`;
```

### Create Invitation

```typescript
// From workspace settings page
const createInvitation = async (workspaceId: string, data: any) => {
  const response = await fetch(`/api/workspace/${workspaceId}/invitations`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: 'newmember@example.com',
      name: 'New Member',
      role: 'member',
      message: 'Welcome to our workspace!',
      initialPermissions: ['view_workspace', 'manage_own_tasks'],
    }),
  });

  return response.json();
};
```

### List Invitations

```typescript
// From workspace members page
const getInvitations = async (workspaceId: string, status?: string) => {
  const url = new URL(`/api/workspace/${workspaceId}/invitations`, window.location.origin);
  if (status) url.searchParams.set('status', status);

  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${authToken}`,
    },
  });

  return response.json();
};
```

## 🧪 Testing Checklist

- [ ] Can create invitation as workspace owner
- [ ] Cannot create invitation as member
- [ ] Invitation email is sent
- [ ] Can view invitation with token (no auth)
- [ ] Can accept invitation with matching email
- [ ] Cannot accept with wrong email
- [ ] Can decline invitation
- [ ] Can resend invitation
- [ ] Can cancel invitation
- [ ] Expired invitations are rejected
- [ ] Resend renews expired invitation
- [ ] Member is created on acceptance
- [ ] Cannot invite existing member
- [ ] Cannot have duplicate pending invitations

## 🔍 Debugging

### Enable Detailed Logging

The service includes console.log statements for debugging:

```typescript
// Check logs for:
[InvitationService] Create invitation error
[InvitationService] Getting user by ID
[InvitationService] Invitation email sent to
[InvitationPublicController] Accept invitation request
```

### Common Issues

**1. Email not sending**
- Check `FLUXEZ_API_KEY` is set
- Verify Fluxez email service is configured
- Check console for email errors (non-blocking)

**2. Permission denied**
- Ensure user is workspace owner or admin
- Check `workspace_members` table for user role

**3. Token expired**
- Invitations expire after 7 days
- Use resend endpoint to generate new token

**4. Email mismatch**
- Invitation email must match user's email
- Case-insensitive comparison

## 📊 Monitoring

### Key Metrics to Track

```sql
-- Pending invitations by workspace
SELECT workspace_id, COUNT(*) as pending_count
FROM workspace_invitations
WHERE status = 'pending' AND expires_at > NOW()
GROUP BY workspace_id;

-- Invitation acceptance rate
SELECT
  COUNT(CASE WHEN status = 'accepted' THEN 1 END)::float /
  COUNT(*)::float * 100 as acceptance_rate
FROM workspace_invitations
WHERE created_at > NOW() - INTERVAL '30 days';

-- Average time to accept
SELECT AVG(accepted_at - created_at) as avg_time_to_accept
FROM workspace_invitations
WHERE status = 'accepted';
```

## 🎨 Customization

### Custom Email Template

Edit `invitation.service.ts` → `sendInvitationEmail()`:

```typescript
const emailHtml = `
  <!-- Your custom HTML template -->
`;
```

### Custom Permissions

Edit `invitation.service.ts` → `getDefaultPermissions()`:

```typescript
private getDefaultPermissions(role: WorkspaceMemberRole): string[] {
  const permissionMap: Record<string, string[]> = {
    owner: ['all'],
    admin: ['manage_workspace', 'manage_members', 'manage_projects'],
    member: ['view_workspace', 'edit_tasks'],
    viewer: ['view_workspace'],
    // Add custom roles here
  };
  return permissionMap[role] || ['view_workspace'];
}
```

### Custom Expiration

Edit `invitation.service.ts`:

```typescript
private readonly INVITATION_EXPIRY_DAYS = 14; // Change from 7 to 14 days
```

## 🔐 Security Best Practices

1. **Always validate email matches** - Prevent invitation hijacking
2. **Use secure tokens** - 64-character random hex
3. **Expire invitations** - Default 7 days
4. **Check permissions** - Owner/admin only for management
5. **Log invitation actions** - Track who invited whom
6. **Rate limit creation** - Prevent spam (add middleware)
7. **Validate input** - DTOs with class-validator

## 📚 Additional Resources

- [INVITATION_SYSTEM.md](./INVITATION_SYSTEM.md) - Full system documentation
- [invitation.service.ts](./invitation.service.ts) - Service implementation
- [workspace.controller.ts](./workspace.controller.ts) - API endpoints
- [invitation.dto.ts](./dto/invitation.dto.ts) - Data transfer objects

## 🆘 Support

For issues or questions:
1. Check the full documentation in `INVITATION_SYSTEM.md`
2. Review the TeamAtOnce reference implementation
3. Check console logs for detailed error messages
4. Verify database schema matches requirements

---

**Ready to Go!** Your workspace invitation system is production-ready.
