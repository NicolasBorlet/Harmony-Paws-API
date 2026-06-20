import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DogDominance, DogSex } from '@prisma/client';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class CreateDogDto {
  @ApiProperty({
    example: 'Rex',
    description: 'Nom du chien',
    maxLength: 50,
  })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiPropertyOptional({
    example: 'Très sociable, adore jouer à la balle.',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
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
  @IsInt({ each: true })
  behaviorIds?: number[];
}

export class UpdateDogDto {
  @ApiPropertyOptional({ example: 'Rex', maxLength: 50 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
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
  image?: string;
}
