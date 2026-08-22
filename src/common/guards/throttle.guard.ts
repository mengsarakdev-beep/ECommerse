import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class CustomThrottleGuard extends ThrottlerGuard {
  protected throttleErrorMessage =
    'Too many login attempts. Please try again later.';

  // eslint-disable-next-line @typescript-eslint/require-await
  protected async getTracker(req: Record<string, any>): Promise<string> {
    // Use email from body or IP address as the tracking key
    const connection = req.connection as { remoteAddress?: string } | undefined;
    const body = req.body as Record<string, unknown> | undefined;
    const email =
      typeof body?.['email'] === 'string' ? body['email'] : undefined;
    const ip = typeof req.ip === 'string' ? req.ip : undefined;

    return email || ip || connection?.remoteAddress || '';
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  protected async throwThrottlingException(): Promise<void> {
    throw new HttpException(
      this.throttleErrorMessage,
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}
