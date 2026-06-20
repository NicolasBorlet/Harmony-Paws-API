import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({
    example: 'Marie',
    description: 'Prénom affiché sur le profil',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({
    example: 'Dupont',
    description: 'Nom de famille',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({
    example: 28,
    description: 'Âge du propriétaire',
    minimum: 1,
    maximum: 120,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(120)
  age?: number;

  @ApiPropertyOptional({
    example: 'Paris',
    description: 'Ville ou région',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  place?: string;

  @ApiPropertyOptional({
    example: 'Passionnée de randonnée canine en forêt.',
    description: 'Bio courte du profil',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: false,
    description: 'Indique si l\'utilisateur a terminé l\'onboarding',
  })
  @IsOptional()
  @IsBoolean()
  onBoarding?: boolean;

  @ApiPropertyOptional({
    example: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]',
    description: 'Token Expo Push Notifications pour les alertes mobile',
  })
  @IsOptional()
  @IsString()
  expoPushToken?: string;
}
