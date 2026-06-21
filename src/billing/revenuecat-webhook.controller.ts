import {
  Body,
  Controller,
  Headers,
  HttpCode,
  Post,
} from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import type { RevenueCatWebhookPayload } from './revenuecat.types';
import { RevenueCatService } from './revenuecat.service';

@ApiExcludeController()
@Controller('webhooks/revenuecat')
export class RevenueCatWebhookController {
  constructor(private readonly revenueCatService: RevenueCatService) {}

  @Post()
  @SkipThrottle()
  @HttpCode(200)
  async handleWebhook(
    @Headers('authorization') authorization: string | undefined,
    @Body() body: RevenueCatWebhookPayload,
  ) {
    this.revenueCatService.verifyWebhookAuthorization(authorization);
    await this.revenueCatService.handleWebhook(body);
    return { received: true };
  }
}
