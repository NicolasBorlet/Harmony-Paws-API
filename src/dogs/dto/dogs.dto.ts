import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DogDominance, DogSex } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MaxLength,
  MinLength,
} from 'class-validator';

export class DiscoverDogsQueryDto {
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
    default: 5,
    minimum: 1,
    maximum: 50,
    description: 'Nombre de chiens par page',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  pageSize?: number = 5;

  @ApiPropertyOptional({ enum: DogSex })
  @IsOptional()
  @IsEnum(DogSex)
  sex?: DogSex;

  @ApiPropertyOptional({ minimum: 0, maximum: 60 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(60)
  age?: number;

  @ApiPropertyOptional({ enum: DogDominance })
  @IsOptional()
  @IsEnum(DogDominance)
  dominance?: DogDominance;
}

export class CreateDogDto {
  @ApiProperty({
    example: 'Rex',
    description: 'Nom du chien',
    maxLength: 50,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  name: string;

  @ApiPropertyOptional({
    example: 'Très sociable, adore jouer à la balle.',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;

  @ApiPropertyOptional({
    enum: DogDominance,
    example: DogDominance.neutral,
    description: 'Comportement dominant lors des interactions',
  })
  @IsOptional()
  @IsEnum(DogDominance)
  dominance?: DogDominance;

  @ApiProperty({
    enum: DogSex,
    example: DogSex.male,
  })
  @IsEnum(DogSex)
  sex: DogSex;

  @ApiProperty({
    example: 3,
    description: 'Âge du chien en années',
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  @Max(60)
  age: number;

  @ApiProperty({
    example: 1,
    description: 'Identifiant de la race (GET /dogs/breeds)',
  })
  @IsInt()
  breedId: number;

  @ApiPropertyOptional({
    type: [Number],
    example: [1, 3],
    description: 'Identifiants des comportements (GET /dogs/behaviors)',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsInt({ each: true })
  behaviorIds?: number[];
}

export class UpdateDogDto {
  @ApiPropertyOptional({ example: 'Rex', maxLength: 50 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  name?: string;

  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;

  @ApiPropertyOptional({ enum: DogDominance })
  @IsOptional()
  @IsEnum(DogDominance)
  dominance?: DogDominance;

  @ApiPropertyOptional({ enum: DogSex })
  @IsOptional()
  @IsEnum(DogSex)
  sex?: DogSex;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(60)
  age?: number;

  @ApiPropertyOptional({ description: 'Nouvel identifiant de race' })
  @IsOptional()
  @IsInt()
  breedId?: number;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000.jpeg',
    description: 'Clé de l\'image après upload via POST /storage/dogs/:dogId/upload-url',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  image?: string;

  @ApiPropertyOptional({
    type: [Number],
    example: [1, 3],
    description: 'Identifiants des comportements (GET /dogs/behaviors)',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsInt({ each: true })
  behaviorIds?: number[];
}
