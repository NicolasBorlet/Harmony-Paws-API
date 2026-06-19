import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DogDominance, DogSex } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { serialize } from '../common/utils/serialize';

@Injectable()
export class DogsService {
  constructor(private readonly prisma: PrismaService) {}

  async listByOwner(ownerId: string) {
    const dogs = await this.prisma.dog.findMany({
      where: { ownerId },
      include: { breed: true, dogBehaviors: { include: { behavior: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return serialize(dogs);
  }

  async getById(dogId: string, userId: string) {
    const dog = await this.prisma.dog.findUnique({
      where: { id: dogId },
      include: { breed: true, dogBehaviors: { include: { behavior: true } } },
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
      include: { breed: true, dogBehaviors: { include: { behavior: true } } },
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
    }>,
  ) {
    await this.getById(dogId, userId);
    const dog = await this.prisma.dog.update({
      where: { id: dogId },
      data,
      include: { breed: true },
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
