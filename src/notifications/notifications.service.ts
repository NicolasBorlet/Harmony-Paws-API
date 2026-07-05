import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserPreferences } from '@prisma/client';
import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import { PrismaService } from '../prisma/prisma.service';

type PushData = Record<string, string>;

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly expo: Expo;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    const accessToken = this.config.get<string>('EXPO_ACCESS_TOKEN');
    this.expo = new Expo(accessToken ? { accessToken } : undefined);
  }

  async sendMessageNotification(
    recipientId: string,
    senderId: string,
    content: string,
  ) {
    const [recipient, sender] = await Promise.all([
      this.getRecipient(recipientId),
      this.prisma.user.findUnique({
        where: { id: senderId },
        select: { firstName: true },
      }),
    ]);

    if (!this.canSendPush(recipient, (prefs) => prefs.messageNotifications)) {
      return;
    }

    const title = sender?.firstName
      ? `${sender.firstName} sent you a message`
      : 'New message';

    await this.deliverPush(recipient!.expoPushToken!, {
      title,
      body: content.slice(0, 100),
      data: { type: 'message', senderId },
      sound: 'default',
    });
  }

  async sendRideInvitationNotification(
    recipientId: string,
    senderId: string,
    activityId: string,
    invitationId: string,
  ) {
    const [recipient, sender] = await Promise.all([
      this.getRecipient(recipientId),
      this.prisma.user.findUnique({
        where: { id: senderId },
        select: { firstName: true },
      }),
    ]);

    if (!this.canSendPush(recipient, (prefs) => prefs.rideNotifications)) {
      return;
    }

    const senderName = sender?.firstName ?? 'Someone';
    await this.deliverPush(recipient!.expoPushToken!, {
      title: 'New walk invitation',
      body: `${senderName} invited you to join a walk`,
      data: {
        type: 'ride_invitation',
        senderId,
        activityId,
        invitationId,
      },
      sound: 'default',
    });
  }

  async sendInvitationAcceptedNotification(
    recipientId: string,
    joinerId: string,
    activityId: string,
    invitationId: string,
  ) {
    const [recipient, joiner] = await Promise.all([
      this.getRecipient(recipientId),
      this.prisma.user.findUnique({
        where: { id: joinerId },
        select: { firstName: true },
      }),
    ]);

    if (!this.canSendPush(recipient, (prefs) => prefs.rideNotifications)) {
      return;
    }

    const joinerName = joiner?.firstName ?? 'Someone';
    await this.deliverPush(recipient!.expoPushToken!, {
      title: 'Invitation accepted',
      body: `${joinerName} accepted your walk invitation`,
      data: {
        type: 'invitation_accepted',
        joinerId,
        activityId,
        invitationId,
      },
      sound: 'default',
    });
  }

  async sendParticipantJoinedNotification(
    recipientId: string,
    joinerId: string,
    activityId: string,
  ) {
    const [recipient, joiner] = await Promise.all([
      this.getRecipient(recipientId),
      this.prisma.user.findUnique({
        where: { id: joinerId },
        select: { firstName: true },
      }),
    ]);

    if (!this.canSendPush(recipient, (prefs) => prefs.rideNotifications)) {
      return;
    }

    const joinerName = joiner?.firstName ?? 'Someone';
    await this.deliverPush(recipient!.expoPushToken!, {
      title: 'New participant',
      body: `${joinerName} joined your walk`,
      data: {
        type: 'participant_joined',
        joinerId,
        activityId,
      },
      sound: 'default',
    });
  }

  private async getRecipient(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        expoPushToken: true,
        userPreferences: true,
      },
    });
  }

  private canSendPush(
    recipient: Awaited<ReturnType<typeof this.getRecipient>>,
    prefCheck: (prefs: UserPreferences) => boolean,
  ): recipient is NonNullable<typeof recipient> & {
    expoPushToken: string;
  } {
    if (!recipient?.expoPushToken) return false;
    if (!Expo.isExpoPushToken(recipient.expoPushToken)) {
      this.logger.warn(`Invalid Expo push token for user ${recipient.id}`);
      return false;
    }

    const prefs = recipient.userPreferences;
    if (prefs && (!prefs.pushNotifications || !prefCheck(prefs))) {
      return false;
    }

    return true;
  }

  private async deliverPush(
    pushToken: string,
    message: Omit<ExpoPushMessage, 'to'>,
  ) {
    const payload: ExpoPushMessage = {
      ...message,
      to: pushToken,
      data: message.data as PushData,
    };

    const chunks = this.expo.chunkPushNotifications([payload]);

    for (const chunk of chunks) {
      try {
        const tickets = await this.expo.sendPushNotificationsAsync(chunk);

        for (const ticket of tickets) {
          if (ticket.status === 'error') {
            this.logger.warn(
              `Push ticket error: ${ticket.message} (${ticket.details?.error ?? 'unknown'})`,
            );

            if (ticket.details?.error === 'DeviceNotRegistered') {
              await this.clearInvalidPushToken(pushToken);
            }
          }
        }
      } catch (error) {
        this.logger.warn(`Failed to send push notification: ${error}`);
      }
    }
  }

  private async clearInvalidPushToken(pushToken: string) {
    await this.prisma.user.updateMany({
      where: { expoPushToken: pushToken },
      data: { expoPushToken: null },
    });
  }
}
