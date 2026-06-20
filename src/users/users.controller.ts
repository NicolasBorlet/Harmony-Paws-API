import { Body, Controller, Get, Patch, Query, UseGuards } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
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
import {
  UserProfileResponseDto,
  UserSearchResultDto,
} from '../common/swagger/dto/responses/user.response.dto';
import { UpdateProfileDto } from './dto/users.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiJwtAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

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
      'Mise à jour partielle — seuls les champs fournis sont modifiés.',
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
}
