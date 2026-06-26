import { Module } from '@nestjs/common';
import { StatsBadgesController } from './stats-badges.controller';
import { StatsBadgesService } from './stats-badges.service';
import { BadgeEngineService } from './badge-engine.service';
import { DogStatsService } from './dog-stats.service';
import { RewardService } from './reward.service';

@Module({
  controllers: [StatsBadgesController],
  providers: [StatsBadgesService, BadgeEngineService, RewardService, DogStatsService],
  exports: [BadgeEngineService, RewardService, DogStatsService],
})
export class StatsBadgesModule {}
