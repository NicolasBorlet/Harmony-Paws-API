import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { PremiumService } from '../billing/premium.service';
import { DogStatsService } from '../stats-badges/dog-stats.service';
import { DogsService } from './dogs.service';
import { CreateDogDto, DiscoverDogsQueryDto, UpdateDogDto } from './dto/dogs.dto';
import {
  ApiJwtAuth,
  ApiStandardResponses,
} from '../common/swagger/decorators/api-common.decorator';
import { HasDogResponseDto } from '../common/swagger/dto/responses/common.response.dto';
import { ApiErrorResponseDto } from '../common/swagger/dto/api-error.dto';
import {
  BehaviorResponseDto,
  BreedResponseDto,
  CreateDogCompleteResponseDto,
  DiscoverDogsResponseDto,
  DogResponseDto,
  DogStatsResponseDto,
} from '../common/swagger/dto/responses/dog.response.dto';

@ApiTags('dogs')
@Controller('dogs')
@UseGuards(JwtAuthGuard)
@ApiJwtAuth()
export class DogsController {
  constructor(
    private readonly dogsService: DogsService,
    private readonly dogStatsService: DogStatsService,
    private readonly premiumService: PremiumService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Lister mes chiens',
    description: 'Retourne tous les chiens appartenant à l\'utilisateur connecté, avec race et comportements.',
  })
  @ApiOkResponse({ type: [DogResponseDto] })
  @ApiStandardResponses({ unauthorized: true })
  list(@CurrentUser() user: AuthUser) {
    return this.dogsService.listByOwner(user.id);
  }

  @Get('discover')
  @ApiOperation({
    summary: 'Découvrir des chiens',
    description:
      'Liste paginée de tous les chiens (hors les vôtres), avec filtres optionnels.',
  })
  @ApiOkResponse({ type: DiscoverDogsResponseDto })
  @ApiStandardResponses({ unauthorized: true })
  discover(
    @CurrentUser() user: AuthUser,
    @Query() query: DiscoverDogsQueryDto,
  ) {
    return this.dogsService.discover(user.id, query);
  }

  @Get('has-dog')
  @ApiOperation({
    summary: 'Vérifier si l\'utilisateur a un chien',
    description: 'Utile pour l\'onboarding et les écrans conditionnels.',
  })
  @ApiOkResponse({ type: HasDogResponseDto })
  @ApiStandardResponses({ unauthorized: true })
  hasDog(@CurrentUser() user: AuthUser) {
    return this.dogsService.userHasDog(user.id);
  }

  @Post('complete')
  @ApiOperation({
    summary: 'Créer un chien (étape 1/2)',
    description:
      'Crée le chien et retourne une URL d\'upload pour la photo. ' +
      'La création n\'est effective qu\'après POST /dogs/:id/finalize une fois la photo uploadée.',
  })
  @ApiCreatedResponse({ type: CreateDogCompleteResponseDto })
  @ApiStandardResponses({ unauthorized: true })
  createComplete(
    @CurrentUser() user: AuthUser,
    @Body() body: CreateDogDto,
  ) {
    return this.dogsService.createComplete(user.id, user, body);
  }

  @Post(':id/finalize')
  @ApiOperation({
    summary: 'Finaliser la création d\'un chien (étape 2/2)',
    description:
      'Vérifie que la photo a bien été uploadée. ' +
      'Si la photo est absente, le chien est supprimé et une erreur 422 est retournée.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID du chien',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiOkResponse({ type: DogResponseDto })
  @ApiResponse({
    status: 422,
    description: 'Photo absente — le chien a été supprimé',
    type: ApiErrorResponseDto,
  })
  @ApiStandardResponses({
    unauthorized: true,
    forbidden: true,
    notFound: true,
  })
  finalizeCreation(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.dogsService.finalizeCreation(id, user.id);
  }

  @Get('breeds')
  @ApiOperation({
    summary: 'Catalogue des races',
    description: 'Liste de référence pour le champ `breedId` à la création d\'un chien.',
  })
  @ApiOkResponse({ type: [BreedResponseDto] })
  @ApiStandardResponses({ unauthorized: true })
  breeds() {
    return this.dogsService.listBreeds();
  }

  @Get('behaviors')
  @ApiOperation({
    summary: 'Catalogue des comportements',
    description: 'Liste de référence pour le champ `behaviorIds` à la création ou mise à jour d\'un chien.',
  })
  @ApiOkResponse({ type: [BehaviorResponseDto] })
  @ApiStandardResponses({ unauthorized: true })
  behaviors() {
    return this.dogsService.listBehaviors();
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Statistiques de tous mes chiens',
    description:
      'Retourne les stats par chien avec gating premium (basique pour le chien principal, complet en premium).',
  })
  @ApiOkResponse({ type: [DogStatsResponseDto] })
  @ApiStandardResponses({ unauthorized: true })
  async listStats(@CurrentUser() user: AuthUser) {
    const isPremium = await this.premiumService.isPremium(user.id);
    return this.dogStatsService.listStatsForOwner(user.id, isPremium);
  }

  @Get(':id/stats')
  @ApiOperation({
    summary: 'Statistiques d\'un chien',
    description:
      'Stats basiques gratuites pour le chien principal ; premium requis pour les autres chiens et les métriques détaillées.',
  })
  @ApiParam({
    name: 'id',
    description: 'UUID du chien',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiOkResponse({ type: DogStatsResponseDto })
  @ApiStandardResponses({ unauthorized: true, forbidden: true, notFound: true })
  async getStats(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    const isPremium = await this.premiumService.isPremium(user.id);
    return this.dogStatsService.getStatsForDog(user.id, id, isPremium);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'un chien' })
  @ApiParam({
    name: 'id',
    description: 'UUID du chien',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiOkResponse({ type: DogResponseDto })
  @ApiStandardResponses({ unauthorized: true, forbidden: true, notFound: true })
  get(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.dogsService.getById(id, user.id);
  }

  @Post()
  @ApiOperation({
    summary: 'Créer un chien',
    description: 'Associe un nouveau chien au compte connecté.',
  })
  @ApiCreatedResponse({ type: DogResponseDto })
  @ApiStandardResponses({ unauthorized: true })
  create(
    @CurrentUser() user: AuthUser,
    @Body() body: CreateDogDto,
  ) {
    return this.dogsService.create(user.id, body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour un chien' })
  @ApiParam({ name: 'id', description: 'UUID du chien' })
  @ApiOkResponse({ type: DogResponseDto })
  @ApiStandardResponses({ unauthorized: true, forbidden: true, notFound: true })
  update(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body() body: UpdateDogDto,
  ) {
    return this.dogsService.update(id, user.id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un chien' })
  @ApiParam({ name: 'id', description: 'UUID du chien' })
  @ApiNoContentResponse({ description: 'Chien supprimé' })
  @ApiStandardResponses({ unauthorized: true, forbidden: true, notFound: true })
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.dogsService.delete(id, user.id);
  }
}
