import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { serialize, decimalToNumber } from '../common/utils/serialize';

@Injectable()
export class StatsBadgesService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserStats(userId: string) {
    const stats = await this.prisma.userStats.findUnique({
      where: { userId },
    });
    if (!stats) return null;
    return serialize({
      ...stats,
      totalDistanceKm: decimalToNumber(stats.totalDistanceKm),
      monthlyDistanceKm: decimalToNumber(stats.monthlyDistanceKm),
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
        include: { badges: { where: { isActive: true } } },
        orderBy: { displayOrder: 'asc' },
      }),
    );
  }
}
