import { Injectable, Logger } from '@nestjs/common';
import { Badge, ContentType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EventsGateway, WS_EVENTS } from '../websocket/events.gateway';
import { decimalToNumber, serialize } from '../common/utils/serialize';
import {
  BADGE_REQUIREMENT_TYPES as R,
  BadgeRequirementType,
  UserMetrics,
} from './badge-requirements';

@Injectable()
export class BadgeEngineService {
  private readonly logger = new Logger(BadgeEngineService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventsGateway,
  ) {}

  /**
   * Compute every metric the badge engine knows about for a single user.
   *
   * One method centralises the queries so a single evaluation pass needs only
   * one round-trip per data source. Counts are cheap (`COUNT(*)` with indexes)
   * and run in parallel.
   */
  async computeMetrics(userId: string): Promise<UserMetrics> {
    const [
      stats,
      user,
      friendsCount,
      meetingsCount,
      dogsCount,
      activitiesCreated,
      formationsCompleted,
      messagesSent,
    ] = await Promise.all([
      this.prisma.userStats.findUnique({ where: { userId } }),
      this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          isPremium: true,
          firstName: true,
          lastName: true,
          description: true,
          place: true,
        },
      }),
      this.prisma.friendship.count({
        where: { userId, status: 'accepted' },
      }),
      this.prisma.userMeeting.count({ where: { userId } }),
      this.prisma.dog.count({ where: { ownerId: userId } }),
      this.prisma.activity.count({ where: { creatorId: userId } }),
      this.prisma.userProgress.count({
        where: { userId, contentType: ContentType.formation, completed: true },
      }),
      this.prisma.message.count({ where: { senderId: userId } }),
    ]);

    const profileCompleted =
      !!user?.firstName &&
      !!user?.lastName &&
      !!user?.description &&
      !!user?.place;

    return {
      [R.TOTAL_DISTANCE_KM]: decimalToNumber(stats?.totalDistanceKm) ?? 0,
      [R.TOTAL_ACTIVITIES]: stats?.totalActivities ?? 0,
      [R.TOTAL_DURATION_MINUTES]: stats?.totalDurationMinutes ?? 0,
      [R.CURRENT_STREAK]: stats?.currentStreak ?? 0,
      [R.LONGEST_STREAK]: stats?.longestStreak ?? 0,
      [R.FRIENDS_COUNT]: friendsCount,
      [R.MEETINGS_COUNT]: meetingsCount,
      [R.DOGS_COUNT]: dogsCount,
      [R.ACTIVITIES_CREATED]: activitiesCreated,
      [R.FORMATIONS_COMPLETED]: formationsCompleted,
      [R.MESSAGES_SENT]: messagesSent,
      [R.IS_PREMIUM]: user?.isPremium ? 1 : 0,
      [R.PROFILE_COMPLETED]: profileCompleted ? 1 : 0,
    };
  }

  /**
   * Whether a badge's requirement is met given the user's metrics.
   * Badges without an automatic requirement type are never auto-awarded.
   */
  private isSatisfied(badge: Badge, metrics: UserMetrics): boolean {
    if (!badge.requirementType || badge.requirementValue == null) return false;
    const metric = metrics[badge.requirementType as BadgeRequirementType];
    if (metric == null) return false;
    return metric >= decimalToNumber(badge.requirementValue)!;
  }

  /**
   * Evaluate every active badge for a user and award the newly satisfied ones.
   *
   * Idempotent: badges already earned are skipped, and the insert relies on the
   * `(user_id, badge_id)` unique constraint (`skipDuplicates`) to stay safe
   * under concurrent evaluations. Returns the freshly unlocked badges so the
   * caller (or the HTTP layer) can surface them.
   */
  async evaluateAndAward(userId: string) {
    const [badges, earned, metrics] = await Promise.all([
      this.prisma.badge.findMany({
        where: { isActive: true, requirementType: { not: null } },
      }),
      this.prisma.userBadge.findMany({
        where: { userId },
        select: { badgeId: true },
      }),
      this.computeMetrics(userId),
    ]);

    const earnedIds = new Set(earned.map((e) => e.badgeId));
    const unlocked = badges.filter(
      (b) => !earnedIds.has(b.id) && this.isSatisfied(b, metrics),
    );

    if (unlocked.length === 0) return [];

    await this.prisma.userBadge.createMany({
      data: unlocked.map((b) => ({ userId, badgeId: b.id })),
      skipDuplicates: true,
    });

    // Re-read only the rows actually created in this pass (so concurrent
    // evaluations don't double-notify) with their category for the payload.
    const created = await this.prisma.userBadge.findMany({
      where: { userId, badgeId: { in: unlocked.map((b) => b.id) } },
      include: { badge: { include: { category: true } } },
      orderBy: { earnedAt: 'desc' },
    });

    const payload = serialize(created);
    this.events.emitToUser(userId, WS_EVENTS.BADGE_UNLOCKED, payload);
    this.logger.log(
      `User ${userId} unlocked ${unlocked.length} badge(s): ${unlocked
        .map((b) => b.code)
        .join(', ')}`,
    );

    return payload;
  }

  /**
   * Manually grant a badge by code (e.g. secret / event badges that have no
   * automatic requirement). Idempotent — returns the existing row if already
   * earned, or `null` if the badge code is unknown.
   */
  async awardByCode(userId: string, code: string) {
    const badge = await this.prisma.badge.findUnique({ where: { code } });
    if (!badge) return null;

    const userBadge = await this.prisma.userBadge.upsert({
      where: { userId_badgeId: { userId, badgeId: badge.id } },
      create: { userId, badgeId: badge.id },
      update: {},
      include: { badge: { include: { category: true } } },
    });

    return serialize(userBadge);
  }

  /**
   * Progress report: every visible badge with the user's current metric value,
   * its target, and whether it's earned. Secret badges are only shown once
   * earned. Used to power a "badges to unlock" screen.
   */
  async getProgress(userId: string) {
    const [badges, earned, metrics] = await Promise.all([
      this.prisma.badge.findMany({
        where: { isActive: true },
        include: { category: true },
        orderBy: [
          { category: { displayOrder: 'asc' } },
          { displayOrder: 'asc' },
        ],
      }),
      this.prisma.userBadge.findMany({ where: { userId } }),
      this.computeMetrics(userId),
    ]);

    const earnedMap = new Map(earned.map((e) => [e.badgeId, e]));

    return badges
      .filter((b) => !b.isSecret || earnedMap.has(b.id))
      .map((b) => {
        const earnedRow = earnedMap.get(b.id);
        const target = decimalToNumber(b.requirementValue);
        const current =
          b.requirementType != null
            ? (metrics[b.requirementType as BadgeRequirementType] ?? 0)
            : null;
        const progress =
          target && target > 0 && current != null
            ? Math.min(1, current / target)
            : earnedRow
              ? 1
              : 0;

        return serialize({
          ...b,
          earned: !!earnedRow,
          earnedAt: earnedRow?.earnedAt ?? null,
          currentValue: current,
          targetValue: target,
          progress: Math.round(progress * 100) / 100,
        });
      });
  }
}
