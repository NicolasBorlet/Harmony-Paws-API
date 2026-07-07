import { Module } from '@nestjs/common';
import { EmailModule } from '../email/email.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [EmailModule, NotificationsModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
