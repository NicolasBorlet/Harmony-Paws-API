import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FormationResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Éducation positive du chien' })
  name: string;

  @ApiProperty({ example: 'Dr. Canin' })
  animator_name: string;

  @ApiProperty({ example: 4999, description: 'Prix en centimes' })
  price: number;

  @ApiProperty({ example: 'Formation complète sur le renforcement positif.' })
  description: string;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  created_at: string;

  @ApiProperty({ example: '2026-06-19T10:00:00.000Z' })
  updated_at: string;
}

export class FormationFavoriteResponseDto {
  @ApiProperty({ example: '1' })
  id: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  user_id: string;

  @ApiProperty({ example: 1 })
  formation_id: number;

  @ApiProperty({ example: '2026-06-19T08:00:00.000Z' })
  created_at: string;

  @ApiPropertyOptional({ type: FormationResponseDto })
  formation?: FormationResponseDto;
}

export class UserStatsResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  user_id: string;

  @ApiPropertyOptional({ example: 125.5 })
  total_distance_km?: number;

  @ApiPropertyOptional({ example: 48 })
  total_activities?: number;

  @ApiPropertyOptional({ example: 3600 })
  total_duration_minutes?: number;

  @ApiPropertyOptional({ example: 5 })
  current_streak?: number;

  @ApiPropertyOptional({ example: 12 })
  longest_streak?: number;

  @ApiPropertyOptional({ example: 22.3 })
  monthly_distance_km?: number;

  @ApiPropertyOptional({ example: 8 })
  monthly_activities?: number;

  @ApiPropertyOptional({ example: 120, description: 'Total os (bones)' })
  total_points?: number;

  @ApiPropertyOptional({ example: 1200, description: 'Total XP cumulée' })
  total_experience?: number;

  @ApiPropertyOptional({ example: 3 })
  level?: number;
}

export class BadgeCategoryResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'distance' })
  code: string;

  @ApiProperty({ example: 'badge.category.distance' })
  name_key: string;

  @ApiPropertyOptional({ example: 'route' })
  icon?: string | null;

  @ApiPropertyOptional({ example: '#4CAF50' })
  color?: string | null;
}

export class BadgeResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'explorateur_10' })
  code: string;

  @ApiProperty({ example: 'badge.explorateur_10.name' })
  name_key: string;

  @ApiProperty({ example: 'badge.explorateur_10.description' })
  description_key: string;

  @ApiPropertyOptional({ example: 'explore' })
  icon?: string | null;

  @ApiProperty({ example: 25 })
  points: number;

  @ApiPropertyOptional({ example: 'total_distance_km' })
  requirement_type?: string | null;

  @ApiPropertyOptional({ example: 10 })
  requirement_value?: number | null;

  @ApiPropertyOptional({ example: 'km' })
  requirement_unit?: string | null;

  @ApiProperty({ example: false })
  is_secret: boolean;

  @ApiPropertyOptional({ example: 'common' })
  rarity?: string | null;

  @ApiPropertyOptional({ type: BadgeCategoryResponseDto })
  category?: BadgeCategoryResponseDto;
}

export class BadgeProgressResponseDto extends BadgeResponseDto {
  @ApiProperty({ example: false })
  earned: boolean;

  @ApiPropertyOptional({ example: '2026-06-19T08:00:00.000Z' })
  earned_at?: string | null;

  @ApiPropertyOptional({
    example: 6.5,
    description: 'Valeur actuelle de la métrique',
  })
  current_value?: number | null;

  @ApiPropertyOptional({ example: 10, description: 'Objectif à atteindre' })
  target_value?: number | null;

  @ApiProperty({
    example: 0.65,
    description: 'Progression normalisée entre 0 et 1',
  })
  progress: number;
}

export class UserBadgeResponseDto {
  @ApiProperty({ example: '1' })
  id: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  user_id: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  badge_id: string;

  @ApiProperty({ example: '2026-06-19T08:00:00.000Z' })
  earned_at: string;

  @ApiPropertyOptional({ type: BadgeResponseDto })
  badge?: BadgeResponseDto;
}
