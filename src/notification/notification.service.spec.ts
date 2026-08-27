import { Test, TestingModule } from '@nestjs/testing';
import { NotificationService } from './notification.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../common/redis/redis.service';
import { EmailChannel } from './channels/email.channel';
import { getQueueToken } from '@nestjs/bullmq';
import { NotificationPriority } from 'src/prisma/generated/prisma/enums';

describe('NotificationService', () => {
  let service: NotificationService;
  let prisma: any;
  let redis: any;
  let mailQueue: any;
  let emailChannel: any;

  beforeEach(async () => {
    const mockPrismaService = {
      notification: {
        create: jest.fn(),
      },
    };

    const mockRedisService = {
      del: jest.fn(),
    };

    const mockQueue = {
      add: jest.fn(),
    };

    const mockEmailChannel = {};

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: RedisService, useValue: mockRedisService },
        { provide: getQueueToken('mail-queue'), useValue: mockQueue },
        { provide: EmailChannel, useValue: mockEmailChannel },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
    prisma = module.get(PrismaService);
    redis = module.get(RedisService);
    mailQueue = module.get(getQueueToken('mail-queue'));
    emailChannel = module.get(EmailChannel);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('triggerNotification', () => {
    it('should write notification to DB, delete cache, and enqueue mail job', async () => {
      prisma.notification.create.mockResolvedValue({});
      redis.del.mockResolvedValue(undefined);
      mailQueue.add.mockResolvedValue({});

      await service.triggerNotification(
        'user-123',
        'test@example.com',
        'auth.verify-email',
        'Verify Email',
        'Please verify',
        { token: 'tok123' },
        NotificationPriority.STANDARD,
      );

      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-123',
          eventType: 'auth.verify-email',
          title: 'Verify Email',
          message: 'Please verify',
          priority: NotificationPriority.STANDARD,
        },
      });

      expect(redis.del).toHaveBeenCalledWith('user-notifications-count:user-123');

      expect(mailQueue.add).toHaveBeenCalledWith('auth.verify-email', {
        toEmail: 'test@example.com',
        userId: 'user-123',
        eventType: 'auth.verify-email',
        title: 'Verify Email',
        message: 'Please verify',
        payload: { token: 'tok123' },
      });
    });
  });
});
