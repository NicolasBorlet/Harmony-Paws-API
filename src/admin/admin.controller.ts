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
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import {
  ApiJwtAuth,
  ApiStandardResponses,
} from '../common/swagger/decorators/api-common.decorator';
import { AdminService } from './admin.service';
import {
  AdminBroadcastEmailDto,
  AdminBroadcastResponseDto,
} from '../email/dto/email.dto';
import { EmailService } from '../email/email.service';
import {
  AdminCreateRowDto,
  AdminPaginatedResponseDto,
  AdminStatsResponseDto,
  AdminTableQueryDto,
} from './dto/admin.dto';

@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@ApiJwtAuth()
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly emailService: EmailService,
  ) {}

  @Post('emails/broadcast')
  @ApiOperation({
    summary: 'Envoi email en batch (admin)',
    description:
      'Diffuse un email personnalisé (sujet + HTML fournis par l\'admin) aux utilisateurs avec notifications email activées. Types : `app_update`, `promo`, `custom`.',
  })
  @ApiCreatedResponse({ type: AdminBroadcastResponseDto })
  @ApiStandardResponses({ unauthorized: true, forbidden: true })
  sendBroadcast(@Body() body: AdminBroadcastEmailDto) {
    return this.emailService.sendAdminBroadcast(body);
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Statistiques du tableau de bord admin',
    description:
      'Compteurs globaux pour utilisateurs, chiens, races et comportements.',
  })
  @ApiOkResponse({ type: AdminStatsResponseDto })
  @ApiStandardResponses({ unauthorized: true, forbidden: true })
  getStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('tables/:name')
  @ApiOperation({
    summary: "Lister les entrées d'une table admin",
    description: 'Pagination et tri pour breeds, behavior, users et dogs.',
  })
  @ApiParam({
    name: 'name',
    enum: ['breeds', 'dogs', 'users', 'behavior'],
  })
  @ApiOkResponse({ type: AdminPaginatedResponseDto })
  @ApiStandardResponses({ unauthorized: true, forbidden: true })
  listTable(@Param('name') name: string, @Query() query: AdminTableQueryDto) {
    this.adminService.assertTableName(name);

    return this.adminService.listTable(
      name,
      query.page,
      query.limit,
      query.sortBy,
      query.direction,
    );
  }

  @Get('tables/:name/:id')
  @ApiOperation({ summary: "Détail d'une entrée admin" })
  @ApiParam({
    name: 'name',
    enum: ['breeds', 'dogs', 'users', 'behavior'],
  })
  @ApiParam({ name: 'id', description: "ID de l'entrée (UUID ou entier)" })
  @ApiStandardResponses({
    unauthorized: true,
    forbidden: true,
    notFound: true,
  })
  getTableRow(@Param('name') name: string, @Param('id') id: string) {
    this.adminService.assertTableName(name);
    return this.adminService.getTableRow(name, id);
  }

  @Post('tables/:name')
  @ApiOperation({ summary: 'Créer une entrée admin' })
  @ApiParam({
    name: 'name',
    enum: ['breeds', 'dogs', 'users', 'behavior'],
  })
  @ApiCreatedResponse({ description: 'Entrée créée' })
  @ApiStandardResponses({ unauthorized: true, forbidden: true })
  createTableRow(@Param('name') name: string, @Body() body: AdminCreateRowDto) {
    this.adminService.assertTableName(name);
    return this.adminService.createTableRow(name, body.data);
  }

  @Patch('tables/:name/:id')
  @ApiOperation({ summary: 'Mettre à jour une entrée admin' })
  @ApiParam({
    name: 'name',
    enum: ['breeds', 'dogs', 'users', 'behavior'],
  })
  @ApiParam({ name: 'id', description: "ID de l'entrée (UUID ou entier)" })
  @ApiOkResponse({ description: 'Entrée mise à jour' })
  @ApiStandardResponses({
    unauthorized: true,
    forbidden: true,
    notFound: true,
  })
  updateTableRow(
    @Param('name') name: string,
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    this.adminService.assertTableName(name);
    return this.adminService.updateTableRow(name, id, body);
  }

  @Delete('tables/:name/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer une entrée admin' })
  @ApiParam({
    name: 'name',
    enum: ['breeds', 'dogs', 'users', 'behavior'],
  })
  @ApiParam({ name: 'id', description: "ID de l'entrée (UUID ou entier)" })
  @ApiStandardResponses({
    unauthorized: true,
    forbidden: true,
    notFound: true,
  })
  async deleteTableRow(@Param('name') name: string, @Param('id') id: string) {
    this.adminService.assertTableName(name);
    await this.adminService.deleteTableRow(name, id);
  }
}
