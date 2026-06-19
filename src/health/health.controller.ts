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
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { DocumentType } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { HealthService } from './health.service';

@ApiTags('health')
@Controller('health')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get('dogs/:dogId/vaccinations')
  vaccinations(@Param('dogId') dogId: string, @CurrentUser() user: AuthUser) {
    return this.healthService.listVaccinations(dogId, user.id);
  }

  @Post('dogs/:dogId/vaccinations')
  createVaccination(
    @Param('dogId') dogId: string,
    @CurrentUser() user: AuthUser,
    @Body() body: { name: string; date: string },
  ) {
    return this.healthService.createVaccination(dogId, user.id, body);
  }

  @Get('dogs/:dogId/measurements')
  measurements(@Param('dogId') dogId: string, @CurrentUser() user: AuthUser) {
    return this.healthService.listMeasurements(dogId, user.id);
  }

  @Post('dogs/:dogId/measurements')
  createMeasurement(
    @Param('dogId') dogId: string,
    @CurrentUser() user: AuthUser,
    @Body() body: { date: string; height?: number; weight?: number },
  ) {
    return this.healthService.createMeasurement(dogId, user.id, body);
  }

  @Get('dogs/:dogId/documents')
  documents(@Param('dogId') dogId: string, @CurrentUser() user: AuthUser) {
    return this.healthService.listDocuments(dogId, user.id);
  }

  @Post('dogs/:dogId/documents')
  createDocument(
    @Param('dogId') dogId: string,
    @CurrentUser() user: AuthUser,
    @Body()
    body: {
      fileName?: string;
      documentType: DocumentType;
      place?: string;
      reason?: string;
    },
  ) {
    return this.healthService.createDocument(dogId, user.id, body);
  }

  @Get('dogs/:dogId/reminders')
  reminders(@Param('dogId') dogId: string, @CurrentUser() user: AuthUser) {
    return this.healthService.listReminders(dogId, user.id);
  }

  @Post('dogs/:dogId/reminders')
  createReminder(
    @Param('dogId') dogId: string,
    @CurrentUser() user: AuthUser,
    @Body() body: { title: string; date: string; notes?: string },
  ) {
    return this.healthService.createReminder(dogId, user.id, body);
  }

  @Patch('reminders/:id')
  updateReminder(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body() body: Partial<{ title: string; date: string; notes: string }>,
  ) {
    return this.healthService.updateReminder(BigInt(id), user.id, body);
  }

  @Delete('reminders/:id')
  deleteReminder(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.healthService.deleteReminder(BigInt(id), user.id);
  }
}
