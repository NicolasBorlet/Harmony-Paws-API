import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { StatsBadgesService } from './stats-badges.service';
import {
  ApiJwtAuth,
  ApiStandardResponses,
} from '../common/swagger/decorators/api-common.decorator';
import {
  BadgeCategoryResponseDto,
  UserBadgeResponseDto,
  UserStatsResponseDto,
} from '../common/swagger/dto/responses/formation-stats.response.dto';

@ApiTags('stats-badges')
@Controller('stats-badges')
export class StatsBadgesController {
  constructor(private readonly statsBadgesService: StatsBadgesService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiJwtAuth()
  @ApiOperation({
    summary: 'Mes statistiques agrégées',
    description: 'Distance totale, streaks, activités mensuelles, etc.',
  })
  @ApiOkResponse({
    description: 'Statistiques utilisateur (null si jamais initialisées)',
    type: UserStatsResponseDto,
  })
  @ApiStandardResponses({ unauthorized: true })
  myStats(@CurrentUser() user: AuthUser) {
    return this.statsBadgesService.getUserStats(user.id);
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
    description: 'Endpoint public — liste les catégories actives et leurs badges.',
  })
  @ApiOkResponse({ type: [BadgeCategoryResponseDto] })
  @ApiStandardResponses()
  categories() {
    return this.statsBadgesService.listBadgeCategories();
  }
}
