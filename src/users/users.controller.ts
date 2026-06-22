import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import {
  AuthUser,
  CurrentUser,
} from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  ApiJwtAuth,
  ApiStandardResponses,
} from '../common/swagger/decorators/api-common.decorator';
import { DogResponseDto } from '../common/swagger/dto/responses/dog.response.dto';
import {
  UserProfileResponseDto,
  UserPublicProfileResponseDto,
  UserSearchResultDto,
} from '../common/swagger/dto/responses/user.response.dto';
import { DogsService } from '../dogs/dogs.service';
import { UpdateProfileDto } from './dto/users.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiJwtAuth()
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly dogsService: DogsService,
  ) {}

  @Get('me')
  @ApiOperation({
    summary: "Profil de l'utilisateur connecté",
    description:
      'Retourne le profil complet incluant les statistiques agrégées (`user_stats`).',
  })
  @ApiOkResponse({
    description: 'Profil utilisateur',
    type: UserProfileResponseDto,
  })
  @ApiStandardResponses({ unauthorized: true, notFound: true })
  getMe(@CurrentUser() user: AuthUser) {
    return this.usersService.getMe(user.id);
  }

  @Patch('me')
  @ApiOperation({
    summary: 'Mettre à jour le profil',
    description:
      'Mise à jour partielle — profil, token push et préférences (notifications, confidentialité). Seuls les champs fournis sont modifiés.',
  })
  @ApiOkResponse({
    description: 'Profil mis à jour',
    type: UserProfileResponseDto,
  })
  @ApiStandardResponses({ unauthorized: true })
  updateMe(@CurrentUser() user: AuthUser, @Body() body: UpdateProfileDto) {
    return this.usersService.updateProfile(user.id, body);
  }

  @Get('search')
  @ApiOperation({
    summary: 'Rechercher des utilisateurs',
    description:
      "Recherche par email, prénom ou nom (insensible à la casse). Maximum **20 résultats**. L'utilisateur connecté est exclu.",
  })
  @ApiQuery({
    name: 'q',
    required: false,
    description: 'Terme de recherche',
    example: 'marie',
  })
  @ApiOkResponse({
    description: 'Liste de profils correspondants',
    type: [UserSearchResultDto],
  })
  @ApiStandardResponses({ unauthorized: true })
  search(@CurrentUser() user: AuthUser, @Query('q') query: string) {
    return this.usersService.searchUsers(query ?? '', user.id);
  }

  @Get(':id')
  @ApiOperation({
    summary: "Profil public d'un utilisateur",
    description:
      'Retourne les informations visibles par les autres utilisateurs (sans email ni données sensibles).',
  })
  @ApiParam({
    name: 'id',
    description: "UUID de l'utilisateur",
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiOkResponse({
    description: 'Profil public',
    type: UserPublicProfileResponseDto,
  })
  @ApiStandardResponses({ unauthorized: true, notFound: true })
  getPublicProfile(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.usersService.getPublicProfile(id, user.id);
  }

  @Get(':id/dogs')
  @ApiOperation({
    summary: "Chiens d'un utilisateur",
    description:
      'Liste les chiens appartenant à un utilisateur (profil public).',
  })
  @ApiParam({
    name: 'id',
    description: "UUID du propriétaire",
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiOkResponse({ type: [DogResponseDto] })
  @ApiStandardResponses({ unauthorized: true, notFound: true })
  async getUserDogs(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    // Respect the owner's privacy preference before exposing their dogs.
    await this.usersService.assertProfileVisible(id, user.id);
    return this.dogsService.listByOwner(id);
  }
}
