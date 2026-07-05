import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import {
  AdminBroadcastEmailDto,
  ContactReportDto,
  DogReportDto,
  RideBugReportDto,
  UserReportDto,
} from './dto/email.dto';
import {
  buildSupportReportHtml,
  buildSupportReportText,
} from './email-templates';
import { ResendEmailPayload, ResendService } from './resend.service';

type ReporterContext = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
};

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    private readonly resend: ResendService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async sendRideBugReport(reporterId: string, dto: RideBugReportDto) {
    const reporter = await this.getReporter(reporterId);

    return this.sendSupportReport({
      reporter,
      typeLabel: 'Signalement de bug pendant une balade',
      subjectPrefix: 'Bug balade',
      idempotencyKey: `ride-bug/${reporterId}/${dto.rideId ?? dto.activityId ?? Date.now()}`,
      message: dto.message,
      metadata: {
        'ID activité': dto.activityId,
        'ID balade': dto.rideId,
        Appareil: dto.deviceInfo,
        'Version app': dto.appVersion,
      },
    });
  }

  async sendUserReport(reporterId: string, dto: UserReportDto) {
    const [reporter, reportedUser] = await Promise.all([
      this.getReporter(reporterId),
      this.prisma.user.findUnique({
        where: { id: dto.reportedUserId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
        },
      }),
    ]);

    if (!reportedUser) {
      throw new NotFoundException('Utilisateur signalé introuvable');
    }

    if (reportedUser.id === reporterId) {
      throw new BadRequestException('Vous ne pouvez pas vous signaler vous-même');
    }

    const reportedName = this.formatName(reportedUser);

    return this.sendSupportReport({
      reporter,
      typeLabel: 'Signalement d\'utilisateur',
      subjectPrefix: 'Signalement utilisateur',
      idempotencyKey: `user-report/${reporterId}/${dto.reportedUserId}`,
      message: dto.message,
      metadata: {
        'Utilisateur signalé': `${reportedName} (${reportedUser.email})`,
        'ID utilisateur signalé': reportedUser.id,
      },
    });
  }

  async sendDogReport(reporterId: string, dto: DogReportDto) {
    const [reporter, reportedDog] = await Promise.all([
      this.getReporter(reporterId),
      this.prisma.dog.findUnique({
        where: { id: dto.reportedDogId },
        select: {
          id: true,
          name: true,
          owner: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
    ]);

    if (!reportedDog) {
      throw new NotFoundException('Chien signalé introuvable');
    }

    const ownerName = this.formatName(reportedDog.owner);

    return this.sendSupportReport({
      reporter,
      typeLabel: 'Signalement de chien',
      subjectPrefix: 'Signalement chien',
      idempotencyKey: `dog-report/${reporterId}/${dto.reportedDogId}`,
      message: dto.message,
      metadata: {
        'Chien signalé': reportedDog.name,
        'ID chien': reportedDog.id,
        Propriétaire: `${ownerName} (${reportedDog.owner.email})`,
        'ID propriétaire': reportedDog.owner.id,
      },
    });
  }

  async sendContactReport(reporterId: string, dto: ContactReportDto) {
    const reporter = await this.getReporter(reporterId);

    return this.sendSupportReport({
      reporter,
      typeLabel: 'Contact divers',
      subjectPrefix: dto.subject?.trim() || 'Contact',
      idempotencyKey: `contact/${reporterId}/${this.hashForIdempotency(dto.message)}`,
      message: dto.message,
      metadata: dto.subject ? { Sujet: dto.subject } : undefined,
    });
  }

  async sendAdminBroadcast(dto: AdminBroadcastEmailDto) {
    const recipients = await this.resolveBroadcastRecipients(dto.userIds);

    if (recipients.length === 0) {
      throw new BadRequestException(
        'Aucun destinataire éligible (notifications email désactivées ou liste vide)',
      );
    }

    const from = this.getFromAddress();
    const emails: ResendEmailPayload[] = recipients.map((recipient) => ({
      from,
      to: [recipient.email],
      subject: dto.subject,
      html: dto.html,
      text: dto.text,
    }));

    const idempotencyKey = `batch-${dto.campaignType}/${dto.campaignId}`;
    const result = await this.resend.sendBatch(emails, idempotencyKey);

    this.logger.log(
      `Admin broadcast "${dto.campaignType}/${dto.campaignId}" sent to ${result.sentCount} recipients`,
    );

    return {
      sentCount: result.sentCount,
      emailIds: result.ids,
    };
  }

  private async sendSupportReport(params: {
    reporter: ReporterContext;
    typeLabel: string;
    subjectPrefix: string;
    message: string;
    idempotencyKey: string;
    metadata?: Record<string, string | null | undefined>;
  }) {
    const supportEmail = this.getSupportEmail();
    const reporterName = this.formatName(params.reporter);
    const templateContext = {
      typeLabel: params.typeLabel,
      reporterEmail: params.reporter.email,
      reporterName,
      reporterId: params.reporter.id,
      message: params.message,
      metadata: params.metadata,
    };

    const result = await this.resend.sendSingle(
      {
        from: this.getFromAddress(),
        to: [supportEmail],
        replyTo: params.reporter.email,
        subject: `[Harmony Paws] ${params.subjectPrefix} — ${reporterName}`,
        html: buildSupportReportHtml(templateContext),
        text: buildSupportReportText(templateContext),
      },
      params.idempotencyKey,
    );

    return { emailId: result.id };
  }

  private async getReporter(userId: string): Promise<ReporterContext> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    return user;
  }

  private async resolveBroadcastRecipients(userIds?: string[]) {
    const users = await this.prisma.user.findMany({
      where: {
        ...(userIds?.length ? { id: { in: userIds } } : {}),
        userPreferences: {
          is: {
            emailNotifications: true,
          },
        },
      },
      select: { id: true, email: true },
    });

    if (userIds?.length) {
      const foundIds = new Set(users.map((user) => user.id));
      const missing = userIds.filter((id) => !foundIds.has(id));
      if (missing.length > 0) {
        this.logger.warn(
          `Broadcast skipped ${missing.length} users (not found or email opt-out)`,
        );
      }
    }

    return users;
  }

  private getFromAddress(): string {
    const from = this.config.get<string>('RESEND_FROM_EMAIL')?.trim();
    if (!from) {
      throw new BadRequestException(
        'RESEND_FROM_EMAIL n\'est pas configuré sur le serveur',
      );
    }
    return from;
  }

  private getSupportEmail(): string {
    const support = this.config.get<string>('SUPPORT_EMAIL')?.trim();
    if (!support) {
      throw new BadRequestException(
        'SUPPORT_EMAIL n\'est pas configuré sur le serveur',
      );
    }
    return support;
  }

  private formatName(user: {
    firstName: string | null;
    lastName: string | null;
  }): string {
    const parts = [user.firstName, user.lastName].filter(Boolean);
    return parts.length > 0 ? parts.join(' ') : 'Utilisateur';
  }

  private hashForIdempotency(value: string): string {
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
      hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
    }
    return hash.toString(36);
  }
}
