import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserStatsEmbeddedDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiPropertyOptional({ example: 42.5 })
  total_distance_km?: number;

  @ApiPropertyOptional({ example: 15 })
  total_activities?: number;

  @ApiPropertyOptional({ example: 1200 })
  total_duration_minutes?: number;

  @ApiPropertyOptional({ example: 3 })
  current_streak?: number;

  @ApiPropertyOptional({ example: 10 })
  longest_streak?: number;
}

export class UserPreferencesEmbeddedDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: true })
  push_notifications: boolean;

  @ApiProperty({ example: true })
  email_notifications: boolean;

  @ApiProperty({ example: true })
  ride_notifications: boolean;

  @ApiProperty({ example: true })
  message_notifications: boolean;

  @ApiProperty({ example: true })
  public_profile: boolean;

  @ApiProperty({ example: true })
  share_location: boolean;

  @ApiProperty({ example: true })
  analytics: boolean;

  @ApiProperty({ example: 'fr', enum: ['fr', 'en'] })
  locale: string;

  @ApiProperty({ example: '2026-01-15T08:00:00.000Z' })
  created_at: string;

  @ApiProperty({ example: '2026-06-19T10:00:00.000Z' })
  updated_at: string;
}

export class UserProfileResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'marie@example.com' })
  email: string;

  @ApiProperty({ example: 1 })
  role_id: number;

  @ApiPropertyOptional({ example: 'Marie' })
  first_name?: string | null;

  @ApiPropertyOptional({ example: 'Dupont' })
  last_name?: string | null;

  @ApiPropertyOptional({ example: 28 })
  age?: number | null;

  @ApiPropertyOptional({ example: 'Paris' })
  place?: string | null;

  @ApiPropertyOptional({ example: 'Passionnée de randonnée avec mon labrador.' })
  description?: string | null;

  @ApiProperty({ example: false })
  on_boarding: boolean;

  @ApiProperty({ example: false, description: 'Abonnement premium actif' })
  is_premium: boolean;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Identifiant RevenueCat (app_user_id)',
  })
  customer_id?: string | null;

  @ApiPropertyOptional({ example: 'ExponentPushToken[xxx]' })
  expo_push_token?: string | null;

  @ApiProperty({ example: '2026-01-15T08:00:00.000Z' })
  created_at: string;

  @ApiProperty({ example: '2026-06-19T10:00:00.000Z' })
  updated_at: string;

  @ApiPropertyOptional({ type: UserStatsEmbeddedDto })
  user_stats?: UserStatsEmbeddedDto | null;

  @ApiPropertyOptional({ type: UserPreferencesEmbeddedDto })
  user_preferences?: UserPreferencesEmbeddedDto | null;
}

export class UserPublicProfileResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiPropertyOptional({ example: 'Marie' })
  first_name?: string | null;

  @ApiPropertyOptional({ example: 'Dupont' })
  last_name?: string | null;

  @ApiPropertyOptional({ example: 28 })
  age?: number | null;

  @ApiPropertyOptional({ example: 'Paris' })
  place?: string | null;

  @ApiPropertyOptional({ example: 'Passionnée de randonnée avec mon labrador.' })
  description?: string | null;

  @ApiProperty({ example: '2026-01-15T08:00:00.000Z' })
  created_at: string;

  @ApiProperty({ example: '2026-06-19T10:00:00.000Z' })
  updated_at: string;
}

export class UserSearchResultDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: 'marie@example.com' })
  email: string;

  @ApiPropertyOptional({ example: 'Marie' })
  first_name?: string | null;

  @ApiPropertyOptional({ example: 'Dupont' })
  last_name?: string | null;

  @ApiPropertyOptional({ example: 'Lyon' })
  place?: string | null;
}
