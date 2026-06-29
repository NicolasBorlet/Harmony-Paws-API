import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  ActivityInvitationStatus,
  ActivityStatus,
  ActivityStyle,
  ActivityType,
  ActivityVisibility,
  Prisma,
  RewardSource,
} from '@prisma/client';
import { decimalToNumber, serialize } from '../common/utils/serialize';
import { PremiumService } from '../billing/premium.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadgeEngineService } from '../stats-badges/badge-engine.service';
import { DogStatsService } from '../stats-badges/dog-stats.service';
import {
  computeActivityOs,
  osToExperience,
} from '../stats-badges/reward.constants';
import { RewardService } from '../stats-badges/reward.service';
import { EventsGateway, WS_EVENTS } from '../websocket/events.gateway';

function geohashCommonPrefixLength(
  geohash: string | null | undefined,
  reference: string,
): number {
  if (!geohash) return 0;
  let i = 0;
  const max = Math.min(geohash.length, reference.length);
  while (i < max && geohash[i] === reference[i]) i++;
  return i;
}

const ACTIVITY_DOG_INCLUDE = {
  include: {
    dog: {
      include: {
        breed: true,
        dogBehaviors: { include: { behavior: true } },
      },
    },
    user: { select: { id: true, firstName: true, lastName: true } },
  },
};

const ACTIVITY_DETAIL_INCLUDE = {
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
  activityDogs: ACTIVITY_DOG_INCLUDE,
  steps: { orderBy: { sortOrder: 'asc' as const } },
  stats: true,
};

@Injectable()
export class ActivitiesService {
  private readonly logger = new Logger(ActivitiesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventsGateway,
    private readonly badgeEngine: BadgeEngineService,
    private readonly rewardService: RewardService,
    private readonly premiumService: PremiumService,
    private readonly dogStatsService: DogStatsService,
  ) {}

  async listForUser(userId: string) {
    const activities = await this.prisma.activity.findMany({
      where: {
        OR: [{ creatorId: userId }, { userActivities: { some: { userId } } }],
      },
      include: {
        userActivities: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true } },
          },
        },
        activityDogs: ACTIVITY_DOG_INCLUDE,
        steps: { orderBy: { sortOrder: 'asc' } },
      },
      orderBy: { date: 'desc' },
    });
    return serialize(activities.map((activity) => this.mapActivityDogs(activity)));
  }

  async getById(activityId: string, userId: string) {
    const activity = await this.prisma.activity.findUnique({
      where: { id: activityId },
      include: ACTIVITY_DETAIL_INCLUDE,
    });
    if (!activity) throw new NotFoundException('Activity not found');
    const isParticipant =
      activity.creatorId === userId ||
      activity.userActivities.some((ua) => ua.userId === userId);
    if (!isParticipant && activity.visibility === 'private') {
      throw new ForbiddenException('Not a participant');
    }
    return serialize(this.mapActivityDogs(activity));
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
      sourceRideId?: string;
      steps?: {
        place: string;
        latitude?: number;
        longitude?: number;
        estimatedHour: string;
        sortOrder: number;
      }[];
      dogIds: string[];
    },
  ) {
    const { steps, sourceRideId, dogIds, ...activityData } = data;

    if (sourceRideId) {
      const ride = await this.prisma.ride.findUnique({
        where: { id: sourceRideId },
        select: { id: true },
      });
      if (!ride) {
        throw new NotFoundException('Source ride not found');
      }
    }

    await this.assertDogsBelongToUser(dogIds, creatorId);

    const activity = await this.prisma.$transaction(async (tx) => {
      const created = await tx.activity.create({
        data: {
          ...activityData,
          style: activityData.style ?? 'casual',
          date: new Date(activityData.date),
          creatorId,
          sourceRideId,
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
        include: {
          steps: { orderBy: { sortOrder: 'asc' } },
          activityDogs: ACTIVITY_DOG_INCLUDE,
        },
      });

      await this.linkDogsToActivity(tx, created.id, creatorId, dogIds);

      return tx.activity.findUniqueOrThrow({
        where: { id: created.id },
        include: {
          steps: { orderBy: { sortOrder: 'asc' } },
          activityDogs: ACTIVITY_DOG_INCLUDE,
        },
      });
    });

    this.events.emitToUser(creatorId, WS_EVENTS.ACTIVITY_BANNER, activity);
    return serialize(this.mapActivityDogs(activity));
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
    extra?: {
      startedAt?: string;
      endedAt?: string;
      currentState?: Prisma.InputJsonValue;
    },
  ) {
    await this.assertParticipant(activityId, userId);
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
    const notifiedUserIds = new Set(
      activity.userActivities.map((ua) => ua.userId),
    );
    notifiedUserIds.add(activity.creatorId);
    for (const notifiedUserId of notifiedUserIds) {
      this.events.emitToUser(notifiedUserId, WS_EVENTS.ACTIVITY_BANNER, activity);
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

    const isPremium = await this.premiumService.isPremium(userId);
    const statsPayload = { ...data };

    if (!isPremium && statsPayload.routePoints != null) {
      this.logger.warn(
        `Stripped GPS route data for non-premium user ${userId} on activity ${activityId}`,
      );
      delete statsPayload.routePoints;
      delete statsPayload.distanceKm;
    }

    const stats = await this.prisma.activityStats.upsert({
      where: { activityId_userId: { activityId, userId } },
      create: { activityId, userId, ...statsPayload },
      update: statsPayload,
    });

    if (data.isCompleted) {
      if (!stats.syncedToUserStats) {
        await this.syncUserStats(userId, stats);
        await this.prisma.activityStats.update({
          where: { activityId_userId: { activityId, userId } },
          data: { syncedToUserStats: true },
        });
      }

      if (!stats.syncedToDogStats) {
        await this.dogStatsService.syncFromActivityStats(
          activityId,
          userId,
          stats.id,
          {
            distanceKm: stats.distanceKm,
            durationMinutes: stats.durationMinutes,
            actualEndTime: stats.actualEndTime,
          },
        );
        await this.prisma.activityStats.update({
          where: { activityId_userId: { activityId, userId } },
          data: { syncedToDogStats: true },
        });
      }

      try {
        const distanceKm = decimalToNumber(stats.distanceKm) ?? 0;
        const durationMinutes = stats.durationMinutes ?? 0;
        const os = computeActivityOs(distanceKm, durationMinutes);

        await this.prisma.$transaction(async (tx) => {
          await this.rewardService.awardReward(tx, {
            userId,
            source: RewardSource.activity,
            sourceId: stats.id,
            points: os,
            experience: osToExperience(os),
            metadata: {
              activityId,
              distanceKm,
              durationMinutes,
            },
          });
        });
      } catch (error) {
        this.logger.warn(`Activity reward failed for ${userId}: ${error}`);
      }

      // Badge evaluation is best-effort: a failure here must never prevent the
      // activity stats from being saved.
      try {
        await this.badgeEngine.evaluateAndAward(userId);
      } catch (error) {
        this.logger.warn(`Badge evaluation failed for ${userId}: ${error}`);
      }
    }

    return serialize({
      ...stats,
      distanceKm: decimalToNumber(stats.distanceKm),
    });
  }

  async getStats(activityId: string, userId: string) {
    await this.assertParticipant(activityId, userId);

    const stats = await this.prisma.activityStats.findUnique({
      where: { activityId_userId: { activityId, userId } },
    });
    if (!stats) {
      throw new NotFoundException('Activity stats not found');
    }

    return serialize({
      ...stats,
      distanceKm: decimalToNumber(stats.distanceKm),
      averageSpeedKmh: decimalToNumber(stats.averageSpeedKmh),
      maxSpeedKmh: decimalToNumber(stats.maxSpeedKmh),
      temperatureCelsius: decimalToNumber(stats.temperatureCelsius),
    });
  }

  async listInvitations(userId: string) {
    const invitations = await this.prisma.activityInvitation.findMany({
      where: { receiverId: userId },
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
    this.events.emitToUser(
      receiverId,
      WS_EVENTS.INVITATION_CHANGED,
      invitation,
    );
    return serialize(invitation);
  }

  async acceptInvitation(
    invitationId: bigint,
    userId: string,
    dogIds: string[],
  ) {
    const invitation = await this.prisma.activityInvitation.findUnique({
      where: { id: invitationId },
      include: { activity: { include: { userActivities: true } } },
    });
    if (!invitation) throw new NotFoundException('Invitation not found');
    if (invitation.receiverId !== userId) {
      throw new ForbiddenException('Not the receiver');
    }

    await this.assertDogsBelongToUser(dogIds, userId);
    await this.enforceParticipantLimit(invitation.activity);

    const joinedDogs = await this.prisma.$transaction(async (tx) => {
      await tx.activityInvitation.update({
        where: { id: invitationId },
        data: { status: ActivityInvitationStatus.accepted },
      });
      await tx.userActivity.upsert({
        where: {
          userId_activityId: {
            userId,
            activityId: invitation.activityId,
          },
        },
        create: { userId, activityId: invitation.activityId },
        update: {},
      });
      await this.linkDogsToActivity(
        tx,
        invitation.activityId,
        userId,
        dogIds,
      );
      return this.getActivityDogsForUser(tx, invitation.activityId, userId);
    });

    this.events.emitToUser(
      invitation.senderId,
      WS_EVENTS.INVITATION_CHANGED,
      { id: invitationId.toString(), status: ActivityInvitationStatus.accepted },
    );
    this.events.emitToUser(userId, WS_EVENTS.INVITATION_CHANGED, {
      id: invitationId.toString(),
      status: ActivityInvitationStatus.accepted,
    });
    this.events.emitToActivity(
      invitation.activityId,
      WS_EVENTS.PARTICIPANT_JOINED,
      {
        userId,
        activityId: invitation.activityId,
        dogs: joinedDogs,
      },
    );
    return serialize({
      id: invitationId.toString(),
      status: ActivityInvitationStatus.accepted,
    });
  }

  async joinActivity(activityId: string, userId: string, dogIds: string[]) {
    const activity = await this.prisma.activity.findUnique({
      where: { id: activityId },
      include: { userActivities: true },
    });
    if (!activity) throw new NotFoundException('Activity not found');

    if (activity.visibility !== ActivityVisibility.public) {
      throw new ForbiddenException('Only public activities can be joined directly');
    }

    if (
      activity.status !== ActivityStatus.not_started &&
      activity.status !== ActivityStatus.ready_to_start
    ) {
      throw new BadRequestException('Activity is no longer open for joining');
    }

    if (activity.date < new Date()) {
      throw new BadRequestException('Activity date has passed');
    }

    const isAlreadyParticipant =
      activity.creatorId === userId ||
      activity.userActivities.some((ua) => ua.userId === userId);
    if (isAlreadyParticipant) {
      throw new ConflictException('Already a participant');
    }

    await this.assertDogsBelongToUser(dogIds, userId);
    await this.enforceParticipantLimit(activity);

    const joinedDogs = await this.prisma.$transaction(async (tx) => {
      await tx.userActivity.create({
        data: { userId, activityId },
      });
      await this.linkDogsToActivity(tx, activityId, userId, dogIds);
      return this.getActivityDogsForUser(tx, activityId, userId);
    });

    this.events.emitToActivity(activityId, WS_EVENTS.PARTICIPANT_JOINED, {
      userId,
      activityId,
      dogs: joinedDogs,
    });

    const fullActivity = await this.prisma.activity.findUnique({
      where: { id: activityId },
      include: ACTIVITY_DETAIL_INCLUDE,
    });

    return serialize(this.mapActivityDogs(fullActivity!));
  }

  async updateActivityDogs(
    activityId: string,
    userId: string,
    dogIds: string[],
  ) {
    await this.assertParticipant(activityId, userId);

    const activity = await this.prisma.activity.findUnique({
      where: { id: activityId },
      select: { status: true },
    });
    if (!activity) throw new NotFoundException('Activity not found');

    if (
      activity.status === ActivityStatus.in_progress ||
      activity.status === ActivityStatus.finished
    ) {
      throw new BadRequestException(
        'Cannot update dogs after the activity has started',
      );
    }

    await this.assertDogsBelongToUser(dogIds, userId);

    await this.prisma.$transaction(async (tx) => {
      await tx.activityDog.deleteMany({
        where: { activityId, userId },
      });
      await this.linkDogsToActivity(tx, activityId, userId, dogIds);
    });

    const fullActivity = await this.prisma.activity.findUnique({
      where: { id: activityId },
      include: ACTIVITY_DETAIL_INCLUDE,
    });

    return serialize(this.mapActivityDogs(fullActivity!));
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
    const referenceGeohash = geohashPrefix.trim();
    const now = new Date();
    const activities = await this.prisma.activity.findMany({
      where: {
        visibility: 'public',
        status: {
          in: [ActivityStatus.not_started, ActivityStatus.ready_to_start],
        },
        date: { gte: now },
      },
      include: {
        activityDogs: ACTIVITY_DOG_INCLUDE,
        userActivities: true,
      },
    });

    const sorted =
      referenceGeohash.length >= 3
        ? [...activities].sort((a, b) => {
            const proximityDiff =
              geohashCommonPrefixLength(b.geohash, referenceGeohash) -
              geohashCommonPrefixLength(a.geohash, referenceGeohash);
            if (proximityDiff !== 0) return proximityDiff;
            return a.date.getTime() - b.date.getTime();
          })
        : [...activities].sort((a, b) => a.date.getTime() - b.date.getTime());

    return serialize(
      sorted.slice(0, 50).map((activity) => this.mapActivityDogs(activity)),
    );
  }

  private mapActivityDogs(activity: {
    activityDogs?: Array<{
      id: string;
      dogId: string;
      userId: string;
      dog: {
        id: string;
        name: string;
        image: string | null;
        dominance: string | null;
        dogBehaviors: Array<{
          behavior: { id: number; name: string };
        }>;
      };
      user: {
        id: string;
        firstName: string | null;
        lastName: string | null;
      };
    }>;
    [key: string]: unknown;
  }) {
    if (!activity.activityDogs) return activity;

    return {
      ...activity,
      activityDogs: activity.activityDogs.map((ad) => ({
        id: ad.dog.id,
        name: ad.dog.name,
        image: ad.dog.image,
        dominance: ad.dog.dominance,
        owner_id: ad.userId,
        behaviors: ad.dog.dogBehaviors.map((db) => db.behavior),
        owner: {
          id: ad.user.id,
          firstName: ad.user.firstName,
          lastName: ad.user.lastName,
        },
      })),
    };
  }

  private async assertDogsBelongToUser(dogIds: string[], userId: string) {
    const uniqueDogIds = [...new Set(dogIds)];
    if (uniqueDogIds.length !== dogIds.length) {
      throw new BadRequestException('Duplicate dog IDs are not allowed');
    }

    const dogs = await this.prisma.dog.findMany({
      where: { id: { in: uniqueDogIds } },
      select: { id: true, ownerId: true },
    });

    if (dogs.length !== uniqueDogIds.length) {
      throw new NotFoundException('One or more dogs not found');
    }

    const invalid = dogs.filter((dog) => dog.ownerId !== userId);
    if (invalid.length > 0) {
      throw new ForbiddenException('Dogs must belong to the current user');
    }

    return dogs;
  }

  private async linkDogsToActivity(
    tx: Prisma.TransactionClient,
    activityId: string,
    userId: string,
    dogIds: string[],
  ) {
    if (dogIds.length === 0) {
      throw new BadRequestException('At least one dog is required');
    }

    await tx.activityDog.createMany({
      data: dogIds.map((dogId) => ({
        activityId,
        dogId,
        userId,
      })),
    });
  }

  private async getActivityDogsForUser(
    tx: Prisma.TransactionClient,
    activityId: string,
    userId: string,
  ) {
    const activityDogs = await tx.activityDog.findMany({
      where: { activityId, userId },
      include: {
        dog: {
          include: {
            dogBehaviors: { include: { behavior: true } },
          },
        },
      },
    });

    return activityDogs.map((ad) => ({
      id: ad.dog.id,
      name: ad.dog.name,
      dominance: ad.dog.dominance,
      behaviors: ad.dog.dogBehaviors.map((db) => db.behavior),
    }));
  }

  private async enforceParticipantLimit(activity: {
    participantLimit: number | null;
    userActivities: Array<{ userId: string }>;
    creatorId: string;
  }) {
    if (!activity.participantLimit) return;

    const participantIds = new Set(
      activity.userActivities.map((ua) => ua.userId),
    );
    participantIds.add(activity.creatorId);

    if (participantIds.size >= activity.participantLimit) {
      throw new ConflictException('Participant limit reached');
    }
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
    stats: {
      distanceKm: Prisma.Decimal | null;
      durationMinutes: number | null;
    },
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
