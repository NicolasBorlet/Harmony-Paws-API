import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { serialize } from '../common/utils/serialize';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { userStats: true },
    });
    if (!user) throw new NotFoundException('User not found');
    const { passwordHash, refreshToken, ...rest } = user;
    return serialize(rest);
  }

  async updateProfile(
    userId: string,
    data: {
      firstName?: string;
      lastName?: string;
      age?: number;
      place?: string;
      description?: string;
      onBoarding?: boolean;
      expoPushToken?: string;
    },
  ) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data,
    });
    const { passwordHash, refreshToken, ...rest } = user;
    return serialize(rest);
  }

  async searchUsers(query: string, excludeUserId: string) {
    const trimmed = query.trim();
    // Require a minimum length to prevent enumeration / bulk PII scraping by
    // iterating over short prefixes.
    if (trimmed.length < 3) {
      return [];
    }

    const users = await this.prisma.user.findMany({
      where: {
        id: { not: excludeUserId },
        OR: [
          // Email is only matched on an exact (case-insensitive) address, never
          // a substring, so the search cannot be used to harvest the user base.
          { email: { equals: trimmed, mode: 'insensitive' } },
          { firstName: { contains: trimmed, mode: 'insensitive' } },
          { lastName: { contains: trimmed, mode: 'insensitive' } },
        ],
      },
      take: 20,
      // Email is intentionally excluded from the result to avoid leaking PII.
      select: {
        id: true,
        firstName: true,
        lastName: true,
        place: true,
      },
    });
    return serialize(users);
  }
}
