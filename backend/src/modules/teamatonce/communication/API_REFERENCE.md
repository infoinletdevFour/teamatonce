# Communication API Reference Card

## 🎯 Quick Reference

**Base URL:** `http://localhost:3001/api/v1/teamatonce/communication`
**Auth:** `Authorization: Bearer <JWT_TOKEN>`

---

## 📨 Chat Endpoints

### Get Project Messages
```http
GET /projects/:projectId/messages
Query: ?limit=50&offset=0
```
**Response:**
```json
{
  "messages": [
    {
      "id": "uuid",
      "senderId": "user-123",
      "senderName": "John Doe",
      "senderAvatar": "https://...",
      "content": "Hello!",
      "type": "text",
      "attachments": [],
      "timestamp": "2025-01-24T12:00:00Z",
      "read": false
    }
  ]
}
```

### Send Project Message
```http
POST /projects/:projectId/messages
Content-Type: application/json
```
**Body:**
```json
{
  "content": "Hello team!",
  "messageType": "text",
  "attachments": [],
  "mentions": [],
  "replyToId": null
}
```

### Get Conversations
```http
GET /projects/:projectId/conversations
```

---

## 💬 Conversation Endpoints

### Create Conversation
```http
POST /conversations
```
**Body:**
```json
{
  "title": "Dev Team",
  "conversationType": "group",
  "participants": ["user-1", "user-2"],
  "projectId": "project-123"
}
```

### Get User Conversations
```http
GET /conversations?projectId=xxx
```

### Get Conversation Messages
```http
GET /conversations/:conversationId/messages?limit=50&offset=0
```

### Send Message to Conversation
```http
POST /conversations/:conversationId/messages
```

### Mark Messages as Read
```http
POST /conversations/:conversationId/read
```

### Update Message
```http
PUT /messages/:messageId
```
**Body:**
```json
{
  "content": "Updated content",
  "reactions": {
    "👍": ["user-1", "user-2"],
    "❤️": ["user-3"]
  }
}
```

### Delete Message
```http
DELETE /messages/:messageId
```

---

## 📅 Meeting Endpoints

### Create Meeting
```http
POST /projects/:projectId/meetings
```
**Body:**
```json
{
  "title": "Sprint Planning",
  "description": "Plan next sprint",
  "meetingType": "video",
  "startTime": "2025-01-25T14:00:00Z",
  "endTime": "2025-01-25T15:00:00Z",
  "attendees": ["user-1", "user-2"]
}
```

### Get Meetings
```http
GET /projects/:projectId/meetings
```

### Get Upcoming Meetings
```http
GET /projects/:projectId/meetings/upcoming?limit=5
```

### Update Meeting
```http
PUT /meetings/:meetingId
```

### Cancel Meeting
```http
DELETE /meetings/:meetingId
```

---

## 🎨 Whiteboard Endpoints

### Create Session
```http
POST /projects/:projectId/whiteboards
```
**Body:**
```json
{
  "name": "Design Mockups",
  "canvasData": {}
}
```

### Get Sessions
```http
GET /projects/:projectId/whiteboards
```

### Update Session
```http
PUT /whiteboards/:sessionId
```
**Body:**
```json
{
  "canvasData": { "objects": [...] }
}
```

---

## 📆 Calendar Endpoints

### Create Event
```http
POST /projects/:projectId/events
```
**Body:**
```json
{
  "title": "Milestone Review",
  "description": "Review milestone 1",
  "startDate": "2025-01-30T10:00:00Z",
  "endDate": "2025-01-30T11:00:00Z",
  "allDay": false,
  "color": "#FF5733"
}
```

### Get Events
```http
GET /projects/:projectId/events?start=2025-01-01&end=2025-01-31
```

---

## 🎥 Video Endpoints

### Create Session
```http
POST /projects/:projectId/video-sessions
```
**Body:**
```json
{
  "roomName": "Daily Standup",
  "sessionType": "meeting",
  "scheduledAt": "2025-01-25T09:00:00Z"
}
```

### Join Session
```http
POST /video-sessions/:sessionId/join
```
**Body:**
```json
{
  "userId": "user-123"
}
```

### End Session
```http
POST /video-sessions/:sessionId/end
```

### Get Active Sessions
```http
GET /projects/:projectId/video-sessions/active
```

---

## 🔌 WebSocket Events

### Connection
```javascript
const socket = io('http://localhost:3001/teamatonce', {
  auth: { token: 'JWT_TOKEN' },
  query: {
    userId: 'user-123',
    projectId: 'project-456'
  }
});
```

### Client → Server Events

#### Join Project
```javascript
socket.emit('join-project', {
  projectId: 'project-123',
  userId: 'user-456',
  teamMemberId: 'team-789'
});
```

#### Leave Project
```javascript
socket.emit('leave-project', {
  projectId: 'project-123'
});
```

#### Join Whiteboard
```javascript
socket.emit('join-whiteboard', {
  sessionId: 'session-123',
  projectId: 'project-456',
  userId: 'user-789',
  userName: 'John Doe'
});
```

#### Update Whiteboard
```javascript
socket.emit('whiteboard-update', {
  sessionId: 'session-123',
  projectId: 'project-456',
  userId: 'user-789',
  canvasData: { objects: [...] }
});
```

### Server → Client Events

#### New Message
```javascript
socket.on('new-message', (data) => {
  // data = {
  //   message: { id, senderId, senderName, content, ... },
  //   timestamp: '2025-01-24T12:00:00Z'
  // }
});
```

#### Message Updated
```javascript
socket.on('message-updated', (data) => {
  // data = {
  //   conversationId: 'uuid',
  //   message: { ... },
  //   timestamp: '2025-01-24T12:00:00Z'
  // }
});
```

#### Message Deleted
```javascript
socket.on('message-deleted', (data) => {
  // data = {
  //   conversationId: 'uuid',
  //   messageId: 'uuid',
  //   timestamp: '2025-01-24T12:00:00Z'
  // }
});
```

#### Conversation Created
```javascript
socket.on('conversation-created', (data) => {
  // data = {
  //   conversation: { ... },
  //   timestamp: '2025-01-24T12:00:00Z'
  // }
});
```

#### Member Status Update
```javascript
socket.on('member-status-update', (data) => {
  // data = {
  //   memberId: 'team-123',
  //   online: true,
  //   timestamp: '2025-01-24T12:00:00Z'
  // }
});
```

#### Whiteboard Update
```javascript
socket.on('whiteboard-update', (data) => {
  // data = {
  //   userId: 'user-123',
  //   canvasData: { objects: [...] },
  //   timestamp: '2025-01-24T12:00:00Z'
  // }
});
```

#### User Joined Whiteboard
```javascript
socket.on('user-joined-whiteboard', (data) => {
  // data = {
  //   userId: 'user-123',
  //   userName: 'John Doe',
  //   timestamp: '2025-01-24T12:00:00Z'
  // }
});
```

---

## 📋 Common Request/Response Patterns

### Error Response
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

### Success Response (Generic)
```json
{
  "success": true,
  "message": "Operation completed successfully"
}
```

### Pagination Response
```json
{
  "data": [...],
  "total": 150,
  "limit": 50,
  "offset": 0,
  "hasMore": true
}
```

---

## 🔐 Authentication Headers

### All Requests
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

### WebSocket Connection
```javascript
{
  auth: {
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  }
}
```

---

## 📊 Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 500 | Internal Server Error |

---

## 🎯 Message Types

```typescript
type MessageType = 'text' | 'file' | 'image' | 'video' | 'system';
```

## 🎭 Conversation Types

```typescript
type ConversationType = 'direct' | 'group' | 'project';
```

## 📅 Meeting Types

```typescript
type MeetingType = 'video' | 'audio' | 'in_person';
```

## 🎥 Video Session Types

```typescript
type SessionType = 'meeting' | 'demo' | 'review' | 'training';
```

---

## 🔄 Real-time Flow

```
1. Client connects to WebSocket
   ↓
2. Client emits 'join-project'
   ↓
3. Client receives 'project-joined'
   ↓
4. Client sends message via POST /messages
   ↓
5. Server saves to database
   ↓
6. Server emits 'new-message' to all project members
   ↓
7. All clients receive and display message
```

---

## 💡 Best Practices

### 1. Message Sending
```javascript
// ✅ Good: Use REST API
await fetch('/projects/123/messages', {
  method: 'POST',
  body: JSON.stringify({ content: 'Hello' })
});

// ❌ Bad: Don't use WebSocket for sending
socket.emit('send-message', { content: 'Hello' });
```

### 2. Pagination
```javascript
// ✅ Good: Load messages in chunks
const messages = await fetchMessages(projectId, 50, 0);

// ❌ Bad: Load all messages at once
const allMessages = await fetchMessages(projectId, 999999, 0);
```

### 3. Error Handling
```javascript
// ✅ Good: Handle errors gracefully
try {
  const response = await sendMessage(content);
} catch (error) {
  console.error('Failed to send:', error);
  showErrorToast('Message failed to send');
}
```

---

## 📱 Example Implementations

### React
```jsx
const { messages, sendMessage } = useChat(projectId);
```

### Vue
```vue
const { messages, sendMessage } = useChat(projectId);
```

### Angular
```typescript
constructor(private chatService: ChatService) {}
this.chatService.messages$.subscribe(messages => {});
```

---

**API Version:** v1
**Last Updated:** 2025-01-24
**Base URL:** `http://localhost:3001/api/v1/teamatonce/communication`
