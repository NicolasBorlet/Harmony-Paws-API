import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class ReportMessageDto {
  @ApiProperty({
    example: 'Le GPS s\'est figé pendant la balade.',
    description: 'Description du signalement ou du message',
    maxLength: 4000,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  message: string;
}

export class RideBugReportDto extends ReportMessageDto {
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Activité en cours lors du bug',
  })
  @IsOptional()
  @IsUUID()
  activityId?: string;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Balade associée',
  })
  @IsOptional()
  @IsUUID()
  rideId?: string;

  @ApiPropertyOptional({
    example: 'iOS 18.2 / iPhone 15',
    description: 'Informations appareil (optionnel)',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  deviceInfo?: string;

  @ApiPropertyOptional({
    example: '1.0.0',
    description: 'Version de l\'application mobile',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  appVersion?: string;
}

export class UserReportDto extends ReportMessageDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Utilisateur signalé',
  })
  @IsUUID()
  reportedUserId: string;
}

export class DogReportDto extends ReportMessageDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Chien signalé',
  })
  @IsUUID()
  reportedDogId: string;
}

export class ContactReportDto extends ReportMessageDto {
  @ApiPropertyOptional({
    example: 'Question sur mon abonnement',
    description: 'Sujet du message (optionnel)',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  subject?: string;
}

export const ADMIN_BROADCAST_TYPES = [
  'app_update',
  'promo',
  'custom',
] as const;
export type AdminBroadcastType = (typeof ADMIN_BROADCAST_TYPES)[number];

export class AdminBroadcastEmailDto {
  @ApiProperty({
    example: 'Nouvelle version Harmony Paws disponible',
    description: 'Sujet de l\'email (personnalisable depuis l\'admin)',
    maxLength: 200,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  subject: string;

  @ApiProperty({
    description: 'Corps HTML de l\'email (personnalisable depuis l\'admin)',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100_000)
  html: string;

  @ApiPropertyOptional({
    description: 'Version texte brut (fallback clients mail)',
    maxLength: 50_000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50_000)
  text?: string;

  @ApiProperty({
    enum: ADMIN_BROADCAST_TYPES,
    example: 'app_update',
    description: 'Type de campagne (métadonnées / idempotence)',
  })
  @IsIn(ADMIN_BROADCAST_TYPES)
  campaignType: AdminBroadcastType;

  @ApiProperty({
    example: '2026-07-05-app-update-v1.2.0',
    description: 'Identifiant unique de campagne fourni par l\'admin',
    maxLength: 128,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  campaignId: string;

  @ApiPropertyOptional({
    type: [String],
    description:
      'Destinataires explicites. Si absent, envoi à tous les utilisateurs avec notifications email activées.',
    maxItems: 5000,
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5000)
  @IsUUID('4', { each: true })
  userIds?: string[];
}

export class EmailSentResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  emailId: string;
}

export class AdminBroadcastResponseDto {
  @ApiProperty({ example: 142 })
  sentCount: number;

  @ApiProperty({
    type: [String],
    example: ['a1b2c3d4-e5f6-7890-abcd-ef1234567890'],
  })
  emailIds: string[];
}
