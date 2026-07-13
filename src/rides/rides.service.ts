import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ActivityStyle,
  ActivityType,
  ActivityVisibility,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { serialize } from '../common/utils/serialize';

type RideStepInput = {
  place: string;
  latitude?: number;
  longitude?: number;
  estimatedHour?: string;
  sortOrder: number;
};

type RideInput = {
  place?: string;
  city?: string;
  address?: string;
  visibility: ActivityVisibility;
  type: ActivityType;
  style?: ActivityStyle;
  difficulty?: number;
  date?: string;
  duration?: string;
  participantLimit?: number;
  latitude?: string;
  longitude?: string;
  department?: string;
  country?: string;
  geohash?: string;
  steps?: RideStepInput[];
};

@Injectable()
export class RidesService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    const rides = await this.prisma.ride.findMany({
      include: {
        steps: { orderBy: { sortOrder: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return serialize(rides);
  }

  async getById(rideId: string) {
    const ride = await this.prisma.ride.findUnique({
      where: { id: rideId },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        steps: { orderBy: { sortOrder: 'asc' } },
      },
    });
    if (!ride) throw new NotFoundException('Ride not found');
    return serialize(ride);
  }

  async create(creatorId: string, data: RideInput) {
    const { steps, ...rideData } = data;

    const ride = await this.prisma.$transaction(async (tx) => {
      return tx.ride.create({
        data: {
          ...rideData,
          style: rideData.style ?? 'casual',
          date: rideData.date ? new Date(rideData.date) : undefined,
          creatorId,
          ...(steps?.length
            ? {
                steps: {
                  create: steps.map((step) => ({
                    place: step.place,
                    latitude: step.latitude,
                    longitude: step.longitude,
                    estimatedHour: step.estimatedHour
                      ? new Date(step.estimatedHour)
                      : undefined,
                    sortOrder: step.sortOrder,
                  })),
                },
              }
            : {}),
        },
        include: { steps: { orderBy: { sortOrder: 'asc' } } },
      });
    });

    return serialize(ride);
  }

  async update(rideId: string, userId: string, data: Partial<RideInput>) {
    await this.assertCreator(rideId, userId);
    const { steps, ...rideData } = data;

    const ride = await this.prisma.$transaction(async (tx) => {
      if (steps !== undefined) {
        await tx.rideStep.deleteMany({ where: { rideId } });
      }

      return tx.ride.update({
        where: { id: rideId },
        data: {
          ...rideData,
          ...(rideData.date !== undefined
            ? { date: rideData.date ? new Date(rideData.date) : null }
            : {}),
          ...(steps?.length
            ? {
                steps: {
                  create: steps.map((step) => ({
                    place: step.place,
                    latitude: step.latitude,
                    longitude: step.longitude,
                    estimatedHour: step.estimatedHour
                      ? new Date(step.estimatedHour)
                      : undefined,
                    sortOrder: step.sortOrder,
                  })),
                },
              }
            : {}),
        },
        include: { steps: { orderBy: { sortOrder: 'asc' } } },
      });
    });

    return serialize(ride);
  }

  async delete(rideId: string, userId: string) {
    await this.assertCreator(rideId, userId);
    await this.prisma.ride.delete({ where: { id: rideId } });
    return { success: true };
  }

  private async assertCreator(rideId: string, userId: string) {
    const ride = await this.prisma.ride.findUnique({
      where: { id: rideId },
      select: { creatorId: true },
    });
    if (!ride) throw new NotFoundException('Ride not found');
    if (ride.creatorId !== userId) {
      throw new ForbiddenException('Only the creator can perform this action');
    }
  }
}
