import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { serialize } from '../common/utils/serialize';
import { UpdateProfileDto } from './dto/users.dto';

function normalizeLocale(locale: string): 'fr' | 'en' {
  return locale.toLowerCase().startsWith('en') ? 'en' : 'fr';
}

const PREFERENCE_FIELDS = [
  'pushNotifications',
  'emailNotifications',
  'rideNotifications',
  'messageNotifications',
  'publicProfile',
  'shareLocation',
  'analytics',
] as const;

type PreferenceField = (typeof PREFERENCE_FIELDS)[number];
type PreferenceUpdate = Partial<Record<PreferenceField, boolean>>;

const DEFAULT_PREFERENCES: Record<PreferenceField, boolean> = {
  pushNotifications: true,
  emailNotifications: true,
  rideNotifications: true,
  messageNotifications: true,
  publicProfile: true,
  shareLocation: true,
  analytics: true,
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly publicProfileSelect = {
    id: true,
    firstName: true,
    lastName: true,
    age: true,
    place: true,
    description: true,
    createdAt: true,
    updatedAt: true,
  } as const;

  private readonly meInclude = {
    userStats: true,
    userPreferences: true,
  } as const;

  private extractPreferenceUpdates(data: UpdateProfileDto): PreferenceUpdate {
    const updates: PreferenceUpdate = {};
    for (const field of PREFERENCE_FIELDS) {
      if (data[field] !== undefined) {
        updates[field] = data[field];
      }
    }
    return updates;
  }

  private extractProfileData(
    data: UpdateProfileDto,
  ): Prisma.UserUpdateInput {
    const {
      pushNotifications: _pushNotifications,
      emailNotifications: _emailNotifications,
      rideNotifications: _rideNotifications,
      messageNotifications: _messageNotifications,
      publicProfile: _publicProfile,
      shareLocation: _shareLocation,
      analytics: _analytics,
      locale: _locale,
      ...profileData
    } = data;

    return profileData;
  }

  private buildPreferencesUpsert(data: UpdateProfileDto) {
    const preferenceUpdates = this.extractPreferenceUpdates(data);
    const locale =
      data.locale !== undefined ? normalizeLocale(data.locale) : undefined;
    const hasPreferenceUpdates =
      Object.keys(preferenceUpdates).length > 0 || locale !== undefined;

    if (!hasPreferenceUpdates) {
      return undefined;
    }

    return {
      upsert: {
        create: {
          ...DEFAULT_PREFERENCES,
          locale: locale ?? 'fr',
          ...preferenceUpdates,
        },
        update: {
          ...preferenceUpdates,
          ...(locale !== undefined ? { locale } : {}),
        },
      },
    };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: this.meInclude,
    });
    if (!user) throw new NotFoundException('User not found');
    const { passwordHash, refreshToken, ...rest } = user;
    return serialize(rest);
  }

  async getPublicProfile(userId: string, requesterId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        ...this.publicProfileSelect,
        userPreferences: { select: { publicProfile: true } },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    this.assertVisible(
      userId,
      requesterId,
      user.userPreferences?.publicProfile,
    );
    const { userPreferences: _userPreferences, ...rest } = user;
    return serialize(rest);
  }

  /**
   * Enforces the `publicProfile` privacy preference. A user can always see their
   * own profile; otherwise a profile marked non-public is hidden. We throw 404
   * (not 403) so the endpoint does not reveal that the account exists.
   */
  async assertProfileVisible(userId: string, requesterId: string) {
    if (userId === requesterId) return;
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { userPreferences: { select: { publicProfile: true } } },
    });
    if (!user) throw new NotFoundException('User not found');
    this.assertVisible(
      userId,
      requesterId,
      user.userPreferences?.publicProfile,
    );
  }

  private assertVisible(
    userId: string,
    requesterId: string,
    publicProfile: boolean | undefined,
  ) {
    // Missing preferences default to public (see DEFAULT_PREFERENCES).
    if (userId !== requesterId && publicProfile === false) {
      throw new NotFoundException('User not found');
    }
  }

  async updateProfile(userId: string, data: UpdateProfileDto) {
    const profileData = this.extractProfileData(data);
    const userPreferences = this.buildPreferencesUpsert(data);

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...profileData,
        ...(userPreferences && { userPreferences }),
      },
      include: this.meInclude,
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
