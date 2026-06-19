import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ActivityStatus,
  ActivityType,
  ActivityVisibility,
} from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateActivityDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  place?: string;

  @ApiProperty({ enum: ActivityVisibility })
  @IsEnum(ActivityVisibility)
  visibility: ActivityVisibility;

  @ApiProperty({ enum: ActivityType })
  @IsEnum(ActivityType)
  type: ActivityType;

  @ApiProperty()
  @IsString()
  date: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  duration?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  participantLimit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  latitude?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  longitude?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  department?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  geohash?: string;
}

export class CreateInvitationDto {
  @ApiProperty()
  @IsUUID()
  receiverId: string;

  @ApiProperty()
  @IsUUID()
  activityId: string;
}

export class UpdateActivityStatusDto {
  @ApiProperty({ enum: ActivityStatus })
  @IsEnum(ActivityStatus)
  status: ActivityStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  startedAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  endedAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  currentState?: Record<string, unknown>;
}

export class SaveActivityStatsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  distanceKm?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  durationMinutes?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  actualStartTime?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  actualEndTime?: string;

  @ApiPropertyOptional()
  @IsOptional()
  routePoints?: unknown;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isCompleted?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  stepsCount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  caloriesBurned?: number;
}

export class SaveLivePushTokenDto {
  @ApiProperty()
  @IsString()
  pushToken: string;
}
