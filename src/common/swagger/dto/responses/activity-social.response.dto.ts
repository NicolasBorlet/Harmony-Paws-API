import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ActivityInvitationStatus,
  ActivityStatus,
  ActivityType,
  ActivityVisibility,
  FriendRequestStatus,
} from '@prisma/client';

export class ActivityResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  creator_id: string;

  @ApiPropertyOptional({ example: 'Bois de Vincennes' })
  place?: string | null;

  @ApiProperty({ enum: ActivityVisibility, example: ActivityVisibility.public })
  visibility: ActivityVisibility;

  @ApiProperty({ enum: ActivityType, example: ActivityType.forest })
  type: ActivityType;

  @ApiProperty({ example: '2026-06-20T09:00:00.000Z' })
  date: string;

  @ApiPropertyOptional({ example: '1h30' })
  duration?: string | null;

  @ApiProperty({ enum: ActivityStatus, example: ActivityStatus.not_started })
  status: ActivityStatus;

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

  @ApiPropertyOptional({ example: '2026-06-20T09:05:00.000Z' })
  started_at?: string | null;

  @ApiPropertyOptional({ example: '2026-06-20T10:35:00.000Z' })
  ended_at?: string | null;

  @ApiPropertyOptional({
    example: { is_active: false, started_by: null, participants_ready: [] },
  })
  current_state?: Record<string, unknown> | null;

  @ApiProperty({ example: '2026-06-19T08:00:00.000Z' })
  created_at: string;

  @ApiProperty({ example: '2026-06-19T10:00:00.000Z' })
  updated_at: string;
}

export class ActivityInvitationResponseDto {
  @ApiProperty({ example: '1', description: 'Identifiant BigInt sérialisé' })
  id: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  sender_id: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440002' })
  receiver_id: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  activity_id: string;

  @ApiProperty({ enum: ActivityInvitationStatus, example: ActivityInvitationStatus.pending })
  status: ActivityInvitationStatus;

  @ApiProperty({ example: '2026-06-19T08:00:00.000Z' })
  created_at: string;

  @ApiPropertyOptional({ type: ActivityResponseDto })
  activity?: ActivityResponseDto;
}

export class ActivityStatsResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440001' })
  activity_id?: string | null;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440002' })
  user_id: string;

  @ApiPropertyOptional({ example: 5.2 })
  distance_km?: number;

  @ApiPropertyOptional({ example: 90 })
  duration_minutes?: number;

  @ApiPropertyOptional({ example: true })
  is_completed?: boolean;

  @ApiPropertyOptional({
    description: 'Points GPS [{ lat, lng, timestamp }, …]',
    example: [{ lat: 48.832, lng: 2.432, timestamp: '2026-06-20T09:10:00.000Z' }],
  })
  route_points?: unknown;
}

export class FriendRequestResponseDto {
  @ApiProperty({ example: '1' })
  id: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  sender_id: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440002' })
  recipient_id: string;

  @ApiProperty({ enum: FriendRequestStatus, example: FriendRequestStatus.pending })
  status: FriendRequestStatus;

  @ApiProperty({ example: '2026-06-19T08:00:00.000Z' })
  created_at: string;
}

export class FriendshipResponseDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  user_id: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440002' })
  friend_id: string;

  @ApiProperty({ example: 'accepted' })
  status: string;

  @ApiProperty({ example: '2026-06-19T08:00:00.000Z' })
  created_at: string;
}

export class UserMeetingResponseDto {
  @ApiProperty({ example: '1' })
  id: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440001' })
  user_id: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440002' })
  met_user_id: string;

  @ApiPropertyOptional({ example: '550e8400-e29b-41d4-a716-446655440000' })
  activity_id?: string | null;

  @ApiProperty({ example: '2026-06-19T08:00:00.000Z' })
  created_at: string;
}
