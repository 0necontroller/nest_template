import { Module, Global } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { EmailChannel } from './channels/email.channel';
import { MailProcessor } from './processors/mail.processor';

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const redisUrl = configService.get<string>('redis.url') || 'redis://localhost:6379';
        // Remove username/protocol details if necessary or parse connection options
        return {
          connection: {
            url: redisUrl,
          },
        };
      },
    }),
    BullModule.registerQueue({
      name: 'mail-queue',
    }),
  ],
  controllers: [NotificationController],
  providers: [NotificationService, EmailChannel, MailProcessor],
  exports: [NotificationService, EmailChannel, BullModule],
})
export class NotificationModule {}
