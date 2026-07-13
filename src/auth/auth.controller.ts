import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import {
  AuthTokensDto,
  LoginDto,
  RefreshTokenDto,
  RegisterDto,
} from './dto/auth.dto';
import { AppleOAuthDto, GoogleOAuthDto } from './dto/oauth.dto';
import { OAuthAuthService } from './oauth/oauth-auth.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import {
  ApiJwtAuth,
  ApiStandardResponses,
} from '../common/swagger/decorators/api-common.decorator';
import { ApiErrorResponseDto } from '../common/swagger/dto/api-error.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly oauthAuthService: OAuthAuthService,
  ) {}

  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Créer un compte',
    description:
      'Inscrit un nouvel utilisateur avec email et mot de passe. Retourne une paire de tokens JWT. Limité à **5 requêtes/minute** par IP.',
  })
  @ApiCreatedResponse({
    description: 'Compte créé — tokens JWT émis',
    type: AuthTokensDto,
  })
  @ApiConflictResponse({
    description: 'Email déjà utilisé',
    type: ApiErrorResponseDto,
  })
  @ApiTooManyRequestsResponse({
    description: 'Trop de tentatives d\'inscription',
    type: ApiErrorResponseDto,
  })
  @ApiStandardResponses({ tooManyRequests: true })
  register(@Body() dto: RegisterDto): Promise<AuthTokensDto> {
    return this.authService.register(dto);
  }

  @Post('login')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Se connecter',
    description:
      'Authentifie un utilisateur existant. Limité à **10 requêtes/minute** par IP.',
  })
  @ApiOkResponse({
    description: 'Authentification réussie',
    type: AuthTokensDto,
  })
  @ApiStandardResponses({ unauthorized: true, tooManyRequests: true })
  login(@Body() dto: LoginDto): Promise<AuthTokensDto> {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Renouveler les tokens',
    description:
      'Émet une nouvelle paire access/refresh token à partir d\'un refresh token valide. Limité à **20 requêtes/minute**.',
  })
  @ApiOkResponse({
    description: 'Tokens renouvelés',
    type: AuthTokensDto,
  })
  @ApiStandardResponses({ unauthorized: true, tooManyRequests: true })
  refresh(@Body() dto: RefreshTokenDto): Promise<AuthTokensDto> {
    return this.authService.refresh(dto.refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiJwtAuth()
  @ApiOperation({
    summary: 'Se déconnecter',
    description:
      'Invalide le refresh token côté serveur. L\'access token reste valide jusqu\'à expiration naturelle.',
  })
  @ApiNoContentResponse({ description: 'Session invalidée' })
  @ApiStandardResponses({ unauthorized: true })
  logout(@CurrentUser() user: AuthUser): Promise<void> {
    return this.authService.logout(user.id);
  }

  @Post('oauth/google')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Se connecter avec Google',
    description:
      'Vérifie un ID token Google Sign-In natif et émet une paire JWT. Limité à **10 requêtes/minute**.',
  })
  @ApiOkResponse({
    description: 'Authentification Google réussie',
    type: AuthTokensDto,
  })
  @ApiConflictResponse({
    description: 'Conflit de liaison de compte',
    type: ApiErrorResponseDto,
  })
  @ApiStandardResponses({ unauthorized: true, tooManyRequests: true })
  signInWithGoogle(@Body() dto: GoogleOAuthDto): Promise<AuthTokensDto> {
    return this.oauthAuthService.signInWithGoogle(dto.idToken);
  }

  @Post('oauth/apple')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({
    summary: 'Se connecter avec Apple',
    description:
      'Vérifie un identity token Sign in with Apple et émet une paire JWT. Limité à **10 requêtes/minute**.',
  })
  @ApiOkResponse({
    description: 'Authentification Apple réussie',
    type: AuthTokensDto,
  })
  @ApiConflictResponse({
    description: 'Conflit de liaison de compte',
    type: ApiErrorResponseDto,
  })
  @ApiStandardResponses({ unauthorized: true, tooManyRequests: true })
  signInWithApple(@Body() dto: AppleOAuthDto): Promise<AuthTokensDto> {
    return this.oauthAuthService.signInWithApple(dto.identityToken, {
      firstName: dto.firstName,
      lastName: dto.lastName,
    });
  }
}
