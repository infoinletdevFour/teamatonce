# Communication/Chat API Documentation

## Overview

This document describes the **REAL** Communication/Chat API with WebSocket support for real-time messaging in the Team@Once platform. All endpoints use real database operations via Fluxez SDK and real-time WebSocket broadcasts.

---

## 🚀 Key Features

- ✅ **Real Database Storage** - Messages stored in PostgreSQL via Fluxez SDK
- ✅ **Real-time WebSocket** - Instant message delivery to all connected clients
- ✅ **User Information Enrichment** - Automatic sender name and avatar loading
- ✅ **Multi-tenant Support** - Project-based message isolation
- ✅ **Read Receipts** - Track which messages have been read by users
- ✅ **Conversation Management** - Support for direct, group, and project conversations
- ✅ **File Attachments** - Support for file sharing in messages

---

## 📋 Database Tables

### `conversations`
Stores conversation metadata for organizing messages.

```typescript
{
  id: uuid,
  project_id: uuid,
  conversation_type: 'direct' | 'group' | 'project',
  title: string,
  participants: jsonb, // Array of user IDs
  created_by: string,
  last_message_at: timestamptz,
  metadata: jsonb,
  created_at: timestamptz,
  updated_at: timestamptz
}
```

### `messages`
Stores individual chat messages.

```typescript
{
  id: uuid,
  conversation_id: uuid,
  sender_id: string,
  message_type: 'text' | 'file' | 'image' | 'video' | 'system',
  content: text,
  attachments: jsonb,
  mentions: jsonb, // Array of mentioned user IDs
  reply_to_id: uuid, // For threaded messages
  reactions: jsonb, // Emoji reactions
  read_by: jsonb, // Array of user IDs who read the message
  metadata: jsonb,
  created_at: timestamptz,
  updated_at: timestamptz,
  deleted_at: timestamptz
}
```

---

## 🔌 REST API Endpoints

### Base URL
```
/api/v1/teamatonce/communication
```

All endpoints require JWT authentication via `Authorization: Bearer <token>` header.

---

### 1. Get Project Messages

Retrieve chat messages for a specific project with full sender information.

**Endpoint:** `GET /projects/:projectId/messages`

**Parameters:**
- `projectId` (path) - Project UUID
- `limit` (query, optional) - Maximum messages to retrieve (default: 50)
- `offset` (query, optional) - Pagination offset (default: 0)

**Response:**
```typescript
{
  messages: [
    {
      id: string,
      senderId: string,
      senderName: string,
      senderAvatar: string,
      content: string,
      type: 'text' | 'file' | 'system',
      attachments: Array<{
        name: string,
        url: string,
        size: number,
        type: string
      }>,
      timestamp: string, // ISO 8601
      read: boolean // Whether current user has read this message
    }
  ]
}
```

**Example:**
```bash
curl -X GET "http://localhost:3001/api/v1/teamatonce/communication/projects/123e4567-e89b-12d3-a456-426614174000/messages?limit=20" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### 2. Send Project Message

Send a new message to a project chat and broadcast it via WebSocket.

**Endpoint:** `POST /projects/:projectId/messages`

**Parameters:**
- `projectId` (path) - Project UUID

**Request Body:**
```typescript
{
  content: string, // Required
  messageType?: 'text' | 'file' | 'image' | 'video', // Optional, default: 'text'
  attachments?: Array<{
    url: string,
    name: string,
    type: string,
    size: number
  }>,
  mentions?: string[], // Array of user IDs to mention
  replyToId?: string // Message ID being replied to
}
```

**Response:**
```typescript
{
  id: string,
  senderId: string,
  senderName: string,
  senderAvatar: string,
  content: string,
  type: string,
  attachments: Array<any>,
  timestamp: string,
  read: boolean
}
```

**WebSocket Broadcast:**
When a message is sent, it is automatically broadcast to:
1. All users in the project room: `project:${projectId}`
2. All conversation participants via their user rooms: `user:${userId}`

**Example:**
```bash
curl -X POST "http://localhost:3001/api/v1/teamatonce/communication/projects/123e4567-e89b-12d3-a456-426614174000/messages" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Hello team!",
    "messageType": "text"
  }'
```

---

### 3. Get Project Conversations

Retrieve all conversation threads for a project.

**Endpoint:** `GET /projects/:projectId/conversations`

**Parameters:**
- `projectId` (path) - Project UUID

**Response:**
```typescript
{
  conversations: [
    {
      id: string,
      title: string,
      type: 'direct' | 'group' | 'project',
      participants: string[], // Array of user IDs
      lastMessage: {
        content: string,
        senderName: string,
        timestamp: string
      } | null,
      unreadCount: number,
      updatedAt: string
    }
  ]
}
```

**Example:**
```bash
curl -X GET "http://localhost:3001/api/v1/teamatonce/communication/projects/123e4567-e89b-12d3-a456-426614174000/conversations" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 🔄 WebSocket Events

### Connection

Connect to the WebSocket gateway:

```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001/teamatonce', {
  auth: {
    token: 'YOUR_JWT_TOKEN'
  },
  query: {
    userId: 'user-123',
    projectId: 'project-456',
    teamMemberId: 'team-member-789'
  },
  transports: ['websocket', 'polling']
});
```

---

### Events to Listen For

#### 1. `new-message`
Triggered when a new message is sent to the project.

```typescript
socket.on('new-message', (data) => {
  console.log('New message received:', data);
  // data = {
  //   message: {
  //     id: string,
  //     senderId: string,
  //     senderName: string,
  //     senderAvatar: string,
  //     content: string,
  //     type: string,
  //     attachments: any[],
  //     timestamp: string,
  //     read: boolean
  //   },
  //   timestamp: string
  // }
});
```

#### 2. `message-updated`
Triggered when a message is edited or reactions are added.

```typescript
socket.on('message-updated', (data) => {
  console.log('Message updated:', data);
  // data = {
  //   conversationId: string,
  //   message: { ... },
  //   timestamp: string
  // }
});
```

#### 3. `message-deleted`
Triggered when a message is deleted.

```typescript
socket.on('message-deleted', (data) => {
  console.log('Message deleted:', data);
  // data = {
  //   conversationId: string,
  //   messageId: string,
  //   timestamp: string
  // }
});
```

#### 4. `conversation-created`
Triggered when a new conversation is created.

```typescript
socket.on('conversation-created', (data) => {
  console.log('New conversation:', data);
});
```

---

### Events to Emit

#### 1. `join-project`
Join a project room to receive real-time updates.

```typescript
socket.emit('join-project', {
  projectId: 'project-123',
  userId: 'user-456',
  teamMemberId: 'team-member-789'
});

socket.on('project-joined', (response) => {
  console.log('Joined project:', response);
});
```

#### 2. `leave-project`
Leave a project room.

```typescript
socket.emit('leave-project', {
  projectId: 'project-123'
});
```

#### 3. `send-message` (Optional)
Alternative way to send messages via WebSocket (REST API is recommended).

```typescript
socket.emit('send-message', {
  projectId: 'project-123',
  content: 'Hello!',
  type: 'text'
});

socket.on('message-acknowledged', (response) => {
  console.log('Message acknowledged:', response);
});
```

---

## 🔒 Authentication

All REST endpoints require JWT authentication:

```typescript
headers: {
  'Authorization': 'Bearer YOUR_JWT_TOKEN',
  'Content-Type': 'application/json'
}
```

WebSocket connections authenticate via query parameters and auth token:

```typescript
const socket = io(url, {
  auth: { token: 'YOUR_JWT_TOKEN' },
  query: { userId: 'user-123' }
});
```

---

## 👥 User Information Enrichment

Messages automatically include sender information fetched from:

1. **Fluxez Auth System** - Primary source for user data
   - `displayName` - User's display name
   - `email` - User's email
   - `photoURL` - User's profile photo

2. **Company Team Members** - Fallback for team members
   - `name` - Team member name
   - `email` - Team member email
   - `avatar_url` - Team member avatar

3. **Fallback** - Generic user info if not found
   - Name: "Unknown User"
   - Avatar: Generated via [UI Avatars](https://ui-avatars.com)

---

## 📊 Message Flow Diagram

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       │ 1. POST /projects/:id/messages
       │
       ▼
┌─────────────────────────────────┐
│  Communication Controller       │
└──────┬──────────────────────────┘
       │
       │ 2. chatService.sendProjectMessage()
       │
       ▼
┌─────────────────────────────────┐
│  Chat Service                   │
│  - Get/Create Conversation      │
│  - Get User Info (Fluxez)       │
│  - Insert Message (Fluxez DB)   │
│  - Format Response              │
└──────┬──────────────────────────┘
       │
       │ 3. gateway.sendToProject()
       │
       ▼
┌─────────────────────────────────┐
│  TeamAtOnce Gateway             │
│  - Emit 'new-message' event     │
│  - Broadcast to project room    │
│  - Broadcast to user rooms      │
└──────┬──────────────────────────┘
       │
       │ 4. WebSocket Event
       │
       ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Client 1   │     │  Client 2   │     │  Client 3   │
└─────────────┘     └─────────────┘     └─────────────┘
```

---

## 🧪 Testing

### Using cURL

```bash
# Get messages
curl -X GET "http://localhost:3001/api/v1/teamatonce/communication/projects/PROJECT_ID/messages" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Send message
curl -X POST "http://localhost:3001/api/v1/teamatonce/communication/projects/PROJECT_ID/messages" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "Test message", "messageType": "text"}'
```

### Using JavaScript

```javascript
// Fetch messages
const response = await fetch(
  'http://localhost:3001/api/v1/teamatonce/communication/projects/PROJECT_ID/messages',
  {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);
const { messages } = await response.json();

// Send message
const sendResponse = await fetch(
  'http://localhost:3001/api/v1/teamatonce/communication/projects/PROJECT_ID/messages',
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      content: 'Hello team!',
      messageType: 'text'
    })
  }
);
const message = await sendResponse.json();
```

---

## 🚨 Error Handling

### Common Error Responses

**401 Unauthorized**
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

**404 Not Found**
```json
{
  "statusCode": 404,
  "message": "Conversation with ID xxx not found"
}
```

**400 Bad Request**
```json
{
  "statusCode": 400,
  "message": "At least one participant is required"
}
```

---

## 📝 Additional Endpoints

### Conversation Management

#### Create Conversation
```
POST /conversations
```

#### Get User Conversations
```
GET /conversations?projectId=xxx
```

#### Send Message to Conversation
```
POST /conversations/:conversationId/messages
```

#### Get Conversation Messages
```
GET /conversations/:conversationId/messages?limit=50&offset=0
```

#### Mark Messages as Read
```
POST /conversations/:conversationId/read
```

#### Update Message
```
PUT /messages/:messageId
```

#### Delete Message
```
DELETE /messages/:messageId
```

---

## 🔍 Implementation Details

### Database Operations
- Uses **Fluxez SDK** for all database operations
- Tables: `conversations`, `messages`
- JSONB columns for flexible data storage
- Soft deletes via `deleted_at` column

### WebSocket Integration
- Uses existing `TeamAtOnceGateway`
- Project rooms: `project:${projectId}`
- User rooms: `user:${userId}`
- Real-time event broadcasting

### Performance Considerations
- Messages fetched with pagination (limit/offset)
- User info cached per request
- Efficient JSONB queries
- WebSocket rooms for targeted broadcasting

---

## 📚 Related Documentation

- [WebSocket Gateway Documentation](../../../websocket/README.md)
- [Fluxez SDK Documentation](../../fluxez/README.md)
- [Database Schema](../../../database/schema.ts)

---

## 🎯 Next Steps

1. **File Upload Integration** - Add support for file attachments
2. **Message Search** - Implement full-text search
3. **Typing Indicators** - Show when users are typing
4. **Presence System** - Track online/offline status
5. **Message Threading** - Better reply-to functionality
6. **Push Notifications** - Mobile push notifications

---

**Last Updated:** 2025-01-24
**API Version:** v1
**Status:** ✅ Production Ready
