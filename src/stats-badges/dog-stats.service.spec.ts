import { Test, TestingModule } from '@nestjs/testing';
import {
  DogStatsService,
  getDogStatsAccessLevel,
  getOldestDogId,
} from './dog-stats.service';
import { PrismaService } from '../prisma/prisma.service';

describe('DogStatsService helpers', () => {
  it('getOldestDogId returns earliest created dog', () => {
    const oldest = getOldestDogId([
      { id: 'b', createdAt: new Date('2024-02-01') },
      { id: 'a', createdAt: new Date('2024-01-01') },
    ]);
    expect(oldest).toBe('a');
  });

  it('getDogStatsAccessLevel grants basic to oldest dog for free users', () => {
    expect(getDogStatsAccessLevel(false, 'dog-1', 'dog-1')).toBe('basic');
    expect(getDogStatsAccessLevel(false, 'dog-2', 'dog-1')).toBe('none');
    expect(getDogStatsAccessLevel(true, 'dog-2', 'dog-1')).toBe('full');
  });
});

describe('DogStatsService — syncFromActivityStats', () => {
  let service: DogStatsService;
  let prisma: {
    activityDog: { findMany: jest.Mock };
    $transaction: jest.Mock;
  };
  let tx: {
    activityDogStats: { upsert: jest.Mock };
    dogStats: { upsert: jest.Mock };
  };

  beforeEach(async () => {
    tx = {
      activityDogStats: { upsert: jest.fn().mockResolvedValue({}) },
      dogStats: { upsert: jest.fn().mockResolvedValue({}) },
    };

    prisma = {
      activityDog: {
        findMany: jest.fn().mockResolvedValue([
          { dogId: 'dog-1' },
          { dogId: 'dog-2' },
        ]),
      },
      $transaction: jest.fn(async (fn: (client: typeof tx) => unknown) => fn(tx)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DogStatsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get(DogStatsService);
  });

  it('credits each linked dog with full activity metrics', async () => {
    await service.syncFromActivityStats('activity-1', 'user-1', 'stats-1', {
      distanceKm: { toNumber: () => 5 } as never,
      durationMinutes: 60,
      actualEndTime: new Date('2024-06-01'),
    });

    expect(tx.activityDogStats.upsert).toHaveBeenCalledTimes(2);
    expect(tx.dogStats.upsert).toHaveBeenCalledTimes(2);
    expect(tx.dogStats.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          totalDistanceKm: 5,
          totalDurationMinutes: 60,
          totalActivities: 1,
        }),
      }),
    );
  });

  it('skips sync when no dogs are linked', async () => {
    prisma.activityDog.findMany.mockResolvedValue([]);

    await service.syncFromActivityStats('activity-1', 'user-1', 'stats-1', {
      distanceKm: null,
      durationMinutes: 30,
      actualEndTime: null,
    });

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
