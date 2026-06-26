import { PrismaClient } from '@prisma/client';
import { decimalToNumber } from '../../src/common/utils/serialize';

const prisma = new PrismaClient();

async function syncDogStatsFromActivityStat(stat: {
  id: string;
  activityId: string | null;
  userId: string;
  distanceKm: { toNumber(): number } | null;
  durationMinutes: number | null;
  actualEndTime: Date | null;
  syncedToDogStats: boolean | null;
  isCompleted: boolean | null;
}): Promise<boolean> {
  if (!stat.isCompleted || stat.syncedToDogStats || !stat.activityId) {
    return false;
  }

  const activityDogs = await prisma.activityDog.findMany({
    where: { activityId: stat.activityId, userId: stat.userId },
    select: { dogId: true },
  });

  if (activityDogs.length === 0) {
    return false;
  }

  const distance = decimalToNumber(stat.distanceKm as never) ?? 0;
  const duration = stat.durationMinutes ?? 0;
  const lastActivityDate = stat.actualEndTime ?? new Date();

  await prisma.$transaction(async (tx) => {
    for (const { dogId } of activityDogs) {
      await tx.activityDogStats.upsert({
        where: {
          activityId_dogId: {
            activityId: stat.activityId!,
            dogId,
          },
        },
        create: {
          activityId: stat.activityId!,
          dogId,
          userId: stat.userId,
          distanceKm: distance,
          durationMinutes: duration,
          activityStatsId: stat.id,
        },
        update: {
          distanceKm: distance,
          durationMinutes: duration,
          activityStatsId: stat.id,
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

    await tx.activityStats.update({
      where: { id: stat.id },
      data: { syncedToDogStats: true },
    });
  });

  return true;
}

async function main() {
  const stats = await prisma.activityStats.findMany({
    where: {
      isCompleted: true,
      OR: [{ syncedToDogStats: false }, { syncedToDogStats: null }],
      activityId: { not: null },
    },
  });

  let synced = 0;

  for (const stat of stats) {
    const didSync = await syncDogStatsFromActivityStat(stat);
    if (didSync) synced += 1;
  }

  console.log(`Backfill complete: synced ${synced} activity stats to dog stats.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
