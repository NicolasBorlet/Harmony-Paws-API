import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserPreferences } from '@prisma/client';
import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import { PrismaService } from '../prisma/prisma.service';

import {
  invitationAcceptedCopy,
  messageNotificationCopy,
  participantJoinedCopy,
  resolveNotificationLocale,
  rideInvitationCopy,
} from './notifications.i18n';
import { AdminBroadcastNotificationDto } from './dto/notifications.dto';

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

    const locale = resolveNotificationLocale(
      recipient!.userPreferences?.locale,
    );
    const { title, body } = messageNotificationCopy(
      locale,
      sender?.firstName,
      content,
    );

    await this.deliverPush(recipient!.expoPushToken!, {
      title,
      body,
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

    const locale = resolveNotificationLocale(
      recipient!.userPreferences?.locale,
    );
    const { title, body } = rideInvitationCopy(locale, sender?.firstName);

    await this.deliverPush(recipient!.expoPushToken!, {
      title,
      body,
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

    const locale = resolveNotificationLocale(
      recipient!.userPreferences?.locale,
    );
    const { title, body } = invitationAcceptedCopy(locale, joiner?.firstName);

    await this.deliverPush(recipient!.expoPushToken!, {
      title,
      body,
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

    const locale = resolveNotificationLocale(
      recipient!.userPreferences?.locale,
    );
    const { title, body } = participantJoinedCopy(locale, joiner?.firstName);

    await this.deliverPush(recipient!.expoPushToken!, {
      title,
      body,
      data: {
        type: 'participant_joined',
        joinerId,
        activityId,
      },
      sound: 'default',
    });
  }

  async sendAdminBroadcast(dto: AdminBroadcastNotificationDto) {
    const recipients = await this.resolveBroadcastRecipients(dto.userIds);

    if (recipients.length === 0) {
      throw new BadRequestException(
        'Aucun destinataire éligible (notifications push désactivées ou liste vide)',
      );
    }

    const messages: ExpoPushMessage[] = recipients.map((recipient) => ({
      to: recipient.expoPushToken!,
      title: dto.title,
      body: dto.body,
      sound: 'default',
      data: {
        type: 'admin_broadcast',
        campaignType: dto.campaignType,
        campaignId: dto.campaignId,
        ...dto.data,
      },
    }));

    const ticketCount = await this.deliverPushBatch(messages);

    this.logger.log(
      `Admin push broadcast "${dto.campaignType}/${dto.campaignId}" sent to ${recipients.length} recipients (${ticketCount} tickets)`,
    );

    return {
      sentCount: recipients.length,
      ticketCount,
    };
  }

  private async resolveBroadcastRecipients(userIds?: string[]) {
    const users = await this.prisma.user.findMany({
      where: {
        ...(userIds?.length ? { id: { in: userIds } } : {}),
        expoPushToken: { not: null },
        userPreferences: {
          is: {
            pushNotifications: true,
          },
        },
      },
      select: { id: true, expoPushToken: true },
    });

    const eligible = users.filter(
      (user) =>
        user.expoPushToken && Expo.isExpoPushToken(user.expoPushToken),
    );

    if (userIds?.length) {
      const foundIds = new Set(eligible.map((user) => user.id));
      const missing = userIds.filter((id) => !foundIds.has(id));
      if (missing.length > 0) {
        this.logger.warn(
          `Push broadcast skipped ${missing.length} users (not found, no token, or push opt-out)`,
        );
      }
    }

    return eligible;
  }

  private async deliverPushBatch(messages: ExpoPushMessage[]) {
    const chunks = this.expo.chunkPushNotifications(messages);
    let ticketCount = 0;

    for (const chunk of chunks) {
      try {
        const tickets = await this.expo.sendPushNotificationsAsync(chunk);
        ticketCount += tickets.length;

        for (let index = 0; index < tickets.length; index++) {
          const ticket = tickets[index];
          if (ticket.status === 'error') {
            this.logger.warn(
              `Push ticket error: ${ticket.message} (${ticket.details?.error ?? 'unknown'})`,
            );

            if (ticket.details?.error === 'DeviceNotRegistered') {
              const token = chunk[index]?.to;
              if (typeof token === 'string') {
                await this.clearInvalidPushToken(token);
              }
            }
          }
        }
      } catch (error) {
        this.logger.warn(`Failed to send push notification batch: ${error}`);
      }
    }

    return ticketCount;
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
