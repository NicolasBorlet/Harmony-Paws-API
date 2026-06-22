import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import type { StorageBucket } from './storage.service';
import { StorageService } from './storage.service';
import {
  ApiJwtAuth,
  ApiStandardResponses,
} from '../common/swagger/decorators/api-common.decorator';
import { StorageUrlResponseDto } from '../common/swagger/dto/responses/common.response.dto';

const BUCKET_DESCRIPTION =
  'Bucket MinIO : users | dogs | rides | formations | modules | documents | user-badges';

@ApiTags('storage')
@Controller('storage')
@UseGuards(JwtAuthGuard)
@ApiJwtAuth()
export class StorageController {
  constructor(private readonly storage: StorageService) {}

  @Get(':bucket/:key/url')
  @ApiOperation({
    summary: 'URL de téléchargement présignée',
    description:
      'Génère une URL GET valide **1 heure**. Vérifie que l\'utilisateur a accès au fichier.',
  })
  @ApiParam({ name: 'bucket', description: BUCKET_DESCRIPTION, example: 'dogs' })
  @ApiParam({
    name: 'key',
    description: 'Clé objet (URL-encodée si caractères spéciaux)',
    example: '550e8400-e29b-41d4-a716-446655440000.jpeg',
  })
  @ApiOkResponse({ type: StorageUrlResponseDto })
  @ApiStandardResponses({ unauthorized: true, forbidden: true })
  getDownloadUrl(
    @Param('bucket') bucket: StorageBucket,
    @Param('key') key: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.storage.getDownloadUrl(bucket, decodeURIComponent(key), user);
  }

  @Post(':bucket/:key/upload-url')
  @ApiOperation({
    summary: 'URL d\'upload présignée',
    description:
      'Génère une URL PUT valide **1 heure**. Uploader le fichier directement vers cette URL (Content-Type adapté).',
  })
  @ApiParam({ name: 'bucket', description: BUCKET_DESCRIPTION, example: 'documents' })
  @ApiParam({ name: 'key', description: 'Clé objet cible', example: 'ordonnance-mars.pdf' })
  @ApiOkResponse({ type: StorageUrlResponseDto })
  @ApiStandardResponses({ unauthorized: true, forbidden: true })
  getUploadUrl(
    @Param('bucket') bucket: StorageBucket,
    @Param('key') key: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.storage.getUploadUrl(bucket, decodeURIComponent(key), user);
  }

  @Post('dogs/:dogId/upload-url')
  @ApiOperation({
    summary: 'URL d\'upload photo de chien',
    description: 'Raccourci pour uploader `{dogId}.jpeg` dans le bucket `dogs`.',
  })
  @ApiParam({
    name: 'dogId',
    description: 'UUID du chien',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiOkResponse({ type: StorageUrlResponseDto })
  @ApiStandardResponses({ unauthorized: true, forbidden: true })
  getDogUploadUrl(
    @Param('dogId') dogId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.storage.getUploadUrl('dogs', `${dogId}.jpeg`, user);
  }
}
