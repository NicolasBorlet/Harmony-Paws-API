import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ActivityStyle,
  ActivityType,
  ActivityVisibility,
} from '@prisma/client';

export class RideStepResponseDto {
  @ApiProperty({ example: '1' })
  id: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  ride_id: string;

  @ApiPropertyOptional({ example: 'Refuge de la Combe' })
  place?: string | null;

  @ApiPropertyOptional({ example: 45.832 })
  latitude?: number | null;

  @ApiPropertyOptional({ example: 6.432 })
  longitude?: number | null;

  @ApiPropertyOptional({ example: '2026-06-20T10:30:00.000Z' })
  estimated_hour?: string | null;

  @ApiProperty({ example: 0 })
  sort_order: number;

  @ApiProperty({ example: '2026-06-19T08:00:00.000Z' })
  created_at: string;
}

export class RideResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  creator_id: string;

  @ApiPropertyOptional({ example: 'Bois de Vincennes' })
  place?: string | null;

  @ApiPropertyOptional({ example: 'Lyon' })
  city?: string | null;

  @ApiPropertyOptional({ example: 'Parc de la Tête d\'Or, 69006 Lyon' })
  address?: string | null;

  @ApiProperty({ enum: ActivityVisibility, example: ActivityVisibility.public })
  visibility: ActivityVisibility;

  @ApiProperty({ enum: ActivityType, example: ActivityType.forest })
  type: ActivityType;

  @ApiProperty({ enum: ActivityStyle, example: ActivityStyle.casual })
  style: ActivityStyle;

  @ApiPropertyOptional({ example: '2026-06-20T09:00:00.000Z' })
  date?: string | null;

  @ApiPropertyOptional({ example: '1h30' })
  duration?: string | null;

  @ApiPropertyOptional({ example: 6 })
  participant_limit?: number | null;

  @ApiPropertyOptional({ example: '48.832' })
  latitude?: string | null;

  @ApiPropertyOptional({ example: '2.432' })
  longitude?: string | null;

  @ApiPropertyOptional({ example: '75' })
  department?: string | null;

  @ApiPropertyOptional({ example: 'FR' })
  country?: string | null;

  @ApiPropertyOptional({ example: 'u09tvw0' })
  geohash?: string | null;

  @ApiProperty({ example: '2026-06-19T08:00:00.000Z' })
  created_at: string;

  @ApiProperty({ example: '2026-06-19T10:00:00.000Z' })
  updated_at: string;

  @ApiPropertyOptional({ type: [RideStepResponseDto] })
  steps?: RideStepResponseDto[];
}
