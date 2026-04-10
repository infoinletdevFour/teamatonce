# TeamAtOnce - Project Collaboration & Communication Pages

This documentation covers the newly created project collaboration and communication features for TeamAtOnce.

## 📁 File Structure

```
frontend/src/
├── lib/
│   └── types/
│       └── project.ts                  # TypeScript interfaces for all project features
├── components/
│   └── project/
│       ├── TaskCard.tsx                # Reusable task card component
│       ├── MessageBubble.tsx           # Chat message bubble with reactions
│       ├── FileItem.tsx                # File/folder display component
│       ├── UserAvatar.tsx              # User avatar with status indicator
│       └── index.ts                    # Component exports
└── pages/
    └── project/
        ├── Workspace.tsx               # Kanban board workspace
        ├── Chat.tsx                    # Team chat with channels
        ├── VideoCall.tsx               # Video conferencing
        ├── Files.tsx                   # File manager
        └── index.ts                    # Page exports
```

## 🎯 Features Overview

### 1. **Project Workspace** (`/pages/project/Workspace.tsx`)

A comprehensive Kanban board for task management with drag-and-drop functionality.

**Key Features:**
- ✅ Drag-and-drop task management using `@hello-pangea/dnd`
- ✅ Three column layout (To Do, In Progress, Done)
- ✅ Real-time team member presence indicators
- ✅ Task filtering and search
- ✅ Task detail modal with comments
- ✅ Project statistics dashboard
- ✅ Responsive gradient design matching landing page

**Usage:**
```tsx
import { Workspace } from '@/pages/project';

// In your routing configuration
<Route path="/project/:projectId/workspace" element={<Workspace />} />
```

**Features:**
- Click on any task to view details
- Drag tasks between columns to change status
- Real-time online team member indicators
- Search tasks by title or description
- Filter tasks by status, priority, or assignee

---

### 2. **Team Chat** (`/pages/project/Chat.tsx`)

Real-time messaging system with channels, direct messages, and file sharing.

**Key Features:**
- ✅ Channel-based communication
- ✅ Direct messaging
- ✅ Message reactions and emoji picker
- ✅ Code snippet sharing with syntax highlighting
- ✅ File attachments
- ✅ Typing indicators
- ✅ Online/offline status
- ✅ Message search
- ✅ Channel info sidebar with members

**Usage:**
```tsx
import { Chat } from '@/pages/project';

<Route path="/project/:projectId/chat" element={<Chat />} />
```

**Message Types:**
- Text messages
- Code snippets with language highlighting
- File attachments
- System notifications

**Interactions:**
- Hover over messages to see quick actions (reply, react, edit, delete)
- Click emoji reactions to add your own
- Press Enter to send, Shift+Enter for new line

---

### 3. **Video Call** (`/pages/project/VideoCall.tsx`)

Full-featured video conferencing with screen sharing and meeting controls.

**Key Features:**
- ✅ Grid and speaker view modes
- ✅ Video participant cards with status
- ✅ Microphone and camera controls
- ✅ Screen sharing toggle
- ✅ Recording indicator
- ✅ Meeting chat sidebar
- ✅ Participant list
- ✅ Pin/unpin participants
- ✅ Call duration timer
- ✅ Speaking indicators

**Usage:**
```tsx
import { VideoCall } from '@/pages/project';

<Route path="/project/:projectId/call/:callId" element={<VideoCall />} />
```

**Controls:**
- Mic: Mute/unmute audio
- Camera: Toggle video on/off
- Screen: Start/stop screen sharing
- Record: Start/stop recording (with visual indicator)
- Participants: View all meeting participants
- Chat: Toggle meeting chat sidebar
- Leave: End the call

**View Modes:**
- Speaker View: Large primary video with thumbnail strip
- Grid View: Equal-sized participant tiles (2x2, 3x2, 4x2 layouts)

---

### 4. **File Manager** (`/pages/project/Files.tsx`)

Comprehensive file management with upload, preview, and version control.

**Key Features:**
- ✅ Grid and list view modes
- ✅ Drag-and-drop file upload
- ✅ File type filtering (images, videos, documents, code, etc.)
- ✅ Search functionality
- ✅ Multiple sort options (name, date, size, type)
- ✅ File preview modal
- ✅ Version history tracking
- ✅ Storage usage indicator
- ✅ File type statistics
- ✅ Download and delete actions
- ✅ Tag management

**Usage:**
```tsx
import { Files } from '@/pages/project';

<Route path="/project/:projectId/files" element={<Files />} />
```

**File Types Supported:**
- Images (with thumbnail preview)
- Videos
- Documents (PDF, DOC, etc.)
- Code files
- Audio files
- Archives (ZIP, RAR, etc.)
- Folders

**Interactions:**
- Click files to preview
- Drag files to upload
- Switch between grid/list views
- Filter by file type
- Sort by name, date, size, or type

---

## 🧩 Shared Components

### TaskCard (`/components/project/TaskCard.tsx`)

Displays task information in a compact card format.

**Props:**
```typescript
interface TaskCardProps {
  task: Task;
  onClick?: () => void;
  isDragging?: boolean;
}
```

**Features:**
- Priority flag indicator
- Assignee avatar
- Due date
- Comment count
- Attachment count
- Tags (up to 3 displayed)
- Hover effects and animations

---

### MessageBubble (`/components/project/MessageBubble.tsx`)

Renders chat messages with rich interactions.

**Props:**
```typescript
interface MessageBubbleProps {
  message: Message;
  isOwnMessage?: boolean;
  showAvatar?: boolean;
  onReply?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onReact?: (emoji: string) => void;
}
```

**Features:**
- Different styles for own vs. others' messages
- Avatar display
- Timestamp and edited indicator
- Reactions display
- Quick actions (reply, react, edit, delete)
- Code snippet highlighting
- File attachments
- Emoji picker

---

### FileItem (`/components/project/FileItem.tsx`)

Displays files and folders in grid or list view.

**Props:**
```typescript
interface FileItemProps {
  file: FileItem;
  view?: 'grid' | 'list';
  onSelect?: () => void;
  onDownload?: () => void;
  onDelete?: () => void;
  onPreview?: () => void;
}
```

**Features:**
- File type icons with color coding
- Thumbnail preview for images
- File size formatting
- Upload date and user
- Version indicator
- Tags display
- Hover actions (preview, download, delete)

---

### UserAvatar (`/components/project/UserAvatar.tsx`)

Displays user avatar with optional status indicator.

**Props:**
```typescript
interface UserAvatarProps {
  user: TeamMember;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showStatus?: boolean;
  className?: string;
}
```

**Features:**
- Multiple sizes
- Online/away/busy/offline status indicators
- Fallback to initials if no avatar
- Gradient background for initials

---

## 📦 TypeScript Types

All types are defined in `/lib/types/project.ts`:

**Core Types:**
- `Task` - Task management
- `KanbanColumn` - Kanban board columns
- `TeamMember` - User/team member information
- `Message` - Chat messages
- `Channel` - Communication channels
- `VideoParticipant` - Video call participants
- `FileItem` - File/folder items
- `Comment` - Comments on tasks/files
- `Attachment` - File attachments
- `Reaction` - Message reactions

**Enums:**
- `TaskStatus`: 'todo' | 'in-progress' | 'done'
- `TaskPriority`: 'low' | 'medium' | 'high' | 'urgent'
- `FileType`: 'image' | 'video' | 'audio' | 'document' | 'code' | 'archive' | 'other'
- `UserStatus`: 'online' | 'away' | 'busy' | 'offline'

---

## 🎨 Design System

All pages follow the TeamAtOnce design system:

**Colors:**
- Primary: `#47bdff` (Blue)
- Gradient: `from-blue-600 to-purple-600`
- Background: `from-blue-50 via-purple-50 to-pink-50`

**Components:**
- Rounded corners: `rounded-xl` (12px), `rounded-2xl` (16px)
- Shadows: `shadow-sm`, `shadow-lg`, `shadow-2xl`
- Borders: `border-2` with gray/colored variants
- Animations: Framer Motion for smooth transitions

**Typography:**
- Headings: Font weight 800-900 (black/extrabold)
- Body: Font weight 400-600 (normal/semibold)
- Gradient text: `bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent`

---

## 🔧 Dependencies Used

Make sure these packages are installed:

```json
{
  "@hello-pangea/dnd": "^18.0.1",           // Drag and drop
  "framer-motion": "^12.23.12",              // Animations
  "lucide-react": "^0.540.0",                // Icons
  "date-fns": "^4.1.0",                      // Date formatting
  "react": "^19.1.1",                        // React
  "react-dom": "^19.1.1"                     // React DOM
}
```

---

## 🚀 Integration Guide

### 1. **Import in Your App**

```tsx
// In your main routing file
import { Workspace, Chat, VideoCall, Files } from '@/pages/project';

// Define routes
const projectRoutes = [
  {
    path: '/project/:projectId',
    children: [
      { path: 'workspace', element: <Workspace /> },
      { path: 'chat', element: <Chat /> },
      { path: 'call/:callId', element: <VideoCall /> },
      { path: 'files', element: <Files /> },
    ],
  },
];
```

### 2. **Navigation Between Pages**

```tsx
import { useNavigate } from 'react-router-dom';

const ProjectNavigation = ({ projectId }) => {
  const navigate = useNavigate();

  return (
    <nav>
      <button onClick={() => navigate(`/project/${projectId}/workspace`)}>
        Workspace
      </button>
      <button onClick={() => navigate(`/project/${projectId}/chat`)}>
        Chat
      </button>
      <button onClick={() => navigate(`/project/${projectId}/call/room-123`)}>
        Video Call
      </button>
      <button onClick={() => navigate(`/project/${projectId}/files`)}>
        Files
      </button>
    </nav>
  );
};
```

### 3. **Connect to Backend**

Replace mock data with API calls:

```tsx
// Example: Workspace with real data
import { useState, useEffect } from 'react';
import axios from 'axios';

const Workspace = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await axios.get('/api/projects/123/tasks');
        setTasks(response.data);
      } catch (error) {
        console.error('Error fetching tasks:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  // Rest of component...
};
```

### 4. **Real-time Features with Socket.io**

```tsx
// Example: Chat with WebSocket
import { useEffect } from 'react';
import io from 'socket.io-client';

const Chat = () => {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const newSocket = io('http://localhost:3001');
    setSocket(newSocket);

    newSocket.on('message', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    return () => newSocket.close();
  }, []);

  const sendMessage = (content) => {
    socket.emit('send-message', {
      channelId: selectedChannel.id,
      content,
    });
  };

  // Rest of component...
};
```

---

## 🎯 Best Practices

### Performance
- Use `React.memo` for expensive components
- Implement virtual scrolling for large lists
- Lazy load file previews
- Debounce search inputs

### Accessibility
- All interactive elements have proper ARIA labels
- Keyboard navigation supported
- Focus management in modals
- Color contrast ratios meet WCAG standards

### Security
- Sanitize user input
- Validate file uploads
- Implement proper authentication
- Use HTTPS for WebSocket connections

### Testing
```tsx
// Example test for TaskCard
import { render, screen } from '@testing-library/react';
import { TaskCard } from '@/components/project';

test('renders task title', () => {
  const task = {
    id: '1',
    title: 'Test Task',
    status: 'todo',
    priority: 'high',
    // ... other required fields
  };

  render(<TaskCard task={task} />);
  expect(screen.getByText('Test Task')).toBeInTheDocument();
});
```

---

## 📱 Responsive Design

All pages are fully responsive with breakpoints:

- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px
- Wide: > 1536px

Mobile-specific features:
- Collapsible sidebars
- Touch-friendly controls
- Optimized layouts for smaller screens

---

## 🐛 Troubleshooting

**Issue: Drag and drop not working**
- Ensure `@hello-pangea/dnd` is installed correctly
- Check that `DragDropContext` wraps the droppable areas

**Issue: Animations stuttering**
- Reduce motion in `framer-motion` settings
- Check for unnecessary re-renders with React DevTools

**Issue: File upload not working**
- Verify backend accepts multipart/form-data
- Check file size limits
- Ensure proper CORS configuration

---

## 📄 License

Part of TeamAtOnce platform. All rights reserved.

---

## 👥 Contributing

When adding new features:
1. Follow the existing design patterns
2. Use TypeScript interfaces from `/lib/types/project.ts`
3. Match the gradient style from landing page
4. Add proper error handling
5. Include loading states and skeleton loaders
6. Write tests for critical functionality

---

## 🔮 Future Enhancements

Planned features:
- [ ] Offline mode with local caching
- [ ] Advanced filtering with saved views
- [ ] Bulk operations (multi-select)
- [ ] Keyboard shortcuts
- [ ] Export data (CSV, PDF)
- [ ] Integration with third-party tools (Slack, Discord)
- [ ] Mobile apps (React Native)
- [ ] AI-powered task suggestions
- [ ] Advanced analytics dashboard

---

**Built with ❤️ for TeamAtOnce**
