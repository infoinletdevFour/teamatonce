# TeamAtOnce Backend - Project Guidelines

## Important Notes

### Authentication
- Using Fluxez SDK for authentication (similar to Firebase/Supabase)
- NO separate user table needed - Fluxez handles user management
- JWT payload uses `sub` for user ID, NOT `userId`
- Access user ID in controllers: `req.user.sub || req.user.userId` (use this pattern for compatibility)
- Some tokens may have `userId` instead of `sub`, so always use the fallback pattern

### Fluxez JWT Token Handling (CRITICAL)
- **NEVER use `jwtService.verifyAsync()` or `jwtService.verify()` for Fluxez tokens**
- **ALWAYS use `jwtService.decode()` instead** - Fluxez tokens are signed by Fluxez backend, not our local JWT_SECRET
- This applies to ALL guards and gateways:
  - `src/common/guards/auth.guard.ts`
  - `src/modules/auth/guards/jwt-auth.guard.ts`
  - `src/common/gateways/app.gateway.ts`

Example of correct token validation:
```typescript
// CORRECT - decode Fluxez JWT without verification
const payload = this.jwtService.decode(token) as any;
if (!payload) {
  throw new UnauthorizedException('Invalid token format');
}
// Check expiration manually
if (payload.exp && payload.exp * 1000 < Date.now()) {
  throw new UnauthorizedException('Token expired');
}
// Map payload to user object
request.user = {
  sub: payload.userId || payload.sub,
  userId: payload.userId || payload.sub,
  email: payload.email,
  // ... other fields
};

// WRONG - this will fail with "invalid signature" error
const payload = await this.jwtService.verifyAsync(token, { secret: JWT_SECRET });
```

---

## API Response & Request Rules

### API Response Structure
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

// WRONG - Double nesting
const users = response.data.data.data;
```

### CamelCase Convention
- **Database columns**: snake_case
- **Backend returns to frontend**: camelCase
- **API responses/events**: camelCase

### POST Request Body
**Always pass `{}` for empty body, NEVER `null` or `undefined`:**
```typescript
// WRONG - Causes CORS errors
await api.post('/endpoint', null);

// CORRECT
await api.post('/endpoint', {});
```

### File Upload Headers
**NEVER manually set Content-Type for FormData uploads:**
```typescript
// WRONG - Manual header breaks boundary
await api.post('/upload', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});

// CORRECT - No Content-Type header
await api.post('/upload', formData);
```

---

## Database Schema - Fluxez SDK Format

Location: `backend/src/database/schema.ts`

### Schema Definition Format
```typescript
export const schema = {
  projects: {
    columns: [
      { name: 'id', type: 'uuid', primaryKey: true, default: 'gen_random_uuid()' },
      { name: 'user_id', type: 'string', nullable: false },  // User IDs are strings (auth.users)
      { name: 'workspace_id', type: 'uuid', nullable: false, references: { table: 'workspaces' } },
      { name: 'name', type: 'string', nullable: false },
      { name: 'status', type: 'string', default: 'active' },
      { name: 'metadata', type: 'jsonb', default: '{}' },
      { name: 'created_at', type: 'timestamptz', default: 'now()' },
      { name: 'updated_at', type: 'timestamptz', default: 'now()' }
    ],
    indexes: [
      { columns: ['user_id'] },
      { columns: ['workspace_id'] },
      { columns: ['workspace_id', 'user_id'], unique: true }
    ]
  }
};
```

### Column Type Rules
- `string` - For user IDs (auth.users), short text, enums
- `uuid` - For IDs and foreign keys to custom tables
- `text` - For long text content
- `integer` / `bigint` / `numeric` - For numbers
- `boolean` - For true/false flags
- `timestamptz` - For timestamps with timezone
- `jsonb` - For JSON objects/arrays

---

## WebSocket Gateway Implementation

Location: `src/common/gateways/app.gateway.ts`

**Key Points:**
1. **Token Extraction** - Extract token from multiple sources:
   ```typescript
   const token =
     client.handshake.auth?.token ||
     client.handshake.headers?.authorization?.replace('Bearer ', '') ||
     client.handshake.query?.token;
   ```

2. **Token Validation** - Use `decode()` NOT `verifyAsync()`:
   ```typescript
   private async validateToken(token: string): Promise<any> {
     const payload = this.jwtService.decode(token) as any;
     if (!payload) return null;
     if (payload.exp && payload.exp * 1000 < Date.now()) return null;
     return {
       sub: payload.userId || payload.sub,
       userId: payload.userId || payload.sub,
       email: payload.email,
     };
   }
   ```

3. **User Rooms** - Join users to personal rooms:
   ```typescript
   await client.join(`user:${payload.sub}`);
   await client.join('authenticated');
   ```

4. **Workspace Rooms** - For multi-tenant apps:
   ```typescript
   await client.join(`workspace:${workspaceId}`);
   await client.join(`workspace:${workspaceId}:user:${userId}`);
   ```

5. **Emitting to Users**:
   ```typescript
   // To specific user
   this.server.to(`user:${userId}`).emit(event, data);

   // To workspace user (cross-page notifications)
   this.server.to(`workspace:${workspaceId}:user:${userId}`).emit(event, data);

   // To all workspace members
   this.server.to(`workspace:${workspaceId}`).emit(event, data);
   ```

6. **Module Setup** - WebSocketModule must import AuthModule:
   ```typescript
   @Module({
     imports: [AuthModule],
     providers: [AppGateway],
     exports: [AppGateway],
   })
   export class WebSocketModule {}
   ```

**React Client:**
```typescript
const socket = io(SOCKET_URL, {
  auth: { token: accessToken },
  transports: ['websocket', 'polling'],
});

// Join workspace after connection
socket.on('connect', () => {
  socket.emit('join:workspace', { workspaceId });
});
```

**Common WebSocket Events:**
- `connection:success` - Sent to client after successful connection
- `connection:error` - Sent when connection fails
- `presence:updated` - User online/offline status changes
- `join:workspace` / `leave:workspace` - Workspace room management
- `typing_start` / `typing_stop` - Typing indicators for chat

---

## Fluxez Node SDK Reference

### SDK Setup
```typescript
import { FluxezClient } from '@fluxez/node-sdk';

const client = new FluxezClient(process.env.FLUXEZ_API_KEY, {
  timeout: 30000,
  retries: 3,
  debug: false
});
```

### Authentication
```typescript
// Login
const auth = await client.auth.login({ email, password, twoFactorCode });

// Register
const newUser = await client.auth.register({
  email, password, name, role: 'user',
  frontendUrl: 'https://myapp.com'
});

// Get current user
const currentUser = await client.auth.me();

// OAuth
const oauthUrl = await client.auth.getOAuthUrl('google', callbackUrl);
const authResult = await client.auth.handleOAuthCallback('google', code, state);

// Password reset
await client.auth.requestPasswordReset(email, frontendUrl);
await client.auth.resetPassword({ token, newPassword });

// 2FA
const { secret, qrCode } = await client.auth.enable2FA();
await client.auth.verify2FA('123456');

// Team management
const team = await client.auth.createTeam({ name: 'Engineering', slug: 'engineering' });
const teams = await client.auth.getTeams();
const members = await client.auth.getTeamMembers(team.id);

// Invitations
await client.auth.inviteMember({ teamId: team.id, email: 'user@example.com', role: 'member' });
await client.auth.acceptInvitation({ token: 'invitation_token' });
await client.auth.removeMember({ teamId: team.id, userId: 'user_123' });
await client.auth.updateMemberRole({ teamId: team.id, userId: 'user_123', newRole: 'admin' });
```

### Database Queries
```typescript
// SELECT
const users = await client.query
  .from('users')
  .select('*')
  .where('status', 'active')
  .where('age', '>', 18)
  .orderBy('created_at', 'DESC')
  .limit(20)
  .offset(0)
  .get();

// WHERE variations
.where('role', 'admin')
.orWhere('role', 'moderator')
.whereIn('status', ['active', 'pending'])
.whereNull('deleted_at')
.whereBetween('created_at', '2024-01-01', '2024-12-31')
.where('name', 'LIKE', '%john%')

// MongoDB-style operators
.$gt('age', 18)
.$lte('age', 65)
.$in('status', ['active', 'pending'])
.$like('email', '%@gmail.com')
.$ilike('name', '%john%')  // Case-insensitive

// Aggregation
const stats = await client.query
  .from('orders')
  .select('status')
  .count('id')
  .sum('total')
  .avg('total')
  .groupBy('status')
  .get();

// JOINs
const posts = await client.query
  .from('posts')
  .select('posts.*', 'users.name as author_name')
  .leftJoin('users', 'posts.author_id', '=', 'users.id')
  .get();

// INSERT
const newUser = await client.query
  .from('users')
  .insert({ name: 'John', email: 'john@example.com' })
  .returning('*')
  .execute();

// UPDATE
const updated = await client.query
  .from('users')
  .where('email', 'john@example.com')
  .update({ status: 'verified' })
  .returning('*')
  .execute();

// DELETE
await client.query
  .from('posts')
  .where('status', 'draft')
  .delete()
  .execute();

// Raw SQL
const results = await client.raw(
  'SELECT * FROM users WHERE status = ? AND age > ?',
  ['active', 18]
);
```

### Storage
```typescript
// Upload
const result = await client.storage.upload('./file.pdf', 'documents/', {
  contentType: 'application/pdf',
  metadata: { userId: '123' }
});

// From Buffer/Stream
const result = await client.storage.upload(buffer, 'path/', {
  fileName: 'file.txt',
  contentType: 'text/plain'
});

// Operations
const file = await client.storage.getFile('documents/report.pdf');
const buffer = await client.storage.download('documents/report.pdf');
const signedUrl = await client.storage.getSignedUrl('path', { expiresIn: 3600 });
const files = await client.storage.list({ prefix: 'documents/', limit: 100 });
await client.storage.delete('path/file.txt');
await client.storage.copy('source', 'dest');
await client.storage.move('source', 'dest');
```

### Email
```typescript
// Send email
await client.email.send(
  'user@example.com',
  'Subject',
  '<h1>HTML content</h1>',
  { cc: ['cc@example.com'], trackOpens: true }
);

// Templates
const template = await client.email.createTemplate(
  'welcome',
  'Welcome to {{appName}}',
  '<h1>Welcome {{firstName}}!</h1>',
  'Welcome {{firstName}}!',
  { variables: ['firstName', 'appName'] }
);

await client.email.sendTemplated('welcome', 'user@example.com', {
  firstName: 'John',
  appName: 'MyApp'
});

// Bulk
const jobId = await client.email.sendBulk(
  [{ email: 'user1@example.com', templateData: { firstName: 'John' } }],
  'welcome',
  { appName: 'MyApp' }
);
```

### Video Conferencing
```typescript
// Create room
const room = await client.videoConferencing.createRoom({
  name: 'Meeting',
  maxParticipants: 50,
  recordingEnabled: true,
  videoQuality: 'hd',
  roomType: 'group'
});

// Generate token
const token = await client.videoConferencing.generateToken(room.roomName, {
  name: 'John Doe',
  canPublish: true,
  canSubscribe: true,
  expiresIn: 3600
});

// Recording
await client.videoConferencing.startRecording(room.roomName, {
  layout: 'grid', width: 1920, height: 1080, fps: 30
});
await client.videoConferencing.stopRecording(room.roomName);
```

### Payment (Stripe)
```typescript
// Checkout
const session = await client.payment.createCheckoutSession({
  priceId: 'price_xxx',
  customerEmail: 'user@example.com',
  successUrl: 'https://app.com/success',
  cancelUrl: 'https://app.com/cancel',
  trialPeriodDays: 14
});

// Subscription
const subscription = await client.payment.getSubscription('sub_xxx');
await client.payment.updateSubscription('sub_xxx', { priceId: 'price_new' });
await client.payment.cancelSubscription('sub_xxx', { atPeriodEnd: true });

// Customer
const customer = await client.payment.createCustomer({
  email: 'user@example.com',
  name: 'John Doe',
  metadata: { userId: 'user_123' }
});
```

### Search
```typescript
// Unified search
const results = await client.search.unifiedSearch('products', 'laptop', {
  mode: 'hybrid',  // 'keyword' | 'semantic' | 'hybrid'
  columns: ['name', 'description'],
  limit: 20,
  filters: { category: 'electronics' }
});

// Configure search
await client.search.configureSearch('products', {
  fullTextColumns: ['name', 'description'],
  semanticColumns: ['description'],
  vectorDimension: 1536
});
```

### AI Capabilities
```typescript
// Text generation
const result = await client.ai.generateText('Write email about launch', {
  systemMessage: 'You are a business writer'
});

// Chat
const response = await client.ai.chat([
  { role: 'system', content: 'You are helpful' },
  { role: 'user', content: 'What is ML?' }
]);

// Code generation
const code = await client.ai.generateCode('Create React component', {
  language: 'typescript',
  framework: 'react'
});

// Image
const image = await client.ai.generateImage('Sunset', {
  model: 'dall-e-3',
  size: '1024x1024'
});
```

### Error Handling
```typescript
import { ApiError, ErrorCode } from '@fluxez/node-sdk';

try {
  await client.auth.login({ email, password });
} catch (error) {
  if (error instanceof ApiError) {
    switch (error.code) {
      case ErrorCode.AUTHENTICATION_ERROR:
        console.log('Invalid credentials');
        break;
      case ErrorCode.RATE_LIMIT_ERROR:
        console.log('Too many attempts');
        break;
    }
  }
}
```

### Best Practices
```typescript
// Multi-tenant context
client.setOrganization('org_123');
client.setProject('proj_456');
client.setApp('app_789');

// Caching
const cached = await client.cache.get(`user:${userId}:profile`);
await client.cache.set(key, data, { ttl: 3600 });
await client.cache.delete(key);

// Soft delete pattern
await client.query
  .from('users')
  .where('id', userId)
  .update({
    is_deleted: true,
    deleted_at: new Date().toISOString(),
    deleted_by: currentUserId
  })
  .execute();
```

---

## Module Structure Example
```
modules/
  chat/
    dto/          # API request/response DTOs with validation
    entities/     # Internal data structures (interfaces)
    chat.controller.ts
    chat.service.ts
    chat.module.ts
```

## Common Mistakes to Avoid
1. **JWT Module**: Do NOT add duplicate `JwtModule.registerAsync` - it's in AuthModule
2. **User ID**: Always use `req.user.sub || req.user.userId`
3. **Schema**: Check existing tables before adding new ones
4. **DTOs**: Use DTOs for all API request/response objects

## Testing Commands
- Lint: `npm run lint`
- Type checking: `npm run typecheck`
- Build: `npm run build`
