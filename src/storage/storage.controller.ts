import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import type { StorageBucket } from './storage.service';
import { StorageService } from './storage.service';

@ApiTags('storage')
@Controller('storage')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class StorageController {
  constructor(private readonly storage: StorageService) {}

  @Get(':bucket/:key/url')
  getDownloadUrl(
    @Param('bucket') bucket: StorageBucket,
    @Param('key') key: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.storage.getDownloadUrl(bucket, decodeURIComponent(key), user.id);
  }

  @Post(':bucket/:key/upload-url')
  getUploadUrl(
    @Param('bucket') bucket: StorageBucket,
    @Param('key') key: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.storage.getUploadUrl(bucket, decodeURIComponent(key), user.id);
  }

  @Post('dogs/:dogId/upload-url')
  getDogUploadUrl(
    @Param('dogId') dogId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.storage.getUploadUrl('dogs', `${dogId}.jpeg`, user.id);
  }
}
