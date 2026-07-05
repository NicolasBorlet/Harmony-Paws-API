import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { ReportsController } from './reports.controller';
import { ResendService } from './resend.service';

@Module({
  controllers: [ReportsController],
  providers: [ResendService, EmailService],
  exports: [EmailService, ResendService],
})
export class EmailModule {}
