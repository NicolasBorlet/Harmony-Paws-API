import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    example: 'marie@example.com',
    description: 'Adresse email unique du compte',
    format: 'email',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'Str0ngP@ss!',
    description: 'Mot de passe (minimum 6 caractères)',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password: string;
}

export class LoginDto {
  @ApiProperty({
    example: 'marie@example.com',
    format: 'email',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'Str0ngP@ss!',
    description: 'Mot de passe du compte',
  })
  @IsString()
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
