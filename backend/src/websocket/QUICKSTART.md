# TeamAtOnce WebSocket Quick Start Guide

## Installation Complete

The WebSocket module has been successfully installed and configured. Here's what was set up:

### Files Created

1. **Core Files**
   - `src/websocket/teamatonce.gateway.ts` - Main WebSocket gateway
   - `src/websocket/websocket.module.ts` - Module configuration
   - `src/websocket/guards/ws-auth.guard.ts` - JWT authentication guard
   - `src/websocket/dto/websocket.dto.ts` - Data transfer objects
   - `src/websocket/interfaces/websocket.interface.ts` - TypeScript interfaces
   - `src/websocket/index.ts` - Module exports

2. **Documentation**
   - `src/websocket/README.md` - Comprehensive documentation
   - `src/websocket/QUICKSTART.md` - This file
   - `src/websocket/examples/websocket-usage.example.ts` - Usage examples

### Dependencies Installed

```bash
@socket.io/redis-adapter@^8.3.0
redis@^5.8.3
```

### Configuration Added

The following environment variables were added to `.env`:

```bash
REDIS_HOST=localhost
REDIS_PORT=6379
# REDIS_PASSWORD=your-redis-password
```

### Module Integration

The `TeamAtOnceWebSocketModule` has been imported into `app.module.ts`.

## Next Steps

### 1. Start Redis (Required for Production)

For development, you can skip Redis (single instance only):

```bash
# Using Docker
docker run -d -p 6379:6379 redis:latest

# Or using docker-compose (if configured)
docker-compose up -d redis
```

### 2. Start the Backend Server

```bash
cd backend
npm run start:dev
```

The WebSocket server will be available at:
- **WebSocket URL**: `ws://localhost:3001/teamatonce`
- **HTTP URL**: `http://localhost:3001`

### 3. Test the Connection

#### Using Browser Console

```javascript
// Import Socket.IO client in your HTML
// <script src="https://cdn.socket.io/4.8.1/socket.io.min.js"></script>

const socket = io('http://localhost:3001/teamatonce', {
  path: '/socket.io/',
  transports: ['websocket', 'polling'],
  auth: {
    token: 'your-jwt-token', // Optional for testing
  },
  query: {
    userId: 'test-user-123',
  },
});

socket.on('connect', () => {
  console.log('✅ Connected to TeamAtOnce WebSocket');

  // Join a project
  socket.emit('join-project', {
    projectId: 'project-123',
    userId: 'test-user-123',
  });
});

socket.on('project-joined', (data) => {
  console.log('✅ Joined project:', data);
});

socket.on('project-message', (message) => {
  console.log('📨 New message:', message);
});

socket.on('disconnect', () => {
  console.log('❌ Disconnected');
});

// Send a test message
socket.emit('project-message', {
  projectId: 'project-123',
  userId: 'test-user-123',
  content: 'Hello, Team!',
  type: 'text',
});
```

#### Using Node.js Script

Create `test-socket.js`:

```javascript
const io = require('socket.io-client');

const socket = io('http://localhost:3001/teamatonce', {
  path: '/socket.io/',
  transports: ['websocket'],
  query: {
    userId: 'test-user-123',
  },
});

socket.on('connect', () => {
  console.log('✅ Connected');

  socket.emit('join-project', {
    projectId: 'test-project',
    userId: 'test-user-123',
  });
});

socket.on('project-joined', (data) => {
  console.log('✅ Project joined:', data);
});

socket.on('project-message', (msg) => {
  console.log('📨 Message:', msg);
});

socket.on('disconnect', () => {
  console.log('❌ Disconnected');
});
```

Run it:

```bash
node test-socket.js
```

### 4. Integrate with Your Frontend

#### React Example

```typescript
// hooks/useTeamAtOnceSocket.ts
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export function useTeamAtOnceSocket(userId: string, projectId?: string) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('auth-token');

    const socketInstance = io('http://localhost:3001/teamatonce', {
      path: '/socket.io/',
      auth: { token },
      query: { userId, projectId },
    });

    socketInstance.on('connect', () => {
      console.log('Connected to WebSocket');
      setConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('Disconnected from WebSocket');
      setConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [userId, projectId]);

  return { socket, connected };
}

// Usage in component
function ProjectChat({ projectId, userId }: Props) {
  const { socket, connected } = useTeamAtOnceSocket(userId, projectId);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (!socket) return;

    // Listen for messages
    socket.on('project-message', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    // Join project room
    socket.emit('join-project', { projectId, userId });

    return () => {
      socket.off('project-message');
    };
  }, [socket, projectId, userId]);

  const sendMessage = (content: string) => {
    if (!socket) return;

    socket.emit('project-message', {
      projectId,
      userId,
      content,
      type: 'text',
    });
  };

  return (
    <div>
      <div>Status: {connected ? '🟢 Connected' : '🔴 Disconnected'}</div>
      {/* Your chat UI */}
    </div>
  );
}
```

### 5. Use in Your Backend Services

```typescript
import { Injectable } from '@nestjs/common';
import { TeamAtOnceGateway } from './websocket/teamatonce.gateway';

@Injectable()
export class ProjectService {
  constructor(
    private readonly wsGateway: TeamAtOnceGateway,
  ) {}

  async updateProject(projectId: string, data: any) {
    // Your business logic
    // ...

    // Notify all project members
    this.wsGateway.sendToProject(projectId, 'project-updated', {
      projectId,
      data,
      timestamp: new Date(),
    });
  }

  async notifyUser(userId: string, message: string) {
    this.wsGateway.sendToUser(userId, 'notification', {
      message,
      timestamp: new Date(),
    });
  }
}
```

## Troubleshooting

### Connection Refused

1. Check if backend is running: `http://localhost:3001`
2. Verify CORS settings in `teamatonce.gateway.ts`
3. Check firewall/port settings

### Redis Connection Failed

If you see Redis errors but the server starts:
```
Failed to initialize Redis adapter: [error]
WebSocket will run without Redis adapter (single instance only)
```

This is OK for development. The WebSocket will work but won't scale across multiple instances.

To fix:
1. Start Redis: `docker run -d -p 6379:6379 redis`
2. Verify Redis is running: `redis-cli ping` (should return PONG)

### Authentication Issues

If connections are rejected:
1. Check JWT token is valid
2. Verify JWT_SECRET in `.env` matches your auth module
3. Check token is passed correctly in auth or query parameters

### No Messages Received

1. Verify you've joined the correct room/project
2. Check room naming conventions (see README.md)
3. Enable debug logging to see events

## Monitoring

### Check Connected Clients

Add this endpoint to monitor connections:

```typescript
@Controller('websocket')
export class WebSocketController {
  constructor(private readonly wsGateway: TeamAtOnceGateway) {}

  @Get('stats')
  getStats() {
    return {
      connectedClients: this.wsGateway.server.sockets.sockets.size,
      rooms: Array.from(this.wsGateway.server.sockets.adapter.rooms.keys()),
    };
  }

  @Get('project/:projectId/members')
  getProjectMembers(@Param('projectId') projectId: string) {
    return {
      members: this.wsGateway.getProjectMembers(projectId),
    };
  }
}
```

### Logging

Enable verbose logging in the gateway by uncommenting debug logs:

```typescript
this.logger.debug(`Whiteboard update broadcast to session ${payload.sessionId}`);
```

## Production Deployment

### 1. Environment Variables

Update `.env` for production:

```bash
REDIS_HOST=your-redis-host.com
REDIS_PORT=6379
REDIS_PASSWORD=your-secure-password
JWT_SECRET=your-secure-jwt-secret
JWT_EXPIRES_IN=7d
```

### 2. CORS Configuration

Update CORS in `teamatonce.gateway.ts`:

```typescript
cors: {
  origin: [
    'https://your-production-domain.com',
    'https://www.your-production-domain.com',
  ],
  credentials: true,
},
```

### 3. Use WSS (Secure WebSocket)

Ensure your reverse proxy (Nginx) handles SSL:

```nginx
location /socket.io/ {
  proxy_pass http://localhost:3001;
  proxy_http_version 1.1;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection "upgrade";
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
}
```

### 4. Scale with Multiple Instances

With Redis adapter, you can run multiple backend instances:

```bash
# Instance 1
PORT=3001 npm start

# Instance 2
PORT=3002 npm start

# Load balancer will distribute connections
```

## Resources

- **Full Documentation**: See `README.md`
- **Usage Examples**: See `examples/websocket-usage.example.ts`
- **Socket.IO Docs**: https://socket.io/docs/v4/
- **Redis Adapter Docs**: https://socket.io/docs/v4/redis-adapter/

## Support

For issues or questions:
1. Check the README.md for detailed documentation
2. Review the example files
3. Enable debug logging to troubleshoot
4. Check Socket.IO and Redis documentation

## What's Next?

1. ✅ Redis is running
2. ✅ Backend server is running
3. ⬜ Frontend integration
4. ⬜ Service integration (see examples)
5. ⬜ Production deployment

Happy coding! 🚀
