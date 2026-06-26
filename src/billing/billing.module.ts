import { Module } from '@nestjs/common';
import { BillingController } from './billing.controller';
import { PremiumService } from './premium.service';
import { RevenueCatWebhookController } from './revenuecat-webhook.controller';
import { RevenueCatService } from './revenuecat.service';

@Module({
  controllers: [BillingController, RevenueCatWebhookController],
  providers: [RevenueCatService, PremiumService],
  exports: [RevenueCatService, PremiumService],
})
export class BillingModule {}
