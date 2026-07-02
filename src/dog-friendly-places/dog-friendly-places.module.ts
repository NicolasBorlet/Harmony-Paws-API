import { Module } from '@nestjs/common';
import { DogFriendlyPlacesController } from './dog-friendly-places.controller';
import { DogFriendlyPlacesService } from './dog-friendly-places.service';

@Module({
  controllers: [DogFriendlyPlacesController],
  providers: [DogFriendlyPlacesService],
  exports: [DogFriendlyPlacesService],
})
export class DogFriendlyPlacesModule {}
