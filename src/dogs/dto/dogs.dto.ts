import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DogDominance, DogSex } from '@prisma/client';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateDogDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: DogDominance })
  @IsOptional()
  @IsEnum(DogDominance)
  dominance?: DogDominance;

  @ApiProperty({ enum: DogSex })
  @IsEnum(DogSex)
  sex: DogSex;

  @ApiProperty()
  @IsInt()
  age: number;

  @ApiProperty()
  @IsInt()
  breedId: number;

  @ApiPropertyOptional({ type: [Number] })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  behaviorIds?: number[];
}

export class UpdateDogDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @ApiPropertyOptional()
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

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  age?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  breedId?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  image?: string;
}
