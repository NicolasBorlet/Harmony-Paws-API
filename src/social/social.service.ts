import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FriendRequestStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { serialize } from '../common/utils/serialize';
import { EventsGateway, WS_EVENTS } from '../websocket/events.gateway';

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
        sender: { select: { id: true, firstName: true, lastName: true, email: true } },
        recipient: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return serialize(requests);
  }

  async sendFriendRequest(senderId: string, recipientId: string) {
    const request = await this.prisma.friendRequest.create({
      data: { senderId, recipientId },
      include: { sender: true, recipient: true },
    });
    this.events.emitToUser(recipientId, WS_EVENTS.FRIEND_REQUEST_CHANGED, request);
    return serialize(request);
  }

  async acceptFriendRequest(requestId: bigint, userId: string) {
    const request = await this.prisma.friendRequest.findUnique({
      where: { id: requestId },
    });
    if (!request) throw new NotFoundException('Friend request not found');
    if (request.recipientId !== userId) {
      throw new ForbiddenException('Not the recipient');
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
          select: { id: true, firstName: true, lastName: true, email: true, place: true },
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
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return serialize(meetings);
  }
}
