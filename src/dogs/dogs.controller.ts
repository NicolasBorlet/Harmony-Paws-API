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
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { DogsService } from './dogs.service';
import { CreateDogDto, UpdateDogDto } from './dto/dogs.dto';

@ApiTags('dogs')
@Controller('dogs')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DogsController {
  constructor(private readonly dogsService: DogsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.dogsService.listByOwner(user.id);
  }

  @Get('has-dog')
  hasDog(@CurrentUser() user: AuthUser) {
    return this.dogsService.userHasDog(user.id);
  }

  @Get('breeds')
  breeds() {
    return this.dogsService.listBreeds();
  }

  @Get('behaviors')
  behaviors() {
    return this.dogsService.listBehaviors();
  }

  @Get(':id')
  get(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.dogsService.getById(id, user.id);
  }

  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Body() body: CreateDogDto,
  ) {
    return this.dogsService.create(user.id, body);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
    @Body() body: UpdateDogDto,
  ) {
    return this.dogsService.update(id, user.id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.dogsService.delete(id, user.id);
  }
}
