import { Prisma, PrismaClient, RewardSource } from '@prisma/client';
import {
  computeActivityOs,
  computeBadgeReward,
  computeLevel,
  osToExperience,
} from '../../src/stats-badges/reward.constants';

const prisma = new PrismaClient();

async function awardReward(
  userId: string,
  source: RewardSource,
  sourceId: string,
  points: number,
  experience: number,
  metadata?: Prisma.InputJsonValue,
): Promise<boolean> {
  const created = await prisma.userRewardEvent.createMany({
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
    return false;
  }

  const stats = await prisma.userStats.upsert({
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

  const level = computeLevel(stats.totalExperience ?? 0);
  if (stats.level !== level) {
    await prisma.userStats.update({
      where: { userId },
      data: { level },
    });
  }

  return true;
}

async function backfillBadges(): Promise<number> {
  const userBadges = await prisma.userBadge.findMany({
    include: { badge: true },
  });

  let awarded = 0;
  for (const row of userBadges) {
    const { points, experience } = computeBadgeReward(row.badge.points);
    const didAward = await awardReward(
      row.userId,
      RewardSource.badge,
      row.badgeId,
      points,
      experience,
      { badgeCode: row.badge.code, backfill: true },
    );
    if (didAward) awarded++;
  }

  return awarded;
}

async function backfillActivities(): Promise<number> {
  const completedStats = await prisma.activityStats.findMany({
    where: { isCompleted: true },
  });

  let awarded = 0;
  for (const stats of completedStats) {
    const distanceKm = stats.distanceKm ? Number(stats.distanceKm) : 0;
    const durationMinutes = stats.durationMinutes ?? 0;
    const os = computeActivityOs(distanceKm, durationMinutes);

    const didAward = await awardReward(
      stats.userId,
      RewardSource.activity,
      stats.id,
      os,
      osToExperience(os),
      {
        activityId: stats.activityId,
        distanceKm,
        durationMinutes,
        backfill: true,
      },
    );
    if (didAward) awarded++;
  }

  return awarded;
}

async function verifyConsistency(): Promise<void> {
  const users = await prisma.user.findMany({
    select: { id: true, userStats: true },
  });

  let mismatches = 0;
  for (const user of users) {
    const aggregate = await prisma.userRewardEvent.aggregate({
      where: { userId: user.id },
      _sum: { points: true, experience: true },
    });

    const ledgerPoints = aggregate._sum.points ?? 0;
    const ledgerXp = aggregate._sum.experience ?? 0;
    const statsPoints = user.userStats?.totalPoints ?? 0;
    const statsXp = user.userStats?.totalExperience ?? 0;

    if (ledgerPoints !== statsPoints || ledgerXp !== statsXp) {
      mismatches++;
      console.warn(
        `Mismatch for user ${user.id}: ledger(os=${ledgerPoints}, xp=${ledgerXp}) vs stats(os=${statsPoints}, xp=${statsXp})`,
      );
    }
  }

  if (mismatches === 0) {
    console.log('Consistency check passed for all users.');
  } else {
    console.warn(`Consistency check found ${mismatches} mismatch(es).`);
  }
}

async function main() {
  console.log('Starting reward backfill...');

  const badgeAwards = await backfillBadges();
  console.log(`Badge rewards created: ${badgeAwards}`);

  const activityAwards = await backfillActivities();
  console.log(`Activity rewards created: ${activityAwards}`);

  await verifyConsistency();
  console.log('Reward backfill complete.');
}

main()
  .catch((error) => {
    console.error('Backfill failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
