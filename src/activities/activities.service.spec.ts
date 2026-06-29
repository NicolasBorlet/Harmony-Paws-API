import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  ActivityStatus,
  ActivityVisibility,
} from '@prisma/client';
import { ActivitiesService } from './activities.service';
import { PremiumService } from '../billing/premium.service';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../websocket/events.gateway';
import { BadgeEngineService } from '../stats-badges/badge-engine.service';
import { DogStatsService } from '../stats-badges/dog-stats.service';
import { RewardService } from '../stats-badges/reward.service';

describe('ActivitiesService — activity dogs', () => {
  let service: ActivitiesService;
  let prisma: Record<string, jest.Mock | Record<string, jest.Mock>>;
  let tx: Record<string, jest.Mock | Record<string, jest.Mock>>;
  let events: { emitToActivity: jest.Mock; emitToUser: jest.Mock };

  const creatorId = 'creator-uuid';
  const joinerId = 'joiner-uuid';
  const activityId = 'activity-uuid';
  const dogId = 'dog-uuid';

  beforeEach(async () => {
    tx = {
      activity: {
        create: jest.fn(),
        findUniqueOrThrow: jest.fn(),
      },
      activityDog: {
        createMany: jest.fn().mockResolvedValue({ count: 1 }),
        deleteMany: jest.fn(),
        findMany: jest.fn(),
      },
      activityInvitation: { update: jest.fn() },
      userActivity: { create: jest.fn(), upsert: jest.fn() },
    };

    prisma = {
      $transaction: jest.fn(async (fn: (client: typeof tx) => unknown) =>
        fn(tx),
      ),
      activity: {
        findUnique: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
      },
      dog: {
        findMany: jest.fn(),
      },
      activityInvitation: {
        findUnique: jest.fn(),
      },
    };

    events = {
      emitToActivity: jest.fn(),
      emitToUser: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        ActivitiesService,
        { provide: PrismaService, useValue: prisma },
        { provide: EventsGateway, useValue: events },
        { provide: BadgeEngineService, useValue: { evaluateAndAward: jest.fn() } },
        { provide: RewardService, useValue: { awardReward: jest.fn() } },
        { provide: PremiumService, useValue: { isPremium: jest.fn().mockResolvedValue(false) } },
        { provide: DogStatsService, useValue: { syncFromActivityStats: jest.fn() } },
      ],
    }).compile();

    service = module.get(ActivitiesService);
  });

  describe('assertDogsBelongToUser (via joinActivity)', () => {
    it('rejects when a dog does not belong to the user', async () => {
      (prisma.activity.findUnique as jest.Mock).mockResolvedValue({
        id: activityId,
        visibility: ActivityVisibility.public,
        status: ActivityStatus.not_started,
        date: new Date(Date.now() + 86400000),
        creatorId,
        userActivities: [],
        participantLimit: null,
      });
      (prisma.dog.findMany as jest.Mock).mockResolvedValue([
        { id: dogId, ownerId: 'other-user' },
      ]);

      await expect(
        service.joinActivity(activityId, joinerId, [dogId]),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects when a dog is not found', async () => {
      (prisma.activity.findUnique as jest.Mock).mockResolvedValue({
        id: activityId,
        visibility: ActivityVisibility.public,
        status: ActivityStatus.not_started,
        date: new Date(Date.now() + 86400000),
        creatorId,
        userActivities: [],
        participantLimit: null,
      });
      (prisma.dog.findMany as jest.Mock).mockResolvedValue([]);

      await expect(
        service.joinActivity(activityId, joinerId, [dogId]),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('joinActivity', () => {
    const publicActivity = {
      id: activityId,
      visibility: ActivityVisibility.public,
      status: ActivityStatus.not_started,
      date: new Date(Date.now() + 86400000),
      creatorId,
      userActivities: [{ userId: creatorId }],
      participantLimit: 6,
    };

    beforeEach(() => {
      (prisma.dog.findMany as jest.Mock).mockResolvedValue([
        { id: dogId, ownerId: joinerId },
      ]);
    });

    it('joins with dogs when under participant limit', async () => {
      (prisma.activity.findUnique as jest.Mock)
        .mockResolvedValueOnce(publicActivity)
        .mockResolvedValueOnce({
          ...publicActivity,
          activityDogs: [
            {
              id: 'ad-1',
              dogId,
              userId: joinerId,
              dog: {
                id: dogId,
                name: 'Rex',
                image: null,
                dominance: 'neutral',
                dogBehaviors: [{ behavior: { id: 1, name: 'Sociable' } }],
              },
              user: { id: joinerId, firstName: 'Jean', lastName: 'Dupont' },
            },
          ],
          userActivities: [],
          creator: null,
          steps: [],
          stats: [],
        });
      (tx.activityDog.findMany as jest.Mock).mockResolvedValue([
        {
          dog: {
            id: dogId,
            name: 'Rex',
            dominance: 'neutral',
            dogBehaviors: [{ behavior: { id: 1, name: 'Sociable' } }],
          },
        },
      ]);

      const result = await service.joinActivity(activityId, joinerId, [dogId]);

      expect(tx.userActivity.create).toHaveBeenCalledWith({
        data: { userId: joinerId, activityId },
      });
      expect(tx.activityDog.createMany).toHaveBeenCalled();
      expect(events.emitToActivity).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it('rejects when participant limit is reached', async () => {
      (prisma.activity.findUnique as jest.Mock).mockResolvedValue({
        ...publicActivity,
        participantLimit: 2,
        userActivities: [
          { userId: creatorId },
          { userId: 'other-user' },
        ],
      });

      await expect(
        service.joinActivity(activityId, joinerId, [dogId]),
      ).rejects.toThrow(ConflictException);
    });

    it('rejects private activities', async () => {
      (prisma.activity.findUnique as jest.Mock).mockResolvedValue({
        ...publicActivity,
        visibility: ActivityVisibility.private,
      });

      await expect(
        service.joinActivity(activityId, joinerId, [dogId]),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects when already a participant', async () => {
      (prisma.activity.findUnique as jest.Mock).mockResolvedValue({
        ...publicActivity,
        userActivities: [{ userId: joinerId }],
      });

      await expect(
        service.joinActivity(activityId, joinerId, [dogId]),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('updateActivityDogs', () => {
    it('rejects updates after activity has started', async () => {
      (prisma.activity.findUnique as jest.Mock)
        .mockResolvedValueOnce({
          creatorId,
          userActivities: [{ userId: joinerId }],
        })
        .mockResolvedValueOnce({ status: ActivityStatus.in_progress });

      await expect(
        service.updateActivityDogs(activityId, joinerId, [dogId]),
      ).rejects.toThrow(BadRequestException);
    });
  });
});

describe('ActivitiesService — saveStats premium GPS gating', () => {
  let service: ActivitiesService;
  let prisma: Record<string, jest.Mock>;
  let premiumService: { isPremium: jest.Mock };
  let dogStatsService: { syncFromActivityStats: jest.Mock };

  const activityId = 'activity-uuid';
  const userId = 'user-uuid';

  beforeEach(async () => {
    premiumService = { isPremium: jest.fn().mockResolvedValue(false) };
    dogStatsService = { syncFromActivityStats: jest.fn().mockResolvedValue(undefined) };

    prisma = {
      activity: { findUnique: jest.fn().mockResolvedValue({
        id: activityId,
        creatorId: userId,
        userActivities: [],
      }) },
      activityStats: {
        upsert: jest.fn().mockResolvedValue({
          id: 'stats-uuid',
          activityId,
          userId,
          distanceKm: null,
          durationMinutes: 30,
          syncedToUserStats: false,
          syncedToDogStats: false,
          actualEndTime: null,
        }),
        update: jest.fn().mockResolvedValue({}),
      },
      userStats: { upsert: jest.fn().mockResolvedValue({}) },
      $transaction: jest.fn(async (fn: (tx: unknown) => unknown) => fn({})),
    };

    const module = await Test.createTestingModule({
      providers: [
        ActivitiesService,
        { provide: PrismaService, useValue: prisma },
        { provide: EventsGateway, useValue: { emitToActivity: jest.fn(), emitToUser: jest.fn() } },
        { provide: BadgeEngineService, useValue: { evaluateAndAward: jest.fn() } },
        { provide: RewardService, useValue: { awardReward: jest.fn() } },
        { provide: PremiumService, useValue: premiumService },
        { provide: DogStatsService, useValue: dogStatsService },
      ],
    }).compile();

    service = module.get(ActivitiesService);
  });

  it('strips routePoints and distanceKm for non-premium users', async () => {
    await service.saveStats(activityId, userId, {
      distanceKm: 5,
      durationMinutes: 30,
      routePoints: [{ lat: 1, lng: 2 }],
      isCompleted: false,
    });

    expect(prisma.activityStats.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.not.objectContaining({
          routePoints: expect.anything(),
          distanceKm: expect.anything(),
        }),
        update: expect.not.objectContaining({
          routePoints: expect.anything(),
          distanceKm: expect.anything(),
        }),
      }),
    );
  });

  it('keeps routePoints for premium users', async () => {
    premiumService.isPremium.mockResolvedValue(true);

    await service.saveStats(activityId, userId, {
      distanceKm: 5,
      durationMinutes: 30,
      routePoints: [{ lat: 1, lng: 2 }],
      isCompleted: false,
    });

    expect(prisma.activityStats.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          routePoints: [{ lat: 1, lng: 2 }],
          distanceKm: 5,
        }),
      }),
    );
  });
});

describe('ActivitiesService — getStats', () => {
  let service: ActivitiesService;
  let prisma: Record<string, jest.Mock>;

  const activityId = 'activity-uuid';
  const userId = 'user-uuid';

  beforeEach(async () => {
    prisma = {
      activity: {
        findUnique: jest.fn().mockResolvedValue({
          id: activityId,
          creatorId: userId,
          userActivities: [],
        }),
      },
      activityStats: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'stats-uuid',
          activityId,
          userId,
          distanceKm: { toNumber: () => 5.2 },
          durationMinutes: 90,
          stepsCount: 8500,
          routePoints: [[2.432, 48.832]],
          averageSpeedKmh: null,
          maxSpeedKmh: null,
          temperatureCelsius: null,
          isCompleted: true,
        }),
      },
    };

    const module = await Test.createTestingModule({
      providers: [
        ActivitiesService,
        { provide: PrismaService, useValue: prisma },
        { provide: EventsGateway, useValue: { emitToActivity: jest.fn(), emitToUser: jest.fn() } },
        { provide: BadgeEngineService, useValue: { evaluateAndAward: jest.fn() } },
        { provide: RewardService, useValue: { awardReward: jest.fn() } },
        { provide: PremiumService, useValue: { isPremium: jest.fn() } },
        { provide: DogStatsService, useValue: { syncFromActivityStats: jest.fn() } },
      ],
    }).compile();

    service = module.get(ActivitiesService);
  });

  it('returns serialized stats for a participant', async () => {
    const result = await service.getStats(activityId, userId);

    expect(prisma.activityStats.findUnique).toHaveBeenCalledWith({
      where: { activityId_userId: { activityId, userId } },
    });
    expect(result).toMatchObject({
      id: 'stats-uuid',
      activityId,
      userId,
      durationMinutes: 90,
      stepsCount: 8500,
      isCompleted: true,
    });
  });

  it('throws NotFoundException when stats are missing', async () => {
    prisma.activityStats.findUnique.mockResolvedValue(null);

    await expect(service.getStats(activityId, userId)).rejects.toThrow(
      NotFoundException,
    );
  });
});
