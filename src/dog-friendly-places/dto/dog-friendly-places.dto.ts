import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  DogFriendlyCategory,
  DogFriendlyPlaceStatus,
  DogPolicy,
} from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class ListDogFriendlyPlacesQueryDto {
  @ApiPropertyOptional({
    default: 0,
    minimum: 0,
    description: 'Index de page (0-based)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  page?: number = 0;

  @ApiPropertyOptional({
    default: 20,
    minimum: 1,
    maximum: 50,
    description: 'Nombre de lieux par page',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 20;

  @ApiPropertyOptional({
    example: 'u09tvw',
    description: 'Geohash de référence pour trier par proximité',
  })
  @IsOptional()
  @IsString()
  geohash?: string;

  @ApiPropertyOptional({ enum: DogFriendlyCategory })
  @IsOptional()
  @IsEnum(DogFriendlyCategory)
  category?: DogFriendlyCategory;

  @ApiPropertyOptional({
    example: 'Parc canin',
    description:
      'Recherche textuelle sur le nom, la rue, la ville ou le code postal',
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  search?: string;
}

export class DiscoverDogFriendlyPlacesQueryDto {
  @ApiPropertyOptional({
    example: 'u09tvw',
    description:
      'Geohash de référence pour trier par proximité. Retourne toujours au plus 50 lieux actifs.',
  })
  @IsOptional()
  @IsString()
  geohash?: string;
}

export class CreateDogFriendlyPlaceDto {
  @ApiProperty({ enum: DogFriendlyCategory })
  @IsEnum(DogFriendlyCategory)
  category!: DogFriendlyCategory;

  @ApiProperty({ example: 48.8566 })
  @Type(() => Number)
  @IsLatitude()
  latitude!: number;

  @ApiProperty({ example: 2.3522 })
  @Type(() => Number)
  @IsLongitude()
  longitude!: number;

  @ApiPropertyOptional({ example: 'Parc canin des Buttes-Chaumont' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({ enum: DogPolicy })
  @IsOptional()
  @IsEnum(DogPolicy)
  dogPolicy?: DogPolicy;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(10)
  postcode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  street?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(500)
  website?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  openingHours?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({
    enum: DogFriendlyPlaceStatus,
    description: 'Réservé aux admins — les utilisateurs passent en need_review',
  })
  @IsOptional()
  @IsEnum(DogFriendlyPlaceStatus)
  status?: DogFriendlyPlaceStatus;
}

export class UpdateDogFriendlyPlaceDto {
  @ApiPropertyOptional({ enum: DogFriendlyCategory })
  @IsOptional()
  @IsEnum(DogFriendlyCategory)
  category?: DogFriendlyCategory;

  @ApiPropertyOptional({ enum: DogFriendlyPlaceStatus })
  @IsOptional()
  @IsEnum(DogFriendlyPlaceStatus)
  status?: DogFriendlyPlaceStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsLatitude()
  latitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsLongitude()
  longitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({ enum: DogPolicy })
  @IsOptional()
  @IsEnum(DogPolicy)
  dogPolicy?: DogPolicy;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(10)
  postcode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  street?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(500)
  website?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  openingHours?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}

export class AdminListDogFriendlyPlacesQueryDto extends ListDogFriendlyPlacesQueryDto {
  @ApiPropertyOptional({ enum: DogFriendlyPlaceStatus })
  @IsOptional()
  @IsEnum(DogFriendlyPlaceStatus)
  status?: DogFriendlyPlaceStatus;
}
