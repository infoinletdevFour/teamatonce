/**
 * Interface for authenticated socket client
 */
export interface AuthenticatedSocket {
  id: string;
  user?: {
    sub: string; // User ID from JWT
    userId?: string; // Fallback user ID
    email?: string;
    role?: string;
  };
  handshake: {
    query: {
      userId?: string;
      projectId?: string;
      teamMemberId?: string;
      token?: string;
    };
    auth?: {
      token?: string;
    };
  };
  join: (room: string) => void;
  leave: (room: string) => void;
  emit: (event: string, data: any) => void;
  to: (room: string) => any;
}

/**
 * Interface for WebSocket events
 */
export interface WebSocketEvents {
  // Connection events
  connection: (socket: AuthenticatedSocket) => void;
  disconnect: (socket: AuthenticatedSocket) => void;

  // Project room events
  'join-project': (data: { projectId: string; userId: string; teamMemberId?: string }) => void;
  'leave-project': (data: { projectId: string }) => void;

  // Whiteboard events
  'join-whiteboard': (data: { sessionId: string; projectId: string; userId: string; userName: string }) => void;
  'whiteboard-update': (data: { sessionId: string; projectId: string; userId: string; canvasData: any }) => void;

  // Member status events
  'member-status-update': (data: { teamMemberId: string; online: boolean; projectId?: string }) => void;

  // Messaging events
  'project-message': (data: { projectId: string; userId: string; content: string; type?: string; metadata?: any }) => void;

  // Generic events
  'join-room': (room: string) => void;
  'leave-room': (room: string) => void;
  ping: () => void;
}

/**
 * Interface for room naming conventions
 */
export interface RoomNames {
  user: (userId: string) => string;
  project: (projectId: string) => string;
  whiteboard: (sessionId: string) => string;
  organization: (orgId: string) => string;
  company: (companyId: string) => string;
}

/**
 * Room name helper
 */
export const RoomHelper: RoomNames = {
  user: (userId: string) => `user-${userId}`,
  project: (projectId: string) => `project-${projectId}`,
  whiteboard: (sessionId: string) => `whiteboard-${sessionId}`,
  organization: (orgId: string) => `org-${orgId}`,
  company: (companyId: string) => `company-${companyId}`,
};

/**
 * Interface for Redis configuration
 */
export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
}

/**
 * Interface for user socket tracking
 */
export interface UserSocketInfo {
  userId: string;
  socketIds: Set<string>;
  projects: Set<string>;
  lastSeen: Date;
}
