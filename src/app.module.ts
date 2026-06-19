import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { DogsModule } from './dogs/dogs.module';
import { ActivitiesModule } from './activities/activities.module';
import { SocialModule } from './social/social.module';
import { MessagesModule } from './messages/messages.module';
import { HealthModule } from './health/health.module';
import { FormationsModule } from './formations/formations.module';
import { StatsBadgesModule } from './stats-badges/stats-badges.module';
import { StorageModule } from './storage/storage.module';
import { NotificationsModule } from './notifications/notifications.module';
import { WebsocketModule } from './websocket/websocket.module';
import { PrismaModule } from './prisma/prisma.module';
import { SystemModule } from './system/system.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 100,
      },
    ]),
    PrismaModule,
    SystemModule,
    WebsocketModule,
    AuthModule,
    UsersModule,
    DogsModule,
    ActivitiesModule,
    SocialModule,
    MessagesModule,
    HealthModule,
    FormationsModule,
    StatsBadgesModule,
    StorageModule,
    NotificationsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
