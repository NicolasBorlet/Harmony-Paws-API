import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ActivityInvitationStatus,
  ActivityStatus,
  ActivityStyle,
  ActivityType,
  ActivityVisibility,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { serialize, decimalToNumber } from '../common/utils/serialize';
import { EventsGateway, WS_EVENTS } from '../websocket/events.gateway';

@Injectable()
export class ActivitiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventsGateway,
  ) {}

  async listForUser(userId: string) {
    const activities = await this.prisma.activity.findMany({
      where: {
        OR: [
          { creatorId: userId },
          { userActivities: { some: { userId } } },
        ],
      },
      include: {
        userActivities: { include: { user: { select: { id: true, firstName: true, lastName: true } } } },
        steps: { orderBy: { sortOrder: 'asc' } },
      },
      orderBy: { date: 'desc' },
    });
    return serialize(activities);
  }

  async getById(activityId: string, userId: string) {
    const activity = await this.prisma.activity.findUnique({
      where: { id: activityId },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            age: true,
            place: true,
          },
        },
        userActivities: { include: { user: true } },
        steps: { orderBy: { sortOrder: 'asc' } },
        stats: true,
      },
    });
    if (!activity) throw new NotFoundException('Activity not found');
    const isParticipant =
      activity.creatorId === userId ||
      activity.userActivities.some((ua) => ua.userId === userId);
    if (!isParticipant && activity.visibility === 'private') {
      throw new ForbiddenException('Not a participant');
    }
    return serialize(activity);
  }

  async create(
    creatorId: string,
    data: {
      place?: string;
      visibility: ActivityVisibility;
      type: ActivityType;
      style?: ActivityStyle;
      date: string;
      duration?: string;
      participantLimit?: number;
      latitude?: string;
      longitude?: string;
      department?: string;
      country?: string;
      geohash?: string;
      steps?: {
        place: string;
        latitude?: number;
        longitude?: number;
        estimatedHour: string;
        sortOrder: number;
      }[];
    },
  ) {
    const { steps, ...activityData } = data;

    const activity = await this.prisma.$transaction(async (tx) => {
      return tx.activity.create({
        data: {
          ...activityData,
          style: activityData.style ?? 'casual',
          date: new Date(activityData.date),
          creatorId,
          userActivities: { create: { userId: creatorId } },
          ...(steps?.length
            ? {
                steps: {
                  create: steps.map((step) => ({
                    place: step.place,
                    latitude: step.latitude,
                    longitude: step.longitude,
                    estimatedHour: new Date(step.estimatedHour),
                    sortOrder: step.sortOrder,
                  })),
                },
              }
            : {}),
        },
        include: { steps: { orderBy: { sortOrder: 'asc' } } },
      });
    });

    this.events.emitToUser(creatorId, WS_EVENTS.ACTIVITY_BANNER, activity);
    return serialize(activity);
  }

  async update(
    activityId: string,
    userId: string,
    data: {
      place?: string;
      visibility?: ActivityVisibility;
      type?: ActivityType;
      style?: ActivityStyle;
      date?: string;
      duration?: string;
      participantLimit?: number;
      latitude?: string;
      longitude?: string;
      department?: string;
      country?: string;
      geohash?: string;
      steps?: {
        place: string;
        latitude?: number;
        longitude?: number;
        estimatedHour: string;
        sortOrder: number;
      }[];
    },
  ) {
    await this.assertCreator(activityId, userId);
    const { steps, ...activityData } = data;

    const activity = await this.prisma.$transaction(async (tx) => {
      if (steps !== undefined) {
        await tx.step.deleteMany({ where: { activityId } });
      }

      return tx.activity.update({
        where: { id: activityId },
        data: {
          ...activityData,
          ...(activityData.date ? { date: new Date(activityData.date) } : {}),
          ...(steps?.length
            ? {
                steps: {
                  create: steps.map((step) => ({
                    place: step.place,
                    latitude: step.latitude,
                    longitude: step.longitude,
                    estimatedHour: new Date(step.estimatedHour),
                    sortOrder: step.sortOrder,
                  })),
                },
              }
            : {}),
        },
        include: {
          steps: { orderBy: { sortOrder: 'asc' } },
          userActivities: true,
        },
      });
    });

    for (const ua of activity.userActivities) {
      this.events.emitToUser(ua.userId, WS_EVENTS.ACTIVITY_BANNER, activity);
    }
    return serialize(activity);
  }

  async delete(activityId: string, userId: string) {
    await this.assertCreator(activityId, userId);
    await this.prisma.activity.delete({ where: { id: activityId } });
    return { success: true };
  }

  async updateStatus(
    activityId: string,
    userId: string,
    status: ActivityStatus,
    extra?: { startedAt?: string; endedAt?: string; currentState?: Prisma.InputJsonValue },
  ) {
    // Only the creator may change the lifecycle status of an activity.
    await this.assertCreator(activityId, userId);
    const activity = await this.prisma.activity.update({
      where: { id: activityId },
      data: {
        status,
        startedAt: extra?.startedAt ? new Date(extra.startedAt) : undefined,
        endedAt: extra?.endedAt ? new Date(extra.endedAt) : undefined,
        currentState: extra?.currentState,
      },
      include: { userActivities: true },
    });

    this.events.emitToActivity(activityId, WS_EVENTS.ACTIVITY_STATUS, activity);
    for (const ua of activity.userActivities) {
      this.events.emitToUser(ua.userId, WS_EVENTS.ACTIVITY_BANNER, activity);
    }
    return serialize(activity);
  }

  async saveStats(
    activityId: string,
    userId: string,
    data: {
      distanceKm?: number;
      durationMinutes?: number;
      actualStartTime?: string;
      actualEndTime?: string;
      routePoints?: Prisma.InputJsonValue;
      isCompleted?: boolean;
      stepsCount?: number;
      caloriesBurned?: number;
    },
  ) {
    await this.assertParticipant(activityId, userId);
    const stats = await this.prisma.activityStats.upsert({
      where: { activityId_userId: { activityId, userId } },
      create: { activityId, userId, ...data },
      update: data,
    });

    if (data.isCompleted) {
      await this.syncUserStats(userId, stats);
    }

    return serialize({
      ...stats,
      distanceKm: decimalToNumber(stats.distanceKm),
    });
  }

  async listInvitations(userId: string) {
    const invitations = await this.prisma.activityInvitation.findMany({
      where: { OR: [{ receiverId: userId }, { senderId: userId }] },
      include: { activity: true, sender: true, receiver: true },
      orderBy: { createdAt: 'desc' },
    });
    return serialize(invitations);
  }

  async createInvitation(
    senderId: string,
    receiverId: string,
    activityId: string,
  ) {
    if (senderId === receiverId) {
      throw new BadRequestException('Cannot invite yourself');
    }

    // The sender must be the creator or an existing participant of the activity.
    await this.assertParticipant(activityId, senderId);

    const receiver = await this.prisma.user.findUnique({
      where: { id: receiverId },
      select: { id: true },
    });
    if (!receiver) {
      throw new NotFoundException('Receiver not found');
    }

    // Already a participant?
    const alreadyJoined = await this.prisma.userActivity.findUnique({
      where: { userId_activityId: { userId: receiverId, activityId } },
    });
    if (alreadyJoined) {
      throw new ConflictException('User already joined this activity');
    }

    // A pending invitation already exists — stay idempotent.
    const existing = await this.prisma.activityInvitation.findFirst({
      where: {
        activityId,
        receiverId,
        status: ActivityInvitationStatus.pending,
      },
      include: { activity: true },
    });
    if (existing) {
      return serialize(existing);
    }

    const invitation = await this.prisma.activityInvitation.create({
      data: { senderId, receiverId, activityId },
      include: { activity: true },
    });
    this.events.emitToUser(receiverId, WS_EVENTS.INVITATION_CHANGED, invitation);
    return serialize(invitation);
  }

  async acceptInvitation(invitationId: bigint, userId: string) {
    const invitation = await this.prisma.activityInvitation.findUnique({
      where: { id: invitationId },
    });
    if (!invitation) throw new NotFoundException('Invitation not found');
    if (invitation.receiverId !== userId) {
      throw new ForbiddenException('Not the receiver');
    }

    const [updated] = await this.prisma.$transaction([
      this.prisma.activityInvitation.update({
        where: { id: invitationId },
        data: { status: ActivityInvitationStatus.accepted },
      }),
      this.prisma.userActivity.upsert({
        where: {
          userId_activityId: {
            userId,
            activityId: invitation.activityId,
          },
        },
        create: { userId, activityId: invitation.activityId },
        update: {},
      }),
    ]);

    this.events.emitToUser(invitation.senderId, WS_EVENTS.INVITATION_CHANGED, updated);
    this.events.emitToUser(userId, WS_EVENTS.INVITATION_CHANGED, updated);
    this.events.emitToActivity(
      invitation.activityId,
      WS_EVENTS.PARTICIPANT_JOINED,
      { userId, activityId: invitation.activityId },
    );
    return serialize(updated);
  }

  async saveLivePushToken(
    activityId: string,
    userId: string,
    pushToken: string,
  ) {
    await this.assertParticipant(activityId, userId);
    await this.prisma.activityLivePushToken.upsert({
      where: { userId_activityId: { userId, activityId } },
      create: { userId, activityId, pushToken },
      update: { pushToken },
    });
    return { success: true };
  }

  async clearLivePushToken(activityId: string, userId: string) {
    await this.prisma.activityLivePushToken.deleteMany({
      where: { userId, activityId },
    });
    return { success: true };
  }

  async discoverByGeohash(geohashPrefix: string) {
    // Require a minimum precision to avoid dumping every public activity
    // worldwide by paginating over short prefixes.
    const prefix = geohashPrefix.trim();
    if (prefix.length < 3) {
      return [];
    }
    const activities = await this.prisma.activity.findMany({
      where: {
        visibility: 'public',
        geohash: { startsWith: prefix },
        status: { in: ['not_started', 'ready_to_start'] },
      },
      take: 50,
    });
    return serialize(activities);
  }

  private async assertParticipant(activityId: string, userId: string) {
    const activity = await this.prisma.activity.findUnique({
      where: { id: activityId },
      include: { userActivities: true },
    });
    if (!activity) throw new NotFoundException('Activity not found');
    const isParticipant =
      activity.creatorId === userId ||
      activity.userActivities.some((ua) => ua.userId === userId);
    if (!isParticipant) throw new ForbiddenException('Not a participant');
  }

  private async assertCreator(activityId: string, userId: string) {
    const activity = await this.prisma.activity.findUnique({
      where: { id: activityId },
      select: { creatorId: true },
    });
    if (!activity) throw new NotFoundException('Activity not found');
    if (activity.creatorId !== userId) {
      throw new ForbiddenException('Only the creator can perform this action');
    }
  }

  private async syncUserStats(
    userId: string,
    stats: { distanceKm: Prisma.Decimal | null; durationMinutes: number | null },
  ) {
    const distance = decimalToNumber(stats.distanceKm) ?? 0;
    const duration = stats.durationMinutes ?? 0;
    await this.prisma.userStats.upsert({
      where: { userId },
      create: {
        userId,
        totalDistanceKm: distance,
        totalActivities: 1,
        totalDurationMinutes: duration,
        monthlyDistanceKm: distance,
        monthlyActivities: 1,
      },
      update: {
        totalDistanceKm: { increment: distance },
        totalActivities: { increment: 1 },
        totalDurationMinutes: { increment: duration },
        monthlyDistanceKm: { increment: distance },
        monthlyActivities: { increment: 1 },
      },
    });
  }
}
