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
    const users = await this.prisma.user.findMany({
      where: {
        id: { not: excludeUserId },
        OR: [
          { email: { contains: query, mode: 'insensitive' } },
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 20,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        place: true,
      },
    });
    return serialize(users);
  }
}
