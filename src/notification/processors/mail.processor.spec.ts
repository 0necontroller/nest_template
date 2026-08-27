import { Test, TestingModule } from '@nestjs/testing';
import { MailProcessor } from './mail.processor';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailChannel } from '../channels/email.channel';
import { Job } from 'bullmq';

describe('MailProcessor', () => {
  let processor: MailProcessor;
  let prisma: any;
  let emailChannel: any;

  beforeEach(async () => {
    const mockPrismaService = {
      notificationPreference: {
        findUnique: jest.fn(),
      },
    };

    const mockEmailChannel = {
      sendVerificationEmail: jest.fn(),
      sendPasswordResetEmail: jest.fn(),
      sendWelcomeInternalEmail: jest.fn(),
      sendSecurityAlertEmail: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailProcessor,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: EmailChannel, useValue: mockEmailChannel },
      ],
    }).compile();

    processor = module.get<MailProcessor>(MailProcessor);
    prisma = module.get(PrismaService);
    emailChannel = module.get(EmailChannel);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('process', () => {
    it('should send critical emails directly and bypass preference checks', async () => {
      const mockJob = {
        id: 'job-1',
        data: {
          toEmail: 'test@example.com',
          userId: 'user-123',
          eventType: 'auth.verify-email',
          title: 'Verify Email',
          message: 'Verify',
          payload: { token: 'token-abc' },
        },
      } as unknown as Job;

      emailChannel.sendVerificationEmail.mockResolvedValue(true);

      const result = await processor.process(mockJob);

      expect(result).toEqual({ status: 'completed' });
      expect(emailChannel.sendVerificationEmail).toHaveBeenCalledWith('test@example.com', 'token-abc');
      expect(prisma.notificationPreference.findUnique).not.toHaveBeenCalled();
    });

    it('should respect generic opt-out preferences and skip non-critical emails', async () => {
      const mockJob = {
        id: 'job-2',
        data: {
          toEmail: 'test@example.com',
          userId: 'user-123',
          eventType: 'notification.general',
          title: 'General Update',
          message: 'Hello',
          payload: {},
        },
      } as unknown as Job;

      prisma.notificationPreference.findUnique.mockResolvedValue({
        userId: 'user-123',
        general: 'IN_APP',
      });

      const result = await processor.process(mockJob);

      expect(result).toEqual({ status: 'skipped', reason: 'preference_opt_out' });
      expect(prisma.notificationPreference.findUnique).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
      });
    });

    it('should send non-critical emails if user preference allows it', async () => {
      const mockJob = {
        id: 'job-3',
        data: {
          toEmail: 'test@example.com',
          userId: 'user-123',
          eventType: 'auth.password-reset',
          title: 'Reset',
          message: 'Reset',
          payload: { token: 'tok' },
        },
      } as unknown as Job;

      emailChannel.sendPasswordResetEmail.mockResolvedValue(true);

      const result = await processor.process(mockJob);

      expect(result).toEqual({ status: 'completed' });
      expect(emailChannel.sendPasswordResetEmail).toHaveBeenCalledWith('test@example.com', 'tok');
    });
  });
});
