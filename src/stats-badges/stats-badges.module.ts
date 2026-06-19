import { Module } from '@nestjs/common';
import { StatsBadgesController } from './stats-badges.controller';
import { StatsBadgesService } from './stats-badges.service';

@Module({
  controllers: [StatsBadgesController],
  providers: [StatsBadgesService],
})
export class StatsBadgesModule {}
