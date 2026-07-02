import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DogFriendlyPlaceStatus, Prisma } from '@prisma/client';
import {
  encodeGeohash,
  geohashCommonPrefixLength,
} from '../common/utils/geohash';
import { serialize } from '../common/utils/serialize';
import { PrismaService } from '../prisma/prisma.service';
import {
  AdminListDogFriendlyPlacesQueryDto,
  CreateDogFriendlyPlaceDto,
  ListDogFriendlyPlacesQueryDto,
  UpdateDogFriendlyPlaceDto,
} from './dto/dog-friendly-places.dto';

const MAP_DISCOVER_LIMIT = 50;

@Injectable()
export class DogFriendlyPlacesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListDogFriendlyPlacesQueryDto) {
    const page = query.page ?? 0;
    const limit = query.limit ?? 20;
    const referenceGeohash = query.geohash?.trim() ?? '';
    const searchTerm = query.search?.trim().toLowerCase() ?? '';

    const where: Prisma.DogFriendlyPlaceWhereInput = {
      status: DogFriendlyPlaceStatus.active,
      ...(query.category ? { category: query.category } : {}),
    };

    let places = await this.prisma.dogFriendlyPlace.findMany({ where });

    if (searchTerm.length >= 2) {
      places = places.filter((place) =>
        this.matchesSearchTerm(place, searchTerm),
      );
    }

    const sorted = this.sortByGeohashProximity(places, referenceGeohash);

    const skip = page * limit;
    const pageRows = sorted.slice(skip, skip + limit);

    return serialize({
      places: pageRows,
      totalCount: sorted.length,
      hasMore: skip + pageRows.length < sorted.length,
    });
  }

  async discover(geohashPrefix: string) {
    const referenceGeohash = geohashPrefix.trim();

    const places = await this.prisma.dogFriendlyPlace.findMany({
      where: { status: DogFriendlyPlaceStatus.active },
    });

    const sorted = this.sortByGeohashProximity(places, referenceGeohash);

    return serialize(sorted.slice(0, MAP_DISCOVER_LIMIT));
  }

  async adminList(query: AdminListDogFriendlyPlacesQueryDto) {
    const page = query.page ?? 0;
    const limit = query.limit ?? 20;
    const referenceGeohash = query.geohash?.trim() ?? '';

    const where: Prisma.DogFriendlyPlaceWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.category ? { category: query.category } : {}),
    };

    const places = await this.prisma.dogFriendlyPlace.findMany({ where });
    const sorted = this.sortByGeohashProximity(places, referenceGeohash);

    const skip = page * limit;
    const pageRows = sorted.slice(skip, skip + limit);

    return serialize({
      places: pageRows,
      totalCount: sorted.length,
      hasMore: skip + pageRows.length < sorted.length,
    });
  }

  async getById(id: string, options?: { includeInactive?: boolean }) {
    const place = await this.prisma.dogFriendlyPlace.findUnique({
      where: { id },
    });
    if (!place) throw new NotFoundException('Dog friendly place not found');
    if (
      !options?.includeInactive &&
      place.status !== DogFriendlyPlaceStatus.active
    ) {
      throw new NotFoundException('Dog friendly place not found');
    }
    return serialize(place);
  }

  async create(
    userId: string,
    userRole: string,
    data: CreateDogFriendlyPlaceDto,
  ) {
    const isAdmin = userRole === 'admin';
    const status = isAdmin
      ? (data.status ?? DogFriendlyPlaceStatus.active)
      : DogFriendlyPlaceStatus.need_review;

    const osmId =
      BigInt(Date.now()) * 1000n + BigInt(Math.floor(Math.random() * 1000));

    const place = await this.prisma.dogFriendlyPlace.create({
      data: {
        osmType: 'user',
        osmId,
        latitude: data.latitude,
        longitude: data.longitude,
        geohash: encodeGeohash(data.latitude, data.longitude),
        category: data.category,
        status,
        name: data.name,
        dogPolicy: data.dogPolicy,
        city: data.city,
        postcode: data.postcode,
        street: data.street,
        phone: data.phone,
        email: data.email,
        website: data.website,
        openingHours: data.openingHours,
        description: data.description,
        source: isAdmin ? 'admin' : 'user_submission',
        createdById: userId,
      },
    });

    return serialize(place);
  }

  async update(id: string, data: UpdateDogFriendlyPlaceDto) {
    await this.getById(id, { includeInactive: true });

    const updateData: Prisma.DogFriendlyPlaceUpdateInput = {
      ...(data.category !== undefined ? { category: data.category } : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.dogPolicy !== undefined ? { dogPolicy: data.dogPolicy } : {}),
      ...(data.city !== undefined ? { city: data.city } : {}),
      ...(data.postcode !== undefined ? { postcode: data.postcode } : {}),
      ...(data.street !== undefined ? { street: data.street } : {}),
      ...(data.phone !== undefined ? { phone: data.phone } : {}),
      ...(data.email !== undefined ? { email: data.email } : {}),
      ...(data.website !== undefined ? { website: data.website } : {}),
      ...(data.openingHours !== undefined
        ? { openingHours: data.openingHours }
        : {}),
      ...(data.description !== undefined
        ? { description: data.description }
        : {}),
    };

    if (data.latitude !== undefined && data.longitude !== undefined) {
      updateData.latitude = data.latitude;
      updateData.longitude = data.longitude;
      updateData.geohash = encodeGeohash(data.latitude, data.longitude);
    }

    const place = await this.prisma.dogFriendlyPlace.update({
      where: { id },
      data: updateData,
    });

    return serialize(place);
  }

  async delete(id: string) {
    await this.getById(id, { includeInactive: true });
    await this.prisma.dogFriendlyPlace.delete({ where: { id } });
  }

  assertAdmin(role: string) {
    if (role !== 'admin') {
      throw new ForbiddenException('Insufficient permissions');
    }
  }

  private matchesSearchTerm(
    place: {
      name: string | null;
      street: string | null;
      city: string | null;
      postcode: string | null;
    },
    searchTerm: string,
  ): boolean {
    const haystack = [place.name, place.street, place.city, place.postcode]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return haystack.includes(searchTerm);
  }

  private sortByGeohashProximity<
    T extends { geohash: string; name: string | null; createdAt: Date },
  >(places: T[], referenceGeohash: string): T[] {
    if (referenceGeohash.length < 3) {
      return [...places].sort((a, b) => {
        const nameDiff = (a.name ?? '').localeCompare(b.name ?? '');
        if (nameDiff !== 0) return nameDiff;
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
    }

    return [...places].sort((a, b) => {
      const proximityDiff =
        geohashCommonPrefixLength(b.geohash, referenceGeohash) -
        geohashCommonPrefixLength(a.geohash, referenceGeohash);
      if (proximityDiff !== 0) return proximityDiff;
      const nameDiff = (a.name ?? '').localeCompare(b.name ?? '');
      if (nameDiff !== 0) return nameDiff;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  }
}
