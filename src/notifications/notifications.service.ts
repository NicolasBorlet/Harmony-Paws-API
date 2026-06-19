import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async sendMessageNotification(
    recipientId: string,
    senderId: string,
    content: string,
  ) {
    const [recipient, sender] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: recipientId } }),
      this.prisma.user.findUnique({ where: { id: senderId } }),
    ]);

    if (!recipient?.expoPushToken) return;

    const token = this.config.get('EXPO_ACCESS_TOKEN');
    const title = sender?.firstName
      ? `${sender.firstName} sent you a message`
      : 'New message';

    try {
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          to: recipient.expoPushToken,
          title,
          body: content.slice(0, 100),
          data: { type: 'message', senderId },
        }),
      });
    } catch (error) {
      this.logger.warn(`Failed to send push notification: ${error}`);
    }
  }
}
