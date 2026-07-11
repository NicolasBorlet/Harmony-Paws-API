import { Module } from '@nestjs/common';
import { BillingModule } from '../billing/billing.module';
import { StatsBadgesModule } from '../stats-badges/stats-badges.module';
import { StorageModule } from '../storage/storage.module';
import { DogsController } from './dogs.controller';
import { DogsService } from './dogs.service';

@Module({
  imports: [StatsBadgesModule, BillingModule, StorageModule],
  controllers: [DogsController],
  providers: [DogsService],
  exports: [DogsService],
})
export class DogsModule {}
