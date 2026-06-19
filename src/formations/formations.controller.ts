import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { FormationsService } from './formations.service';

@ApiTags('formations')
@Controller('formations')
export class FormationsController {
  constructor(private readonly formationsService: FormationsService) {}

  @Get()
  list() {
    return this.formationsService.listFormations();
  }

  @Get('favorites')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  favorites(@CurrentUser() user: AuthUser) {
    return this.formationsService.listFavorites(user.id);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.formationsService.getFormation(Number(id));
  }

  @Get(':id/purchase-status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  purchaseStatus(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.formationsService.getPurchaseStatus(user.id, Number(id));
  }

  @Post(':id/favorite')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  toggleFavorite(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.formationsService.toggleFavorite(user.id, Number(id));
  }
}
