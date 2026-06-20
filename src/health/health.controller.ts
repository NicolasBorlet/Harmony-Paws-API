import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { HealthService } from './health.service';
import {
  CreateHealthDocumentDto,
  CreateHealthReminderDto,
  CreateMeasurementDto,
  CreateVaccinationDto,
  UpdateHealthReminderDto,
} from './dto/health.dto';
import {
  ApiJwtAuth,
  ApiStandardResponses,
} from '../common/swagger/decorators/api-common.decorator';
import {
  DogMeasurementResponseDto,
  HealthDocumentResponseDto,
  HealthReminderResponseDto,
  VaccinationResponseDto,
} from '../common/swagger/dto/responses/health.response.dto';

@ApiTags('health')
@Controller('health')
@UseGuards(JwtAuthGuard)
@ApiJwtAuth()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get('dogs/:dogId/vaccinations')
  @ApiOperation({ summary: 'Lister les vaccinations d\'un chien' })
  @ApiParam({ name: 'dogId', description: 'UUID du chien' })
  @ApiOkResponse({ type: [VaccinationResponseDto] })
  @ApiStandardResponses({ unauthorized: true, forbidden: true })
  vaccinations(@Param('dogId') dogId: string, @CurrentUser() user: AuthUser) {
    return this.healthService.listVaccinations(dogId, user.id);
  }

  @Post('dogs/:dogId/vaccinations')
  @ApiOperation({ summary: 'Ajouter une vaccination' })
  @ApiParam({ name: 'dogId', description: 'UUID du chien' })
  @ApiCreatedResponse({ type: VaccinationResponseDto })
  @ApiStandardResponses({ unauthorized: true, forbidden: true })
  createVaccination(
    @Param('dogId') dogId: string,
    @CurrentUser() user: AuthUser,
    @Body() body: CreateVaccinationDto,
  ) {
    return this.healthService.createVaccination(dogId, user.id, body);
  }

  @Get('dogs/:dogId/measurements')
  @ApiOperation({ summary: 'Lister les mesures corporelles' })
  @ApiParam({ name: 'dogId', description: 'UUID du chien' })
  @ApiOkResponse({ type: [DogMeasurementResponseDto] })
  @ApiStandardResponses({ unauthorized: true, forbidden: true })
  measurements(@Param('dogId') dogId: string, @CurrentUser() user: AuthUser) {
    return this.healthService.listMeasurements(dogId, user.id);
  }

  @Post('dogs/:dogId/measurements')
  @ApiOperation({ summary: 'Enregistrer une mesure (poids / taille)' })
  @ApiParam({ name: 'dogId', description: 'UUID du chien' })
  @ApiCreatedResponse({ type: DogMeasurementResponseDto })
  @ApiStandardResponses({ unauthorized: true, forbidden: true })
  createMeasurement(
    @Param('dogId') dogId: string,
    @CurrentUser() user: AuthUser,
    @Body() body: CreateMeasurementDto,
  ) {
    return this.healthService.createMeasurement(dogId, user.id, body);
  }

  @Get('dogs/:dogId/documents')
  @ApiOperation({ summary: 'Lister les documents vétérinaires' })
  @ApiParam({ name: 'dogId', description: 'UUID du chien' })
  @ApiOkResponse({ type: [HealthDocumentResponseDto] })
  @ApiStandardResponses({ unauthorized: true, forbidden: true })
  documents(@Param('dogId') dogId: string, @CurrentUser() user: AuthUser) {
    return this.healthService.listDocuments(dogId, user.id);
  }

  @Post('dogs/:dogId/documents')
  @ApiOperation({
    summary: 'Créer une entrée document',
    description: 'Enregistre les métadonnées ; uploader le fichier via POST /storage/documents/…/upload-url.',
  })
  @ApiParam({ name: 'dogId', description: 'UUID du chien' })
  @ApiCreatedResponse({ type: HealthDocumentResponseDto })
  @ApiStandardResponses({ unauthorized: true, forbidden: true })
  createDocument(
    @Param('dogId') dogId: string,
    @CurrentUser() user: AuthUser,
    @Body() body: CreateHealthDocumentDto,
  ) {
    return this.healthService.createDocument(dogId, user.id, body);
  }

  @Get('dogs/:dogId/reminders')
  @ApiOperation({ summary: 'Lister les rappels santé' })
  @ApiParam({ name: 'dogId', description: 'UUID du chien' })
  @ApiOkResponse({ type: [HealthReminderResponseDto] })
  @ApiStandardResponses({ unauthorized: true, forbidden: true })
  reminders(@Param('dogId') dogId: string, @CurrentUser() user: AuthUser) {
    return this.healthService.listReminders(dogId, user.id);
  }

  @Post('dogs/:dogId/reminders')
  @ApiOperation({ summary: 'Créer un rappel santé' })
  @ApiParam({ name: 'dogId', description: 'UUID du chien' })
  @ApiCreatedResponse({ type: HealthReminderResponseDto })
  @ApiStandardResponses({ unauthorized: true, forbidden: true })
  createReminder(
    @Param('dogId') dogId: string,
    @CurrentUser() user: AuthUser,
    @Body() body: CreateHealthReminderDto,
  ) {
    return this.healthService.createReminder(dogId, user.id, body);
  }

  @Patch('reminders/:id')
  @ApiOperation({ summary: 'Modifier un rappel' })
  @ApiParam({ name: 'id', description: 'Identifiant du rappel', example: '1' })
  @ApiOkResponse({ type: HealthReminderResponseDto })
  @ApiStandardResponses({ unauthorized: true, forbidden: true, notFound: true })
  updateReminder(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body() body: UpdateHealthReminderDto,
  ) {
    return this.healthService.updateReminder(BigInt(id), user.id, body);
  }

  @Delete('reminders/:id')
  @ApiOperation({ summary: 'Supprimer un rappel' })
  @ApiParam({ name: 'id', description: 'Identifiant du rappel', example: '1' })
  @ApiNoContentResponse({ description: 'Rappel supprimé' })
  @ApiStandardResponses({ unauthorized: true, forbidden: true, notFound: true })
  deleteReminder(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.healthService.deleteReminder(BigInt(id), user.id);
  }
}
