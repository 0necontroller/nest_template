import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../common/redis/redis.service';
import { NotificationPriority } from 'src/prisma/generated/prisma/enums';
import { EmailChannel } from './channels/email.channel';

@Injectable()
export class NotificationService {
  constructor(
    @InjectQueue('mail-queue') private mailQueue: Queue,
    private prisma: PrismaService,
    private redisService: RedisService,
    private emailChannel: EmailChannel,
  ) {}

  getMailChannel(): EmailChannel {
    return this.emailChannel;
  }

  /**
   * Triggers a dual-channel notification.
   * Logs the alert in the PostgreSQL database for in-app polling,
   * invalidates the Redis unread count cache, and pushes email task to BullMQ.
   */
  async triggerNotification(
    userId: string,
    toEmail: string,
    eventType: string,
    title: string,
    message: string,
    payload: any,
    priority: NotificationPriority = NotificationPriority.STANDARD,
  ) {
    // 1. Database Write: Log in-app notification
    await this.prisma.notification.create({
      data: {
        userId,
        eventType,
        title,
        message,
        priority,
      },
    });

    // 2. Redis Invalidation: Invalidate notification count cache
    const cacheKey = `user-notifications-count:${userId}`;
    await this.redisService.del(cacheKey);

    // 3. Queue Push: Delegate email delivery to BullMQ mail-queue
    await this.mailQueue.add(eventType, {
      toEmail,
      userId,
      eventType,
      title,
      message,
      payload,
    });
  }
}
