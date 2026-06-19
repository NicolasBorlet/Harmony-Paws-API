import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Prisma } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { ActivitiesService } from './activities.service';
import {
  CreateActivityDto,
  CreateInvitationDto,
  SaveActivityStatsDto,
  SaveLivePushTokenDto,
  UpdateActivityStatusDto,
} from './dto/activities.dto';

@ApiTags('activities')
@Controller('activities')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.activitiesService.listForUser(user.id);
  }

  @Get('discover')
  discover(@Query('geohash') geohash: string) {
    return this.activitiesService.discoverByGeohash(geohash ?? '');
  }

  @Get('invitations')
  listInvitations(@CurrentUser() user: AuthUser) {
    return this.activitiesService.listInvitations(user.id);
  }

  @Post('invitations')
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
  acceptInvitation(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.activitiesService.acceptInvitation(BigInt(id), user.id);
  }

  @Get(':id')
  get(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.activitiesService.getById(id, user.id);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() body: CreateActivityDto) {
    return this.activitiesService.create(user.id, body);
  }

  @Patch(':id/status')
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

  @Post(':id/stats')
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
  clearLivePushToken(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.activitiesService.clearLivePushToken(id, user.id);
  }
}
