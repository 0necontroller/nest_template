import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { AppController } from './app.controller';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './common/redis/redis.module';
import { NotificationModule } from './notification/notification.module';
import AppConfig from './common/config/env.config';

@Module({
  imports: [
    PrismaModule,
    RedisModule,
    NotificationModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [AppConfig],
      // Case where we use doetenv vault instead of .env file in prod|staging
      ignoreEnvFile:
        process.env.NODE_ENV === 'production' ||
        process.env.NODE_ENV === 'staging',
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    UserModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
