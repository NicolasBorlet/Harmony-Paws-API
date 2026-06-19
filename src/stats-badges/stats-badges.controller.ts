import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { StatsBadgesService } from './stats-badges.service';

@ApiTags('stats-badges')
@Controller('stats-badges')
export class StatsBadgesController {
  constructor(private readonly statsBadgesService: StatsBadgesService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  myStats(@CurrentUser() user: AuthUser) {
    return this.statsBadgesService.getUserStats(user.id);
  }

  @Get('badges/me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  myBadges(@CurrentUser() user: AuthUser) {
    return this.statsBadgesService.listUserBadges(user.id);
  }

  @Get('categories')
  categories() {
    return this.statsBadgesService.listBadgeCategories();
  }
}
