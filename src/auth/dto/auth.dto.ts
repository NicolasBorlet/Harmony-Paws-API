import { IsEmail, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    example: 'marie@example.com',
    description: 'Adresse email unique du compte',
    format: 'email',
  })
  @IsEmail()
  @MaxLength(255)
  email: string;

  @ApiProperty({
    example: 'Str0ngP@ss!',
    description:
      'Mot de passe : 10 à 128 caractères, avec au moins une lettre et un chiffre',
    minLength: 10,
    maxLength: 128,
  })
  @IsString()
  @MinLength(10)
  @MaxLength(128)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: 'password must contain at least one letter and one number',
  })
  password: string;
}

export class LoginDto {
  @ApiProperty({
    example: 'marie@example.com',
    format: 'email',
  })
  @IsEmail()
  @MaxLength(255)
  email: string;

  @ApiProperty({
    example: 'Str0ngP@ss!',
    description: 'Mot de passe du compte',
  })
  @IsString()
  @MaxLength(128)
  password: string;
}

export class RefreshTokenDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Refresh token JWT obtenu lors du login ou register',
  })
  @IsString()
  refreshToken: string;
}

export class AuthTokensDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Access token JWT à inclure dans Authorization: Bearer',
  })
  accessToken: string;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Refresh token pour renouveler la session via POST /auth/refresh',
  })
  refreshToken: string;
}
