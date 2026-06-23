import { Test } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { BadgeEngineService } from './badge-engine.service';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway } from '../websocket/events.gateway';
import { RewardService } from './reward.service';

/**
 * The engine is pure orchestration over Prisma, so we mock the data layer and
 * assert the unlock decisions: threshold checks, idempotence (already-earned
 * badges are skipped) and the WebSocket notification.
 */
describe('BadgeEngineService', () => {
  let service: BadgeEngineService;
  let prisma: any;
  let events: { emitToUser: jest.Mock };
  let rewardService: { awardReward: jest.Mock };
  let tx: any;

  const dec = (n: number) => new Prisma.Decimal(n);

  const makeBadge = (over: Partial<any> = {}) => ({
    id: 'b1',
    code: 'explorateur_10',
    points: 10,
    requirementType: 'total_distance_km',
    requirementValue: dec(10),
    isActive: true,
    ...over,
  });

  beforeEach(async () => {
    tx = {
      userBadge: {
        createMany: jest.fn().mockResolvedValue({ count: 1 }),
        upsert: jest.fn(),
      },
    };
    prisma = {
      userStats: { findUnique: jest.fn().mockResolvedValue(null) },
      user: { findUnique: jest.fn().mockResolvedValue({ isPremium: false }) },
      friendship: { count: jest.fn().mockResolvedValue(0) },
      userMeeting: { count: jest.fn().mockResolvedValue(0) },
      dog: { count: jest.fn().mockResolvedValue(0) },
      activity: { count: jest.fn().mockResolvedValue(0) },
      userProgress: { count: jest.fn().mockResolvedValue(0) },
      message: { count: jest.fn().mockResolvedValue(0) },
      badge: { findMany: jest.fn(), findUnique: jest.fn() },
      userBadge: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        createMany: jest.fn().mockResolvedValue({ count: 1 }),
        upsert: jest.fn(),
      },
      $transaction: jest.fn(async (fn: (client: typeof tx) => Promise<unknown>) =>
        fn(tx),
      ),
    };
    events = { emitToUser: jest.fn() };
    rewardService = {
      awardReward: jest.fn().mockResolvedValue({ awarded: true, level: 2 }),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        BadgeEngineService,
        { provide: PrismaService, useValue: prisma },
        { provide: EventsGateway, useValue: events },
        { provide: RewardService, useValue: rewardService },
      ],
    }).compile();

    service = moduleRef.get(BadgeEngineService);
  });

  it('awards a badge once its metric reaches the threshold', async () => {
    prisma.userStats.findUnique.mockResolvedValue({ totalDistanceKm: dec(12) });
    prisma.badge.findMany.mockResolvedValue([makeBadge()]);
    prisma.userBadge.findMany
      .mockResolvedValueOnce([]) // earned lookup -> none
      .mockResolvedValueOnce([
        { id: '1', userId: 'u1', badgeId: 'b1', badge: makeBadge() },
      ]); // re-read created

    const result = await service.evaluateAndAward('u1');

    expect(tx.userBadge.createMany).toHaveBeenCalledWith({
      data: [{ userId: 'u1', badgeId: 'b1' }],
      skipDuplicates: true,
    });
    expect(rewardService.awardReward).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        userId: 'u1',
        source: 'badge',
        sourceId: 'b1',
        points: 10,
        experience: 100,
      }),
    );
    expect(events.emitToUser).toHaveBeenCalledWith(
      'u1',
      'badge:unlocked',
      expect.any(Array),
    );
    expect(result).toHaveLength(1);
  });

  it('does not award when the metric is below the threshold', async () => {
    prisma.userStats.findUnique.mockResolvedValue({ totalDistanceKm: dec(4) });
    prisma.badge.findMany.mockResolvedValue([makeBadge()]);
    prisma.userBadge.findMany.mockResolvedValue([]);

    const result = await service.evaluateAndAward('u1');

    expect(tx.userBadge.createMany).not.toHaveBeenCalled();
    expect(events.emitToUser).not.toHaveBeenCalled();
    expect(result).toEqual([]);
  });

  it('is idempotent: already-earned badges are skipped', async () => {
    prisma.userStats.findUnique.mockResolvedValue({ totalDistanceKm: dec(50) });
    prisma.badge.findMany.mockResolvedValue([makeBadge()]);
    prisma.userBadge.findMany.mockResolvedValue([{ badgeId: 'b1' }]);

    const result = await service.evaluateAndAward('u1');

    expect(tx.userBadge.createMany).not.toHaveBeenCalled();
    expect(result).toEqual([]);
  });

  it('computes boolean metrics (profile completion / premium)', async () => {
    prisma.user.findUnique.mockResolvedValue({
      isPremium: true,
      firstName: 'A',
      lastName: 'B',
      description: 'hi',
      place: 'Paris',
    });

    const metrics = await service.computeMetrics('u1');

    expect(metrics.is_premium).toBe(1);
    expect(metrics.profile_completed).toBe(1);
  });
});
