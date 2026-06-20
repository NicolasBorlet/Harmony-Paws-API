import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { FormationsService } from './formations.service';
import {
  ApiJwtAuth,
  ApiStandardResponses,
} from '../common/swagger/decorators/api-common.decorator';
import {
  PurchaseStatusResponseDto,
  ToggleFavoriteResponseDto,
} from '../common/swagger/dto/responses/common.response.dto';
import {
  FormationFavoriteResponseDto,
  FormationResponseDto,
} from '../common/swagger/dto/responses/formation-stats.response.dto';

@ApiTags('formations')
@Controller('formations')
export class FormationsController {
  constructor(private readonly formationsService: FormationsService) {}

  @Get()
  @ApiOperation({
    summary: 'Catalogue des formations',
    description: 'Liste publique avec modules, leçons et avis.',
  })
  @ApiOkResponse({ type: [FormationResponseDto] })
  @ApiStandardResponses()
  list() {
    return this.formationsService.listFormations();
  }

  @Get('favorites')
  @UseGuards(JwtAuthGuard)
  @ApiJwtAuth()
  @ApiOperation({ summary: 'Mes formations favorites' })
  @ApiOkResponse({ type: [FormationFavoriteResponseDto] })
  @ApiStandardResponses({ unauthorized: true })
  favorites(@CurrentUser() user: AuthUser) {
    return this.formationsService.listFavorites(user.id);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Détail d\'une formation',
    description: 'Inclut modules, leçons, étapes et avis utilisateurs.',
  })
  @ApiParam({ name: 'id', description: 'Identifiant numérique de la formation', example: '1' })
  @ApiOkResponse({ type: FormationResponseDto })
  @ApiStandardResponses({ notFound: true })
  get(@Param('id') id: string) {
    return this.formationsService.getFormation(Number(id));
  }

  @Get(':id/purchase-status')
  @UseGuards(JwtAuthGuard)
  @ApiJwtAuth()
  @ApiOperation({
    summary: 'Statut d\'achat',
    description: 'Intégration RevenueCat prévue — retourne `purchased: false` pour l\'instant.',
  })
  @ApiParam({ name: 'id', description: 'Identifiant de la formation', example: '1' })
  @ApiOkResponse({ type: PurchaseStatusResponseDto })
  @ApiStandardResponses({ unauthorized: true })
  purchaseStatus(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.formationsService.getPurchaseStatus(user.id, Number(id));
  }

  @Post(':id/favorite')
  @UseGuards(JwtAuthGuard)
  @ApiJwtAuth()
  @ApiOperation({
    summary: 'Basculer le favori',
    description: 'Ajoute ou retire la formation des favoris (toggle).',
  })
  @ApiParam({ name: 'id', description: 'Identifiant de la formation', example: '1' })
  @ApiOkResponse({ type: ToggleFavoriteResponseDto })
  @ApiStandardResponses({ unauthorized: true, notFound: true })
  toggleFavorite(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.formationsService.toggleFavorite(user.id, Number(id));
  }
}
