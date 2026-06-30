import { Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  CurrentUser,
  AuthUser,
} from '../common/decorators/current-user.decorator';
import { StatsBadgesService } from './stats-badges.service';
import { BadgeEngineService } from './badge-engine.service';
import { PremiumService } from '../billing/premium.service';
import {
  ApiJwtAuth,
  ApiStandardResponses,
} from '../common/swagger/decorators/api-common.decorator';
import {
  BadgeCategoryResponseDto,
  BadgeProgressResponseDto,
  BadgeResponseDto,
  UserBadgeResponseDto,
  UserStatsResponseDto,
} from '../common/swagger/dto/responses/formation-stats.response.dto';

@ApiTags('stats-badges')
@Controller('stats-badges')
export class StatsBadgesController {
  constructor(
    private readonly statsBadgesService: StatsBadgesService,
    private readonly badgeEngine: BadgeEngineService,
    private readonly premiumService: PremiumService,
  ) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiJwtAuth()
  @ApiOperation({
    summary: 'Mes statistiques agrégées',
    description:
      'Distance totale, streaks, etc. Les stats précises (mensuelles et moyennes) sont réservées aux utilisateurs premium ; elles sont renvoyées à null avec un flag `locked` pour les non-premium.',
  })
  @ApiOkResponse({
    description: 'Statistiques utilisateur (null si jamais initialisées)',
    type: UserStatsResponseDto,
  })
  @ApiStandardResponses({ unauthorized: true })
  async myStats(@CurrentUser() user: AuthUser) {
    const isPremium = await this.premiumService.isPremium(user.id);
    return this.statsBadgesService.getUserStats(user.id, isPremium);
  }

  @Get('badges/me')
  @UseGuards(JwtAuthGuard)
  @ApiJwtAuth()
  @ApiOperation({
    summary: 'Mes badges obtenus',
    description: 'Badges débloqués avec détails et catégorie.',
  })
  @ApiOkResponse({ type: [UserBadgeResponseDto] })
  @ApiStandardResponses({ unauthorized: true })
  myBadges(@CurrentUser() user: AuthUser) {
    return this.statsBadgesService.listUserBadges(user.id);
  }

  @Get('categories')
  @ApiOperation({
    summary: 'Catalogue des catégories de badges',
    description:
      'Endpoint public — liste les catégories actives et leurs badges.',
  })
  @ApiOkResponse({ type: [BadgeCategoryResponseDto] })
  @ApiStandardResponses()
  categories() {
    return this.statsBadgesService.listBadgeCategories();
  }

  @Get('badges')
  @ApiOperation({
    summary: 'Catalogue plat des badges',
    description:
      'Endpoint public — tous les badges actifs et non secrets, avec leur catégorie.',
  })
  @ApiOkResponse({ type: [BadgeResponseDto] })
  @ApiStandardResponses()
  badges() {
    return this.statsBadgesService.listBadges();
  }

  @Get('badges/me/progress')
  @UseGuards(JwtAuthGuard)
  @ApiJwtAuth()
  @ApiOperation({
    summary: 'Ma progression sur les badges',
    description:
      'Pour chaque badge visible : valeur actuelle, objectif, progression (0–1) et statut obtenu.',
  })
  @ApiOkResponse({ type: [BadgeProgressResponseDto] })
  @ApiStandardResponses({ unauthorized: true })
  myProgress(@CurrentUser() user: AuthUser) {
    return this.badgeEngine.getProgress(user.id);
  }

  @Post('badges/evaluate')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @ApiJwtAuth()
  @ApiOperation({
    summary: 'Évaluer et débloquer mes badges',
    description:
      'Recalcule les métriques de l’utilisateur et débloque les badges nouvellement atteints. Idempotent — renvoie uniquement les badges débloqués lors de cet appel.',
  })
  @ApiOkResponse({ type: [UserBadgeResponseDto] })
  @ApiStandardResponses({ unauthorized: true })
  evaluate(@CurrentUser() user: AuthUser) {
    return this.badgeEngine.evaluateAndAward(user.id);
  }
}
