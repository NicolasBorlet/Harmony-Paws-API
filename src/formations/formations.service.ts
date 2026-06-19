import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { serialize } from '../common/utils/serialize';

@Injectable()
export class FormationsService {
  constructor(private readonly prisma: PrismaService) {}

  async listFormations() {
    const formations = await this.prisma.formation.findMany({
      include: {
        modules: { include: { lessons: true } },
        opinions: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return serialize(formations);
  }

  async getFormation(id: number) {
    const formation = await this.prisma.formation.findUnique({
      where: { id },
      include: {
        modules: { include: { lessons: { include: { lessonSteps: true } } } },
        opinions: { include: { user: { select: { id: true, firstName: true } } } },
      },
    });
    return serialize(formation);
  }

  async listFavorites(userId: string) {
    const favorites = await this.prisma.formationFavorite.findMany({
      where: { userId },
      include: { formation: true },
    });
    return serialize(favorites);
  }

  async toggleFavorite(userId: string, formationId: number) {
    const existing = await this.prisma.formationFavorite.findUnique({
      where: { userId_formationId: { userId, formationId } },
    });
    if (existing) {
      await this.prisma.formationFavorite.delete({
        where: { userId_formationId: { userId, formationId } },
      });
      return { favorited: false };
    }
    await this.prisma.formationFavorite.create({
      data: { userId, formationId },
    });
    return { favorited: true };
  }

  async getPurchaseStatus(_userId: string, _formationId: number) {
    // Payments deferred — RevenueCat integration planned.
    return { purchased: false };
  }
}
