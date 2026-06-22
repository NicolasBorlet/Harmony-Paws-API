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
  UseGuards,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { RidesService } from './rides.service';
import { CreateRideDto, UpdateRideDto } from './dto/rides.dto';
import {
  ApiJwtAuth,
  ApiStandardResponses,
} from '../common/swagger/decorators/api-common.decorator';
import { RideResponseDto } from '../common/swagger/dto/responses/ride.response.dto';

@ApiTags('rides')
@Controller('rides')
@UseGuards(JwtAuthGuard)
@ApiJwtAuth()
export class RidesController {
  constructor(private readonly ridesService: RidesService) {}

  @Get()
  @ApiOperation({
    summary: 'Lister les rides (templates)',
    description: 'Tous les utilisateurs connectés peuvent consulter les templates de balades.',
  })
  @ApiOkResponse({ type: [RideResponseDto] })
  @ApiStandardResponses({ unauthorized: true })
  list() {
    return this.ridesService.list();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Détail d\'une ride (template)',
    description: 'Récupère un template avec ses étapes pour pré-remplir l\'écran de création d\'activité.',
  })
  @ApiParam({ name: 'id', description: 'UUID de la ride' })
  @ApiOkResponse({ type: RideResponseDto })
  @ApiStandardResponses({ unauthorized: true, notFound: true })
  get(@Param('id') id: string) {
    return this.ridesService.getById(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({
    summary: 'Créer une ride (template)',
    description: 'Réservé aux administrateurs.',
  })
  @ApiCreatedResponse({ type: RideResponseDto })
  @ApiStandardResponses({ unauthorized: true, forbidden: true })
  create(@CurrentUser() user: AuthUser, @Body() body: CreateRideDto) {
    return this.ridesService.create(user.id, body);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({
    summary: 'Mettre à jour une ride (template)',
    description: 'Réservé aux administrateurs.',
  })
  @ApiParam({ name: 'id', description: 'UUID de la ride' })
  @ApiOkResponse({ type: RideResponseDto })
  @ApiStandardResponses({ unauthorized: true, forbidden: true, notFound: true })
  update(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body() body: UpdateRideDto,
  ) {
    return this.ridesService.update(id, user.id, body);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Supprimer une ride (template)',
    description: 'Réservé aux administrateurs.',
  })
  @ApiParam({ name: 'id', description: 'UUID de la ride' })
  @ApiStandardResponses({ unauthorized: true, forbidden: true, notFound: true })
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.ridesService.delete(id, user.id);
  }
}
