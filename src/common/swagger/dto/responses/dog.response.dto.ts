import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DogDominance, DogSex } from '@prisma/client';

export class BreedResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Labrador Retriever' })
  name: string;
}

export class BehaviorResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Sociable' })
  name: string;
}

export class DogBehaviorLinkDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 2 })
  behavior_id: number;

  @ApiProperty({ type: BehaviorResponseDto })
  behavior: BehaviorResponseDto;
}

export class DogResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  owner_id: string;

  @ApiProperty({ example: 'Rex' })
  name: string;

  @ApiPropertyOptional({ example: 'Très joueur avec les autres chiens.' })
  description?: string | null;

  @ApiPropertyOptional({ enum: DogDominance, example: DogDominance.neutral })
  dominance?: DogDominance | null;

  @ApiProperty({ enum: DogSex, example: DogSex.male })
  sex: DogSex;

  @ApiProperty({ example: 3 })
  age: number;

  @ApiProperty({ example: 1 })
  breed_id: number;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440000.jpeg' })
  image?: string | null;

  @ApiProperty({ example: '2026-02-01T12:00:00.000Z' })
  created_at: string;

  @ApiProperty({ example: '2026-06-19T10:00:00.000Z' })
  updated_at: string;

  @ApiPropertyOptional({ type: BreedResponseDto })
  breed?: BreedResponseDto;

  @ApiPropertyOptional({ type: [DogBehaviorLinkDto] })
  dog_behaviors?: DogBehaviorLinkDto[];
}
