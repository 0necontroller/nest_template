import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailChannel } from '../channels/email.channel';

@Processor('mail-queue')
export class MailProcessor extends WorkerHost {
  private readonly logger = new Logger(MailProcessor.name);

  constructor(
    private prisma: PrismaService,
    private emailChannel: EmailChannel,
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { toEmail, userId, eventType, title, message, payload } = job.data;
    this.logger.log(`Processing mail queue job ${job.id} for event: ${eventType}`);

    const criticalEvents = [
      'auth.verify-email',
      'auth.welcome-internal',
      'auth.password-reset',
      'auth.security-alert',
    ];

    const isCritical = criticalEvents.includes(eventType);

    if (!isCritical && userId) {
      const preferences = await this.prisma.notificationPreference.findUnique({
        where: { userId },
      });

      if (preferences) {
        // Generic handling: respect `IN_APP` preference as opt-out for non-critical events.
        // For template simplicity, non-critical events check `general` preference if available,
        // otherwise fall back to allowing email.
        const channelPref = (preferences as any).general ?? 'BOTH';

        if (channelPref === 'IN_APP' || channelPref === 'NONE') {
          this.logger.log(
            `Skipping email dispatch for user ${userId} on non-critical event ${eventType} due to preference: ${channelPref}`,
          );
          return { status: 'skipped', reason: 'preference_opt_out' };
        }
      }
    }

    let success = false;
    try {
      switch (eventType) {
        case 'auth.verify-email':
          success = await this.emailChannel.sendVerificationEmail(toEmail, payload.token);
          break;
        case 'auth.welcome-internal':
          success = await this.emailChannel.sendWelcomeInternalEmail(toEmail, payload.tempPass, payload.role);
          break;
        case 'auth.password-reset':
          success = await this.emailChannel.sendPasswordResetEmail(toEmail, payload.token);
          break;
        case 'auth.security-alert':
          success = await this.emailChannel.sendSecurityAlertEmail(toEmail, payload.reason);
          break;
        default:
          this.logger.warn(`Unknown email event type: ${eventType}`);
          break;
      }
    } catch (err) {
      this.logger.error(`Error executing mail processor send: ${err.message}`);
    }

    return { status: success ? 'completed' : 'failed' };
  }
}
