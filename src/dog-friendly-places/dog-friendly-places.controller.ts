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
  ApiTags,
} from '@nestjs/swagger';
import {
  AuthUser,
  CurrentUser,
} from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import {
  ApiJwtAuth,
  ApiStandardResponses,
} from '../common/swagger/decorators/api-common.decorator';
import {
  DogFriendlyPlaceResponseDto,
  DogFriendlyPlacesPaginatedResponseDto,
} from '../common/swagger/dto/responses/dog-friendly-place.response.dto';
import {
  AdminListDogFriendlyPlacesQueryDto,
  CreateDogFriendlyPlaceDto,
  DiscoverDogFriendlyPlacesQueryDto,
  ListDogFriendlyPlacesQueryDto,
  UpdateDogFriendlyPlaceDto,
} from './dto/dog-friendly-places.dto';
import { DogFriendlyPlacesService } from './dog-friendly-places.service';

@ApiTags('dog-friendly-places')
@Controller('dog-friendly-places')
export class DogFriendlyPlacesController {
  constructor(
    private readonly dogFriendlyPlacesService: DogFriendlyPlacesService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Lister les lieux dog-friendly (public)',
    description:
      'Pagination et tri optionnel par geohash. Seuls les lieux actifs sont retournés.',
  })
  @ApiOkResponse({ type: DogFriendlyPlacesPaginatedResponseDto })
  @ApiStandardResponses()
  list(@Query() query: ListDogFriendlyPlacesQueryDto) {
    return this.dogFriendlyPlacesService.list(query);
  }

  @Get('discover')
  @ApiOperation({
    summary: 'Découvrir des lieux dog-friendly pour la carte (public)',
    description:
      'Retourne toujours au plus 50 lieux actifs, triés par proximité geohash. Le volume est fixe quel que soit le zoom.',
  })
  @ApiOkResponse({ type: [DogFriendlyPlaceResponseDto] })
  @ApiStandardResponses()
  discover(@Query() query: DiscoverDogFriendlyPlacesQueryDto) {
    return this.dogFriendlyPlacesService.discover(query.geohash ?? '');
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiJwtAuth()
  @ApiOperation({
    summary: 'Lister tous les lieux (admin)',
    description: 'Inclut les lieux en attente de validation.',
  })
  @ApiOkResponse({ type: DogFriendlyPlacesPaginatedResponseDto })
  @ApiStandardResponses({ unauthorized: true, forbidden: true })
  adminList(@Query() query: AdminListDogFriendlyPlacesQueryDto) {
    return this.dogFriendlyPlacesService.adminList(query);
  }

  @Get(':id')
  @ApiOperation({ summary: "Détail d'un lieu dog-friendly (public)" })
  @ApiParam({ name: 'id', description: 'UUID du lieu' })
  @ApiOkResponse({ type: DogFriendlyPlaceResponseDto })
  @ApiStandardResponses({ notFound: true })
  get(@Param('id') id: string) {
    return this.dogFriendlyPlacesService.getById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiJwtAuth()
  @ApiOperation({
    summary: 'Proposer un lieu dog-friendly',
    description:
      'Utilisateur authentifié : statut need_review. Admin : statut active par défaut.',
  })
  @ApiCreatedResponse({ type: DogFriendlyPlaceResponseDto })
  @ApiStandardResponses({ unauthorized: true })
  create(
    @CurrentUser() user: AuthUser,
    @Body() body: CreateDogFriendlyPlaceDto,
  ) {
    return this.dogFriendlyPlacesService.create(user.id, user.role, body);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiJwtAuth()
  @ApiOperation({ summary: 'Modifier un lieu dog-friendly (admin)' })
  @ApiParam({ name: 'id', description: 'UUID du lieu' })
  @ApiOkResponse({ type: DogFriendlyPlaceResponseDto })
  @ApiStandardResponses({ unauthorized: true, forbidden: true, notFound: true })
  update(@Param('id') id: string, @Body() body: UpdateDogFriendlyPlaceDto) {
    return this.dogFriendlyPlacesService.update(id, body);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiJwtAuth()
  @ApiOperation({ summary: 'Supprimer un lieu dog-friendly (admin)' })
  @ApiParam({ name: 'id', description: 'UUID du lieu' })
  @ApiStandardResponses({ unauthorized: true, forbidden: true, notFound: true })
  async remove(@Param('id') id: string) {
    await this.dogFriendlyPlacesService.delete(id);
  }
}
