import { Injectable } from '@nestjs/common';
import { Prisma, RewardSource } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { computeLevel } from './reward.constants';

export type AwardRewardInput = {
  userId: string;
  source: RewardSource;
  sourceId: string;
  points: number;
  experience: number;
  metadata?: Prisma.InputJsonValue;
};

export type AwardRewardResult = {
  awarded: boolean;
  level?: number;
};

@Injectable()
export class RewardService {
  constructor(private readonly prisma: PrismaService) {}

  async awardReward(
    tx: Prisma.TransactionClient,
    input: AwardRewardInput,
  ): Promise<AwardRewardResult> {
    const { userId, source, sourceId, points, experience, metadata } = input;

    const created = await tx.userRewardEvent.createMany({
      data: [
        {
          userId,
          source,
          sourceId,
          points,
          experience,
          metadata,
        },
      ],
      skipDuplicates: true,
    });

    if (created.count === 0) {
      return { awarded: false };
    }

    const stats = await tx.userStats.upsert({
      where: { userId },
      create: {
        userId,
        totalPoints: points,
        totalExperience: experience,
        level: computeLevel(experience),
      },
      update: {
        totalPoints: { increment: points },
        totalExperience: { increment: experience },
      },
    });

    const totalExperience = stats.totalExperience ?? 0;
    const level = computeLevel(totalExperience);

    if (stats.level !== level) {
      await tx.userStats.update({
        where: { userId },
        data: { level },
      });
    }

    return { awarded: true, level };
  }
}
