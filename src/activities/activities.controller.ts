import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Prisma } from '@prisma/client';
import {
  AuthUser,
  CurrentUser,
} from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PremiumGuard } from '../common/guards/premium.guard';
import { ParseBigIntPipe } from '../common/pipes/parse-bigint.pipe';
import {
  ApiJwtAuth,
  ApiStandardResponses,
} from '../common/swagger/decorators/api-common.decorator';
import {
  ActivityInvitationResponseDto,
  ActivityResponseDto,
  ActivityStatsResponseDto,
} from '../common/swagger/dto/responses/activity-social.response.dto';
import { ActivitiesService } from './activities.service';
import {
  CreateActivityDto,
  CreateInvitationDto,
  AcceptInvitationDto,
  JoinActivityDto,
  SaveActivityStatsDto,
  SaveLivePushTokenDto,
  UpdateActivityDto,
  UpdateActivityDogsDto,
  UpdateActivityStatusDto,
} from './dto/activities.dto';

@ApiTags('activities')
@Controller('activities')
@UseGuards(JwtAuthGuard)
@ApiJwtAuth()
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Get()
  @ApiOperation({
    summary: 'Mes balades',
    description: "Activités créées ou auxquelles l'utilisateur participe.",
  })
  @ApiOkResponse({ type: [ActivityResponseDto] })
  @ApiStandardResponses({ unauthorized: true })
  list(@CurrentUser() user: AuthUser) {
    return this.activitiesService.listForUser(user.id);
  }

  @Get('discover')
  @ApiOperation({
    summary: 'Découvrir des balades publiques',
    description:
      'Retourne les balades publiques à venir. Le geohash sert uniquement au tri par proximité (les plus proches en premier). Sans geohash, tri par date.',
  })
  @ApiQuery({
    name: 'geohash',
    required: false,
    example: 'u09tvw',
    description: 'Geohash de référence pour trier par proximité',
  })
  @ApiOkResponse({ type: [ActivityResponseDto] })
  @ApiStandardResponses({ unauthorized: true })
  discover(@Query('geohash') geohash: string) {
    return this.activitiesService.discoverByGeohash(geohash ?? '');
  }

  @Get('invitations')
  @ApiOperation({
    summary: 'Mes invitations reçues',
    description:
      "Invitations en attente ou historiques pour l'utilisateur connecté.",
  })
  @ApiOkResponse({ type: [ActivityInvitationResponseDto] })
  @ApiStandardResponses({ unauthorized: true })
  listInvitations(@CurrentUser() user: AuthUser) {
    return this.activitiesService.listInvitations(user.id);
  }

  @Post('invitations')
  @ApiOperation({
    summary: 'Inviter un utilisateur',
    description: 'Crée une invitation à une activité existante.',
  })
  @ApiCreatedResponse({ type: ActivityInvitationResponseDto })
  @ApiStandardResponses({ unauthorized: true, forbidden: true, notFound: true })
  createInvitation(
    @CurrentUser() user: AuthUser,
    @Body() body: CreateInvitationDto,
  ) {
    return this.activitiesService.createInvitation(
      user.id,
      body.receiverId,
      body.activityId,
    );
  }

  @Post('invitations/:id/accept')
  @ApiOperation({ summary: 'Accepter une invitation' })
  @ApiParam({
    name: 'id',
    description: "Identifiant numérique de l'invitation",
    example: '1',
  })
  @ApiOkResponse({ type: ActivityInvitationResponseDto })
  @ApiStandardResponses({ unauthorized: true, forbidden: true, notFound: true })
  acceptInvitation(
    @Param('id', ParseBigIntPipe) id: bigint,
    @CurrentUser() user: AuthUser,
    @Body() body: AcceptInvitationDto,
  ) {
    return this.activitiesService.acceptInvitation(id, user.id, body.dogIds);
  }

  @Post(':id/join')
  @ApiOperation({
    summary: 'Rejoindre une balade publique',
    description:
      'Rejoint une balade publique en sélectionnant un ou plusieurs chiens.',
  })
  @ApiParam({ name: 'id', description: "UUID de l'activité" })
  @ApiCreatedResponse({ type: ActivityResponseDto })
  @ApiStandardResponses({ unauthorized: true, forbidden: true, notFound: true })
  joinActivity(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body() body: JoinActivityDto,
  ) {
    return this.activitiesService.joinActivity(id, user.id, body.dogIds);
  }

  @Patch(':id/dogs')
  @ApiOperation({
    summary: 'Mettre à jour ses chiens sur une balade',
    description:
      'Remplace les chiens inscrits par le participant connecté (avant le démarrage).',
  })
  @ApiParam({ name: 'id', description: "UUID de l'activité" })
  @ApiOkResponse({ type: ActivityResponseDto })
  @ApiStandardResponses({ unauthorized: true, forbidden: true, notFound: true })
  updateActivityDogs(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body() body: UpdateActivityDogsDto,
  ) {
    return this.activitiesService.updateActivityDogs(id, user.id, body.dogIds);
  }

  @Get(':id')
  @ApiOperation({ summary: "Détail d'une balade" })
  @ApiParam({ name: 'id', description: "UUID de l'activité" })
  @ApiOkResponse({ type: ActivityResponseDto })
  @ApiStandardResponses({ unauthorized: true, forbidden: true, notFound: true })
  get(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.activitiesService.getById(id, user.id);
  }

  @Post()
  @ApiOperation({
    summary: 'Créer une balade',
    description: "L'utilisateur connecté devient le créateur de l'activité.",
  })
  @ApiCreatedResponse({ type: ActivityResponseDto })
  @ApiStandardResponses({ unauthorized: true })
  create(@CurrentUser() user: AuthUser, @Body() body: CreateActivityDto) {
    return this.activitiesService.create(user.id, body);
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Mettre à jour le statut',
    description:
      'Transition de statut (not_started → in_progress → finished, etc.) avec état live optionnel.',
  })
  @ApiParam({ name: 'id', description: "UUID de l'activité" })
  @ApiOkResponse({ type: ActivityResponseDto })
  @ApiStandardResponses({ unauthorized: true, forbidden: true, notFound: true })
  updateStatus(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body() body: UpdateActivityStatusDto,
  ) {
    return this.activitiesService.updateStatus(id, user.id, body.status, {
      startedAt: body.startedAt,
      endedAt: body.endedAt,
      currentState: body.currentState as Prisma.InputJsonValue | undefined,
    });
  }

  @Get(':id/stats')
  @UseGuards(PremiumGuard)
  @ApiOperation({
    summary: 'Statistiques de la balade pour le participant connecté',
    description:
      'Réservé aux utilisateurs premium. Retourne les statistiques enregistrées (distance, durée, trace GPS) pour cette activité.',
  })
  @ApiParam({ name: 'id', description: "UUID de l'activité" })
  @ApiOkResponse({ type: ActivityStatsResponseDto })
  @ApiStandardResponses({ unauthorized: true, forbidden: true, notFound: true })
  getStats(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.activitiesService.getStats(id, user.id);
  }

  @Post(':id/stats')
  @ApiOperation({
    summary: 'Enregistrer les statistiques GPS',
    description:
      'Sauvegarde distance, durée, trace GPS et métriques de fin de balade.',
  })
  @ApiParam({ name: 'id', description: "UUID de l'activité" })
  @ApiOkResponse({ type: ActivityStatsResponseDto })
  @ApiStandardResponses({ unauthorized: true, forbidden: true, notFound: true })
  saveStats(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body() body: SaveActivityStatsDto,
  ) {
    return this.activitiesService.saveStats(id, user.id, {
      ...body,
      routePoints: body.routePoints as Prisma.InputJsonValue | undefined,
    });
  }

  @Post(':id/live-push-token')
  @ApiOperation({
    summary: 'Enregistrer le token push live',
    description:
      "Permet d'envoyer des notifications temps réel pendant la balade.",
  })
  @ApiParam({ name: 'id', description: "UUID de l'activité" })
  @ApiOkResponse({ description: 'Token enregistré' })
  @ApiStandardResponses({ unauthorized: true, forbidden: true, notFound: true })
  saveLivePushToken(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body() body: SaveLivePushTokenDto,
  ) {
    return this.activitiesService.saveLivePushToken(
      id,
      user.id,
      body.pushToken,
    );
  }

  @Post(':id/live-push-token/clear')
  @ApiOperation({
    summary: 'Supprimer le token push live',
    description: "Appelé à la fin de la balade ou en quittant l'écran live.",
  })
  @ApiParam({ name: 'id', description: "UUID de l'activité" })
  @ApiOkResponse({ description: 'Token supprimé' })
  @ApiStandardResponses({ unauthorized: true, forbidden: true, notFound: true })
  clearLivePushToken(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.activitiesService.clearLivePushToken(id, user.id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Mettre à jour une balade',
    description:
      'Seul le créateur peut modifier les informations de la balade.',
  })
  @ApiParam({ name: 'id', description: "UUID de l'activité" })
  @ApiOkResponse({ type: ActivityResponseDto })
  @ApiStandardResponses({ unauthorized: true, forbidden: true, notFound: true })
  update(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body() body: UpdateActivityDto,
  ) {
    return this.activitiesService.update(id, user.id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Supprimer une balade',
    description: 'Seul le créateur peut supprimer la balade.',
  })
  @ApiParam({ name: 'id', description: "UUID de l'activité" })
  @ApiStandardResponses({ unauthorized: true, forbidden: true, notFound: true })
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.activitiesService.delete(id, user.id);
  }
}
