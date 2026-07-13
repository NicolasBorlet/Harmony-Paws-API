import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class GoogleOAuthDto {
  @ApiProperty({
    example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6Ij...',
    description: 'ID token obtenu via Google Sign-In natif',
  })
  @IsString()
  @IsNotEmpty()
  idToken: string;
}

export class AppleOAuthDto {
  @ApiProperty({
    example: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Identity token obtenu via Sign in with Apple',
  })
  @IsString()
  @IsNotEmpty()
  identityToken: string;

  @ApiPropertyOptional({
    example: 'Marie',
    description:
      'Prénom fourni par Apple uniquement lors de la première connexion',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  firstName?: string;

  @ApiPropertyOptional({
    example: 'Dupont',
    description:
      'Nom fourni par Apple uniquement lors de la première connexion',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  lastName?: string;
}
