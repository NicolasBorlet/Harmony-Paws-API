import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ActivityStyle,
  ActivityType,
  ActivityVisibility,
} from '@prisma/client';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateRideStepDto {
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

  @ApiPropertyOptional({
    example: '2026-06-20T10:30:00.000Z',
    description: 'Heure estimée d\'arrivée à ce point (optionnel pour template)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  estimatedHour?: string;

  @ApiProperty({ example: 0, description: 'Ordre dans le parcours (0 = départ)' })
  @IsInt()
  @Min(0)
  sortOrder: number;
}

export class CreateRideDto {
  @ApiPropertyOptional({
    example: 'Bois de Vincennes',
    description: 'Lieu ou nom du parcours',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  place?: string;

  @ApiProperty({
    enum: ActivityVisibility,
    example: ActivityVisibility.public,
    description: 'Visibilité suggérée pour les activités clonées',
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
    example: '2026-06-20T09:00:00.000Z',
    description: 'Date suggérée (optionnelle — l\'utilisateur choisit lors du clonage)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  date?: string;

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
    description: 'Nombre maximum de participants suggéré',
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
    type: [CreateRideStepDto],
    description: 'Étapes du parcours (requis pour style hike)',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRideStepDto)
  steps?: CreateRideStepDto[];
}

export class UpdateRideDto {
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
    enum: ActivityVisibility,
    example: ActivityVisibility.public,
  })
  @IsOptional()
  @IsEnum(ActivityVisibility)
  visibility?: ActivityVisibility;

  @ApiPropertyOptional({
    enum: ActivityType,
    example: ActivityType.forest,
  })
  @IsOptional()
  @IsEnum(ActivityType)
  type?: ActivityType;

  @ApiPropertyOptional({
    enum: ActivityStyle,
    example: ActivityStyle.casual,
  })
  @IsOptional()
  @IsEnum(ActivityStyle)
  style?: ActivityStyle;

  @ApiPropertyOptional({
    example: '2026-06-20T09:00:00.000Z',
    description: 'Date suggérée (optionnelle)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  date?: string;

  @ApiPropertyOptional({ example: '1h30' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  duration?: string;

  @ApiPropertyOptional({ example: 6, minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  participantLimit?: number;

  @ApiPropertyOptional({ example: '48.832778' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  latitude?: string;

  @ApiPropertyOptional({ example: '2.432222' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  longitude?: string;

  @ApiPropertyOptional({ example: '75' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  department?: string;

  @ApiPropertyOptional({ example: 'FR' })
  @IsOptional()
  @IsString()
  @MaxLength(56)
  country?: string;

  @ApiPropertyOptional({ example: 'u09tvw0' })
  @IsOptional()
  @IsString()
  @MaxLength(12)
  geohash?: string;

  @ApiPropertyOptional({
    type: [CreateRideStepDto],
    description: 'Étapes du parcours (remplace les étapes existantes)',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateRideStepDto)
  steps?: CreateRideStepDto[];
}
