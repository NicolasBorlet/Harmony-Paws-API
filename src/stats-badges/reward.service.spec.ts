import { Test } from '@nestjs/testing';
import { RewardSource } from '@prisma/client';
import { RewardService } from './reward.service';
import { PrismaService } from '../prisma/prisma.service';

describe('RewardService', () => {
  let service: RewardService;
  let tx: {
    userRewardEvent: { createMany: jest.Mock };
    userStats: {
      upsert: jest.Mock;
      update: jest.Mock;
      findUnique: jest.Mock;
    };
  };

  beforeEach(async () => {
    tx = {
      userRewardEvent: {
        createMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      userStats: {
        upsert: jest.fn().mockResolvedValue({
          totalExperience: 100,
          level: 1,
        }),
        update: jest.fn().mockResolvedValue({}),
        findUnique: jest.fn(),
      },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        RewardService,
        { provide: PrismaService, useValue: {} },
      ],
    }).compile();

    service = moduleRef.get(RewardService);
  });

  it('awards reward and updates level when ledger row is new', async () => {
    const result = await service.awardReward(tx as any, {
      userId: 'u1',
      source: RewardSource.badge,
      sourceId: 'b1',
      points: 10,
      experience: 100,
    });

    expect(tx.userRewardEvent.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          userId: 'u1',
          source: RewardSource.badge,
          sourceId: 'b1',
          points: 10,
          experience: 100,
        }),
      ],
      skipDuplicates: true,
    });
    expect(tx.userStats.upsert).toHaveBeenCalled();
    expect(tx.userStats.update).toHaveBeenCalledWith({
      where: { userId: 'u1' },
      data: { level: 2 },
    });
    expect(result).toEqual({ awarded: true, level: 2 });
  });

  it('is idempotent when the ledger row already exists', async () => {
    tx.userRewardEvent.createMany.mockResolvedValue({ count: 0 });

    const result = await service.awardReward(tx as any, {
      userId: 'u1',
      source: RewardSource.activity,
      sourceId: 's1',
      points: 5,
      experience: 50,
    });

    expect(tx.userStats.upsert).not.toHaveBeenCalled();
    expect(result).toEqual({ awarded: false });
  });

  it('supports negative points for future spend without changing xp logic', async () => {
    await service.awardReward(tx as any, {
      userId: 'u1',
      source: RewardSource.badge,
      sourceId: 'spend-1',
      points: -20,
      experience: 0,
    });

    expect(tx.userRewardEvent.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          points: -20,
          experience: 0,
        }),
      ],
      skipDuplicates: true,
    });
  });
});
