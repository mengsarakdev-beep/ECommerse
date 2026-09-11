import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service.js';
import { HashService } from '../../common/utils/bcrypt/hash.service.js';
import { validatePasswordStrength } from '../../common/utils/password-validation.util.js';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

@Injectable()
export class PasswordResetService {
  private readonly logger = new Logger(PasswordResetService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly hashService: HashService,
  ) {}

  async request(dto: RequestPasswordResetDto) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (user?.password) {
      const token = randomBytes(32).toString('hex');
      await this.prisma.passwordResetToken.deleteMany({
        where: { user_id: user.user_id },
      });
      await this.prisma.passwordResetToken.create({
        data: {
          user_id: user.user_id,
          token_hash: this.hashToken(token),
          expires_at: new Date(Date.now() + RESET_TOKEN_TTL_MS),
        },
      });
      await this.sendResetLink(email, token);
    }

    return {
      message:
        'If an account exists for that email, a reset link has been sent.',
    };
  }

  async reset(dto: ResetPasswordDto) {
    const validation = validatePasswordStrength(dto.password);
    if (!validation.isValid) {
      throw new BadRequestException({
        message: 'Password does not meet security requirements',
        errors: validation.errors,
      });
    }

    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { token_hash: this.hashToken(dto.token) },
    });
    if (
      !resetToken ||
      resetToken.used_at ||
      resetToken.expires_at <= new Date()
    ) {
      throw new BadRequestException('Reset link is invalid or expired');
    }

    const password = await this.hashService.hashPassword(dto.password);
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { user_id: resetToken.user_id },
        data: { password },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used_at: new Date() },
      }),
    ]);

    return { message: 'Password reset successfully' };
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private async sendResetLink(email: string, token: string) {
    const resetUrl = `${process.env.CLIENT_URL ?? 'http://localhost:3000'}/reset-password?token=${token}`;
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.MAIL_FROM;

    if (!apiKey || !from) {
      this.logger.warn(`Password reset link for ${email}: ${resetUrl}`);
      return;
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [email],
        subject: 'Reset your password',
        html: `<p>Reset your password by clicking <a href="${resetUrl}">this link</a>.</p>`,
      }),
    });
    if (!response.ok)
      this.logger.error(
        `Unable to send password reset email: ${response.status}`,
      );
  }
}
