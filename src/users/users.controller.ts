import { Body, Controller, Get, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/users.dto';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getMe(@CurrentUser() user: AuthUser) {
    return this.usersService.getMe(user.id);
  }

  @Patch('me')
  updateMe(
    @CurrentUser() user: AuthUser,
    @Body() body: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(user.id, body);
  }

  @Get('search')
  search(
    @CurrentUser() user: AuthUser,
    @Query('q') query: string,
  ) {
    return this.usersService.searchUsers(query ?? '', user.id);
  }
}
