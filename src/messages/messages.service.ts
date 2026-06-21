import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { serialize } from '../common/utils/serialize';
import { EventsGateway, WS_EVENTS } from '../websocket/events.gateway';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class MessagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventsGateway,
    private readonly notifications: NotificationsService,
  ) {}

  async listConversations(userId: string) {
    const participants = await this.prisma.conversationParticipant.findMany({
      where: { userId },
      include: {
        conversation: {
          include: {
            messages: { orderBy: { createdAt: 'desc' }, take: 1 },
            participants: {
              include: {
                user: {
                  select: { id: true, firstName: true, lastName: true, email: true },
                },
              },
            },
          },
        },
      },
      orderBy: { conversation: { updatedAt: 'desc' } },
    });
    return serialize(participants.map((p) => p.conversation));
  }

  async getMessages(conversationId: bigint, userId: string) {
    await this.assertParticipant(conversationId, userId);
    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
    return serialize(messages);
  }

  async getLastMessagesForConversations(userId: string) {
    const participants = await this.prisma.conversationParticipant.findMany({
      where: { userId },
      select: { conversationId: true },
    });
    const conversationIds = participants.map((p) => p.conversationId);
    const messages = await this.prisma.message.findMany({
      where: { conversationId: { in: conversationIds } },
      orderBy: { createdAt: 'desc' },
      distinct: ['conversationId'],
      include: { sender: { select: { id: true, firstName: true, lastName: true } } },
    });
    return serialize(messages);
  }

  async startDirectConversation(userId: string, otherUserId: string) {
    const friendship = await this.prisma.friendship.findFirst({
      where: {
        OR: [
          { userId, friendId: otherUserId },
          { userId: otherUserId, friendId: userId },
        ],
      },
    });
    if (!friendship) {
      throw new ForbiddenException('Users must be friends');
    }

    const userConversations = await this.prisma.conversationParticipant.findMany({
      where: { userId },
      include: {
        conversation: { include: { participants: true } },
      },
    });

    const expected = [userId, otherUserId].sort();
    const existing = userConversations
      .map((p) => p.conversation)
      .find((conversation) => {
        const ids = conversation.participants.map((p) => p.userId).sort();
        return (
          ids.length === 2 && ids[0] === expected[0] && ids[1] === expected[1]
        );
      });

    if (existing) {
      return serialize(existing);
    }

    const conversation = await this.prisma.conversation.create({
      data: {
        participants: {
          create: [{ userId }, { userId: otherUserId }],
        },
      },
      include: { participants: true },
    });
    return serialize(conversation);
  }

  async createGroupConversation(
    userId: string,
    title: string,
    participantIds: string[],
  ) {
    const otherIds = [...new Set(participantIds)].filter((id) => id !== userId);

    // A user may only group people they are actually friends with — this
    // prevents adding arbitrary users to a conversation (spam / harassment).
    if (otherIds.length > 0) {
      const friendships = await this.prisma.friendship.findMany({
        where: { userId, friendId: { in: otherIds } },
        select: { friendId: true },
      });
      const friendIds = new Set(friendships.map((f) => f.friendId));
      const notFriends = otherIds.filter((id) => !friendIds.has(id));
      if (notFriends.length > 0) {
        throw new ForbiddenException(
          'All participants must be friends with you',
        );
      }
    }

    const allIds = [...new Set([userId, ...otherIds])];
    const conversation = await this.prisma.conversation.create({
      data: {
        title,
        participants: {
          create: allIds.map((id) => ({ userId: id })),
        },
      },
      include: { participants: true },
    });

    for (const id of allIds) {
      this.events.emitToUser(id, WS_EVENTS.CONVERSATION_UPDATED, conversation);
    }
    return serialize(conversation);
  }

  async sendMessage(
    conversationId: bigint,
    senderId: string,
    content: string,
  ) {
    await this.assertParticipant(conversationId, senderId);

    const message = await this.prisma.message.create({
      data: { conversationId, senderId, content },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    const participants = await this.prisma.conversationParticipant.findMany({
      where: { conversationId },
    });

    const participantUserIds = participants.map((p) => p.userId);

    this.events.emitToUsers(participantUserIds, WS_EVENTS.MESSAGE_NEW, message);
    this.events.emitToConversation(
      conversationId.toString(),
      WS_EVENTS.MESSAGE_NEW,
      message,
    );

    for (const p of participants) {
      if (p.userId !== senderId) {
        this.events.emitToUser(p.userId, WS_EVENTS.CONVERSATION_UPDATED, {
          conversationId,
          lastMessage: message,
        });
        await this.notifications.sendMessageNotification(
          p.userId,
          senderId,
          content,
        );
      }
    }

    return serialize(message);
  }

  private async assertParticipant(conversationId: bigint, userId: string) {
    const participant = await this.prisma.conversationParticipant.findFirst({
      where: { conversationId, userId },
    });
    if (!participant) {
      throw new ForbiddenException('Not a conversation participant');
    }
  }
}
