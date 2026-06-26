import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { decimalToNumber, serialize } from '../common/utils/serialize';
import { PrismaService } from '../prisma/prisma.service';

export type DogStatsAccessLevel = 'none' | 'basic' | 'full';

export function getOldestDogId(
  dogs: Array<{ id: string; createdAt: Date }>,
): string | null {
  if (dogs.length === 0) return null;

  const sorted = [...dogs].sort((a, b) => {
    const timeDiff = a.createdAt.getTime() - b.createdAt.getTime();
    if (timeDiff !== 0) return timeDiff;
    return a.id.localeCompare(b.id);
  });

  return sorted[0].id;
}

export function getDogStatsAccessLevel(
  isPremium: boolean,
  dogId: string,
  oldestDogId: string | null,
): DogStatsAccessLevel {
  if (isPremium) return 'full';
  if (oldestDogId !== null && dogId === oldestDogId) return 'basic';
  return 'none';
}

type RawDogStats = {
  dogId: string;
  totalDistanceKm: Prisma.Decimal | null;
  totalActivities: number | null;
  totalDurationMinutes: number | null;
  monthlyDistanceKm: Prisma.Decimal | null;
  monthlyActivities: number | null;
  lastActivityDate: Date | null;
};

@Injectable()
export class DogStatsService {
  private readonly logger = new Logger(DogStatsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async syncFromActivityStats(
    activityId: string,
    userId: string,
    activityStatsId: string,
    stats: {
      distanceKm: Prisma.Decimal | null;
      durationMinutes: number | null;
      actualEndTime: Date | null;
    },
  ): Promise<void> {
    const activityDogs = await this.prisma.activityDog.findMany({
      where: { activityId, userId },
      select: { dogId: true },
    });

    if (activityDogs.length === 0) {
      this.logger.warn(
        `No activity dogs to sync for activity ${activityId}, user ${userId}`,
      );
      return;
    }

    const distance = decimalToNumber(stats.distanceKm) ?? 0;
    const duration = stats.durationMinutes ?? 0;
    const lastActivityDate = stats.actualEndTime ?? new Date();

    await this.prisma.$transaction(async (tx) => {
      for (const { dogId } of activityDogs) {
        await tx.activityDogStats.upsert({
          where: {
            activityId_dogId: { activityId, dogId },
          },
          create: {
            activityId,
            dogId,
            userId,
            distanceKm: distance,
            durationMinutes: duration,
            activityStatsId,
          },
          update: {
            distanceKm: distance,
            durationMinutes: duration,
            activityStatsId,
          },
        });

        await tx.dogStats.upsert({
          where: { dogId },
          create: {
            dogId,
            totalDistanceKm: distance,
            totalActivities: 1,
            totalDurationMinutes: duration,
            monthlyDistanceKm: distance,
            monthlyActivities: 1,
            lastActivityDate,
          },
          update: {
            totalDistanceKm: { increment: distance },
            totalActivities: { increment: 1 },
            totalDurationMinutes: { increment: duration },
            monthlyDistanceKm: { increment: distance },
            monthlyActivities: { increment: 1 },
            lastActivityDate,
          },
        });
      }
    });
  }

  private formatDogStatsResponse(
    dogId: string,
    stats: RawDogStats | null,
    access: DogStatsAccessLevel,
  ) {
    const base = {
      dog_id: dogId,
      access,
      locked: access !== 'full',
      total_activities: stats?.totalActivities ?? 0,
      total_duration_minutes: stats?.totalDurationMinutes ?? 0,
      total_distance_km:
        access === 'full' ? (decimalToNumber(stats?.totalDistanceKm) ?? 0) : null,
      monthly_distance_km:
        access === 'full' ? (decimalToNumber(stats?.monthlyDistanceKm) ?? 0) : null,
      monthly_activities: access === 'full' ? (stats?.monthlyActivities ?? 0) : null,
      last_activity_date:
        access === 'full' && stats?.lastActivityDate
          ? stats.lastActivityDate.toISOString()
          : null,
    };

    return serialize(base);
  }

  async getStatsForDog(userId: string, dogId: string, isPremium: boolean) {
    const dog = await this.prisma.dog.findUnique({
      where: { id: dogId },
      select: { id: true, ownerId: true, createdAt: true },
    });

    if (!dog) throw new NotFoundException('Dog not found');
    if (dog.ownerId !== userId) {
      throw new ForbiddenException('Not your dog');
    }

    const ownerDogs = await this.prisma.dog.findMany({
      where: { ownerId: userId },
      select: { id: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const oldestDogId = getOldestDogId(ownerDogs);
    const access = getDogStatsAccessLevel(isPremium, dogId, oldestDogId);

    if (access === 'none') {
      throw new ForbiddenException('Premium required for this dog stats');
    }

    const stats = await this.prisma.dogStats.findUnique({
      where: { dogId },
    });

    return this.formatDogStatsResponse(
      dogId,
      stats
        ? {
            dogId: stats.dogId,
            totalDistanceKm: stats.totalDistanceKm,
            totalActivities: stats.totalActivities,
            totalDurationMinutes: stats.totalDurationMinutes,
            monthlyDistanceKm: stats.monthlyDistanceKm,
            monthlyActivities: stats.monthlyActivities,
            lastActivityDate: stats.lastActivityDate,
          }
        : null,
      access,
    );
  }

  async listStatsForOwner(userId: string, isPremium: boolean) {
    const dogs = await this.prisma.dog.findMany({
      where: { ownerId: userId },
      select: { id: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    const oldestDogId = getOldestDogId(dogs);
    const dogIds = dogs.map((dog) => dog.id);

    const statsRows = await this.prisma.dogStats.findMany({
      where: { dogId: { in: dogIds } },
    });

    const statsByDogId = new Map(statsRows.map((row) => [row.dogId, row]));

    return dogs
      .map((dog) => {
        const access = getDogStatsAccessLevel(isPremium, dog.id, oldestDogId);
        if (access === 'none') {
          return {
            dog_id: dog.id,
            access: 'none' as const,
            locked: true,
            total_activities: null,
            total_duration_minutes: null,
            total_distance_km: null,
            monthly_distance_km: null,
            monthly_activities: null,
            last_activity_date: null,
          };
        }

        const stats = statsByDogId.get(dog.id) ?? null;
        return this.formatDogStatsResponse(dog.id, stats, access);
      })
      .map((entry) => serialize(entry));
  }
}
