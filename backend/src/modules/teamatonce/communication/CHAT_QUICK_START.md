# Chat API Quick Start Guide

## 🚀 5-Minute Integration

### Prerequisites
- JWT authentication token
- Project ID
- WebSocket client library (socket.io-client)

---

## Step 1: Connect to WebSocket

```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001/teamatonce', {
  auth: { token: YOUR_JWT_TOKEN },
  query: {
    userId: YOUR_USER_ID,
    projectId: YOUR_PROJECT_ID
  }
});

socket.on('connect', () => {
  console.log('Connected to chat!');
});
```

---

## Step 2: Join Project Room

```typescript
socket.emit('join-project', {
  projectId: YOUR_PROJECT_ID,
  userId: YOUR_USER_ID
});

socket.on('project-joined', (response) => {
  console.log('Joined project room:', response);
});
```

---

## Step 3: Listen for Messages

```typescript
socket.on('new-message', (data) => {
  console.log('New message:', data.message);
  // Update your UI with the new message
  // data.message contains: id, senderId, senderName, senderAvatar, content, etc.
});
```

---

## Step 4: Fetch Existing Messages

```typescript
async function fetchMessages(projectId, limit = 50) {
  const response = await fetch(
    `http://localhost:3001/api/v1/teamatonce/communication/projects/${projectId}/messages?limit=${limit}`,
    {
      headers: {
        'Authorization': `Bearer ${YOUR_JWT_TOKEN}`
      }
    }
  );

  const { messages } = await response.json();
  return messages;
}

// Usage
const messages = await fetchMessages('your-project-id');
console.log('Chat history:', messages);
```

---

## Step 5: Send a Message

```typescript
async function sendMessage(projectId, content) {
  const response = await fetch(
    `http://localhost:3001/api/v1/teamatonce/communication/projects/${projectId}/messages`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${YOUR_JWT_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: content,
        messageType: 'text'
      })
    }
  );

  const message = await response.json();
  return message;
}

// Usage
const sentMessage = await sendMessage('your-project-id', 'Hello team!');
console.log('Message sent:', sentMessage);
```

---

## Complete React Example

```tsx
import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  type: string;
  timestamp: string;
  read: boolean;
}

const ChatComponent: React.FC<{ projectId: string; token: string; userId: string }> = ({
  projectId,
  token,
  userId
}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');

  useEffect(() => {
    // Connect to WebSocket
    const newSocket = io('http://localhost:3001/teamatonce', {
      auth: { token },
      query: { userId, projectId }
    });

    newSocket.on('connect', () => {
      console.log('Connected to chat');

      // Join project room
      newSocket.emit('join-project', { projectId, userId });
    });

    // Listen for new messages
    newSocket.on('new-message', (data) => {
      setMessages(prev => [...prev, data.message]);
    });

    setSocket(newSocket);

    // Fetch existing messages
    fetchMessages();

    return () => {
      newSocket.close();
    };
  }, [projectId, token, userId]);

  const fetchMessages = async () => {
    try {
      const response = await fetch(
        `http://localhost:3001/api/v1/teamatonce/communication/projects/${projectId}/messages`,
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      const { messages } = await response.json();
      setMessages(messages);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    try {
      const response = await fetch(
        `http://localhost:3001/api/v1/teamatonce/communication/projects/${projectId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            content: inputMessage,
            messageType: 'text'
          })
        }
      );

      const message = await response.json();
      setInputMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  return (
    <div className="chat-container">
      <div className="messages">
        {messages.map(msg => (
          <div key={msg.id} className="message">
            <img src={msg.senderAvatar} alt={msg.senderName} />
            <div>
              <strong>{msg.senderName}</strong>
              <p>{msg.content}</p>
              <small>{new Date(msg.timestamp).toLocaleString()}</small>
            </div>
          </div>
        ))}
      </div>

      <div className="input-area">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type a message..."
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
};

export default ChatComponent;
```

---

## Vue.js Example

```vue
<template>
  <div class="chat-container">
    <div class="messages">
      <div v-for="msg in messages" :key="msg.id" class="message">
        <img :src="msg.senderAvatar" :alt="msg.senderName" />
        <div>
          <strong>{{ msg.senderName }}</strong>
          <p>{{ msg.content }}</p>
          <small>{{ formatTime(msg.timestamp) }}</small>
        </div>
      </div>
    </div>

    <div class="input-area">
      <input
        v-model="inputMessage"
        @keyup.enter="sendMessage"
        placeholder="Type a message..."
      />
      <button @click="sendMessage">Send</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { io, Socket } from 'socket.io-client';

interface Props {
  projectId: string;
  token: string;
  userId: string;
}

const props = defineProps<Props>();

const socket = ref<Socket | null>(null);
const messages = ref<any[]>([]);
const inputMessage = ref('');

onMounted(async () => {
  // Connect to WebSocket
  socket.value = io('http://localhost:3001/teamatonce', {
    auth: { token: props.token },
    query: { userId: props.userId, projectId: props.projectId }
  });

  socket.value.on('connect', () => {
    socket.value?.emit('join-project', {
      projectId: props.projectId,
      userId: props.userId
    });
  });

  socket.value.on('new-message', (data) => {
    messages.value.push(data.message);
  });

  // Fetch existing messages
  await fetchMessages();
});

onUnmounted(() => {
  socket.value?.close();
});

const fetchMessages = async () => {
  const response = await fetch(
    `http://localhost:3001/api/v1/teamatonce/communication/projects/${props.projectId}/messages`,
    {
      headers: { 'Authorization': `Bearer ${props.token}` }
    }
  );
  const { messages: fetchedMessages } = await response.json();
  messages.value = fetchedMessages;
};

const sendMessage = async () => {
  if (!inputMessage.value.trim()) return;

  await fetch(
    `http://localhost:3001/api/v1/teamatonce/communication/projects/${props.projectId}/messages`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${props.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: inputMessage.value,
        messageType: 'text'
      })
    }
  );

  inputMessage.value = '';
};

const formatTime = (timestamp: string) => {
  return new Date(timestamp).toLocaleString();
};
</script>
```

---

## Angular Example

```typescript
// chat.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  type: string;
  timestamp: string;
  read: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private socket: Socket | null = null;
  private messagesSubject = new BehaviorSubject<Message[]>([]);
  public messages$ = this.messagesSubject.asObservable();

  constructor(private http: HttpClient) {}

  connect(projectId: string, token: string, userId: string) {
    this.socket = io('http://localhost:3001/teamatonce', {
      auth: { token },
      query: { userId, projectId }
    });

    this.socket.on('connect', () => {
      this.socket?.emit('join-project', { projectId, userId });
    });

    this.socket.on('new-message', (data) => {
      const currentMessages = this.messagesSubject.value;
      this.messagesSubject.next([...currentMessages, data.message]);
    });

    this.fetchMessages(projectId, token);
  }

  async fetchMessages(projectId: string, token: string) {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    const response = await this.http.get<{ messages: Message[] }>(
      `http://localhost:3001/api/v1/teamatonce/communication/projects/${projectId}/messages`,
      { headers }
    ).toPromise();

    if (response) {
      this.messagesSubject.next(response.messages);
    }
  }

  async sendMessage(projectId: string, token: string, content: string) {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.post(
      `http://localhost:3001/api/v1/teamatonce/communication/projects/${projectId}/messages`,
      { content, messageType: 'text' },
      { headers }
    ).toPromise();
  }

  disconnect() {
    this.socket?.close();
  }
}

// chat.component.ts
import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { ChatService } from './chat.service';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html'
})
export class ChatComponent implements OnInit, OnDestroy {
  @Input() projectId!: string;
  @Input() token!: string;
  @Input() userId!: string;

  messages$ = this.chatService.messages$;
  inputMessage = '';

  constructor(private chatService: ChatService) {}

  ngOnInit() {
    this.chatService.connect(this.projectId, this.token, this.userId);
  }

  ngOnDestroy() {
    this.chatService.disconnect();
  }

  async sendMessage() {
    if (!this.inputMessage.trim()) return;

    await this.chatService.sendMessage(
      this.projectId,
      this.token,
      this.inputMessage
    );

    this.inputMessage = '';
  }
}
```

---

## Testing with Postman

### 1. Get Messages
```
GET http://localhost:3001/api/v1/teamatonce/communication/projects/YOUR_PROJECT_ID/messages
Headers:
  Authorization: Bearer YOUR_JWT_TOKEN
```

### 2. Send Message
```
POST http://localhost:3001/api/v1/teamatonce/communication/projects/YOUR_PROJECT_ID/messages
Headers:
  Authorization: Bearer YOUR_JWT_TOKEN
  Content-Type: application/json
Body (JSON):
{
  "content": "Hello from Postman!",
  "messageType": "text"
}
```

---

## Common Issues

### WebSocket Not Connecting
- Check CORS configuration
- Verify JWT token is valid
- Ensure userId and projectId are provided

### Messages Not Appearing
- Verify you've joined the project room
- Check console for WebSocket errors
- Ensure REST API calls are successful

### User Info Not Loading
- Verify user exists in Fluxez auth system
- Check company_team_members table
- Fallback will show "Unknown User"

---

## Environment Variables

```bash
# Backend .env
FLUXEZ_PROJECT_ID=your-project-id
FLUXEZ_API_KEY=your-api-key
DATABASE_URL=postgresql://...
```

---

## Next Steps

1. **Add File Uploads** - Extend to support file attachments
2. **Implement Typing Indicators** - Show when users are typing
3. **Add Message Reactions** - Allow emoji reactions
4. **Create Message Search** - Full-text search capability
5. **Add Push Notifications** - Mobile push notifications

---

**Need Help?**
- 📚 [Full API Documentation](./CHAT_API_DOCUMENTATION.md)
- 🔌 [WebSocket Gateway Docs](../../../websocket/README.md)
- 💬 Contact: support@teamatonce.com
