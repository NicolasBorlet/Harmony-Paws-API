import { Module } from '@nestjs/common';
import { FormationsController } from './formations.controller';
import { FormationsService } from './formations.service';

@Module({
  controllers: [FormationsController],
  providers: [FormationsService],
  exports: [FormationsService],
})
export class FormationsModule {}
