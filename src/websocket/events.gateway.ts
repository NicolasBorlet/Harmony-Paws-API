import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';

export const WS_EVENTS = {
  MESSAGE_NEW: 'message:new',
  CONVERSATION_UPDATED: 'conversation:updated',
  FRIEND_REQUEST_CHANGED: 'friend-request:changed',
  INVITATION_CHANGED: 'invitation:changed',
  ACTIVITY_STATUS: 'activity:status',
  PARTICIPANT_JOINED: 'participant:joined',
  ACTIVITY_BANNER: 'activity:banner',
} as const;

@Injectable()
@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',').map((o) => o.trim()).filter(Boolean) ?? false,
    credentials: true,
  },
  namespace: '/events',
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly userSockets = new Map<string, Set<string>>();

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      // Only accept the token via the auth payload — never the query string,
      // which leaks into proxy/server logs and browser history.
      const token = client.handshake.auth?.token as string | undefined;
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwt.verify<{ sub: string }>(token, {
        secret: this.config.getOrThrow('JWT_SECRET'),
        algorithms: ['HS256'],
      });

      client.data.userId = payload.sub;
      const sockets = this.userSockets.get(payload.sub) ?? new Set();
      sockets.add(client.id);
      this.userSockets.set(payload.sub, sockets);
      client.join(`user:${payload.sub}`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId as string | undefined;
    if (!userId) return;
    const sockets = this.userSockets.get(userId);
    if (!sockets) return;
    sockets.delete(client.id);
    if (sockets.size === 0) {
      this.userSockets.delete(userId);
    }
  }

  emitToUser(userId: string, event: string, payload: unknown) {
    this.server.to(`user:${userId}`).emit(event, payload);
  }

  emitToUsers(userIds: string[], event: string, payload: unknown) {
    for (const userId of userIds) {
      this.emitToUser(userId, event, payload);
    }
  }

  emitToConversation(conversationId: string, event: string, payload: unknown) {
    this.server.to(`conversation:${conversationId}`).emit(event, payload);
  }

  emitToActivity(activityId: string, event: string, payload: unknown) {
    this.server.to(`activity:${activityId}`).emit(event, payload);
  }

  joinConversation(clientId: string, conversationId: string) {
    const client = this.server.sockets.sockets.get(clientId);
    client?.join(`conversation:${conversationId}`);
  }

  joinActivity(clientId: string, activityId: string) {
    const client = this.server.sockets.sockets.get(clientId);
    client?.join(`activity:${activityId}`);
  }
}
