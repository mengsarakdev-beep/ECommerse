import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface TelegramNotification {
  chatId: number | string;
  message: string;
  parseMode?: 'HTML' | 'Markdown';
}

export interface OrderNotification {
  orderId: number;
  userId: number;
  userChatId?: number | string;
  status: string;
  totalPrice: number;
  itemCount: number;
}

interface TelegramResponse {
  ok: boolean;
  result?: Record<string, unknown>;
  error_code?: number;
  description?: string;
}

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private botToken: string | undefined;
  private readonly telegramApiUrl = 'https://api.telegram.org';

  constructor(private readonly configService: ConfigService) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const token = (this.configService as any).get(
      'TELEGRAM_BOT_TOKEN',
      undefined,
    ) as string | undefined;
    this.botToken = token;
  }

  private normalizeChatId(value: unknown): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    if (typeof value === 'bigint') {
      return Number(value);
    }

    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : null;
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed || !/^[-]?\d+$/.test(trimmed)) {
        return null;
      }
      return Number(trimmed);
    }

    return null;
  }

  private getFallbackChatId(): number | null {
    const fallback = this.configService.get<string | number | bigint | null>(
      'TELEGRAM_ADMIN_CHAT_ID',
      null,
    );
    return this.normalizeChatId(fallback);
  }

  /**
   * Send a raw message to a Telegram chat
   */
  async sendMessage(notification: TelegramNotification): Promise<boolean> {
    try {
      if (!this.botToken) {
        this.logger.warn('Telegram bot token not configured');
        return false;
      }

      const url = `${this.telegramApiUrl}/bot${this.botToken}/sendMessage`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: notification.chatId,
          text: notification.message,
          parse_mode: notification.parseMode || 'HTML',
        }),
      });

      if (!response.ok) {
        const error = (await response.json()) as TelegramResponse;
        this.logger.error(
          `Failed to send Telegram message: ${JSON.stringify(error)}`,
        );
        return false;
      }

      this.logger.debug(
        `Message sent successfully to chat ${notification.chatId}`,
      );
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error sending Telegram message: ${message}`);
      return false;
    }
  }

  /**
   * Send order notification
   */
  async sendOrderNotification(
    orderNotification: OrderNotification,
  ): Promise<boolean> {
    const { orderId, userChatId, status, totalPrice, itemCount } =
      orderNotification;

    const resolvedChatId =
      this.normalizeChatId(userChatId) ?? this.getFallbackChatId();

    if (!resolvedChatId) {
      this.logger.warn(
        `No valid Telegram chat ID found for user ${orderNotification.userId}. Notification skipped.`,
      );
      return false;
    }

    const statusMessages: Record<string, string> = {
      pending: '⏳ Pending',
      confirmed: '✅ Confirmed',
      processing: '📦 Processing',
      shipped: '🚚 Shipped',
      delivered: '🎉 Delivered',
      cancelled: '❌ Cancelled',
    };

    const statusEmoji = statusMessages[status] ?? status;

    const message = `
<b>📋 Order Update</b>

<b>Order ID:</b> #${orderId}
<b>Status:</b> ${statusEmoji}
<b>Items:</b> ${itemCount}
<b>Total Price:</b> $${(totalPrice / 100).toFixed(2)}

Thank you for your order!
    `.trim();

    return this.sendMessage({
      chatId: resolvedChatId,
      message,
      parseMode: 'HTML',
    });
  }

  /**
   * Send new order confirmation
   */
  async sendNewOrderConfirmation(
    orderNotification: OrderNotification,
  ): Promise<boolean> {
    const { orderId, userChatId, itemCount, totalPrice } = orderNotification;

    const resolvedChatId =
      this.normalizeChatId(userChatId) ?? this.getFallbackChatId();

    if (!resolvedChatId) {
      this.logger.warn(
        `No valid Telegram chat ID found for new order ${orderId}. Notification skipped.`,
      );
      return false;
    }

    const message = `
<b>🎉 New Order Placed!</b>

<b>Order ID:</b> #${orderId}
<b>Items:</b> ${itemCount}
<b>Total Price:</b> $${(totalPrice / 100).toFixed(2)}

We'll send you updates as your order is processed.
    `.trim();

    return this.sendMessage({
      chatId: resolvedChatId,
      message,
      parseMode: 'HTML',
    });
  }

  /**
   * Verify bot token by making a test API call
   */
  async verifyBotToken(): Promise<boolean> {
    try {
      if (!this.botToken) {
        this.logger.warn('Telegram bot token not configured');
        return false;
      }

      const url = `${this.telegramApiUrl}/bot${this.botToken}/getMe`;
      const response = await fetch(url);

      if (!response.ok) {
        this.logger.error('Invalid Telegram bot token');
        return false;
      }

      const data = (await response.json()) as TelegramResponse;
      if (
        data.result &&
        typeof data.result === 'object' &&
        'username' in data.result
      ) {
        this.logger.log(
          `Telegram bot verified: ${data.result.username as string}`,
        );
      }
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error verifying bot token: ${message}`);
      return false;
    }
  }
}
