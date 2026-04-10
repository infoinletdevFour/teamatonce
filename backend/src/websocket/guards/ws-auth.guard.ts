import { Injectable, CanActivate, ExecutionContext, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Socket } from 'socket.io';

/**
 * WebSocket JWT Authentication Guard
 * Validates JWT tokens for WebSocket connections
 */
@Injectable()
export class WsAuthGuard implements CanActivate {
  private readonly logger = new Logger(WsAuthGuard.name);

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  /**
   * Validate the WebSocket connection
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const client: Socket = context.switchToWs().getClient();
      const token = this.extractToken(client);

      if (!token) {
        this.logger.warn('No token provided in WebSocket connection');
        // Allow connection without authentication for now
        // Set this to false if you want to enforce authentication
        return true;
      }

      // Verify the JWT token
      const payload = await this.verifyToken(token);

      if (!payload) {
        this.logger.warn('Invalid token in WebSocket connection');
        return false;
      }

      // Attach user information to the socket
      client['user'] = payload;

      this.logger.log(`WebSocket authenticated for user: ${payload.sub || payload.userId}`);
      return true;
    } catch (error) {
      this.logger.error('WebSocket authentication error:', error);
      return false;
    }
  }

  /**
   * Extract JWT token from socket handshake
   */
  private extractToken(client: Socket): string | null {
    // Try to get token from query parameters
    const queryToken = client.handshake.query?.token as string;
    if (queryToken) {
      return queryToken;
    }

    // Try to get token from auth object
    const authToken = client.handshake.auth?.token as string;
    if (authToken) {
      return authToken;
    }

    // Try to get token from headers
    const authHeader = client.handshake.headers?.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    return null;
  }

  /**
   * Verify the JWT token
   */
  private async verifyToken(token: string): Promise<any> {
    try {
      const secret = this.configService.get<string>('JWT_SECRET');
      const payload = await this.jwtService.verifyAsync(token, { secret });
      return payload;
    } catch (error) {
      this.logger.error('Token verification failed:', error.message);
      return null;
    }
  }
}
