import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { serialize, decimalToNumber } from '../common/utils/serialize';

@Injectable()
export class StatsBadgesService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserStats(userId: string, isPremium: boolean) {
    const stats = await this.prisma.userStats.findUnique({
      where: { userId },
    });
    if (!stats) return null;

    const totalDistanceKm = decimalToNumber(stats.totalDistanceKm) ?? 0;
    const totalActivities = stats.totalActivities ?? 0;
    const totalDurationMinutes = stats.totalDurationMinutes ?? 0;

    // Métriques moyennes dérivées des totaux (réservées au premium).
    const avgDistancePerActivityKm =
      totalActivities > 0 ? totalDistanceKm / totalActivities : 0;
    const avgDurationPerActivityMinutes =
      totalActivities > 0 ? totalDurationMinutes / totalActivities : 0;

    return serialize({
      ...stats,
      totalDistanceKm,
      // Stats précises réservées aux utilisateurs premium.
      locked: !isPremium,
      monthlyDistanceKm: isPremium
        ? decimalToNumber(stats.monthlyDistanceKm)
        : null,
      monthlyActivities: isPremium ? stats.monthlyActivities : null,
      avgDistancePerActivityKm: isPremium ? avgDistancePerActivityKm : null,
      avgDurationPerActivityMinutes: isPremium
        ? avgDurationPerActivityMinutes
        : null,
    });
  }

  async listUserBadges(userId: string) {
    const badges = await this.prisma.userBadge.findMany({
      where: { userId },
      include: { badge: { include: { category: true } } },
      orderBy: { earnedAt: 'desc' },
    });
    return serialize(badges);
  }

  async listBadgeCategories() {
    return serialize(
      await this.prisma.badgeCategory.findMany({
        where: { isActive: true },
        include: {
          badges: {
            where: { isActive: true },
            orderBy: { displayOrder: 'asc' },
          },
        },
        orderBy: { displayOrder: 'asc' },
      }),
    );
  }

  /**
   * Flat catalog of every active, non-secret badge. Secret badges are excluded
   * so they stay hidden until a user actually unlocks them.
   */
  async listBadges() {
    return serialize(
      await this.prisma.badge.findMany({
        where: { isActive: true, isSecret: false },
        include: { category: true },
        orderBy: [
          { category: { displayOrder: 'asc' } },
          { displayOrder: 'asc' },
        ],
      }),
    );
  }
}
