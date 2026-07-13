import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ActivityStatus,
  ActivityStyle,
  ActivityType,
  ActivityVisibility,
} from '@prisma/client';
import {
  IsArray,
  ArrayMinSize,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateActivityStepDto {
  @ApiProperty({
    example: 'Refuge de la Combe',
    description: 'Nom du point de passage',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  place: string;

  @ApiPropertyOptional({ example: 45.832, description: 'Latitude du point' })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ example: 6.432, description: 'Longitude du point' })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiProperty({
    example: '2026-06-20T10:30:00.000Z',
    description: 'Heure estimée d\'arrivée à ce point',
  })
  @IsString()
  @MaxLength(40)
  estimatedHour: string;

  @ApiProperty({ example: 0, description: 'Ordre dans le parcours (0 = départ)' })
  @IsInt()
  @Min(0)
  sortOrder: number;
}

export class ActivityDogIdsDto {
  @ApiProperty({
    type: [String],
    example: ['550e8400-e29b-41d4-a716-446655440010'],
    description: 'UUIDs des chiens du participant (au moins un requis)',
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  dogIds: string[];
}

export class CreateActivityDto {
  @ApiPropertyOptional({
    example: 'Bois de Vincennes',
    description: 'Lieu ou nom du parcours',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  place?: string;

  @ApiPropertyOptional({
    example: 'Lyon',
    description: 'Ville affichée sur les cartes de balade',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({
    example: 'Parc de la Tête d\'Or, 69006 Lyon',
    description: 'Adresse précise du lieu de départ',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  address?: string;

  @ApiProperty({
    enum: ActivityVisibility,
    example: ActivityVisibility.public,
    description: 'Visibilité : privée (invitation) ou publique (découverte)',
  })
  @IsEnum(ActivityVisibility)
  visibility: ActivityVisibility;

  @ApiProperty({
    enum: ActivityType,
    example: ActivityType.forest,
    description: 'Type d\'environnement de la balade',
  })
  @IsEnum(ActivityType)
  type: ActivityType;

  @ApiPropertyOptional({
    enum: ActivityStyle,
    example: ActivityStyle.casual,
    description: 'Style de balade : simple ou randonnée avec étapes',
  })
  @IsOptional()
  @IsEnum(ActivityStyle)
  style?: ActivityStyle;

  @ApiPropertyOptional({
    example: 3,
    description: 'Difficulté de la randonnée (1 = facile, 5 = difficile)',
    minimum: 1,
    maximum: 5,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  difficulty?: number;

  @ApiProperty({
    example: '2026-06-20T09:00:00.000Z',
    description: 'Date et heure planifiées de la balade',
  })
  @IsString()
  @MaxLength(40)
  date: string;

  @ApiPropertyOptional({
    example: '1h30',
    description: 'Durée estimée (texte libre)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  duration?: string;

  @ApiPropertyOptional({
    example: 6,
    description: 'Nombre maximum de participants',
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  participantLimit?: number;

  @ApiPropertyOptional({
    example: '48.832778',
    description: 'Latitude du point de rendez-vous',
  })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  latitude?: string;

  @ApiPropertyOptional({
    example: '2.432222',
    description: 'Longitude du point de rendez-vous',
  })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  longitude?: string;

  @ApiPropertyOptional({ example: '75', description: 'Code département' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  department?: string;

  @ApiPropertyOptional({ example: 'FR', description: 'Code pays ISO' })
  @IsOptional()
  @IsString()
  @MaxLength(56)
  country?: string;

  @ApiPropertyOptional({
    example: 'u09tvw0',
    description: 'Geohash pour la découverte locale (GET /activities/discover)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(12)
  geohash?: string;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440099',
    description: 'UUID de la ride template clonée (traçabilité)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  sourceRideId?: string;

  @ApiPropertyOptional({
    type: [CreateActivityStepDto],
    description: 'Étapes du parcours (requis pour style hike)',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateActivityStepDto)
  steps?: CreateActivityStepDto[];

  @ApiProperty({
    type: [String],
    example: ['550e8400-e29b-41d4-a716-446655440010'],
    description: 'Chiens du créateur participant à la balade (au moins un requis)',
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  dogIds: string[];
}

export class UpdateActivityDto {
  @ApiPropertyOptional({
    example: 'Bois de Vincennes',
    description: 'Lieu ou nom du parcours',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  place?: string;

  @ApiPropertyOptional({
    example: 'Lyon',
    description: 'Ville affichée sur les cartes de balade',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({
    example: 'Parc de la Tête d\'Or, 69006 Lyon',
    description: 'Adresse précise du lieu de départ',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  address?: string;

  @ApiPropertyOptional({
    enum: ActivityVisibility,
    example: ActivityVisibility.public,
    description: 'Visibilité : privée (invitation) ou publique (découverte)',
  })
  @IsOptional()
  @IsEnum(ActivityVisibility)
  visibility?: ActivityVisibility;

  @ApiPropertyOptional({
    enum: ActivityType,
    example: ActivityType.forest,
    description: 'Type d\'environnement de la balade',
  })
  @IsOptional()
  @IsEnum(ActivityType)
  type?: ActivityType;

  @ApiPropertyOptional({
    enum: ActivityStyle,
    example: ActivityStyle.casual,
    description: 'Style de balade : simple ou randonnée avec étapes',
  })
  @IsOptional()
  @IsEnum(ActivityStyle)
  style?: ActivityStyle;

  @ApiPropertyOptional({
    example: 3,
    description: 'Difficulté de la randonnée (1 = facile, 5 = difficile)',
    minimum: 1,
    maximum: 5,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  difficulty?: number;

  @ApiPropertyOptional({
    example: '2026-06-20T09:00:00.000Z',
    description: 'Date et heure planifiées de la balade',
  })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  date?: string;

  @ApiPropertyOptional({
    example: '1h30',
    description: 'Durée estimée (texte libre ou minutes)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  duration?: string;

  @ApiPropertyOptional({
    example: 6,
    description: 'Nombre maximum de participants',
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  participantLimit?: number;

  @ApiPropertyOptional({
    example: '48.832778',
    description: 'Latitude du point de rendez-vous',
  })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  latitude?: string;

  @ApiPropertyOptional({
    example: '2.432222',
    description: 'Longitude du point de rendez-vous',
  })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  longitude?: string;

  @ApiPropertyOptional({ example: '75', description: 'Code département' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  department?: string;

  @ApiPropertyOptional({ example: 'FR', description: 'Code pays ISO' })
  @IsOptional()
  @IsString()
  @MaxLength(56)
  country?: string;

  @ApiPropertyOptional({
    example: 'u09tvw0',
    description: 'Geohash pour la découverte locale',
  })
  @IsOptional()
  @IsString()
  @MaxLength(12)
  geohash?: string;

  @ApiPropertyOptional({
    type: [CreateActivityStepDto],
    description: 'Étapes du parcours (remplace les étapes existantes)',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateActivityStepDto)
  steps?: CreateActivityStepDto[];
}

export class CreateInvitationDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440002',
    description: 'UUID de l\'utilisateur invité',
    format: 'uuid',
  })
  @IsUUID()
  receiverId: string;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'UUID de l\'activité',
    format: 'uuid',
  })
  @IsUUID()
  activityId: string;
}

export class UpdateActivityStatusDto {
  @ApiProperty({
    enum: ActivityStatus,
    example: ActivityStatus.in_progress,
    description: 'Nouveau statut de la balade',
  })
  @IsEnum(ActivityStatus)
  status: ActivityStatus;

  @ApiPropertyOptional({
    example: '2026-06-20T09:05:00.000Z',
    description: 'Horodatage réel de démarrage',
  })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  startedAt?: string;

  @ApiPropertyOptional({
    example: '2026-06-20T10:35:00.000Z',
    description: 'Horodatage réel de fin',
  })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  endedAt?: string;

  @ApiPropertyOptional({
    example: {
      is_active: true,
      started_by: '550e8400-e29b-41d4-a716-446655440001',
      participants_ready: ['550e8400-e29b-41d4-a716-446655440002'],
    },
    description: 'État temps réel synchronisé entre participants',
  })
  @IsOptional()
  @IsObject()
  currentState?: Record<string, unknown>;
}

export class SaveActivityStatsDto {
  @ApiPropertyOptional({
    example: 5.2,
    description: 'Distance parcourue en kilomètres',
  })
  @IsOptional()
  @IsNumber()
  distanceKm?: number;

  @ApiPropertyOptional({
    example: 90,
    description: 'Durée totale en minutes',
  })
  @IsOptional()
  @IsInt()
  durationMinutes?: number;

  @ApiPropertyOptional({ example: '2026-06-20T09:05:00.000Z' })
  @IsOptional()
  @IsString()
  actualStartTime?: string;

  @ApiPropertyOptional({ example: '2026-06-20T10:35:00.000Z' })
  @IsOptional()
  @IsString()
  actualEndTime?: string;

  @ApiPropertyOptional({
    description: 'Trace GPS : tableau de points { lat, lng, timestamp }',
    example: [
      { lat: 48.832, lng: 2.432, timestamp: '2026-06-20T09:10:00.000Z' },
    ],
  })
  @IsOptional()
  routePoints?: unknown;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isCompleted?: boolean;

  @ApiPropertyOptional({ example: 8500 })
  @IsOptional()
  @IsInt()
  stepsCount?: number;

  @ApiPropertyOptional({ example: 320 })
  @IsOptional()
  @IsInt()
  caloriesBurned?: number;
}

export class SaveLivePushTokenDto {
  @ApiProperty({
    example: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]',
    description: 'Token push pour recevoir les mises à jour live de la balade',
  })
  @IsString()
  @MaxLength(255)
  @Matches(/^(ExponentPushToken|ExpoPushToken)\[[A-Za-z0-9_-]+\]$/, {
    message: 'pushToken must be a valid Expo push token',
  })
  pushToken: string;
}

export class JoinActivityDto extends ActivityDogIdsDto {}

export class AcceptInvitationDto extends ActivityDogIdsDto {}

export class UpdateActivityDogsDto extends ActivityDogIdsDto {}
