import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

import { ADMIN_BROADCAST_TYPES } from '../../email/dto/email.dto';

export class AdminBroadcastNotificationDto {
  @ApiProperty({
    example: 'Nouvelle version Harmony Paws',
    description: 'Titre de la notification push',
    maxLength: 100,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  title: string;

  @ApiProperty({
    example: 'Découvrez les nouveautés de la version 1.2.0',
    description: 'Corps de la notification push',
    maxLength: 500,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  body: string;

  @ApiProperty({
    enum: ADMIN_BROADCAST_TYPES,
    example: 'app_update',
    description: 'Type de campagne (métadonnées)',
  })
  @IsIn(ADMIN_BROADCAST_TYPES)
  campaignType: (typeof ADMIN_BROADCAST_TYPES)[number];

  @ApiProperty({
    example: '2026-07-07-app-update-v1.2.0',
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
      'Destinataires explicites. Si absent, envoi à tous les utilisateurs avec notifications push activées.',
    maxItems: 5000,
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5000)
  @IsUUID('4', { each: true })
  userIds?: string[];

  @ApiPropertyOptional({
    description: 'Données additionnelles transmises à l\'app mobile',
    example: { screen: 'settings' },
  })
  @IsOptional()
  @IsObject()
  data?: Record<string, string>;
}

export class AdminBroadcastNotificationResponseDto {
  @ApiProperty({ example: 142 })
  sentCount: number;

  @ApiProperty({ example: 3 })
  ticketCount: number;
}
