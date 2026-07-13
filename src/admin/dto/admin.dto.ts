import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DogDominance, DogSex } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export const ADMIN_TABLES = ['breeds', 'dogs', 'users', 'behavior'] as const;
export type AdminTableName = (typeof ADMIN_TABLES)[number];

export class AdminTableQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 25, minimum: 1, maximum: 500 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  limit?: number = 25;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'asc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  direction?: 'asc' | 'desc' = 'asc';
}

export class AdminCreateRowDto {
  @ApiProperty({ description: 'Données à insérer' })
  @IsObject()
  data: Record<string, unknown>;
}

export class AdminCreateDogDataDto {
  @ApiProperty()
  @IsUUID()
  ownerId: string;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  breedId: number;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  name: string;

  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(60)
  age: number;

  @ApiProperty({ enum: DogSex })
  @IsEnum(DogSex)
  sex: DogSex;

  @ApiPropertyOptional({ enum: DogDominance })
  @IsOptional()
  @IsEnum(DogDominance)
  dominance?: DogDominance;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;

  @ApiPropertyOptional({ type: [Number] })
  @IsOptional()
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  behaviorIds?: number[];
}

export class AdminCreateBreedDataDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  name: string;
}

export class AdminCreateBehaviorDataDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  name: string;
}

export class AdminUpdateUserDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(150)
  age?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  place?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

export class AdminUpdateDogDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(60)
  age?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;

  @ApiPropertyOptional({ enum: DogSex })
  @IsOptional()
  @IsEnum(DogSex)
  sex?: DogSex;

  @ApiPropertyOptional({ enum: DogDominance })
  @IsOptional()
  @IsEnum(DogDominance)
  dominance?: DogDominance;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  breedId?: number;
}

export class AdminUpdateBreedDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  name: string;
}

export class AdminUpdateBehaviorDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  name: string;
}

export class AdminPaginatedResponseDto {
  @ApiProperty({ type: 'array', items: { type: 'object' } })
  data: Record<string, unknown>[];

  @ApiProperty()
  total: number;
}

export class AdminStatsResponseDto {
  @ApiProperty()
  users: number;

  @ApiProperty()
  dogs: number;

  @ApiProperty()
  breeds: number;

  @ApiProperty()
  behaviors: number;

  @ApiProperty()
  rides: number;

  @ApiProperty()
  places: number;
}
