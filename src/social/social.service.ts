import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FriendRequestStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { serialize } from '../common/utils/serialize';
import { EventsGateway, WS_EVENTS } from '../websocket/events.gateway';

// Public-facing user fields — email and other PII are never exposed to peers.
const PUBLIC_USER_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
} as const;

@Injectable()
export class SocialService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventsGateway,
  ) {}

  async listFriendRequests(userId: string) {
    const requests = await this.prisma.friendRequest.findMany({
      where: {
        OR: [{ recipientId: userId }, { senderId: userId }],
        status: FriendRequestStatus.pending,
      },
      include: {
        sender: { select: PUBLIC_USER_SELECT },
        recipient: { select: PUBLIC_USER_SELECT },
      },
      orderBy: { createdAt: 'desc' },
    });
    return serialize(requests);
  }

  async sendFriendRequest(senderId: string, recipientId: string) {
    if (senderId === recipientId) {
      throw new BadRequestException('Cannot send a friend request to yourself');
    }

    const recipient = await this.prisma.user.findUnique({
      where: { id: recipientId },
      select: { id: true },
    });
    if (!recipient) {
      throw new NotFoundException('Recipient not found');
    }

    // Already friends?
    const existingFriendship = await this.prisma.friendship.findFirst({
      where: {
        OR: [
          { userId: senderId, friendId: recipientId },
          { userId: recipientId, friendId: senderId },
        ],
      },
    });
    if (existingFriendship) {
      throw new ConflictException('Users are already friends');
    }

    // A pending request already exists in either direction — stay idempotent.
    const existingRequest = await this.prisma.friendRequest.findFirst({
      where: {
        status: FriendRequestStatus.pending,
        OR: [
          { senderId, recipientId },
          { senderId: recipientId, recipientId: senderId },
        ],
      },
      include: {
        sender: { select: PUBLIC_USER_SELECT },
        recipient: { select: PUBLIC_USER_SELECT },
      },
    });
    if (existingRequest) {
      return serialize(existingRequest);
    }

    const request = await this.prisma.friendRequest.create({
      data: { senderId, recipientId },
      include: {
        sender: { select: PUBLIC_USER_SELECT },
        recipient: { select: PUBLIC_USER_SELECT },
      },
    });
    this.events.emitToUser(recipientId, WS_EVENTS.FRIEND_REQUEST_CHANGED, request);
    return serialize(request);
  }

  async rejectFriendRequest(requestId: bigint, userId: string) {
    const request = await this.prisma.friendRequest.findUnique({
      where: { id: requestId },
    });
    if (!request) throw new NotFoundException('Friend request not found');
    if (request.recipientId !== userId) {
      throw new ForbiddenException('Not the recipient');
    }
    await this.prisma.friendRequest.update({
      where: { id: requestId },
      data: { status: FriendRequestStatus.refused },
    });
    this.events.emitToUser(request.senderId, WS_EVENTS.FRIEND_REQUEST_CHANGED, {
      id: requestId,
      status: 'refused',
    });
    return { success: true };
  }

  async cancelFriendRequest(requestId: bigint, userId: string) {
    const request = await this.prisma.friendRequest.findUnique({
      where: { id: requestId },
    });
    if (!request) throw new NotFoundException('Friend request not found');
    if (request.senderId !== userId) {
      throw new ForbiddenException('Not the sender');
    }
    await this.prisma.friendRequest.delete({ where: { id: requestId } });
    this.events.emitToUser(
      request.recipientId,
      WS_EVENTS.FRIEND_REQUEST_CHANGED,
      { id: requestId, status: 'cancelled' },
    );
    return { success: true };
  }

  async acceptFriendRequest(requestId: bigint, userId: string) {
    const request = await this.prisma.friendRequest.findUnique({
      where: { id: requestId },
    });
    if (!request) throw new NotFoundException('Friend request not found');
    if (request.recipientId !== userId) {
      throw new ForbiddenException('Not the recipient');
    }
    if (request.status !== FriendRequestStatus.pending) {
      throw new ConflictException('Friend request is no longer pending');
    }

    await this.prisma.$transaction([
      this.prisma.friendRequest.update({
        where: { id: requestId },
        data: { status: FriendRequestStatus.accepted },
      }),
      this.prisma.friendship.create({
        data: { userId: request.senderId, friendId: request.recipientId },
      }),
      this.prisma.friendship.create({
        data: { userId: request.recipientId, friendId: request.senderId },
      }),
    ]);

    this.events.emitToUser(request.senderId, WS_EVENTS.FRIEND_REQUEST_CHANGED, {
      id: requestId,
      status: 'accepted',
    });
    this.events.emitToUser(userId, WS_EVENTS.FRIEND_REQUEST_CHANGED, {
      id: requestId,
      status: 'accepted',
    });

    return { success: true };
  }

  async removeFriend(userId: string, friendId: string) {
    await this.prisma.friendship.deleteMany({
      where: {
        OR: [
          { userId, friendId },
          { userId: friendId, friendId: userId },
        ],
      },
    });
    return { success: true };
  }

  async listFriends(userId: string) {
    const friendships = await this.prisma.friendship.findMany({
      where: { userId },
      include: {
        friend: {
          select: { id: true, firstName: true, lastName: true, place: true },
        },
      },
    });
    return serialize(friendships.map((f) => f.friend));
  }

  async listMeetings(userId: string) {
    const meetings = await this.prisma.userMeeting.findMany({
      where: { userId },
      include: {
        metUser: {
          select: PUBLIC_USER_SELECT,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return serialize(meetings);
  }
}
