import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DogDominance, DogSex, Prisma } from '@prisma/client';
import { serialize } from '../common/utils/serialize';
import { PrismaService } from '../prisma/prisma.service';
import {
  AdminCreateBehaviorDataDto,
  AdminCreateBreedDataDto,
  AdminCreateDogDataDto,
  AdminTableName,
  AdminUpdateBehaviorDto,
  AdminUpdateBreedDto,
  AdminUpdateDogDto,
  AdminUpdateUserDto,
} from './dto/admin.dto';

const SORTABLE_COLUMNS: Record<AdminTableName, readonly string[]> = {
  breeds: ['name', 'createdAt', 'updatedAt'],
  behavior: ['name', 'createdAt', 'updatedAt'],
  users: ['email', 'firstName', 'lastName', 'createdAt', 'updatedAt'],
  dogs: ['name', 'age', 'createdAt', 'updatedAt'],
};

const UPDATE_FIELDS: Record<AdminTableName, readonly string[]> = {
  breeds: ['name'],
  behavior: ['name'],
  users: ['firstName', 'lastName', 'email', 'age', 'place', 'description'],
  dogs: ['name', 'age', 'description', 'sex', 'dominance', 'breedId'],
};

const USER_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  age: true,
  place: true,
  description: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  assertTableName(table: string): asserts table is AdminTableName {
    if (!['breeds', 'dogs', 'users', 'behavior'].includes(table)) {
      throw new BadRequestException(`Invalid table name: ${table}`);
    }
  }

  getValidUpdateFields(tableName: AdminTableName): readonly string[] {
    return UPDATE_FIELDS[tableName];
  }

  async getDashboardStats() {
    const [users, dogs, breeds, behaviors] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.dog.count(),
      this.prisma.breed.count(),
      this.prisma.behavior.count(),
    ]);

    return { users, dogs, breeds, behaviors };
  }

  async listTable(
    tableName: AdminTableName,
    page = 1,
    limit = 25,
    sortBy?: string,
    direction: 'asc' | 'desc' = 'asc',
  ) {
    const offset = (page - 1) * limit;
    const orderBy = this.buildOrderBy(tableName, sortBy, direction);

    switch (tableName) {
      case 'breeds': {
        const [data, total] = await Promise.all([
          this.prisma.breed.findMany({
            orderBy,
            skip: offset,
            take: limit,
          }),
          this.prisma.breed.count(),
        ]);
        return serialize({ data, total });
      }
      case 'behavior': {
        const [data, total] = await Promise.all([
          this.prisma.behavior.findMany({
            orderBy,
            skip: offset,
            take: limit,
          }),
          this.prisma.behavior.count(),
        ]);
        return serialize({ data, total });
      }
      case 'users': {
        const [data, total] = await Promise.all([
          this.prisma.user.findMany({
            select: USER_SELECT,
            orderBy,
            skip: offset,
            take: limit,
          }),
          this.prisma.user.count(),
        ]);
        return serialize({ data, total });
      }
      case 'dogs': {
        const [data, total] = await Promise.all([
          this.prisma.dog.findMany({
            orderBy,
            skip: offset,
            take: limit,
          }),
          this.prisma.dog.count(),
        ]);
        return serialize({ data, total });
      }
    }
  }

  async getTableRow(tableName: AdminTableName, id: string) {
    switch (tableName) {
      case 'breeds': {
        const row = await this.prisma.breed.findUnique({
          where: { id: Number(id) },
        });
        if (!row) throw new NotFoundException('Not found');
        return serialize(row);
      }
      case 'behavior': {
        const row = await this.prisma.behavior.findUnique({
          where: { id: Number(id) },
        });
        if (!row) throw new NotFoundException('Not found');
        return serialize(row);
      }
      case 'users': {
        const row = await this.prisma.user.findUnique({
          where: { id },
          select: USER_SELECT,
        });
        if (!row) throw new NotFoundException('Not found');
        return serialize(row);
      }
      case 'dogs': {
        const row = await this.prisma.dog.findUnique({ where: { id } });
        if (!row) throw new NotFoundException('Not found');
        return serialize(row);
      }
    }
  }

  async createTableRow(tableName: AdminTableName, data: Record<string, unknown>) {
    if (tableName === 'users') {
      throw new BadRequestException(
        "La création d'utilisateurs doit passer par /auth/register",
      );
    }

    switch (tableName) {
      case 'breeds':
        return this.createBreed(data);
      case 'behavior':
        return this.createBehavior(data);
      case 'dogs':
        return this.createDog(data);
    }
  }

  async updateTableRow(
    tableName: AdminTableName,
    id: string,
    data: Record<string, unknown>,
  ) {
    const validFields = UPDATE_FIELDS[tableName];
    const invalidFields = Object.keys(data).filter(
      (field) => !validFields.includes(field),
    );

    if (invalidFields.length > 0) {
      throw new BadRequestException(
        `Champs invalides pour la mise à jour: ${invalidFields.join(', ')}`,
      );
    }

    switch (tableName) {
      case 'breeds':
        return this.updateBreed(id, data as unknown as AdminUpdateBreedDto);
      case 'behavior':
        return this.updateBehavior(id, data as unknown as AdminUpdateBehaviorDto);
      case 'users':
        return this.updateUser(id, data as unknown as AdminUpdateUserDto);
      case 'dogs':
        return this.updateDog(id, data as unknown as AdminUpdateDogDto);
    }
  }

  async deleteTableRow(tableName: AdminTableName, id: string) {
    switch (tableName) {
      case 'breeds':
        await this.prisma.breed.delete({ where: { id: Number(id) } });
        return;
      case 'behavior':
        await this.prisma.behavior.delete({ where: { id: Number(id) } });
        return;
      case 'users':
        await this.prisma.user.delete({ where: { id } });
        return;
      case 'dogs':
        await this.prisma.dog.delete({ where: { id } });
        return;
    }
  }

  private buildOrderBy(
    tableName: AdminTableName,
    sortBy: string | undefined,
    direction: 'asc' | 'desc',
  ) {
    const columns = SORTABLE_COLUMNS[tableName];
    const column = sortBy && columns.includes(sortBy) ? sortBy : 'createdAt';

    return { [column]: direction } as Prisma.BreedOrderByWithRelationInput;
  }

  private createBreed(data: Record<string, unknown>) {
    const dto = data as unknown as AdminCreateBreedDataDto;
    if (!dto.name || typeof dto.name !== 'string') {
      throw new BadRequestException('name is required');
    }

    return this.prisma.breed
      .create({ data: { name: dto.name } })
      .then(serialize);
  }

  private createBehavior(data: Record<string, unknown>) {
    const dto = data as unknown as AdminCreateBehaviorDataDto;
    if (!dto.name || typeof dto.name !== 'string') {
      throw new BadRequestException('name is required');
    }

    return this.prisma.behavior
      .create({ data: { name: dto.name } })
      .then(serialize);
  }

  private async createDog(data: Record<string, unknown>) {
    const ownerId = String(data.ownerId ?? data.owner_id ?? '');
    const breedId = Number(data.breedId ?? data.breed_id);
    const name = String(data.name ?? '');
    const age = Number(data.age ?? 1);
    const sex = data.sex as DogSex;

    if (!ownerId || !name || !sex || Number.isNaN(breedId)) {
      throw new BadRequestException(
        'ownerId, breedId, name, age and sex are required',
      );
    }

    const behaviorIds = Array.isArray(data.behaviorIds)
      ? data.behaviorIds.map((id) => Number(id))
      : undefined;

    const dog = await this.prisma.dog.create({
      data: {
        ownerId,
        breedId,
        name,
        age,
        sex,
        dominance: (data.dominance as DogDominance | null | undefined) ?? null,
        description:
          data.description != null ? String(data.description) : undefined,
        dogBehaviors: behaviorIds?.length
          ? {
              create: behaviorIds.map((behaviorId) => ({ behaviorId })),
            }
          : undefined,
      },
    });

    return serialize(dog);
  }

  private async updateBreed(id: string, data: AdminUpdateBreedDto) {
    const row = await this.prisma.breed.update({
      where: { id: Number(id) },
      data: { name: data.name },
    });

    return serialize(row);
  }

  private async updateBehavior(id: string, data: AdminUpdateBehaviorDto) {
    const row = await this.prisma.behavior.update({
      where: { id: Number(id) },
      data: { name: data.name },
    });

    return serialize(row);
  }

  private async updateUser(id: string, data: AdminUpdateUserDto) {
    const row = await this.prisma.user.update({
      where: { id },
      data,
      select: USER_SELECT,
    });

    return serialize(row);
  }

  private async updateDog(id: string, data: AdminUpdateDogDto) {
    const row = await this.prisma.dog.update({
      where: { id },
      data,
    });

    return serialize(row);
  }
}
