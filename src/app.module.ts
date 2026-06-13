import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { CacheModule, CacheInterceptor } from '@nestjs/cache-manager';

// Your App Components
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Your Feature Modules
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { LogsModule } from './logs/logs.module';
import { AnnouncementsModule } from './announcements/announcements.module';
import { ElectionsModule } from './elections/elections.module';
import { ResourcesModule } from './resources/resources.module';
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [
    // 0. Global Config
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // 1. RATE LIMITING: Allow a maximum of 20 requests per 60 seconds per IP
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 20,
      },
    ]),

    // 2. CACHING: Store GET responses in memory for 10 seconds
    CacheModule.register({
      isGlobal: true,
      ttl: 10000,
      max: 100,
    }),

    // 3. Your App Modules
    UsersModule,
    AuthModule,
    LogsModule,
    AnnouncementsModule,
    ElectionsModule, // 👈 Just the module! Nest handles the rest.
    ResourcesModule,
    ChatModule,
  ],
  controllers: [AppController], // 👈 Removed ElectionsController
  providers: [
    AppService, // 👈 Removed ElectionsService
    // This enforces Rate Limiting globally across every route
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // This enforces Caching globally across every GET route
    {
      provide: APP_INTERCEPTOR,
      useClass: CacheInterceptor,
    },
  ],
})
export class AppModule {}
