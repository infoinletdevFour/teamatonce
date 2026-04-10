# TeamAtOnce Project Rules & Guidelines

**Last Updated:** January 2026
**Project:** TeamAtOnce Backend (NestJS + Fluxez SDK)

---

## 📋 Table of Contents

1. [User Management Rules](#1-user-management-rules)
2. [Role Management Rules](#2-role-management-rules)
3. [Authentication Flow Rules](#3-authentication-flow-rules)
4. [Database Schema Rules](#4-database-schema-rules)
5. [API Response Rules](#5-api-response-rules)
6. [Code Quality Rules](#6-code-quality-rules)

---

## 1. User Management Rules

### ✅ Rule #1: Users are Managed by Fluxez (External Auth System)

**Users are stored in Fluxez's auth system, NOT in your application database.**

#### What This Means:

- **NO `users` table in your schema** (`backend/src/database/schema.ts`)
- **NO user CRUD operations** in your database
- **ALL user operations** go through Fluxez SDK

#### Correct User Access:

```typescript
// ✅ CORRECT - Use Fluxez SDK
const user = await this.fluxez.getUserById(userId);
const users = await this.fluxez.listUsers();
await this.fluxez.updateUser(userId, data);
await this.fluxez.deleteUser(userId);

// ❌ WRONG - Don't query users table directly
const user = await this.fluxez.select('users', { id: userId });
const users = await this.fluxez.table('users').execute();
```

#### User Table Structure (Managed by Fluxez):

```
┌─────────────────────────────────────────────┐
│          Fluxez Users Table                 │
│         (External - Firebase-like)          │
├─────────────────────────────────────────────┤
│ Column          │ Type   │ Managed By      │
├─────────────────┼────────┼─────────────────┤
│ id              │ uuid   │ Fluxez          │
│ email           │ string │ Fluxez          │
│ password_hash   │ string │ Fluxez          │
│ name            │ string │ Fluxez          │
│ role            │ string │ TeamAtOnce ✅   │
│ avatar_url      │ string │ TeamAtOnce      │
│ metadata        │ jsonb  │ TeamAtOnce      │
│ created_at      │ time   │ Fluxez          │
│ email_verified  │ bool   │ Fluxez          │
└─────────────────┴────────┴─────────────────┘
```

#### Your Application Tables:

Your schema should only contain **business data**, NOT user auth data:

```typescript
// ✅ CORRECT - Your schema
export const schema = {
  companies: { /* ... */ },
  projects: {
    columns: [
      { name: 'user_id', type: 'string' }, // Reference to Fluxez user
      // ...
    ]
  },
  company_members: {
    columns: [
      { name: 'user_id', type: 'string' }, // Reference to Fluxez user
      // ...
    ]
  }
};

// ❌ WRONG - Don't add users table
export const schema = {
  users: { /* ❌ NEVER ADD THIS */ },
  companies: { /* ... */ }
};
```

#### Foreign Key References:

When referencing users in your tables, use **string type** for user IDs:

```typescript
// ✅ CORRECT - String reference to Fluxez user
{
  name: 'user_id',
  type: 'string',
  nullable: false,
  // ❌ NO references: { table: 'users' } - users table doesn't exist in your DB
}

// ❌ WRONG - UUID with foreign key reference
{
  name: 'user_id',
  type: 'uuid',
  references: { table: 'users' } // ❌ This table doesn't exist
}
```

---

## 2. Role Management Rules

### ✅ Rule #2: Role is ALWAYS from Direct Column, NEVER from Metadata

**The user's role must be stored in the `role` column, NOT in `metadata.role`**

#### Database Structure:

```typescript
// ✅ CORRECT Structure
{
  id: "user_123",
  email: "user@example.com",
  role: "client",           // ✅ Direct column
  metadata: {
    xp_points: 100,
    learning_level: "beginner"
    // ❌ NO role here!
  }
}

// ❌ WRONG Structure
{
  id: "user_123",
  email: "user@example.com",
  role: null,               // ❌ Empty
  metadata: {
    role: "client",         // ❌ NEVER put role here
    xp_points: 100
  }
}
```

#### Creating Users:

```typescript
// ✅ CORRECT - Pass role as 5th parameter
await this.fluxez.signUp(
  email,
  password,
  name,
  metadata,    // 4th param: metadata object
  userRole     // 5th param: role (direct column)
);

// ❌ WRONG - Role in metadata
await this.fluxez.signUp(
  email,
  password,
  name,
  {
    ...metadata,
    role: userRole  // ❌ Don't put role in metadata
  }
);
```

#### Reading Role:

```typescript
// ✅ CORRECT - Read from direct column
const role = user.role || 'client';

// With fallback for backward compatibility (optional)
const role = user.role || user.metadata?.role || 'client';

// ❌ WRONG - Read from metadata first
const role = user.metadata?.role || 'user';
```

#### Updating Role:

```typescript
// ✅ CORRECT - Update direct column
await this.fluxez.updateUser(userId, {
  role: 'seller',  // Direct column
  metadata: {
    // Other metadata fields
  }
});

// ❌ WRONG - Update in metadata
await this.fluxez.updateUser(userId, {
  metadata: {
    role: 'seller'  // ❌ Don't put role in metadata
  }
});
```

#### Code Comments:

**Every location where you access `role` must have this comment:**

```typescript
// ✅ Read from direct role column, NOT from metadata
const role = user.role || 'client';

// ✅ Set role in direct column, NOT in metadata
registerData.role = userRole;

// ✅ Filter by direct role column, NOT from metadata
users.filter(u => u.role === 'client');
```

#### Valid Role Values:

```typescript
type UserRole = 'client' | 'seller' | 'admin' | 'super_admin';

// Default: 'client'
// For marketplace: 'client' (buyer) or 'seller' (service provider)
```

---

## 3. Authentication Flow Rules

### ✅ Rule #3: Authentication Flow Must Be Consistent

#### Email/Password Signup:

```typescript
// Step 1: User submits signup form with role
const dto: RegisterDto = {
  email: 'user@example.com',
  password: 'password123',
  name: 'John Doe',
  role: 'client' // ✅ Role included
};

// Step 2: Backend calls Fluxez signUp with role
const userRole = dto.role || 'client';
const response = await this.fluxez.signUp(
  dto.email,
  dto.password,
  dto.name,
  metadata,
  userRole  // ✅ Pass as 5th parameter
);

// Step 3: Return user with role from direct column
return {
  user: {
    id: response.user.id,
    email: response.user.email,
    role: response.user.role || userRole  // ✅ From direct column
  }
};
```

#### Email/Password Login:

```typescript
// Step 1: User submits login credentials
const dto: LoginDto = {
  email: 'user@example.com',
  password: 'password123'
};

// Step 2: Backend authenticates via Fluxez
const response = await this.fluxez.signIn(dto.email, dto.password);
const user = response.user;

// Step 3: Fetch full profile to get role
const fullProfile = await this.fluxez.getUserById(user.id);

// Step 4: Return user with role from direct column
return {
  user: {
    id: user.id,
    email: user.email,
    role: fullProfile?.role || 'client'  // ✅ From direct column
  }
};
```

#### Social Auth (Google/GitHub) Signup:

```typescript
// Step 1: Frontend stores role before OAuth redirect
localStorage.setItem('oauth_signup_role', userType); // 'client' or 'seller'

// Step 2: User completes OAuth with provider
// Provider redirects back with tokens

// Step 3: Frontend retrieves stored role
const signupRole = localStorage.getItem('oauth_signup_role');

// Step 4: Frontend calls exchange endpoint with role
await fetch('/auth/oauth/exchange', {
  method: 'POST',
  body: JSON.stringify({
    fluxezToken: token,
    userId: userId,
    email: email,
    role: signupRole || 'client'  // ✅ Pass role to backend
  })
});

// Step 5: Backend creates/updates user with role
await this.fluxez.updateUser(userId, {
  role: signupRole || 'client'  // ✅ Set in direct column
});

// Step 6: Clear stored role
localStorage.removeItem('oauth_signup_role');
```

#### JWT Token Generation:

```typescript
private generateToken(user: any) {
  // ✅ Extract role from direct column first
  const role = user.role || user.metadata?.role || 'client';

  const payload = {
    sub: user.id,
    email: user.email,
    role: role  // ✅ Include role in JWT
  };

  return this.jwtService.sign(payload);
}
```

#### Get Current User (`/auth/me`):

```typescript
@Get('me')
async getProfile(@Request() req) {
  const userId = req.user.sub;
  const user = await this.fluxez.getUserById(userId);

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role || 'client'  // ✅ From direct column
    }
  };
}
```

---

## 4. Database Schema Rules

### ✅ Rule #4: Schema Must Only Contain Business Data

#### What to Include in Schema:

```typescript
export const schema = {
  // ✅ Business entities
  companies: { /* ... */ },
  projects: { /* ... */ },
  milestones: { /* ... */ },
  payments: { /* ... */ },
  contracts: { /* ... */ },
  messages: { /* ... */ },

  // ✅ Application-specific data
  company_members: { /* ... */ },
  project_members: { /* ... */ },
  notifications: { /* ... */ },

  // ✅ User-generated content
  reviews: { /* ... */ },
  portfolios: { /* ... */ },
  skills: { /* ... */ }
};
```

#### What NOT to Include:

```typescript
export const schema = {
  // ❌ NEVER add these
  users: { /* ❌ Managed by Fluxez */ },
  auth_sessions: { /* ❌ Managed by Fluxez */ },
  user_passwords: { /* ❌ Managed by Fluxez */ },
  oauth_tokens: { /* ❌ Managed by Fluxez */ },
  user_roles: { /* ❌ Role is in Fluxez user.role column */ }
};
```

#### User ID References:

```typescript
// ✅ CORRECT - All user references
{
  columns: [
    {
      name: 'user_id',
      type: 'string',          // String, not UUID
      nullable: false,
      // No references - users table doesn't exist in our DB
    },
    {
      name: 'created_by',
      type: 'string',          // String reference to Fluxez user
      nullable: false
    },
    {
      name: 'owner_id',
      type: 'string',          // String reference to Fluxez user
      nullable: false
    }
  ]
}
```

---

## 5. API Response Rules

### ✅ Rule #5: API Responses Must Be Consistent

#### Response Structure:

```typescript
// ✅ CORRECT - Wrap data in consistent structure
return {
  data: users,
  message: 'Success',
  total: users.length
};

// ❌ WRONG - Raw return
return users;
```

#### Case Convention:

```typescript
// Database (snake_case)
const dbData = {
  user_id: '123',
  created_at: '2024-01-01',
  company_name: 'Acme Inc'
};

// API Response (camelCase)
return {
  userId: '123',
  createdAt: '2024-01-01',
  companyName: 'Acme Inc'
};
```

#### User Response Format:

```typescript
// ✅ CORRECT - Standard user response
return {
  user: {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role || 'client',  // ✅ Direct column
    avatarUrl: user.avatar_url,
    emailVerified: user.email_verified,
    createdAt: user.created_at
  }
};

// ❌ WRONG - Inconsistent structure
return {
  userId: user.id,
  userEmail: user.email,
  role: user.metadata?.role  // ❌ From metadata
};
```

---

## 6. Code Quality Rules

### ✅ Rule #6: Code Must Follow Standards

#### Required Packages:

```bash
# Case conversion
npm install change-case

# Pluralization
npm install pluralize
npm install -D @types/pluralize
```

```typescript
// ✅ CORRECT - Use packages
import { camelCase, snakeCase } from 'change-case';
import pluralize from 'pluralize';

const userName = camelCase('user_name');
const users = pluralize('user');

// ❌ WRONG - Custom functions
const toCamelCase = (str) => str.replace(/_([a-z])/g, ...);
```

#### Comments:

```typescript
// ✅ GOOD - Clear, informative comments
// Read role from direct column, NOT from metadata
const role = user.role || 'client';

// Extract user ID from JWT token
const userId = req.user.sub;

// ❌ BAD - Obvious or misleading comments
// Get role
const role = user.role;

// Set variable
const x = 5;
```

#### Error Handling:

```typescript
// ✅ CORRECT - Specific error messages
if (!user) {
  throw new NotFoundException(`User with ID ${userId} not found`);
}

if (user.role !== 'admin') {
  throw new ForbiddenException('Only admins can access this resource');
}

// ❌ WRONG - Generic errors
throw new Error('Error');
```

---

## 🔍 Quick Reference Checklist

### Before Committing Code:

- [ ] No `users` table in schema
- [ ] All user operations use Fluxez SDK
- [ ] Role is read from `user.role`, not `user.metadata.role`
- [ ] Role comments added: `// ✅ Read from direct role column, NOT from metadata`
- [ ] User IDs are `type: 'string'`, not `uuid` with foreign key
- [ ] API responses use camelCase
- [ ] Build passes: `npm run build`
- [ ] No mock/dummy data remains

### Search Commands to Verify:

```bash
# Find any metadata.role references (should return only fallbacks)
grep -r "metadata\.role" src/

# Find any users table references (should be empty)
grep -r "table: 'users'" src/

# Find any direct user queries (should be empty)
grep -r "from('users')" src/

# Find uncommented role access (should be empty)
grep -r "user\.role" src/ | grep -v "✅"
```

---

## 📚 Related Documentation

- [Fluxez SDK Documentation](https://docs.fluxez.com)
- [NestJS Best Practices](https://docs.nestjs.com)
- [Backend CLAUDE.md](./CLAUDE.md)
- [Frontend CLAUDE.md](../frontend/CLAUDE.md)

---

## 🚨 Common Mistakes to Avoid

### ❌ Mistake #1: Creating Users Table

```typescript
// ❌ WRONG
export const schema = {
  users: {
    columns: [
      { name: 'id', type: 'uuid', primaryKey: true },
      { name: 'email', type: 'string' },
      { name: 'role', type: 'string' }
    ]
  }
};
```

**Why Wrong:** Users are managed by Fluxez, not your database.

### ❌ Mistake #2: Storing Role in Metadata

```typescript
// ❌ WRONG
metadata: {
  role: 'client',
  xp_points: 100
}
```

**Why Wrong:** Role must be in direct column for consistency.

### ❌ Mistake #3: Reading from Metadata First

```typescript
// ❌ WRONG
const role = user.metadata?.role || user.role || 'user';
```

**Why Wrong:** Direct column should be checked first.

### ❌ Mistake #4: Foreign Key to Users Table

```typescript
// ❌ WRONG
{
  name: 'user_id',
  type: 'uuid',
  references: { table: 'users' }
}
```

**Why Wrong:** Users table doesn't exist in your database.

---

## ✅ Correct Examples

### Example 1: Creating a Project with User Reference

```typescript
// ✅ CORRECT
const project = await this.fluxez.insert('projects', {
  id: uuid(),
  user_id: userId,  // String reference to Fluxez user
  name: 'My Project',
  status: 'active',
  created_at: new Date().toISOString()
});

// Fetch user data separately if needed
const user = await this.fluxez.getUserById(userId);
```

### Example 2: Getting User with Role

```typescript
// ✅ CORRECT
async getUserProfile(userId: string) {
  const user = await this.fluxez.getUserById(userId);

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role || 'client',  // ✅ Direct column
    avatarUrl: user.avatar_url
  };
}
```

### Example 3: Filtering Users by Role

```typescript
// ✅ CORRECT
async getClientUsers() {
  const result = await this.fluxez.listUsers();
  const clients = result.users.filter(
    user => user.role === 'client'  // ✅ Direct column
  );

  return clients;
}
```

---

## 📞 Support

If you have questions about these rules:

1. Check this document first
2. Check `CLAUDE.md` files
3. Review existing code examples
4. Ask in team chat

---

**Remember:** These rules ensure consistency, maintainability, and prevent bugs. Always follow them! 🚀
