import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DogDominance, DogSex, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { serialize } from '../common/utils/serialize';
import { DiscoverDogsQueryDto } from './dto/dogs.dto';

@Injectable()
export class DogsService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly dogInclude = {
    breed: true,
    dogBehaviors: { include: { behavior: true } },
  } as const;

  async listByOwner(ownerId: string) {
    const dogs = await this.prisma.dog.findMany({
      where: { ownerId },
      include: this.dogInclude,
      orderBy: { createdAt: 'desc' },
    });
    return serialize(dogs);
  }

  async discover(userId: string, query: DiscoverDogsQueryDto) {
    const page = query.page ?? 0;
    const pageSize = query.pageSize ?? 5;

    const where: Prisma.DogWhereInput = {
      ownerId: { not: userId },
      ...(query.sex ? { sex: query.sex } : {}),
      ...(query.age != null ? { age: query.age } : {}),
      ...(query.dominance ? { dominance: query.dominance } : {}),
    };

    const skip = page * pageSize;

    const [dogs, totalCount] = await Promise.all([
      this.prisma.dog.findMany({
        where,
        include: this.dogInclude,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      this.prisma.dog.count({ where }),
    ]);

    return serialize({
      dogs,
      totalCount,
      hasMore: skip + dogs.length < totalCount,
    });
  }

  async getById(dogId: string, userId: string) {
    const dog = await this.prisma.dog.findUnique({
      where: { id: dogId },
      include: this.dogInclude,
    });
    if (!dog) throw new NotFoundException('Dog not found');
    if (dog.ownerId !== userId) {
      throw new ForbiddenException('Not your dog');
    }
    return serialize(dog);
  }

  async create(
    ownerId: string,
    data: {
      name: string;
      description?: string;
      dominance?: DogDominance;
      sex: DogSex;
      age: number;
      breedId: number;
      behaviorIds?: number[];
    },
  ) {
    const dog = await this.prisma.dog.create({
      data: {
        ownerId,
        name: data.name,
        description: data.description,
        dominance: data.dominance,
        sex: data.sex,
        age: data.age,
        breedId: data.breedId,
        dogBehaviors: data.behaviorIds?.length
          ? {
              create: data.behaviorIds.map((behaviorId) => ({ behaviorId })),
            }
          : undefined,
      },
      include: this.dogInclude,
    });
    return serialize(dog);
  }

  async update(
    dogId: string,
    userId: string,
    data: Partial<{
      name: string;
      description: string;
      dominance: DogDominance;
      sex: DogSex;
      age: number;
      breedId: number;
      image: string;
      behaviorIds: number[];
    }>,
  ) {
    await this.getById(dogId, userId);
    const { behaviorIds, ...dogData } = data;

    const dog = await this.prisma.$transaction(async (tx) => {
      if (behaviorIds !== undefined) {
        await tx.dogBehavior.deleteMany({ where: { dogId } });
        if (behaviorIds.length > 0) {
          await tx.dogBehavior.createMany({
            data: behaviorIds.map((behaviorId) => ({ dogId, behaviorId })),
          });
        }
      }

      return tx.dog.update({
        where: { id: dogId },
        data: dogData,
        include: this.dogInclude,
      });
    });

    return serialize(dog);
  }

  async delete(dogId: string, userId: string) {
    await this.getById(dogId, userId);
    await this.prisma.dog.delete({ where: { id: dogId } });
    return { success: true };
  }

  async listBreeds() {
    return serialize(await this.prisma.breed.findMany({ orderBy: { name: 'asc' } }));
  }

  async listBehaviors() {
    return serialize(
      await this.prisma.behavior.findMany({ orderBy: { name: 'asc' } }),
    );
  }

  async userHasDog(userId: string) {
    const count = await this.prisma.dog.count({ where: { ownerId: userId } });
    return { hasDog: count > 0 };
  }
}
