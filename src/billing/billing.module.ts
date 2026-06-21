import { Module } from '@nestjs/common';
import { BillingController } from './billing.controller';
import { RevenueCatWebhookController } from './revenuecat-webhook.controller';
import { RevenueCatService } from './revenuecat.service';

@Module({
  controllers: [BillingController, RevenueCatWebhookController],
  providers: [RevenueCatService],
  exports: [RevenueCatService],
})
export class BillingModule {}
