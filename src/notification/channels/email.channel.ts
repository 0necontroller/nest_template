import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailChannel implements OnModuleInit {
  private transporter: nodemailer.Transporter;
  private defaultFrom: string;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const host = this.configService.get<string>('email.host');
    const port = this.configService.get<number>('email.port') || 587;
    const user = this.configService.get<string>('email.hostUser');
    const pass = this.configService.get<string>('email.hostPassword');
    this.defaultFrom =
      this.configService.get<string>('email.defaultFromEmail') ||
      'noreply@example.com';

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: {
          user,
          pass,
        },
      });
      Logger.log(
        'SMTP Mail Transporter successfully configured',
        'EmailChannel',
      );
    } else {
      Logger.warn(
        'Email SMTP environment variables are missing. Falling back to console logging mailer.',
        'EmailChannel',
      );
    }
  }

  private getBrandedLayout(bodyContent: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; margin: 0; padding: 0; background-color: #f8fafc; }
    .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
    .header { background-color: #0f172a; padding: 25px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 600; letter-spacing: 0.5px; }
    .content { padding: 35px 30px; line-height: 1.6; font-size: 15px; }
    .footer { background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
    .btn { display: inline-block; padding: 12px 24px; background-color: #0284c7; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>NestJS Template</h1>
    </div>
    <div class="content">
      ${bodyContent}
    </div>
    <div class="footer">
      &copy; 2026 NestJS Template. All rights reserved.<br>
      This is an automated message. Please do not reply directly to this inbox.
    </div>
  </div>
</body>
</html>
    `;
  }

  private async sendMail(
    to: string,
    subject: string,
    bodyContent: string,
  ): Promise<boolean> {
    const html = this.getBrandedLayout(bodyContent);

    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: this.defaultFrom,
          to,
          subject,
          html,
        });
        return true;
      } catch (err) {
        Logger.error(
          `Failed to send email to ${to}: ${err.message}`,
          'EmailChannel',
        );
        return false;
      }
    } else {
      Logger.log(
        `[CONSOLE MAILER] TO: ${to} | SUBJECT: ${subject}\nCONTENT:\n${bodyContent}\n----------------------`,
        'EmailChannel',
      );
      return true;
    }
  }

  // --- Authentication & Onboarding ---

  async sendVerificationEmail(to: string, token: string): Promise<boolean> {
    const verifyLink = `http://localhost:3000/auth/verify-email?token=${token}`;
    const content = `
      <h2>Verify Your Email Address</h2>
      <p>Thank you for registering. To activate your account, please click the button below to verify your email address:</p>
      <p style="text-align: center;">
        <a href="${verifyLink}" class="btn">Verify Email Address</a>
      </p>
      <p>This verification link will expire in 24 hours.</p>
    `;
    return this.sendMail(to, 'Verify Your Account', content);
  }

  async sendWelcomeInternalEmail(
    to: string,
    tempPass: string,
    role: string,
  ): Promise<boolean> {
    const content = `
      <h2>Welcome</h2>
      <p>An account has been created for you with the role of <strong>${role}</strong>.</p>
      <p>Your temporary login credentials are:</p>
      <p><strong>Username:</strong> ${to}<br><strong>Temporary Password:</strong> ${tempPass}</p>
      <p style="color: #ef4444; font-weight: 600;">Important: Setting up Multi-Factor Authentication (MFA TOTP) is recommended before accessing system features.</p>
    `;
    return this.sendMail(to, 'Welcome - Account Setup', content);
  }

  async sendPasswordResetEmail(to: string, token: string): Promise<boolean> {
    const resetLink = `http://localhost:3000/auth/password-reset?token=${token}`;
    const content = `
      <h2>Password Reset Request</h2>
      <p>You requested a password reset for your account. Click the button below to configure a new password:</p>
      <p style="text-align: center;">
        <a href="${resetLink}" class="btn">Reset Password</a>
      </p>
      <p>If you did not make this request, you can safely ignore this email. This link will expire in 1 hour.</p>
    `;
    return this.sendMail(to, 'Reset Your Password', content);
  }

  async sendSecurityAlertEmail(to: string, reason: string): Promise<boolean> {
    const content = `
      <h2>Security Alert Notification</h2>
      <p>A security alert has been triggered for your account:</p>
      <p style="background-color: #fee2e2; border-left: 4px solid #ef4444; padding: 12px; font-weight: 600;">
        ${reason}
      </p>
      <p>If this action was not initiated by you, please reset your password immediately and contact support.</p>
    `;
    return this.sendMail(to, 'Security Alert: Account Activity', content);
  }
}
