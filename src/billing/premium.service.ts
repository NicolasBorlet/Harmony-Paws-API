import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PremiumService {
  constructor(private readonly prisma: PrismaService) {}

  async isPremium(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { isPremium: true },
    });
    return user?.isPremium ?? false;
  }
}
