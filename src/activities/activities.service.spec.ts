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
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../websocket/events.gateway';
import { BadgeEngineService } from '../stats-badges/badge-engine.service';
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
